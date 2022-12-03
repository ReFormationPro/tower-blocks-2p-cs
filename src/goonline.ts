/**
 * Adapted from
 * https://github.com/webrtc/FirebaseRTC/blob/solution/public/app.js
 */
import { firebaseDb } from "./firebase.js";
import * as fs from "firebase/firestore";
import configuration from "./webrtcConfig.json";

let peerConnection: RTCPeerConnection | null = null;
let roomId: string | null = null;
let dataChannel: RTCDataChannel | null = null;

function registerPeerConnectionListeners() {
    peerConnection!.addEventListener("icegatheringstatechange", () => {
        console.log(
            `ICE gathering state changed: ${peerConnection!.iceGatheringState}`
        );
    });

    peerConnection!.addEventListener("connectionstatechange", () => {
        console.log(
            `Connection state change: ${peerConnection!.connectionState}`
        );
    });

    peerConnection!.addEventListener("signalingstatechange", () => {
        console.log(
            `Signaling state change: ${peerConnection!.signalingState}`
        );
    });

    peerConnection!.addEventListener("iceconnectionstatechange ", () => {
        console.log(
            `ICE connection state change: ${peerConnection!.iceConnectionState}`
        );
    });
}

/**
 * @returns string Room Id of the newly created room
 */
export async function createRoom(): Promise<string> {
    //const roomRef = await firebaseDb.collection("rooms").doc();
    const roomsCol = fs.collection(firebaseDb, "rooms");
    const roomRef = fs.doc(roomsCol);

    console.log("Create PeerConnection with configuration: ", configuration);
    peerConnection = new RTCPeerConnection(configuration);
    dataChannel = peerConnection.createDataChannel("data");
    dataChannel.onmessage = function (msg: MessageEvent<any>) {
        console.log("Received:", msg.data);
    };
    (window as any).dataChannel = dataChannel;

    registerPeerConnectionListeners();

    // Code for collecting ICE candidates below
    const callerCandidatesCollection = fs.collection(
        roomRef,
        "callerCandidates"
    );
    const calleeCandidatesCollection = fs.collection(
        roomRef,
        "calleeCandidates"
    );

    peerConnection.addEventListener("icecandidate", (event) => {
        if (!event.candidate) {
            console.log("Got final candidate!");
            return;
        }
        console.log("Got candidate: ", event.candidate);
        fs.addDoc(callerCandidatesCollection, event.candidate.toJSON());
    });
    // Code for collecting ICE candidates above

    // Code for creating a room below
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    console.log("Created offer:", offer);

    const roomWithOffer = {
        offer: {
            type: offer.type,
            sdp: offer.sdp
        }
    };
    await fs.setDoc(roomRef, roomWithOffer);
    roomId = roomRef.id;
    console.log(`New room created with SDP offer. Room ID: ${roomRef.id}`);
    // Code for creating a room above

    // Listening for remote session description below
    fs.onSnapshot(roomRef, async (snapshot) => {
        const data = snapshot.data();
        if (!peerConnection!.currentRemoteDescription && data && data.answer) {
            console.log("Got remote description: ", data.answer);
            const rtcSessionDescription = new RTCSessionDescription(
                data.answer
            );
            await peerConnection!.setRemoteDescription(rtcSessionDescription);
        }
    });
    // Listening for remote session description above

    // Listen for remote ICE candidates below
    fs.onSnapshot(calleeCandidatesCollection, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
            if (change.type === "added") {
                let data = change.doc.data();
                console.log(
                    `Got new remote ICE candidate: ${JSON.stringify(data)}`
                );
                await peerConnection!.addIceCandidate(
                    new RTCIceCandidate(data)
                );
            }
        });
    });
    // Listen for remote ICE candidates above
    return roomRef.id;
}

/**
 * @param roomId Id of the room to join
 */
export async function joinRoomById(roomId: string) {
    const roomRef = fs.doc(firebaseDb, "rooms", roomId);
    const roomSnapshot = await fs.getDoc(roomRef);
    console.log("Got room:", roomSnapshot.exists);

    if (roomSnapshot.exists()) {
        console.log(
            "Create PeerConnection with configuration: ",
            configuration
        );
        peerConnection = new RTCPeerConnection(configuration);
        peerConnection.addEventListener("datachannel", (event) => {
            dataChannel = event.channel;
            (window as any).dataChannel = dataChannel;
            dataChannel.onmessage = function (msg: MessageEvent<any>) {
                console.log("Received:", msg.data);
            };
        });
        registerPeerConnectionListeners();

        // Code for collecting ICE candidates below
        const calleeCandidatesCollection = fs.collection(
            firebaseDb,
            "rooms",
            roomId.toString(),
            "calleeCandidates"
        );
        peerConnection.addEventListener("icecandidate", (event) => {
            if (!event.candidate) {
                console.log("Got final candidate!");
                return;
            }
            console.log("Got candidate: ", event.candidate);
            fs.addDoc(calleeCandidatesCollection, event.candidate.toJSON());
        });
        // Code for collecting ICE candidates above

        // Code for creating SDP answer below
        const offer = roomSnapshot.data().offer;
        console.log("Got offer:", offer);
        await peerConnection.setRemoteDescription(
            new RTCSessionDescription(offer)
        );
        const answer = await peerConnection.createAnswer();
        console.log("Created answer:", answer);
        await peerConnection.setLocalDescription(answer);

        const roomWithAnswer = {
            answer: {
                type: answer.type,
                sdp: answer.sdp
            }
        };
        await fs.updateDoc(roomRef, roomWithAnswer);
        // Code for creating SDP answer above

        // Listening for remote ICE candidates below
        const callerCandidatesCollection = fs.collection(
            roomRef,
            "callerCandidates"
        );
        fs.onSnapshot(callerCandidatesCollection, (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === "added") {
                    let data = change.doc.data();
                    console.log(
                        `Got new remote ICE candidate: ${JSON.stringify(data)}`
                    );
                    await peerConnection!.addIceCandidate(
                        new RTCIceCandidate(data)
                    );
                }
            });
        });
        // Listening for remote ICE candidates above
    }
}

/**
 * Closes the connection and erases the room
 */
export async function hangUp() {
    if (peerConnection) {
        peerConnection.close();
    }

    // Delete room on hangup
    if (roomId) {
        const roomsCollection = fs.collection(firebaseDb, "rooms");
        const roomRef = fs.doc(roomsCollection, roomId);
        const calleeCandidatesCollection = fs.collection(
            roomRef,
            "calleeCandidates"
        );
        const callerCandidatesCollection = fs.collection(
            roomRef,
            "callerCandidates"
        );
        const calleeCandidates = await fs.getDocs(calleeCandidatesCollection);
        calleeCandidates.forEach(async (candidate) => {
            await fs.deleteDoc(candidate.ref);
        });
        const callerCandidates = await fs.getDocs(callerCandidatesCollection);
        callerCandidates.forEach(async (candidate) => {
            await fs.deleteDoc(candidate.ref);
        });
        await fs.deleteDoc(roomRef);
    }
}
