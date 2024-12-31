import React from "react";
import MenuLogin from "./InicioDeSesion/MenuLogin";
import Login from "./InicioDeSesion/Login";
import SignIn from "./InicioDeSesion/SignIn";
import FormularioDatos from "./InicioDeSesion/FormularioDatos";
import MenuPrincipal from "./MenuPrincipal/MenuPrincipal";
import MenuRutina from "./Rutina/MenuRutina";
import RegistrarEjercicio from "./Rutina/RegistrarEjercicio";
import RegistroRutina from "./RegistroRutina/RegistroRutina";



const ViewRenderer = ({ currentView, setCurrentView, currentUser, handleSignOut, datosPrevios }) => {
  switch (currentView) {
    case "menu":
      return <MenuLogin setCurrentView={setCurrentView} />;
    case "login":
      return <Login setCurrentView={setCurrentView} />;
    case "signIn":
      return <SignIn setCurrentView={setCurrentView} />;
    case "formularioDatos":
      return <FormularioDatos setCurrentView={setCurrentView} currentUser={currentUser} />;
    case "menuPrincipal":
      return <MenuPrincipal setCurrentView={setCurrentView} handleSignOut={handleSignOut} />;
    case "menuRutina":
      return <MenuRutina setCurrentView={setCurrentView} />;
    case "registrarEjercicio":
      return <RegistrarEjercicio setCurrentView={setCurrentView} />;
    case "registrarRutina":
      return <RegistroRutina setCurrentView={setCurrentView} />;
 
   
    default:
      console.warn(`Vista no encontrada: ${currentView}`);
      return <div>Vista no encontrada</div>;
  }
};

export default ViewRenderer;
