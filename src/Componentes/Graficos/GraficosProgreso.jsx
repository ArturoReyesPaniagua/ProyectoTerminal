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

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          // Cargar historial de medidas corporales
          await cargarHistorialGrasa(user.uid);
          
          // Cargar datos de entrenamientos
          await cargarEntrenamientos(user.uid);
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  const cargarHistorialGrasa = async (userId) => {
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
  };

  const cargarEntrenamientos = async (userId) => {
    try {
      // Obtener todos los ejercicios
      const ejerciciosSnapshot = await getDocs(collection(db, "ejercicios"));
      const ejerciciosList = [];
      const entrenamientosMap = new Map();

      for (const ejercicioDoc of ejerciciosSnapshot.docs) {
        const ejercicioData = ejercicioDoc.data();
        ejerciciosList.push({
          id: ejercicioDoc.id,
          nombre: ejercicioData.nombre
        });

        // Obtener entrenamientos de este ejercicio
        const entrenamientosRef = collection(db, "ejercicios", ejercicioDoc.id, "entrenamientos");
        const entrenamientosSnapshot = await getDocs(query(entrenamientosRef, orderBy("fecha", "asc")));
        
        const entrenamientosList = entrenamientosSnapshot.docs.map(doc => {
          const data = doc.data();
          const fecha = new Date(data.fecha);
          const volumen = (data.pesoUtilizado || 0) * (data.repeticionesAlcanzadas || 0) * (data.setsRealizados || 0);
          
          return {
            ...data,
            fechaFormateada: fecha.toLocaleDateString('es-ES', {
              month: 'short',
              day: 'numeric'
            }),
            volumen: volumen,
            timestamp: fecha.getTime()
          };
        });

        if (entrenamientosList.length > 0) {
          entrenamientosMap.set(ejercicioDoc.id, entrenamientosList);
        }
      }

      setEjerciciosDisponibles(ejerciciosList);
      setEntrenamientosData(entrenamientosMap);
      
      // Seleccionar el primer ejercicio por defecto
      if (ejerciciosList.length > 0) {
        setEjercicioSeleccionado(ejerciciosList[0].id);
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
              {entry.name}: {entry.value}{entry.name.includes('Grasa') ? '%' : entry.name.includes('Volumen') ? ' kg×reps×sets' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div>Cargando gráficos...</div>;
  }

  const datosEjercicioSeleccionado = ejercicioSeleccionado ? entrenamientosData.get(ejercicioSeleccionado) || [] : [];

  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <h2>Gráficos de Progreso</h2>
      
      {/* Navegación de vistas */}
      <div style={{ 
        display: "flex", 
        marginBottom: "30px", 
        borderBottom: "1px solid #dee2e6" 
      }}>
        <button
          onClick={() => setVistaActual("grasa")}
          style={{
            padding: "12px 24px",
            border: "none",
            borderBottom: vistaActual === "grasa" ? "3px solid #007bff" : "none",
            backgroundColor: "transparent",
            color: vistaActual === "grasa" ? "#007bff" : "#6c757d",
            cursor: "pointer",
            fontWeight: vistaActual === "grasa" ? "bold" : "normal",
            fontSize: "16px"
          }}
        >
          Porcentaje de Grasa
        </button>
        <button
          onClick={() => setVistaActual("entrenamientos")}
          style={{
            padding: "12px 24px",
            border: "none",
            borderBottom: vistaActual === "entrenamientos" ? "3px solid #007bff" : "none",
            backgroundColor: "transparent",
            color: vistaActual === "entrenamientos" ? "#007bff" : "#6c757d",
            cursor: "pointer",
            fontWeight: vistaActual === "entrenamientos" ? "bold" : "normal",
            fontSize: "16px"
          }}
        >
          Volumen de Entrenamientos
        </button>
      </div>

      {/* Vista de Porcentaje de Grasa */}
      {vistaActual === "grasa" && (
        <div>
          {historialData.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <h3>No hay datos suficientes para mostrar gráficos</h3>
              <p>Necesitas al menos 2 mediciones para ver tu progreso.</p>
              <button 
                onClick={() => setCurrentView("formularioDatos")}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer"
                }}
              >
                Agregar Medición
              </button>
            </div>
          ) : (
            <div>
              <h3>Evolución del Porcentaje de Grasa Corporal</h3>
              <div style={{ height: "400px", marginBottom: "20px" }}>
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

              <div style={{ height: "400px", marginBottom: "20px" }}>
                <h4>Evolución del Peso Corporal</h4>
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
        <div>
          {ejerciciosDisponibles.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <h3>No hay datos de entrenamientos disponibles</h3>
              <p>Primero debes registrar algunos entrenamientos para ver tu progreso.</p>
              <button 
                onClick={() => setCurrentView("registrarRutina")}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer"
                }}
              >
                Registrar Entrenamiento
              </button>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ marginRight: "10px", fontWeight: "bold" }}>
                  Seleccionar Ejercicio:
                </label>
                <select
                  value={ejercicioSeleccionado}
                  onChange={(e) => setEjercicioSeleccionado(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    fontSize: "14px"
                  }}
                >
                  {ejerciciosDisponibles.map(ejercicio => (
                    <option key={ejercicio.id} value={ejercicio.id}>
                      {ejercicio.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {datosEjercicioSeleccionado.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <h4>No hay entrenamientos registrados para este ejercicio</h4>
                </div>
              ) : (
                <div>
                  <h3>Progresión de Volumen - {ejerciciosDisponibles.find(e => e.id === ejercicioSeleccionado)?.nombre}</h3>
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

                  <div style={{ height: "400px", marginBottom: "20px" }}>
                    <h4>Progresión de Peso Utilizado</h4>
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
        gap: "10px", 
        justifyContent: "center",
        marginTop: "30px"
      }}>
        <button 
          onClick={() => setCurrentView("historial")}
          style={{
            padding: "12px 24px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Ver Historial
        </button>
        <button 
          onClick={() => setCurrentView("registrarRutina")}
          style={{
            padding: "12px 24px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Registrar Entrenamiento
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

export default GraficosProgreso;