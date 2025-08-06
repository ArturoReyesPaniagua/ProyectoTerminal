import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase-config";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { 
  calcularPorcentajeGrasa, 
  interpretarPorcentajeGrasa,
  RANGOS_GRASA_CORPORAL 
} from "../../utils/fitnessUtils";

const CalculoGrasa = ({ setCurrentView }) => {
  const [userData, setUserData] = useState(null);
  const [porcentajeGrasa, setPorcentajeGrasa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ultimasMediciones, setUltimasMediciones] = useState([]);

  useEffect(() => {
    const cargarDatosUsuario = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) {
          setError("Usuario no autenticado");
          return;
        }

        // ✅ CORREGIDO: Obtener datos del usuario específico
        const userDocRef = doc(db, "usuarios", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          
          // Calcular porcentaje de grasa usando función de utils
          const porcentaje = calcularPorcentajeGrasa(data);
          setPorcentajeGrasa(porcentaje.toFixed(1));
        } else {
          setError("No se encontraron datos del usuario");
        }

        // ✅ CORREGIDO: Cargar últimas mediciones del historial del usuario específico
        await cargarUltimasMediciones(user.uid);

      } catch (error) {
        console.error("Error al cargar datos del usuario:", error);
        setError("Error al cargar los datos. Verifica tu conexión.");
      } finally {
        setLoading(false);
      }
    };

    cargarDatosUsuario();
  }, []);

  const cargarUltimasMediciones = async (userId) => {
    try {
      const historialRef = collection(db, "usuarios", userId, "historial");
      const historialSnapshot = await getDocs(historialRef);
      
      const mediciones = historialSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 5); // Últimas 5 mediciones

      // Calcular porcentaje de grasa para cada medición
      const medicionesConGrasa = mediciones.map(medicion => ({
        ...medicion,
        porcentajeGrasa: calcularPorcentajeGrasa(medicion).toFixed(1),
        fechaFormateada: new Date(medicion.fecha).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      }));

      setUltimasMediciones(medicionesConGrasa);
    } catch (error) {
      console.error("Error al cargar últimas mediciones:", error);
    }
  };

  const calcularProgresion = () => {
    if (ultimasMediciones.length < 2) return null;

    const actual = parseFloat(ultimasMediciones[0].porcentajeGrasa);
    const anterior = parseFloat(ultimasMediciones[1].porcentajeGrasa);
    const cambio = actual - anterior;

    return {
      cambio: cambio.toFixed(1),
      tendencia: cambio < 0 ? "mejorando" : cambio > 0 ? "empeorando" : "estable",
      color: cambio < 0 ? "#28a745" : cambio > 0 ? "#e74c3c" : "#6c757d",
      icono: cambio < 0 ? "📉" : cambio > 0 ? "📈" : "➡️"
    };
  };

  const obtenerRecomendaciones = (porcentaje, sexo) => {
    //const valor = parseFloat(porcentaje); //ya no se necesita parsear, ya que porcentajeGrasa ya es un string con 1 decimal
    const interpretacion = interpretarPorcentajeGrasa(porcentaje, sexo);
    
    const recomendaciones = {
      "Grasa Esencial": [
        "⚠️ Nivel muy bajo - Consulta con un profesional de la salud",
        "🍎 Aumenta la ingesta calórica de forma saludable",
        "💪 Enfócate en ejercicios de fuerza para ganar masa muscular",
        "🩺 Considera realizar análisis médicos completos"
      ],
      "Atlético": [
        "🏆 ¡Excelente nivel para deportistas!",
        "💪 Mantén tu rutina de entrenamiento actual",
        "🥗 Continúa con tu alimentación balanceada",
        "📊 Monitorea regularmente para mantener este nivel"
      ],
      "Fitness": [
        "✅ Muy buen nivel de condición física",
        "🏋️‍♂️ Puedes mantener o reducir ligeramente más",
        "🥘 Equilibra proteínas, carbohidratos y grasas saludables",
        "🎯 Si quieres definir más, ajusta ligeramente las calorías"
      ],
      "Promedio": [
        "👍 Nivel saludable dentro del rango normal",
        "🏃‍♂️ Aumenta la actividad física gradualmente",
        "🥬 Incorpora más verduras y reduce azúcares",
        "⏰ Establece objetivos realistas a mediano plazo"
      ],
      "Obeso": [
        "🩺 Consulta con un profesional de la salud",
        "🚶‍♂️ Comienza con ejercicio cardiovascular suave",
        "🍽️ Considera un plan nutricional supervisado",
        "📱 Usa aplicaciones para monitorear progreso diario"
      ]
    };

    return recomendaciones[interpretacion.categoria] || [
      "📊 Mantén un seguimiento regular de tus medidas",
      "🏃‍♂️ Ejercítate regularmente",
      "🥗 Mantén una alimentación balanceada"
    ];
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Cargando datos...</div>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <div style={{ marginTop: "20px" }}>
          <button 
            onClick={() => setCurrentView("formularioDatos")}
            className="login-button"
            style={{ marginRight: "10px" }}
          >
            Completar Datos
          </button>
          <button 
            onClick={() => setCurrentView("menuPrincipal")}
            className="boton-cancelar"
          >
            Regresar
          </button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div style={{ padding: "20px", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
        <div style={{ fontSize: "64px", marginBottom: "20px" }}>📊</div>
        <h2>Cálculo de Porcentaje de Grasa</h2>
        <p>No se encontraron datos del usuario. Por favor, complete primero el formulario de datos.</p>
        <div style={{ marginTop: "20px" }}>
          <button 
            onClick={() => setCurrentView("formularioDatos")}
            className="login-button"
            style={{ marginRight: "10px" }}
          >
            Ir a Formulario de Datos
          </button>
          <button 
            onClick={() => setCurrentView("menuPrincipal")}
            className="boton-cancelar"
          >
            Regresar al Menú
          </button>
        </div>
      </div>
    );
  }

  const interpretacion = porcentajeGrasa ? 
    interpretarPorcentajeGrasa(porcentajeGrasa, userData.sexo) : null;

  const rangos = userData.sexo === "Masculino" ? 
    RANGOS_GRASA_CORPORAL.masculino : 
    RANGOS_GRASA_CORPORAL.femenino;

  const progresion = calcularProgresion();
  const recomendaciones = interpretacion ? obtenerRecomendaciones(porcentajeGrasa, userData.sexo) : [];

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "30px" }}>
        <h2>🧮 Cálculo de Porcentaje de Grasa Corporal</h2>
        <p style={{ color: "#6c757d" }}>
          Análisis de tu composición corporal basado en medidas antropométricas
        </p>
      </div>
      
      {/* Resultado principal */}
      {porcentajeGrasa && interpretacion && (
        <div style={{ 
          backgroundColor: interpretacion.color, 
          color: "white", 
          padding: "40px", 
          borderRadius: "20px", 
          textAlign: "center",
          marginBottom: "30px",
          boxShadow: "0 8px 25px rgba(0,0,0,0.15)"
        }}>
          <h2 style={{ margin: "0 0 15px 0", fontSize: "1.8rem" }}>Tu Porcentaje de Grasa</h2>
          <div style={{ fontSize: "72px", fontWeight: "bold", margin: "20px 0" }}>
            {porcentajeGrasa}%
          </div>
          <div style={{ fontSize: "24px", fontWeight: "600", margin: "15px 0" }}>
            {interpretacion.categoria}
          </div>
          <p style={{ fontSize: "16px", margin: "10px 0", opacity: 0.9 }}>
            {interpretacion.descripcion}
          </p>
          
          {progresion && (
            <div style={{ 
              marginTop: "20px", 
              padding: "15px", 
              backgroundColor: "rgba(255,255,255,0.2)", 
              borderRadius: "10px" 
            }}>
              <div style={{ fontSize: "14px", marginBottom: "5px" }}>
                Cambio desde la última medición:
              </div>
              <div style={{ fontSize: "20px", fontWeight: "bold" }}>
                {progresion.icono} {progresion.cambio > 0 ? "+" : ""}{progresion.cambio}%
              </div>
            </div>
          )}
        </div>
      )}

      {/* Datos utilizados */}
      <div style={{ 
        backgroundColor: "#f8f9fa", 
        padding: "25px", 
        borderRadius: "15px", 
        marginBottom: "25px",
        border: "1px solid #e9ecef"
      }}>
        <h3 style={{ margin: "0 0 20px 0", color: "#1f4f63" }}>📏 Datos utilizados para el cálculo:</h3>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: "15px" 
        }}>
          <div><strong>👤 Sexo:</strong> {userData.sexo}</div>
          <div><strong>⚖️ Peso:</strong> {userData.peso} kg</div>
          <div><strong>📐 Cintura:</strong> {userData.cintura} cm</div>
          <div><strong>🔗 Cuello:</strong> {userData.cuello} cm</div>
          <div><strong>🦵 Cuádriceps:</strong> {userData.cuadriceps} cm</div>
          <div><strong>📏 Altura:</strong> {userData.altura || "170"} cm</div>
        </div>
      </div>

      {/* Historial reciente */}
      {ultimasMediciones.length > 0 && (
        <div style={{ 
          backgroundColor: "white", 
          padding: "25px", 
          borderRadius: "15px", 
          marginBottom: "25px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ margin: "0 0 20px 0", color: "#1f4f63" }}>📊 Últimas mediciones:</h3>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
            gap: "15px" 
          }}>
            {ultimasMediciones.slice(0, 3).map((medicion, index) => (
              <div 
                key={medicion.id}
                style={{ 
                  padding: "15px", 
                  backgroundColor: index === 0 ? "#e7f3ff" : "#f8f9fa", 
                  borderRadius: "10px",
                  border: index === 0 ? "2px solid #007bff" : "1px solid #e9ecef"
                }}
              >
                <div style={{ 
                  fontSize: "24px", 
                  fontWeight: "bold", 
                  color: index === 0 ? "#007bff" : "#1f4f63" 
                }}>
                  {medicion.porcentajeGrasa}%
                </div>
                <div style={{ fontSize: "12px", color: "#6c757d" }}>
                  {medicion.fechaFormateada}
                  {index === 0 && " (Actual)"}
                </div>
                <div style={{ fontSize: "11px", color: "#6c757d", marginTop: "5px" }}>
                  {medicion.peso}kg • {medicion.cintura}cm cintura
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información del método */}
      <div style={{ 
        backgroundColor: "#e9ecef", 
        padding: "25px", 
        borderRadius: "15px", 
        marginBottom: "25px" 
      }}>
        <h3 style={{ margin: "0 0 15px 0", color: "#1f4f63" }}>🔬 Método utilizado:</h3>
        <div style={{ marginBottom: "20px" }}>
          <strong>Fórmula de la Marina de los Estados Unidos</strong><br/>
          <span style={{ fontSize: "14px", color: "#6c757d" }}>
            Este método utiliza medidas corporales específicas para estimar el porcentaje de grasa corporal.
            Es un método ampliamente reconocido y utilizado por organizaciones militares y de fitness.
          </span>
        </div>
        
        <h4 style={{ margin: "15px 0 10px 0", color: "#1f4f63" }}>
          📊 Rangos de referencia para {userData.sexo}:
        </h4>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
          gap: "10px",
          fontSize: "14px"
        }}>
          <div>
            <span style={{ color: "#e74c3c", fontWeight: "bold" }}>●</span> 
            <strong> Grasa esencial:</strong> {rangos.esencial.min}-{rangos.esencial.max}%
          </div>
          <div>
            <span style={{ color: "#27ae60", fontWeight: "bold" }}>●</span> 
            <strong> Atlético:</strong> {rangos.atletico.min}-{rangos.atletico.max}%
          </div>
          <div>
            <span style={{ color: "#f39c12", fontWeight: "bold" }}>●</span> 
            <strong> Fitness:</strong> {rangos.fitness.min}-{rangos.fitness.max}%
          </div>
          <div>
            <span style={{ color: "#3498db", fontWeight: "bold" }}>●</span> 
            <strong> Promedio:</strong> {rangos.promedio.min}-{rangos.promedio.max}%
          </div>
          <div>
            <span style={{ color: "#e74c3c", fontWeight: "bold" }}>●</span> 
            <strong> Obeso:</strong> {rangos.obeso.min}%+
          </div>
        </div>
      </div>

      {/* Recomendaciones personalizadas */}
      {recomendaciones.length > 0 && (
        <div style={{ 
          backgroundColor: "#fff3cd", 
          border: "1px solid #ffeaa7", 
          borderRadius: "15px", 
          padding: "25px", 
          marginBottom: "25px" 
        }}>
          <h3 style={{ margin: "0 0 15px 0", color: "#856404" }}>
            💡 Recomendaciones personalizadas:
          </h3>
          <ul style={{ margin: "0", paddingLeft: "20px", color: "#856404" }}>
            {recomendaciones.map((recomendacion, index) => (
              <li key={index} style={{ marginBottom: "8px", lineHeight: "1.4" }}>
                {recomendacion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Botones de acción */}
      <div style={{ 
        display: "flex", 
        gap: "15px", 
        justifyContent: "center",
        flexWrap: "wrap"
      }}>
        <button 
          onClick={() => setCurrentView("historial")}
          className="login-button"
        >
          📊 Ver Historial Completo
        </button>
        <button 
          onClick={() => setCurrentView("graficos")}
          className="login-button"
        >
          📈 Ver Gráficos de Progreso
        </button>
        <button 
          onClick={() => setCurrentView("formularioDatos")}
          className="login-button secondary"
        >
          📏 Actualizar Medidas
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

export default CalculoGrasa;