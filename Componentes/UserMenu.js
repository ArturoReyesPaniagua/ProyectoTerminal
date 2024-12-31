import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase-config';
import './UserMenu.css';
import { signOut } from 'firebase/auth';

const UserMenu = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/'); // Redirige al menú principal después de cerrar sesión
    } catch (error) {
      console.error('Error al cerrar sesión:', error.message);
    }
  };

  const handleChangeUser = async () => {
    try {
      await signOut(auth);
      navigate('/login'); // Redirige al login después de cerrar sesión para cambiar de usuario
    } catch (error) {
      console.error('Error al cambiar de usuario:', error.message);
    }
  };

  return (
    <div className="user-menu-container">
      <button onClick={handleLogout} className="user-menu-button">
        Salir
      </button>
      <button onClick={handleChangeUser} className="user-menu-button">
        Cambiar de Usuario
      </button>
    </div>
  );
};

export default UserMenu;
