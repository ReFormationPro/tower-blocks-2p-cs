/**
 * Adapted from
 * https://github.com/webrtc/FirebaseRTC/blob/solution/public/app.js
 */
import { firebaseDb } from "./firebase.js";
import {
    doc,
    addDoc,
    onSnapshot,
    setDoc,
    getDoc,
    collection,
    deleteDoc,
    updateDoc,
    getDocs
} from "firebase/firestore";
import configuration from "./webrtcConfig.json";

export default class GoOnline {
    private peerConnection: RTCPeerConnection | null = null;
    private roomId: string | null = null;
    private dataChannel: RTCDataChannel | null = null;
    private static instance: GoOnline | null = null;

    private constructor() {}

    static getInstance(): GoOnline {
        if (!GoOnline.instance) {
            GoOnline.instance = new GoOnline();
        }
        return GoOnline.instance;
    }

    getDataChannel(): RTCDataChannel | null {
        return this.dataChannel;
    }

    getRoomId(): string | null {
        return this.roomId;
    }

    /**
     * @returns string Room Id of the newly created room
     */
    async createRoom(): Promise<string> {
        const roomsCol = collection(firebaseDb, "rooms");
        const roomRef = doc(roomsCol);

        console.log(
            "Create PeerConnection with configuration: ",
            configuration
        );
        this.peerConnection = new RTCPeerConnection(configuration);
        this.dataChannel = this.peerConnection.createDataChannel("data");
        this.dataChannel.onmessage = function (msg: MessageEvent<any>) {
            console.log("Received:", msg.data);
        };

        this.registerPeerConnectionListeners();

        const callerCandidatesCollection = collection(
            roomRef,
            "callerCandidates"
        );
        const calleeCandidatesCollection = collection(
            roomRef,
            "calleeCandidates"
        );

        this.peerConnection.addEventListener("icecandidate", (event) => {
            if (!event.candidate) {
                console.log("Got final candidate!");
                return;
            }
            console.log("Got candidate: ", event.candidate);
            addDoc(callerCandidatesCollection, event.candidate.toJSON());
        });
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        console.log("Created offer:", offer);

        const roomWithOffer = {
            offer: {
                type: offer.type,
                sdp: offer.sdp
            }
        };
        await setDoc(roomRef, roomWithOffer);
        this.roomId = roomRef.id;
        console.log(`New room created with SDP offer. Room ID: ${roomRef.id}`);

        onSnapshot(roomRef, async (snapshot) => {
            const data = snapshot.data();
            if (
                !this.peerConnection!.currentRemoteDescription &&
                data &&
                data.answer
            ) {
                console.log("Got remote description: ", data.answer);
                const rtcSessionDescription = new RTCSessionDescription(
                    data.answer
                );
                await this.peerConnection!.setRemoteDescription(
                    rtcSessionDescription
                );
            }
        });

        onSnapshot(calleeCandidatesCollection, (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === "added") {
                    let data = change.doc.data();
                    console.log(
                        `Got new remote ICE candidate: ${JSON.stringify(data)}`
                    );
                    await this.peerConnection!.addIceCandidate(
                        new RTCIceCandidate(data)
                    );
                }
            });
        });
        return roomRef.id;
    }

    /**
     * @param roomId Id of the room to join
     * @returns true if room exists
     */
    async joinRoomById(roomId: string): Promise<boolean> {
        const roomRef = doc(firebaseDb, "rooms", roomId);
        const roomSnapshot = await getDoc(roomRef);
        console.log("Got room:", roomSnapshot.exists());

        if (roomSnapshot.exists()) {
            console.log(
                "Create PeerConnection with configuration: ",
                configuration
            );
            this.roomId = roomId;
            this.peerConnection = new RTCPeerConnection(configuration);
            this.peerConnection.addEventListener("datachannel", (event) => {
                this.dataChannel = event.channel;
                this.dataChannel.onmessage = function (msg: MessageEvent<any>) {
                    console.log("Received:", msg.data);
                };
            });
            this.registerPeerConnectionListeners();

            const calleeCandidatesCollection = collection(
                roomRef,
                "calleeCandidates"
            );
            this.peerConnection.addEventListener("icecandidate", (event) => {
                if (!event.candidate) {
                    console.log("Got final candidate!");
                    return;
                }
                console.log("Got candidate: ", event.candidate);
                addDoc(calleeCandidatesCollection, event.candidate.toJSON());
            });

            const offer = roomSnapshot.data().offer;
            console.log("Got offer:", offer);
            await this.peerConnection.setRemoteDescription(
                new RTCSessionDescription(offer)
            );
            const answer = await this.peerConnection.createAnswer();
            console.log("Created answer:", answer);
            await this.peerConnection.setLocalDescription(answer);

            const roomWithAnswer = {
                answer: {
                    type: answer.type,
                    sdp: answer.sdp
                }
            };
            await updateDoc(roomRef, roomWithAnswer);

            const callerCandidatesCollection = collection(
                roomRef,
                "callerCandidates"
            );
            onSnapshot(callerCandidatesCollection, (snapshot) => {
                snapshot.docChanges().forEach(async (change) => {
                    if (change.type === "added") {
                        let data = change.doc.data();
                        console.log(
                            `Got new remote ICE candidate: ${JSON.stringify(
                                data
                            )}`
                        );
                        await this.peerConnection!.addIceCandidate(
                            new RTCIceCandidate(data)
                        );
                    }
                });
            });
            return true;
        } else {
            return false;
        }
    }

    /**
     * Closes the connection and erases the room
     */
    async hangUp() {
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        // Delete room on hangup
        if (this.roomId) {
            const roomsCollection = collection(firebaseDb, "rooms");
            const roomRef = doc(roomsCollection, this.roomId);
            // Erase all subcollections:
            // 1- Erase callee candidates
            const calleeCandidatesCollection = collection(
                roomRef,
                "calleeCandidates"
            );

            const calleeCandidates = await getDocs(calleeCandidatesCollection);
            calleeCandidates.forEach(async (candidate) => {
                await deleteDoc(candidate.ref);
            });
            // 2- Erase caller collections
            const callerCandidatesCollection = collection(
                roomRef,
                "callerCandidates"
            );
            const callerCandidates = await getDocs(callerCandidatesCollection);
            callerCandidates.forEach(async (candidate) => {
                await deleteDoc(candidate.ref);
            });
            // Erase the doc
            await deleteDoc(roomRef);
        }
    }

    registerPeerConnectionListeners() {
        this.peerConnection!.addEventListener("icegatheringstatechange", () => {
            console.log(
                `ICE gathering state changed: ${
                    this.peerConnection!.iceGatheringState
                }`
            );
        });

        this.peerConnection!.addEventListener("connectionstatechange", () => {
            console.log(
                `Connection state change: ${
                    this.peerConnection!.connectionState
                }`
            );
        });

        this.peerConnection!.addEventListener("signalingstatechange", () => {
            console.log(
                `Signaling state change: ${this.peerConnection!.signalingState}`
            );
        });

        this.peerConnection!.addEventListener(
            "iceconnectionstatechange ",
            () => {
                console.log(
                    `ICE connection state change: ${
                        this.peerConnection!.iceConnectionState
                    }`
                );
            }
        );
    }
}
