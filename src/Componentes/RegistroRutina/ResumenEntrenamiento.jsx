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
      <div className="error-container">
        <h2>No hay datos de entrenamiento</h2>
        <button onClick={() => setCurrentView("menuPrincipal")}>
          Regresar al Menú
        </button>
      </div>
    );
  }

  const motivacion = obtenerMensajeMotivacional(estadisticas.porcentajeCompletado);

  return (
    <div className="resumen-container">
      {/* Header con mensaje motivacional */}
      <div className="resumen-header" style={{ backgroundColor: motivacion.color }}>
        <h1>{motivacion.mensaje}</h1>
        <p>{motivacion.descripcion}</p>
      </div>

      {/* Estadísticas generales */}
      <div className="estadisticas-grid">
        <div className="estadistica-card">
          <div className="estadistica-valor primary">
            {estadisticas.totalEjercicios}
          </div>
          <div className="estadistica-label">
            Ejercicios Realizados
          </div>
        </div>

        <div className="estadistica-card">
          <div className="estadistica-valor success">
            {estadisticas.volumenTotal.toFixed(0)}
          </div>
          <div className="estadistica-label">
            Volumen Total
          </div>
        </div>

        <div className="estadistica-card">
          <div className="estadistica-valor warning">
            {estadisticas.pesoTotal.toFixed(0)} kg
          </div>
          <div className="estadistica-label">
            Peso Total Movido
          </div>
        </div>

        <div className="estadistica-card">
          <div className="estadistica-valor info">
            {estadisticas.porcentajeCompletado.toFixed(0)}%
          </div>
          <div className="estadistica-label">
            Objetivos Cumplidos
          </div>
        </div>
      </div>

      {/* Detalle por ejercicio */}
      <div className="detalle-entrenamiento">
        <h3>Detalle del Entrenamiento - {rutinaSeleccionada?.nombre}</h3>
        
        {ejerciciosRealizados.map((ejercicio, index) => {
          const objetivoCumplido = ejercicio.volumenFinal >= ejercicio.volumenObjetivo * 0.9;
          const porcentajeVolumen = (ejercicio.volumenFinal / ejercicio.volumenObjetivo) * 100;
          
          return (
            <div 
              key={index}
              className={`ejercicio-resumen ${objetivoCumplido ? 'completado' : 'parcial'}`}
            >
              <div className="ejercicio-resumen-header">
                <h4>{ejercicio.nombre}</h4>
                <span className={`ejercicio-estado ${objetivoCumplido ? 'completado' : 'parcial'}`}>
                  {objetivoCumplido ? '✓ Completado' : '⚡ Parcial'}
                </span>
              </div>

              <div className="ejercicio-stats">
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
              <div className="volumen-progreso">
                <div className="volumen-progreso-header">
                  <span>Progreso del volumen objetivo:</span>
                  <span>{porcentajeVolumen.toFixed(0)}%</span>
                </div>
                <div className="volumen-barra">
                  <div 
                    className={`volumen-barra-fill ${
                      porcentajeVolumen >= 90 ? 'alto' : 
                      porcentajeVolumen >= 70 ? 'medio' : 'bajo'
                    }`}
                    style={{ width: `${Math.min(porcentajeVolumen, 100)}%` }}
                  ></div>
                </div>
              </div>

              {ejercicio.tipoEntrenamiento && (
                <div className="tipo-entrenamiento">
                  {ejercicio.tipoEntrenamiento}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recomendaciones */}
      <div className="recomendaciones-box">
        <h4>💡 Recomendaciones para la próxima sesión:</h4>
        <ul>
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
      <div className="resumen-acciones">
        <button 
          onClick={finalizarEntrenamiento}
          className="btn-resumen success"
        >
          ✓ Finalizar Entrenamiento
        </button>
        
        <button 
          onClick={() => setCurrentView("graficos")}
          className="btn-resumen primary"
        >
          📊 Ver Progreso
        </button>
      </div>
    </div>
  );
};

export default ResumenEntrenamiento;