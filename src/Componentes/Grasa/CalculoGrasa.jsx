import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase-config";
import { doc, getDoc } from "firebase/firestore";

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
            calcularPorcentajeGrasa(data);
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

  const calcularPorcentajeGrasa = (datos) => {
    const { sexo, cintura, cuello, cuadriceps, peso } = datos;
    let altura = datos.altura || 170; // valor por defecto si no existe
    
    // Convertir a centímetros si está en metros
    if (altura < 3) {
      altura = altura * 100;
    }

    let porcentaje = 0;

    if (sexo === "Masculino") {
      // Fórmula para hombres: 86.010 × log10(cintura - cuello) - 70.041 × log10(altura) + 36.76
      porcentaje = 86.010 * Math.log10(cintura - cuello) - 70.041 * Math.log10(altura) + 36.76;
    } else if (sexo === "Femenino") {
      // Fórmula para mujeres: 163.205×log10(cintura+cadera−cuello)−97.684×log10(altura)−78.387
      // Usamos cuádriceps como aproximación de cadera
      porcentaje = 163.205 * Math.log10(cintura + cuadriceps - cuello) - 97.684 * Math.log10(altura) - 78.387;
    }

    // Asegurar que el porcentaje esté en un rango válido
    porcentaje = Math.max(2, Math.min(50, porcentaje));
    setPorcentajeGrasa(porcentaje.toFixed(1));
  };

  const interpretarPorcentaje = (porcentaje, sexo) => {
    const valor = parseFloat(porcentaje);
    
    if (sexo === "Masculino") {
      if (valor < 6) return { categoria: "Esencial", color: "#e74c3c" };
      if (valor < 14) return { categoria: "Atlético", color: "#27ae60" };
      if (valor < 18) return { categoria: "Fitness", color: "#f39c12" };
      if (valor < 25) return { categoria: "Promedio", color: "#3498db" };
      return { categoria: "Obeso", color: "#e74c3c" };
    } else {
      if (valor < 14) return { categoria: "Esencial", color: "#e74c3c" };
      if (valor < 21) return { categoria: "Atlético", color: "#27ae60" };
      if (valor < 25) return { categoria: "Fitness", color: "#f39c12" };
      if (valor < 32) return { categoria: "Promedio", color: "#3498db" };
      return { categoria: "Obeso", color: "#e74c3c" };
    }
  };

  if (loading) {
    return <div>Cargando datos...</div>;
  }

  if (!userData) {
    return (
      <div>
        <h2>Cálculo de Porcentaje de Grasa</h2>
        <p>No se encontraron datos del usuario. Por favor, complete primero el formulario de datos.</p>
        <button onClick={() => setCurrentView("formularioDatos")}>
          Ir a Formulario de Datos
        </button>
        <button onClick={() => setCurrentView("menuPrincipal")}>
          Regresar al Menú
        </button>
      </div>
    );
  }

  const interpretacion = porcentajeGrasa ? interpretarPorcentaje(porcentajeGrasa, userData.sexo) : null;

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

      {porcentajeGrasa && (
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
        </div>
      )}

      <div style={{ backgroundColor: "#e9ecef", padding: "20px", borderRadius: "10px", marginBottom: "20px" }}>
        <h3>Método utilizado:</h3>
        <p>
          <strong>Fórmula de la Marina de los Estados Unidos</strong><br/>
          Este método utiliza medidas corporales específicas para estimar el porcentaje de grasa corporal.
          Es un método ampliamente reconocido y utilizado por organizaciones militares y de fitness.
        </p>
        
        <h4>Rangos de referencia:</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <strong>Hombres:</strong>
            <ul>
              <li>Grasa esencial: 2-5%</li>
              <li>Atlético: 6-13%</li>
              <li>Fitness: 14-17%</li>
              <li>Promedio: 18-24%</li>
              <li>Obeso: 25%+</li>
            </ul>
          </div>
          <div>
            <strong>Mujeres:</strong>
            <ul>
              <li>Grasa esencial: 10-13%</li>
              <li>Atlético: 14-20%</li>
              <li>Fitness: 21-24%</li>
              <li>Promedio: 25-31%</li>
              <li>Obeso: 32%+</li>
            </ul>
          </div>
        </div>
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