import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase-config";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const GraficosProgreso = ({ setCurrentView }) => {
  const [historialData, setHistorialData] = useState([]);
  const [entrenamientosData, setEntrenamientosData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vistaActual, setVistaActual] = useState("grasa"); // "grasa" o "entrenamientos"
  const [ejercicioSeleccionado, setEjercicioSeleccionado] = useState("");
  const [ejerciciosDisponibles, setEjerciciosDisponibles] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("Usuario no autenticado");
          return;
        }

        // Cargar historial de medidas corporales
        await cargarHistorialGrasa(user.uid);
        
        // Cargar datos de entrenamientos
        await cargarEntrenamientos(user.uid);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setError("Error al cargar los datos de progreso");
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  const cargarHistorialGrasa = async (userId) => {
    try {
      // ✅ CORREGIDO: Obtener historial del usuario específico
      const historialRef = collection(db, "usuarios", userId, "historial");
      const q = query(historialRef, orderBy("fecha", "asc"));
      const historialSnapshot = await getDocs(q);
      
      const historialList = historialSnapshot.docs.map(doc => {
        const data = doc.data();
        const fecha = new Date(data.fecha);
        
        return {
          id: doc.id,
          ...data,
          fechaFormateada: fecha.toLocaleDateString('es-ES', {
            month: 'short',
            day: 'numeric'
          }),
          porcentajeGrasa: calcularPorcentajeGrasa(data),
          timestamp: fecha.getTime()
        };
      });
      
      setHistorialData(historialList);
    } catch (error) {
      console.error("Error al cargar historial de grasa:", error);
    }
  };

  const cargarEntrenamientos = async (userId) => {
    try {
      // ✅ CORREGIDO: Obtener ejercicios del usuario específico
      const ejerciciosRef = collection(db, "usuarios", userId, "ejercicios");
      const ejerciciosSnapshot = await getDocs(ejerciciosRef);
      const ejerciciosList = [];
      const entrenamientosMap = new Map();

      for (const ejercicioDoc of ejerciciosSnapshot.docs) {
        const ejercicioData = ejercicioDoc.data();
        ejerciciosList.push({
          id: ejercicioDoc.id,
          nombre: ejercicioData.nombre,
          musculo: ejercicioData.musculo
        });

        // ✅ CORREGIDO: Obtener entrenamientos del usuario específico
        const entrenamientosRef = collection(db, "usuarios", userId, "ejercicios", ejercicioDoc.id, "entrenamientos");
        const entrenamientosQuery = query(entrenamientosRef, orderBy("fecha", "asc"));
        const entrenamientosSnapshot = await getDocs(entrenamientosQuery);
        
        const entrenamientosList = entrenamientosSnapshot.docs.map(doc => {
          const data = doc.data();
          const fecha = new Date(data.fecha);
          const volumen = (data.pesoUtilizado || 0) * (data.repeticionesAlcanzadas || 0) * (data.setsRealizados || 0);
          
          return {
            id: doc.id,
            ...data,
            fechaFormateada: fecha.toLocaleDateString('es-ES', {
              month: 'short',
              day: 'numeric'
            }),
            volumen: volumen,
            timestamp: fecha.getTime(),
            fecha: fecha.toISOString()
          };
        });

        if (entrenamientosList.length > 0) {
          entrenamientosMap.set(ejercicioDoc.id, entrenamientosList);
        }
      }

      setEjerciciosDisponibles(ejerciciosList.filter(ej => entrenamientosMap.has(ej.id)));
      setEntrenamientosData(entrenamientosMap);
      
      // Seleccionar el primer ejercicio por defecto
      const ejerciciosConDatos = ejerciciosList.filter(ej => entrenamientosMap.has(ej.id));
      if (ejerciciosConDatos.length > 0) {
        setEjercicioSeleccionado(ejerciciosConDatos[0].id);
      }
    } catch (error) {
      console.error("Error al cargar entrenamientos:", error);
    }
  };

  const calcularPorcentajeGrasa = (datos) => {
    const { sexo, cintura, cuello, cuadriceps } = datos;
    let altura = datos.altura || 170;
    
    if (altura < 3) {
      altura = altura * 100;
    }

    let porcentaje = 0;

    if (sexo === "Masculino") {
      porcentaje = 86.010 * Math.log10(cintura - cuello) - 70.041 * Math.log10(altura) + 36.76;
    } else if (sexo === "Femenino") {
      porcentaje = 163.205 * Math.log10(cintura + cuadriceps - cuello) - 97.684 * Math.log10(altura) - 78.387;
    }

    return Math.max(2, Math.min(50, porcentaje)).toFixed(1);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ margin: '0', color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.name.includes('Grasa') ? '%' : 
               entry.name.includes('Volumen') ? ' kg×reps×sets' : 
               entry.name.includes('Peso') && !entry.name.includes('Utilizado') ? ' kg' :
               entry.name.includes('Utilizado') ? ' kg' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const calcularEstadisticasEjercicio = (datos) => {
    if (!datos || datos.length === 0) return null;

    const pesoMaximo = Math.max(...datos.map(d => d.pesoUtilizado || 0));
    const volumenMaximo = Math.max(...datos.map(d => d.volumen || 0));
    const totalSets = datos.reduce((sum, d) => sum + (d.setsRealizados || 0), 0);
    const totalRepeticiones = datos.reduce((sum, d) => sum + (d.repeticionesAlcanzadas || 0) * (d.setsRealizados || 0), 0);
    const promedioRPE = datos.filter(d => d.sensacionEsfuerzo).reduce((sum, d, _, arr) => sum + d.sensacionEsfuerzo / arr.length, 0);

    return {
      pesoMaximo,
      volumenMaximo,
      totalSets,
      totalRepeticiones,
      promedioRPE: promedioRPE.toFixed(1),
      sesiones: datos.length
    };
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Cargando gráficos de progreso...</div>
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

  const datosEjercicioSeleccionado = ejercicioSeleccionado ? entrenamientosData.get(ejercicioSeleccionado) || [] : [];
  const estadisticasEjercicio = calcularEstadisticasEjercicio(datosEjercicioSeleccionado);

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "30px" }}>
        <h2>📊 Gráficos de Progreso</h2>
        <p style={{ color: "#6c757d" }}>
          Visualiza tu evolución en composición corporal y entrenamientos
        </p>
      </div>
      
      {/* Navegación de vistas */}
      <div style={{ 
        display: "flex", 
        marginBottom: "30px", 
        borderBottom: "1px solid #dee2e6",
        backgroundColor: "white",
        borderRadius: "10px 10px 0 0",
        padding: "0"
      }}>
        <button
          onClick={() => setVistaActual("grasa")}
          style={{
            padding: "15px 30px",
            border: "none",
            borderBottom: vistaActual === "grasa" ? "3px solid #007bff" : "none",
            backgroundColor: vistaActual === "grasa" ? "#f8f9fa" : "transparent",
            color: vistaActual === "grasa" ? "#007bff" : "#6c757d",
            cursor: "pointer",
            fontWeight: vistaActual === "grasa" ? "bold" : "normal",
            fontSize: "16px",
            borderRadius: "10px 0 0 0"
          }}
        >
          📉 Composición Corporal
        </button>
        <button
          onClick={() => setVistaActual("entrenamientos")}
          style={{
            padding: "15px 30px",
            border: "none",
            borderBottom: vistaActual === "entrenamientos" ? "3px solid #007bff" : "none",
            backgroundColor: vistaActual === "entrenamientos" ? "#f8f9fa" : "transparent",
            color: vistaActual === "entrenamientos" ? "#007bff" : "#6c757d",
            cursor: "pointer",
            fontWeight: vistaActual === "entrenamientos" ? "bold" : "normal",
            fontSize: "16px",
            borderRadius: "0 10px 0 0"
          }}
        >
          💪 Volumen de Entrenamientos
        </button>
      </div>

      {/* Vista de Porcentaje de Grasa */}
      {vistaActual === "grasa" && (
        <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "0 0 15px 15px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
          {historialData.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div style={{ fontSize: "64px", marginBottom: "20px" }}>📊</div>
              <h3>No hay datos de composición corporal</h3>
              <p>Necesitas al menos 2 mediciones para ver tu progreso de grasa corporal.</p>
              <div style={{ marginTop: "20px" }}>
                <button 
                  onClick={() => setCurrentView("formularioDatos")}
                  className="login-button"
                  style={{ marginRight: "10px" }}
                >
                  Agregar Medición
                </button>
                <button 
                  onClick={() => setCurrentView("historial")}
                  className="login-button secondary"
                >
                  Ver Historial
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h3>📈 Evolución del Porcentaje de Grasa Corporal</h3>
              <div style={{ height: "400px", marginBottom: "30px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historialData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="fechaFormateada" 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      domain={['dataMin - 2', 'dataMax + 2']}
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Porcentaje (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="porcentajeGrasa" 
                      stroke="#e74c3c" 
                      strokeWidth={3}
                      dot={{ fill: "#e74c3c", strokeWidth: 2, r: 6 }}
                      name="Porcentaje de Grasa"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <h4>📏 Evolución del Peso Corporal</h4>
              <div style={{ height: "400px", marginBottom: "20px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historialData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="fechaFormateada" 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      domain={['dataMin - 5', 'dataMax + 5']}
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="peso" 
                      stroke="#3498db" 
                      strokeWidth={3}
                      dot={{ fill: "#3498db", strokeWidth: 2, r: 6 }}
                      name="Peso Corporal"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vista de Entrenamientos */}
      {vistaActual === "entrenamientos" && (
        <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "0 0 15px 15px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
          {ejerciciosDisponibles.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div style={{ fontSize: "64px", marginBottom: "20px" }}>💪</div>
              <h3>No hay datos de entrenamientos disponibles</h3>
              <p>Primero debes registrar algunos entrenamientos para ver tu progreso.</p>
              <div style={{ marginTop: "20px" }}>
                <button 
                  onClick={() => setCurrentView("registrarRutina")}
                  className="login-button"
                  style={{ marginRight: "10px" }}
                >
                  Registrar Entrenamiento
                </button>
                <button 
                  onClick={() => setCurrentView("menuRutina")}
                  className="login-button secondary"
                >
                  Crear Rutinas
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: "30px", display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                <div>
                  <label style={{ marginRight: "10px", fontWeight: "bold" }}>
                    Seleccionar Ejercicio:
                  </label>
                  <select
                    value={ejercicioSeleccionado}
                    onChange={(e) => setEjercicioSeleccionado(e.target.value)}
                    style={{
                      padding: "10px 15px",
                      borderRadius: "5px",
                      border: "1px solid #ccc",
                      fontSize: "14px",
                      minWidth: "200px"
                    }}
                  >
                    {ejerciciosDisponibles.map(ejercicio => (
                      <option key={ejercicio.id} value={ejercicio.id}>
                        {ejercicio.nombre} ({ejercicio.musculo})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estadísticas rápidas */}
                {estadisticasEjercicio && (
                  <div style={{ 
                    display: "flex", 
                    gap: "20px", 
                    backgroundColor: "#f8f9fa", 
                    padding: "15px", 
                    borderRadius: "8px",
                    flexWrap: "wrap"
                  }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontWeight: "bold", color: "#007bff" }}>{estadisticasEjercicio.sesiones}</div>
                      <div style={{ fontSize: "12px", color: "#6c757d" }}>Sesiones</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontWeight: "bold", color: "#28a745" }}>{estadisticasEjercicio.pesoMaximo}kg</div>
                      <div style={{ fontSize: "12px", color: "#6c757d" }}>Peso Máx</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontWeight: "bold", color: "#ffc107" }}>{estadisticasEjercicio.volumenMaximo}</div>
                      <div style={{ fontSize: "12px", color: "#6c757d" }}>Vol. Máx</div>
                    </div>
                  </div>
                )}
              </div>

              {datosEjercicioSeleccionado.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <h4>No hay entrenamientos registrados para este ejercicio</h4>
                  <p>Registra algunos entrenamientos para ver el progreso</p>
                </div>
              ) : (
                <div>
                  <h3>📊 Progresión de Volumen - {ejerciciosDisponibles.find(e => e.id === ejercicioSeleccionado)?.nombre}</h3>
                  <div style={{ height: "400px", marginBottom: "30px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={datosEjercicioSeleccionado}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="fechaFormateada" 
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          label={{ value: 'Volumen', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="volumen" 
                          stroke="#27ae60" 
                          strokeWidth={3}
                          dot={{ fill: "#27ae60", strokeWidth: 2, r: 6 }}
                          name="Volumen Total"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <h4>🏋️‍♂️ Progresión de Peso Utilizado</h4>
                  <div style={{ height: "400px", marginBottom: "20px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={datosEjercicioSeleccionado}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="fechaFormateada" 
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="pesoUtilizado" 
                          stroke="#f39c12" 
                          strokeWidth={3}
                          dot={{ fill: "#f39c12", strokeWidth: 2, r: 6 }}
                          name="Peso Utilizado"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}
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
          onClick={() => setCurrentView("historial")}
          className="login-button"
        >
          📋 Ver Historial
        </button>
        <button 
          onClick={() => setCurrentView("registrarRutina")}
          className="login-button"
        >
          🏋️‍♂️ Entrenar
        </button>
        <button 
          onClick={() => setCurrentView("formularioDatos")}
          className="login-button secondary"
        >
          📏 Nueva Medición
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

export default GraficosProgreso;