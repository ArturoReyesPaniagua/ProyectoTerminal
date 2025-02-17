import React, { useState } from "react";
import InicioSesion from "./InicioSesion";
import Registrarse from "./Registrarse";
import { Button } from "react-bootstrap";
import BannerDeportivo from "../Banner/BannerDerportivo";

const MenuDelInicio = () => {
  const [mostrarInicioSesion, setMostrarInicioSesion] = useState(true);

  return (
    <div className="d-flex" style={{ height: "100vh" }}>
      {/* Menú lateral */}
      <div
        className="d-flex flex-column text-white p-3"
        style={{
          width: "300px",
          background: "linear-gradient(180deg,rgb(4, 97, 140), #000000)",
          height: "100vh",
        }}
      >
        <Button
          className="mb-2 text-start"
          variant="success"
          onClick={() => setMostrarInicioSesion(true)}
        >
          Iniciar Sesión
        </Button>
        <Button
          className="text-start"
          variant="success"
          onClick={() => setMostrarInicioSesion(false)}
        >
          Registrarse
        </Button>

        <div className="mt-4">
          {mostrarInicioSesion ? <InicioSesion /> : <Registrarse />}
        </div>
      </div>

      
      <div className="flex-grow-1 bg-light p-4">
        <h5 className="text-center">Bienvenido a la App Deportiva</h5>
        
       
        <BannerDeportivo />
      </div>
    </div>
  );
};

export default MenuDelInicio;
