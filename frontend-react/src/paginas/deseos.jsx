import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config'; 

function ListaDeseos({ setToken }) {
  const navigate = useNavigate();
  
  // --- ESTADOS ---
  const [productos, setProductos] = useState([]);
  const [tasaUSD, setTasaUSD] = useState(0.05);
  const [modoDolar, setModoDolar] = useState(localStorage.getItem('modoDolar') === 'true');
  const [cargando, setCargando] = useState(true);

  const token = localStorage.getItem('token');
  const usuarioData = localStorage.getItem('usuario') ? JSON.parse(localStorage.getItem('usuario')) : null;

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const manejarLogout = (e) => {
    e.preventDefault();
    localStorage.clear();
    if (setToken) setToken(null);
    alert("Sesión cerrada.");
    navigate('/');
  };

  const cargarTasa = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/tipo-cambio`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.status === 'success') {
        setTasaUSD(data.tasaUSD);
      }
    } catch (err) {
      console.error("Error silencioso en tipo-cambio:", err.message);
    }
  }, []);

  const toggleMoneda = () => {
    const nuevoModo = !modoDolar;
    setModoDolar(nuevoModo);
    localStorage.setItem('modoDolar', nuevoModo);
  };

  const mostrarPrecio = (precioMXN) => {
    if (modoDolar) {
      const usd = (precioMXN * tasaUSD).toFixed(2);
      return `$${usd} USD`;
    }
    return `$${precioMXN.toLocaleString('es-MX')} MXN`;
  };

  const cargarDeseos = useCallback(async () => {
    if (!token) return;
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/api/deseos-usuario`, {
        headers: { 
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.status === 401) {
        alert("Tu sesión ha expirado.");
        localStorage.clear();
        navigate('/login');
        return;
      }

      if (!res.ok) throw new Error("Error al obtener datos");
      const data = await res.json();
      setProductos(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setCargando(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    cargarTasa();
    cargarDeseos();
  }, [cargarTasa, cargarDeseos]);

  const quitarDeDeseos = async (id) => {
    if (!window.confirm("¿Deseas eliminar este perfume de tu lista?")) return;
    try {
      const res = await fetch(`${API_URL}/api/deseos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token }
      });
      if (res.ok) cargarDeseos();
    } catch (error) {
      alert("No se pudo eliminar el producto.");
    }
  };

  const agregarAlCarrito = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/carrito`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token 
        },
        body: JSON.stringify({ producto_id: id })
      });
      if (res.ok) alert("¡Movido al carrito con éxito!");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <header className="header-principal">
        <div className="header-top">
          <div className="logo">
            <h1>LE PARFUM</h1>
          </div>
          <div className="auth-links">
            <Link to="/perfil">Mi Perfil</Link>
            <a href="#" onClick={manejarLogout}>Cerrar Sesión</a>
          </div>
        </div>
        <nav className="nav-principal">
          <ul>
            <li><Link to="/">Inicio</Link></li>
            <li><Link to="/catalogo">Catálogo</Link></li>
            <li><Link to="/deseos" className="activo">Lista de deseos</Link></li>
            <li><Link to="/carrito">Carrito</Link></li>
          </ul>
        </nav>
      </header>

      <main className="perfumes">
        <h2>TU LISTA DE DESEOS</h2>
        
        <button 
          id="btn-toggle-moneda" 
          className="btn-filtro-moneda" 
          style={{ display: 'block', margin: '10px auto 20px auto' }}
          onClick={toggleMoneda}
        >
          {modoDolar ? "USD $" : "MXN $"}
        </button>

        <div className="contenedor-catalogo" id="grid-deseos">
          {cargando ? (
            <p style={{ color: 'white', textAlign: 'center' }}>Cargando tus favoritos...</p>
          ) : productos.length === 0 ? (
            <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'white' }}>
              Aún no tienes perfumes en tu lista.
            </p>
          ) : (
            productos.map(p => (
              <div className="caja_perfume" key={p.id}>
                <img 
                  src={`/img/${p.imagen_url}`} 
                  alt={p.nombre} 
                  onError={(e) => e.target.src='/img/default.png'} 
                />
                <h3>{p.nombre}</h3>
                <p>{mostrarPrecio(p.precio)}</p> 
                <div className="acciones-producto">
                  <button className="btn-comprar" onClick={() => agregarAlCarrito(p.id)}>
                    Agregar al carrito
                  </button>
                  <button className="btn-eliminar" onClick={() => quitarDeDeseos(p.id)}>
                    Quitar de la lista
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <footer className="footer">
        <p>&copy; 2026 LE PARFUM | Todos los derechos reservados</p>
      </footer>
    </>
  );
}

export default ListaDeseos;