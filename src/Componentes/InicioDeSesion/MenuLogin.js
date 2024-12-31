import React from "react";

const MenuLogin = ({ setCurrentView }) => {
  return (
    <div>
      <h2>Menú de Inicio</h2>
      <button onClick={() => setCurrentView("login")}>Iniciar Sesión</button>
      <button onClick={() => setCurrentView("signIn")}>Registrarse</button>

    </div>
  );
};

export default MenuLogin;
