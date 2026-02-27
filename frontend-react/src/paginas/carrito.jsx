import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

function Carrito({ setToken }) {
  const navigate = useNavigate();
  const costoEnvio = 150;

  // --- ESTADOS ---
  const [productos, setProductos] = useState([]);
  const [tasaUSD, setTasaUSD] = useState(0.05);
  const [modoDolar, setModoDolar] = useState(localStorage.getItem('modoDolar') === 'true');
  const [cargando, setCargando] = useState(true);

  const token = localStorage.getItem('token');

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
      if (res.ok) {
        const data = await res.json();
        setTasaUSD(data.tasaUSD);
      }
    } catch (err) {
      console.log("Usando tasa de respaldo.");
    }
  }, []);

  const toggleMoneda = (e) => {
    e.preventDefault();
    const nuevoModo = !modoDolar;
    setModoDolar(nuevoModo);
    localStorage.setItem('modoDolar', nuevoModo);
  };

  const mostrarPrecio = (precioMXN) => {
    if (modoDolar) {
      return `$${(precioMXN * tasaUSD).toFixed(2)} USD`;
    }
    return `$${precioMXN.toLocaleString('es-MX')} MXN`;
  };

  const cargarCarrito = useCallback(async () => {
    if (!token) return;
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/api/carrito-usuario`, {
        headers: { 'Authorization': token }
      });
      if (res.ok) {
        const data = await res.json();
        setProductos(data);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => {
    cargarTasa();
    cargarCarrito();
  }, [cargarTasa, cargarCarrito]);

  const actualizarCantidad = async (productoId, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;
    try {
      const res = await fetch(`${API_URL}/api/carrito/cantidad`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': token 
        },
        body: JSON.stringify({ producto_id: productoId, cantidad: nuevaCantidad })
      });
      const data = await res.json();
      if (res.ok) {
        setProductos(prev => prev.map(p => 
          p.producto_id === productoId ? { ...p, cantidad: nuevaCantidad } : p
        ));
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const eliminarProducto = async (productoId) => {
    if (!window.confirm("¿Eliminar producto?")) return;
    try {
      const res = await fetch(`${API_URL}/api/carrito/${productoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': token }
      });
      if (res.ok) {
        setProductos(prev => prev.filter(p => p.producto_id !== productoId));
      }
    } catch (error) {
      console.error(error);
    }
  };

  // --- 5. CÁLCULO DE TOTALES ---
  const subtotalGeneralMXN = productos.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);
  const totalMXN = subtotalGeneralMXN > 0 ? subtotalGeneralMXN + costoEnvio : 0;

  return (
    <>
      <header className="header-principal">
        <div className="header-top">
          <div className="logo"><h1>LE PARFUM</h1></div>
          <div className="auth-links">
            <Link to="/perfil">Mi Perfil</Link>
            <a href="#" onClick={manejarLogout}>Cerrar Sesión</a>
          </div>
        </div>
        <nav className="nav-principal">
          <ul>
            <li><Link to="/">Inicio</Link></li>
            <li><Link to="/catalogo">Catálogo</Link></li>
            <li><Link to="/deseos">Lista de deseos</Link></li>
            <li><Link to="/carrito" className="activo">Carrito</Link></li>
          </ul>
        </nav>
      </header>

      <main className="carrito-container">
        <h2>Tu carrito de compras</h2>

        <div className="carrito-contenido">
          <div className="carrito-productos">
            {cargando ? (
              <p style={{ textAlign: 'center', color: 'white' }}>Cargando carrito...</p>
            ) : productos.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'white' }}>Tu carrito está vacío.</p>
            ) : (
              productos.map(p => (
                <div className="item-carrito" key={p.producto_id}>
                  <img src={`/img/${p.imagen_url}`} alt={p.nombre} onError={(e) => e.target.src='/img/default.png'} />
                  <div className="info-item">
                    <h3>{p.nombre}</h3>
                    <p className="precio">{mostrarPrecio(p.precio)}</p>
                  </div>
                  <div className="cantidad">
                    <button className="btn-restar" onClick={() => actualizarCantidad(p.producto_id, p.cantidad - 1)}>-</button>
                    <span>{p.cantidad}</span>
                    <button className="btn-sumar" onClick={() => actualizarCantidad(p.producto_id, p.cantidad + 1)}>+</button>
                  </div>
                  <div className="subtotal">{mostrarPrecio(p.precio * p.cantidad)}</div>
                  <button className="eliminar" onClick={() => eliminarProducto(p.producto_id)}>✕</button>
                </div>
              ))
            )}
          </div>

          <div className="resumen-carrito">
            <h3>Resumen del pedido</h3>

            <div className="selector-moneda-carrito">
              <button id="btn-toggle-moneda" className="btn-moneda-resumen" onClick={toggleMoneda}>
                {modoDolar ? "Ver en MXN $" : "Ver en USD $"}
              </button>
            </div>

            <div className="resumen-linea">
              <span>Subtotal</span>
              <span id="resumen-subtotal">{mostrarPrecio(subtotalGeneralMXN)}</span>
            </div>

            <div className="resumen-linea">
              <span>Envío</span>
              <span id="resumen-envio">{subtotalGeneralMXN > 0 ? mostrarPrecio(costoEnvio) : mostrarPrecio(0)}</span>
            </div>

            <div className="resumen-total">
              <span>Total</span>
              <span id="resumen-total">{mostrarPrecio(totalMXN)}</span>
            </div>

            <Link to="/confirmacion" className="btn-principal">Proceder a compra</Link>
            <Link to="/catalogo" className="btn-secundario">Seguir comprando</Link>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>&copy; LE PARFUM</p>
      </footer>
    </>
  );
}

export default Carrito;