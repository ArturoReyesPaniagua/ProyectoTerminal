import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import './formularioDatos.css';

const FormularioDatos = () => {
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
    const checkUserData = async (user) => {
      if (user) {
        const userDocRef = doc(db, 'usuarios', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          // Si el documento no existe, crear un documento vacío
          await setDoc(userDocRef, { datosCompletos: false });
        } else if (userDoc.data().datosCompletos) {
          // Si los datos ya están completos, redirigir al menú principal
          navigate('/menuprincipal');
        }
      } else {
        navigate('/login'); // Redirige al login si no hay usuario autenticado
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      checkUserData(user);
    });

    return () => unsubscribe();
  }, [navigate]);

  const establecerDatos = async () => {
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, 'usuarios', user.uid);
      await setDoc(userDocRef, {
        edad,
        sexo,
        peso,
        biceps,
        pecho,
        cintura,
        cuello,
        cuadriceps,
        datosCompletos: true,
      });
      alert('Datos establecidos con éxito');
      navigate('/menuprincipal'); // Redirige al menú principal después de establecer los datos
    }
  };

  return (
    <div className="formulario-datos-container">
      <div className="formulario-datos-box">
        <h2>Formulario de Datos</h2>
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
        <button onClick={establecerDatos} className="boton-establecer-datos">
          Establecer datos
        </button>
      </div>
    </div>
  );
};

export default FormularioDatos;
