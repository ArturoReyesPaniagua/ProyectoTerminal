import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase-config";
import { doc, setDoc } from "firebase/firestore";
import { Alert, Button, Form, InputGroup } from "react-bootstrap";

const Registrarse = () => {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [error, setError] = useState("");

  const manejarRegistro = async (e) => {
    e.preventDefault();
    setError("");

    if (contrasena !== confirmarContrasena) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, correo, contrasena);
      const user = userCredential.user;

      // Crear documento del usuario con subcolecciones iniciales
      const userRef = doc(db, "Usuarios", user.uid);
      await setDoc(userRef, { email: correo }, { merge: true });

      alert("Usuario registrado exitosamente");
      setCorreo("");
      setContrasena("");
      setConfirmarContrasena("");
    } catch (err) {
      setError("Error: " + err.message);
    }
  };

  return (
    <Form onSubmit={manejarRegistro}>
      <h2 className="text-center" style={{ color: "#32cd32" }}>Registrarse</h2>
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
        <InputGroup>
          <Form.Control
            type={mostrarContrasena ? "text" : "password"}
            placeholder="Crea una contraseña"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
          />
          <Button
            variant="outline-secondary"
            onClick={() => setMostrarContrasena(!mostrarContrasena)}
          >
            {mostrarContrasena ? "Ocultar" : "Mostrar"}
          </Button>
        </InputGroup>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Confirmar Contraseña</Form.Label>
        <InputGroup>
          <Form.Control
            type={mostrarContrasena ? "text" : "password"}
            placeholder="Confirma tu contraseña"
            value={confirmarContrasena}
            onChange={(e) => setConfirmarContrasena(e.target.value)}
          />
          <Button
            variant="outline-secondary"
            onClick={() => setMostrarContrasena(!mostrarContrasena)}
          >
            {mostrarContrasena ? "Ocultar" : "Mostrar"}
          </Button>
        </InputGroup>
      </Form.Group>

      <Button variant="success" type="submit" className="w-100">
        Registrarse
      </Button>
    </Form>
  );
};

export default Registrarse;
