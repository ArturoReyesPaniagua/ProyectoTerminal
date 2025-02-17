import React, { useState, useEffect, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { collection, getDocs, addDoc, setDoc, doc, deleteDoc } from "firebase/firestore";
import { db, auth } from "../../firebase-config";
import { onAuthStateChanged } from "firebase/auth";

const GestorRutinas = () => {
  const [userId, setUserId] = useState(null);
  const [listaIzquierda, setListaIzquierda] = useState([]); // Ejercicios disponibles
  const [listaDerecha, setListaDerecha] = useState([]); // Ejercicios seleccionados
  const [rutinaSeleccionada, setRutinaSeleccionada] = useState(null);
  const [rutinas, setRutinas] = useState([]);
  const [mostrarModalNuevaRutina, setMostrarModalNuevaRutina] = useState(false);
  const [mostrarModalNuevoEjercicio, setMostrarModalNuevoEjercicio] = useState(false);

  const cargarDatos = useCallback(async (uid) => {
    try {
      const ejerciciosSnapshot = await getDocs(collection(db, `Usuarios/${uid}/ejercicios`));
      const ejercicios = ejerciciosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const rutinasSnapshot = await getDocs(collection(db, `Usuarios/${uid}/rutinas`));
      const rutinasCargadas = rutinasSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRutinas(rutinasCargadas);

      if (rutinaSeleccionada) {
        const rutinaActual = rutinasCargadas.find((rutina) => rutina.id === rutinaSeleccionada);

        const ejerciciosSeleccionados = ejercicios.filter((ejercicio) =>
          rutinaActual?.ejercicios.includes(ejercicio.id)
        );
        const ejerciciosDisponibles = ejercicios.filter(
          (ejercicio) => !rutinaActual?.ejercicios.includes(ejercicio.id)
        );

        setListaIzquierda(ejerciciosDisponibles);
        setListaDerecha(ejerciciosSeleccionados);
      } else {
        setListaIzquierda(ejercicios);
        setListaDerecha([]);
      }
    } catch (error) {
      console.error("Error al cargar datos: ", error);
    }
  }, [rutinaSeleccionada]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        cargarDatos(user.uid);
      } else {
        setUserId(null);
      }
    });

    return () => unsubscribe();
  }, [cargarDatos]);

  const moverADerecha = (ejercicio) => {
    setListaIzquierda(listaIzquierda.filter((item) => item.id !== ejercicio.id));
    setListaDerecha([...listaDerecha, ejercicio]);
  };

  const moverAIzquierda = (ejercicio) => {
    setListaDerecha(listaDerecha.filter((item) => item.id !== ejercicio.id));
    setListaIzquierda([...listaIzquierda, ejercicio]);
  };

  const guardarRutina = async () => {
    if (!rutinaSeleccionada || !userId) {
      alert("Selecciona una rutina primero.");
      return;
    }

    try {
      await setDoc(doc(db, `Usuarios/${userId}/rutinas`, rutinaSeleccionada), {
        nombre: rutinas.find((rutina) => rutina.id === rutinaSeleccionada).nombre,
        ejercicios: listaDerecha.map((ejercicio) => ejercicio.id),
      });
      alert("Rutina guardada correctamente.");
    } catch (error) {
      console.error("Error al guardar la rutina: ", error);
    }
  };

  const agregarNuevaRutina = async (nombreRutina) => {
    if (!userId) return;

    try {
      const nuevaRutinaRef = await addDoc(collection(db, `Usuarios/${userId}/rutinas`), {
        nombre: nombreRutina,
        ejercicios: [],
      });
      setRutinas([...rutinas, { id: nuevaRutinaRef.id, nombre: nombreRutina, ejercicios: [] }]);
      setRutinaSeleccionada(nuevaRutinaRef.id);
      alert(`Rutina "${nombreRutina}" creada exitosamente.`);
    } catch (error) {
      console.error("Error al crear la nueva rutina: ", error);
    }
  };

  const eliminarRutina = async (rutinaId) => {
    if (!userId) return;

    try {
      await deleteDoc(doc(db, `Usuarios/${userId}/rutinas`, rutinaId));
      setRutinas(rutinas.filter((rutina) => rutina.id !== rutinaId));
      alert("Rutina eliminada correctamente.");
    } catch (error) {
      console.error("Error al eliminar la rutina: ", error);
    }
  };

  const agregarEjercicio = async (nombre, musculo, pesoMaximo, repeticionesMaximas) => {
    if (!userId) return;

    try {
      const nuevoEjercicio = {
        nombre,
        musculo,
        pesoMaximo,
        repeticionesMaximas,
      };
      const ejercicioRef = doc(collection(db, `Usuarios/${userId}/ejercicios`));
      await setDoc(ejercicioRef, nuevoEjercicio);
      setListaIzquierda([...listaIzquierda, { id: ejercicioRef.id, ...nuevoEjercicio }]);
      alert(`Ejercicio "${nombre}" agregado correctamente.`);
    } catch (error) {
      console.error("Error al agregar el ejercicio: ", error);
    }
  };

  return (
    <div className="container mt-4">
      <div className="row mb-3">
        <div className="col-md-6">
          <select
            className="form-select"
            onChange={(e) => {
              setRutinaSeleccionada(e.target.value);
              cargarDatos(userId);
            }}
            value={rutinaSeleccionada || ""}
          >
            <option value="">Selecciona una rutina</option>
            {rutinas.map((rutina) => (
              <option key={rutina.id} value={rutina.id}>
                {rutina.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <button className="btn btn-primary w-100" onClick={guardarRutina}>
            Guardar
          </button>
        </div>
        <div className="col-md-3">
          <button
            className="btn btn-success w-100"
            onClick={() => setMostrarModalNuevaRutina(true)}
          >
            Nueva Rutina
          </button>
          <button
            className="btn btn-danger w-100 mt-2"
            onClick={() => eliminarRutina(rutinaSeleccionada)}
            disabled={!rutinaSeleccionada}
          >
            Eliminar Rutina
          </button>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <h5 className="text-center">Ejercicios Disponibles</h5>
          <div className="list-group">
            {listaIzquierda.map((ejercicio) => (
              <div
                key={ejercicio.id}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                {ejercicio.nombre}
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => moverADerecha(ejercicio)}
                >
                  &rarr;
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="col-md-6">
          <h5 className="text-center">Ejercicios Seleccionados</h5>
          <div className="list-group">
            {listaDerecha.map((ejercicio) => (
              <div
                key={ejercicio.id}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => moverAIzquierda(ejercicio)}
                >
                  &larr;
                </button>
                {ejercicio.nombre}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="row mt-3">
        <div className="col-md-6">
          <button
            className="btn btn-success w-100"
            onClick={() => setMostrarModalNuevoEjercicio(true)}
          >
            Nuevo Ejercicio
          </button>
        </div>
      </div>

      {mostrarModalNuevaRutina && (
        <ModalNuevaRutina
          onCerrar={() => setMostrarModalNuevaRutina(false)}
          onGuardar={agregarNuevaRutina}
        />
      )}

      {mostrarModalNuevoEjercicio && (
        <ModalNuevoEjercicio
          onCerrar={() => setMostrarModalNuevoEjercicio(false)}
          onGuardar={agregarEjercicio}
        />
      )}
    </div>
  );
};

const ModalNuevaRutina = ({ onCerrar, onGuardar }) => {
  const [nombreRutina, setNombreRutina] = useState("");

  const manejarSubmit = (e) => {
    e.preventDefault();
    if (!nombreRutina.trim()) {
      alert("El nombre de la rutina no puede estar vacío.");
      return;
    }

    onGuardar(nombreRutina);
    onCerrar();
  };

  return (
    <div className="modal show d-block" tabIndex="-1" role="dialog">
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Nueva Rutina</h5>
            <button type="button" className="btn-close" onClick={onCerrar}></button>
          </div>
          <div className="modal-body">
            <form onSubmit={manejarSubmit}>
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nombre de la rutina"
                  value={nombreRutina}
                  onChange={(e) => setNombreRutina(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Crear Rutina
              </button>
              <button
                type="button"
                className="btn btn-danger ms-2"
                onClick={onCerrar}
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const ModalNuevoEjercicio = ({ onCerrar, onGuardar }) => {
  const [nombre, setNombre] = useState("");
  const [musculo, setMusculo] = useState("");
  const [pesoMaximo, setPesoMaximo] = useState("");
  const [repeticionesMaximas, setRepeticionesMaximas] = useState("");

  const manejarSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim() || !musculo.trim() || !pesoMaximo || !repeticionesMaximas) {
      alert("Todos los campos son obligatorios.");
      return;
    }

    onGuardar(nombre, musculo, parseFloat(pesoMaximo), parseInt(repeticionesMaximas));
    onCerrar();
  };

  return (
    <div className="modal show d-block" tabIndex="-1" role="dialog">
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Nuevo Ejercicio</h5>
            <button type="button" className="btn-close" onClick={onCerrar}></button>
          </div>
          <div className="modal-body">
            <form onSubmit={manejarSubmit}>
              <div className="mb-3">
                <label htmlFor="nombre" className="form-label">
                  Nombre del Ejercicio
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="musculo" className="form-label">
                  Músculo Asociado
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="musculo"
                  value={musculo}
                  onChange={(e) => setMusculo(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="pesoMaximo" className="form-label">
                  Peso Máximo (kg)
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="pesoMaximo"
                  value={pesoMaximo}
                  onChange={(e) => setPesoMaximo(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="repeticionesMaximas" className="form-label">
                  Repeticiones Máximas
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="repeticionesMaximas"
                  value={repeticionesMaximas}
                  onChange={(e) => setRepeticionesMaximas(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Guardar Ejercicio
              </button>
              <button
                type="button"
                className="btn btn-danger ms-2"
                onClick={onCerrar}
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestorRutinas;
