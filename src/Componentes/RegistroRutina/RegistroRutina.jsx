import React, { useState, useEffect } from "react";
import { db } from "../../firebase-config";
import { collection, getDocs } from "firebase/firestore";
import CalculoDinamicoMejorado from "./CalculoDinamicoMejorado";
import ResumenEntrenamiento from "./ResumenEntrenamiento";

const RegistroRutinaActualizado = ({ setCurrentView }) => {
  const [rutinas, setRutinas] = useState([]);
  const [rutinaSeleccionada, setRutinaSeleccionada] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [ejerciciosRealizados, setEjerciciosRealizados] = useState([]);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    };

    obtenerRutinas();
  }, []);

  const handleRutinaSeleccionada = (id) => {
    const rutina = rutinas.find((rutina) => rutina.id === id);
    if (rutina && rutina.ejercicios && rutina.ejercicios.length > 0) {
      setRutinaSeleccionada(rutina);
      setCurrentStep(2);
    } else {
      alert("Esta rutina no tiene ejercicios asignados. Por favor, edita la rutina primero.");
    }
  };

  const finalizarRegistro = () => {
    setCurrentView("menuPrincipal");
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Cargando rutinas...</div>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="rutinas-container">
      {/* Paso 1: Selección de rutina */}
      {currentStep === 1 && (
        <div className="rutinas-content">
          <div className="registro-rutina-header">
            <h2>
              🏋️‍♂️ Seleccionar Rutina de Entrenamiento
            </h2>
            
            <p className="registro-rutina-subtitle">
              Elige la rutina que vas a realizar hoy
            </p>

            {rutinas.length === 0 ? (
              <div className="estado-vacio-ejercicios">
                <div className="estado-vacio-icono">📝</div>
                <h3>
                  No hay rutinas disponibles
                </h3>
                <p>
                  Primero debes crear una rutina para poder entrenar
                </p>
                <button
                  onClick={() => setCurrentView("menuRutina")}
                  className="login-button"
                >
                  Crear Rutina
                </button>
                <button
                  onClick={() => setCurrentView("menuPrincipal")}
                  className="boton-cancelar"
                >
                  Regresar
                </button>
              </div>
            ) : (
              <div>
                <div className="form-field">
                  <select
                    onChange={(e) => e.target.value && handleRutinaSeleccionada(e.target.value)}
                    defaultValue=""
                    className="select-rutina-grande"
                  >
                    <option value="" disabled>
                      🎯 Selecciona una rutina
                    </option>
                    {rutinas.map((rutina) => (
                      <option key={rutina.id} value={rutina.id}>
                        {rutina.nombre} ({rutina.ejercicios?.length || 0} ejercicios)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vista previa de rutinas */}
                <div className="rutinas-preview">
                  {rutinas.map((rutina) => (
                    <div
                      key={rutina.id}
                      onClick={() => handleRutinaSeleccionada(rutina.id)}
                      className="rutina-card"
                    >
                      <h4>
                        {rutina.nombre}
                      </h4>
                      <p>
                        {rutina.ejercicios?.length || 0} ejercicios
                      </p>
                      <div className="rutina-card-action">
                        Click para seleccionar →
                      </div>
                    </div>
                  ))}
                </div>

                <div className="botones-navegacion">
                  <button
                    onClick={() => setCurrentView("menuPrincipal")}
                    className="boton-cancelar"
                  >
                    ← Regresar al Menú
                  </button>
                  <button
                    onClick={() => setCurrentView("menuRutina")}
                    className="boton-establecer-datos"
                  >
                    + Crear Nueva Rutina
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Paso 2: Ejecución del entrenamiento */}
      {currentStep === 2 && rutinaSeleccionada && (
        <CalculoDinamicoMejorado
          rutinaSeleccionada={rutinaSeleccionada}
          setCurrentStep={setCurrentStep}
          ejerciciosRealizados={ejerciciosRealizados}
          setEjerciciosRealizados={setEjerciciosRealizados}
        />
      )}

      {/* Paso 3: Resumen del entrenamiento */}
      {currentStep === 3 && (
        <ResumenEntrenamiento
          ejerciciosRealizados={ejerciciosRealizados}
          setCurrentView={setCurrentView}
          rutinaSeleccionada={rutinaSeleccionada}
        />
      )}
    </div>
  );
};

export default RegistroRutinaActualizado;