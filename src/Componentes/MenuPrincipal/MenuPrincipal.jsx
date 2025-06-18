import React from "react";
import { auth } from "../../firebase-config";

const MenuPrincipalCompleto = ({ setCurrentView }) => {
  const handleLogout = async () => {
    try {
      await auth.signOut();
      setCurrentView("menu");
    } catch (error) {
      console.error("Error al cerrar sesión:", error.message);
    }
  };

  const menuItems = [
    {
      id: "menuRutina",
      title: "Gestión de Rutinas",
      description: "Crear y modificar rutinas de entrenamiento",
      icon: "🏋️‍♂️",
      color: "#007bff"
    },
    {
      id: "registrarRutina", 
      title: "Registrar Entrenamiento",
      description: "Realizar y registrar tu sesión de entrenamiento",
      icon: "📝",
      color: "#28a745"
    },
    {
      id: "grasa",
      title: "Porcentaje de Grasa",
      description: "Calcular tu porcentaje de grasa corporal",
      icon: "📊",
      color: "#17a2b8"
    },
    {
      id: "historial",
      title: "Historial de Progreso",
      description: "Ver tu historial de medidas y entrenamientos",
      icon: "📈",
      color: "#ffc107"
    },
    {
      id: "graficos",
      title: "Gráficos de Progreso",
      description: "Visualizar tu progreso en gráficos detallados",
      icon: "📊",
      color: "#6f42c1"
    },
    {
      id: "formularioDatos",
      title: "Actualizar Datos",
      description: "Actualizar tus medidas corporales",
      icon: "👤",
      color: "#fd7e14"
    }
  ];

  return (
    <div style={{ 
      minHeight: "100vh",
      backgroundColor: "#f8f9fa",
      padding: "20px"
    }}>
      <div style={{ 
        maxWidth: "1200px", 
        margin: "0 auto" 
      }}>
        {/* Header */}
        <div style={{ 
          textAlign: "center", 
          marginBottom: "40px",
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "15px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
        }}>
          <h1 style={{ 
            margin: "0 0 10px 0", 
            color: "#1f4f63",
            fontSize: "2.5rem",
            fontWeight: "bold"
          }}>
            ASECGC
          </h1>
          <p style={{ 
            margin: "0", 
            color: "#6c757d",
            fontSize: "1.2rem"
          }}>
            Aplicación para el Seguimiento de Ejercicios y Control de Grasa Corporal
          </p>
          
          {/* Botón de cerrar sesión */}
          <button
            onClick={handleLogout}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              padding: "10px 20px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "25px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
              transition: "all 0.3s ease"
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = "#c82333"}
            onMouseOut={(e) => e.target.style.backgroundColor = "#dc3545"}
          >
            Cerrar Sesión
          </button>
        </div>

        {/* Grid de funcionalidades */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", 
          gap: "25px",
          marginBottom: "30px"
        }}>
          {menuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              style={{
                backgroundColor: "white",
                borderRadius: "15px",
                padding: "25px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                border: "2px solid transparent",
                position: "relative",
                overflow: "hidden"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
                e.currentTarget.style.borderColor = item.color;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
                e.currentTarget.style.borderColor = "transparent";
              }}
            >
              {/* Icono de color de fondo */}
              <div style={{
                position: "absolute",
                top: "-20px",
                right: "-20px",
                fontSize: "80px",
                opacity: "0.1",
                color: item.color,
                zIndex: "1"
              }}>
                {item.icon}
              </div>
              
              {/* Contenido principal */}
              <div style={{ position: "relative", zIndex: "2" }}>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  marginBottom: "15px" 
                }}>
                  <div style={{
                    fontSize: "30px",
                    marginRight: "15px",
                    padding: "10px",
                    backgroundColor: `${item.color}20`,
                    borderRadius: "10px"
                  }}>
                    {item.icon}
                  </div>
                  <h3 style={{ 
                    margin: "0", 
                    color: item.color,
                    fontSize: "1.4rem",
                    fontWeight: "bold"
                  }}>
                    {item.title}
                  </h3>
                </div>
                <p style={{ 
                  margin: "0", 
                  color: "#6c757d",
                  fontSize: "1rem",
                  lineHeight: "1.5"
                }}>
                  {item.description}
                </p>
              </div>

              {/* Indicador de hover */}
              <div style={{
                position: "absolute",
                bottom: "0",
                left: "0",
                right: "0",
                height: "4px",
                backgroundColor: item.color,
                transform: "scaleX(0)",
                transition: "transform 0.3s ease",
                transformOrigin: "left"
              }} className="hover-indicator"></div>
            </div>
          ))}
        </div>

        {/* Información adicional */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "15px",
          padding: "25px",
          textAlign: "center",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ 
            margin: "0 0 15px 0", 
            color: "#1f4f63" 
          }}>
            Sistema de Entrenamiento Inteligente
          </h3>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
            gap: "20px",
            marginTop: "20px"
          }}>
            <div>
              <div style={{ fontSize: "24px", marginBottom: "5px" }}>🎯</div>
              <h5 style={{ margin: "0 0 5px 0", color: "#1f4f63" }}>Sobrecarga Progresiva</h5>
              <p style={{ margin: "0", fontSize: "14px", color: "#6c757d" }}>
                Sistema automático de progresión
              </p>
            </div>
            <div>
              <div style={{ fontSize: "24px", marginBottom: "5px" }}>📏</div>
              <h5 style={{ margin: "0 0 5px 0", color: "#1f4f63" }}>Cálculo de Grasa</h5>
              <p style={{ margin: "0", fontSize: "14px", color: "#6c757d" }}>
                Método de la Marina de EE.UU.
              </p>
            </div>
            <div>
              <div style={{ fontSize: "24px", marginBottom: "5px" }}>📊</div>
              <h5 style={{ margin: "0 0 5px 0", color: "#1f4f63" }}>Análisis Visual</h5>
              <p style={{ margin: "0", fontSize: "14px", color: "#6c757d" }}>
                Gráficos detallados de progreso
              </p>
            </div>
            <div>
              <div style={{ fontSize: "24px", marginBottom: "5px" }}>💾</div>
              <h5 style={{ margin: "0 0 5px 0", color: "#1f4f63" }}>Historial Completo</h5>
              <p style={{ margin: "0", fontSize: "14px", color: "#6c757d" }}>
                Seguimiento a largo plazo
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Agregar estilos CSS para el hover de los indicadores */}
      <style jsx>{`
        .menu-card:hover .hover-indicator {
          transform: scaleX(1);
        }
      `}</style>
    </div>
  );
};

export default MenuPrincipalCompleto;