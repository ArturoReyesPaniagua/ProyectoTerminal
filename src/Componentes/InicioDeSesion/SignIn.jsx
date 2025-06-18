import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase-config";
import { doc, setDoc } from "firebase/firestore";

const SignIn = ({ setCurrentView }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validarDatos = () => {
    if (!email || !password || !confirmPassword) {
      return "Por favor, completa todos los campos";
    }

    if (email.length < 5 || !email.includes("@") || !email.includes(".")) {
      return "Formato de correo electrónico inválido";
    }

    if (password.length < 6) {
      return "La contraseña debe tener al menos 6 caracteres";
    }

    if (password !== confirmPassword) {
      return "Las contraseñas no coinciden";
    }

    // Validación de seguridad de contraseña
    if (!/(?=.*[a-z])/.test(password)) {
      return "La contraseña debe contener al menos una letra minúscula";
    }

    if (!/(?=.*[0-9])/.test(password)) {
      return "La contraseña debe contener al menos un número";
    }

    return null;
  };

  const handleSignUpClick = async () => {
    const validationError = validarDatos();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Registrar el usuario en Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Crear un documento básico para el usuario en Firestore
      const userDocRef = doc(db, "usuarios", user.uid);
      await setDoc(userDocRef, { 
        email: user.email,
        datosCompletos: false,
        fechaRegistro: new Date().toISOString()
      });

      // El redirect a formularioDatos se maneja automáticamente en App.js
    } catch (error) {
      console.error("Error al registrarse:", error.message);
      
      // Mensajes de error más amigables
      let errorMessage = "Error al crear la cuenta";
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "Ya existe una cuenta con este correo electrónico";
          break;
        case "auth/invalid-email":
          errorMessage = "Formato de correo electrónico inválido";
          break;
        case "auth/weak-password":
          errorMessage = "La contraseña es muy débil";
          break;
        case "auth/network-request-failed":
          errorMessage = "Error de conexión. Revisa tu internet";
          break;
        default:
          errorMessage = "Error inesperado. Inténtalo de nuevo";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSignUpClick();
    }
  };

  const getPasswordStrength = () => {
    if (!password) return null;
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/(?=.*[a-z])/.test(password)) strength++;
    if (/(?=.*[A-Z])/.test(password)) strength++;
    if (/(?=.*[0-9])/.test(password)) strength++;
    if (/(?=.*[!@#$%^&*])/.test(password)) strength++;

    if (strength <= 2) return { level: "Débil", color: "#dc3545" };
    if (strength <= 4) return { level: "Media", color: "#ffc107" };
    return { level: "Fuerte", color: "#28a745" };
  };

  const passwordStrength = getPasswordStrength();

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
          backgroundColor: "#28a745",
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          margin: "0 auto 20px auto",
          boxShadow: "0 4px 15px rgba(40, 167, 69, 0.3)"
        }}>
          <span style={{ fontSize: "32px", color: "white" }}>📝</span>
        </div>
        <h2 style={{
          margin: "0",
          color: "#1f4f63",
          fontSize: "2rem",
          fontWeight: "bold"
        }}>
          Crear Cuenta
        </h2>
        <p style={{
          margin: "10px 0 0 0",
          color: "#6c757d",
          fontSize: "1rem"
        }}>
          Únete a la comunidad ASECGC
        </p>
      </div>

      {/* Formulario de registro */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "20px",
        padding: "40px",
        boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
        width: "100%",
        maxWidth: "450px"
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
              setError("");
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
            onFocus={(e) => !error && (e.target.style.borderColor = "#28a745")}
            onBlur={(e) => !error && (e.target.style.borderColor = "#dee2e6")}
          />
        </div>

        {/* Campo de contraseña */}
        <div style={{ marginBottom: "20px" }}>
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
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
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
            onFocus={(e) => !error && (e.target.style.borderColor = "#28a745")}
            onBlur={(e) => !error && (e.target.style.borderColor = "#dee2e6")}
          />
          
          {/* Indicador de fortaleza de contraseña */}
          {passwordStrength && (
            <div style={{
              marginTop: "8px",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <div style={{
                width: "60px",
                height: "4px",
                backgroundColor: "#e9ecef",
                borderRadius: "2px",
                overflow: "hidden"
              }}>
                <div style={{
                  width: passwordStrength.level === "Débil" ? "33%" : 
                         passwordStrength.level === "Media" ? "66%" : "100%",
                  height: "100%",
                  backgroundColor: passwordStrength.color,
                  transition: "width 0.3s ease"
                }}></div>
              </div>
              <span style={{ color: passwordStrength.color, fontWeight: "bold" }}>
                {passwordStrength.level}
              </span>
            </div>
          )}
        </div>

        {/* Campo de confirmar contraseña */}
        <div style={{ marginBottom: "25px" }}>
          <label style={{
            display: "block",
            marginBottom: "8px",
            fontWeight: "bold",
            color: "#495057",
            fontSize: "14px"
          }}>
            🔒 Confirmar Contraseña
          </label>
          <input
            type="password"
            placeholder="Repite tu contraseña"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError("");
            }}
            onKeyPress={handleKeyPress}
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px",
              border: error ? "2px solid #dc3545" : 
                     (confirmPassword && password === confirmPassword) ? "2px solid #28a745" :
                     "2px solid #dee2e6",
              borderRadius: "10px",
              fontSize: "16px",
              transition: "border-color 0.3s ease",
              backgroundColor: loading ? "#f8f9fa" : "white",
              cursor: loading ? "not-allowed" : "text"
            }}
            onFocus={(e) => !error && (e.target.style.borderColor = "#28a745")}
            onBlur={(e) => !error && (e.target.style.borderColor = "#dee2e6")}
          />
          
          {/* Indicador de coincidencia */}
          {confirmPassword && (
            <div style={{
              marginTop: "8px",
              fontSize: "12px",
              color: password === confirmPassword ? "#28a745" : "#dc3545",
              fontWeight: "bold"
            }}>
              {password === confirmPassword ? "✓ Las contraseñas coinciden" : "✗ Las contraseñas no coinciden"}
            </div>
          )}
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

        {/* Requisitos de contraseña */}
        <div style={{
          backgroundColor: "#e7f3ff",
          border: "1px solid #b8daff",
          borderRadius: "8px",
          padding: "15px",
          marginBottom: "25px",
          fontSize: "12px"
        }}>
          <strong style={{ color: "#004085", display: "block", marginBottom: "8px" }}>
            🛡️ Requisitos de seguridad:
          </strong>
          <div style={{ color: "#004085", lineHeight: "1.4" }}>
            • Mínimo 6 caracteres<br />
            • Al menos una letra minúscula<br />
            • Al menos un número<br />
            • Recomendado: mayúsculas y símbolos
          </div>
        </div>

        {/* Botón de registro */}
        <button
          onClick={handleSignUpClick}
          disabled={loading || !email || !password || !confirmPassword || password !== confirmPassword}
          style={{
            width: "100%",
            padding: "15px",
            backgroundColor: loading || !email || !password || !confirmPassword || password !== confirmPassword ? 
                           "#6c757d" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "25px",
            fontSize: "18px",
            fontWeight: "bold",
            cursor: loading || !email || !password || !confirmPassword || password !== confirmPassword ? 
                   "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            marginBottom: "20px",
            boxShadow: loading || !email || !password || !confirmPassword || password !== confirmPassword ? 
                      "none" : "0 4px 15px rgba(40, 167, 69, 0.3)"
          }}
          onMouseOver={(e) => {
            if (!loading && email && password && confirmPassword && password === confirmPassword) {
              e.target.style.backgroundColor = "#218838";
              e.target.style.transform = "translateY(-2px)";
            }
          }}
          onMouseOut={(e) => {
            if (!loading && email && password && confirmPassword && password === confirmPassword) {
              e.target.style.backgroundColor = "#28a745";
              e.target.style.transform = "translateY(0)";
            }
          }}
        >
          {loading ? "⏳ Creando cuenta..." : "🚀 Crear Cuenta"}
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
            ¿Ya tienes cuenta?
          </span>
        </div>

        {/* Botón de login */}
        <button
          onClick={() => setCurrentView("login")}
          disabled={loading}
          style={{
            width: "100%",
            padding: "15px",
            backgroundColor: "transparent",
            color: "#007bff",
            border: "2px solid #007bff",
            borderRadius: "25px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            marginBottom: "15px"
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = "#007bff";
              e.target.style.color = "white";
            }
          }}
          onMouseOut={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = "transparent";
              e.target.style.color = "#007bff";
            }
          }}
        >
          🔐 Iniciar Sesión
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
        maxWidth: "450px"
      }}>
        <div style={{
          backgroundColor: "white",
          borderRadius: "10px",
          padding: "15px",
          fontSize: "12px",
          color: "#6c757d",
          lineHeight: "1.5",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
        }}>
          🔒 Al crear una cuenta, aceptas que tu información será protegida con tecnología Firebase de Google.
          <br />
          💪 ¡Prepárate para transformar tu entrenamiento con ASECGC!
        </div>
      </div>
    </div>
  );
};

export default SignIn;