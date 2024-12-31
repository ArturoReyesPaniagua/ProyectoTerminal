import React, { useState, useEffect } from "react";
import { db } from "../../firebase-config";
import { doc, collection, addDoc, setDoc, getDoc } from "firebase/firestore";

const FormularioDatos = ({ setVista, Usuario }) => {
  const [edad, setEdad] = useState("");
  const [sexo, setSexo] = useState("");
  const [peso, setPeso] = useState("");
  const [biceps, setBiceps] = useState("");
  const [pecho, setPecho] = useState("");
  const [cintura, setCintura] = useState("");
  const [cuello, setCuello] = useState("");
  const [cuadriceps, setCuadriceps] = useState("");

  useEffect(() => {
    const loadUserData = async () => {
      if (Usuario) {
        const userDocRef = doc(db, "usuarios", Usuario.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          setEdad(data.edad || "");
          setSexo(data.sexo || "");
          setPeso(data.peso || "");
          setBiceps(data.biceps || "");
          setPecho(data.pecho || "");
          setCintura(data.cintura || "");
          setCuello(data.cuello || "");
          setCuadriceps(data.cuadriceps || "");
        }
      }
    };

    loadUserData();
  }, [Usuario]);

  const guardarDatos = async () => {
    if (Usuario) {
      const userDocRef = doc(db, "usuarios", Usuario.uid);
      const historialRef = collection(db, "usuarios", Usuario.uid, "historial");
      
      // Guardar los datos en el historial
      const nuevaEntrada = {
        edad,
        sexo,
        peso,
        biceps,
        pecho,
        cintura,
        cuello,
        cuadriceps,
        fecha: new Date().toISOString(), // Guardar la fecha actual
      };

      await addDoc(historialRef, nuevaEntrada);

      // Actualizar el documento principal con los datos y marcar datosCompletos como true
      await setDoc(userDocRef, {
        edad,
        sexo,
        peso,
        biceps,
        pecho,
        cintura,
        cuello,
        cuadriceps,
        datosCompletos: true, // Aquí se actualiza a true
      });

      alert("Datos guardados con éxito");
      setVista("menuPrincipal"); // Redirigir al menú principal
    }
  };

  return (
    <div className="formulario-datos-container">
      <div className="formulario-datos-box">
        <h2>Formulario de Datos</h2>
        <input
          type="number"
          placeholder="Edad"
          value={edad}
          onChange={(e) => setEdad(e.target.value)}
        />
        <select
          value={sexo}
          onChange={(e) => setSexo(e.target.value)}
        >
          <option value="">Seleccione Sexo</option>
          <option value="Masculino">Masculino</option>
          <option value="Femenino">Femenino</option>
        </select>
        <input
          type="number"
          placeholder="Peso (kg)"
          value={peso}
          onChange={(e) => setPeso(e.target.value)}
        />
        <input
          type="number"
          placeholder="Circunferencia bíceps (cm)"
          value={biceps}
          onChange={(e) => setBiceps(e.target.value)}
        />
        <input
          type="number"
          placeholder="Circunferencia pecho (cm)"
          value={pecho}
          onChange={(e) => setPecho(e.target.value)}
        />
        <input
          type="number"
          placeholder="Circunferencia cintura (cm)"
          value={cintura}
          onChange={(e) => setCintura(e.target.value)}
        />
        <input
          type="number"
          placeholder="Circunferencia cuello (cm)"
          value={cuello}
          onChange={(e) => setCuello(e.target.value)}
        />
        <input
          type="number"
          placeholder="Circunferencia cuádriceps (cm)"
          value={cuadriceps}
          onChange={(e) => setCuadriceps(e.target.value)}
        />
        <button onClick={guardarDatos}>
          Guardar datos
        </button>
      </div>
    </div>
  );
};

export default FormularioDatos;
