import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { auth, db } from "../../firebase-config";
import { onAuthStateChanged } from "firebase/auth";
import dayjs from "dayjs";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

const HistogramaVolumenes = () => {
  const [userId, setUserId] = useState(null);
  const [ejercicios, setEjercicios] = useState([]);
  const [ejercicioId, setEjercicioID] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [formatoTiempo, setFormatoTiempo] = useState("semana");
  const [data, setData] = useState({});
  const [labels, setLabels] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        cargarEjercicios(user.uid);
      } else {
        setUserId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const cargarEjercicios = async (uid) => {
    try {
      const ejerciciosSnapshot = await getDocs(collection(db, `Usuarios/${uid}/ejercicios`));
      const ejerciciosCargados = ejerciciosSnapshot.docs.map((doc) => ({
        id: doc.id,
        nombre: doc.data().nombre,
      }));
      setEjercicios(ejerciciosCargados);
    } catch (error) {
      console.error("Error al cargar ejercicios:", error);
    }
  };

  const cargarRegistros = async (uid, ejercicioId) => {
    try {
      const registrosQuery = query(
        collection(db, `Usuarios/${uid}/ejercicios/${ejercicioId}/volumenes`),
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
    const fechaFin = dayjs();
    let fechaInicio;

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

    while (fechaActual.isBefore(fechaFin) || fechaActual.isSame(fechaFin)) {
      switch (formato) {
        case "semana":
          puntos.push(fechaActual.format("YYYY-MM-DD"));
          fechaActual = fechaActual.add(1, "day");
          break;
        case "mes":
          puntos.push(fechaActual.format("YYYY-MM-DD"));
          fechaActual = fechaActual.add(1, "day");
          break;
        case "ano":
          puntos.push(fechaActual.format("YYYY-MM"));
          fechaActual = fechaActual.add(1, "month");
          break;
        case "decada":
          puntos.push(fechaActual.format("YYYY"));
          fechaActual = fechaActual.add(1, "year");
          break;
        default:
          puntos.push(fechaActual.format("YYYY-MM-DD"));
          fechaActual = fechaActual.add(1, "day");
      }
    }

    return puntos;
  };

  const agruparDatos = (ejeX) => {
    return ejeX.map((punto) => {
      const registrosFiltrados = registros.filter((r) => {
        switch (formatoTiempo) {
          case "semana":
          case "mes":
            return r.fecha === punto;
          case "ano":
            return r.fecha.startsWith(punto);
          case "decada":
            return r.fecha.startsWith(punto);
          default:
            return r.fecha === punto;
        }
      });

      if (registrosFiltrados.length > 0) {
        const suma = registrosFiltrados.reduce(
          (total, registro) => total + Number(registro.volumen),
          0
        );
        return suma / registrosFiltrados.length;
      }

      return null;
    });
  };

  useEffect(() => {
    if (registros.length > 0) {
      const nuevoLabels = generarEjeX(formatoTiempo);
      setLabels(nuevoLabels);
      const datosAgrupados = agruparDatos(nuevoLabels);
      setData({
        labels: nuevoLabels,
        datasets: [
          {
            label: "Volumen",
            data: datosAgrupados,
            borderColor: "rgba(75, 192, 192, 1)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            fill: true,
          },
        ],
      });
    }
  }, [registros, formatoTiempo]);

  const manejarCambioEjercicio = (e) => {
    const ejercicioSeleccionado = e.target.value;
    setEjercicioID(ejercicioSeleccionado);
    if (ejercicioSeleccionado) {
      cargarRegistros(userId, ejercicioSeleccionado);
    }
  };

  const manejarCambioFormatoTiempo = (e) => {
    setFormatoTiempo(e.target.value);
  };

  return (
    <div className="container mt-5">
      <h3 className="text-center mb-4">Gráfica de Volúmenes</h3>
      <div className="mb-3">
        <label htmlFor="ejercicio" className="form-label">
          Selecciona un ejercicio:
        </label>
        <select
          id="ejercicio"
          className="form-select"
          onChange={manejarCambioEjercicio}
          value={ejercicioId || ""}
        >
          <option value="">Selecciona un ejercicio</option>
          {ejercicios.map((ejercicio) => (
            <option key={ejercicio.id} value={ejercicio.id}>
              {ejercicio.nombre}
            </option>
          ))}
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
                text: "Gráfica de Volúmenes",
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
                  text: "Volumen",
                },
                beginAtZero: true,
                suggestedMin: 0,
                suggestedMax: Math.max(...data.datasets[0]?.data || [1]),
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

export default HistogramaVolumenes;
