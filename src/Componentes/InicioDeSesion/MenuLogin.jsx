import React from "react";

const MenuLogin = ({ setCurrentView }) => {
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
      {/* Logo y título principal */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "20px",
        padding: "40px",
        boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
        textAlign: "center",
        maxWidth: "500px",
        width: "100%",
        marginBottom: "20px"
      }}>
        {/* Logo */}
        <div style={{
          backgroundColor: "#1f4f63",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          margin: "0 auto 30px auto",
          boxShadow: "0 4px 15px rgba(31, 79, 99, 0.3)"
        }}>
          <span style={{
            fontSize: "48px",
            color: "white",
            fontWeight: "bold"
          }}>
            🏋️‍♂️
          </span>
        </div>

        {/* Título */}
        <h1 style={{
          margin: "0 0 20px 0",
          color: "#1f4f63",
          fontSize: "2.5rem",
          fontWeight: "bold",
          letterSpacing: "2px"
        }}>
          ControlFit
        </h1>

        {/* Subtítulo */}
        <p style={{
          margin: "0 0 30px 0",
          color: "#6c757d",
          fontSize: "1.1rem",
          lineHeight: "1.6",
          maxWidth: "400px"
        }}>
          Aplicación para el Seguimiento de Ejercicios y Control de Grasa Corporal ControlFit
        </p>

        {/* Características principales */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "15px",
          marginBottom: "40px",
          padding: "20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "15px"
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>📊</div>
            <div style={{ fontSize: "12px", color: "#6c757d", fontWeight: "bold" }}>
              Análisis de Grasa
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>🎯</div>
            <div style={{ fontSize: "12px", color: "#6c757d", fontWeight: "bold" }}>
              Sobrecarga Progresiva
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>📈</div>
            <div style={{ fontSize: "12px", color: "#6c757d", fontWeight: "bold" }}>
              Seguimiento Completo
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          alignItems: "center"
        }}>
          <button
            onClick={() => setCurrentView("login")}
            style={{
              width: "100%",
              maxWidth: "300px",
              padding: "15px 30px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "25px",
              fontSize: "18px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 15px rgba(0, 123, 255, 0.3)"
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = "#0056b3";
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 20px rgba(0, 123, 255, 0.4)";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "#007bff";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 15px rgba(0, 123, 255, 0.3)";
            }}
          >
            🔐 Iniciar Sesión
          </button>

          <button
            onClick={() => setCurrentView("signIn")}
            style={{
              width: "100%",
              maxWidth: "300px",
              padding: "15px 30px",
              backgroundColor: "transparent",
              color: "#28a745",
              border: "2px solid #28a745",
              borderRadius: "25px",
              fontSize: "18px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = "#28a745";
              e.target.style.color = "white";
              e.target.style.transform = "translateY(-2px)";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "transparent";
              e.target.style.color = "#28a745";
              e.target.style.transform = "translateY(0)";
            }}
          >
            📝 Crear Cuenta
          </button>
        </div>
      </div>

      
      
    </div>
  );
};

export default MenuLogin;