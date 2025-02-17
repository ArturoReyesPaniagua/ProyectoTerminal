import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { collection, doc, getDoc, getDocs, addDoc, query, orderBy } from "firebase/firestore";
import { db, auth } from "../../firebase-config";
import { onAuthStateChanged } from "firebase/auth";


const RegistroRutina = () => {
  const [userId, setUserId] = useState(null);
  const [rutinas, setRutinas] = useState([]);
  const [rutinaSeleccionada, setRutinaSeleccionada] = useState(null);
  const [ejercicios, setEjercicios] = useState([]);
  const [ejercicioActual, setEjercicioActual] = useState(null);
  const [volumenTotalRutina, setVolumenTotalRutina] = useState(0);
  const [volumenActualEjercicio, setVolumenActualEjercicio] = useState(0);
  const [volumenMaximoEjercicio, setVolumenMaximoEjercicio] = useState(0);
  const [volumenPropuestoEjercicio, setVolumenPropuestoEjercicio] = useState(0);
  const [peso, setPeso] = useState(0);
  const [repeticiones, setRepeticiones] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        cargarRutinas(user.uid);
      } else {
        setUserId(null);
      }
    });

    return () => unsubscribe();
  }, []);
  
  // Cargar rutinas desde Firestore
  const cargarRutinas = async (uid) => {
    try {
      const rutinasSnapshot = await getDocs(collection(db, `Usuarios/${uid}/rutinas`));
      const rutinasCargadas = rutinasSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRutinas(rutinasCargadas);
    } catch (error) {
      console.error("Error al cargar rutinas: ", error);
    }
  };

  const seleccionarRutina = async (rutinaId) => {
    setRutinaSeleccionada(rutinaId);
    try {
      // Cargar la rutina seleccionada
      const rutinaDoc = await getDoc(doc(db, `Usuarios/${userId}/rutinas`, rutinaId));
      if (rutinaDoc.exists()) {
        const rutinaData = rutinaDoc.data();
  
        // Cargar los datos completos de los ejercicios usando sus IDs
        const ejerciciosIds = rutinaData.ejercicios || [];
        const ejerciciosPromises = ejerciciosIds.map((id) =>
          getDoc(doc(db, `Usuarios/${userId}/ejercicios`, id))
        );
  
        const ejerciciosSnapshots = await Promise.all(ejerciciosPromises);
        const ejerciciosCargados = ejerciciosSnapshots.map((snap) => ({
          id: snap.id,
          ...snap.data(),
        }));
  
        console.log("Ejercicios cargados:", ejerciciosCargados);
        setEjercicios(ejerciciosCargados);
      } else {
        alert("La rutina seleccionada no existe.");
      }
    } catch (error) {
      console.error("Error al cargar la rutina: ", error);
    }
  };
  
  const seleccionarEjercicio = async (ejercicio) => {
    setEjercicioActual(ejercicio);
  
    try {
      // Consulta para obtener el volumen máximo
      const volumenesQuery = query(
        collection(db, `Usuarios/${userId}/ejercicios/${ejercicio.id}/volumenes`),
        orderBy("volumen", "desc"),
        
      );


      
  
      const volumenesSnapshot = await getDocs(volumenesQuery);
  
      let maxVolumen = 0;
      if (!volumenesSnapshot.empty) {
        // El primer documento contiene el volumen más alto
        maxVolumen = volumenesSnapshot.docs[0].data().volumen;
      }
  
      setVolumenMaximoEjercicio(maxVolumen); // Establece el volumen máximo en el estado
      setVolumenPropuestoEjercicio(maxVolumen > 0 ? maxVolumen * 1.03 : 10); // Calcula el volumen propuesto
      setVolumenActualEjercicio(0); // Inicializa el volumen actual del ejercicio
    } catch (error) {
      console.error("Error al cargar el volumen máximo: ", error);
    }
  };
  

  // Registrar un nuevo set
  const registrarSet = async () => {
    const volumenSet = peso * repeticiones;
    if (!userId || !ejercicioActual || volumenSet === 0) return;

    try {
      const ejercicioRef = doc(db, `Usuarios/${userId}/ejercicios`, ejercicioActual.id);
      await addDoc(collection(ejercicioRef, "volumenes"), {
        fecha: new Date().toISOString().split("T")[0],
        volumen: volumenSet,
      });
      setVolumenActualEjercicio(volumenActualEjercicio + volumenSet);
      setVolumenTotalRutina(volumenTotalRutina + volumenSet);
      setPeso(0);
      setRepeticiones(0);
    } catch (error) {
      console.error("Error al registrar el set: ", error);
    }
  };

