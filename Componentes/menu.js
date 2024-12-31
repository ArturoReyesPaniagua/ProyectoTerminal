// Menu.js
import React from "react";
import { useNavigate } from 'react-router-dom';
import "./menu.css";
import Logo from '../Imagenes/logo.png';

const Menu = () => {
  const navigate = useNavigate();
  return (
    <div className="menu-container">
      <div className="logo">
        <img src={Logo} alt="Logo" />
      </div>
      <div className="form-box">
        <h2>Menú de inicio</h2>
        <div className="menu-buttons">
          <button onClick={() => navigate("/login")} className="menu-button">
            Iniciar sesión
          </button>
          <button onClick={() => navigate("/register")} className="menu-button secondary">
            Registrarse
          </button>
        </div>
      </div>
    </div>
  );
};

export default Menu;