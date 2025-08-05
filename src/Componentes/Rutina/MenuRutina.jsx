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






//la función cambiarRutina para resetear el modo edición
const cambiarRutina = async (id) => {
  const rutinaSeleccionada = rutinas.find((rutina) => rutina.id === id);
  if (rutinaSeleccionada) {
    setRutinaId(rutinaSeleccionada.id);
    setNombreRutina(rutinaSeleccionada.nombre);
    setModoEdicion(false); // ✅ Resetear modo edición
    
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
  setModoEdicion(true); // ✅ Activar modo edición
};


const quitarEjercicio = (ejercicio) => {
  setEjercicios([...ejercicios, ejercicio]);
  setEjerciciosRutina(ejerciciosRutina.filter((ej) => ej.id !== ejercicio.id));
  setModoEdicion(true); // ✅ Activar modo edición
};

  if (loading) {
    return <CargaDatos tipo="rutinas" />;
  }

  return (
    <div className="rutinas-container">
      <div className="rutinas-content">
        {/* Header */}
        <div className="section-header">
          <div className="section-header-content">
            <div>
              <h1 className="section-title">
                🏋️‍♂️ Gestión de Rutinas
              </h1>
              <p className="section-subtitle">
                Crea y personaliza tus rutinas de entrenamiento
              </p>
            </div>
            
            <button
              onClick={() => setCurrentView("menuPrincipal")}
              className="boton-cancelar"
            >
              ← Regresar al Menú
            </button>
          </div>
        </div>

        {/* Control de rutinas */}
        <div className="rutina-control">
          <h3 className="rutina-control-title">
            Seleccionar Rutina
          </h3>
          
          <div className="rutina-control-grid">
            <div className="form-field">
              <label>
                Rutina Actual:
              </label>
              <select
                value={rutinaId}
                onChange={(e) => cambiarRutina(e.target.value)}
                disabled={saving}
                className="select-rutina"
              >
                <option value="">Seleccione una rutina</option>
                {rutinas.map((rutina) => (
                  <option key={rutina.id} value={rutina.id}>
                    {rutina.nombre} ({rutina.ejercicios?.length || 0} ejercicios)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>
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
                className={`input-rutina ${modoEdicion ? 'edited' : ''}`}
              />
            </div>

            <button
              onClick={crearNuevaRutina}
              disabled={saving}
              className="btn-nueva-rutina"
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
            <div className="ejercicios-grid">
              {/* Ejercicios disponibles */}
              <div className="ejercicios-panel">
                <h3 className="ejercicios-panel-header">
                  📚 Ejercicios Disponibles ({ejercicios.length})
                </h3>
                
                {ejercicios.length === 0 ? (
                  <div className="estado-vacio-ejercicios">
                    <div className="estado-vacio-icono">💪</div>
                    <p>Todos los ejercicios están en la rutina actual</p>
                    <button
                      onClick={() => setCurrentView("registrarEjercicio")}
                      className="btn-crear-ejercicio-small"
                    >
                     + Registrar Ejercicio
                    </button>
                  </div>
                ) : (
                  <div className="ejercicios-lista">
                    {ejercicios.map((ej) => (
                      <div
                        key={ej.id}
                        className="ejercicio-item"
                      >
                        <div>
                          <div className="ejercicio-nombre">
                            {ej.nombre}
                          </div>
                          <div className="ejercicio-detalles">
                            {ej.musculo} • Max: {ej.pesoMaximo}kg
                          </div>
                        </div>
                        <button
                          onClick={() => agregarEjercicio(ej)}
                          disabled={!rutinaId || saving}
                          className="btn-ejercicio agregar"
                        >
                          + Agregar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ejercicios en la rutina */}
              <div className="ejercicios-panel">
                <h3 className="ejercicios-panel-header rutina">
                  🎯 Ejercicios en la Rutina ({ejerciciosRutina.length})
                </h3>
                
                {ejerciciosRutina.length === 0 ? (
                  <div className="estado-vacio-ejercicios">
                    <div className="estado-vacio-icono">📝</div>
                    <p>
                      {rutinaId 
                        ? "Agrega ejercicios a esta rutina" 
                        : "Selecciona una rutina primero"
                      }
                    </p>
                  </div>
                ) : (
                  <div className="ejercicios-lista">
                    {ejerciciosRutina.map((ej, index) => (
                      <div
                        key={ej.id}
                        className="ejercicio-item en-rutina"
                      >
                        <div className="ejercicio-info">
                          <span className="ejercicio-numero">
                            {index + 1}
                          </span>
                          <div>
                            <div className="ejercicio-nombre">
                              {ej.nombre}
                            </div>
                            <div className="ejercicio-detalles">
                              {ej.musculo} • Max: {ej.pesoMaximo}kg
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => quitarEjercicio(ej)}
                          disabled={saving}
                          className="btn-ejercicio quitar"
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
            <div className="acciones-panel">
              <div className="acciones-container">
                <button
                  onClick={guardarRutina}
                  disabled={!rutinaId || saving || !modoEdicion}
                  className="btn-accion guardar"
                >
                  {saving ? "⏳ Guardando..." : modoEdicion ? "💾 Guardar Cambios" : "✓ Sin Cambios"}
                </button>

                <button
                  onClick={() => setCurrentView("registrarEjercicio")}
                  disabled={saving}
                  className="btn-accion crear"
                >
                  ➕ Registrar Ejercicio
                </button>

                {rutinaId && (
                  <button
                    onClick={eliminarRutina}
                    disabled={saving}
                    className="btn-accion eliminar"
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





