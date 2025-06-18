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
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        flexDirection: "column"
      }}>
        <div style={{ fontSize: "18px", marginBottom: "20px" }}>Cargando rutinas...</div>
        <div style={{ 
          width: "50px", 
          height: "50px", 
          border: "5px solid #f3f3f3",
          borderTop: "5px solid #007bff",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }}></div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      {/* Paso 1: Selección de rutina */}
      {currentStep === 1 && (
        <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "15px",
            padding: "30px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
            textAlign: "center"
          }}>
            <h2 style={{ 
              margin: "0 0 20px 0", 
              color: "#1f4f63",
              fontSize: "2rem"
            }}>
              🏋️‍♂️ Seleccionar Rutina de Entrenamiento
            </h2>
            
            <p style={{ 
              color: "#6c757d", 
              fontSize: "1.1rem", 
              marginBottom: "30px" 
            }}>
              Elige la rutina que vas a realizar hoy
            </p>

            {rutinas.length === 0 ? (
              <div style={{ padding: "40px" }}>
                <div style={{ fontSize: "48px", marginBottom: "20px" }}>📝</div>
                <h3 style={{ color: "#6c757d", marginBottom: "20px" }}>
                  No hay rutinas disponibles
                </h3>
                <p style={{ color: "#6c757d", marginBottom: "30px" }}>
                  Primero debes crear una rutina para poder entrenar
                </p>
                <button
                  onClick={() => setCurrentView("menuRutina")}
                  style={{
                    padding: "15px 30px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "25px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    marginRight: "15px"
                  }}
                >
                  Crear Rutina
                </button>
                <button
                  onClick={() => setCurrentView("menuPrincipal")}
                  style={{
                    padding: "15px 30px",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "25px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    cursor: "pointer"
                  }}
                >
                  Regresar
                </button>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: "30px" }}>
                  <select
                    onChange={(e) => e.target.value && handleRutinaSeleccionada(e.target.value)}
                    defaultValue=""
                    style={{
                      width: "100%",
                      maxWidth: "400px",
                      padding: "15px",
                      fontSize: "16px",
                      border: "2px solid #dee2e6",
                      borderRadius: "10px",
                      backgroundColor: "white",
                      cursor: "pointer"
                    }}
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
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: "20px",
                  marginTop: "30px"
                }}>
                  {rutinas.map((rutina) => (
                    <div
                      key={rutina.id}
                      onClick={() => handleRutinaSeleccionada(rutina.id)}
                      style={{
                        backgroundColor: "#f8f9fa",
                        border: "2px solid #dee2e6",
                        borderRadius: "10px",
                        padding: "20px",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        textAlign: "left"
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = "#007bff";
                        e.currentTarget.style.backgroundColor = "#e7f3ff";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = "#dee2e6";
                        e.currentTarget.style.backgroundColor = "#f8f9fa";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <h4 style={{ 
                        margin: "0 0 10px 0", 
                        color: "#1f4f63",
                        fontSize: "1.2rem"
                      }}>
                        {rutina.nombre}
                      </h4>
                      <p style={{ 
                        color: "#6c757d", 
                        margin: "0 0 10px 0",
                        fontSize: "14px"
                      }}>
                        {rutina.ejercicios?.length || 0} ejercicios
                      </p>
                      <div style={{
                        fontSize: "12px",
                        color: "#007bff",
                        fontWeight: "bold"
                      }}>
                        Click para seleccionar →
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "30px" }}>
                  <button
                    onClick={() => setCurrentView("menuPrincipal")}
                    style={{
                      padding: "12px 30px",
                      backgroundColor: "#6c757d",
                      color: "white",
                      border: "none",
                      borderRadius: "25px",
                      fontSize: "16px",
                      cursor: "pointer",
                      marginRight: "15px"
                    }}
                  >
                    ← Regresar al Menú
                  </button>
                  <button
                    onClick={() => setCurrentView("menuRutina")}
                    style={{
                      padding: "12px 30px",
                      backgroundColor: "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "25px",
                      fontSize: "16px",
                      cursor: "pointer"
                    }}
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

      {/* Estilos para la animación de carga */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default RegistroRutinaActualizado;