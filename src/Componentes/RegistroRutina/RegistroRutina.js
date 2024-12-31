import React, { useState, useEffect } from "react";
import { db } from "../../firebase-config";
import { collection, getDocs } from "firebase/firestore";
import CalculoDinamico from "./CalculoDinamico";

const RegistroRutina = ({ setCurrentView }) => {
  const [rutinas, setRutinas] = useState([]); // Lista de rutinas disponibles
  const [rutinaSeleccionada, setRutinaSeleccionada] = useState(null); // Rutina actual
  const [currentStep, setCurrentStep] = useState(1); // Paso actual en el flujo
  const [ejerciciosRealizados, setEjerciciosRealizados] = useState([]); // Lista de ejercicios realizados

  // Cargar rutinas desde Firestore
  useEffect(() => {
    const obtenerRutinas = async () => {
      try {
        const rutinasSnapshot = await getDocs(collection(db, "rutinas"));
        const rutinasList = rutinasSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRutinas(rutinasList);
      } catch (error) {
        console.error("Error al cargar rutinas:", error);
      }
    };

    obtenerRutinas();
  }, []);

  // Manejar selección de rutina
  const handleRutinaSeleccionada = (id) => {
    const rutina = rutinas.find((rutina) => rutina.id === id);
    setRutinaSeleccionada(rutina);
    setCurrentStep(2); // Pasar al siguiente paso
  };

  // Finalizar el registro
  const finalizarRegistro = () => {
    alert("Entrenamiento registrado con éxito.");
    setCurrentView("menuPrincipal");
  };

  return (
    <div>
      {currentStep === 1 && (
        <div>
          <h2>Registro de Rutina</h2>
          <select
            onChange={(e) => handleRutinaSeleccionada(e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>
              Seleccionar una rutina
            </option>
            {rutinas.map((rutina) => (
              <option key={rutina.id} value={rutina.id}>
                {rutina.nombre}
              </option>
            ))}
          </select>
          <button
            onClick={() => setCurrentView("menuPrincipal")}
            
          >
            Regresar
          </button>
        </div>
      )}

      {currentStep === 2 && rutinaSeleccionada && (
        <CalculoDinamico
          rutinaSeleccionada={rutinaSeleccionada}
          setCurrentStep={setCurrentStep}
          ejerciciosRealizados={ejerciciosRealizados}
          setEjerciciosRealizados={setEjerciciosRealizados}
        />
      )}

      {currentStep === 3 && (
        <div>
          <h2>Resumen del Entrenamiento</h2>
          <ul>
            {ejerciciosRealizados.map((ejercicio, index) => (
              <li key={index}>
                <strong>{ejercicio.nombre}</strong> - Peso: {ejercicio.pesoSugerido} kg, 
                Repeticiones alcanzadas: {ejercicio.repeticionesAlcanzadas}, 
                Sets realizados: {ejercicio.setsSugeridos}
              </li>
            ))}
          </ul>
          <button onClick={finalizarRegistro}>Finalizar</button>
          <button onClick={() => setCurrentStep(2)}>Volver</button>
        </div>
      )}
    </div>
  );
};

export default RegistroRutina;
