import React from "react";

const ComponenteCarga = ({ 
  mensaje = "Cargando...", 
  submensaje = null, 
  tamaño = "medium",
  tema = "primario" 
}) => {
  
  const obtenerTamaños = () => {
    switch (tamaño) {
      case "small":
        return {
          spinner: "30px",
          fontSize: "14px",
          padding: "20px"
        };
      case "large":
        return {
          spinner: "80px",
          fontSize: "24px",
          padding: "60px"
        };
      default: // medium
        return {
          spinner: "50px",
          fontSize: "18px",
          padding: "40px"
        };
    }
  };

  const obtenerColores = () => {
    switch (tema) {
      case "secundario":
        return {
          color: "#6c757d",
          fondo: "#f8f9fa"
        };
      case "exito":
        return {
          color: "#28a745",
          fondo: "#f8fff8"
        };
      case "advertencia":
        return {
          color: "#ffc107",
          fondo: "#fffbf0"
        };
      default: // primario
        return {
          color: "#007bff",
          fondo: "#f8f9fa"
        };
    }
  };

  const tamaños = obtenerTamaños();
  const colores = obtenerColores();

  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      height: "100vh",
      backgroundColor: colores.fondo,
      flexDirection: "column",
      padding: tamaños.padding
    }}>
      {/* Spinner animado */}
      <div style={{ 
        width: tamaños.spinner, 
        height: tamaños.spinner, 
        border: `4px solid #e9ecef`,
        borderTop: `4px solid ${colores.color}`,
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        marginBottom: "20px"
      }}></div>
      
      {/* Mensaje principal */}
      <div style={{ 
        fontSize: tamaños.fontSize, 
        marginBottom: submensaje ? "10px" : "0",
        fontWeight: "600",
        color: "#343a40",
        textAlign: "center"
      }}>
        {mensaje}
      </div>
      
      {/* Submensaje opcional */}
      {submensaje && (
        <div style={{ 
          fontSize: "14px",
          color: "#6c757d",
          textAlign: "center",
          maxWidth: "300px",
          lineHeight: "1.4"
        }}>
          {submensaje}
        </div>
      )}

      {/* Barra de progreso animada opcional */}
      <div style={{
        width: "200px",
        height: "3px",
        backgroundColor: "#e9ecef",
        borderRadius: "2px",
        marginTop: "20px",
        overflow: "hidden"
      }}>
        <div style={{
          width: "30%",
          height: "100%",
          backgroundColor: colores.color,
          borderRadius: "2px",
          animation: "progress 2s ease-in-out infinite"
        }}></div>
      </div>

      {/* CSS para las animaciones */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(300%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
};

// Componente específico para carga de datos
export const CargaDatos = ({ tipo = "datos" }) => {
  const mensajes = {
    datos: {
      principal: "Cargando datos del usuario...",
      secundario: "Obteniendo tu información personal y medidas"
    },
    rutinas: {
      principal: "Cargando rutinas...",
      secundario: "Preparando tus rutinas de entrenamiento"
    },
    ejercicios: {
      principal: "Preparando ejercicios...",
      secundario: "Configurando tu sesión de entrenamiento"
    },
    historial: {
      principal: "Analizando tu progreso...",
      secundario: "Revisando tu historial de entrenamientos"
    },
    calculos: {
      principal: "Calculando objetivos...",
      secundario: "Aplicando sobrecarga progresiva personalizada"
    },
    graficos: {
      principal: "Generando gráficos...",
      secundario: "Visualizando tu progreso y estadísticas"
    }
  };

  const mensaje = mensajes[tipo] || mensajes.datos;

  return (
    <ComponenteCarga
      mensaje={mensaje.principal}
      submensaje={mensaje.secundario}
      tema="primario"
    />
  );
};

// Componente para errores de carga
export const ErrorCarga = ({ 
  mensaje = "Error al cargar", 
  descripcion = "Ha ocurrido un error inesperado",
  onReintentar = null,
  onRegresar = null
}) => {
  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      height: "100vh",
      backgroundColor: "#f8f9fa",
      flexDirection: "column",
      padding: "40px",
      textAlign: "center"
    }}>
      {/* Icono de error */}
      <div style={{
        fontSize: "64px",
        marginBottom: "20px",
        color: "#dc3545"
      }}>
        ⚠️
      </div>
      
      {/* Mensaje de error */}
      <h2 style={{ 
        fontSize: "24px", 
        marginBottom: "10px",
        color: "#dc3545",
        fontWeight: "600"
      }}>
        {mensaje}
      </h2>
      
      {/* Descripción */}
      <p style={{ 
        fontSize: "16px",
        color: "#6c757d",
        marginBottom: "30px",
        maxWidth: "400px",
        lineHeight: "1.5"
      }}>
        {descripcion}
      </p>

      {/* Botones de acción */}
      <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
        {onReintentar && (
          <button
            onClick={onReintentar}
            style={{
              padding: "12px 24px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "25px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = "#0056b3"}
            onMouseOut={(e) => e.target.style.backgroundColor = "#007bff"}
          >
            🔄 Reintentar
          </button>
        )}
        
        {onRegresar && (
          <button
            onClick={onRegresar}
            style={{
              padding: "12px 24px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "25px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = "#545b62"}
            onMouseOut={(e) => e.target.style.backgroundColor = "#6c757d"}
          >
            ← Regresar
          </button>
        )}
      </div>
    </div>
  );
};

// Componente para estados vacíos
export const EstadoVacio = ({ 
  icono = "📝",
  titulo = "No hay datos disponibles", 
  descripcion = "Comienza agregando información",
  accionPrincipal = null,
  accionSecundaria = null
}) => {
  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      minHeight: "400px",
      backgroundColor: "#ffffff",
      flexDirection: "column",
      padding: "40px",
      textAlign: "center",
      borderRadius: "15px",
      border: "2px dashed #dee2e6"
    }}>
      {/* Icono */}
      <div style={{
        fontSize: "64px",
        marginBottom: "20px",
        opacity: "0.7"
      }}>
        {icono}
      </div>
      
      {/* Título */}
      <h3 style={{ 
        fontSize: "20px", 
        marginBottom: "10px",
        color: "#495057",
        fontWeight: "600"
      }}>
        {titulo}
      </h3>
      
      {/* Descripción */}
      <p style={{ 
        fontSize: "16px",
        color: "#6c757d",
        marginBottom: "30px",
        maxWidth: "300px",
        lineHeight: "1.5"
      }}>
        {descripcion}
      </p>

      {/* Botones de acción */}
      <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
        {accionPrincipal && (
          <button
            onClick={accionPrincipal.onClick}
            style={{
              padding: "12px 24px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "25px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = "#0056b3"}
            onMouseOut={(e) => e.target.style.backgroundColor = "#007bff"}
          >
            {accionPrincipal.texto}
          </button>
        )}
        
        {accionSecundaria && (
          <button
            onClick={accionSecundaria.onClick}
            style={{
              padding: "12px 24px",
              backgroundColor: "transparent",
              color: "#007bff",
              border: "2px solid #007bff",
              borderRadius: "25px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = "#007bff";
              e.target.style.color = "white";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "transparent";
              e.target.style.color = "#007bff";
            }}
          >
            {accionSecundaria.texto}
          </button>
        )}
      </div>
    </div>
  );
};

export default ComponenteCarga;