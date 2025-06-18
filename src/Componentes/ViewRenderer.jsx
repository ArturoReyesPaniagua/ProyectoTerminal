import React from "react";
import MenuLogin from "./InicioDeSesion/MenuLogin";
import Login from "./InicioDeSesion/Login";
import SignIn from "./InicioDeSesion/SignIn";
import FormularioDatos from "./InicioDeSesion/FormularioDatos";
import MenuPrincipal from "./MenuPrincipal/MenuPrincipal";
import MenuRutina from "./Rutina/MenuRutina";
import RegistrarEjercicio from "./Rutina/RegistrarEjercicio";
import RegistroRutina from "./RegistroRutina/RegistroRutina";
import CalculoDinamicoMejorado from "./RegistroRutina/CalculoDinamicoMejorado";
import CalculoGrasa from "./Grasa/CalculoGrasa";
import Historial from "./Historial/Historial";
import GraficosProgreso from "./Graficos/GraficosProgreso";

const ViewRenderer = ({ currentView, setCurrentView, currentUser, handleSignOut }) => {
  switch (currentView) {
    case "menu":
      return <MenuLogin setCurrentView={setCurrentView} />;
    
    case "login":
      return <Login setCurrentView={setCurrentView} />;
    
    case "signIn":
      return <SignIn setCurrentView={setCurrentView} />;
    
    case "formularioDatos":
      return <FormularioDatos setVista={setCurrentView} Usuario={currentUser} />;
    
    case "menuPrincipal":
      return <MenuPrincipal setCurrentView={setCurrentView} handleSignOut={handleSignOut} />;
    
    case "menuRutina":
      return <MenuRutina setCurrentView={setCurrentView} />;
    
    case "registrarEjercicio":
      return <RegistrarEjercicio setCurrentView={setCurrentView} />;
    
    case "registrarRutina":
      return <RegistroRutina setCurrentView={setCurrentView} />;
    
    case "calculoDinamico":
      return <CalculoDinamicoMejorado setCurrentView={setCurrentView} />;
    
    case "grasa":
      return <CalculoGrasa setCurrentView={setCurrentView} />;
    
    case "historial":
      return <Historial setCurrentView={setCurrentView} />;
    
    case "graficos":
      return <GraficosProgreso setCurrentView={setCurrentView} />;
   
    default:
      console.warn(`Vista no encontrada: ${currentView}`);
      return (
        <div style={{ 
          padding: "20px", 
          textAlign: "center",
          backgroundColor: "#f8f9fa",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <h2>Vista no encontrada</h2>
          <p>La vista "{currentView}" no existe.</p>
          <button 
            onClick={() => setCurrentView("menuPrincipal")}
            style={{
              padding: "12px 24px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "16px"
            }}
          >
            Regresar al Menú Principal
          </button>
        </div>
      );
  }
};

export default ViewRenderer;