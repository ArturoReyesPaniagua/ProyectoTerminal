import React, { useState, useEffect } from "react";
import { db } from "../../firebase-config";
import { collection, doc, setDoc, getDocs } from "firebase/firestore";

const RegistrarEjercicio = ({ setCurrentView }) => {
  const [nombre, setNombre] = useState("");
  const [musculo, setMusculo] = useState("");
  const [pesoMaximo, setPesoMaximo] = useState("");
  const [repeticionesMaximas, setRepeticionesMaximas] = useState("");
  const [setsMaximos, setSetsMaximos] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);
  const [ejerciciosExistentes, setEjerciciosExistentes] = useState([]);

  // Lista de músculos predefinidos
  const musculosDisponibles = [
    "Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps", 
    "Cuádriceps", "Isquiotibiales", "Glúteos", "Pantorrillas",
    "Abdominales", "Core", "Antebrazos", "Trapecio", "Dorsales"
  ];

  useEffect(() => {
    cargarEjerciciosExistentes();
  }, []);

  const cargarEjerciciosExistentes = async () => {
    try {
      const ejerciciosSnapshot = await getDocs(collection(db, "ejercicios"));
      const ejerciciosList = ejerciciosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEjerciciosExistentes(ejerciciosList);
    } catch (error) {
      console.error("Error al cargar ejercicios existentes:", error);
    }
  };

  const validarDatos = () => {
    const errores = [];

    if (!nombre.trim()) {
      errores.push("El nombre del ejercicio es obligatorio");
    } else if (nombre.trim().length < 3) {
      errores.push("El nombre debe tener al menos 3 caracteres");
    }

    // Verificar si ya existe un ejercicio con el mismo nombre
    const nombreExistente = ejerciciosExistentes.find(
      ej => ej.nombre.toLowerCase() === nombre.trim().toLowerCase()
    );
    if (nombreExistente) {
      errores.push("Ya existe un ejercicio con este nombre");
    }

    if (!musculo) {
      errores.push("Debe seleccionar el grupo muscular");
    }

    if (!pesoMaximo || pesoMaximo <= 0) {
      errores.push("El peso máximo debe ser mayor a 0");
    } else if (pesoMaximo > 500) {
      errores.push("El peso máximo no puede ser mayor a 500kg");
    }

    if (!repeticionesMaximas || repeticionesMaximas <= 0) {
      errores.push("Las repeticiones máximas deben ser mayor a 0");
    } else if (repeticionesMaximas > 50) {
      errores.push("Las repeticiones máximas no pueden ser mayor a 50");
    }

    if (!setsMaximos || setsMaximos <= 0) {
      errores.push("Los sets máximos deben ser mayor a 0");
    } else if (setsMaximos > 20) {
      errores.push("Los sets máximos no pueden ser mayor a 20");
    }

    return errores;
  };

  const registrarEjercicio = async () => {
    const errores = validarDatos();
    
    if (errores.length > 0) {
      alert("Errores en el formulario:\n" + errores.join("\n"));
      return;
    }

    setLoading(true);

    try {
      const ejercicioRef = doc(collection(db, "ejercicios"));
      const nuevoEjercicio = {
        nombre: nombre.trim(),
        musculo: musculo,
        pesoMaximo: parseFloat(pesoMaximo),
        repeticionesMaximas: parseInt(repeticionesMaximas),
        setsMaximos: parseInt(setsMaximos),
        descripcion: descripcion.trim() || "",
        fechaCreacion: new Date().toISOString(),
        // Datos adicionales para el sistema de sobrecarga progresiva
        volumenBase: parseFloat(pesoMaximo) * parseInt(repeticionesMaximas) * parseInt(setsMaximos),
        categoria: categorizarEjercicio(musculo),
        activo: true
      };

      await setDoc(ejercicioRef, nuevoEjercicio);
      
      alert(`¡Ejercicio "${nombre.trim()}" registrado con éxito!`);
      
      // Limpiar formulario
      setNombre("");
      setMusculo("");
      setPesoMaximo("");
      setRepeticionesMaximas("");
      setSetsMaximos("");
      setDescripcion("");
      
      // Recargar ejercicios existentes
      await cargarEjerciciosExistentes();
      
      // Opcional: regresar al menú de rutinas
      const continuar = window.confirm(
        "¿Quieres registrar otro ejercicio?\n\n" +
        "OK = Registrar otro ejercicio\n" +
        "Cancelar = Volver al menú de rutinas"
      );
      
      if (!continuar) {
        setCurrentView("menuRutina");
      }
      
    } catch (error) {
      console.error("Error al registrar el ejercicio:", error);
      alert("Hubo un error al registrar el ejercicio. Por favor, inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const categorizarEjercicio = (musculo) => {
    const categorias = {
      "Pecho": "Empuje Superior",
      "Hombros": "Empuje Superior", 
      "Tríceps": "Empuje Superior",
      "Espalda": "Tracción Superior",
      "Dorsales": "Tracción Superior",
      "Bíceps": "Tracción Superior",
      "Cuádriceps": "Empuje Inferior",
      "Glúteos": "Empuje Inferior",
      "Isquiotibiales": "Tracción Inferior",
      "Pantorrillas": "Tracción Inferior",
      "Abdominales": "Core",
      "Core": "Core"
    };
    
    return categorias[musculo] || "General";
  };

  const limpiarFormulario = () => {
    setNombre("");
    setMusculo("");
    setPesoMaximo("");
    setRepeticionesMaximas("");
    setSetsMaximos("");
    setDescripcion("");
  };

  const calcularVolumenEstimado = () => {
    const peso = parseFloat(pesoMaximo) || 0;
    const reps = parseInt(repeticionesMaximas) || 0;
    const sets = parseInt(setsMaximos) || 0;
    return peso * reps * sets;
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#f8f9fa",
      padding: "20px"
    }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "15px",
          padding: "30px",
          marginBottom: "30px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          textAlign: "center"
        }}>
          <div style={{
            backgroundColor: "#28a745",
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            margin: "0 auto 20px auto",
            boxShadow: "0 4px 15px rgba(40, 167, 69, 0.3)"
          }}>
            <span style={{ fontSize: "32px", color: "white" }}>💪</span>
          </div>
          <h1 style={{ 
            margin: "0 0 10px 0", 
            color: "#1f4f63",
            fontSize: "2.5rem",
            fontWeight: "bold"
          }}>
            Registrar Nuevo Ejercicio
          </h1>
          <p style={{ margin: "0", color: "#6c757d", fontSize: "1.1rem" }}>
            Agrega un nuevo ejercicio a tu biblioteca personal
          </p>
        </div>

        {/* Información de ejercicios existentes */}
        {ejerciciosExistentes.length > 0 && (
          <div style={{
            backgroundColor: "#e7f3ff",
            border: "1px solid #b8daff",
            borderRadius: "10px",
            padding: "15px",
            marginBottom: "30px"
          }}>
            <h4 style={{ margin: "0 0 10px 0", color: "#004085" }}>
              📚 Tienes {ejerciciosExistentes.length} ejercicio(s) registrado(s)
            </h4>
            <div style={{ 
              fontSize: "14px", 
              color: "#004085",
              display: "flex",
              flexWrap: "wrap",
              gap: "10px"
            }}>
              {ejerciciosExistentes.slice(0, 5).map((ej, index) => (
                <span 
                  key={index}
                  style={{
                    backgroundColor: "#b8daff",
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "12px"
                  }}
                >
                  {ej.nombre}
                </span>
              ))}
              {ejerciciosExistentes.length > 5 && (
                <span style={{ color: "#6c757d", fontSize: "12px" }}>
                  y {ejerciciosExistentes.length - 5} más...
                </span>
              )}
            </div>
          </div>
        )}

        {/* Formulario */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "15px",
          padding: "30px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
        }}>
          {/* Información básica */}
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ 
              margin: "0 0 20px 0", 
              color: "#1f4f63",
              borderBottom: "2px solid #007bff",
              paddingBottom: "10px"
            }}>
              📝 Información Básica
            </h3>
            
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
              gap: "20px" 
            }}>
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "bold",
                  color: "#495057"
                }}>
                  Nombre del Ejercicio *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Press de banca, Sentadilla, etc."
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #dee2e6",
                    borderRadius: "8px",
                    fontSize: "16px",
                    transition: "border-color 0.3s ease",
                    backgroundColor: loading ? "#f8f9fa" : "white"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#007bff"}
                  onBlur={(e) => e.target.style.borderColor = "#dee2e6"}
                />
              </div>

              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "bold",
                  color: "#495057"
                }}>
                  Grupo Muscular Principal *
                </label>
                <select
                  value={musculo}
                  onChange={(e) => setMusculo(e.target.value)}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #dee2e6",
                    borderRadius: "8px",
                    fontSize: "16px",
                    backgroundColor: loading ? "#f8f9fa" : "white",
                    cursor: loading ? "not-allowed" : "pointer"
                  }}
                >
                  <option value="">Seleccione un músculo...</option>
                  {musculosDisponibles.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: "20px" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                fontWeight: "bold",
                color: "#495057"
              }}>
                Descripción (Opcional)
              </label>
              <textarea
                placeholder="Describe la técnica, equipamiento necesario, o cualquier nota importante..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                disabled={loading}
                rows="3"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #dee2e6",
                  borderRadius: "8px",
                  fontSize: "16px",
                  resize: "vertical",
                  fontFamily: "inherit",
                  backgroundColor: loading ? "#f8f9fa" : "white"
                }}
                onFocus={(e) => e.target.style.borderColor = "#007bff"}
                onBlur={(e) => e.target.style.borderColor = "#dee2e6"}
              />
            </div>
          </div>

          {/* Parámetros de entrenamiento */}
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ 
              margin: "0 0 20px 0", 
              color: "#1f4f63",
              borderBottom: "2px solid #28a745",
              paddingBottom: "10px"
            }}>
              🎯 Parámetros de Entrenamiento
            </h3>
            
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
              gap: "20px" 
            }}>
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "bold",
                  color: "#495057"
                }}>
                  Peso Máximo (kg) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="500"
                  placeholder="Ej: 80"
                  value={pesoMaximo}
                  onChange={(e) => setPesoMaximo(e.target.value)}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #dee2e6",
                    borderRadius: "8px",
                    fontSize: "16px",
                    backgroundColor: loading ? "#f8f9fa" : "white"
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "bold",
                  color: "#495057"
                }}>
                  Repeticiones Máximas *
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  placeholder="Ej: 10"
                  value={repeticionesMaximas}
                  onChange={(e) => setRepeticionesMaximas(e.target.value)}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #dee2e6",
                    borderRadius: "8px",
                    fontSize: "16px",
                    backgroundColor: loading ? "#f8f9fa" : "white"
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "bold",
                  color: "#495057"
                }}>
                  Sets Máximos *
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  placeholder="Ej: 4"
                  value={setsMaximos}
                  onChange={(e) => setSetsMaximos(e.target.value)}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #dee2e6",
                    borderRadius: "8px",
                    fontSize: "16px",
                    backgroundColor: loading ? "#f8f9fa" : "white"
                  }}
                />
              </div>
            </div>

            {/* Información calculada */}
            {pesoMaximo && repeticionesMaximas && setsMaximos && (
              <div style={{
                marginTop: "20px",
                backgroundColor: "#f8f9fa",
                padding: "15px",
                borderRadius: "8px",
                border: "1px solid #dee2e6"
              }}>
                <h5 style={{ margin: "0 0 10px 0", color: "#495057" }}>
                  📊 Información Calculada:
                </h5>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
                  gap: "15px",
                  fontSize: "14px"
                }}>
                  <div>
                    <strong>Volumen Máximo:</strong><br />
                    <span style={{ color: "#007bff", fontWeight: "bold" }}>
                      {calcularVolumenEstimado().toFixed(0)} kg×reps×sets
                    </span>
                  </div>
                  <div>
                    <strong>Categoría:</strong><br />
                    <span style={{ color: "#28a745", fontWeight: "bold" }}>
                      {musculo ? categorizarEjercicio(musculo) : "Sin clasificar"}
                    </span>
                  </div>
                  <div>
                    <strong>1RM Estimado:</strong><br />
                    <span style={{ color: "#ffc107", fontWeight: "bold" }}>
                      {(parseFloat(pesoMaximo) * 1.15 || 0).toFixed(1)} kg
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Información importante */}
          <div style={{
            backgroundColor: "#fff3cd",
            border: "1px solid #ffeaa7",
            borderRadius: "8px",
            padding: "15px",
            marginBottom: "30px"
          }}>
            <h4 style={{ margin: "0 0 10px 0", color: "#856404" }}>
              💡 Consejos para registrar ejercicios:
            </h4>
            <ul style={{ margin: "0", paddingLeft: "20px", color: "#856404", fontSize: "14px" }}>
              <li><strong>Peso máximo:</strong> El peso más alto que puedes manejar con buena técnica</li>
              <li><strong>Repeticiones máximas:</strong> Las repeticiones que puedes hacer con ese peso máximo</li>
              <li><strong>Sets máximos:</strong> El número máximo de series que realizas normalmente</li>
              <li><strong>Sé conservador:</strong> Es mejor empezar con valores menores y ajustar después</li>
            </ul>
          </div>

          {/* Botones de acción */}
          <div style={{ 
            display: "flex", 
            gap: "15px", 
            justifyContent: "center",
            flexWrap: "wrap"
          }}>
            <button
              onClick={registrarEjercicio}
              disabled={loading || !nombre || !musculo || !pesoMaximo || !repeticionesMaximas || !setsMaximos}
              style={{
                padding: "15px 30px",
                backgroundColor: (loading || !nombre || !musculo || !pesoMaximo || !repeticionesMaximas || !setsMaximos) ? 
                               "#6c757d" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: "25px",
                fontSize: "18px",
                fontWeight: "bold",
                cursor: (loading || !nombre || !musculo || !pesoMaximo || !repeticionesMaximas || !setsMaximos) ? 
                       "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                boxShadow: (loading || !nombre || !musculo || !pesoMaximo || !repeticionesMaximas || !setsMaximos) ? 
                          "none" : "0 4px 15px rgba(40, 167, 69, 0.3)",
                minWidth: "200px"
              }}
              onMouseOver={(e) => {
                if (!loading && nombre && musculo && pesoMaximo && repeticionesMaximas && setsMaximos) {
                  e.target.style.backgroundColor = "#218838";
                  e.target.style.transform = "translateY(-2px)";
                }
              }}
              onMouseOut={(e) => {
                if (!loading && nombre && musculo && pesoMaximo && repeticionesMaximas && setsMaximos) {
                  e.target.style.backgroundColor = "#28a745";
                  e.target.style.transform = "translateY(0)";
                }
              }}
            >
              {loading ? "⏳ Registrando..." : "💾 Registrar Ejercicio"}
            </button>

            <button
              onClick={limpiarFormulario}
              disabled={loading}
              style={{
                padding: "15px 30px",
                backgroundColor: "transparent",
                color: "#ffc107",
                border: "2px solid #ffc107",
                borderRadius: "25px",
                fontSize: "18px",
                fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.3s ease"
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = "#ffc107";
                  e.target.style.color = "white";
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.color = "#ffc107";
                }
              }}
            >
              🗑️ Limpiar Formulario
            </button>

            <button
              onClick={() => setCurrentView("menuRutina")}
              disabled={loading}
              style={{
                padding: "15px 30px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "25px",
                fontSize: "18px",
                fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.3s ease"
              }}
              onMouseOver={(e) => {
                if (!loading) e.target.style.backgroundColor = "#545b62";
              }}
              onMouseOut={(e) => {
                if (!loading) e.target.style.backgroundColor = "#6c757d";
              }}
            >
              ← Regresar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrarEjercicio;