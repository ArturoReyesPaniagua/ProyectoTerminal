import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase-config";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Form } from "react-bootstrap";

const InicioSesion = () => {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const manejarInicioSesion = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, correo, contrasena);
      const user = userCredential.user;

      // Inicializar documento de usuario si no existe
      const userRef = doc(db, "Usuarios", user.uid);
      await setDoc(userRef, { email: correo }, { merge: true });

      alert("Inicio de sesión exitoso");
      navigate("/dashboard"); // Redirigir al Dashboard tras inicio exitoso
    } catch (err) {
      setError("Error: " + err.message);
    }
  };

  return (
    <Form onSubmit={manejarInicioSesion}>
      <h2 className="text-center" style={{ color: "#32cd32" }}>Iniciar Sesión</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form.Group className="mb-3">
        <Form.Label>Correo Electrónico</Form.Label>
        <Form.Control
          type="email"
          placeholder="Ingresa tu correo"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Contraseña</Form.Label>
        <Form.Control
          type="password"
          placeholder="Ingresa tu contraseña"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
        />
      </Form.Group>
      <Button variant="success" type="submit" className="w-100">
        Iniciar Sesión
      </Button>
    </Form>
  );
};

export default InicioSesion;
