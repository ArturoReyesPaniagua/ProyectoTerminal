import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import './formularioDatos.css';

const ActualizarDatos = () => {
  const [edad, setEdad] = useState('');
  const [sexo, setSexo] = useState('');
  const [peso, setPeso] = useState('');
  const [biceps, setBiceps] = useState('');
  const [pecho, setPecho] = useState('');
  const [cintura, setCintura] = useState('');
  const [cuello, setCuello] = useState('');
  const [cuadriceps, setCuadriceps] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'usuarios', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setEdad(data.edad || '');
          setSexo(data.sexo || '');
          setPeso(data.peso || '');
          setBiceps(data.biceps || '');
          setPecho(data.pecho || '');
          setCintura(data.cintura || '');
          setCuello(data.cuello || '');
          setCuadriceps(data.cuadriceps || '');
        }
      } else {
        navigate('/login'); // Redirige al login si no hay usuario autenticado
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const actualizarDatos = async () => {
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, 'usuarios', user.uid);
      const fechaRegistro = new Date().toISOString();

      // Actualiza los datos actuales del usuario
      await updateDoc(userDocRef, {
        edad,
        sexo,
        peso,
        biceps,
        pecho,
        cintura,
        cuello,
        cuadriceps,
        fechaRegistro,
      });

      // Guarda un historial de progreso en una colección separada
      const historialRef = collection(db, 'usuarios', user.uid, 'historialProgreso');
      await addDoc(historialRef, {
        edad,
        sexo,
        peso,
        biceps,
        pecho,
        cintura,
        cuello,
        cuadriceps,
        fechaRegistro,
      });

      alert('Datos actualizados con éxito');
      navigate('/menuprincipal'); // Redirige al menú principal después de actualizar los datos
    }
  };

  return (
    <div className="formulario-datos-container">
      <div className="formulario-datos-box">
        <h2>Actualizar Datos</h2>
        <input
          type="number"
          placeholder="Edad"
          value={edad}
          onChange={(e) => setEdad(e.target.value)}
          className="formulario-datos-input"
        />
        <select
          value={sexo}
          onChange={(e) => setSexo(e.target.value)}
          className="formulario-datos-input"
        >
          <option value="">Seleccione Sexo</option>
          <option value="Masculino">Masculino</option>
          <option value="Femenino">Femenino</option>
        </select>
        <input
          type="number"
          placeholder="Peso (kg)"
          value={peso}
          onChange={(e) => setPeso(e.target.value)}
          className="formulario-datos-input"
        />
        <input
          type="number"
          placeholder="Circunferencia bíceps (cm)"
          value={biceps}
          onChange={(e) => setBiceps(e.target.value)}
          className="formulario-datos-input"
        />
        <input
          type="number"
          placeholder="Circunferencia pecho (cm)"
          value={pecho}
          onChange={(e) => setPecho(e.target.value)}
          className="formulario-datos-input"
        />
        <input
          type="number"
          placeholder="Circunferencia cintura (cm)"
          value={cintura}
          onChange={(e) => setCintura(e.target.value)}
          className="formulario-datos-input"
        />
        <input
          type="number"
          placeholder="Circunferencia cuello (cm)"
          value={cuello}
          onChange={(e) => setCuello(e.target.value)}
          className="formulario-datos-input"
        />
        <input
          type="number"
          placeholder="Circunferencia cuádriceps (cm)"
          value={cuadriceps}
          onChange={(e) => setCuadriceps(e.target.value)}
          className="formulario-datos-input"
        />
        <button onClick={actualizarDatos} className="boton-establecer-datos">
          Actualizar datos
        </button>
      </div>
    </div>
  );
};

export default ActualizarDatos;
