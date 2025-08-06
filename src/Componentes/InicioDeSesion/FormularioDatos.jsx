import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase-config";
import { doc, collection, addDoc, setDoc, getDoc } from "firebase/firestore";
import "../../global.css";

// Hook personalizado para manejar los datos del formulario
const useFormularioDatos = (currentUser) => {
  const [formData, setFormData] = useState({
    edad: "",
    sexo: "",
    peso: "",
    altura: "", // ✅ Agregar altura faltante
    biceps: "",
    pecho: "",
    cintura: "",
    cuello: "",
    cuadriceps: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar datos existentes del usuario
  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        // ✅ CORREGIDO: Obtener datos del usuario específico
        const userDocRef = doc(db, "usuarios", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          setFormData({
            edad: data.edad || "",
            sexo: data.sexo || "",
            peso: data.peso || "",
            altura: data.altura || "", // ✅ Cargar altura
            biceps: data.biceps || "",
            pecho: data.pecho || "",
            cintura: data.cintura || "",
            cuello: data.cuello || "",
            cuadriceps: data.cuadriceps || "",
          });
        }
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError("Error al cargar los datos del usuario");
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [currentUser]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const requiredFields = ['edad', 'sexo', 'peso', 'cintura', 'cuello'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      setError(`Campos requeridos: ${missingFields.join(', ')}`);
      return false;
    }

    // ✅ Validaciones adicionales
    if (parseInt(formData.edad) < 10 || parseInt(formData.edad) > 100) {
      setError("La edad debe estar entre 10 y 100 años");
      return false;
    }

    if (parseFloat(formData.peso) < 30 || parseFloat(formData.peso) > 300) {
      setError("El peso debe estar entre 30 y 300 kg");
      return false;
    }

    if (formData.altura && (parseFloat(formData.altura) < 120 || parseFloat(formData.altura) > 250)) {
      setError("La altura debe estar entre 120 y 250 cm");
      return false;
    }

    if (parseFloat(formData.cintura) < 50 || parseFloat(formData.cintura) > 200) {
      setError("La circunferencia de cintura debe estar entre 50 y 200 cm");
      return false;
    }

    if (parseFloat(formData.cuello) < 25 || parseFloat(formData.cuello) > 60) {
      setError("La circunferencia de cuello debe estar entre 25 y 60 cm");
      return false;
    }
    
    setError(null);
    return true;
  };

  const saveData = async (isFirstTime = false) => {
    if (!validateForm()) return false;
    if (!currentUser) {
      setError("Usuario no autenticado");
      return false;
    }

    try {
      setLoading(true);
      const userDocRef = doc(db, "usuarios", currentUser.uid);
      const fecha = new Date().toISOString(); // ✅ Usar nombre consistente

      // Datos a guardar
      const dataToSave = {
        ...formData,
        // Convertir a números
        edad: parseInt(formData.edad),
        peso: parseFloat(formData.peso),
        altura: parseFloat(formData.altura) || 170,
        biceps: parseFloat(formData.biceps) || 0,
        pecho: parseFloat(formData.pecho) || 0,
        cintura: parseFloat(formData.cintura),
        cuello: parseFloat(formData.cuello),
        cuadriceps: parseFloat(formData.cuadriceps) || 0,
        fechaRegistro: fecha,
        datosCompletos: true,
      };

      // Actualizar documento principal
      await setDoc(userDocRef, dataToSave, { merge: true });

      // ✅ SIEMPRE guardar en historial (excepto la primera vez)
      if (!isFirstTime) {
        // ✅ CORREGIDO: Guardar en historial del usuario específico
        const historialRef = collection(db, "usuarios", currentUser.uid, "historial");
        await addDoc(historialRef, {
          fecha: fecha, // ✅ Campo 'fecha' para historial
          peso: dataToSave.peso,
          altura: dataToSave.altura,
          biceps: dataToSave.biceps,
          pecho: dataToSave.pecho,
          cintura: dataToSave.cintura,
          cuello: dataToSave.cuello,
          cuadriceps: dataToSave.cuadriceps,
          sexo: dataToSave.sexo,
          edad: dataToSave.edad,
          tipoRegistro: "actualizacion",
          notas: `Actualización de datos desde formulario - ${new Date().toLocaleDateString('es-ES')}`
        });
        
        console.log("✅ Datos guardados en historial correctamente");
      } else {
        console.log("✅ Primera vez - no se guarda en historial");
      }

      return true;
    } catch (err) {
      console.error("❌ Error al guardar datos:", err);
      setError("Error al guardar los datos. Intenta de nuevo.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    updateField,
    saveData,
    loading,
    error,
    setError,
  };
};

const FormularioDatos = ({ setCurrentView, currentUser, mode = "create" }) => {
  const {
    formData,
    updateField,
    saveData,
    loading,
    error,
    setError,
  } = useFormularioDatos(currentUser);

  const handleSubmit = async () => {
    const isFirstTime = mode === "create";
    const success = await saveData(isFirstTime);
    
    if (success) {
      const message = isFirstTime ? 
        "Datos establecidos con éxito" : 
        "Datos actualizados con éxito y guardados en historial";
      
      alert(message);
      setCurrentView("menuPrincipal");
    }
  };

  const inputFields = [
    { key: "edad", label: "Edad (años)", type: "number", required: true, placeholder: "Ej: 25" },
    { key: "peso", label: "Peso corporal (kg)", type: "number", required: true, placeholder: "Ej: 70.5", step: "0.1" },
    { key: "altura", label: "Altura (cm)", type: "number", required: false, placeholder: "Ej: 175" },
    { key: "biceps", label: "Circunferencia bíceps (cm)", type: "number", required: false, placeholder: "Ej: 35", step: "0.1" },
    { key: "pecho", label: "Circunferencia pecho (cm)", type: "number", required: false, placeholder: "Ej: 95", step: "0.1" },
    { key: "cintura", label: "Circunferencia cintura (cm)", type: "number", required: true, placeholder: "Ej: 85", step: "0.1" },
    { key: "cuello", label: "Circunferencia cuello (cm)", type: "number", required: true, placeholder: "Ej: 38", step: "0.1" },
    { key: "cuadriceps", label: "Circunferencia cuádriceps (cm)", type: "number", required: false, placeholder: "Ej: 58", step: "0.1" },
  ];

  if (loading) {
    return (
      <div className="formulario-datos-container">
        <div className="loading">Cargando datos...</div>
      </div>
    );
  }

  return (
    <div className="formulario-datos-container">
      <div className="formulario-datos-box">
        <h2>
          {mode === "create" ? "📝 Formulario de Datos Iniciales" : "📏 Actualizar Datos Corporales"}
        </h2>
        
        <p style={{ 
          textAlign: "center", 
          color: "#6c757d", 
          marginBottom: "25px",
          fontSize: "14px" 
        }}>
          {mode === "create" 
            ? "Completa tus datos para comenzar a usar la aplicación" 
            : "Actualiza tus medidas para un seguimiento preciso"
          }
        </p>
        
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {/* Campo sexo con label */}
        <div className="form-field">
          <label htmlFor="sexo" className="form-label">
            👤 Sexo <span style={{ color: "#dc3545" }}>*</span>
          </label>
          <select
            id="sexo"
            value={formData.sexo}
            onChange={(e) => updateField("sexo", e.target.value)}
            className="formulario-datos-input"
            required
          >
            <option value="">Seleccione su sexo</option>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
          </select>
        </div>

        {/* Campos dinámicos con labels */}
        {inputFields.map(({ key, label, type, required, placeholder, step }) => (
          <div key={key} className="form-field">
            <label htmlFor={key} className="form-label">
              {getFieldIcon(key)} {label}
              {required && <span style={{ color: "#dc3545" }}> *</span>}
            </label>
            <input
              id={key}
              type={type}
              step={step}
              placeholder={placeholder}
              value={formData[key]}
              onChange={(e) => updateField(key, e.target.value)}
              className="formulario-datos-input"
              required={required}
            />
          </div>
        ))}

        {/* Información adicional */}
        <div style={{
          backgroundColor: "#e7f3ff",
          border: "1px solid #b8daff",
          borderRadius: "8px",
          padding: "15px",
          marginBottom: "20px",
          fontSize: "12px",
          color: "#004085"
        }}>
          <h5 style={{ margin: "0 0 8px 0", color: "#004085" }}>
            💡 Consejos para medir correctamente:
          </h5>
          <ul style={{ margin: "0", paddingLeft: "15px" }}>
            <li><strong>Cintura:</strong> Mide en la parte más estrecha del torso</li>
            <li><strong>Cuello:</strong> Mide justo debajo de la manzana de Adán</li>
            <li><strong>Cuádriceps:</strong> Mide en la parte más ancha del muslo</li>
            <li><strong>Peso:</strong> Mide en ayunas, sin ropa, misma hora</li>
            <li><strong>Consistencia:</strong> Usa siempre la misma cinta métrica</li>
          </ul>
        </div>

        <button 
          onClick={handleSubmit} 
          className="boton-establecer-datos"
          disabled={loading}
        >
          {loading ? "⏳ Guardando..." : mode === "create" ? "✅ Establecer datos" : "💾 Actualizar datos"}
        </button>

        {mode === "update" && (
          <button 
            onClick={() => setCurrentView("menuPrincipal")}
            className="boton-cancelar"
          >
            ❌ Cancelar
          </button>
        )}

        {/* Información sobre campos obligatorios */}
        <div style={{
          textAlign: "center",
          marginTop: "15px",
          fontSize: "12px",
          color: "#6c757d"
        }}>
          <span style={{ color: "#dc3545" }}>*</span> Campos obligatorios para el cálculo de grasa corporal
        </div>
      </div>
    </div>
  );
};

// Función auxiliar para obtener iconos por campo
const getFieldIcon = (fieldKey) => {
  const icons = {
    edad: "🎂",
    peso: "⚖️",
    altura: "📏",
    biceps: "💪",
    pecho: "🫁",
    cintura: "📐",
    cuello: "🔗",
    cuadriceps: "🦵"
  };
  return icons[fieldKey] || "📊";
};

export default FormularioDatos;