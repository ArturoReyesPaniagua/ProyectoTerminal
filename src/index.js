import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css"; // Estilos de Bootstrap
import "./global.css"; // ← Agregar esta línea
import "./index.css"; // Estilos personalizados

const raiz = ReactDOM.createRoot(document.getElementById("root"));

raiz.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);