import React from "react";

const ResumenEntrenamiento = ({ ejerciciosRealizados, setCurrentView, rutinaSeleccionada }) => {
  const calcularEstadisticas = () => {
    if (!ejerciciosRealizados.length) return null;

    const volumenTotal = ejerciciosRealizados.reduce((total, ejercicio) => 
      total + (ejercicio.volumenFinal || 0), 0
    );

    const ejerciciosCompletados = ejerciciosRealizados.filter(ej => 
      ej.objetivoCumplido || (ej.volumenFinal >= ej.volumenObjetivo * 0.9)
    ).length;

    const porcentajeCompletado = (ejerciciosCompletados / ejerciciosRealizados.length) * 100;

    const pesoTotal = ejerciciosRealizados.reduce((total, ejercicio) => 
      total + (ejercicio.pesoSugerido * ejercicio.setsFinales), 0
    );

    return {
      volumenTotal,
      ejerciciosCompletados,
      porcentajeCompletado,
      pesoTotal,
      totalEjercicios: ejerciciosRealizados.length
    };
  };

  const obtenerMensajeMotivacional = (porcentaje) => {
    if (porcentaje >= 90) {
      return {
        mensaje: "¡Excelente sesión! 🔥",
        descripcion: "Has superado tus objetivos. ¡Sigue así!",
        color: "#28a745"
      };
    } else if (porcentaje >= 70) {
      return {
        mensaje: "¡Buen trabajo! 💪",
        descripcion: "Has completado la mayoría de tus objetivos.",
        color: "#ffc107"
      };
    } else if (porcentaje >= 50) {
      return {
        mensaje: "¡Esfuerzo sólido! 👍",
        descripcion: "Un buen comienzo, la próxima vez puedes hacerlo mejor.",
        color: "#17a2b8"
      };
    } else {
      return {
        mensaje: "¡No te rindas! 💪",
        descripcion: "Cada entrenamiento cuenta. ¡La próxima vez será mejor!",
        color: "#fd7e14"
      };
    }
  };

  const finalizarEntrenamiento = () => {
    alert("¡Entrenamiento registrado exitosamente!");
    setCurrentView("menuPrincipal");
  };

  const estadisticas = calcularEstadisticas();
  
  if (!estadisticas) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>No hay datos de entrenamiento</h2>
        <button onClick={() => setCurrentView("menuPrincipal")}>
          Regresar al Menú
        </button>
      </div>
    );
  }

  const motivacion = obtenerMensajeMotivacional(estadisticas.porcentajeCompletado);

  return (
    <div style={{ 
      padding: "20px", 
      maxWidth: "800px", 
      margin: "0 auto",
      backgroundColor: "#f8f9fa",
      minHeight: "100vh"
    }}>
      {/* Header con mensaje motivacional */}
      <div style={{
        backgroundColor: motivacion.color,
        color: "white",
        padding: "30px",
        borderRadius: "15px",
        textAlign: "center",
        marginBottom: "30px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
      }}>
        <h1 style={{ margin: "0 0 10px 0", fontSize: "2.5rem" }}>
          {motivacion.mensaje}
        </h1>
        <p style={{ margin: "0", fontSize: "1.2rem", opacity: "0.9" }}>
          {motivacion.descripcion}
        </p>
      </div>

      {/* Estadísticas generales */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "20px",
        marginBottom: "30px"
      }}>
        <div style={{
          backgroundColor: "white",
          padding: "25px",
          borderRadius: "15px",
          textAlign: "center",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
        }}>
          <div style={{ fontSize: "36px", fontWeight: "bold", color: "#007bff" }}>
            {estadisticas.totalEjercicios}
          </div>
          <div style={{ color: "#6c757d", fontSize: "14px" }}>
            Ejercicios Realizados
          </div>
        </div>

        <div style={{
          backgroundColor: "white",
          padding: "25px",
          borderRadius: "15px",
          textAlign: "center",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
        }}>
          <div style={{ fontSize: "36px", fontWeight: "bold", color: "#28a745" }}>
            {estadisticas.volumenTotal.toFixed(0)}
          </div>
          <div style={{ color: "#6c757d", fontSize: "14px" }}>
            Volumen Total
          </div>
        </div>

        <div style={{
          backgroundColor: "white",
          padding: "25px",
          borderRadius: "15px",
          textAlign: "center",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
        }}>
          <div style={{ fontSize: "36px", fontWeight: "bold", color: "#ffc107" }}>
            {estadisticas.pesoTotal.toFixed(0)} kg
          </div>
          <div style={{ color: "#6c757d", fontSize: "14px" }}>
            Peso Total Movido
          </div>
        </div>

        <div style={{
          backgroundColor: "white",
          padding: "25px",
          borderRadius: "15px",
          textAlign: "center",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
        }}>
          <div style={{ fontSize: "36px", fontWeight: "bold", color: "#17a2b8" }}>
            {estadisticas.porcentajeCompletado.toFixed(0)}%
          </div>
          <div style={{ color: "#6c757d", fontSize: "14px" }}>
            Objetivos Cumplidos
          </div>
        </div>
      </div>

      {/* Detalle por ejercicio */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "15px",
        padding: "25px",
        marginBottom: "30px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
      }}>
        <h3 style={{ 
          margin: "0 0 20px 0", 
          color: "#1f4f63",
          borderBottom: "2px solid #007bff",
          paddingBottom: "10px"
        }}>
          Detalle del Entrenamiento - {rutinaSeleccionada?.nombre}
        </h3>
        
        {ejerciciosRealizados.map((ejercicio, index) => {
          const objetivoCumplido = ejercicio.volumenFinal >= ejercicio.volumenObjetivo * 0.9;
          const porcentajeVolumen = (ejercicio.volumenFinal / ejercicio.volumenObjetivo) * 100;
          
          return (
            <div 
              key={index}
              style={{
                border: `2px solid ${objetivoCumplido ? '#28a745' : '#ffc107'}`,
                borderRadius: "10px",
                padding: "20px",
                marginBottom: "15px",
                backgroundColor: objetivoCumplido ? '#f8fff8' : '#fffbf0'
              }}
            >
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                marginBottom: "15px"
              }}>
                <h4 style={{ margin: "0", color: "#1f4f63" }}>
                  {ejercicio.nombre}
                </h4>
                <span style={{
                  backgroundColor: objetivoCumplido ? '#28a745' : '#ffc107',
                  color: "white",
                  padding: "5px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "bold"
                }}>
                  {objetivoCumplido ? '✓ Completado' : '⚡ Parcial'}
                </span>
              </div>

              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", 
                gap: "15px",
                marginBottom: "15px"
              }}>
                <div>
                  <strong>Peso:</strong> {ejercicio.pesoSugerido} kg
                </div>
                <div>
                  <strong>Repeticiones:</strong> {ejercicio.repeticionesFinales}
                </div>
                <div>
                  <strong>Sets:</strong> {ejercicio.setsFinales}
                </div>
                <div>
                  <strong>Volumen:</strong> {ejercicio.volumenFinal?.toFixed(0)}
                </div>
              </div>

              {/* Barra de progreso del volumen */}
              <div style={{ marginBottom: "10px" }}>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  marginBottom: "5px",
                  fontSize: "14px"
                }}>
                  <span>Progreso del volumen objetivo:</span>
                  <span>{porcentajeVolumen.toFixed(0)}%</span>
                </div>
                <div style={{ 
                  width: "100%", 
                  height: "8px", 
                  backgroundColor: "#e9ecef", 
                  borderRadius: "4px" 
                }}>
                  <div style={{ 
                    width: `${Math.min(porcentajeVolumen, 100)}%`, 
                    height: "100%", 
                    backgroundColor: porcentajeVolumen >= 90 ? "#28a745" : porcentajeVolumen >= 70 ? "#ffc107" : "#fd7e14", 
                    borderRadius: "4px",
                    transition: "width 0.3s ease"
                  }}></div>
                </div>
              </div>

              {ejercicio.tipoEntrenamiento && (
                <div style={{ 
                  fontSize: "12px", 
                  color: "#6c757d",
                  backgroundColor: "#f8f9fa",
                  padding: "5px 10px",
                  borderRadius: "15px",
                  display: "inline-block"
                }}>
                  {ejercicio.tipoEntrenamiento}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recomendaciones */}
      <div style={{
        backgroundColor: "#e7f3ff",
        borderLeft: "5px solid #007bff",
        padding: "20px",
        borderRadius: "0 10px 10px 0",
        marginBottom: "30px"
      }}>
        <h4 style={{ margin: "0 0 10px 0", color: "#007bff" }}>
          💡 Recomendaciones para la próxima sesión:
        </h4>
        <ul style={{ margin: "0", paddingLeft: "20px" }}>
          {estadisticas.porcentajeCompletado >= 90 ? (
            <>
              <li>¡Excelente progreso! Considera aumentar la intensidad.</li>
              <li>Mantén la constancia en tus entrenamientos.</li>
              <li>Revisa tu nutrición para maximizar la recuperación.</li>
            </>
          ) : (
            <>
              <li>Intenta completar más sets de los ejercicios incompletos.</li>
              <li>Considera revisar la técnica de los ejercicios.</li>
              <li>Asegúrate de tener suficiente descanso entre sets.</li>
            </>
          )}
        </ul>
      </div>

      {/* Botones de acción */}
      <div style={{ 
        display: "flex", 
        gap: "15px", 
        justifyContent: "center",
        marginBottom: "20px"
      }}>
        <button 
          onClick={finalizarEntrenamiento}
          style={{
            padding: "15px 30px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "25px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 4px 15px rgba(40, 167, 69, 0.3)",
            transition: "all 0.3s ease"
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = "#218838";
            e.target.style.transform = "translateY(-2px)";
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = "#28a745";
            e.target.style.transform = "translateY(0)";
          }}
        >
          ✓ Finalizar Entrenamiento
        </button>
        
        <button 
          onClick={() => setCurrentView("graficos")}
          style={{
            padding: "15px 30px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "25px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 4px 15px rgba(0, 123, 255, 0.3)",
            transition: "all 0.3s ease"
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = "#0056b3";
            e.target.style.transform = "translateY(-2px)";
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = "#007bff";
            e.target.style.transform = "translateY(0)";
          }}
        >
          📊 Ver Progreso
        </button>
      </div>
    </div>
  );
};

export default ResumenEntrenamiento;