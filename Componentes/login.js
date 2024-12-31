import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-config';
import { doc, getDoc } from 'firebase/firestore';
import './login.css';
import Logo from '../Imagenes/logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Verificar si el usuario tiene los datos completos
      const userDocRef = doc(db, 'usuarios', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists() || !userDoc.data().datosCompletos) {
        // Si los datos no están completos, redirigir al formulario de datos
        navigate('/formulario-datos');
      } else {
        // Si los datos están completos, redirigir al menú principal
        navigate('/menuprincipal');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error.message);
      alert('Error al iniciar sesión: ' + error.message);
    }
  };

  return (
    <div className="login-container">
      <div className="logo">
        <img src={Logo} alt="Logo" />
      </div>
      <div className="form-box">
        <h2>Iniciar Sesión</h2>
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
        <div className="login-buttons">
          <button onClick={handleLogin} className="login-button">
            Iniciar Sesión
          </button>
          <button onClick={() => navigate('/register')} className="login-button secondary">
            Registrarse
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
