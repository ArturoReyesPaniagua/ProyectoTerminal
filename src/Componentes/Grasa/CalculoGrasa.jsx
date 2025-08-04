import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase-config";
import { doc, getDoc } from "firebase/firestore";
import { 
  calcularPorcentajeGrasa, 
  interpretarPorcentajeGrasa,
  RANGOS_GRASA_CORPORAL 
} from "../../utils/fitnessUtils";

const CalculoGrasa = ({ setCurrentView }) => {
  const [userData, setUserData] = useState(null);
  const [porcentajeGrasa, setPorcentajeGrasa] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatosUsuario = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, "usuarios", user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            // Usar función de utils
            const porcentaje = calcularPorcentajeGrasa(data);
            setPorcentajeGrasa(porcentaje.toFixed(1));
          }
        }
      } catch (error) {
        console.error("Error al cargar datos del usuario:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatosUsuario();
  }, []);

  if (loading) {
    return <div className="loading">Cargando datos...</div>;
  }

  if (!userData) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Cálculo de Porcentaje de Grasa</h2>
        <p>No se encontraron datos del usuario. Por favor, complete primero el formulario de datos.</p>
        <button 
          onClick={() => setCurrentView("formularioDatos")}
          className="btn btn-primario"
        >
          Ir a Formulario de Datos
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

  const interpretacion = porcentajeGrasa ? 
    interpretarPorcentajeGrasa(porcentajeGrasa, userData.sexo) : null;

  const rangos = userData.sexo === "Masculino" ? 
    RANGOS_GRASA_CORPORAL.masculino : 
    RANGOS_GRASA_CORPORAL.femenino;

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h2>Cálculo de Porcentaje de Grasa Corporal</h2>
      
      <div style={{ backgroundColor: "#f8f9fa", padding: "20px", borderRadius: "10px", marginBottom: "20px" }}>
        <h3>Datos utilizados:</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <p><strong>Sexo:</strong> {userData.sexo}</p>
          <p><strong>Peso:</strong> {userData.peso} kg</p>
          <p><strong>Cintura:</strong> {userData.cintura} cm</p>
          <p><strong>Cuello:</strong> {userData.cuello} cm</p>
          <p><strong>Cuádriceps:</strong> {userData.cuadriceps} cm</p>
          <p><strong>Altura:</strong> {userData.altura || "170"} cm</p>
        </div>
      </div>

      {porcentajeGrasa && interpretacion && (
        <div style={{ 
          backgroundColor: interpretacion.color, 
          color: "white", 
          padding: "30px", 
          borderRadius: "15px", 
          textAlign: "center",
          marginBottom: "20px"
        }}>
          <h2 style={{ margin: "0 0 10px 0" }}>Tu Porcentaje de Grasa</h2>
          <div style={{ fontSize: "48px", fontWeight: "bold", margin: "10px 0" }}>
            {porcentajeGrasa}%
          </div>
          <p style={{ fontSize: "18px", margin: "0" }}>
            Categoría: {interpretacion.categoria}
          </p>
          <p style={{ fontSize: "14px", margin: "5px 0 0 0", opacity: 0.9 }}>
            {interpretacion.descripcion}
          </p>
        </div>
      )}

      <div style={{ backgroundColor: "#e9ecef", padding: "20px", borderRadius: "10px", marginBottom: "20px" }}>
        <h3>Método utilizado:</h3>
        <p>
          <strong>Fórmula de la Marina de los Estados Unidos</strong><br/>
          Este método utiliza medidas corporales específicas para estimar el porcentaje de grasa corporal.
          Es un método ampliamente reconocido y utilizado por organizaciones militares y de fitness.
        </p>
        
        <h4>Rangos de referencia para {userData.sexo}:</h4>
        <ul>
          <li>Grasa esencial: {rangos.esencial.min}-{rangos.esencial.max}%</li>
          <li>Atlético: {rangos.atletico.min}-{rangos.atletico.max}%</li>
          <li>Fitness: {rangos.fitness.min}-{rangos.fitness.max}%</li>
          <li>Promedio: {rangos.promedio.min}-{rangos.promedio.max}%</li>
          <li>Obeso: {rangos.obeso.min}%+</li>
        </ul>
      </div>

      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
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
          onClick={() => setCurrentView("actualizarDatos")}
          style={{
            padding: "12px 24px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Actualizar Datos
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
          Regresar
        </button>
      </div>
    </div>
  );
};

export default CalculoGrasa;