import React, { useState, useEffect } from "react";

const BannerDeportivo = () => {
  const opciones = [
    {
      titulo: "Rutinas Personalizadas",
      subtitulo: "Descubre las mejores rutinas para alcanzar tus objetivos.",
      imagen: "https://via.placeholder.com/600x300?text=Rutinas+Personalizadas",
    },
    {
      titulo: "Suplementación Inteligente",
      subtitulo: "Conoce qué suplementos son ideales para ti.",
      imagen: "https://via.placeholder.com/600x300?text=Suplementación",
    },
    {
      titulo: "Técnicas de Entrenamiento",
      subtitulo: "Aprende técnicas avanzadas para mejorar tu rendimiento.",
      imagen: "https://via.placeholder.com/600x300?text=Técnicas+de+Entrenamiento",
    },
    {
      titulo: "Nutrición Deportiva",
      subtitulo: "Alimenta tu cuerpo para maximizar tu desempeño.",
      imagen: "https://via.placeholder.com/600x300?text=Nutrición+Deportiva",
    },
    {
      titulo: "Cardio Efectivo",
      subtitulo: "Descubre cómo optimizar tus sesiones de cardio.",
      imagen: "https://via.placeholder.com/600x300?text=Cardio+Efectivo",
    },
  ];
  const [indiceActual, setIndiceActual] = useState(0);

  // Cambia automáticamente cada 3 segundos
  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndiceActual((prevIndice) => (prevIndice + 1) % opciones.length);
    }, 3000);

    return () => clearInterval(intervalo); // Limpia el intervalo al desmontar
  }, []);

  const { titulo, subtitulo, imagen } = opciones[indiceActual];

  return (
    <div
      style={{
        background: "#f8f9fa",
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "20px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <img
        src={imagen}
        alt={titulo}
        style={{
          width: "100%",
          height: "auto",
          borderRadius: "8px",
          marginBottom: "10px",
        }}
      />
      <h3>{titulo}</h3>
      <p>{subtitulo}</p>
    </div>
  );
};

export default BannerDeportivo;
