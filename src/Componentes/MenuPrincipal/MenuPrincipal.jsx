import React from "react";
import "./menuprincipal.css";

// Configuración de opciones del menú
const MENU_OPTIONS = [
  {
    id: "menuRutina",
    label: "Gestionar Rutinas",
    description: "Crear y editar rutinas de ejercicio",
    icon: "💪",
    view: "menuRutina"
  },
  {
    id: "registrarRutina", 
    label: "Entrenar",
    description: "Registrar sesión de entrenamiento",
    icon: "🏋️",
    view: "registrarRutina"
  },
  {
    id: "grasa",
    label: "% de Grasa Corporal",
    description: "Calcular porcentaje de grasa",
    icon: "📊", 
    view: "grasa"
  },
  {
    id: "historial",
    label: "Historial",
    description: "Ver progreso y estadísticas",
    icon: "📈",
    view: "historial"
  },
  {
    id: "actualizar",
    label: "Actualizar Datos",
    description: "Modificar medidas corporales",
    icon: "⚙️",
    view: "formularioDatos"
  }
];

// Componente para cada botón del menú
const MenuButton = ({ option, onClick, disabled = false }) => (
  <button 
    onClick={() => onClick(option.view)}
    className="menu-button"
    disabled={disabled}
    title={option.description}
  >
    <span className="menu-button-icon">{option.icon}</span>
    <span className="menu-button-text">{option.label}</span>
  </button>
);

// Componente para información del usuario
const UserInfo = ({ currentUser, handleSignOut }) => {
  if (!currentUser) return null;

  return (
    <div className="user-info">
      <div className="user-details">
        <span className="user-email">{currentUser.email}</span>
        <span className="user-status">Conectado</span>
      </div>
      <button 
        onClick={handleSignOut}
        className="logout-button"
        title="Cerrar sesión"
      >
        Salir
      </button>
    </div>
  );
};

const MenuPrincipal = ({ setCurrentView, currentUser, handleSignOut, error }) => {
  const handleMenuClick = (view) => {
    // Para actualizar datos, usar mode="update"
    if (view === "formularioDatos") {
      setCurrentView("actualizarDatos");
    } else {
      setCurrentView(view);
    }
  };

  return (
    <div className="menu-container">
      {/* Información del usuario en la esquina superior */}
      <UserInfo currentUser={currentUser} handleSignOut={handleSignOut} />
      
      {/* Logo */}
      <div className="logo">
        <span className="logo-text">ControlFit</span>
        <span className="logo-subtitle">Tu entrenador personal</span>
      </div>

      {/* Contenido principal */}
      <div className="form-box">
        <h2>¿Qué quieres hacer hoy?</h2>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="menu-buttons">
          {MENU_OPTIONS.map((option) => (
            <MenuButton
              key={option.id}
              option={option}
              onClick={handleMenuClick}
              disabled={false}
            />
          ))}
        </div>

        {/* Información adicional */}
        <div className="menu-footer">
          <p className="tip">💡 Tip: Mantén consistencia en tus entrenamientos para mejores resultados</p>
        </div>
      </div>
    </div>
  );
};

export default MenuPrincipal;