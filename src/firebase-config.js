
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyC6kJK8fu7BrkUZU-Gex-HHheiC294NlNI",
  authDomain: "prueba1ptarturo.firebaseapp.com",
  projectId: "prueba1ptarturo",
  storageBucket: "prueba1ptarturo.firebasestorage.app",
  messagingSenderId: "196908100661",
  appId: "1:196908100661:web:98810e1287e3d4663b957c",
  measurementId: "G-Q6YD7WECQS"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };