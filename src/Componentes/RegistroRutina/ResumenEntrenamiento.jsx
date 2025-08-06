import React from "react";
import { auth, db } from "../../firebase-config";
import { doc, setDoc } from "firebase/firestore";

const ResumenEntrenamiento = ({ ejerciciosRealizados, setCurrentView, rutinaSeleccionada, onFinalizar }) => {
  const calcularEstadisticas = () => {
    if (!ejerciciosRealizados.length) return null;

    const volumenTotal = ejerciciosRealizados.reduce((total, ejercicio) => 
      total + (ejercicio.volumenFinal || ejercicio.volumenAlcanzado || 0), 0
    );

    const ejerciciosCompletados = ejerciciosRealizados.filter(ej => 
      ej.objetivoCumplido || ej.objetivoAlcanzado || (ej.volumenFinal >= (ej.volumenObjetivo * 0.9))
    ).length;

    const porcentajeCompletado = ejerciciosRealizados.length > 0 ? 
      (ejerciciosCompletados / ejerciciosRealizados.length) * 100 : 0;

    const pesoTotal = ejerciciosRealizados.reduce((total, ejercicio) => 
      total + ((ejercicio.pesoUtilizado || 0) * (ejercicio.setsFinales || ejercicio.setsRealizados || 0)), 0
    );

    const repeticionesTotales = ejerciciosRealizados.reduce((total, ejercicio) => 
      total + ((ejercicio.repeticionesFinales || ejercicio.repeticionesAlcanzadas || 0) * (ejercicio.setsFinales || ejercicio.setsRealizados || 0)), 0
    );

    const setsTotal = ejerciciosRealizados.reduce((total, ejercicio) => 
      total + (ejercicio.setsFinales || ejercicio.setsRealizados || 0), 0
    );

    return {
      volumenTotal,
      ejerciciosCompletados,
      porcentajeCompletado,
      pesoTotal,
      repeticionesTotales,
      setsTotal,
      totalEjercicios: ejerciciosRealizados.length
    };
  };

  const obtenerMensajeMotivacional = (porcentaje) => {
    if (porcentaje >= 90) {
      return {
        mensaje: "¡Increíble sesión! 🔥🏆",
        descripcion: "Has superado todas las expectativas. ¡Eres imparable!",
        color: "#28a745"
      };
    } else if (porcentaje >= 75) {
      return {
        mensaje: "¡Excelente trabajo! 💪✨",
        descripcion: "Tu dedicación está dando frutos. ¡Sigue así!",
        color: "#28a745"
      };
    } else if (porcentaje >= 60) {
      return {
        mensaje: "¡Buen progreso! 👍💚",
        descripcion: "Vas por buen camino. La constancia es clave.",
        color: "#ffc107"
      };
    } else if (porcentaje >= 40) {
      return {
        mensaje: "¡En el camino correcto! 🚀",
        descripcion: "Un buen comienzo. Cada día cuenta.",
        color: "#17a2b8"
      };
    } else {
      return {
        mensaje: "¡No te rindas! 💪🌟",
        descripcion: "Cada pequeño paso te acerca a tu objetivo.",
        color: "#fd7e14"
      };
    }
  };

  const guardarResumenEntrenamiento = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("Usuario no autenticado");
        return;
      }

      const estadisticas = calcularEstadisticas();
      if (!estadisticas) return;

      const fechaEntrenamiento = new Date().toISOString();
      const resumenId = `resumen_${Date.now()}`;

      const resumenEntrenamiento = {
        id: resumenId,
        fecha: fechaEntrenamiento,
        rutinaId: rutinaSeleccionada?.id || null,
        rutinaNombre: rutinaSeleccionada?.nombre || "Rutina desconocida",
        ejerciciosRealizados: ejerciciosRealizados.map(ej => ({
          ejercicioId: ej.id,
          nombre: ej.nombre,
          musculo: ej.musculo,
          pesoUtilizado: ej.pesoUtilizado,
          repeticionesAlcanzadas: ej.repeticionesFinales || ej.repeticionesAlcanzadas,
          setsRealizados: ej.setsFinales || ej.setsRealizados,
          volumenAlcanzado: ej.volumenFinal || ej.volumenAlcanzado,
          objetivoAlcanzado: ej.objetivoCumplido || ej.objetivoAlcanzado || false
        })),
        estadisticas: {
          ...estadisticas,
          duracionEstimada: rutinaSeleccionada?.duracionEstimada || null,
          fechaInicio: fechaEntrenamiento,
          fechaFin: fechaEntrenamiento
        },
        notas: `Entrenamiento completado al ${estadisticas.porcentajeCompletado.toFixed(0)}%`
      };

      // ✅ CORREGIDO: Guardar resumen en datos del usuario específico
      const resumenRef = doc(db, "usuarios", user.uid, "resumenesEntrenamientos", resumenId);
      await setDoc(resumenRef, resumenEntrenamiento);

      console.log("Resumen de entrenamiento guardado exitosamente");

    } catch (error) {
      console.error("Error al guardar resumen de entrenamiento:", error);
      // No mostrar error al usuario, es información adicional
    }
  };

  const finalizarEntrenamiento = async () => {
    try {
      // Guardar resumen del entrenamiento
      await guardarResumenEntrenamiento();
      
      alert("¡Entrenamiento registrado exitosamente! 🎉");
      
      // Llamar función de finalización si existe
      if (onFinalizar) {
        onFinalizar();
      } else {
        setCurrentView("menuPrincipal");
      }
    } catch (error) {
      console.error("Error al finalizar entrenamiento:", error);
      alert("Entrenamiento completado, pero hubo un error al guardar el resumen.");
      
      if (onFinalizar) {
        onFinalizar();
      } else {
        setCurrentView("menuPrincipal");
      }
    }
  };

  const estadisticas = calcularEstadisticas();
  
  if (!estadisticas) {
    return (
      <div className="error-container">
        <h2>No hay datos de entrenamiento</h2>
        <p>No se encontraron ejercicios realizados para mostrar el resumen.</p>
        <button onClick={() => setCurrentView("menuPrincipal")} className="login-button">
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
        <div style={{ fontSize: "14px", opacity: 0.9, marginTop: "10px" }}>
          📅 {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
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

        <div className="estadistica-card">
          <div className="estadistica-valor primary">
            {estadisticas.setsTotal}
          </div>
          <div className="estadistica-label">
            Sets Totales
          </div>
        </div>

        <div className="estadistica-card">
          <div className="estadistica-valor success">
            {estadisticas.repeticionesTotales}
          </div>
          <div className="estadistica-label">
            Repeticiones Totales
          </div>
        </div>
      </div>

      {/* Detalle por ejercicio */}
      <div className="detalle-entrenamiento">
        <h3>Detalle del Entrenamiento - {rutinaSeleccionada?.nombre}</h3>
        
        {ejerciciosRealizados.map((ejercicio, index) => {
          const volumenFinal = ejercicio.volumenFinal || ejercicio.volumenAlcanzado || 0;
          const volumenObjetivo = ejercicio.volumenObjetivo || volumenFinal * 1.1; // Si no hay objetivo, asumir 10% más
          const objetivoCumplido = ejercicio.objetivoCumplido || ejercicio.objetivoAlcanzado || 
                                   (volumenFinal >= volumenObjetivo * 0.9);
          const porcentajeVolumen = volumenObjetivo > 0 ? (volumenFinal / volumenObjetivo) * 100 : 100;
          
          return (
            <div 
              key={index}
              className={`ejercicio-resumen ${objetivoCumplido ? 'completado' : 'parcial'}`}
            >
              <div className="ejercicio-resumen-header">
                <h4>
                  {ejercicio.nombre}
                  {ejercicio.musculo && (
                    <span style={{ fontSize: "14px", color: "#6c757d", marginLeft: "10px" }}>
                      ({ejercicio.musculo})
                    </span>
                  )}
                </h4>
                <span className={`ejercicio-estado ${objetivoCumplido ? 'completado' : 'parcial'}`}>
                  {objetivoCumplido ? '✓ Completado' : '⚡ Parcial'}
                </span>
              </div>

              <div className="ejercicio-stats">
                <div>
                  <strong>Peso:</strong> {ejercicio.pesoUtilizado || 0} kg
                </div>
                <div>
                  <strong>Repeticiones:</strong> {ejercicio.repeticionesFinales || ejercicio.repeticionesAlcanzadas || 0}
                </div>
                <div>
                  <strong>Sets:</strong> {ejercicio.setsFinales || ejercicio.setsRealizados || 0}
                </div>
                <div>
                  <strong>Volumen:</strong> {volumenFinal.toFixed(0)}
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

              {ejercicio.notas && (
                <div className="ejercicio-notas" style={{
                  fontSize: "12px",
                  color: "#6c757d",
                  marginTop: "10px",
                  fontStyle: "italic"
                }}>
                  📝 {ejercicio.notas}
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
              <li>¡Excelente progreso! Considera aumentar gradualmente la intensidad.</li>
              <li>Mantén la constancia en tus entrenamientos.</li>
              <li>Revisa tu nutrición y descanso para maximizar la recuperación.</li>
              <li>Podrías intentar aumentar el peso en 2.5-5kg en los ejercicios completados.</li>
            </>
          ) : estadisticas.porcentajeCompletado >= 70 ? (
            <>
              <li>Buen trabajo completando la mayoría de objetivos.</li>
              <li>Enfócate en mejorar la técnica en los ejercicios incompletos.</li>
              <li>Asegúrate de tener suficiente descanso entre sets.</li>
              <li>Mantén el mismo peso hasta completar todos los objetivos.</li>
            </>
          ) : (
            <>
              <li>Considera reducir ligeramente el peso para completar más repeticiones.</li>
              <li>Revisa tu técnica y forma de ejecución.</li>
              <li>Asegúrate de calentar adecuadamente antes del entrenamiento.</li>
              <li>Descansa lo suficiente entre entrenamientos (48-72 horas).</li>
            </>
          )}
          <li>Registra tus sensaciones y notas para el próximo entrenamiento.</li>
          <li>Mantén una hidratación adecuada durante el ejercicio.</li>
        </ul>
      </div>

      {/* Progreso histórico (si hay datos previos) */}
      {rutinaSeleccionada && (
        <div style={{
          backgroundColor: "#e7f3ff",
          padding: "20px",
          borderRadius: "10px",
          marginBottom: "20px",
          border: "1px solid #b8daff"
        }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#004085" }}>
            📊 Información de la rutina
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
            <div>
              <strong>Rutina:</strong> {rutinaSeleccionada.nombre}
            </div>
            {rutinaSeleccionada.duracionEstimada && (
              <div>
                <strong>Duración estimada:</strong> {rutinaSeleccionada.duracionEstimada} min
              </div>
            )}
            {rutinaSeleccionada.diasSemana && rutinaSeleccionada.diasSemana.length > 0 && (
              <div>
                <strong>Días programados:</strong> {rutinaSeleccionada.diasSemana.join(", ")}
              </div>
            )}
            <div>
              <strong>Ejercicios programados:</strong> {rutinaSeleccionada.ejercicios?.length || 0}
            </div>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="resumen-acciones">
        <button 
          onClick={finalizarEntrenamiento}
          className="btn-resumen success"
        >
          ✓ Finalizar y Guardar
        </button>
        
        <button 
          onClick={() => setCurrentView("graficos")}
          className="btn-resumen primary"
        >
          📊 Ver Progreso
        </button>

        <button 
          onClick={() => setCurrentView("registrarRutina")}
          className="btn-resumen primary"
          style={{ backgroundColor: "#28a745" }}
        >
          🔄 Entrenar de Nuevo
        </button>
      </div>
    </div>
  );
};

export default ResumenEntrenamiento;