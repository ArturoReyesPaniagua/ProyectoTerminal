import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Login from './Componentes/login';
import Register from './Componentes/register';
import Menuprincipal from './Componentes/menuprincipal';
import Menu from './Componentes/menu';
import FormularioDatos from './Componentes/formularioDatos';


ReactDOM.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Menu />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/menuprincipal" element={<Menuprincipal />} />
      <Route path="/formulario-datos" element={<FormularioDatos />} />
      <Route path="/app" element={<App />} />
    </Routes>
  </BrowserRouter>,
  document.getElementById('root')
);
