import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase-config";
import { collection, doc, getDocs, getDoc, addDoc, query, orderBy } from "firebase/firestore";

// Constantes para cálculos
const TRAINING_CONSTANTS = {
  VOLUME_INCREASE: 1.05, // 5% de aumento en volumen
  WEIGHT_INCREASE: 1.02, // 2% de aumento en peso
  MIN_WEIGHT: 10, // Peso mínimo base
  DEFAULT_REPS: 8, // Repeticiones base
  DEFAULT_SETS: 3, // Sets base
};

// Utilidades para cálculos de entrenamiento
const TrainingCalculator = {
  calculateSuggestedWeight: (previousWeight) => {
    return previousWeight > 0 ? 
      previousWeight * TRAINING_CONSTANTS.WEIGHT_INCREASE : 
      TRAINING_CONSTANTS.MIN_WEIGHT;
  },

  calculateTargetVolume: (weight, reps, sets) => {
    return weight * reps * sets * TRAINING_CONSTANTS.VOLUME_INCREASE;
  },

  calculateSuggestedReps: (targetVolume, suggestedWeight, sets) => {
    return sets > 0 ? 
      Math.ceil(targetVolume / (suggestedWeight * sets)) : 
      TRAINING_CONSTANTS.DEFAULT_REPS;
  },

  calculateCurrentVolume: (weight, reps, sets) => {
    return weight * reps * sets;
  }
};

// Hook para manejar los objetivos de entrenamiento
const useTrainingObjectives = (rutinaSeleccionada) => {
  const [objetivos, setObjetivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const calcularObjetivos = async () => {
      if (!rutinaSeleccionada?.ejercicios) {
        setError("No hay ejercicios en la rutina seleccionada");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) {
          setError("Usuario no autenticado");
          setLoading(false);
          return;
        }

        const ejerciciosList = [];

        for (const ejercicioId of rutinaSeleccionada.ejercicios) {
          // ✅ CORREGIDO: Obtener datos del ejercicio del usuario específico
          const ejercicioRef = doc(db, "usuarios", user.uid, "ejercicios", ejercicioId);
          const ejercicioDoc = await getDoc(ejercicioRef);

          if (!ejercicioDoc.exists()) {
            console.warn(`Ejercicio ${ejercicioId} no encontrado`);
            continue;
          }

          const ejercicioData = ejercicioDoc.data();

          // ✅ CORREGIDO: Obtener historial de entrenamientos del usuario específico
          const entrenamientosRef = collection(db, "usuarios", user.uid, "ejercicios", ejercicioId, "entrenamientos");
          const entrenamientosQuery = query(entrenamientosRef, orderBy("fecha", "desc"));
          const entrenamientosSnapshot = await getDocs(entrenamientosQuery);

          const entrenamientos = entrenamientosSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); // Más reciente primero

          const ultimoEntrenamiento = entrenamientos[0] || {
            pesoUtilizado: ejercicioData.pesoMaximo * 0.7 || 20, // 70% del peso máximo como inicio
            repeticionesAlcanzadas: ejercicioData.repeticionesMaximas || 8,
            setsRealizados: ejercicioData.setsMaximos || 3,
          };

          // Calcular nuevos objetivos
          const { pesoUtilizado, repeticionesAlcanzadas, setsRealizados } = ultimoEntrenamiento;
          
          const pesoSugerido = TrainingCalculator.calculateSuggestedWeight(pesoUtilizado);
          const volumenAnterior = TrainingCalculator.calculateCurrentVolume(
            pesoUtilizado, repeticionesAlcanzadas, setsRealizados
          );
          const volumenObjetivo = TrainingCalculator.calculateTargetVolume(
            pesoUtilizado, repeticionesAlcanzadas, setsRealizados
          );
          const repeticionesSugeridas = TrainingCalculator.calculateSuggestedReps(
            volumenObjetivo, pesoSugerido, setsRealizados || TRAINING_CONSTANTS.DEFAULT_SETS
          );

          ejerciciosList.push({
            id: ejercicioId,
            nombre: ejercicioData.nombre,
            musculo: ejercicioData.musculo,
            pesoSugerido: Number(pesoSugerido.toFixed(2)),
            repeticionesSugeridas: Math.min(repeticionesSugeridas, ejercicioData.repeticionesMaximas + 2),
            setsSugeridos: setsRealizados || TRAINING_CONSTANTS.DEFAULT_SETS,
            volumenAnterior,
            volumenObjetivo,
            ultimoEntrenamiento,
            pesoMaximo: ejercicioData.pesoMaximo,
            esNuevoEjercicio: entrenamientos.length === 0,
          });
        }

        setObjetivos(ejerciciosList);
      } catch (error) {
        console.error("Error al calcular objetivos:", error);
        setError("Error al cargar los objetivos de entrenamiento");
      } finally {
        setLoading(false);
      }
    };

    calcularObjetivos();
  }, [rutinaSeleccionada]);

  return { objetivos, loading, error };
};

