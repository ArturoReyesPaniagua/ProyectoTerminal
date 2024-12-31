import React from "react";
import { auth } from "../../firebase-config";

const MenuPrincipal = ({ setCurrentView }) => {
  const handleLogout = async () => {
    try {
      await auth.signOut(); // Cierra la sesión de Firebase
      setCurrentView("login"); // Cambia la vista a login
    } catch (error) {
      console.error("Error al cerrar sesión:", error.message);
    }
  };

  return (
    <div className="menu-container">
      <div className="form-box">
        <h2>Menú Principal</h2>
        <div className="menu-buttons">
          <button onClick={() => setCurrentView("menuRutina")} className="menu-button">
            Menú de Rutinas
          </button>
          <button onClick={() => setCurrentView("grasa")} className="menu-button">
            Checar % de grasa
          </button>
          <button onClick={() => setCurrentView("historial")} className="menu-button">
            Historial
          </button>
          <button onClick={() => setCurrentView("formularioDatos")} className="menu-button">
            Actualizar datos
          </button>
          <button onClick={() => setCurrentView("registrarRutina")} className="menu-button">
            Registrar Rutina
          </button>
          <button onClick={handleLogout} className="menu-button">
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuPrincipal;
