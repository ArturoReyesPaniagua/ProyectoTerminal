import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase-config";
import { collection, doc, setDoc, getDocs } from "firebase/firestore";

const RegistrarEjercicio = ({ setCurrentView }) => {
  const [nombre, setNombre] = useState("");
  const [musculo, setMusculo] = useState("");
  const [pesoMaximo, setPesoMaximo] = useState("");
  const [repeticionesMaximas, setRepeticionesMaximas] = useState("");
  const [setsMaximos, setSetsMaximos] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);
  const [ejerciciosExistentes, setEjerciciosExistentes] = useState([]);

  // Lista de músculos predefinidos
  const musculosDisponibles = [
    "Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps", 
    "Cuádriceps", "Isquiotibiales", "Glúteos", "Pantorrillas",
    "Abdominales", "Core", "Antebrazos", "Trapecio", "Dorsales"
  ];

  useEffect(() => {
    cargarEjerciciosExistentes();
  }, []);

  const cargarEjerciciosExistentes = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("Usuario no autenticado");
        return;
      }

      // ✅ CORREGIDO: Obtener ejercicios del usuario específico
      const ejerciciosRef = collection(db, "usuarios", user.uid, "ejercicios");
      const ejerciciosSnapshot = await getDocs(ejerciciosRef);
      const ejerciciosList = ejerciciosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEjerciciosExistentes(ejerciciosList);
    } catch (error) {
      console.error("Error al cargar ejercicios existentes:", error);
    }
  };

  const validarDatos = () => {
    const errores = [];

    if (!nombre.trim()) {
      errores.push("El nombre del ejercicio es obligatorio");
    } else if (nombre.trim().length < 3) {
      errores.push("El nombre debe tener al menos 3 caracteres");
    }

    // Verificar si ya existe un ejercicio con el mismo nombre
    const nombreExistente = ejerciciosExistentes.find(
      ej => ej.nombre.toLowerCase() === nombre.trim().toLowerCase()
    );
    if (nombreExistente) {
      errores.push("Ya existe un ejercicio con este nombre");
    }

    if (!musculo) {
      errores.push("Debe seleccionar el grupo muscular");
    }

    if (!pesoMaximo || pesoMaximo <= 0) {
      errores.push("El peso máximo debe ser mayor a 0");
    } else if (pesoMaximo > 500) {
      errores.push("El peso máximo no puede ser mayor a 500kg");
    }

    if (!repeticionesMaximas || repeticionesMaximas <= 0) {
      errores.push("Las repeticiones máximas deben ser mayor a 0");
    } else if (repeticionesMaximas > 50) {
      errores.push("Las repeticiones máximas no pueden ser mayor a 50");
    }

    if (!setsMaximos || setsMaximos <= 0) {
      errores.push("Los sets máximos deben ser mayor a 0");
    } else if (setsMaximos > 20) {
      errores.push("Los sets máximos no pueden ser mayor a 20");
    }

    return errores;
  };

  const registrarEjercicio = async () => {
    const errores = validarDatos();
    
    if (errores.length > 0) {
      alert("Errores en el formulario:\n" + errores.join("\n"));
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        alert("Usuario no autenticado");
        return;
      }

      // ✅ CORREGIDO: Crear referencia en ejercicios del usuario específico
      const ejercicioRef = doc(collection(db, "usuarios", user.uid, "ejercicios"));
      const nuevoEjercicio = {
        nombre: nombre.trim(),
        musculo: musculo,
        pesoMaximo: parseFloat(pesoMaximo),
        repeticionesMaximas: parseInt(repeticionesMaximas),
        setsMaximos: parseInt(setsMaximos),
        descripcion: descripcion.trim() || "",
        fechaCreacion: new Date().toISOString(),
        // Datos adicionales para el sistema de sobrecarga progresiva
        volumenBase: parseFloat(pesoMaximo) * parseInt(repeticionesMaximas) * parseInt(setsMaximos),
        categoria: categorizarEjercicio(musculo),
        activo: true,
        notas: "",
        equipamiento: ""
      };

      await setDoc(ejercicioRef, nuevoEjercicio);
      
      alert(`¡Ejercicio "${nombre.trim()}" registrado con éxito!`);
      
      // Limpiar formulario
      setNombre("");
      setMusculo("");
      setPesoMaximo("");
      setRepeticionesMaximas("");
      setSetsMaximos("");
      setDescripcion("");
      
      // Recargar ejercicios existentes
      await cargarEjerciciosExistentes();
      
      // Opcional: regresar al menú de rutinas
      const continuar = window.confirm(
        "¿Quieres registrar otro ejercicio?\n\n" +
        "OK = Registrar otro ejercicio\n" +
        "Cancelar = Volver al menú de rutinas"
      );
      
      if (!continuar) {
        setCurrentView("menuRutina");
      }
      
    } catch (error) {
      console.error("Error al registrar el ejercicio:", error);
      alert("Hubo un error al registrar el ejercicio. Por favor, inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const categorizarEjercicio = (musculo) => {
    const categorias = {
      "Pecho": "Empuje Superior",
      "Hombros": "Empuje Superior", 
      "Tríceps": "Empuje Superior",
      "Espalda": "Tracción Superior",
      "Dorsales": "Tracción Superior",
      "Bíceps": "Tracción Superior",
      "Cuádriceps": "Empuje Inferior",
      "Glúteos": "Empuje Inferior",
      "Isquiotibiales": "Tracción Inferior",
      "Pantorrillas": "Tracción Inferior",
      "Abdominales": "Core",
      "Core": "Core",
      "Antebrazos": "Tracción Superior",
      "Trapecio": "Tracción Superior"
    };
    
    return categorias[musculo] || "General";
  };

  const limpiarFormulario = () => {
    setNombre("");
    setMusculo("");
    setPesoMaximo("");
    setRepeticionesMaximas("");
    setSetsMaximos("");
    setDescripcion("");
  };

  const calcularVolumenEstimado = () => {
    const peso = parseFloat(pesoMaximo) || 0;
    const reps = parseInt(repeticionesMaximas) || 0;
    const sets = parseInt(setsMaximos) || 0;
    return peso * reps * sets;
  };

  const calcular1RMEstimado = () => {
    const peso = parseFloat(pesoMaximo) || 0;
    const reps = parseInt(repeticionesMaximas) || 0;
    
    if (peso <= 0 || reps <= 0) return 0;
    
    // Fórmula de Epley para calcular 1RM
    return peso * (1 + reps / 30);
  };

  return (
    <div className="rutinas-container">
      <div className="rutinas-content">
        {/* Header */}
        <div className="section-header">
          <div className="ejercicio-header-icon">
            <span>💪</span>
          </div>
          <h1 className="section-title">
            Registrar Nuevo Ejercicio
          </h1>
          <p className="section-subtitle">
            Agrega un nuevo ejercicio a tu biblioteca personal
          </p>
        </div>

        {/* Información de ejercicios existentes */}
        {ejerciciosExistentes.length > 0 && (
          <div className="ejercicios-existentes">
            <h4>
              📚 Tienes {ejerciciosExistentes.length} ejercicio(s) registrado(s)
            </h4>
            <div className="ejercicios-tags">
              {ejerciciosExistentes.slice(0, 5).map((ej, index) => (
                <span 
                  key={index}
                  className="ejercicio-tag"
                >
                  {ej.nombre}
                </span>
              ))}
              {ejerciciosExistentes.length > 5 && (
                <span className="ejercicios-mas">
                  y {ejerciciosExistentes.length - 5} más...
                </span>
              )}
            </div>
          </div>
        )}

        {/* Formulario */}
        <div className="formulario-ejercicio">
          {/* Información básica */}
          <div className="formulario-seccion">
            <h3>
              📝 Información Básica
            </h3>
            
            <div className="formulario-grid">
              <div className="form-field">
                <label>
                  Nombre del Ejercicio *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Press de banca, Sentadilla, etc."
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  disabled={loading}
                  className="input-ejercicio"
                />
              </div>

              <div className="form-field">
                <label>
                  Grupo Muscular Principal *
                </label>
                <select
                  value={musculo}
                  onChange={(e) => setMusculo(e.target.value)}
                  disabled={loading}
                  className="select-ejercicio"
                >
                  <option value="">Seleccione un músculo...</option>
                  {musculosDisponibles.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-field">
              <label>
                Descripción (Opcional)
              </label>
              <textarea
                placeholder="Describe la técnica, equipamiento necesario, o cualquier nota importante..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                disabled={loading}
                rows="3"
                className="textarea-ejercicio"
              />
            </div>
          </div>

          {/* Parámetros de entrenamiento */}
          <div className="formulario-seccion parametros">
            <h3>
              🎯 Parámetros de Entrenamiento
            </h3>
            
            <div className="formulario-grid parametros">
              <div className="form-field">
                <label>
                  Peso Máximo (kg) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="500"
                  placeholder="Ej: 80"
                  value={pesoMaximo}
                  onChange={(e) => setPesoMaximo(e.target.value)}
                  disabled={loading}
                  className="input-ejercicio"
                />
              </div>

              <div className="form-field">
                <label>
                  Repeticiones Máximas *
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  placeholder="Ej: 10"
                  value={repeticionesMaximas}
                  onChange={(e) => setRepeticionesMaximas(e.target.value)}
                  disabled={loading}
                  className="input-ejercicio"
                />
              </div>

              <div className="form-field">
                <label>
                  Sets Máximos *
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  placeholder="Ej: 4"
                  value={setsMaximos}
                  onChange={(e) => setSetsMaximos(e.target.value)}
                  disabled={loading}
                  className="input-ejercicio"
                />
              </div>
            </div>

            {/* Información calculada */}
            {pesoMaximo && repeticionesMaximas && setsMaximos && (
              <div className="info-calculada">
                <h5>
                  📊 Información Calculada:
                </h5>
                <div className="info-calculada-grid">
                  <div>
                    <strong>Volumen Máximo:</strong><br />
                    <span className="info-valor volumen">
                      {calcularVolumenEstimado().toFixed(0)} kg×reps×sets
                    </span>
                  </div>
                  <div>
                    <strong>Categoría:</strong><br />
                    <span className="info-valor categoria">
                      {musculo ? categorizarEjercicio(musculo) : "Sin clasificar"}
                    </span>
                  </div>
                  <div>
                    <strong>1RM Estimado:</strong><br />
                    <span className="info-valor rm">
                      {calcular1RMEstimado().toFixed(1)} kg
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Información importante */}
          <div className="consejos-box">
            <h4>
              💡 Consejos para registrar ejercicios:
            </h4>
            <ul>
              <li><strong>Peso máximo:</strong> El peso más alto que puedes manejar con buena técnica</li>
              <li><strong>Repeticiones máximas:</strong> Las repeticiones que puedes hacer con ese peso máximo</li>
              <li><strong>Sets máximos:</strong> El número máximo de series que realizas normalmente</li>
              <li><strong>Sé conservador:</strong> Es mejor empezar con valores menores y ajustar después</li>
              <li><strong>1RM estimado:</strong> Se calcula automáticamente usando la fórmula de Epley</li>
            </ul>
          </div>

          {/* Botones de acción */}
          <div className="acciones-container">
            <button
              onClick={registrarEjercicio}
              disabled={loading || !nombre || !musculo || !pesoMaximo || !repeticionesMaximas || !setsMaximos}
              className="btn-accion crear"
            >
              {loading ? "⏳ Registrando..." : "💾 Registrar Ejercicio"}
            </button>

            <button
              onClick={limpiarFormulario}
              disabled={loading}
              className="login-button secondary"
            >
              🗑️ Limpiar Formulario
            </button>

            <button
              onClick={() => setCurrentView("menuRutina")}
              disabled={loading}
              className="boton-cancelar"
            >
              ← Regresar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrarEjercicio;