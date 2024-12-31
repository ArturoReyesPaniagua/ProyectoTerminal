import React, { useState, useEffect } from "react";
import { db } from "../../firebase-config";
import { collection, getDocs } from "firebase/firestore";

const SeleccionRutina = ({ setRutinaSeleccionada, setCurrentStep }) => {
  const [rutinas, setRutinas] = useState([]);

  useEffect(() => {
    const fetchRutinas = async () => {
      try {
        const rutinasSnapshot = await getDocs(collection(db, "rutinas"));
        const rutinasList = rutinasSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRutinas(rutinasList);
      } catch (error) {
        console.error("Error al cargar rutinas:", error);
      }
    };
    fetchRutinas();
  }, []);

  const handleSeleccionarRutina = (rutina) => {
    setRutinaSeleccionada(rutina);
    setCurrentStep(2); // Pasar al siguiente componente
  };

  return (
    <div>
      <h2>Seleccionar Rutina</h2>
      <select onChange={(e) => handleSeleccionarRutina(JSON.parse(e.target.value))}>
        <option value="">Seleccione una rutina</option>
        {rutinas.map((rutina) => (
          <option key={rutina.id} value={JSON.stringify(rutina)}>
            {rutina.nombre}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SeleccionRutina;
