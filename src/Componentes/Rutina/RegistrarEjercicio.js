import React, { useState } from "react";
import { db } from "../../firebase-config";
import { collection, doc, setDoc } from "firebase/firestore";

const RegistrarEjercicio = ({ setCurrentView }) => {
  const [nombre, setNombre] = useState("");
  const [musculo, setMusculo] = useState("");
  const [pesoMaximo, setPesoMaximo] = useState("");
  const [repeticionesMaximas, setRepeticionesMaximas] = useState("");
  const [setsMaximos, setSetsMaximos] = useState(""); // Nuevo campo para sets máximos

  const registrarEjercicio = async () => {
    if (!nombre || !musculo || !pesoMaximo || !repeticionesMaximas || !setsMaximos) {
      alert("Por favor, complete todos los campos.");
      return;
    }

    try {
      const ejercicioRef = doc(collection(db, "ejercicios"));
      await setDoc(ejercicioRef, {
        nombre,
        musculo,
        pesoMaximo: parseInt(pesoMaximo),
        repeticionesMaximas: parseInt(repeticionesMaximas),
        setsMaximos: parseInt(setsMaximos), // Guardar sets máximos
      });
      alert("Ejercicio registrado con éxito.");
      setCurrentView("menuRutina");
    } catch (error) {
      console.error("Error al registrar el ejercicio:", error);
      alert("Hubo un error al registrar el ejercicio.");
    }
  };

  return (
    <div>
      <h2>Registrar Ejercicio</h2>
      <input
        type="text"
        placeholder="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
      />
      <input
        type="text"
        placeholder="Asociado a músculo"
        value={musculo}
        onChange={(e) => setMusculo(e.target.value)}
      />
      <input
        type="number"
        placeholder="Peso máximo"
        value={pesoMaximo}
        onChange={(e) => setPesoMaximo(e.target.value)}
      />
      <input
        type="number"
        placeholder="Repeticiones máximas"
        value={repeticionesMaximas}
        onChange={(e) => setRepeticionesMaximas(e.target.value)}
      />
      <input
        type="number"
        placeholder="Sets máximos"
        value={setsMaximos}
        onChange={(e) => setSetsMaximos(e.target.value)}
      />
      <button onClick={registrarEjercicio}>Registrar Ejercicio</button>
      <button onClick={() => setCurrentView("menuRutina")}>Regresar</button>
    </div>
  );
};

export default RegistrarEjercicio;
