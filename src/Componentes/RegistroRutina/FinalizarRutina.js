import React from "react";

const FinalizarRutina = ({ ejerciciosRealizados, setCurrentView }) => {
  const handleFinalizar = () => {
    console.log("Ejercicios realizados:", ejerciciosRealizados);
    alert("Entrenamiento finalizado.");
    setCurrentView("menuPrincipal"); // Redirigir al menú principal
  };

  return (
    <div>
      <h2>Finalizar Rutina</h2>
      <button onClick={handleFinalizar}>Finalizar</button>
    </div>
  );
};

export default FinalizarRutina;
