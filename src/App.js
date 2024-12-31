import React, { useState, useEffect } from "react";
import ViewRenderer from "./Componentes/ViewRenderer";
import { auth, db } from "./firebase-config";
import { doc, getDoc } from "firebase/firestore";

const App = () => {
  const [currentUser, setCurrentUser] = useState(null); // Estado para el usuario actual
  const [currentView, setCurrentView] = useState("menu"); // Estado para las vistas
  const [loading, setLoading] = useState(true); // Estado de carga

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        const userDocRef = doc(db, "usuarios", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data().datosCompletos) {
          setCurrentView("menuPrincipal"); // Redirigir a la vista principal interna
        } else {
          setCurrentView("formularioDatos"); // Redirigir al formulario de datos inicial
        }
      } else {
        setCurrentUser(null);
        setCurrentView("menu"); // Redirigir a la vista de menú principal externa
      }
      setLoading(false); // Detener el estado de carga
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Cargando...</div>; // Mostrar un mensaje de carga mientras espera
  }

  return (
    <div>
      <ViewRenderer
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentUser={currentUser}
        handleSignOut={() => {
          auth.signOut();
          setCurrentUser(null);
          setCurrentView("menu"); // Volver al menú principal externo al cerrar sesión
        }}
      />
    </div>
  );
};

export default App;