// Hook para manejar el progreso del entrenamiento
const useTrainingProgress = (objetivos, setCurrentStep) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [repeticionesActuales, setRepeticionesActuales] = useState(0);
  const [contadorSets, setContadorSets] = useState(1);
  const [ejerciciosCompletados, setEjerciciosCompletados] = useState([]);
  const [pesoUtilizado, setPesoUtilizado] = useState(0);

  const ejercicioActual = objetivos[currentIndex];

  // Inicializar peso sugerido cuando cambia el ejercicio
  useEffect(() => {
    if (ejercicioActual) {
      setPesoUtilizado(ejercicioActual.pesoSugerido);
    }
  }, [ejercicioActual]);

  const handleRegistrarSet = async () => {
    if (!ejercicioActual) return;

    const volumenActual = TrainingCalculator.calculateCurrentVolume(
      pesoUtilizado, repeticionesActuales, contadorSets
    );

    const objetivoAlcanzado = volumenActual >= ejercicioActual.volumenObjetivo;
    const setsCompletos = contadorSets >= ejercicioActual.setsSugeridos;

    if (objetivoAlcanzado || setsCompletos) {
      // Guardar registro del ejercicio completado
      try {
        const user = auth.currentUser;
        if (!user) {
          alert("Usuario no autenticado");
          return;
        }

        const registroEntrenamiento = {
          fecha: new Date().toISOString(),
          pesoUtilizado: pesoUtilizado,
          repeticionesAlcanzadas: repeticionesActuales,
          setsRealizados: contadorSets,
          volumenAlcanzado: volumenActual,
          objetivoAlcanzado,
          tiempoDescanso: 90, // Valor por defecto
          sensacionEsfuerzo: Math.ceil(Math.random() * 10), // Simulado por ahora
          notas: objetivoAlcanzado ? "Objetivo alcanzado" : "Sets completos"
        };

        // ✅ CORREGIDO: Guardar entrenamiento en datos del usuario específico
        const entrenamientosRef = collection(db, "usuarios", user.uid, "ejercicios", ejercicioActual.id, "entrenamientos");
        await addDoc(entrenamientosRef, registroEntrenamiento);

        // Agregar a ejercicios completados
        setEjerciciosCompletados(prev => [...prev, {
          ...ejercicioActual,
          ...registroEntrenamiento,
          repeticionesFinales: repeticionesActuales,
          setsFinales: contadorSets,
          volumenFinal: volumenActual,
          objetivoCumplido: objetivoAlcanzado
        }]);

        // Pasar al siguiente ejercicio o finalizar
        if (currentIndex + 1 < objetivos.length) {
          setCurrentIndex(currentIndex + 1);
          setContadorSets(1);
          setRepeticionesActuales(0);
          setPesoUtilizado(0); // Se establecerá en el useEffect
        } else {
          setCurrentStep(3); // Finalizar rutina
        }
      } catch (error) {
        console.error("Error al guardar entrenamiento:", error);
        alert("Error al guardar el entrenamiento. Intenta de nuevo.");
      }
    } else {
      // Continuar con el siguiente set
      setContadorSets(contadorSets + 1);
      setRepeticionesActuales(0);
    }
  };

  const saltarEjercicio = () => {
    if (currentIndex + 1 < objetivos.length) {
      setCurrentIndex(currentIndex + 1);
      setContadorSets(1);
      setRepeticionesActuales(0);
      setPesoUtilizado(0);
    } else {
      setCurrentStep(3); // Finalizar rutina
    }
  };

  return {
    currentIndex,
    repeticionesActuales,
    setRepeticionesActuales,
    contadorSets,
    pesoUtilizado,
    setPesoUtilizado,
    handleRegistrarSet,
    saltarEjercicio,
    ejerciciosCompletados,
    ejercicioActual,
  };
};

