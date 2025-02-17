import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import GestorRutinas from "./Rutinas/GestorRutinas";
import RegistroRutina from "./Rutinas/RegistroRutina";
import HistogramaRutinas from "./Rutinas/HistogramaRutinas";
import FormularioMedidas from "./Formulario/Formulario";
import GraficaMedidas from "./Formulario/Graficas";

const Dashboard = () => {
  const [opcionSeleccionada, setOpcionSeleccionada] = useState("gestorRutinas");
  const navigate = useNavigate();
  const auth = getAuth();

  const logout = async () => {
    try {
      await signOut(auth);
      alert("Sesión cerrada correctamente.");
      navigate("/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      alert("Hubo un problema al cerrar la sesión. Inténtalo de nuevo.");
    }
  };

  const renderContenido = () => {
    switch (opcionSeleccionada) {
      case "gestorRutinas":
        return <GestorRutinas />;
      case "registroRutina":
        return <RegistroRutina />;
      case "HistogramaRutinas":
        return <HistogramaRutinas />;
      case "Formulario":
        return <FormularioMedidas />;
      case "Graficas":
        return <GraficaMedidas/>;
      default:
        return <div>Selecciona una opción del menú</div>;
    }
  };

  return (
    <div className="d-flex" style={{ height: "100vh" }}>
      <div
        className="d-flex flex-column text-white p-3"
        style={{
          width: "250px",
          background: "linear-gradient(180deg, #04618c, #000000)",
          height: "100vh",
        }}
      >
        <h4 className="text-center mb-4"style={{ color: "#32cd32" }}>Menú</h4>
        <Button
          className="mb-2 text-start"
          variant="success"
          onClick={() => setOpcionSeleccionada("gestorRutinas")}
        >
          Gestor de Rutinas
        </Button>
        <Button
          className="mb-2 text-start"
          variant="success"
          onClick={() => setOpcionSeleccionada("registroRutina")}
        >
          Registro de Rutina
        </Button>
        <Button
          className="mb-2 text-start"
          variant="success"
          onClick={() => setOpcionSeleccionada("HistogramaRutinas")}
        >
          Mostrar historial
        </Button>
        <Button
          className="mb-2 text-start"
          variant="success"
          onClick={() => setOpcionSeleccionada("Graficas")}
        >
          Progresión fisica
        </Button>
        <Button
          className="mb-2 text-start"
          variant="success"
          onClick={() => setOpcionSeleccionada("Formulario")}
        >
          Formulario
        </Button>

        <Button
          className="text-start"
          variant="danger"
          onClick={logout}
        >
          Cerrar Sesión
        </Button>
      </div>

      <div className="flex-grow-1 bg-light p-4">{renderContenido()}</div>
    </div>
  );
};

export default Dashboard;