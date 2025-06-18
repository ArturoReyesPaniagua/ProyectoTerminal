import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase-config";
import { doc, collection, addDoc, setDoc, getDoc } from "firebase/firestore";

const FormularioDatosMejorado = ({ setVista, Usuario }) => {
  const [edad, setEdad] = useState("");
  const [sexo, setSexo] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [biceps, setBiceps] = useState("");
  const [pecho, setPecho] = useState("");
  const [cintura, setCintura] = useState("");
  const [cuello, setCuello] = useState("");
  const [cuadriceps, setCuadriceps] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      if (Usuario) {
        try {
          const userDocRef = doc(db, "usuarios", Usuario.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const data = userDoc.data();
            setEdad(data.edad || "");
            setSexo(data.sexo || "");
            setPeso(data.peso || "");
            setAltura(data.altura || "");
            setBiceps(data.biceps || "");
            setPecho(data.pecho || "");
            setCintura(data.cintura || "");
            setCuello(data.cuello || "");
            setCuadriceps(data.cuadriceps || "");
            setIsFirstTime(!data.datosCompletos);
          } else {
            setIsFirstTime(true);
          }
        } catch (error) {
          console.error("Error al cargar datos del usuario:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadUserData();
  }, [Usuario]);

  const calcularPorcentajeGrasa = (datos) => {
    const { sexo, cintura, cuello, cuadriceps } = datos;
    let alturaNum = parseFloat(datos.altura) || 170;
    
    // Convertir a centímetros si está en metros
    if (alturaNum < 3) {
      alturaNum = alturaNum * 100;
    }

    let porcentaje = 0;

    if (sexo === "Masculino") {
      porcentaje = 86.010 * Math.log10(parseFloat(cintura) - parseFloat(cuello)) - 
                   70.041 * Math.log10(alturaNum) + 36.76;
    } else if (sexo === "Femenino") {
      porcentaje = 163.205 * Math.log10(parseFloat(cintura) + parseFloat(cuadriceps) - parseFloat(cuello)) - 
                   97.684 * Math.log10(alturaNum) - 78.387;
    }

    return Math.max(2, Math.min(50, porcentaje)).toFixed(1);
  };

  const validarDatos = () => {
    const errores = [];
    
    if (!edad || edad < 10 || edad > 100) {
      errores.push("La edad debe estar entre 10 y 100 años");
    }
    
    if (!sexo) {
      errores.push("Debes seleccionar tu sexo");
    }
    
    if (!peso || peso < 30 || peso > 300) {
      errores.push("El peso debe estar entre 30 y 300 kg");
    }
    
    if (!altura) {
      errores.push("La altura es requerida");
    } else {
      const alturaNum = parseFloat(altura);
      if (alturaNum < 1.2 || (alturaNum > 3 && alturaNum < 120) || alturaNum > 250) {
        errores.push("La altura debe estar entre 1.2-3.0 metros o 120-250 cm");
      }
    }
    
    if (!cintura || cintura < 50 || cintura > 200) {
      errores.push("La circunferencia de cintura debe estar entre 50 y 200 cm");
    }
    
    if (!cuello || cuello < 25 || cuello > 60) {
      errores.push("La circunferencia de cuello debe estar entre 25 y 60 cm");
    }
    
    if (!cuadriceps || cuadriceps < 30 || cuadriceps > 100) {
      errores.push("La circunferencia de cuádriceps debe estar entre 30 y 100 cm");
    }
    
    return errores;
  };

  const guardarDatos = async () => {
    const errores = validarDatos();
    
    if (errores.length > 0) {
      alert("Errores en los datos:\n" + errores.join("\n"));
      return;
    }

    setSaving(true);
    
    try {
      if (Usuario) {
        const userDocRef = doc(db, "usuarios", Usuario.uid);
        const historialRef = collection(db, "usuarios", Usuario.uid, "historial");
        
        const datosCompletos = {
          edad: parseInt(edad),
          sexo,
          peso: parseFloat(peso),
          altura: parseFloat(altura),
          biceps: parseFloat(biceps) || 0,
          pecho: parseFloat(pecho) || 0,
          cintura: parseFloat(cintura),
          cuello: parseFloat(cuello),
          cuadriceps: parseFloat(cuadriceps),
          fecha: new Date().toISOString(),
        };

        // Calcular porcentaje de grasa
        const porcentajeGrasa = calcularPorcentajeGrasa(datosCompletos);
        datosCompletos.porcentajeGrasa = parseFloat(porcentajeGrasa);

        // Guardar en el historial
        await addDoc(historialRef, datosCompletos);

        // Actualizar el documento principal
        await setDoc(userDocRef, {
          ...datosCompletos,
          datosCompletos: true,
          ultimaActualizacion: new Date().toISOString()
        });

        if (isFirstTime) {
          alert(`¡Datos guardados exitosamente!\n\nTu porcentaje de grasa corporal es: ${porcentajeGrasa}%`);
        } else {
          alert(`¡Datos actualizados correctamente!\n\nTu nuevo porcentaje de grasa corporal es: ${porcentajeGrasa}%`);
        }
        
        setVista("menuPrincipal");
      }
    } catch (error) {
      console.error("Error al guardar datos:", error);
      alert("Error al guardar los datos. Por favor, inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh" 
      }}>
        Cargando datos del usuario...
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: "100vh",
      backgroundColor: "#f8f9fa",
      padding: "20px"
    }}>
      <div style={{ 
        maxWidth: "600px", 
        margin: "0 auto"
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "15px",
          padding: "30px",
          textAlign: "center",
          marginBottom: "20px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
        }}>
          <h2 style={{ 
            margin: "0 0 10px 0", 
            color: "#1f4f63",
            fontSize: "2rem"
          }}>
            {isFirstTime ? "📊 Configuración Inicial" : "🔄 Actualizar Datos"}
          </h2>
          <p style={{ margin: "0", color: "#6c757d", fontSize: "1.1rem" }}>
            {isFirstTime 
              ? "Completa tu perfil para comenzar a usar la aplicación"
              : "Actualiza tus medidas para mantener un seguimiento preciso"
            }
          </p>
        </div>

        {/* Formulario */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "15px",
          padding: "30px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
        }}>
          {/* Información personal */}
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ 
              margin: "0 0 20px 0", 
              color: "#1f4f63",
              borderBottom: "2px solid #007bff",
              paddingBottom: "10px"
            }}>
              👤 Información Personal
            </h3>
            
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
              gap: "20px" 
            }}>
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "bold",
                  color: "#495057"
                }}>
                  Edad (años) *
                </label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  placeholder="Ej: 25"
                  value={edad}
                  onChange={(e) => setEdad(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #dee2e6",
                    borderRadius: "8px",
                    fontSize: "16px",
                    transition: "border-color 0.3s ease"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#007bff"}
                  onBlur={(e) => e.target.style.borderColor = "#dee2e6"}
                />
              </div>

              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "bold",
                  color: "#495057"
                }}>
                  Sexo *
                </label>
                <select
                  value={sexo}
                  onChange={(e) => setSexo(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #dee2e6",
                    borderRadius: "8px",
                    fontSize: "16px",
                    backgroundColor: "white",
                    cursor: "pointer"
                  }}
                >
                  <option value="">Seleccione...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                </select>
              </div>
            </div>
          </div>

          {/* Medidas básicas */}
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ 
              margin: "0 0 20px 0", 
              color: "#1f4f63",
              borderBottom: "2px solid #28a745",
              paddingBottom: "10px"
            }}>
              📏 Medidas Básicas
            </h3>
            
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
              gap: "20px" 
            }}>
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "bold",
                  color: "#495057"
                }}>
                  Peso (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="300"
                  placeholder="Ej: 70.5"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #dee2e6",
                    borderRadius: "8px",
                    fontSize: "16px"
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "bold",
                  color: "#495057"
                }}>
                  Altura (cm o m) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ej: 175 o 1.75"
                  value={altura}
                  onChange={(e) => setAltura(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #dee2e6",
                    borderRadius: "8px",
                    fontSize: "16px"
                  }}
                />
              </div>
            </div>
          </div>

          {/* Circunferencias (requeridas para grasa corporal) */}
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ 
              margin: "0 0 20px 0", 
              color: "#1f4f63",
              borderBottom: "2px solid #ffc107",
              paddingBottom: "10px"
            }}>
              📐 Circunferencias (para cálculo de grasa) *
            </h3>
            
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
              gap: "20px" 
            }}>
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "bold",
                  color: "#495057"
                }}>
                  Cintura (cm) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="50"
                  max="200"
                  placeholder="Ej: 80"
                  value={cintura}
                  onChange={(e) => setCintura(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #dee2e6",
                    borderRadius: "8px",
                    fontSize: "16px"
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "bold",
                  color: "#495057"
                }}>
                  Cuello (cm) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="25"
                  max="60"
                  placeholder="Ej: 35"
                  value={cuello}
                  onChange={(e) => setCuello(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #dee2e6",
                    borderRadius: "8px",
                    fontSize: "16px"
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "bold",
                  color: "#495057"
                }}>
                  Cuádriceps/Cadera (cm) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="100"
                  placeholder="Ej: 55"
                  value={cuadriceps}
                  onChange={(e) => setCuadriceps(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #dee2e6",
                    borderRadius: "8px",
                    fontSize: "16px"
                  }}
                />
              </div>
            </div>
          </div>

          {/* Circunferencias opcionales */}
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ 
              margin: "0 0 20px 0", 
              color: "#1f4f63",
              borderBottom: "2px solid #17a2b8",
              paddingBottom: "10px"
            }}>
              💪 Circunferencias Adicionales (Opcional)
            </h3>
            
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
              gap: "20px" 
            }}>
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "bold",
                  color: "#495057"
                }}>
                  Bíceps (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ej: 35"
                  value={biceps}
                  onChange={(e) => setBiceps(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #dee2e6",
                    borderRadius: "8px",
                    fontSize: "16px"
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "bold",
                  color: "#495057"
                }}>
                  Pecho (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ej: 100"
                  value={pecho}
                  onChange={(e) => setPecho(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #dee2e6",
                    borderRadius: "8px",
                    fontSize: "16px"
                  }}
                />
              </div>
            </div>
          </div>

          {/* Información importante */}
          <div style={{
            backgroundColor: "#e7f3ff",
            border: "1px solid #007bff",
            borderRadius: "8px",
            padding: "15px",
            marginBottom: "30px"
          }}>
            <h4 style={{ margin: "0 0 10px 0", color: "#007bff" }}>
              ℹ️ Información Importante
            </h4>
            <ul style={{ margin: "0", paddingLeft: "20px", color: "#495057" }}>
              <li>Los campos marcados con * son obligatorios</li>
              <li>Las medidas de cintura, cuello y cuádriceps son necesarias para calcular el porcentaje de grasa</li>
              <li>Toma las medidas en el mismo momento del día para mayor precisión</li>
              <li>Para mejores resultados, toma las medidas en ayunas</li>
            </ul>
          </div>

          {/* Botones */}
          <div style={{ 
            display: "flex", 
            gap: "15px", 
            justifyContent: "center",
            flexWrap: "wrap"
          }}>
            <button
              onClick={guardarDatos}
              disabled={saving}
              style={{
                padding: "15px 30px",
                backgroundColor: saving ? "#6c757d" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: "25px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: saving ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                minWidth: "200px"
              }}
            >
              {saving ? "⏳ Guardando..." : `✓ ${isFirstTime ? "Guardar Datos" : "Actualizar Datos"}`}
            </button>
            
            <button
              onClick={() => setVista("menuPrincipal")}
              disabled={saving}
              style={{
                padding: "15px 30px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "25px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: saving ? "not-allowed" : "pointer",
                transition: "all 0.3s ease"
              }}
            >
              ← Regresar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormularioDatosMejorado;