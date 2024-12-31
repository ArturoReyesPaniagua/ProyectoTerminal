import React, { useState, useEffect } from "react";
import { db } from "../../firebase-config";
import { collection, doc, getDocs, getDoc, addDoc } from "firebase/firestore";

const CalculoDinamico = ({ rutinaSeleccionada, setCurrentStep, userId }) => {
  const [objetivos, setObjetivos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [repeticionesActuales, setRepeticionesActuales] = useState(0);
  const [contadorSets, setContadorSets] = useState(1);

  useEffect(() => {
    const calcularObjetivos = async () => {
      try {
        const ejerciciosList = [];

        for (const ejercicioId of rutinaSeleccionada.ejercicios) {
          // Obtener datos del ejercicio
          const ejercicioRef = doc(db, "ejercicios", ejercicioId);
          const ejercicioDoc = await getDoc(ejercicioRef);

          if (ejercicioDoc.exists()) {
            const ejercicioData = ejercicioDoc.data();

            // Obtener los entrenamientos previos del usuario
            const entrenamientosSnapshot = await getDocs(
              collection(db, "ejercicios", ejercicioId, "entrenamientos")
            );

            const entrenamientos = entrenamientosSnapshot.docs.map((doc) => doc.data());
            const ultimoEntrenamiento = entrenamientos.pop() || {
              pesoUtilizado: 0,
              repeticionesAlcanzadas: 0,
              setsRealizados: 0,
            };

            const { pesoUtilizado, repeticionesAlcanzadas, setsRealizados } = ultimoEntrenamiento;

            // Calcular nuevos objetivos
            const nuevoVolumen = pesoUtilizado * repeticionesAlcanzadas * setsRealizados * 1.05;
            const pesoSugerido = pesoUtilizado > 0 ? pesoUtilizado * 1.02 : 10; // Peso base mínimo
            const repeticionesSugeridas =
              setsRealizados > 0
                ? Math.ceil(nuevoVolumen / (pesoSugerido * setsRealizados))
                : 8; // Valor base si no hay datos previos

            ejerciciosList.push({
              id: ejercicioId,
              nombre: ejercicioData.nombre,
              musculo: ejercicioData.musculo,
              pesoSugerido: pesoSugerido.toFixed(2),
              repeticionesSugeridas,
              setsSugeridos: setsRealizados || 3, // Base de sets si no hay datos
              volumenAnterior: pesoUtilizado * repeticionesAlcanzadas * setsRealizados || 0,
              volumenObjetivo: nuevoVolumen,
            });
          }
        }

        setObjetivos(ejerciciosList);
      } catch (error) {
        console.error("Error al calcular objetivos:", error);
      }
    };

    calcularObjetivos();
  }, [rutinaSeleccionada]);

  const handleRegistrarSet = async () => {
    const ejercicioActual = objetivos[currentIndex];
    const volumenActual = ejercicioActual.pesoSugerido * repeticionesActuales * contadorSets;

    if (volumenActual >= ejercicioActual.volumenObjetivo || contadorSets >= ejercicioActual.setsSugeridos) {
      // Guardar registro del ejercicio
      try {
        await addDoc(collection(db, "ejercicios", ejercicioActual.id, "entrenamientos"), {
          fecha: new Date().toISOString(),
          pesoUtilizado: ejercicioActual.pesoSugerido,
          repeticionesAlcanzadas: repeticionesActuales,
          setsRealizados: contadorSets,
        });
      } catch (error) {
        console.error("Error al guardar el entrenamiento:", error);
      }

      // Pasar al siguiente ejercicio
      if (currentIndex + 1 < objetivos.length) {
        setCurrentIndex(currentIndex + 1);
        setContadorSets(1);
        setRepeticionesActuales(0);
      } else {
        // Finalizar rutina
        alert("Rutina finalizada!");
        setCurrentStep(3); // Cambiar a pantalla de finalización
      }
    } else {
      // Continuar con el siguiente set del mismo ejercicio
      setContadorSets(contadorSets + 1);
      setRepeticionesActuales(0);
    }
  };

  if (!objetivos.length) {
    return <div>Cargando objetivos...</div>;
  }

  const ejercicioActual = objetivos[currentIndex];

  return (
    <div>
      <h2>Cálculo de Objetivos</h2>
      <h4>{ejercicioActual.nombre}</h4>
      <p>Músculo: {ejercicioActual.musculo}</p>
      <p>Peso sugerido: {ejercicioActual.pesoSugerido} kg</p>
      <p>Repeticiones sugeridas: {ejercicioActual.repeticionesSugeridas}</p>
      <p>Series sugeridas: {ejercicioActual.setsSugeridos}</p>
      <p>Volumen objetivo: {ejercicioActual.volumenObjetivo.toFixed(2)}</p>
      <p>Set actual: {contadorSets}</p>
      <input
        type="number"
        placeholder="Repeticiones alcanzadas"
        value={repeticionesActuales}
        onChange={(e) => setRepeticionesActuales(parseInt(e.target.value) || 0)}
      />
      <button onClick={handleRegistrarSet}>Registrar Set</button>
    </div>
  );
};

export default CalculoDinamico;
