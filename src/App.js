import { useState, useEffect } from "react";
import ViewRenderer from "./Componentes/ViewRenderer";
import { auth, db } from "./firebase-config";
import { doc, getDoc } from "firebase/firestore";
import "./global.css"; // ← Agregar esta línea

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState("menu");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // ✅ Estado faltante agregado

  const handleAuthStateChange = async (user) => {
    try {
      setError(null);

      if (user) {
        setCurrentUser(user);

        // Verificar si el usuario tiene datos completos
        const userDocRef = doc(db, "usuarios", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data()?.datosCompletos) {
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
  };

  // ✅ Suscribirse a los cambios de autenticación
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(handleAuthStateChange);
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      setError(null);
      await auth.signOut();
      setCurrentUser(null);
      setCurrentView("menu");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      setError("Error al cerrar sesión. Intenta de nuevo.");
    }
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="app">
      {/* ✅ Mostrar errores al usuario */}
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
      
      <ViewRenderer
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentUser={currentUser}
        handleSignOut={handleSignOut}
        error={error}
        setError={setError}
      />
    </div>
  );
};

export default App;