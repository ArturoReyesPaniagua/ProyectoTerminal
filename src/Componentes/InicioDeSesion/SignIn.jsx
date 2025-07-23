import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase-config";
import { doc, setDoc } from "firebase/firestore";
//import "./login.css";

// Hook  para registro
const useSignIn = (setCurrentView, setError) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { email, password, confirmPassword } = formData;

    if (!email || !password || !confirmPassword) {
      setError("Todos los campos son requeridos");
      return false;
    }

    if (!email.includes("@")) {
      setError("Ingresa un correo electrónico válido");
      return false;
    }

    if (password.length < 6 ) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return false;
    }

    // Validación mayúsculas y minúsculas
    if (!/(?=.*[a-z])(?=.*[A-Z])/.test(password)) {
      setError("La contraseña debe tener al menos una mayúscula y una minúscula");
      return false;
    }

    return true;
  };
  // Manejo del registro
  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      const user = userCredential.user;

      // Crear documento básico en Firestore
      await setDoc(doc(db, "usuarios", user.uid), {
        email: user.email,
        datosCompletos: false,
        fechaRegistro: new Date().toISOString(),
      });

      // Redirigir al formulario de datos
      setCurrentView("formularioDatos");
      
    } catch (error) {
      console.error("Error al registrarse:", error);
      
      // Manejo de errores según el código de error
      const errorMessages = {
        "auth/email-already-in-use": "Ya existe una cuenta con este correo electrónico",
        "auth/invalid-email": "Correo electrónico inválido",
        "auth/operation-not-allowed": "El registro está deshabilitado",
        "auth/weak-password": "La contraseña es muy débil",
        "auth/network-request-failed": "Error de conexión. Verifica tu internet",
      };
      
      const message = errorMessages[error.code] || "Error al crear la cuenta. Intenta de nuevo";
      setError(message);
    } finally {
      setLoading(false);
    }
  };
  
  // Manejo de Enter para enviar el formulario
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleRegister();
    }
  };

  return {
    formData,
    updateField,
    handleRegister,
    handleKeyPress,
    loading,
  };
};

// Componente para mostrar requisitos de contraseña
const PasswordRequirements = ({ password }) => {
  const requirements = [
    { text: "Al menos 6 caracteres", valid: password.length >= 6 },
    { text: "Una mayúscula", valid: /[A-Z]/.test(password) },
    { text: "Una minúscula", valid: /[a-z]/.test(password) },
  ];

  if (!password) return null;

  return (
    <div className="password-requirements">
      <span>Requisitos de contraseña:</span>
      <ul>
        {requirements.map((req, index) => (
          <li key={index} className={req.valid ? "valid" : "invalid"}>
            {req.valid ? "✓" : "✗"} {req.text}
          </li>
        ))}
      </ul>
    </div>
  );
};

const SignIn = ({ setCurrentView, error, setError }) => {
  const {
    formData,
    updateField,
    handleRegister,
    handleKeyPress,
    loading,
  } = useSignIn(setCurrentView, setError);

  const isPasswordMatch = formData.password && formData.confirmPassword && 
                         formData.password === formData.confirmPassword;

  return (
    <div className="login-container">
      <div className="logo">
        <span>ControlFit</span>
      </div>
      
      <div className="form-box">
        <h2>Crear Cuenta</h2>
        
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
            placeholder="Crea una contraseña segura"
            disabled={loading}
            autoComplete="new-password"
          />
          <PasswordRequirements password={formData.password} />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirmar contraseña</label>
          <input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => updateField("confirmPassword", e.target.value)}
            onKeyPress={handleKeyPress}
            className={`login-input ${
              formData.confirmPassword && 
              (isPasswordMatch ? "valid" : "invalid")
            }`}
            placeholder="Confirma tu contraseña"
            disabled={loading}
            autoComplete="new-password"
          />
          {formData.confirmPassword && (
            <div className={`password-match ${isPasswordMatch ? "valid" : "invalid"}`}>
              {isPasswordMatch ? "✓ Las contraseñas coinciden" : "✗ Las contraseñas no coinciden"}
            </div>
          )}
        </div>

        <div className="login-buttons">
          <button 
            onClick={handleRegister} 
            className="login-button"
            disabled={loading || !isPasswordMatch}
          >
            {loading ? "Creando cuenta..." : "Registrarse"}
          </button>
          <button 
            onClick={() => setCurrentView("login")} 
            className="login-button secondary"
            disabled={loading}
          >
            Ya tengo cuenta
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

export default SignIn;