import React, { useState, useEffect } from "react";
import ViewRenderer from "./Componentes/ViewRenderer";
import { auth, db } from "./firebase-config";
import { doc, getDoc } from "firebase/firestore";

const App = () => {
  const [ currentUser, setCurrentUser ] = useState( null );
  const [ currentView, setCurrentView ] = useState( "menu" );
  const [ loading, setLoading ] = useState( true );

  const callBackAuthChanged = async ( user ) => {
    try {
      setError( null );

      if( user ) {
        setCurrentUser( user );

        // Verificar si el usuario tiene datos completos
        const userDocRef = doc( db, "usuarios", user.uid );
        const userDoc = await getDoc( userDocRef );

        if( userDoc.exists() && userDoc.data().datosCompletos ) {
          setCurrentView( "menuPrincipal" );
        } else {
          setCurrentView( "formularioDatos" );
        }
      } else {
        setCurrentUser( null );
        setCurrentView( "menu" );
      }
    } catch( error ) {
      console.error( "Error al verificar el estado del usuario:", error );
      setError( "Error al conectar con el servidor. Verifica tu conexión a internet." );
    } finally {
      setLoading( false );
    }
  }


  const callBackEffect = () => {
    const unsubscribe = auth.onAuthStateChanged( callBackAuthChanged );
    return () => unsubscribe();
  }

  useEffect( callBackEffect, [] );

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      setCurrentUser( null );
      setCurrentView( "menu" );
    } catch( error ) {
      console.error( "Error al cerrar sesión:", error );
      
    }
  };

  if( loading )
    return <div className="loading">Cargando...</div>;

  // Renderizado principal de la aplicación
  return (
    <div className="app">
      <ViewRenderer
        currentView={ currentView }
        setCurrentView={ setCurrentView }
        currentUser={ currentUser }
        handleSignOut={ handleSignOut }
      />

      
      <div style={ { display: "none" } }>
        <meta name="theme-color" content="#1f4f63" />
        <meta name="description" content="ControlFIt - Aplicación para el Seguimiento de Ejercicios y Control de Grasa Corporal" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </div>
    </div>
  );
};

export default App;