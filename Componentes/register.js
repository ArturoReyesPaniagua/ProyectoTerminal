import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase-config'; // Importa la referencia a Firestore
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore'; // Importa funciones de Firestore
import './login.css';
import Logo from '../Imagenes/logo.png';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const register = async () => {
    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Crear un documento para el nuevo usuario en Firestore con datos básicos
      await setDoc(doc(db, 'usuarios', user.uid), {
        email: user.email,
        datosCompletos: false // Indicador de que faltan completar datos
      });

      alert('Usuario registrado con éxito');
      navigate('/formulario-datos'); // Redirige al formulario de datos después del registro
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="login-container">
      <div className="logo">
        <img src={Logo} alt="Logo" />
      </div>
      <div className="form-box">
        <h2>Registro</h2>
        <div className="form-group">
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirmar contraseña</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="login-input"
          />
        </div>
        <div className="login-buttons">
          <button onClick={register} className="login-button">
            Registrarse
          </button>
          <button onClick={() => navigate('/')} className="login-button secondary">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
