import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase-config";

const Login = ({ setCurrentView }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLoginClick = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error al iniciar sesión:", error.message);
      alert("Error al iniciar sesión: " + error.message);
    }
  };

  return (
    <div>
      <h2>Iniciar Sesión</h2>
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
      <button onClick={handleLoginClick}>Iniciar Sesión</button>
      <button onClick={() => setCurrentView("menu")}>Regresar</button> 
    </div>
  );
};

export default Login;
