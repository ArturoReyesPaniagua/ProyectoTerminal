import React, { useState, useEffect } from "react";
import { db } from "../../firebase-config";
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
      //setError(Campos requeridos: ${missingFields.join(', ')});
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
        const historialRef = collection(db, "usuarios", currentUser.uid, "historial"); // ✅ Nombre consistente
        await addDoc(historialRef, {
          ...dataToSave,
          fecha: fecha, // ✅ Campo 'fecha' para historial
          tipoRegistro: "actualizacion"
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
    { key: "edad", label: "Edad", type: "number", required: true },
    { key: "peso", label: "Peso (kg)", type: "number", required: true },
    { key: "altura", label: "Altura (cm)", type: "number", required: false }, // ✅ Agregar altura
    { key: "biceps", label: "Circunferencia bíceps (cm)", type: "number" },
    { key: "pecho", label: "Circunferencia pecho (cm)", type: "number" },
    { key: "cintura", label: "Circunferencia cintura (cm)", type: "number", required: true },
    { key: "cuello", label: "Circunferencia cuello (cm)", type: "number", required: true },
    { key: "cuadriceps", label: "Circunferencia cuádriceps (cm)", type: "number" },
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
        <h2>{mode === "create" ? "Formulario de Datos" : "Actualizar Datos"}</h2>
        
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {/* Campo sexo */}
        <select
          value={formData.sexo}
          onChange={(e) => updateField("sexo", e.target.value)}
          className="formulario-datos-input"
          required
        >
          <option value="">Seleccione Sexo *</option>
          <option value="Masculino">Masculino</option>
          <option value="Femenino">Femenino</option>
        </select>

        {/* Campos dinámicos */}
        {inputFields.map(({ key, label, type, required }) => (
          <input
            key={key}
            type={type}
            //placeholder={${label}${required ? " *" : ""}}
            placeholder={label}
            value={formData[key]}
            onChange={(e) => updateField(key, e.target.value)}
            className="formulario-datos-input"
            required={required}
          />
        ))}

        <button 
          onClick={handleSubmit} 
          className="boton-establecer-datos"
          disabled={loading}
        >
          {loading ? "Guardando..." : mode === "create" ? "Establecer datos" : "Actualizar datos"}
        </button>

        {mode === "update" && (
          <button 
            onClick={() => setCurrentView("menuPrincipal")}
            className="boton-cancelar"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
};

export default FormularioDatos;