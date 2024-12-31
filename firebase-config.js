import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
const firebaseConfig = {
  apiKey: "AIzaSyC6kJK8fu7BrkUZU-Gex-HHheiC294NlNI",
  authDomain: "prueba1ptarturo.firebaseapp.com",
  projectId: "prueba1ptarturo",
  storageBucket: "prueba1ptarturo.appspot.com",
  messagingSenderId: "196908100661",
  appId: "1:196908100661:web:98810e1287e3d4663b957c",
  measurementId: "G-Q6YD7WECQS",
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta la instancia de autenticación y Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);