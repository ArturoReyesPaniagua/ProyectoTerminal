import  { useState, useEffect } from "react";
import { auth, db } from "../../firebase-config";
import { collection, getDocs } from "firebase/firestore";
import CalculoDinamicoMejorado from "./CalculoDinamicoMejorado";
import ResumenEntrenamiento from "./ResumenEntrenamiento";

const RegistroRutina = ({ setCurrentView }) => {
  const [rutinas, setRutinas] = useState([]);
  const [rutinaSeleccionada, setRutinaSeleccionada] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [ejerciciosRealizados, setEjerciciosRealizados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const obtenerRutinas = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) {
          setError("Usuario no autenticado");
          return;
        }

        // ✅ CORREGIDO: Obtener rutinas del usuario específico
        const rutinasRef = collection(db, "usuarios", user.uid, "rutinas");
        const rutinasSnapshot = await getDocs(rutinasRef);
        const rutinasList = rutinasSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Filtrar solo rutinas activas con ejercicios
        const rutinasValidas = rutinasList.filter(rutina => 
          rutina.ejercicios && rutina.ejercicios.length > 0
        );

        setRutinas(rutinasValidas);

        if (rutinasValidas.length === 0) {
          setError("No hay rutinas disponibles con ejercicios");
        }

      } catch (error) {
        console.error("Error al cargar rutinas:", error);
        setError("Error al cargar las rutinas. Verifica tu conexión.");
      } finally {
        setLoading(false);
      }
    };

    obtenerRutinas();
  }, []);

  const handleRutinaSeleccionada = async (id) => {
    try {
      const rutina = rutinas.find((rutina) => rutina.id === id);
      if (!rutina) {
        alert("Rutina no encontrada");
        return;
      }

      if (!rutina.ejercicios || rutina.ejercicios.length === 0) {
        alert("Esta rutina no tiene ejercicios asignados. Por favor, edita la rutina primero.");
        return;
      }

      // Verificar que los ejercicios existen en la base de datos del usuario
      const user = auth.currentUser;
      if (!user) {
        alert("Usuario no autenticado");
        return;
      }

      setLoading(true);
      const ejerciciosValidos = [];

      for (const ejercicioId of rutina.ejercicios) {
        try {
          // ✅ CORREGIDO: Verificar ejercicio del usuario específico
          const ejercicioRef = collection(db, "usuarios", user.uid, "ejercicios");
          const ejerciciosSnapshot = await getDocs(ejercicioRef);
          const ejercicioExiste = ejerciciosSnapshot.docs.find(doc => doc.id === ejercicioId);
          
          if (ejercicioExiste) {
            ejerciciosValidos.push(ejercicioId);
          } else {
            console.warn(`Ejercicio ${ejercicioId} no encontrado en la base de datos del usuario`);
          }
        } catch (error) {
          console.error(`Error al verificar ejercicio ${ejercicioId}:`, error);
        }
      }

      if (ejerciciosValidos.length === 0) {
        alert("Los ejercicios de esta rutina no están disponibles. Por favor, verifica la rutina.");
        setLoading(false);
        return;
      }

      // Actualizar la rutina con solo ejercicios válidos
      const rutinaValidada = {
        ...rutina,
        ejercicios: ejerciciosValidos
      };

      setRutinaSeleccionada(rutinaValidada);
      setCurrentStep(2);
      setLoading(false);

    } catch (error) {
      console.error("Error al seleccionar rutina:", error);
      alert("Error al cargar la rutina. Intenta de nuevo.");
      setLoading(false);
    }
  };

  const finalizarRegistro = () => {
    // Limpiar estados
    setRutinaSeleccionada(null);
    setCurrentStep(1);
    setEjerciciosRealizados([]);
    
    // Regresar al menú principal
    setCurrentView("menuPrincipal");
  };

  const regresarASeleccion = () => {
    setCurrentStep(1);
    setRutinaSeleccionada(null);
    setEjerciciosRealizados([]);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Cargando rutinas...</div>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rutinas-container">
        <div className="rutinas-content">
          <div className="error-container">
            <h2>⚠️ {error}</h2>
            <div style={{ marginTop: "20px" }}>
              <button
                onClick={() => setCurrentView("menuRutina")}
                className="login-button"
                style={{ marginRight: "10px" }}
              >
                Crear Rutinas
              </button>
              <button
                onClick={() => setCurrentView("menuPrincipal")}
                className="boton-cancelar"
              >
                Regresar
              </button>
            </div>
          </div>
        </div>
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
                  Primero debes crear una rutina con ejercicios para poder entrenar
                </p>
                <div style={{ display: "flex", gap: "15px", justifyContent: "center", marginTop: "20px" }}>
                  <button
                    onClick={() => setCurrentView("menuRutina")}
                    className="login-button"
                  >
                    Crear Rutina
                  </button>
                  <button
                    onClick={() => setCurrentView("registrarEjercicio")}
                    className="login-button secondary"
                  >
                    Crear Ejercicios
                  </button>
                </div>
                <button
                  onClick={() => setCurrentView("menuPrincipal")}
                  className="boton-cancelar"
                  style={{ marginTop: "15px" }}
                >
                  Regresar
                </button>
              </div>
            ) : (
              <div>
                {/* Selector desplegable */}
                <div className="form-field">
                  <select
                    onChange={(e) => e.target.value && handleRutinaSeleccionada(e.target.value)}
                    defaultValue=""
                    className="select-rutina-grande"
                  >
                    <option value="" disabled>
                      🎯 Selecciona una rutina ({rutinas.length} disponibles)
                    </option>
                    {rutinas.map((rutina) => (
                      <option key={rutina.id} value={rutina.id}>
                        {rutina.nombre} ({rutina.ejercicios?.length || 0} ejercicios)
                        {rutina.duracionEstimada && ` - ${rutina.duracionEstimada} min`}
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
                        📝 {rutina.ejercicios?.length || 0} ejercicios
                      </p>
                      {rutina.duracionEstimada && (
                        <p>
                          ⏱️ {rutina.duracionEstimada} minutos estimados
                        </p>
                      )}
                      {rutina.descripcion && (
                        <p style={{ fontSize: "12px", color: "#6c757d", marginTop: "5px" }}>
                          {rutina.descripcion}
                        </p>
                      )}
                      {rutina.diasSemana && rutina.diasSemana.length > 0 && (
                        <p style={{ fontSize: "12px", color: "#007bff", marginTop: "5px" }}>
                          🗓️ {rutina.diasSemana.join(", ")}
                        </p>
                      )}
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
                    + Gestionar Rutinas
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Paso 2: Ejecución del entrenamiento */}
      {currentStep === 2 && rutinaSeleccionada && (
        <>
          {/* Header del entrenamiento en progreso */}
          <div style={{ 
            backgroundColor: "white", 
            padding: "15px", 
            marginBottom: "20px", 
            borderRadius: "10px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <h3 style={{ margin: "0", color: "#1f4f63" }}>
                📋 {rutinaSeleccionada.nombre}
              </h3>
              <p style={{ margin: "5px 0 0 0", color: "#6c757d", fontSize: "14px" }}>
                {rutinaSeleccionada.ejercicios.length} ejercicios programados
              </p>
            </div>
            <button
              onClick={regresarASeleccion}
              className="boton-cancelar"
              style={{ padding: "8px 16px", fontSize: "14px" }}
            >
              ← Cambiar Rutina
            </button>
          </div>

          <CalculoDinamicoMejorado
            rutinaSeleccionada={rutinaSeleccionada}
            setCurrentStep={setCurrentStep}
            ejerciciosRealizados={ejerciciosRealizados}
            setEjerciciosRealizados={setEjerciciosRealizados}
          />
        </>
      )}

      {/* Paso 3: Resumen del entrenamiento */}
      {currentStep === 3 && (
        <>
          {/* Header del resumen */}
          <div style={{ 
            backgroundColor: "white", 
            padding: "15px", 
            marginBottom: "20px", 
            borderRadius: "10px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            textAlign: "center"
          }}>
            <h3 style={{ margin: "0", color: "#1f4f63" }}>
              🎉 Entrenamiento Completado
            </h3>
            <p style={{ margin: "5px 0 0 0", color: "#6c757d", fontSize: "14px" }}>
              Rutina: {rutinaSeleccionada?.nombre}
            </p>
          </div>

          <ResumenEntrenamiento
            ejerciciosRealizados={ejerciciosRealizados}
            setCurrentView={setCurrentView}
            rutinaSeleccionada={rutinaSeleccionada}
            onFinalizar={finalizarRegistro}
          />
        </>
      )}
    </div>
  );
};

export default RegistroRutina;