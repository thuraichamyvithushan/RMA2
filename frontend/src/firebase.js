import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
     apiKey: "AIzaSyCXbWgc0nVffFiMRABPhYHNroH0PQbTZXA",
  authDomain: "rma-ho-df2dd.firebaseapp.com",
  projectId: "rma-ho-df2dd",
  storageBucket: "rma-ho-df2dd.firebasestorage.app",
  messagingSenderId: "703943668444",
  appId: "1:703943668444:web:e7a82e32c3e17d7f8f7a19",
  measurementId: "G-1HH7HCJTQL"
};

let app;
let auth;
let db;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase initialized successfully");
} catch (error) {
    console.error("Firebase initialization failed:", error);
}

export { auth, db };
export default app;