// Finalizar ejercicio
const finalizarEjercicio = async () => {
  try {
    if (!userId || !ejercicioActual) {
      console.error("Usuario o ejercicio actual no definido.");
      return;
    }

    // Guardar el volumen total del ejercicio
    if (volumenActualEjercicio > 0) {
      await addDoc(
        collection(db, `Usuarios/${userId}/ejercicios/${ejercicioActual.id}/volumenesTotales`),
        {
          fecha: new Date().toISOString().split("T")[0],
          volumenTotal: volumenActualEjercicio,
        }
      );
    }

    console.log(`Ejercicio finalizado: ${ejercicioActual.nombre}`);

    // Pasar al siguiente ejercicio
    const indiceActual = ejercicios.findIndex((e) => e.id === ejercicioActual.id);

    if (indiceActual + 1 < ejercicios.length) {
      seleccionarEjercicio(ejercicios[indiceActual + 1]);
    } else {
      console.log("Todos los ejercicios han sido completados.");
      await finalizarRutina();
    }
  } catch (error) {
    console.error("Error al finalizar el ejercicio: ", error);
  }
};


  // Finalizar rutina
  const finalizarRutina = async () => {
    try {
      if (volumenTotalRutina > 0) {
        await addDoc(collection(db, `Usuarios/${userId}/rutinas/${rutinaSeleccionada}/volumenesTotales`), {
          fecha: new Date().toISOString().split("T")[0],
          volumenTotal: volumenTotalRutina,
        });
      }

      alert("Rutina finalizada. Datos guardados.");
      setRutinaSeleccionada(null);
      setEjercicios([]);
      setEjercicioActual(null);
      setVolumenTotalRutina(0);
    } catch (error) {
      console.error("Error al finalizar la rutina: ", error);
    }
  };
  

  return (
    <div className="container mt-4">
      {rutinaSeleccionada ? (
        ejercicioActual ? (
          <>
            <h4 className="text-center">Ejercicio: {ejercicioActual.nombre}</h4>
            <p>Volumen Máximo Alcanzado: {volumenMaximoEjercicio.toFixed(2)}</p>
            <p>Volumen Propuesto: {volumenPropuestoEjercicio.toFixed(2)}</p>
            <p>Volumen Actual del Ejercicio: {volumenActualEjercicio.toFixed(2)}</p>
            <p>Volumen Total de la Rutina: {volumenTotalRutina.toFixed(2)}</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                registrarSet();
              }}
            >
              <div className="mb-3">
                <label htmlFor="peso" className="form-label">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="peso"
                  value={peso}
                  onChange={(e) => setPeso(Number(e.target.value))}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="repeticiones" className="form-label">
                  Repeticiones
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="repeticiones"
                  value={repeticiones}
                  onChange={(e) => setRepeticiones(Number(e.target.value))}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-100">
                Registrar Set
              </button>
              
            <button className="btn btn-success w-100 mt-3" onClick={finalizarEjercicio}>
              Finalizar Ejercicio
            </button>
            
            <button className="btn btn-danger w-100 mt-3" onClick={finalizarRutina}>
              Finalizar Rutina
            </button>
            </form>


          </>
        ) : (
          <>
            <h4 className="text-center">Selecciona un ejercicio</h4>
            <div className="list-group">
              {ejercicios.map((ejercicio) => (
                <button
                  key={ejercicio.id}
                  className="list-group-item list-group-item-action"
                  onClick={() => seleccionarEjercicio(ejercicio)}
                >
                  {ejercicio.nombre}
                </button>
              ))}
            </div>
          </>
        )
      ) : (
        <>
          <h4 className="text-center">Selecciona una rutina</h4>
          <div className="list-group">
            {rutinas.map((rutina) => (
              <button
                key={rutina.id}
                className="list-group-item list-group-item-action"
                onClick={() => seleccionarRutina(rutina.id)}
              >
                {rutina.nombre}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default RegistroRutina;
