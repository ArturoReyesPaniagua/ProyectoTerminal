import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css"; 
import "./index.css"; 
import "./global.css"; 

const raiz = ReactDOM.createRoot(document.getElementById("root"));

raiz.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);