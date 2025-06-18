// utils/fitnessUtils.js

/**
 * Tabla de 1RM (Repetición Máxima) - Porcentaje vs Repeticiones
 */
export const TABLA_1RM = [
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

/**
 * Calcula el porcentaje de grasa corporal usando el método de la Marina de los Estados Unidos
 * @param {Object} datos - Datos corporales del usuario
 * @param {string} datos.sexo - "Masculino" o "Femenino"
 * @param {number} datos.cintura - Circunferencia de cintura en cm
 * @param {number} datos.cuello - Circunferencia de cuello en cm
 * @param {number} datos.cuadriceps - Circunferencia de cuádriceps/cadera en cm
 * @param {number} datos.altura - Altura en cm o metros
 * @returns {number} Porcentaje de grasa corporal
 */
export const calcularPorcentajeGrasa = (datos) => {
  const { sexo, cintura, cuello, cuadriceps } = datos;
  let altura = parseFloat(datos.altura) || 170;
  
  // Convertir a centímetros si está en metros
  if (altura < 3) {
    altura = altura * 100;
  }

  let porcentaje = 0;

  if (sexo === "Masculino") {
    // Fórmula para hombres: 86.010 × log10(cintura - cuello) - 70.041 × log10(altura) + 36.76
    porcentaje = 86.010 * Math.log10(parseFloat(cintura) - parseFloat(cuello)) - 
                 70.041 * Math.log10(altura) + 36.76;
  } else if (sexo === "Femenino") {
    // Fórmula para mujeres: 163.205×log10(cintura+cadera−cuello)−97.684×log10(altura)−78.387
    porcentaje = 163.205 * Math.log10(parseFloat(cintura) + parseFloat(cuadriceps) - parseFloat(cuello)) - 
                 97.684 * Math.log10(altura) - 78.387;
  }

  // Asegurar que el porcentaje esté en un rango válido (2% - 50%)
  return Math.max(2, Math.min(50, porcentaje));
};

/**
 * Calcula el 1RM (Una Repetición Máxima) usando interpolación lineal
 * @param {number} peso - Peso utilizado
 * @param {number} repeticiones - Número de repeticiones realizadas
 * @returns {number} 1RM estimado
 */
export const calcular1RM = (peso, repeticiones) => {
  if (repeticiones <= 0 || peso <= 0) return 0;
  
  // Buscar coincidencia exacta en la tabla
  const puntoExacto = TABLA_1RM.find(p => p.repeticiones === repeticiones);
  if (puntoExacto) {
    return peso / (puntoExacto.porcentaje / 100);
  }

  // Interpolación lineal si no hay coincidencia exacta
  let puntoSuperior = TABLA_1RM.find(p => p.repeticiones > repeticiones);
  let puntoInferior = TABLA_1RM.find(p => p.repeticiones < repeticiones);

  // Manejar casos límite
  if (!puntoSuperior) {
    puntoSuperior = TABLA_1RM[TABLA_1RM.length - 1]; // Usar el último punto
  }
  if (!puntoInferior) {
    puntoInferior = TABLA_1RM[0]; // Usar el primer punto
  }

  // Si tenemos ambos puntos, interpolar
  if (puntoInferior && puntoSuperior && puntoInferior !== puntoSuperior) {
    const porcentajeInterpolado = puntoInferior.porcentaje + 
      ((puntoSuperior.porcentaje - puntoInferior.porcentaje) * (repeticiones - puntoInferior.repeticiones)) / 
      (puntoSuperior.repeticiones - puntoInferior.repeticiones);
    
    return peso / (porcentajeInterpolado / 100);
  }

  // Fallback: usar el punto más cercano
  const puntoMasCercano = puntoInferior || puntoSuperior;
  return peso / (puntoMasCercano.porcentaje / 100);
};

/**
 * Calcula el volumen de entrenamiento
 * @param {number} peso - Peso en kg
 * @param {number} repeticiones - Número de repeticiones
 * @param {number} sets - Número de sets
 * @returns {number} Volumen total
 */
export const calcularVolumen = (peso, repeticiones, sets) => {
  return (peso || 0) * (repeticiones || 0) * (sets || 0);
};

/**
 * Calcula el factor de progresión para sobrecarga progresiva
 * @param {Object} ultimoEntrenamiento - Datos del último entrenamiento
 * @param {number} tasaIncremento - Tasa de incremento (0.02 = 2%)
 * @returns {number} Factor de progresión
 */
export const calcularFactorProgresion = (ultimoEntrenamiento, tasaIncremento = 0.02) => {
  // Objetivos base por defecto
  const repsObjetivo = 10;
  const seriesObjetivo = 3;
  
  const factorReps = Math.min(ultimoEntrenamiento.repeticionesAlcanzadas / repsObjetivo, 1.2);
  const factorSeries = Math.min(ultimoEntrenamiento.setsRealizados / seriesObjetivo, 1.2);
  
  return factorReps * factorSeries * tasaIncremento;
};

/**
 * Interpreta el porcentaje de grasa corporal y devuelve categoría y color
 * @param {number} porcentaje - Porcentaje de grasa corporal
 * @param {string} sexo - "Masculino" o "Femenino"
 * @returns {Object} Objeto con categoría y color
 */
export const interpretarPorcentajeGrasa = (porcentaje, sexo) => {
  const valor = parseFloat(porcentaje);
  
  if (sexo === "Masculino") {
    if (valor < 6) return { categoria: "Grasa Esencial", color: "#e74c3c", descripcion: "Muy bajo - Peligroso" };
    if (valor < 14) return { categoria: "Atlético", color: "#27ae60", descripcion: "Excelente para deportistas" };
    if (valor < 18) return { categoria: "Fitness", color: "#f39c12", descripcion: "Muy bueno" };
    if (valor < 25) return { categoria: "Promedio", color: "#3498db", descripcion: "Saludable" };
    return { categoria: "Obeso", color: "#e74c3c", descripcion: "Alto - Consultar especialista" };
  } else {
    if (valor < 14) return { categoria: "Grasa Esencial", color: "#e74c3c", descripcion: "Muy bajo - Peligroso" };
    if (valor < 21) return { categoria: "Atlético", color: "#27ae60", descripcion: "Excelente para deportistas" };
    if (valor < 25) return { categoria: "Fitness", color: "#f39c12", descripcion: "Muy bueno" };
    if (valor < 32) return { categoria: "Promedio", color: "#3498db", descripcion: "Saludable" };
    return { categoria: "Obeso", color: "#e74c3c", descripcion: "Alto - Consultar especialista" };
  }
};

/**
 * Formatea una fecha para mostrar de manera legible
 * @param {string|Date} fecha - Fecha a formatear
 * @param {boolean} incluirHora - Si incluir la hora
 * @returns {string} Fecha formateada
 */
export const formatearFecha = (fecha, incluirHora = false) => {
  const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
  
  const opciones = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  if (incluirHora) {
    opciones.hour = '2-digit';
    opciones.minute = '2-digit';
  }
  
  return fechaObj.toLocaleDateString('es-ES', opciones);
};

/**
 * Formatea una fecha para gráficos (versión corta)
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} Fecha formateada para gráficos
 */
export const formatearFechaGrafico = (fecha) => {
  const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return fechaObj.toLocaleDateString('es-ES', {
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Calcula la tendencia entre dos valores
 * @param {number} valorActual - Valor más reciente
 * @param {number} valorAnterior - Valor anterior
 * @param {boolean} menosEsMejor - Si un valor menor es mejor (ej: grasa corporal)
 * @returns {Object} Objeto con tendencia, porcentaje de cambio e icono
 */
export const calcularTendencia = (valorActual, valorAnterior, menosEsMejor = false) => {
  if (!valorAnterior || valorAnterior === 0) {
    return { tendencia: "neutral", cambio: 0, icono: "→", color: "#6c757d" };
  }
  
  const cambioPorcentaje = ((valorActual - valorAnterior) / valorAnterior) * 100;
  const cambioAbsoluto = valorActual - valorAnterior;
  
  let tendencia, icono, color;
  
  if (Math.abs(cambioPorcentaje) < 1) {
    tendencia = "neutral";
    icono = "→";
    color = "#6c757d";
  } else if (cambioPorcentaje > 0) {
    tendencia = menosEsMejor ? "empeorando" : "mejorando";
    icono = "↑";
    color = menosEsMejor ? "#e74c3c" : "#27ae60";
  } else {
    tendencia = menosEsMejor ? "mejorando" : "empeorando";
    icono = "↓";
    color = menosEsMejor ? "#27ae60" : "#e74c3c";
  }
  
  return {
    tendencia,
    cambio: cambioAbsoluto,
    cambioPorcentaje: Math.abs(cambioPorcentaje),
    icono,
    color
  };
};

/**
 * Valida los datos de entrada del formulario
 * @param {Object} datos - Datos a validar
 * @returns {Array} Array de errores (vacío si no hay errores)
 */
export const validarDatosFormulario = (datos) => {
  const errores = [];
  
  if (!datos.edad || datos.edad < 10 || datos.edad > 100) {
    errores.push("La edad debe estar entre 10 y 100 años");
  }
  
  if (!datos.sexo) {
    errores.push("Debes seleccionar tu sexo");
  }
  
  if (!datos.peso || datos.peso < 30 || datos.peso > 300) {
    errores.push("El peso debe estar entre 30 y 300 kg");
  }
  
  if (!datos.altura) {
    errores.push("La altura es requerida");
  } else {
    const alturaNum = parseFloat(datos.altura);
    if (alturaNum < 1.2 || (alturaNum > 3 && alturaNum < 120) || alturaNum > 250) {
      errores.push("La altura debe estar entre 1.2-3.0 metros o 120-250 cm");
    }
  }
  
  if (!datos.cintura || datos.cintura < 50 || datos.cintura > 200) {
    errores.push("La circunferencia de cintura debe estar entre 50 y 200 cm");
  }
  
  if (!datos.cuello || datos.cuello < 25 || datos.cuello > 60) {
    errores.push("La circunferencia de cuello debe estar entre 25 y 60 cm");
  }
  
  if (!datos.cuadriceps || datos.cuadriceps < 30 || datos.cuadriceps > 100) {
    errores.push("La circunferencia de cuádriceps debe estar entre 30 y 100 cm");
  }
  
  return errores;
};

/**
 * Genera un mensaje motivacional basado en el progreso
 * @param {number} porcentajeProgreso - Porcentaje de progreso (0-100)
 * @returns {Object} Objeto con mensaje, descripción y color
 */
export const generarMensajeMotivacional = (porcentajeProgreso) => {
  if (porcentajeProgreso >= 95) {
    return {
      mensaje: "¡Increíble! 🔥🏆",
      descripcion: "Has superado todas las expectativas. ¡Eres imparable!",
      color: "#28a745"
    };
  } else if (porcentajeProgreso >= 85) {
    return {
      mensaje: "¡Excelente trabajo! 💪✨",
      descripcion: "Tu dedicación está dando frutos. ¡Sigue así!",
      color: "#28a745"
    };
  } else if (porcentajeProgreso >= 70) {
    return {
      mensaje: "¡Buen progreso! 👍💚",
      descripcion: "Vas por buen camino. La constancia es clave.",
      color: "#ffc107"
    };
  } else if (porcentajeProgreso >= 50) {
    return {
      mensaje: "¡En el camino correcto! 🚀",
      descripcion: "Un buen comienzo. Cada día cuenta.",
      color: "#17a2b8"
    };
  } else {
    return {
      mensaje: "¡No te rindas! 💪🌟",
      descripcion: "Cada pequeño paso te acerca a tu objetivo.",
      color: "#fd7e14"
    };
  }
};

/**
 * Calcula estadísticas de un array de datos
 * @param {Array} datos - Array de números
 * @returns {Object} Objeto con estadísticas (promedio, min, max, etc.)
 */
export const calcularEstadisticas = (datos) => {
  if (!datos || datos.length === 0) {
    return { promedio: 0, minimo: 0, maximo: 0, total: 0 };
  }
  
  const numeros = datos.filter(d => typeof d === 'number' && !isNaN(d));
  
  if (numeros.length === 0) {
    return { promedio: 0, minimo: 0, maximo: 0, total: 0 };
  }
  
  const total = numeros.reduce((sum, val) => sum + val, 0);
  const promedio = total / numeros.length;
  const minimo = Math.min(...numeros);
  const maximo = Math.max(...numeros);
  
  return {
    promedio: Math.round(promedio * 100) / 100,
    minimo,
    maximo,
    total: Math.round(total * 100) / 100,
    cantidad: numeros.length
  };
};

// Constantes útiles
export const RANGOS_GRASA_CORPORAL = {
  masculino: {
    esencial: { min: 2, max: 5 },
    atletico: { min: 6, max: 13 },
    fitness: { min: 14, max: 17 },
    promedio: { min: 18, max: 24 },
    obeso: { min: 25, max: 50 }
  },
  femenino: {
    esencial: { min: 10, max: 13 },
    atletico: { min: 14, max: 20 },
    fitness: { min: 21, max: 24 },
    promedio: { min: 25, max: 31 },
    obeso: { min: 32, max: 50 }
  }
};

export const COLORES_TEMA = {
  primario: "#007bff",
  secundario: "#6c757d",
  exito: "#28a745",
  peligro: "#dc3545",
  advertencia: "#ffc107",
  info: "#17a2b8",
  claro: "#f8f9fa",
  oscuro: "#343a40"
};