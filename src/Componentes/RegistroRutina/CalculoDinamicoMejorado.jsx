import React, { useState, useEffect } from "react";
import { db } from "../../firebase-config";
import { collection, doc, getDocs, getDoc, addDoc, orderBy, query, limit } from "firebase/firestore";

const CalculoDinamicoMejorado = ({ rutinaSeleccionada, setCurrentStep }) => {
  const [objetivos, setObjetivos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [repeticionesActuales, setRepeticionesActuales] = useState(0);
  const [contadorSets, setContadorSets] = useState(1);
  const [modoPesoCarga, setModoPesoCarga] = useState(false); // false = cantidad, true = calidad
  const [tasaIncremento, setTasaIncremento] = useState(0.02);
  const [ejerciciosCompletados, setEjerciciosCompletados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calcularObjetivos = async () => {
      try {
        const ejerciciosList = [];

        for (const ejercicioId of rutinaSeleccionada.ejercicios) {
          const ejercicioRef = doc(db, "ejercicios", ejercicioId);
          const ejercicioDoc = await getDoc(ejercicioRef);

          if (ejercicioDoc.exists()) {
            const ejercicioData = ejercicioDoc.data();

            // Obtener los últimos entrenamientos
            const entrenamientosSnapshot = await getDocs(
              query(
                collection(db, "ejercicios", ejercicioId, "entrenamientos"),
                orderBy("fecha", "desc"),
                limit(5)
              )
            );

            const entrenamientos = entrenamientosSnapshot.docs.map((doc) => doc.data());
            const ultimoEntrenamiento = entrenamientos[0] || {
              pesoUtilizado: 10, // Peso base para principiantes
              repeticionesAlcanzadas: 8,
              setsRealizados: 3,
            };

            // Calcular 1RM estimado basado en el último entrenamiento
            const rmEstimado = calcular1RM(
              ultimoEntrenamiento.pesoUtilizado,
              ultimoEntrenamiento.repeticionesAlcanzadas
            );

            // Calcular objetivos según el modo seleccionado
            const objetivoCalculado = calcularObjetivoProgresivo(ultimoEntrenamiento, rmEstimado);

            ejerciciosList.push({
              id: ejercicioId,
              nombre: ejercicioData.nombre,
              musculo: ejercicioData.musculo,
              rmEstimado: rmEstimado,
              ultimoEntrenamiento: ultimoEntrenamiento,
              ...objetivoCalculado,
              entrenamientosAnteriores: entrenamientos,
            });
          }
        }

        setObjetivos(ejerciciosList);
        setLoading(false);
      } catch (error) {
        console.error("Error al calcular objetivos:", error);
        setLoading(false);
      }
    };

    calcularObjetivos();
  }, [rutinaSeleccionada, modoPesoCarga, tasaIncremento]);

  // Calcular 1RM usando interpolación lineal con la tabla de porcentajes
  const calcular1RM = (peso, repeticiones) => {
    // Tabla de 1RM (% del 1RM vs repeticiones)
    const tabla1RM = [
      { porcentaje: 100, repeticiones: 1 },
      { porcentaje: 95, repeticiones: 2 },
      { porcentaje: 93, repeticiones: 3 },
      { porcentaje: 90, repeticiones: 4 },
      { porcentaje: 87, repeticiones: 5 },
      { porcentaje: 85, repeticiones: 6 },
      { porcentaje: 83, repeticiones: 7 },
      { porcentaje: 80, repeticiones: 8 },
      { porcentaje: 77, repeticiones: 9 },
      { porcentaje: 75, repeticiones: 10 },
      { porcentaje: 70, repeticiones: 11 },
      { porcentaje: 67, repeticiones: 12 },
      { porcentaje: 65, repeticiones: 15 }
    ];

    // Encontrar puntos para interpolación
    let punto1 = tabla1RM.find(p => p.repeticiones === repeticiones);
    if (punto1) {
      return peso / (punto1.porcentaje / 100);
    }

    // Interpolación lineal si no hay coincidencia exacta
    let punto1Index = tabla1RM.findIndex(p => p.repeticiones > repeticiones);
    if (punto1Index === -1) punto1Index = tabla1RM.length - 1;
    if (punto1Index === 0) punto1Index = 1;

    const p1 = tabla1RM[punto1Index - 1];
    const p2 = tabla1RM[punto1Index];

    // Fórmula de interpolación lineal: y = y0 + ((x1 - x0)(x - x0))/(y1 - y0)
    const porcentajeInterpolado = p1.porcentaje + 
      ((p2.porcentaje - p1.porcentaje) * (repeticiones - p1.repeticiones)) / 
      (p2.repeticiones - p1.repeticiones);

    return peso / (porcentajeInterpolado / 100);
  };

  const calcularObjetivoProgresivo = (ultimoEntrenamiento, rmEstimado) => {
    const { pesoUtilizado, repeticionesAlcanzadas, setsRealizados } = ultimoEntrenamiento;
    const volumenAnterior = pesoUtilizado * repeticionesAlcanzadas * setsRealizados;

    if (modoPesoCarga) {
      // Modo CALIDAD: Enfoque en peso alto (6 repeticiones al 85% del 1RM)
      const pesoObjetivo = rmEstimado * 0.85;
      const repeticionesObjetivo = 6;
      const setsObjetivo = Math.max(3, setsRealizados);
      
      return {
        pesoSugerido: Math.round(pesoObjetivo * 100) / 100,
        repeticionesObjetivo: repeticionesObjetivo,
        setsSugeridos: setsObjetivo,
        volumenObjetivo: pesoObjetivo * repeticionesObjetivo * setsObjetivo,
        volumenAnterior: volumenAnterior,
        tipoEntrenamiento: "Calidad (Fuerza)"
      };
    } else {
      // Modo CANTIDAD: Enfoque en repeticiones altas
      // Aplicar fórmula de sobrecarga progresiva
      const factorProgresion = calcularFactorProgresion(ultimoEntrenamiento);
      const nuevoVolumen = volumenAnterior * (1 + factorProgresion);
      
      // Calcular nuevos parámetros manteniendo un equilibrio
      let pesoSugerido = pesoUtilizado * (1 + tasaIncremento);
      let repeticionesObjetivo = Math.ceil(nuevoVolumen / (pesoSugerido * setsRealizados));
      let setsObjetivo = setsRealizados;

      // Ajustar si las repeticiones son muy altas
      if (repeticionesObjetivo > 15) {
        repeticionesObjetivo = 12;
        setsObjetivo = Math.ceil(nuevoVolumen / (pesoSugerido * repeticionesObjetivo));
      }

      return {
        pesoSugerido: Math.round(pesoSugerido * 100) / 100,
        repeticionesObjetivo: repeticionesObjetivo,
        setsSugeridos: Math.max(3, setsObjetivo),
        volumenObjetivo: nuevoVolumen,
        volumenAnterior: volumenAnterior,
        tipoEntrenamiento: "Cantidad (Resistencia)"
      };
    }
  };

  const calcularFactorProgresion = (ultimoEntrenamiento) => {
    // Factor de progresión = (reps realizadas/reps objetivo) * (series realizadas/series objetivo) * tasa de incremento
    // Asumimos objetivos base si es el primer entrenamiento
    const repsObjetivo = 10;
    const seriesObjetivo = 3;
    
    const factorReps = Math.min(ultimoEntrenamiento.repeticionesAlcanzadas / repsObjetivo, 1.2);
    const factorSeries = Math.min(ultimoEntrenamiento.setsRealizados / seriesObjetivo, 1.2);
    
    return factorReps * factorSeries * tasaIncremento;
  };

  const handleRegistrarSet = async () => {
    if (repeticionesActuales <= 0) {
      alert("Por favor, ingresa el número de repeticiones realizadas.");
      return;
    }

    const ejercicioActual = objetivos[currentIndex];
    const volumenActualSet = ejercicioActual.pesoSugerido * repeticionesActuales;
    const volumenTotalSesion = ejercicioActual.pesoSugerido * repeticionesActuales * contadorSets;

    // Verificar si se ha cumplido el objetivo o se han completado los sets sugeridos
    const objetivoCumplido = volumenTotalSesion >= ejercicioActual.volumenObjetivo * 0.95; // 95% del objetivo
    const setsCompletados = contadorSets >= ejercicioActual.setsSugeridos;

    if (objetivoCumplido || setsCompletados) {
      // Guardar registro del ejercicio completo
      try {
        await addDoc(collection(db, "ejercicios", ejercicioActual.id, "entrenamientos"), {
          fecha: new Date().toISOString(),
          pesoUtilizado: parseFloat(ejercicioActual.pesoSugerido),
          repeticionesAlcanzadas: repeticionesActuales,
          setsRealizados: contadorSets,
          volumenTotal: volumenTotalSesion,
          tipoEntrenamiento: ejercicioActual.tipoEntrenamiento,
          objetivoCumplido: objetivoCumplido
        });

        // Agregar a ejercicios completados
        setEjerciciosCompletados(prev => [...prev, {
          ...ejercicioActual,
          repeticionesFinales: repeticionesActuales,
          setsFinales: contadorSets,
          volumenFinal: volumenTotalSesion
        }]);

      } catch (error) {
        console.error("Error al guardar el entrenamiento:", error);
      }

      // Pasar al siguiente ejercicio
      if (currentIndex + 1 < objetivos.length) {
        setCurrentIndex(currentIndex + 1);
        setContadorSets(1);
        setRepeticionesActuales(0);
      } else {
        // Finalizar rutina
        setCurrentStep(3);
      }
    } else {
      // Continuar con el siguiente set
      setContadorSets(contadorSets + 1);
      setRepeticionesActuales(0);
    }
  };

  const handleSaltarEjercicio = () => {
    if (currentIndex + 1 < objetivos.length) {
      setCurrentIndex(currentIndex + 1);
      setContadorSets(1);
      setRepeticionesActuales(0);
    } else {
      setCurrentStep(3);
    }
  };

  if (loading) {
    return <div>Calculando objetivos de entrenamiento...</div>;
  }

  if (!objetivos.length) {
    return <div>No se encontraron ejercicios en la rutina seleccionada.</div>;
  }

  const ejercicioActual = objetivos[currentIndex];
  const progresoVolumen = (ejercicioActual.pesoSugerido * repeticionesActuales * contadorSets / ejercicioActual.volumenObjetivo) * 100;

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h2>Sistema de Sobrecarga Progresiva</h2>
      
      {/* Configuración del entrenamiento */}
      <div style={{ 
        backgroundColor: "#f8f9fa", 
        padding: "15px", 
        borderRadius: "10px", 
        marginBottom: "20px" 
      }}>
        <h4>Configuración del Entrenamiento</h4>
        <div style={{ marginBottom: "10px" }}>
          <label>
            <input
              type="radio"
              name="modo"
              checked={!modoPesoCarga}
              onChange={() => setModoPesoCarga(false)}
            />
            <span style={{ marginLeft: "5px" }}>Cantidad (Resistencia)</span>
          </label>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>
            <input
              type="radio"
              name="modo"
              checked={modoPesoCarga}
              onChange={() => setModoPesoCarga(true)}
            />
            <span style={{ marginLeft: "5px" }}>Calidad (Fuerza)</span>
          </label>
        </div>
        <div>
          <label>Tasa de incremento: </label>
          <select 
            value={tasaIncremento} 
            onChange={(e) => setTasaIncremento(parseFloat(e.target.value))}
            style={{ marginLeft: "5px" }}
          >
            <option value={0.02}>2% (Conservador)</option>
            <option value={0.03}>3% (Moderado)</option>
            <option value={0.05}>5% (Agresivo)</option>
          </select>
        </div>
      </div>

      {/* Información del ejercicio actual */}
      <div style={{ 
        backgroundColor: "#ffffff", 
        border: "2px solid #007bff", 
        borderRadius: "10px", 
        padding: "20px", 
        marginBottom: "20px" 
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3 style={{ margin: "0" }}>{ejercicioActual.nombre}</h3>
          <span style={{ 
            backgroundColor: "#007bff", 
            color: "white", 
            padding: "5px 10px", 
            borderRadius: "15px",
            fontSize: "12px"
          }}>
            {currentIndex + 1} de {objetivos.length}
          </span>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "15px" }}>
          <div><strong>Músculo:</strong> {ejercicioActual.musculo}</div>
          <div><strong>Tipo:</strong> {ejercicioActual.tipoEntrenamiento}</div>
          <div><strong>1RM Estimado:</strong> {ejercicioActual.rmEstimado.toFixed(1)} kg</div>
          <div><strong>Set actual:</strong> {contadorSets} de {ejercicioActual.setsSugeridos}</div>
        </div>

        {/* Objetivos */}
        <div style={{ 
          backgroundColor: "#e9ecef", 
          padding: "15px", 
          borderRadius: "8px", 
          marginBottom: "15px" 
        }}>
          <h4 style={{ margin: "0 0 10px 0" }}>Objetivos de hoy:</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", textAlign: "center" }}>
            <div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#007bff" }}>
                {ejercicioActual.pesoSugerido} kg
              </div>
              <div style={{ fontSize: "12px" }}>Peso</div>
            </div>
            <div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#28a745" }}>
                {ejercicioActual.repeticionesObjetivo}
              </div>
              <div style={{ fontSize: "12px" }}>Repeticiones</div>
            </div>
            <div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#ffc107" }}>
                {ejercicioActual.setsSugeridos}
              </div>
              <div style={{ fontSize: "12px" }}>Sets</div>
            </div>
          </div>
        </div>

        {/* Progreso del volumen */}
        <div style={{ marginBottom: "15px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
            <span>Progreso del volumen:</span>
            <span>{progresoVolumen.toFixed(1)}%</span>
          </div>
          <div style={{ 
            width: "100%", 
            height: "10px", 
            backgroundColor: "#e9ecef", 
            borderRadius: "5px" 
          }}>
            <div style={{ 
              width: `${Math.min(progresoVolumen, 100)}%`, 
              height: "100%", 
              backgroundColor: progresoVolumen >= 95 ? "#28a745" : "#007bff", 
              borderRadius: "5px",
              transition: "width 0.3s ease"
            }}></div>
          </div>
        </div>

        {/* Comparación con sesión anterior */}
        {ejercicioActual.ultimoEntrenamiento && (
          <div style={{ 
            backgroundColor: "#fff3cd", 
            padding: "10px", 
            borderRadius: "5px", 
            fontSize: "14px",
            marginBottom: "15px"
          }}>
            <strong>Última sesión:</strong> {ejercicioActual.ultimoEntrenamiento.pesoUtilizado} kg × {ejercicioActual.ultimoEntrenamiento.repeticionesAlcanzadas} reps × {ejercicioActual.ultimoEntrenamiento.setsRealizados} sets = {ejercicioActual.volumenAnterior.toFixed(0)} volumen
          </div>
        )}
      </div>

      {/* Input de repeticiones */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold" }}>
          Repeticiones realizadas en este set:
        </label>
        <input
          type="number"
          min="1"
          max="30"
          value={repeticionesActuales}
          onChange={(e) => setRepeticionesActuales(parseInt(e.target.value) || 0)}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "18px",
            border: "2px solid #ccc",
            borderRadius: "5px",
            textAlign: "center"
          }}
          placeholder="Ingresa las repeticiones"
        />
      </div>

      {/* Botones de acción */}
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={handleRegistrarSet}
          disabled={repeticionesActuales <= 0}
          style={{
            flex: "1",
            padding: "15px",
            backgroundColor: repeticionesActuales > 0 ? "#28a745" : "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "5px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: repeticionesActuales > 0 ? "pointer" : "not-allowed"
          }}
        >
          Registrar Set
        </button>
        <button
          onClick={handleSaltarEjercicio}
          style={{
            padding: "15px 20px",
            backgroundColor: "#ffc107",
            color: "#000",
            border: "none",
            borderRadius: "5px",
            fontSize: "14px",
            cursor: "pointer"
          }}
        >
          Saltar Ejercicio
        </button>
      </div>

      {/* Progreso general */}
      <div style={{ 
        marginTop: "20px", 
        textAlign: "center", 
        color: "#6c757d" 
      }}>
        Ejercicio {currentIndex + 1} de {objetivos.length} | {ejerciciosCompletados.length} completados
      </div>
    </div>
  );
};

export default CalculoDinamicoMejorado;