import React, { useState, useEffect } from "react";
import { db } from "../../firebase-config";
import { collection, doc, getDocs, setDoc, getDoc } from "firebase/firestore";

const MenuRutina = ({ setCurrentView }) => {
  const [rutinas, setRutinas] = useState([]); // Todas las rutinas disponibles
  const [rutinaId, setRutinaId] = useState("rutina_a"); // ID de la rutina actual
  const [nombreRutina, setNombreRutina] = useState("Rutina A"); // Nombre de la rutina actual
  const [ejercicios, setEjercicios] = useState([]); // Ejercicios no asignados
  const [ejerciciosRutina, setEjerciciosRutina] = useState([]); // Ejercicios asignados

  // Cargar rutinas y ejercicios al iniciar
  useEffect(() => {
    const fetchData = async () => {
      try {
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

        // Obtener la rutina actual
        const rutinaDocRef = doc(db, "rutinas", rutinaId);
        const rutinaDoc = await getDoc(rutinaDocRef);
        const rutinaData = rutinaDoc.exists() ? rutinaDoc.data() : { ejercicios: [] };

        // Dividir ejercicios
        const ejerciciosEnRutina = ejerciciosList.filter((ej) => rutinaData.ejercicios.includes(ej.id));
        const ejerciciosDisponibles = ejerciciosList.filter((ej) => !rutinaData.ejercicios.includes(ej.id));

        setEjercicios(ejerciciosDisponibles);
        setEjerciciosRutina(ejerciciosEnRutina);
      } catch (error) {
        console.error("Error al cargar los datos:", error);
      }
    };

    fetchData();
  }, [rutinaId]);

  // Crear una nueva rutina
  const crearRutina = async () => {
    const nuevoNombre = prompt("Ingrese el nombre de la nueva rutina:");
    if (!nuevoNombre) return;

    const nuevoId = `rutina_${Date.now()}`; // Generar un ID único
    try {
      await setDoc(doc(db, "rutinas", nuevoId), {
        nombre: nuevoNombre,
        ejercicios: [],
      });
      alert("Rutina creada con éxito.");
      setRutinaId(nuevoId);
      setNombreRutina(nuevoNombre);
      setEjerciciosRutina([]);
    } catch (error) {
      console.error("Error al crear la rutina:", error);
      alert("Hubo un error al crear la rutina.");
    }
  };

  // Guardar cambios en la rutina
  const guardarRutina = async () => {
    try {
      await setDoc(doc(db, "rutinas", rutinaId), {
        nombre: nombreRutina,
        ejercicios: ejerciciosRutina.map((ej) => ej.id),
      });
      alert("Rutina guardada con éxito.");
    } catch (error) {
      console.error("Error al guardar la rutina:", error);
      alert("Hubo un error al guardar la rutina.");
    }
  };

  // Cambiar a otra rutina
  const cambiarRutina = (id) => {
    const rutinaSeleccionada = rutinas.find((rutina) => rutina.id === id);
    if (rutinaSeleccionada) {
      setRutinaId(rutinaSeleccionada.id);
      setNombreRutina(rutinaSeleccionada.nombre);
    }
  };

  // Agregar un ejercicio a la rutina
  const agregarEjercicio = (ejercicio) => {
    setEjerciciosRutina([...ejerciciosRutina, ejercicio]);
    setEjercicios(ejercicios.filter((ej) => ej.id !== ejercicio.id));
  };

  // Quitar un ejercicio de la rutina
  const quitarEjercicio = (ejercicio) => {
    setEjercicios([...ejercicios, ejercicio]);
    setEjerciciosRutina(ejerciciosRutina.filter((ej) => ej.id !== ejercicio.id));
  };

  return (
    <div>
      <h1>Menú de Rutinas</h1>
      {/* Selector de rutina */}
      <div>
        <label>Seleccionar Rutina:</label>
        <select
          value={rutinaId}
          onChange={(e) => cambiarRutina(e.target.value)}
        >
          {rutinas.map((rutina) => (
            <option key={rutina.id} value={rutina.id}>
              {rutina.nombre}
            </option>
          ))}
        </select>
        <button onClick={crearRutina}>Nueva Rutina</button>
      </div>

      {/* Listas de ejercicios */}
      <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
        {/* Ejercicios disponibles */}
        <div>
          <h3>Ejercicios Disponibles</h3>
          <ul>
            {ejercicios.map((ej) => (
              <li key={ej.id}>
                {ej.nombre} - {ej.musculo}
                <button onClick={() => agregarEjercicio(ej)}>Agregar</button>
              </li>
            ))}
          </ul>
        </div>

        {/* Ejercicios en la rutina */}
        <div>
          <h3>Ejercicios en la Rutina</h3>
          <ul>
            {ejerciciosRutina.map((ej) => (
              <li key={ej.id}>
                {ej.nombre} - {ej.musculo}
                <button onClick={() => quitarEjercicio(ej)}>Quitar</button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Botones de acción */}
      <div style={{ marginTop: "20px" }}>
        <button onClick={guardarRutina}>Guardar Rutina</button>
        <button onClick={() => setCurrentView("registrarEjercicio")}>Nuevo Ejercicio</button>
        <button onClick={() => setCurrentView("menuPrincipal")}>Regresar</button>
      </div>
    </div>
  );
};

export default MenuRutina;
