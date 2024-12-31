import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase-config";
import { doc, setDoc } from "firebase/firestore";

const SignIn = ({ setCurrentView }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignUpClick = async () => {
    try {
      // Registrar el usuario en Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Crear un documento básico para el usuario en Firestore
      const userDocRef = doc(db, "usuarios", user.uid);
      await setDoc(userDocRef, { datosCompletos: false });

      // Redirigir al formulario de datos
      setCurrentView("formularioDatos");
    } catch (error) {
      console.error("Error al registrarse:", error.message);
      alert("Error al registrarse: " + error.message);
    }
  };

  return (
    <div>
      <h2>Registrarse</h2>
      <input
        type="email"
        placeholder="Correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleSignUpClick}>Registrarse</button>
      <button onClick={() => setCurrentView("menu")}>
      Regresar
      </button>
      
    </div>
  );
};

export default SignIn;
