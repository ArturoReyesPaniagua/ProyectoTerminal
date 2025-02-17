import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { auth, db } from "../../firebase-config";
import { onAuthStateChanged } from "firebase/auth";
import dayjs from "dayjs";
import {Chart as ChartJS, LineElement,PointElement,LinearScale,Title,CategoryScale,Tooltip,Legend,} from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

const GraficaMedidas = () => {
  const [userId, setUserId] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [medidaSeleccionada, setMedidaSeleccionada] = useState("peso");
  const [formatoTiempo, setFormatoTiempo] = useState("semana");
  const [data, setData] = useState({});
  const [labels, setLabels] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        cargarRegistros(user.uid);
      } else {
        setUserId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const cargarRegistros = async (uid) => {
    try {
      const registrosQuery = query(
        collection(db, `Usuarios/${uid}/registrosMedidas`),
        orderBy("fecha", "asc")
      );
      const registrosSnapshot = await getDocs(registrosQuery);
      const registrosCargados = registrosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        fecha: dayjs(doc.data().fecha).format("YYYY-MM-DD"),
      }));
      setRegistros(registrosCargados);
    } catch (error) {
      console.error("Error al cargar registros:", error);
    }
  };

  const generarEjeX = (formato) => {
    const fechaFin = dayjs(); // Fecha actual
    let fechaInicio;

    // Ajustar fecha de inicio según el formato de tiempo
    switch (formato) {
      case "semana":
        fechaInicio = fechaFin.subtract(7, "day");
        break;
      case "mes":
        fechaInicio = fechaFin.subtract(1, "month");
        break;
      case "ano":
        fechaInicio = fechaFin.subtract(1, "year");
        break;
      case "decada":
        fechaInicio = fechaFin.subtract(10, "year");
        break;
      default:
        fechaInicio = fechaFin.subtract(7, "day");
    }

    const puntos = [];
    let fechaActual = fechaInicio;

    // Generar puntos según el formato de tiempo
    while (fechaActual.isBefore(fechaFin) || fechaActual.isSame(fechaFin)) {
      switch (formato) {
        case "semana":
          puntos.push(fechaActual.format("YYYY-MM-DD")); // Día completo
          fechaActual = fechaActual.add(1, "day");
          break;
        case "mes":
          puntos.push(fechaActual.format("YYYY-MM-DD")); // Día completo
          fechaActual = fechaActual.add(1, "day");
          break;
        case "ano":
          puntos.push(fechaActual.format("YYYY-MM")); // Mes y año
          fechaActual = fechaActual.add(1, "month");
          break;
        case "decada":
          puntos.push(fechaActual.format("YYYY")); // Solo año
          fechaActual = fechaActual.add(1, "year");
          break;
        default:
          puntos.push(fechaActual.format("YYYY-MM-DD"));
          fechaActual = fechaActual.add(1, "day");
      }
    }

    return puntos;
  };

  const agruparDatos = (ejeX, campo) => {
    return ejeX.map((punto) => {
      const registrosFiltrados = registros.filter((r) => {
        switch (formatoTiempo) {
          case "semana":
          case "mes":
            return r.fecha === punto; // Coincide exactamente con el día
          case "ano":
            return r.fecha.startsWith(punto); // Coincide con el mes y año
          case "decada":
            return r.fecha.startsWith(punto); // Coincide con el año
          default:
            return r.fecha === punto;
        }
      });

      if (registrosFiltrados.length > 0) {
        const suma = registrosFiltrados.reduce(
          (total, registro) => total + Number(registro[campo]),
          0
        );
        return suma / registrosFiltrados.length; // Promedio si hay múltiples registros
      }

      return null; // Rellenar con null si no hay datos
    });
  };

  useEffect(() => {
    if (registros.length > 0) {
      const nuevoLabels = generarEjeX(formatoTiempo);
      setLabels(nuevoLabels);
      const datosAgrupados = agruparDatos(nuevoLabels, medidaSeleccionada);
      setData({
        labels: nuevoLabels,
        datasets: [
          {
            label:
              medidaSeleccionada.charAt(0).toUpperCase() +
              medidaSeleccionada.slice(1),
            data: datosAgrupados,
            borderColor: "rgba(75, 192, 192, 1)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            fill: true,
          },
        ],
      });
    }
  }, [registros, medidaSeleccionada, formatoTiempo]);

  const manejarCambioMedida = (e) => {
    setMedidaSeleccionada(e.target.value);
  };

  const manejarCambioFormatoTiempo = (e) => {
    setFormatoTiempo(e.target.value);
  };

  return (
    <div className="container mt-5">
      <h3 className="text-center mb-4">Gráfica de Medidas</h3>
      <div className="mb-3">
        <label htmlFor="medida" className="form-label">
          Selecciona la medida:
        </label>
        <select
          id="medida"
          className="form-select"
          onChange={manejarCambioMedida}
          value={medidaSeleccionada}
        >
          <option value="peso">Peso</option>
          <option value="biceps">Circunferencia Bíceps</option>
          <option value="pecho">Circunferencia Pecho</option>
          <option value="cintura">Circunferencia Cintura</option>
          <option value="cuello">Circunferencia Cuello</option>
          <option value="cuadriceps">Circunferencia Cuádriceps</option>
        </select>
      </div>
      <div className="mb-3">
        <label htmlFor="formatoTiempo" className="form-label">
          Selecciona el formato de tiempo:
        </label>
        <select
          id="formatoTiempo"
          className="form-select"
          onChange={manejarCambioFormatoTiempo}
          value={formatoTiempo}
        >
          <option value="semana">Por Semana</option>
          <option value="mes">Por Mes</option>
          <option value="ano">Por Año</option>
          <option value="decada">Por Década</option>
        </select>
      </div>
      {labels.length > 0 && data.datasets ? (
        <Line
          data={data}
          options={{
            responsive: true,
            plugins: {
              legend: {
                display: true,
                position: "top",
              },
              title: {
                display: true,
                text: "Gráfica de Medidas",
              },
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text:
                    formatoTiempo === "semana"
                      ? "Días"
                      : formatoTiempo === "mes"
                      ? "Días del Mes"
                      : formatoTiempo === "ano"
                      ? "Meses"
                      : "Años",
                },
              },
              y: {
                title: {
                  display: true,
                  text: medidaSeleccionada,
                },
              },
            },
          }}
        />
      ) : (
        <p className="text-center">No hay datos para mostrar. Selecciona otra opción.</p>
      )}
    </div>
  );
};

export default GraficaMedidas;
