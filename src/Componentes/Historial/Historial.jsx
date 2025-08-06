import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase-config";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { 
  calcularPorcentajeGrasa, 
} from "../../utils/fitnessUtils";

const Historial = ({ setCurrentView }) => {
  const [historialData, setHistorialData] = useState([]);
  const [entrenamientosData, setEntrenamientosData] = useState([]);
  const [ejerciciosDisponibles, setEjerciciosDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados del formulario
  const [tipoGrafica, setTipoGrafica] = useState("grasa_corporal");
  const [ejercicioSeleccionado, setEjercicioSeleccionado] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await Promise.all([
          cargarHistorialMedidas(user.uid),
          cargarEntrenamientos(user.uid)
        ]);
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const cargarHistorialMedidas = async (userId) => {
    try {
      // Intentar cargar desde 'historial'
      let historialRef = collection(db, "usuarios", userId, "historial");
      let q = query(historialRef, orderBy("fecha", "asc"));
      let historialSnapshot = await getDocs(q);
      
      // Si no hay datos, intentar desde 'historialProgreso'
      if (historialSnapshot.docs.length === 0) {
        historialRef = collection(db, "usuarios", userId, "historialProgreso");
        q = query(historialRef, orderBy("fechaRegistro", "asc"));
        historialSnapshot = await getDocs(q);
      }
      
      const historialList = historialSnapshot.docs.map(doc => {
        const data = doc.data();
        const fecha = data.fecha || data.fechaRegistro;
        const fechaObj = new Date(fecha);
        
        return {
          id: doc.id,
          ...data,
          fecha: fecha,
          fechaFormateada: fechaObj.toLocaleDateString('es-ES', {
            month: 'short',
            day: 'numeric',
            year: '2-digit'
          }),
          porcentajeGrasa: calcularPorcentajeGrasa(data).toFixed(1),
          timestamp: fechaObj.getTime()
        };
      });
      
      setHistorialData(historialList);
    } catch (error) {
      console.error("Error al cargar historial de medidas:", error);
    }
  };

  const cargarEntrenamientos = async (userId) => {
    try {
      // Obtener todos los ejercicios
      const ejerciciosSnapshot = await getDocs(collection(db, "ejercicios"));
      const entrenamientosMap = new Map();
      const ejerciciosInfo = [];

      for (const ejercicioDoc of ejerciciosSnapshot.docs) {
        const ejercicioData = ejercicioDoc.data();
        ejerciciosInfo.push({
          id: ejercicioDoc.id,
          nombre: ejercicioData.nombre,
          musculo: ejercicioData.musculo
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
            ejercicioId: ejercicioDoc.id,
            ejercicioNombre: ejercicioData.nombre,
            fechaFormateada: fecha.toLocaleDateString('es-ES', {
              month: 'short',
              day: 'numeric',
              year: '2-digit'
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

      setEjerciciosDisponibles(ejerciciosInfo);
      setEntrenamientosData(entrenamientosMap);
      
      // Seleccionar el primer ejercicio por defecto
      if (ejerciciosInfo.length > 0 && !ejercicioSeleccionado) {
        setEjercicioSeleccionado(ejerciciosInfo[0].id);
      }
    } catch (error) {
      console.error("Error al cargar entrenamientos:", error);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#333' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ margin: '0 0 4px 0', color: entry.color, fontSize: '14px' }}>
              <strong>{entry.name}:</strong> {entry.value}
              {entry.name.includes('Grasa') ? '%' : 
               entry.name.includes('Volumen') ? ' kg' :
               entry.name.includes('Peso') ? ' kg' :
               entry.name.includes('Sets') ? '' : ' cm'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderGrafica = () => {
    switch (tipoGrafica) {
      case "grasa_corporal":
        if (historialData.length === 0) {
          return (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: "72px", marginBottom: "20px" }}>📊</div>
              <h3 style={{ color: "#6c757d" }}>No hay datos de porcentaje de grasa</h3>
              <p style={{ color: "#6c757d", marginBottom: "30px" }}>
                Calcula tu porcentaje de grasa para empezar a ver el progreso
              </p>
              <button 
                onClick={() => setCurrentView("grasa")}
                style={{
                  padding: "15px 30px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "25px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold"
                }}
              >
                📊 Calcular Grasa Corporal
              </button>
            </div>
          );
        }
        return (
          <div style={{ height: "400px", backgroundColor: "white", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
            <h3 style={{ marginTop: "0", marginBottom: "20px", color: "#495057" }}>
              📊 Evolución del Porcentaje de Grasa Corporal
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historialData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="fechaFormateada" tick={{ fontSize: 12 }} stroke="#6c757d" />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 12 }} stroke="#6c757d" label={{ value: 'Porcentaje (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="porcentajeGrasa" stroke="#e74c3c" strokeWidth={4} dot={{ fill: "#e74c3c", strokeWidth: 2, r: 6 }} activeDot={{ r: 8, stroke: "#e74c3c", strokeWidth: 2 }} name="Porcentaje de Grasa" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case "peso_corporal":
        if (historialData.length === 0) {
          return (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: "72px", marginBottom: "20px" }}>⚖️</div>
              <h3 style={{ color: "#6c757d" }}>No hay datos de peso corporal</h3>
              <p style={{ color: "#6c757d", marginBottom: "30px" }}>
                Agrega medidas corporales para ver la evolución de tu peso
              </p>
              <button 
                onClick={() => setCurrentView("formularioDatos")}
                style={{
                  padding: "15px 30px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "25px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold"
                }}
              >
                📝 Agregar Medidas
              </button>
            </div>
          );
        }
        return (
          <div style={{ height: "400px", backgroundColor: "white", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
            <h3 style={{ marginTop: "0", marginBottom: "20px", color: "#495057" }}>
              ⚖️ Evolución del Peso Corporal
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historialData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="fechaFormateada" tick={{ fontSize: 12 }} stroke="#6c757d" />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 12 }} stroke="#6c757d" label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="peso" stroke="#3498db" strokeWidth={4} dot={{ fill: "#3498db", strokeWidth: 2, r: 6 }} activeDot={{ r: 8, stroke: "#3498db", strokeWidth: 2 }} name="Peso Corporal" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case "medidas_corporales":
        if (historialData.length === 0) {
          return (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: "72px", marginBottom: "20px" }}>📐</div>
              <h3 style={{ color: "#6c757d" }}>No hay datos de medidas corporales</h3>
              <p style={{ color: "#6c757d", marginBottom: "30px" }}>
                Agrega medidas corporales para ver la evolución de tus medidas
              </p>
              <button 
                onClick={() => setCurrentView("formularioDatos")}
                style={{
                  padding: "15px 30px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "25px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold"
                }}
              >
                📝 Agregar Medidas
              </button>
            </div>
          );
        }
        return (
          <div style={{ height: "400px", backgroundColor: "white", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
            <h3 style={{ marginTop: "0", marginBottom: "20px", color: "#495057" }}>
              📐 Evolución de Medidas Corporales
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historialData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="fechaFormateada" tick={{ fontSize: 12 }} stroke="#6c757d" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6c757d" label={{ value: 'Medidas (cm)', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="cintura" stroke="#f39c12" strokeWidth={3} dot={{ fill: "#f39c12", r: 5 }} name="Cintura" />
                <Line type="monotone" dataKey="cuello" stroke="#9b59b6" strokeWidth={3} dot={{ fill: "#9b59b6", r: 5 }} name="Cuello" />
                <Line type="monotone" dataKey="cuadriceps" stroke="#1abc9c" strokeWidth={3} dot={{ fill: "#1abc9c", r: 5 }} name="Cuádriceps" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case "volumen_ejercicio":
        const datosEjercicio = ejercicioSeleccionado ? entrenamientosData.get(ejercicioSeleccionado) || [] : [];
        const ejercicioInfo = ejerciciosDisponibles.find(ej => ej.id === ejercicioSeleccionado);
        
        if (datosEjercicio.length === 0) {
          return (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: "72px", marginBottom: "20px" }}>🏋️</div>
              <h3 style={{ color: "#6c757d" }}>
                No hay entrenamientos{ejercicioInfo ? ` de ${ejercicioInfo.nombre}` : ""}
              </h3>
              <p style={{ color: "#6c757d", marginBottom: "30px" }}>
                Registra entrenamientos para ver la progresión de volumen
              </p>
              <button 
                onClick={() => setCurrentView("registrarRutina")}
                style={{
                  padding: "15px 30px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "25px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold"
                }}
              >
                🏋️ Registrar Entrenamiento
              </button>
            </div>
          );
        }
        
        return (
          <div>
            <div style={{ backgroundColor: "#007bff", color: "white", padding: "15px", borderRadius: "10px", marginBottom: "20px", textAlign: "center" }}>
              <h3 style={{ margin: "0" }}>📈 {ejercicioInfo?.nombre} ({ejercicioInfo?.musculo})</h3>
            </div>
            <div style={{ height: "400px", backgroundColor: "white", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
              <h3 style={{ marginTop: "0", marginBottom: "20px", color: "#495057" }}>
                📊 Progresión de Volumen Total (Peso × Reps × Sets)
              </h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={datosEjercicio}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="fechaFormateada" tick={{ fontSize: 12 }} stroke="#6c757d" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6c757d" label={{ value: 'Volumen (kg)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="volumen" stroke="#27ae60" strokeWidth={4} dot={{ fill: "#27ae60", strokeWidth: 2, r: 6 }} activeDot={{ r: 8, stroke: "#27ae60", strokeWidth: 2 }} name="Volumen Total" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case "peso_ejercicio":
        const datosEjercicioPeso = ejercicioSeleccionado ? entrenamientosData.get(ejercicioSeleccionado) || [] : [];
        const ejercicioInfoPeso = ejerciciosDisponibles.find(ej => ej.id === ejercicioSeleccionado);
        
        if (datosEjercicioPeso.length === 0) {
          return (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: "72px", marginBottom: "20px" }}>💪</div>
              <h3 style={{ color: "#6c757d" }}>
                No hay entrenamientos{ejercicioInfoPeso ? ` de ${ejercicioInfoPeso.nombre}` : ""}
              </h3>
              <p style={{ color: "#6c757d", marginBottom: "30px" }}>
                Registra entrenamientos para ver la progresión de peso
              </p>
              <button 
                onClick={() => setCurrentView("registrarRutina")}
                style={{
                  padding: "15px 30px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "25px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold"
                }}
              >
                🏋️ Registrar Entrenamiento
              </button>
            </div>
          );
        }
        
        return (
          <div>
            <div style={{ backgroundColor: "#f39c12", color: "white", padding: "15px", borderRadius: "10px", marginBottom: "20px", textAlign: "center" }}>
              <h3 style={{ margin: "0" }}>💪 {ejercicioInfoPeso?.nombre} ({ejercicioInfoPeso?.musculo})</h3>
            </div>
            <div style={{ height: "400px", backgroundColor: "white", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
              <h3 style={{ marginTop: "0", marginBottom: "20px", color: "#495057" }}>
                💪 Progresión de Peso Utilizado
              </h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={datosEjercicioPeso}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="fechaFormateada" tick={{ fontSize: 12 }} stroke="#6c757d" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6c757d" label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="pesoUtilizado" stroke="#f39c12" strokeWidth={4} dot={{ fill: "#f39c12", strokeWidth: 2, r: 6 }} activeDot={{ r: 8, stroke: "#f39c12", strokeWidth: 2 }} name="Peso Utilizado" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case "sets_ejercicio":
        const datosEjercicioSets = ejercicioSeleccionado ? entrenamientosData.get(ejercicioSeleccionado) || [] : [];
        const ejercicioInfoSets = ejerciciosDisponibles.find(ej => ej.id === ejercicioSeleccionado);
        
        if (datosEjercicioSets.length === 0) {
          return (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: "72px", marginBottom: "20px" }}>🔢</div>
              <h3 style={{ color: "#6c757d" }}>
                No hay entrenamientos{ejercicioInfoSets ? ` de ${ejercicioInfoSets.nombre}` : ""}
              </h3>
              <p style={{ color: "#6c757d", marginBottom: "30px" }}>
                Registra entrenamientos para ver la evolución de sets
              </p>
              <button 
                onClick={() => setCurrentView("registrarRutina")}
                style={{
                  padding: "15px 30px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "25px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold"
                }}
              >
                🏋️ Registrar Entrenamiento
              </button>
            </div>
          );
        }
        
        return (
          <div>
            <div style={{ backgroundColor: "#8884d8", color: "white", padding: "15px", borderRadius: "10px", marginBottom: "20px", textAlign: "center" }}>
              <h3 style={{ margin: "0" }}>🔢 {ejercicioInfoSets?.nombre} ({ejercicioInfoSets?.musculo})</h3>
            </div>
            <div style={{ height: "400px", backgroundColor: "white", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
              <h3 style={{ marginTop: "0", marginBottom: "20px", color: "#495057" }}>
                🔢 Evolución de Sets Realizados
              </h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosEjercicioSets}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="fechaFormateada" tick={{ fontSize: 12 }} stroke="#6c757d" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6c757d" label={{ value: 'Sets', angle: -90, position: 'insideLeft' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="setsRealizados" fill="#8884d8" name="Sets Realizados" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      default:
        return <div>Selecciona una opción para ver las gráficas</div>;
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        flexDirection: "column",
        gap: "20px"
      }}>
        <div style={{ fontSize: "48px" }}>📊</div>
        <div style={{ fontSize: "18px", color: "#007bff" }}>Cargando historial de progreso...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h2>📈 Historial de Progreso</h2>
      
      {/* Formulario de opciones */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "15px",
        padding: "25px",
        marginBottom: "30px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
      }}>
        <h3 style={{ marginTop: "0", marginBottom: "20px", color: "#495057" }}>
          🎯 Selecciona el tipo de progreso a visualizar:
        </h3>
        
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
          gap: "20px",
          marginBottom: "20px"
        }}>
          {/* Medidas Corporales */}
          <div style={{ 
            border: "2px solid #dee2e6", 
            borderRadius: "10px", 
            padding: "15px",
            backgroundColor: "#f8f9fa"
          }}>
            <h4 style={{ margin: "0 0 15px 0", color: "#495057" }}>📏 Medidas Corporales</h4>
            
            <label style={{ display: "block", marginBottom: "8px", cursor: "pointer" }}>
              <input
                type="radio"
                name="tipoGrafica"
                value="grasa_corporal"
                checked={tipoGrafica === "grasa_corporal"}
                onChange={(e) => setTipoGrafica(e.target.value)}
                style={{ marginRight: "8px" }}
              />
              📊 Porcentaje de Grasa Corporal
            </label>
            
            <label style={{ display: "block", marginBottom: "8px", cursor: "pointer" }}>
              <input
                type="radio"
                name="tipoGrafica"
                value="peso_corporal"
                checked={tipoGrafica === "peso_corporal"}
                onChange={(e) => setTipoGrafica(e.target.value)}
                style={{ marginRight: "8px" }}
              />
              ⚖️ Peso Corporal
            </label>
            
            <label style={{ display: "block", cursor: "pointer" }}>
              <input
                type="radio"
                name="tipoGrafica"
                value="medidas_corporales"
                checked={tipoGrafica === "medidas_corporales"}
                onChange={(e) => setTipoGrafica(e.target.value)}
                style={{ marginRight: "8px" }}
              />
              📐 Medidas (Cintura, Cuello, Cuádriceps)
            </label>
          </div>

          {/* Entrenamientos */}
          <div style={{ 
            border: "2px solid #dee2e6", 
            borderRadius: "10px", 
            padding: "15px",
            backgroundColor: "#f8f9fa"
          }}>
            <h4 style={{ margin: "0 0 15px 0", color: "#495057" }}>🏋️ Entrenamientos por Ejercicio</h4>
            
            <label style={{ display: "block", marginBottom: "8px", cursor: "pointer" }}>
              <input
                type="radio"
                name="tipoGrafica"
                value="volumen_ejercicio"
                checked={tipoGrafica === "volumen_ejercicio"}
                onChange={(e) => setTipoGrafica(e.target.value)}
                style={{ marginRight: "8px" }}
              />
              📊 Volumen de Entrenamiento
            </label>
            
            <label style={{ display: "block", marginBottom: "8px", cursor: "pointer" }}>
              <input
                type="radio"
                name="tipoGrafica"
                value="peso_ejercicio"
                checked={tipoGrafica === "peso_ejercicio"}
                onChange={(e) => setTipoGrafica(e.target.value)}
                style={{ marginRight: "8px" }}
              />
              💪 Peso Utilizado
            </label>
            
            <label style={{ display: "block", cursor: "pointer" }}>
              <input
                type="radio"
                name="tipoGrafica"
                value="sets_ejercicio"
                checked={tipoGrafica === "sets_ejercicio"}
                onChange={(e) => setTipoGrafica(e.target.value)}
                style={{ marginRight: "8px" }}
              />
              🔢 Sets Realizados
            </label>
          </div>
        </div>

        {/* Selector de ejercicio (solo si se selecciona una opción de entrenamientos) */}
        {(tipoGrafica.includes("ejercicio")) && ejerciciosDisponibles.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <label style={{ 
              display: "block",
              marginBottom: "10px", 
              fontWeight: "bold",
              color: "#495057"
            }}>
              🎯 Seleccionar Ejercicio:
            </label>
            <select
              value={ejercicioSeleccionado}
              onChange={(e) => setEjercicioSeleccionado(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "8px",
                border: "2px solid #dee2e6",
                fontSize: "16px",
                backgroundColor: "white",
                cursor: "pointer"
              }}
            >
              {ejerciciosDisponibles.map(ejercicio => (
                <option key={ejercicio.id} value={ejercicio.id}>
                  {ejercicio.nombre} ({ejercicio.musculo})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Área de visualización */}
      <div style={{ marginBottom: "40px" }}>
        {renderGrafica()}
      </div>

      {/* Botones de navegación */}
      <div style={{ 
        display: "flex", 
        gap: "15px", 
        justifyContent: "center",
        flexWrap: "wrap"
      }}>
        <button 
          onClick={() => setCurrentView("grasa")}
          style={{
            padding: "12px 24px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "25px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            transition: "all 0.3s ease"
          }}
        >
          📊 Calcular Grasa
        </button>
        
        <button 
          onClick={() => setCurrentView("formularioDatos")}
          style={{
            padding: "12px 24px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "25px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            transition: "all 0.3s ease"
          }}
        >
          📝 Agregar Medición
        </button>
        
        <button 
          onClick={() => setCurrentView("registrarRutina")}
          style={{
            padding: "12px 24px",
            backgroundColor: "#17a2b8",
            color: "white",
            border: "none",
            borderRadius: "25px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            transition: "all 0.3s ease"
          }}
        >
          🏋️ Entrenar
        </button>
        
        <button 
          onClick={() => setCurrentView("menuPrincipal")}
          style={{
            padding: "12px 24px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "25px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            transition: "all 0.3s ease"
          }}
        >
          ← Regresar al Menú
        </button>
      </div>
    </div>
  );
};

export default Historial;