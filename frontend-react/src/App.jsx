import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Importación de tus componentes (Páginas)
import Inicio from './paginas/inicio';
import Catalogo from './paginas/catalogo';
import Login from './paginas/login';
import Registro from './paginas/registro';
import Carrito from './paginas/carrito';
import Perfil from './paginas/perfil';
import CompraExitosa from './paginas/compraexitosa';
import Deseos from './paginas/deseos';
import Confirmacion from './paginas/confirmacion';
import CambiarPassword from './paginas/cambiarpassword';

function App() {
  // --- SISTEMA DE SESIONES ---
  // Inicializamos el estado directamente desde el localStorage
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    // Esta función detecta cambios en el localStorage desde otras pestañas 
    // o desde el mismo componente cuando actualizamos el token
    const sincronizarSesion = () => {
      const tokenActual = localStorage.getItem('token');
      setToken(tokenActual);
    };

    window.addEventListener('storage', sincronizarSesion);
    
    // También revisamos cada vez que el componente se monta por si acaso
    sincronizarSesion();

    return () => window.removeEventListener('storage', sincronizarSesion);
  }, []);

  return (
    <Router>
      <Routes>
        {/* --- RUTAS PÚBLICAS --- */}
        <Route path="/" element={<Inicio />} />
        <Route path="/catalogo" element={<Catalogo setToken={setToken} />} />
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/registro" element={<Registro />} />

        {/* --- RUTAS PROTEGIDAS (Requieren Sesión) --- */}
        {/* Usamos "replace" en Navigate para que no se guarde la ruta fallida 
            en el historial y no cause bucles al darle atrás.
        */}
        <Route 
          path="/carrito" 
          element={token ? <Carrito setToken={setToken} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/perfil" 
          element={token ? <Perfil setToken={setToken} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/deseos" 
          element={token ? <Deseos setToken={setToken} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/confirmacion" 
          element={token ? <Confirmacion setToken={setToken} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/compra-exitosa" 
          element={token ? <CompraExitosa setToken={setToken} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/cambiar-password" 
          element={token ? <CambiarPassword setToken={setToken} /> : <Navigate to="/login" replace />} 
        />

        {/* Ruta para manejar errores 404 */}
        <Route path="*" element={<h2 style={{color: 'white', textAlign: 'center', marginTop: '50px'}}>Página no encontrada</h2>} />
      </Routes>
    </Router>
  );
}

export default App;
