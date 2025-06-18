import React, { useState, useEffect } from "react";
import ViewRenderer from "./Componentes/ViewRenderer";
import { CargaDatos, ErrorCarga } from "./Componentes/Comunes/ComponenteCarga";
import { auth, db } from "./firebase-config";
import { doc, getDoc } from "firebase/firestore";

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState("menu");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      try {
        setError(null);
        
        if (user) {
          setCurrentUser(user);
          
          // Verificar si el usuario tiene datos completos
          const userDocRef = doc(db, "usuarios", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists() && userDoc.data().datosCompletos) {
            setCurrentView("menuPrincipal");
          } else {
            setCurrentView("formularioDatos");
          }
        } else {
          setCurrentUser(null);
          setCurrentView("menu");
        }
      } catch (error) {
        console.error("Error al verificar el estado del usuario:", error);
        setError("Error al conectar con el servidor. Verifica tu conexión a internet.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      setCurrentUser(null);
      setCurrentView("menu");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      // No es crítico, el usuario puede refrescar la página
    }
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // Forzar recomprobación del estado
    window.location.reload();
  };

  // Pantalla de carga inicial
  if (loading) {
    return <CargaDatos tipo="datos" />;
  }

  // Pantalla de error si hay problemas
  if (error) {
    return (
      <ErrorCarga
        mensaje="Error de Conexión"
        descripcion={error}
        onReintentar={handleRetry}
        onRegresar={() => setCurrentView("menu")}
      />
    );
  }

  // Renderizado principal de la aplicación
  return (
    <div className="app">
      <ViewRenderer
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentUser={currentUser}
        handleSignOut={handleSignOut}
      />
      
      {/* Metadata para PWA (Progressive Web App) */}
      <div style={{ display: "none" }}>
        <meta name="theme-color" content="#1f4f63" />
        <meta name="description" content="ASECGC - Aplicación para el Seguimiento de Ejercicios y Control de Grasa Corporal" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </div>
    </div>
  );
};

export default App;