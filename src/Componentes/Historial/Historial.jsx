import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase-config";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { 
  calcularPorcentajeGrasa, 
  calcularTendencia,
  formatearFecha 
} from "../../utils/fitnessUtils";

const Historial = ({ setCurrentView }) => {
  const [historialData, setHistorialData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vistaActual, setVistaActual] = useState("grasa");

  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const historialRef = collection(db, "usuarios", user.uid, "historial");
          const q = query(historialRef, orderBy("fecha", "desc"));
          const historialSnapshot = await getDocs(q);
          
          const historialList = historialSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              fechaFormateada: formatearFecha(data.fecha)
            };
          });
          
          // Calcular porcentaje de grasa para cada entrada
          const historialConGrasa = historialList.map(entrada => ({
            ...entrada,
            porcentajeGrasa: calcularPorcentajeGrasa(entrada).toFixed(1)
          }));
          
          setHistorialData(historialConGrasa);
        }
      } catch (error) {
        console.error("Error al cargar historial:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarHistorial();
  }, []);

  const obtenerTendencia = (datos, campo) => {
    if (datos.length < 2) return null;
    
    const actual = parseFloat(datos[0][campo]);
    const anterior = parseFloat(datos[1][campo]);
    const menosEsMejor = campo === "porcentajeGrasa";
    
    return calcularTendencia(actual, anterior, menosEsMejor);
  };

  if (loading) {
    return <div className="loading">Cargando historial...</div>;
  }

  if (historialData.length === 0) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Historial de Progreso</h2>
        <p>No hay datos de historial disponibles.</p>
        <button 
          onClick={() => setCurrentView("formularioDatos")}
          className="btn btn-primario"
        >
          Registrar Primeros Datos
        </button>
        <button 
          onClick={() => setCurrentView("menuPrincipal")}
          className="btn btn-secundario"
        >
          Regresar al Menú
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2>Historial de Progreso</h2>
      
      {/* Navegación de vistas */}
      <div style={{ 
        display: "flex", 
        marginBottom: "20px", 
        borderBottom: "1px solid #dee2e6" 
      }}>
        <button
          onClick={() => setVistaActual("grasa")}
          style={{
            padding: "10px 20px",
            border: "none",
            borderBottom: vistaActual === "grasa" ? "3px solid #007bff" : "none",
            backgroundColor: "transparent",
            color: vistaActual === "grasa" ? "#007bff" : "#6c757d",
            cursor: "pointer",
            fontWeight: vistaActual === "grasa" ? "bold" : "normal"
          }}
        >
          Porcentaje de Grasa
        </button>
        <button
          onClick={() => setVistaActual("medidas")}
          style={{
            padding: "10px 20px",
            border: "none",
            borderBottom: vistaActual === "medidas" ? "3px solid #007bff" : "none",
            backgroundColor: "transparent",
            color: vistaActual === "medidas" ? "#007bff" : "#6c757d",
            cursor: "pointer",
            fontWeight: vistaActual === "medidas" ? "bold" : "normal"
          }}
        >
          Medidas Corporales
        </button>
      </div>

      {/* Vista de Porcentaje de Grasa */}
      {vistaActual === "grasa" && (
        <div>
          <div style={{ 
            backgroundColor: "#f8f9fa", 
            padding: "20px", 
            borderRadius: "10px", 
            marginBottom: "20px",
            textAlign: "center"
          }}>
            <h3>Progreso de Grasa Corporal</h3>
            {historialData.length > 0 && (
              <div>
                <div style={{ fontSize: "36px", fontWeight: "bold", color: "#007bff" }}>
                  {historialData[0].porcentajeGrasa}%
                </div>
                <div style={{ fontSize: "14px", color: "#6c757d" }}>
                  Última medición: {historialData[0].fechaFormateada}
                </div>
                {historialData.length > 1 && (() => {
                  const tendencia = obtenerTendencia(historialData, "porcentajeGrasa");
                  return tendencia && (
                    <div style={{ marginTop: "10px" }}>
                      <span style={{ color: tendencia.color, fontWeight: "bold" }}>
                        {tendencia.icono} {tendencia.tendencia === "mejorando" ? "Mejorando" : 
                          tendencia.tendencia === "empeorando" ? "Empeorando" : "Sin cambios"}
                        {tendencia.cambioPorcentaje > 0 && 
                          ` (${tendencia.cambio > 0 ? '+' : ''}${tendencia.cambio.toFixed(1)}%)`}
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h4>Historial de Mediciones</h4>
            {historialData.map((entrada, index) => (
              <div 
                key={entrada.id}
                style={{
                  backgroundColor: "white",
                  border: "1px solid #dee2e6",
                  borderRadius: "8px",
                  padding: "15px",
                  marginBottom: "10px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <div style={{ fontWeight: "bold", fontSize: "18px" }}>
                    {entrada.porcentajeGrasa}% de grasa
                  </div>
                  <div style={{ color: "#6c757d", fontSize: "14px" }}>
                    {entrada.fechaFormateada}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6c757d" }}>
                    Peso: {entrada.peso} kg
                  </div>
                </div>
                {index < historialData.length - 1 && (() => {
                  const actual = parseFloat(entrada.porcentajeGrasa);
                  const anterior = parseFloat(historialData[index + 1].porcentajeGrasa);
                  const diferencia = (actual - anterior).toFixed(1);
                  const color = diferencia < 0 ? "#27ae60" : diferencia > 0 ? "#e74c3c" : "#6c757d";
                  return (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color, fontWeight: "bold" }}>
                        {diferencia > 0 ? "+" : ""}{diferencia}%
                      </div>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vista de Medidas Corporales */}
      {vistaActual === "medidas" && (
        <div>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
            gap: "15px",
            marginBottom: "20px"
          }}>
            {["peso", "cintura", "cuello", "cuadriceps"].map(medida => {
              const ultimaMediana = historialData.length > 0 ? historialData[0][medida] : 0;
              const tendencia = obtenerTendencia(historialData, medida);
              
              return (
                <div 
                  key={medida}
                  style={{
                    backgroundColor: "#f8f9fa",
                    padding: "15px",
                    borderRadius: "8px",
                    textAlign: "center"
                  }}
                >
                  <h5 style={{ margin: "0 0 10px 0", textTransform: "capitalize" }}>
                    {medida}
                  </h5>
                  <div style={{ fontSize: "24px", fontWeight: "bold" }}>
                    {ultimaMediana} {medida === "peso" ? "kg" : "cm"}
                  </div>
                  {historialData.length > 1 && tendencia && (
                    <div style={{ 
                      color: tendencia.color, 
                      fontSize: "12px", 
                      fontWeight: "bold",
                      marginTop: "5px"
                    }}>
                      {tendencia.icono} {tendencia.cambio > 0 ? '+' : ''}{tendencia.cambio.toFixed(1)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div>
            <h4>Historial Detallado</h4>
            {historialData.map(entrada => (
              <div 
                key={entrada.id}
                style={{
                  backgroundColor: "white",
                  border: "1px solid #dee2e6",
                  borderRadius: "8px",
                  padding: "15px",
                  marginBottom: "10px"
                }}
              >
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  marginBottom: "10px"
                }}>
                  <h5 style={{ margin: "0" }}>{entrada.fechaFormateada}</h5>
                  <span style={{ 
                    backgroundColor: "#007bff", 
                    color: "white", 
                    padding: "4px 8px", 
                    borderRadius: "4px",
                    fontSize: "12px"
                  }}>
                    {entrada.porcentajeGrasa}% grasa
                  </span>
                </div>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
                  gap: "10px",
                  fontSize: "14px"
                }}>
                  <div><strong>Peso:</strong> {entrada.peso} kg</div>
                  <div><strong>Cintura:</strong> {entrada.cintura} cm</div>
                  <div><strong>Cuello:</strong> {entrada.cuello} cm</div>
                  <div><strong>Cuádriceps:</strong> {entrada.cuadriceps} cm</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botones de navegación */}
      <div style={{ 
        display: "flex", 
        gap: "10px", 
        justifyContent: "center",
        marginTop: "30px"
      }}>
        <button 
          onClick={() => setCurrentView("grasa")}
          style={{
            padding: "12px 24px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Calcular Grasa Actual
        </button>
        <button 
          onClick={() => setCurrentView("formularioDatos")}
          style={{
            padding: "12px 24px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Agregar Nueva Medición
        </button>
        <button 
          onClick={() => setCurrentView("menuPrincipal")}
          style={{
            padding: "12px 24px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Regresar al Menú
        </button>
      </div>
    </div>
  );
};

export default Historial;