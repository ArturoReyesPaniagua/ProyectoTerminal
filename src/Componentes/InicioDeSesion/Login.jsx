import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase-config";

const Login = ({ setCurrentView }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLoginClick = async () => {
    if (!email || !password) {
      setError("Por favor, completa todos los campos");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // El redirect se maneja automáticamente en App.js por onAuthStateChanged
    } catch (error) {
      console.error("Error al iniciar sesión:", error.message);
      
      // Mensajes de error más amigables
      let errorMessage = "Error al iniciar sesión";
      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "No existe una cuenta con este correo electrónico";
          break;
        case "auth/wrong-password":
          errorMessage = "Contraseña incorrecta";
          break;
        case "auth/invalid-email":
          errorMessage = "Formato de correo electrónico inválido";
          break;
        case "auth/too-many-requests":
          errorMessage = "Demasiados intentos fallidos. Intenta más tarde";
          break;
        default:
          errorMessage = "Error de conexión. Revisa tu internet";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLoginClick();
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#f8f9fa",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px",
      fontFamily: "Arial, sans-serif"
    }}>
      {/* Header con logo */}
      <div style={{
        textAlign: "center",
        marginBottom: "30px"
      }}>
        <div style={{
          backgroundColor: "#1f4f63",
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          margin: "0 auto 20px auto",
          boxShadow: "0 4px 15px rgba(31, 79, 99, 0.3)"
        }}>
          <span style={{ fontSize: "32px", color: "white" }}>🔐</span>
        </div>
        <h2 style={{
          margin: "0",
          color: "#1f4f63",
          fontSize: "2rem",
          fontWeight: "bold"
        }}>
          Iniciar Sesión
        </h2>
        <p style={{
          margin: "10px 0 0 0",
          color: "#6c757d",
          fontSize: "1rem"
        }}>
          Accede a tu cuenta de ControlFIt
        </p>
      </div>

      {/* Formulario de login */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "20px",
        padding: "40px",
        boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
        width: "100%",
        maxWidth: "400px"
      }}>
        {/* Campo de email */}
        <div style={{ marginBottom: "25px" }}>
          <label style={{
            display: "block",
            marginBottom: "8px",
            fontWeight: "bold",
            color: "#495057",
            fontSize: "14px"
          }}>
            📧 Correo Electrónico
          </label>
          <input
            type="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(""); // Limpiar error al escribir
            }}
            onKeyPress={handleKeyPress}
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px",
              border: error ? "2px solid #dc3545" : "2px solid #dee2e6",
              borderRadius: "10px",
              fontSize: "16px",
              transition: "border-color 0.3s ease",
              backgroundColor: loading ? "#f8f9fa" : "white",
              cursor: loading ? "not-allowed" : "text"
            }}
            onFocus={(e) => !error && (e.target.style.borderColor = "#007bff")}
            onBlur={(e) => !error && (e.target.style.borderColor = "#dee2e6")}
          />
        </div>

        {/* Campo de contraseña */}
        <div style={{ marginBottom: "25px" }}>
          <label style={{
            display: "block",
            marginBottom: "8px",
            fontWeight: "bold",
            color: "#495057",
            fontSize: "14px"
          }}>
            🔒 Contraseña
          </label>
          <input
            type="password"
            placeholder="Tu contraseña"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(""); // Limpiar error al escribir
            }}
            onKeyPress={handleKeyPress}
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px",
              border: error ? "2px solid #dc3545" : "2px solid #dee2e6",
              borderRadius: "10px",
              fontSize: "16px",
              transition: "border-color 0.3s ease",
              backgroundColor: loading ? "#f8f9fa" : "white",
              cursor: loading ? "not-allowed" : "text"
            }}
            onFocus={(e) => !error && (e.target.style.borderColor = "#007bff")}
            onBlur={(e) => !error && (e.target.style.borderColor = "#dee2e6")}
          />
        </div>

        {/* Mensaje de error */}
        {error && (
          <div style={{
            backgroundColor: "#f8d7da",
            border: "1px solid #f5c6cb",
            color: "#721c24",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "14px",
            textAlign: "center"
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Botón de login */}
        <button
          onClick={handleLoginClick}
          disabled={loading || !email || !password}
          style={{
            width: "100%",
            padding: "15px",
            backgroundColor: loading || !email || !password ? "#6c757d" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "25px",
            fontSize: "18px",
            fontWeight: "bold",
            cursor: loading || !email || !password ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            marginBottom: "20px",
            boxShadow: loading || !email || !password ? "none" : "0 4px 15px rgba(0, 123, 255, 0.3)"
          }}
          onMouseOver={(e) => {
            if (!loading && email && password) {
              e.target.style.backgroundColor = "#0056b3";
              e.target.style.transform = "translateY(-2px)";
            }
          }}
          onMouseOut={(e) => {
            if (!loading && email && password) {
              e.target.style.backgroundColor = "#007bff";
              e.target.style.transform = "translateY(0)";
            }
          }}
        >
          {loading ? "⏳ Iniciando sesión..." : "🚀 Iniciar Sesión"}
        </button>

        {/* Divider */}
        <div style={{
          textAlign: "center",
          margin: "20px 0",
          position: "relative"
        }}>
          <div style={{
            height: "1px",
            backgroundColor: "#dee2e6",
            width: "100%"
          }}></div>
          <span style={{
            backgroundColor: "white",
            padding: "0 15px",
            color: "#6c757d",
            fontSize: "14px",
            position: "absolute",
            left: "50%",
            top: "-8px",
            transform: "translateX(-50%)"
          }}>
            ¿No tienes cuenta?
          </span>
        </div>

        {/* Botón de registro */}
        <button
          onClick={() => setCurrentView("signIn")}
          disabled={loading}
          style={{
            width: "100%",
            padding: "15px",
            backgroundColor: "transparent",
            color: "#28a745",
            border: "2px solid #28a745",
            borderRadius: "25px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            marginBottom: "15px"
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = "#28a745";
              e.target.style.color = "white";
            }
          }}
          onMouseOut={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = "transparent";
              e.target.style.color = "#28a745";
            }
          }}
        >
          📝 Crear Cuenta 
        </button>

        {/* Botón de regresar */}
        <button
          onClick={() => setCurrentView("menu")}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "transparent",
            color: "#6c757d",
            border: "1px solid #dee2e6",
            borderRadius: "20px",
            fontSize: "14px",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.3s ease"
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = "#f8f9fa";
            }
          }}
          onMouseOut={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = "transparent";
            }
          }}
        >
          ← Regresar al Inicio
        </button>
      </div>

      {/* Footer informativo */}
      <div style={{
        marginTop: "30px",
        textAlign: "center",
        maxWidth: "400px"
      }}>
        <p style={{
          fontSize: "12px",
          color: "#6c757d",
          lineHeight: "1.5"
        }}>
          🔒 Tu información está protegida con tecnología de encriptación Firebase de Google
        </p>
      </div>
    </div>
  );
};

export default Login;