// Componente para mostrar progreso del ejercicio
const ExerciseProgress = ({ ejercicio, currentSet, totalSets, volume, targetVolume, pesoActual }) => {
  const progress = Math.min((volume / targetVolume) * 100, 100);
  
  return (
    <div className="exercise-progress">
      <div className="progress-header">
        <h3>{ejercicio.nombre}</h3>
        <span className="muscle-group">{ejercicio.musculo}</span>
        {ejercicio.esNuevoEjercicio && (
          <span className="nuevo-ejercicio-badge">¡Nuevo ejercicio!</span>
        )}
      </div>
      
      <div className="progress-stats">
        <div className="stat">
          <label>Set actual:</label>
          <span>{currentSet} / {totalSets}</span>
        </div>
        <div className="stat">
          <label>Peso sugerido:</label>
          <span>{ejercicio.pesoSugerido} kg</span>
        </div>
        <div className="stat">
          <label>Peso actual:</label>
          <span>{pesoActual} kg</span>
        </div>
        <div className="stat">
          <label>Repeticiones sugeridas:</label>
          <span>{ejercicio.repeticionesSugeridas}</span>
        </div>
      </div>

      <div className="volume-progress">
        <label>Progreso de volumen:</label>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <span className="progress-text">
          {volume.toFixed(0)} / {targetVolume.toFixed(0)} kg×reps×sets
        </span>
        <div className="progress-percentage">
          {progress.toFixed(1)}% completado
        </div>
      </div>

      {ejercicio.ultimoEntrenamiento && !ejercicio.esNuevoEjercicio && (
        <div className="ultimo-entrenamiento">
          <h5>Último entrenamiento:</h5>
          <p>
            {ejercicio.ultimoEntrenamiento.pesoUtilizado}kg × {ejercicio.ultimoEntrenamiento.repeticionesAlcanzadas} reps × {ejercicio.ultimoEntrenamiento.setsRealizados} sets
          </p>
          <p>Volumen: {ejercicio.volumenAnterior.toFixed(0)} kg×reps×sets</p>
        </div>
      )}
    </div>
  );
};

