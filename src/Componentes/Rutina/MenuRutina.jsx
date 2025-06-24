import React, { useState, useEffect } from "react";
import { db } from "../../firebase-config";
import { collection, doc, getDocs, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { CargaDatos, EstadoVacio } from "../Comunes/ComponenteCarga";

const MenuRutina = ({ setCurrentView }) => {
  const [rutinas, setRutinas] = useState([]);
  const [rutinaId, setRutinaId] = useState("");
  const [nombreRutina, setNombreRutina] = useState("");
  const [ejercicios, setEjercicios] = useState([]);
  const [ejerciciosRutina, setEjerciciosRutina] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Obtener todas las rutinas
      const rutinasSnapshot = await getDocs(collection(db, "rutinas"));
      const rutinasList = rutinasSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRutinas(rutinasList);

      // Obtener todos los ejercicios
      const ejerciciosSnapshot = await getDocs(collection(db, "ejercicios"));
      const ejerciciosList = ejerciciosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Si hay una rutina seleccionada, cargar sus ejercicios
      if (rutinaId && rutinasList.length > 0) {
        const rutina = rutinasList.find(r => r.id === rutinaId);
        if (rutina) {
          cargarEjerciciosRutina(rutina, ejerciciosList);
        }
      } else if (rutinasList.length > 0) {
        // Seleccionar la primera rutina por defecto
        const primeraRutina = rutinasList[0];
        setRutinaId(primeraRutina.id);
        setNombreRutina(primeraRutina.nombre);
        cargarEjerciciosRutina(primeraRutina, ejerciciosList);
      } else {
        // No hay rutinas, mostrar todos los ejercicios como disponibles
        setEjercicios(ejerciciosList);
        setEjerciciosRutina([]);
      }
    } catch (error) {
      console.error("Error al cargar los datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const cargarEjerciciosRutina = (rutina, todosLosEjercicios) => {
    const ejerciciosIds = rutina.ejercicios || [];
    const ejerciciosEnRutina = todosLosEjercicios.filter((ej) => 
      ejerciciosIds.includes(ej.id)
    );
    const ejerciciosDisponibles = todosLosEjercicios.filter((ej) => 
      !ejerciciosIds.includes(ej.id)
    );

    setEjercicios(ejerciciosDisponibles);
    setEjerciciosRutina(ejerciciosEnRutina);
  };

  const crearNuevaRutina = async () => {
    const nombre = prompt("Ingrese el nombre de la nueva rutina:");
    if (!nombre || nombre.trim() === "") return;

    setSaving(true);
    try {
      const nuevoId = `rutina_${Date.now()}`;
      const nuevaRutina = {
        nombre: nombre.trim(),
        ejercicios: [],
        fechaCreacion: new Date().toISOString()
      };

      await setDoc(doc(db, "rutinas", nuevoId), nuevaRutina);
      
      // Actualizar estado local
      const nuevaRutinaCompleta = { id: nuevoId, ...nuevaRutina };
      setRutinas([...rutinas, nuevaRutinaCompleta]);
      setRutinaId(nuevoId);
      setNombreRutina(nombre.trim());
      setEjerciciosRutina([]);
      
      // Recargar ejercicios disponibles
      const ejerciciosSnapshot = await getDocs(collection(db, "ejercicios"));
      const ejerciciosList = ejerciciosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEjercicios(ejerciciosList);
      
      alert("Rutina creada con éxito.");
    } catch (error) {
      console.error("Error al crear la rutina:", error);
      alert("Hubo un error al crear la rutina.");
    } finally {
      setSaving(false);
    }
  };

  const eliminarRutina = async () => {
    if (!rutinaId) return;
    
    const confirmacion = window.confirm(
      `¿Estás seguro de que quieres eliminar la rutina "${nombreRutina}"? Esta acción no se puede deshacer.`
    );
    
    if (!confirmacion) return;

    setSaving(true);
    try {
      await deleteDoc(doc(db, "rutinas", rutinaId));
      
      // Actualizar estado local
      const rutinasActualizadas = rutinas.filter(r => r.id !== rutinaId);
      setRutinas(rutinasActualizadas);
      
      // Seleccionar otra rutina o limpiar
      if (rutinasActualizadas.length > 0) {
        const nuevaRutina = rutinasActualizadas[0];
        setRutinaId(nuevaRutina.id);
        setNombreRutina(nuevaRutina.nombre);
        await fetchData(); // Recargar datos
      } else {
        setRutinaId("");
        setNombreRutina("");
        setEjerciciosRutina([]);
      }
      
      alert("Rutina eliminada con éxito.");
    } catch (error) {
      console.error("Error al eliminar la rutina:", error);
      alert("Hubo un error al eliminar la rutina.");
    } finally {
      setSaving(false);
    }
  };

  const guardarRutina = async () => {
    if (!rutinaId || !nombreRutina.trim()) {
      alert("Debe tener una rutina seleccionada y un nombre válido.");
      return;
    }

    setSaving(true);
    try {
      const rutinaActualizada = {
        nombre: nombreRutina.trim(),
        ejercicios: ejerciciosRutina.map((ej) => ej.id),
        fechaActualizacion: new Date().toISOString()
      };

      await setDoc(doc(db, "rutinas", rutinaId), rutinaActualizada, { merge: true });
      
      // Actualizar estado local
      setRutinas(rutinas.map(r => 
        r.id === rutinaId 
          ? { ...r, ...rutinaActualizada }
          : r
      ));
      
      setModoEdicion(false);
      alert("Rutina guardada con éxito.");
    } catch (error) {
      console.error("Error al guardar la rutina:", error);
      alert("Hubo un error al guardar la rutina.");
    } finally {
      setSaving(false);
    }
  };

  const cambiarRutina = async (id) => {
    const rutinaSeleccionada = rutinas.find((rutina) => rutina.id === id);
    if (rutinaSeleccionada) {
      setRutinaId(rutinaSeleccionada.id);
      setNombreRutina(rutinaSeleccionada.nombre);
      
      // Recargar ejercicios para esta rutina
      const ejerciciosSnapshot = await getDocs(collection(db, "ejercicios"));
      const todosLosEjercicios = ejerciciosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      cargarEjerciciosRutina(rutinaSeleccionada, todosLosEjercicios);
    }
  };

  const agregarEjercicio = (ejercicio) => {
    setEjerciciosRutina([...ejerciciosRutina, ejercicio]);
    setEjercicios(ejercicios.filter((ej) => ej.id !== ejercicio.id));
  };

  const quitarEjercicio = (ejercicio) => {
    setEjercicios([...ejercicios, ejercicio]);
    setEjerciciosRutina(ejerciciosRutina.filter((ej) => ej.id !== ejercicio.id));
  };

  if (loading) {
    return <CargaDatos tipo="rutinas" />;
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#f8f9fa",
      padding: "20px"
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "15px",
          padding: "30px",
          marginBottom: "30px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
        }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px"
          }}>
            <div>
              <h1 style={{ 
                margin: "0 0 10px 0", 
                color: "#1f4f63",
                fontSize: "2.5rem",
                fontWeight: "bold"
              }}>
                🏋️‍♂️ Gestión de Rutinas
              </h1>
              <p style={{ margin: "0", color: "#6c757d", fontSize: "1.1rem" }}>
                Crea y personaliza tus rutinas de entrenamiento
              </p>
            </div>
            
            <button
              onClick={() => setCurrentView("menuPrincipal")}
              style={{
                padding: "12px 24px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "25px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = "#545b62"}
              onMouseOut={(e) => e.target.style.backgroundColor = "#6c757d"}
            >
              ← Regresar al Menú
            </button>
          </div>
        </div>

        {/* Control de rutinas */}
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
            Seleccionar Rutina
          </h3>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "15px",
            alignItems: "end"
          }}>
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                fontWeight: "bold",
                color: "#495057"
              }}>
                Rutina Actual:
              </label>
              <select
                value={rutinaId}
                onChange={(e) => cambiarRutina(e.target.value)}
                disabled={saving}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #dee2e6",
                  borderRadius: "8px",
                  fontSize: "16px",
                  backgroundColor: saving ? "#f8f9fa" : "white",
                  cursor: saving ? "not-allowed" : "pointer"
                }}
              >
                <option value="">Seleccione una rutina</option>
                {rutinas.map((rutina) => (
                  <option key={rutina.id} value={rutina.id}>
                    {rutina.nombre} ({rutina.ejercicios?.length || 0} ejercicios)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                fontWeight: "bold",
                color: "#495057"
              }}>
                Nombre de la Rutina:
              </label>
              <input
                type="text"
                value={nombreRutina}
                onChange={(e) => {
                  setNombreRutina(e.target.value);
                  setModoEdicion(true);
                }}
                disabled={!rutinaId || saving}
                placeholder="Nombre de la rutina"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: modoEdicion ? "2px solid #ffc107" : "2px solid #dee2e6",
                  borderRadius: "8px",
                  fontSize: "16px",
                  backgroundColor: (!rutinaId || saving) ? "#f8f9fa" : "white"
                }}
              />
            </div>

            <button
              onClick={crearNuevaRutina}
              disabled={saving}
              style={{
                padding: "12px 20px",
                backgroundColor: saving ? "#6c757d" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: saving ? "not-allowed" : "pointer",
                transition: "all 0.3s ease"
              }}
              onMouseOver={(e) => {
                if (!saving) e.target.style.backgroundColor = "#218838";
              }}
              onMouseOut={(e) => {
                if (!saving) e.target.style.backgroundColor = "#28a745";
              }}
            >
              {saving ? "⏳" : "+"} Nueva Rutina
            </button>
          </div>
        </div>

        {rutinas.length === 0 ? (
          <EstadoVacio
            icono="🏋️‍♂️"
            titulo="No hay rutinas creadas"
            descripcion="Crea tu primera rutina para comenzar a entrenar"
            accionPrincipal={{
              texto: "+ Crear Primera Rutina",
              onClick: crearNuevaRutina
            }}
            accionSecundaria={{
              texto: "Crear Ejercicios Primero",
              onClick: () => setCurrentView("registrarEjercicio")
            }}
          />
        ) : (
          <>
            {/* Gestión de ejercicios */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "30px",
              marginBottom: "30px"
            }}>
              {/* Ejercicios disponibles */}
              <div style={{
                backgroundColor: "white",
                borderRadius: "15px",
                padding: "25px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
              }}>
                <h3 style={{ 
                  margin: "0 0 20px 0", 
                  color: "#1f4f63",
                  borderBottom: "2px solid #17a2b8",
                  paddingBottom: "10px"
                }}>
                  📚 Ejercicios Disponibles ({ejercicios.length})
                </h3>
                
                {ejercicios.length === 0 ? (
                  <div style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    color: "#6c757d"
                  }}>
                    <div style={{ fontSize: "48px", marginBottom: "15px" }}>💪</div>
                    <p>Todos los ejercicios están en la rutina actual</p>
                    <button
                      onClick={() => setCurrentView("registrarEjercicio")}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "20px",
                        fontSize: "14px",
                        cursor: "pointer",
                        marginTop: "10px"
                      }}
                    >
                     + Registrar Ejercicio
                    </button>
                  </div>
                ) : (
                  <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                    {ejercicios.map((ej) => (
                      <div
                        key={ej.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "15px",
                          marginBottom: "10px",
                          border: "1px solid #dee2e6",
                          borderRadius: "8px",
                          backgroundColor: "#f8f9fa",
                          transition: "all 0.3s ease"
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = "#e9ecef";
                          e.currentTarget.style.borderColor = "#17a2b8";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = "#f8f9fa";
                          e.currentTarget.style.borderColor = "#dee2e6";
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: "bold", color: "#495057" }}>
                            {ej.nombre}
                          </div>
                          <div style={{ fontSize: "12px", color: "#6c757d" }}>
                            {ej.musculo} • Max: {ej.pesoMaximo}kg
                          </div>
                        </div>
                        <button
                          onClick={() => agregarEjercicio(ej)}
                          disabled={!rutinaId || saving}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: (!rutinaId || saving) ? "#6c757d" : "#17a2b8",
                            color: "white",
                            border: "none",
                            borderRadius: "15px",
                            fontSize: "14px",
                            fontWeight: "bold",
                            cursor: (!rutinaId || saving) ? "not-allowed" : "pointer",
                            transition: "all 0.3s ease"
                          }}
                          onMouseOver={(e) => {
                            if (rutinaId && !saving) e.target.style.backgroundColor = "#138496";
                          }}
                          onMouseOut={(e) => {
                            if (rutinaId && !saving) e.target.style.backgroundColor = "#17a2b8";
                          }}
                        >
                          + Agregar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ejercicios en la rutina */}
              <div style={{
                backgroundColor: "white",
                borderRadius: "15px",
                padding: "25px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
              }}>
                <h3 style={{ 
                  margin: "0 0 20px 0", 
                  color: "#1f4f63",
                  borderBottom: "2px solid #28a745",
                  paddingBottom: "10px"
                }}>
                  🎯 Ejercicios en la Rutina ({ejerciciosRutina.length})
                </h3>
                
                {ejerciciosRutina.length === 0 ? (
                  <div style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    color: "#6c757d"
                  }}>
                    <div style={{ fontSize: "48px", marginBottom: "15px" }}>📝</div>
                    <p>
                      {rutinaId 
                        ? "Agrega ejercicios a esta rutina" 
                        : "Selecciona una rutina primero"
                      }
                    </p>
                  </div>
                ) : (
                  <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                    {ejerciciosRutina.map((ej, index) => (
                      <div
                        key={ej.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "15px",
                          marginBottom: "10px",
                          border: "1px solid #28a745",
                          borderRadius: "8px",
                          backgroundColor: "#f8fff8",
                          transition: "all 0.3s ease"
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = "#e6ffed";
                          e.currentTarget.style.borderColor = "#20c997";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = "#f8fff8";
                          e.currentTarget.style.borderColor = "#28a745";
                        }}
                      >
                        <div>
                          <div style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "10px" 
                          }}>
                            <span style={{
                              backgroundColor: "#28a745",
                              color: "white",
                              borderRadius: "50%",
                              width: "24px",
                              height: "24px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              fontWeight: "bold"
                            }}>
                              {index + 1}
                            </span>
                            <div>
                              <div style={{ fontWeight: "bold", color: "#495057" }}>
                                {ej.nombre}
                              </div>
                              <div style={{ fontSize: "12px", color: "#6c757d" }}>
                                {ej.musculo} • Max: {ej.pesoMaximo}kg
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => quitarEjercicio(ej)}
                          disabled={saving}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: saving ? "#6c757d" : "#dc3545",
                            color: "white",
                            border: "none",
                            borderRadius: "15px",
                            fontSize: "14px",
                            fontWeight: "bold",
                            cursor: saving ? "not-allowed" : "pointer",
                            transition: "all 0.3s ease"
                          }}
                          onMouseOver={(e) => {
                            if (!saving) e.target.style.backgroundColor = "#c82333";
                          }}
                          onMouseOut={(e) => {
                            if (!saving) e.target.style.backgroundColor = "#dc3545";
                          }}
                        >
                          - Eliminar ejercicio
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Botones de acción */}
            <div style={{
              backgroundColor: "white",
              borderRadius: "15px",
              padding: "25px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
            }}>
              <div style={{ 
                display: "flex", 
                gap: "15px", 
                justifyContent: "center",
                flexWrap: "wrap"
              }}>
                <button
                  onClick={guardarRutina}
                  disabled={!rutinaId || saving || !modoEdicion}
                  style={{
                    padding: "15px 30px",
                    backgroundColor: (!rutinaId || saving || !modoEdicion) ? "#6c757d" : "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "25px",
                    fontSize: "18px",
                    fontWeight: "bold",
                    cursor: (!rutinaId || saving || !modoEdicion) ? "not-allowed" : "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: (!rutinaId || saving || !modoEdicion) ? "none" : "0 4px 15px rgba(0, 123, 255, 0.3)"
                  }}
                  onMouseOver={(e) => {
                    if (rutinaId && !saving && modoEdicion) {
                      e.target.style.backgroundColor = "#0056b3";
                      e.target.style.transform = "translateY(-2px)";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (rutinaId && !saving && modoEdicion) {
                      e.target.style.backgroundColor = "#007bff";
                      e.target.style.transform = "translateY(0)";
                    }
                  }}
                >
                  {saving ? "⏳ Guardando..." : modoEdicion ? "💾 Guardar Cambios" : "✓ Sin Cambios"}
                </button>

                <button
                  onClick={() => setCurrentView("registrarEjercicio")}
                  disabled={saving}
                  style={{
                    padding: "15px 30px",
                    backgroundColor: saving ? "#6c757d" : "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "25px",
                    fontSize: "18px",
                    fontWeight: "bold",
                    cursor: saving ? "not-allowed" : "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: saving ? "none" : "0 4px 15px rgba(40, 167, 69, 0.3)"
                  }}
                  onMouseOver={(e) => {
                    if (!saving) {
                      e.target.style.backgroundColor = "#218838";
                      e.target.style.transform = "translateY(-2px)";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!saving) {
                      e.target.style.backgroundColor = "#28a745";
                      e.target.style.transform = "translateY(0)";
                    }
                  }}
                >
                  ➕ Registrar Ejercicio
                </button>

                {rutinaId && (
                  <button
                    onClick={eliminarRutina}
                    disabled={saving}
                    style={{
                      padding: "15px 30px",
                      backgroundColor: saving ? "#6c757d" : "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "25px",
                      fontSize: "18px",
                      fontWeight: "bold",
                      cursor: saving ? "not-allowed" : "pointer",
                      transition: "all 0.3s ease",
                      boxShadow: saving ? "none" : "0 4px 15px rgba(220, 53, 69, 0.3)"
                    }}
                    onMouseOver={(e) => {
                      if (!saving) {
                        e.target.style.backgroundColor = "#c82333";
                        e.target.style.transform = "translateY(-2px)";
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!saving) {
                        e.target.style.backgroundColor = "#dc3545";
                        e.target.style.transform = "translateY(0)";
                      }
                    }}
                  >
                    🗑️ Eliminar Rutina
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MenuRutina;