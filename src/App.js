import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MenuDeInicio from "./Componentes/Sesion/MenuDeInicio";
import Dashboard from "./Componentes/Dashboard";
import { auth } from "./firebase-config";
import { onAuthStateChanged } from "firebase/auth";


const App = () => {
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log(`Usuario autenticado: ${user.uid}`);
      } else {
        console.log("No hay usuario autenticado");
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MenuDeInicio />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
};

export default App;
