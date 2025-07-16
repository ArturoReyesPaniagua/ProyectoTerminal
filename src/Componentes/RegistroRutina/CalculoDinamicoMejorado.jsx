import React, { useState, useEffect } from "react";
import { db } from "../../firebase-config";
import { collection, doc, getDocs, getDoc, addDoc } from "firebase/firestore";

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
        const ejerciciosList = [];

        for (const ejercicioId of rutinaSeleccionada.ejercicios) {
          // Obtener datos del ejercicio
          const ejercicioRef = doc(db, "ejercicios", ejercicioId);
          const ejercicioDoc = await getDoc(ejercicioRef);

          if (!ejercicioDoc.exists()) {
            console.warn(`Ejercicio ${ejercicioId} no encontrado`);
            continue;
          }

          const ejercicioData = ejercicioDoc.data();

          // Obtener historial de entrenamientos
          const entrenamientosSnapshot = await getDocs(
            collection(db, "ejercicios", ejercicioId, "entrenamientos")
          );

          const entrenamientos = entrenamientosSnapshot.docs
            .map(doc => doc.data())
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); // Más reciente primero

          const ultimoEntrenamiento = entrenamientos[0] || {
            pesoUtilizado: 0,
            repeticionesAlcanzadas: 0,
            setsRealizados: 0,
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
            repeticionesSugeridas,
            setsSugeridos: setsRealizados || TRAINING_CONSTANTS.DEFAULT_SETS,
            volumenAnterior,
            volumenObjetivo,
            ultimoEntrenamiento,
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

  const ejercicioActual = objetivos[currentIndex];

  const handleRegistrarSet = async () => {
    if (!ejercicioActual) return;

    const volumenActual = TrainingCalculator.calculateCurrentVolume(
      ejercicioActual.pesoSugerido, repeticionesActuales, contadorSets
    );

    const objetivoAlcanzado = volumenActual >= ejercicioActual.volumenObjetivo;
    const setsCompletos = contadorSets >= ejercicioActual.setsSugeridos;

    if (objetivoAlcanzado || setsCompletos) {
      // Guardar registro del ejercicio completado
      try {
        const registroEntrenamiento = {
          fecha: new Date().toISOString(),
          pesoUtilizado: ejercicioActual.pesoSugerido,
          repeticionesAlcanzadas: repeticionesActuales,
          setsRealizados: contadorSets,
          volumenAlcanzado: volumenActual,
          objetivoAlcanzado,
        };

        await addDoc(
          collection(db, "ejercicios", ejercicioActual.id, "entrenamientos"), 
          registroEntrenamiento
        );

        // Agregar a ejercicios completados
        setEjerciciosCompletados(prev => [...prev, {
          ...ejercicioActual,
          ...registroEntrenamiento
        }]);

        // Pasar al siguiente ejercicio o finalizar
        if (currentIndex + 1 < objetivos.length) {
          setCurrentIndex(currentIndex + 1);
          setContadorSets(1);
          setRepeticionesActuales(0);
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

  return {
    currentIndex,
    repeticionesActuales,
    setRepeticionesActuales,
    contadorSets,
    handleRegistrarSet,
    ejerciciosCompletados,
    ejercicioActual,
  };
};

// Componente para mostrar progreso del ejercicio
const ExerciseProgress = ({ ejercicio, currentSet, totalSets, volume, targetVolume }) => {
  const progress = Math.min((volume / targetVolume) * 100, 100);
  
  return (
    <div className="exercise-progress">
      <div className="progress-header">
        <h3>{ejercicio.nombre}</h3>
        <span className="muscle-group">{ejercicio.musculo}</span>
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
          {volume.toFixed(0)} / {targetVolume.toFixed(0)} kg
        </span>
      </div>
    </div>
  );
};

const CalculoDinamico = ({ rutinaSeleccionada, setCurrentStep, userId }) => {
  const { objetivos, loading, error } = useTrainingObjectives(rutinaSeleccionada);
  const {
    currentIndex,
    repeticionesActuales,
    setRepeticionesActuales,
    contadorSets,
    handleRegistrarSet,
    ejerciciosCompletados,
    ejercicioActual,
  } = useTrainingProgress(objetivos, setCurrentStep);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Calculando objetivos de entrenamiento...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={() => setCurrentStep(1)}>Volver</button>
      </div>
    );
  }

  if (!objetivos.length) {
    return (
      <div className="error-container">
        <div className="error-message">No se encontraron ejercicios válidos en esta rutina</div>
        <button onClick={() => setCurrentStep(1)}>Volver</button>
      </div>
    );
  }

  if (!ejercicioActual) {
    return (
      <div className="error-container">
        <div className="error-message">Error: No hay ejercicio actual</div>
        <button onClick={() => setCurrentStep(1)}>Volver</button>
      </div>
    );
  }

  const volumenActual = TrainingCalculator.calculateCurrentVolume(
    ejercicioActual.pesoSugerido, repeticionesActuales, contadorSets
  );

  return (
    <div className="calculo-dinamico-container">
      <div className="workout-header">
        <h2>Entrenamiento en Progreso</h2>
        <div className="workout-progress">
          Ejercicio {currentIndex + 1} de {objetivos.length}
        </div>
      </div>

      <ExerciseProgress
        ejercicio={ejercicioActual}
        currentSet={contadorSets}
        totalSets={ejercicioActual.setsSugeridos}
        volume={volumenActual}
        targetVolume={ejercicioActual.volumenObjetivo}
      />

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
      </div>

      <div className="action-buttons">
        <button 
          onClick={handleRegistrarSet}
          className="register-set-button"
          disabled={repeticionesActuales <= 0}
        >
          Registrar Set {contadorSets}
        </button>
        
        <button 
          onClick={() => setCurrentStep(1)}
          className="cancel-button"
        >
          Cancelar Entrenamiento
        </button>
      </div>

      {ejerciciosCompletados.length > 0 && (
        <div className="completed-exercises">
          <h4>Ejercicios completados:</h4>
          <ul>
            {ejerciciosCompletados.map((ej, index) => (
              <li key={index}>
                {ej.nombre} - {ej.setsRealizados} sets, {ej.repeticionesAlcanzadas} reps
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CalculoDinamico;