const CalculoDinamico = ({ rutinaSeleccionada, setCurrentStep }) => {
  const { objetivos, loading, error } = useTrainingObjectives(rutinaSeleccionada);
  const {
    currentIndex,
    repeticionesActuales,
    setRepeticionesActuales,
    contadorSets,
    pesoUtilizado,
    setPesoUtilizado,
    handleRegistrarSet,
    saltarEjercicio,
    ejerciciosCompletados,
    ejercicioActual,
  } = useTrainingProgress(objetivos, setCurrentStep);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Calculando objetivos de entrenamiento...</div>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={() => setCurrentStep(1)} className="login-button">
          Volver
        </button>
      </div>
    );
  }

  if (!objetivos.length) {
    return (
      <div className="error-container">
        <div className="error-message">No se encontraron ejercicios válidos en esta rutina</div>
        <button onClick={() => setCurrentStep(1)} className="login-button">
          Volver
        </button>
      </div>
    );
  }

  if (!ejercicioActual) {
    return (
      <div className="error-container">
        <div className="error-message">Error: No hay ejercicio actual</div>
        <button onClick={() => setCurrentStep(1)} className="login-button">
          Volver
        </button>
      </div>
    );
  }

  const volumenActual = TrainingCalculator.calculateCurrentVolume(
    pesoUtilizado, repeticionesActuales, contadorSets
  );

  const puedeRegistrarSet = repeticionesActuales > 0 && pesoUtilizado > 0;

  return (
    <div className="calculo-dinamico-mejorado">
      <div className="workout-header-mejorado">
        <h2>Entrenamiento en Progreso</h2>
        <div className="workout-progress-badge">
          Ejercicio {currentIndex + 1} de {objetivos.length}
        </div>
      </div>

      <ExerciseProgress
        ejercicio={ejercicioActual}
        currentSet={contadorSets}
        totalSets={ejercicioActual.setsSugeridos}
        volume={volumenActual}
        targetVolume={ejercicioActual.volumenObjetivo}
        pesoActual={pesoUtilizado}
      />

      {/* Control de peso */}
      <div className="peso-input-section">
        <label htmlFor="peso">Peso utilizado (kg):</label>
        <input
          id="peso"
          type="number"
          step="0.5"
          min="0"
          max={ejercicioActual.pesoMaximo * 1.2}
          value={pesoUtilizado}
          onChange={(e) => setPesoUtilizado(parseFloat(e.target.value) || 0)}
          className="peso-input"
          placeholder={ejercicioActual.pesoSugerido.toString()}
        />
        <div className="peso-sugerencias">
          <button 
            onClick={() => setPesoUtilizado(ejercicioActual.pesoSugerido)}
            className="peso-sugerencia"
          >
            Usar sugerido ({ejercicioActual.pesoSugerido}kg)
          </button>
          {ejercicioActual.ultimoEntrenamiento && (
            <button 
              onClick={() => setPesoUtilizado(ejercicioActual.ultimoEntrenamiento.pesoUtilizado)}
              className="peso-sugerencia"
            >
              Usar anterior ({ejercicioActual.ultimoEntrenamiento.pesoUtilizado}kg)
            </button>
          )}
        </div>
      </div>

      {/* Control de repeticiones */}
      <div className="rep-input-section">
        <label htmlFor="repeticiones">Repeticiones realizadas en este set:</label>
        <input
          id="repeticiones"
          type="number"
          min="0"
          max="50"
          value={repeticionesActuales}
          onChange={(e) => setRepeticionesActuales(parseInt(e.target.value) || 0)}
          className="rep-input"
          placeholder="0"
        />
        <div className="rep-sugerencias">
          <button 
            onClick={() => setRepeticionesActuales(ejercicioActual.repeticionesSugeridas)}
            className="rep-sugerencia"
          >
            Usar sugerido ({ejercicioActual.repeticionesSugeridas})
          </button>
        </div>
      </div>

      {/* Información del set actual */}
      <div className="set-info">
        <h4>Set {contadorSets}:</h4>
        <p>
          {pesoUtilizado > 0 && repeticionesActuales > 0 ? (
            <>
              {pesoUtilizado}kg × {repeticionesActuales} reps = {(pesoUtilizado * repeticionesActuales).toFixed(0)} volumen parcial
            </>
          ) : (
            "Ingresa peso y repeticiones para ver el volumen"
          )}
        </p>
      </div>

      {/* Botones de acción */}
      <div className="action-buttons">
        <button 
          onClick={handleRegistrarSet}
          className="register-set-button"
          disabled={!puedeRegistrarSet}
        >
          ✓ Registrar Set {contadorSets}
        </button>
        
        <button 
          onClick={saltarEjercicio}
          className="skip-button"
        >
          ⏭️ Saltar Ejercicio
        </button>
        
        <button 
          onClick={() => setCurrentStep(1)}
          className="cancel-button"
        >
          ❌ Cancelar Entrenamiento
        </button>
      </div>

      {/* Ejercicios completados */}
      {ejerciciosCompletados.length > 0 && (
        <div className="completed-exercises">
          <h4>Ejercicios completados ({ejerciciosCompletados.length}):</h4>
          <ul>
            {ejerciciosCompletados.map((ej, index) => (
              <li key={index}>
                <strong>{ej.nombre}</strong> - {ej.setsFinales} sets, {ej.repeticionesFinales} reps, {ej.pesoUtilizado}kg
                {ej.objetivoCumplido && <span className="objetivo-cumplido"> ✅ Objetivo cumplido</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CalculoDinamico;