import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase-config";
//import "./login.css";

// Hook para manejo de login
const useLogin = (setError) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.email) {
      setError("El correo electrónico es requerido");
      return false;
    }
    if (!formData.password) {
      setError("La contraseña es requerida");
      return false;
    }
    if (!formData.email.includes("@")) {
      setError("Ingresa un correo electrónico válido");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);
      
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      // El App.js se encarga de la redirección basada en el estado del usuario
      
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      
      // Manejo de errores segun el código de error
      const errorMessages = {
        "auth/user-not-found": "No existe una cuenta con este correo electrónico",
        "auth/wrong-password": "Contraseña incorrecta",
        "auth/too-many-requests": "Demasiados intentos fallidos. Intenta más tarde",
        "auth/user-disabled": "Esta cuenta ha sido deshabilitada",
        "auth/invalid-email": "Correo electrónico inválido",
        "auth/network-request-failed": "Error de conexión. Verifica tu internet",
      };
      
      const message = errorMessages[error.code] || "Error al iniciar sesión. Intenta de nuevo";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Manejo de Enter para enviar el formulario
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return {
    formData,
    updateField,
    handleLogin,
    handleKeyPress,
    loading,
  };
};

// Componente de Login
const Login = ({ setCurrentView, error, setError }) => {
  const {
    formData,
    updateField,
    handleLogin,
    handleKeyPress,
    loading,
  } = useLogin(setCurrentView, setError);

  return (

    //formato del login
    <div className="login-container">
      <div className="logo">
        <span>ControlFit</span>
      </div>
      
      <div className="form-box">
        <h2>Iniciar Sesión</h2>
        
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)} className="close-error">✕</button>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
            onKeyPress={handleKeyPress}
            className="login-input"
            placeholder="ejemplo@correo.com"
            disabled={loading}
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => updateField("password", e.target.value)}
            onKeyPress={handleKeyPress}
            className="login-input"
            placeholder="Tu contraseña"
            disabled={loading}
            autoComplete="current-password"
          />
        </div>

        <div className="login-buttons">
          <button 
            onClick={handleLogin} 
            className="login-button"
            disabled={loading}
          >
            {loading ? "Iniciando..." : "Iniciar Sesión"}
          </button>
          <button 
            onClick={() => setCurrentView("signIn")} 
            className="login-button secondary"
            disabled={loading}
          >
            Registrarse
          </button>
        </div>

        <div className="login-footer">
          <button 
            onClick={() => setCurrentView("menu")} 
            className="link-button"
            disabled={loading}
          >
            ← Volver al menú
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;