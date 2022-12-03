// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyA5HczjKd6_xCuvd8x3_eosPQQ8zKZKmb8",
    authDomain: "webrtc-demo-32481.firebaseapp.com",
    projectId: "webrtc-demo-32481",
    storageBucket: "webrtc-demo-32481.appspot.com",
    messagingSenderId: "219695504094",
    appId: "1:219695504094:web:156d6ec29c860d37c0c04f",
    measurementId: "G-HNNQFQ3MPT"
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseDb = getFirestore(firebaseApp);

export default firebaseApp;
