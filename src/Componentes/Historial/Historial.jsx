import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase-config";
import { collection, getDocs, orderBy, query, addDoc } from "firebase/firestore";
import { 
  calcularPorcentajeGrasa, 
  calcularTendencia,
  formatearFecha 
} from "../../utils/fitnessUtils";

const Historial = ({ setCurrentView }) => {
  const [historialData, setHistorialData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vistaActual, setVistaActual] = useState("grasa");
  const [error, setError] = useState(null);
  const [guardandoMedicion, setGuardandoMedicion] = useState(false);

  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) {
          setError("Usuario no autenticado");
          return;
        }

        // ✅ CORREGIDO: Obtener historial del usuario específico
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
      } catch (error) {
        console.error("Error al cargar historial:", error);
        setError("Error al cargar el historial. Verifica tu conexión.");
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

  const crearNuevaMedicion = async () => {
    if (guardandoMedicion) return;

    try {
      setGuardandoMedicion(true);
      const user = auth.currentUser;
      if (!user) {
        alert("Usuario no autenticado");
        return;
      }

      // Obtener datos actuales del usuario
      const userDocRef = collection(db, "usuarios", user.uid, "datosPersonales");
      const userSnapshot = await getDocs(userDocRef);
      
      if (userSnapshot.empty) {
        alert("No se encontraron datos del usuario. Por favor, completa primero el formulario de datos.");
        setCurrentView("formularioDatos");
        return;
      }

      const userData = userSnapshot.docs[0].data();
      
      const nuevaMedicion = {
        fecha: new Date().toISOString(),
        peso: userData.peso || 0,
        cintura: userData.cintura || 0,
        cuello: userData.cuello || 0,
        cuadriceps: userData.cuadriceps || 0,
        biceps: userData.biceps || 0,
        pecho: userData.pecho || 0,
        notas: "Medición automática desde historial"
      };

      // ✅ CORREGIDO: Agregar nueva medición al historial del usuario específico
      const historialRef = collection(db, "usuarios", user.uid, "historial");
      await addDoc(historialRef, nuevaMedicion);

      alert("Nueva medición agregada basada en tus datos actuales");
      
      // Recargar historial
      window.location.reload();

    } catch (error) {
      console.error("Error al crear nueva medición:", error);
      alert("Error al crear la medición. Intenta de nuevo.");
    } finally {
      setGuardandoMedicion(false);
    }
  };

  const calcularProgreso = () => {
    if (historialData.length < 2) return null;

    const ultimaMedicion = historialData[0];
    const primeraMedicion = historialData[historialData.length - 1];
    
    const diasTranscurridos = Math.ceil(
      (new Date(ultimaMedicion.fecha) - new Date(primeraMedicion.fecha)) / (1000 * 60 * 60 * 24)
    );

    const cambioGrasa = parseFloat(ultimaMedicion.porcentajeGrasa) - parseFloat(primeraMedicion.porcentajeGrasa);
    const cambioPeso = parseFloat(ultimaMedicion.peso) - parseFloat(primeraMedicion.peso);
    const cambioCintura = parseFloat(ultimaMedicion.cintura) - parseFloat(primeraMedicion.cintura);

    return {
      diasTranscurridos,
      cambioGrasa: cambioGrasa.toFixed(1),
      cambioPeso: cambioPeso.toFixed(1),
      cambioCintura: cambioCintura.toFixed(1),
      totalMediciones: historialData.length
    };
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Cargando historial...</div>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={() => setCurrentView("menuPrincipal")} className="login-button">
          Regresar al Menú
        </button>
      </div>
    );
  }

  if (historialData.length === 0) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>📊</div>
          <h2>Historial de Progreso</h2>
          <p style={{ color: "#6c757d", marginBottom: "30px" }}>
            No hay datos de historial disponibles. Crea tu primera medición para comenzar a seguir tu progreso.
          </p>
          
          <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
            <button 
              onClick={() => setCurrentView("formularioDatos")}
              className="login-button"
            >
              📝 Registrar Primeros Datos
            </button>
            <button 
              onClick={crearNuevaMedicion}
              className="login-button secondary"
              disabled={guardandoMedicion}
            >
              {guardandoMedicion ? "⏳ Creando..." : "📏 Crear Medición Rápida"}
            </button>
          </div>
          
          <button 
            onClick={() => setCurrentView("menuPrincipal")}
            className="boton-cancelar"
            style={{ marginTop: "20px" }}
          >
            ← Regresar al Menú
          </button>
        </div>
      </div>
    );
  }

  const progreso = calcularProgreso();

  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ marginBottom: "30px" }}>
        <h2>📊 Historial de Progreso</h2>
        <p style={{ color: "#6c757d" }}>
          Seguimiento de tu evolución corporal a lo largo del tiempo
        </p>
      </div>

      {/* Resumen de progreso */}
      {progreso && (
        <div style={{
          backgroundColor: "white",
          padding: "25px",
          borderRadius: "15px",
          marginBottom: "30px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ margin: "0 0 20px 0", color: "#1f4f63" }}>📈 Resumen de Progreso</h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px"
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#007bff" }}>
                {progreso.diasTranscurridos}
              </div>
              <div style={{ fontSize: "14px", color: "#6c757d" }}>Días de seguimiento</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ 
                fontSize: "24px", 
                fontWeight: "bold", 
                color: progreso.cambioGrasa < 0 ? "#28a745" : "#e74c3c" 
              }}>
                {progreso.cambioGrasa > 0 ? "+" : ""}{progreso.cambioGrasa}%
              </div>
              <div style={{ fontSize: "14px", color: "#6c757d" }}>Cambio en grasa corporal</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ 
                fontSize: "24px", 
                fontWeight: "bold", 
                color: progreso.cambioPeso < 0 ? "#17a2b8" : "#ffc107" 
              }}>
                {progreso.cambioPeso > 0 ? "+" : ""}{progreso.cambioPeso} kg
              </div>
              <div style={{ fontSize: "14px", color: "#6c757d" }}>Cambio de peso</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#17a2b8" }}>
                {progreso.totalMediciones}
              </div>
              <div style={{ fontSize: "14px", color: "#6c757d" }}>Total de mediciones</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Navegación de vistas */}
      <div style={{ 
        display: "flex", 
        marginBottom: "30px", 
        borderBottom: "1px solid #dee2e6",
        backgroundColor: "white",
        borderRadius: "10px 10px 0 0"
      }}>
        <button
          onClick={() => setVistaActual("grasa")}
          style={{
            padding: "15px 25px",
            border: "none",
            borderBottom: vistaActual === "grasa" ? "3px solid #007bff" : "none",
            backgroundColor: vistaActual === "grasa" ? "#f8f9fa" : "transparent",
            color: vistaActual === "grasa" ? "#007bff" : "#6c757d",
            cursor: "pointer",
            fontWeight: vistaActual === "grasa" ? "bold" : "normal",
            borderRadius: "10px 0 0 0"
          }}
        >
          📉 Porcentaje de Grasa
        </button>
        <button
          onClick={() => setVistaActual("medidas")}
          style={{
            padding: "15px 25px",
            border: "none",
            borderBottom: vistaActual === "medidas" ? "3px solid #007bff" : "none",
            backgroundColor: vistaActual === "medidas" ? "#f8f9fa" : "transparent",
            color: vistaActual === "medidas" ? "#007bff" : "#6c757d",
            cursor: "pointer",
            fontWeight: vistaActual === "medidas" ? "bold" : "normal",
            borderRadius: "0 10px 0 0"
          }}
        >
          📏 Medidas Corporales
        </button>
      </div>

      {/* Vista de Porcentaje de Grasa */}
      {vistaActual === "grasa" && (
        <div style={{ 
          backgroundColor: "white", 
          padding: "30px", 
          borderRadius: "0 0 15px 15px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)" 
        }}>
          <div style={{ 
            backgroundColor: "#f8f9fa", 
            padding: "25px", 
            borderRadius: "10px", 
            marginBottom: "25px",
            textAlign: "center"
          }}>
            <h3>📊 Progreso de Grasa Corporal</h3>
            {historialData.length > 0 && (
              <div>
                <div style={{ fontSize: "48px", fontWeight: "bold", color: "#007bff" }}>
                  {historialData[0].porcentajeGrasa}%
                </div>
                <div style={{ fontSize: "14px", color: "#6c757d" }}>
                  Última medición: {historialData[0].fechaFormateada}
                </div>
                {historialData.length > 1 && (() => {
                  const tendencia = obtenerTendencia(historialData, "porcentajeGrasa");
                  return tendencia && (
                    <div style={{ marginTop: "15px" }}>
                      <span style={{ 
                        color: tendencia.color, 
                        fontWeight: "bold",
                        backgroundColor: "white",
                        padding: "8px 16px",
                        borderRadius: "20px",
                        fontSize: "14px"
                      }}>
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
            <h4>📋 Historial de Mediciones</h4>
            {historialData.map((entrada, index) => (
              <div 
                key={entrada.id}
                style={{
                  backgroundColor: "white",
                  border: "1px solid #dee2e6",
                  borderRadius: "10px",
                  padding: "20px",
                  marginBottom: "15px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
                }}
              >
                <div>
                  <div style={{ fontWeight: "bold", fontSize: "20px", color: "#1f4f63" }}>
                    {entrada.porcentajeGrasa}% de grasa
                  </div>
                  <div style={{ color: "#6c757d", fontSize: "14px", margin: "5px 0" }}>
                    📅 {entrada.fechaFormateada}
                  </div>
                  <div style={{ fontSize: "14px", color: "#6c757d" }}>
                    ⚖️ Peso: {entrada.peso} kg • 📐 Cintura: {entrada.cintura} cm
                  </div>
                  {entrada.notas && (
                    <div style={{ fontSize: "12px", color: "#007bff", marginTop: "5px", fontStyle: "italic" }}>
                      📝 {entrada.notas}
                    </div>
                  )}
                </div>
                {index < historialData.length - 1 && (() => {
                  const actual = parseFloat(entrada.porcentajeGrasa);
                  const anterior = parseFloat(historialData[index + 1].porcentajeGrasa);
                  const diferencia = (actual - anterior).toFixed(1);
                  const color = diferencia < 0 ? "#27ae60" : diferencia > 0 ? "#e74c3c" : "#6c757d";
                  const icono = diferencia < 0 ? "↓" : diferencia > 0 ? "↑" : "→";
                  return (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ 
                        color, 
                        fontWeight: "bold",
                        fontSize: "16px",
                        backgroundColor: "rgba(255,255,255,0.8)",
                        padding: "5px 10px",
                        borderRadius: "15px"
                      }}>
                        {icono} {diferencia > 0 ? "+" : ""}{diferencia}%
                      </div>
                      <div style={{ fontSize: "10px", color: "#6c757d", marginTop: "2px" }}>
                        vs anterior
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
        <div style={{ 
          backgroundColor: "white", 
          padding: "30px", 
          borderRadius: "0 0 15px 15px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)" 
        }}>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
            gap: "20px",
            marginBottom: "30px"
          }}>
            {["peso", "cintura", "cuello", "cuadriceps"].map(medida => {
              const ultimaMediana = historialData.length > 0 ? historialData[0][medida] : 0;
              const tendencia = obtenerTendencia(historialData, medida);
              
              return (
                <div 
                  key={medida}
                  style={{
                    backgroundColor: "#f8f9fa",
                    padding: "20px",
                    borderRadius: "10px",
                    textAlign: "center",
                    border: "1px solid #e9ecef"
                  }}
                >
                  <h5 style={{ margin: "0 0 15px 0", textTransform: "capitalize", color: "#1f4f63" }}>
                    {medida === "peso" ? "⚖️ Peso" : 
                     medida === "cintura" ? "📐 Cintura" :
                     medida === "cuello" ? "🔗 Cuello" : 
                     "🦵 Cuádriceps"}
                  </h5>
                  <div style={{ fontSize: "28px", fontWeight: "bold", color: "#007bff" }}>
                    {ultimaMediana} {medida === "peso" ? "kg" : "cm"}
                  </div>
                  {historialData.length > 1 && tendencia && (
                    <div style={{ 
                      color: tendencia.color, 
                      fontSize: "14px", 
                      fontWeight: "bold",
                      marginTop: "10px",
                      backgroundColor: "white",
                      padding: "5px 10px",
                      borderRadius: "15px"
                    }}>
                      {tendencia.icono} {tendencia.cambio > 0 ? '+' : ''}{tendencia.cambio.toFixed(1)}
                      {medida === "peso" ? " kg" : " cm"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div>
            <h4>📊 Historial Detallado</h4>
            {historialData.map(entrada => (
              <div 
                key={entrada.id}
                style={{
                  backgroundColor: "white",
                  border: "1px solid #dee2e6",
                  borderRadius: "10px",
                  padding: "20px",
                  marginBottom: "15px",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
                }}
              >
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  marginBottom: "15px"
                }}>
                  <h5 style={{ margin: "0", color: "#1f4f63" }}>📅 {entrada.fechaFormateada}</h5>
                  <span style={{ 
                    backgroundColor: "#007bff", 
                    color: "white", 
                    padding: "6px 12px", 
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "bold"
                  }}>
                    {entrada.porcentajeGrasa}% grasa
                  </span>
                </div>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
                  gap: "15px",
                  fontSize: "14px"
                }}>
                  <div><strong>⚖️ Peso:</strong> {entrada.peso} kg</div>
                  <div><strong>📐 Cintura:</strong> {entrada.cintura} cm</div>
                  <div><strong>🔗 Cuello:</strong> {entrada.cuello} cm</div>
                  <div><strong>🦵 Cuádriceps:</strong> {entrada.cuadriceps} cm</div>
                  {entrada.biceps && <div><strong>💪 Bíceps:</strong> {entrada.biceps} cm</div>}
                  {entrada.pecho && <div><strong>🫁 Pecho:</strong> {entrada.pecho} cm</div>}
                </div>
                {entrada.notas && (
                  <div style={{ 
                    marginTop: "15px", 
                    padding: "10px", 
                    backgroundColor: "#f8f9fa", 
                    borderRadius: "5px",
                    fontSize: "12px",
                    color: "#6c757d",
                    fontStyle: "italic"
                  }}>
                    📝 {entrada.notas}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botones de navegación */}
      <div style={{ 
        display: "flex", 
        gap: "15px", 
        justifyContent: "center",
        marginTop: "30px",
        flexWrap: "wrap"
      }}>
        <button 
          onClick={() => setCurrentView("grasa")}
          className="login-button"
        >
          🧮 Calcular Grasa Actual
        </button>
        <button 
          onClick={() => setCurrentView("formularioDatos")}
          className="login-button"
        >
          📏 Agregar Nueva Medición
        </button>
        <button 
          onClick={() => setCurrentView("graficos")}
          className="login-button secondary"
        >
          📊 Ver Gráficos
        </button>
        <button 
          onClick={() => setCurrentView("menuPrincipal")}
          className="boton-cancelar"
        >
          ← Regresar al Menú
        </button>
      </div>
    </div>
  );
};

export default Historial;