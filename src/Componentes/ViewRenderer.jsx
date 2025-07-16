import React from "react";

// Componentes de autenticación
import MenuLogin from "./InicioDeSesion/MenuLogin";
import Login from "./InicioDeSesion/Login";
import SignIn from "./InicioDeSesion/SignIn";
import FormularioDatos from "./InicioDeSesion/FormularioDatos";

// Componentes principales
import MenuPrincipal from "./MenuPrincipal/MenuPrincipal";
import MenuRutina from "./Rutina/MenuRutina";
import RegistrarEjercicio from "./Rutina/RegistrarEjercicio";
import RegistroRutina from "./RegistroRutina/RegistroRutina";

// Mapa de vistas para mejor mantenimiento
const VIEWS = {
  // Autenticación
  menu: MenuLogin,
  login: Login,
  signIn: SignIn,
  formularioDatos: FormularioDatos,
  
  // App principal
  menuPrincipal: MenuPrincipal,
  menuRutina: MenuRutina,
  registrarEjercicio: RegistrarEjercicio,
  registrarRutina: RegistroRutina,
};

const ViewRenderer = ({ 
  currentView, 
  setCurrentView, 
  currentUser, 
  handleSignOut, 
  error,
  setError 
}) => {
  // Buscar el componente en el mapa
  const Component = VIEWS[currentView];
  
  // Vista no encontrada
  if (!Component) {
    console.warn(`Vista no encontrada: ${currentView}`);
    return (
      <div className="error-container">
        <h2>Vista no encontrada</h2>
        <p>La vista "{currentView}" no existe</p>
        <button onClick={() => setCurrentView("menu")}>
          Ir al menú principal
        </button>
      </div>
    );
  }

  // Props comunes para todos los componentes
  const commonProps = {
    setCurrentView,
    currentUser,
    handleSignOut,
    error,
    setError,
  };

  return <Component {...commonProps} />;
};

export default ViewRenderer;