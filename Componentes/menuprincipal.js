import React from "react";
import { useNavigate } from 'react-router-dom';
import UserMenu from './UserMenu'; // Importa el componente UserMenu
import "./menuprincipal.css";
import Logo from "../Imagenes/logo.png";


const Menuprincipal = () => {
  const navigate = useNavigate();
  return (
    <div className="menu-container">
      <UserMenu /> {/* Coloca el menú del usuario en la parte superior derecha */}
      <div className="logo">
        <img src={Logo} alt="Logo" className="logo-image" />
      </div>
      <div className="form-box">
        <div className="menu-buttons">
          {/* Los botones del menú */}
          <button onClick={() => navigate("/rutina")} className="menu-button">
            Seleccionar rutina
          </button>
          <button onClick={() => navigate("/registro")} className="menu-button">
            Registro de entrenamiento
          </button>
          <button onClick={() => navigate("/grasa")} className="menu-button">
            Checar % de grasa
          </button>
          <button onClick={() => navigate("/historial")} className="menu-button">
            Historial
          </button>
          <button onClick={() => navigate("/actualizar")} className="menu-button">
            Actualizar datos
          </button>
        </div>
      </div>
    </div>
  );
};


export default Menuprincipal;