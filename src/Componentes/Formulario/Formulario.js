import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { auth, db } from "../../firebase-config";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";

const FormularioMedidas = () => {
  const [userId, setUserId] = useState(null);
  const [formData, setFormData] = useState({
    edad: "",
    sexo: "",
    peso: "",
    biceps: "",
    pecho: "",
    cintura: "",
    cuello: "",
    cuadriceps: "",
  });

  // Obtener el ID del usuario autenticado
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Manejar cambios en los inputs
  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Guardar datos en Firestore
  const establecerDatos = async (e) => {
    e.preventDefault();

    if (!userId) {
      alert("No estás autenticado. Por favor, inicia sesión.");
      return;
    }

    try {
      // Guardar los datos en la subcolección "medidas" del usuario con la fecha actual
      await addDoc(collection(db, `Usuarios/${userId}/registrosMedidas`), {
        ...formData,
        fecha: new Date().toISOString().split("T")[0], // Formato YYYY-MM-DD
      });

      alert("Datos guardados con éxito");
      setFormData({
        edad: "",
        sexo: "",
        peso: "",
        biceps: "",
        pecho: "",
        cintura: "",
        cuello: "",
        cuadriceps: "",
      });
    } catch (error) {
      console.error("Error al guardar los datos:", error);
      alert("Hubo un error al guardar los datos.");
    }
  };

  return (
    <div className="container mt-5">
      <h3 className="text-center mb-4">Formulario de Medidas</h3>
      <form onSubmit={establecerDatos} className="p-4 border rounded shadow">
        <div className="mb-3">
          <label htmlFor="edad" className="form-label">
            Edad
          </label>
          <input
            type="number"
            className="form-control"
            id="edad"
            name="edad"
            value={formData.edad}
            onChange={manejarCambio}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="sexo" className="form-label">
            Sexo
          </label>
          <select
            className="form-select"
            id="sexo"
            name="sexo"
            value={formData.sexo}
            onChange={manejarCambio}
            required
          >
            <option value="">Selecciona</option>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
          </select>
        </div>
        <div className="mb-3">
          <label htmlFor="peso" className="form-label">
            Peso
          </label>
          <input
            type="number"
            className="form-control"
            id="peso"
            name="peso"
            value={formData.peso}
            onChange={manejarCambio}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="biceps" className="form-label">
            Circunferencia bíceps
          </label>
          <input
            type="number"
            className="form-control"
            id="biceps"
            name="biceps"
            value={formData.biceps}
            onChange={manejarCambio}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="pecho" className="form-label">
            Circunferencia pecho
          </label>
          <input
            type="number"
            className="form-control"
            id="pecho"
            name="pecho"
            value={formData.pecho}
            onChange={manejarCambio}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="cintura" className="form-label">
            Circunferencia cintura
          </label>
          <input
            type="number"
            className="form-control"
            id="cintura"
            name="cintura"
            value={formData.cintura}
            onChange={manejarCambio}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="cuello" className="form-label">
            Circunferencia cuello
          </label>
          <input
            type="number"
            className="form-control"
            id="cuello"
            name="cuello"
            value={formData.cuello}
            onChange={manejarCambio}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="cuadriceps" className="form-label">
            Circunferencia cuádriceps
          </label>
          <input
            type="number"
            className="form-control"
            id="cuadriceps"
            name="cuadriceps"
            value={formData.cuadriceps}
            onChange={manejarCambio}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary w-100">
          Establecer datos
        </button>
      </form>
    </div>
  );
};

export default FormularioMedidas;
