import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config'; 

function Catalogo({ setToken }) {
  const navigate = useNavigate();
  
  // --- ESTADOS ---
  const [productosGlobales, setProductosGlobales] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [idsDeseos, setIdsDeseos] = useState([]);
  const [tasaUSD, setTasaUSD] = useState(0.05);
  const [modoDolar, setModoDolar] = useState(localStorage.getItem('modoDolar') === 'true');
  const [cargando, setCargando] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  
  const [filtroMarca, setFiltroMarca] = useState('todos');
  const [filtroPrecio, setFiltroPrecio] = useState('todos');

  const token = localStorage.getItem('token');
  const usuarioData = localStorage.getItem('usuario') ? JSON.parse(localStorage.getItem('usuario')) : null;

  useEffect(() => {
    const sincronizar = (event) => {
      if (event.key === 'token' && !event.newValue) {
        window.location.reload();
      }
      if (event.key === 'modoDolar') {
        setModoDolar(event.newValue === 'true');
      }
    };
    window.addEventListener('storage', sincronizar);
    return () => window.removeEventListener('storage', sincronizar);
  }, []);

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
      const data = await res.json();
      if (data.status === 'success') setTasaUSD(data.tasaUSD);
    } catch (err) {
      console.log("Usando tasa de respaldo.");
    }
  }, []);

  const cargarIdsDeseos = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/deseos-usuario`, {
        headers: { 'Authorization': token }
      });
      if (res.ok) {
        const deseos = await res.json();
        setIdsDeseos(deseos.map(d => d.id));
      }
    } catch (err) {
      console.error("Error al obtener deseos:", err);
    }
  }, [token]);

  const cargarProductos = useCallback(async (pagina = 1) => {
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/api/productos?page=${pagina}&limit=30`);
      const resultado = await res.json();
      if (resultado.status === 'success') {
        setProductosGlobales(resultado.data);
        setProductosFiltrados(resultado.data);
        setPagination(resultado.pagination);
        const marcasUnicas = [...new Set(resultado.data.map(p => p.marca))].sort();
        setMarcas(marcasUnicas);
      }
    } catch (error) {
      console.error("Error de conexión.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const inicializar = async () => {
      await cargarTasa();
      await cargarIdsDeseos();
      await cargarProductos(1);
    };
    inicializar();
  }, [cargarTasa, cargarIdsDeseos, cargarProductos]);

  useEffect(() => {
    const filtrados = productosGlobales.filter(p => {
      const cumpleMarca = (filtroMarca === 'todos' || p.marca === filtroMarca);
      let cumplePrecio = true;
      if (filtroPrecio === 'bajo') cumplePrecio = p.precio < 1000;
      if (filtroPrecio === 'medio') cumplePrecio = p.precio >= 1000 && p.precio <= 2000;
      if (filtroPrecio === 'alto') cumplePrecio = p.precio > 2000;
      return cumpleMarca && cumplePrecio;
    });
    setProductosFiltrados(filtrados);
  }, [filtroMarca, filtroPrecio, productosGlobales]);

  const mostrarPrecio = (precioMXN) => {
    if (modoDolar) {
      return `$${(precioMXN * tasaUSD).toFixed(2)} USD`;
    }
    return `$${precioMXN.toLocaleString('es-MX')} MXN`;
  };

  const toggleMoneda = () => {
    const nuevoModo = !modoDolar;
    setModoDolar(nuevoModo);
    localStorage.setItem('modoDolar', nuevoModo);
  };

  const agregarAlCarrito = async (id) => {
    if (!token) return alert("Inicia sesión para agregar al carrito");
    try {
      const res = await fetch(`${API_URL}/api/carrito`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ producto_id: id })
      });
      if (res.ok) alert("¡Añadido al carrito!");
    } catch (err) { console.error(err); }
  };

  const agregarADeseos = async (id) => {
    if (!token) return alert("Inicia sesión para guardar deseos");
    try {
      // <--- 6. CAMBIAMOS LA URL PARA AÑADIR A DESEOS
      const res = await fetch(`${API_URL}/api/deseos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ producto_id: id })
      });
      if (res.ok) {
        setIdsDeseos(prev => [...prev, id]);
      }
    } catch (err) { console.error(err); }
  };

  return (
    <>
      <header className="header-principal">
        <div className="header-top">
          <div className="logo"><h1>LE PARFUM</h1></div>
          <div className="auth-links">
            {token && usuarioData ? (
              <>
                <span style={{ color: 'white', marginRight: '15px' }}>Hola, <strong>{usuarioData.nombre}</strong></span>
                <Link to="/perfil">Mi Perfil</Link>
                <a href="#" onClick={manejarLogout}>Cerrar sesión</a>
              </>
            ) : (
              <>
                <Link to="/login">Iniciar sesión</Link>
                <Link to="/registro">Registrarse</Link>
              </>
            )}
          </div>
        </div>
        <nav className="nav-principal">
          <ul>
            <li><Link to="/">Inicio</Link></li>
            <li><Link to="/catalogo" className="activo">Catálogo</Link></li>
            <li><Link to="/deseos">Lista de deseos</Link></li>
            <li><Link to="/carrito">Carrito</Link></li>
          </ul>
        </nav>
      </header>

      <section className="perfumes">
        <h2>Catálogo de perfumes</h2>
        
        <div className="filtros-catalogo">
          <select value={filtroMarca} onChange={(e) => setFiltroMarca(e.target.value)}>
            <option value="todos">Todas las Marcas</option>
            {marcas.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <select value={filtroPrecio} onChange={(e) => setFiltroPrecio(e.target.value)}>
            <option value="todos">Cualquier Precio</option>
            <option value="bajo">Menor a {mostrarPrecio(1000)}</option>
            <option value="medio">{mostrarPrecio(1000)} - {mostrarPrecio(2000)}</option>
            <option value="alto">Mayor a {mostrarPrecio(2000)}</option>
          </select>
          
          <button id="btn-toggle-moneda" className="btn-filtro-moneda" onClick={toggleMoneda}>
            {modoDolar ? "VER EN PESOS" : "VER EN DÓLARES"}
          </button>
        </div>

        <div className="contenedor-catalogo">
          {cargando ? (
            <p style={{ color: 'white', textAlign: 'center', width: '100%' }}>Cargando fragancias...</p>
          ) : productosFiltrados.length === 0 ? (
            <p style={{ color: 'white', textAlign: 'center', width: '100%' }}>No se encontraron perfumes.</p>
          ) : (
            productosFiltrados.map(p => {
              const esDeseo = idsDeseos.includes(p.id);
              return (
                <div className="caja_perfume" key={p.id}>
                  <img src={`/img/${p.imagen_url}`} alt={p.nombre} onError={(e) => e.target.src='/img/default.png'} />
                  <h3>{p.nombre}</h3>
                  <p>{mostrarPrecio(p.precio)}</p> 
                  <div className="acciones-producto">
                    <button className="btn-carrito" onClick={() => agregarAlCarrito(p.id)}>AGREGAR AL CARRITO</button>
                    <button 
                      className="btn-deseo" 
                      onClick={() => agregarADeseos(p.id)}
                      disabled={esDeseo}
                      style={esDeseo ? { background: '#e74c3c', cursor: 'default' } : {}}
                    >
                      {esDeseo ? '❤️ EN TU LISTA' : 'AÑADIR A DESEOS'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div id="paginacion-container" style={{ width: '100%', textAlign: 'center', marginTop: '20px', paddingBottom: '40px' }}>
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(n => (
            <button 
              key={n} 
              className={n === pagination.currentPage ? 'btn-pag activo' : 'btn-pag'}
              onClick={() => { cargarProductos(n); window.scrollTo(0, 0); }}
            >
              {n}
            </button>
          ))}
        </div>
      </section>

      <footer className="footer">
        <p>Teléfono: 899-999-9999 | leparfum@hotmail.com</p>
        <p>&copy; LE PARFUM</p>
      </footer>
    </>
  );
}

export default Catalogo;