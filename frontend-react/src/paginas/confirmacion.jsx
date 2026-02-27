import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { API_URL } from '../config';

const stripePromise = loadStripe('pk_test_51T4zAMQ0yvzP4OuwMOUdRDGQMWI4V8rovsGTOTH5Wra9O3kCcLLh1JpR3L7Rj6mo6Pq9A7mkYXdQafnlTnMhHjLh000GpZu0II');

function Confirmacion({ setToken }) {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const costoEnvio = 150;

    const [productos, setProductos] = useState([]);
    const [usuario, setUsuario] = useState({ nombre_usuario: 'Cargando...', direccion: '' });
    const [tasaUSD, setTasaUSD] = useState(0.05);
    const [modoDolar, setModoDolar] = useState(localStorage.getItem('modoDolar') === 'true');
    const [metodoPago, setMetodoPago] = useState('Tarjeta');

    const cargarTasa = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/api/tipo-cambio`);
            if (res.ok) {
                const data = await res.json();
                setTasaUSD(data.tasaUSD);
            }
        } catch (err) { console.log("Usando tasa de respaldo."); }
    }, []);

    const toggleMoneda = () => {
        const nuevoModo = !modoDolar;
        setModoDolar(nuevoModo);
        localStorage.setItem('modoDolar', nuevoModo);
    };

    const mostrarPrecio = (precioMXN) => {
        if (modoDolar) return `$${(precioMXN * tasaUSD).toFixed(2)} USD`;
        return `$${precioMXN.toLocaleString('es-MX')} MXN`;
    };

    const cargarDatos = useCallback(async () => {
        if (!token) { navigate('/login'); return; }
        try {
            const [resCart, resPerfil] = await Promise.all([
                fetch(`${API_URL}/api/carrito-usuario`, { headers: { 'Authorization': token } }),
                fetch(`${API_URL}/api/perfil`, { headers: { 'Authorization': token } })
            ]);

            if (resCart.ok && resPerfil.ok) {
                setProductos(await resCart.json());
                setUsuario(await resPerfil.json());
            }
        } catch (error) { console.error("Error cargando datos:", error); }
    }, [token, navigate]);

    useEffect(() => {
        cargarTasa();
        cargarDatos();
    }, [cargarTasa, cargarDatos]);

    const manejarPago = async () => {
        if (!metodoPago.toLowerCase().includes('tarjeta')) {
            alert("Selecciona 'Tarjeta' para probar Stripe.");
            return;
        }

        const subtotal = productos.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);
        const totalFinalMXN = subtotal + costoEnvio;

        try {
            const resPedido = await fetch(`${API_URL}/api/pedidos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': token },
                body: JSON.stringify({ total: totalFinalMXN })
            });

            if (!resPedido.ok) throw new Error("No se pudo registrar el pedido en el servidor.");
            
            const datosPedido = await resPedido.json();
            localStorage.setItem('ultimo_pedido', datosPedido.codigo || datosPedido.id);

            const response = await fetch(`${API_URL}/api/crear-sesion-stripe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': token },
                body: JSON.stringify({ total: totalFinalMXN })
            });

            if (!response.ok) throw new Error("Error al contactar con el servicio de Stripe.");

            const session = await response.json();
            
            if (session.url) {
                window.location.href = session.url;
            } else {
                alert("Error: El servidor no devolvió una URL de pago válida.");
            }

        } catch (error) {
            console.error("Error en el proceso de pago:", error);
            alert("Hubo un problema al procesar el pago. Revisa que el servidor esté encendido.");
        }
    };

    const manejarLogout = (e) => {
        e.preventDefault();
        localStorage.clear();
        if (setToken) setToken(null);
        navigate('/');
    };

    const subtotalGlobalMXN = productos.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);

    return (
        <>
            <header className="header-principal">
                <div className="header-top">
                    <div className="logo"><h1>LE PARFUM</h1></div>
                    <div className="auth-links">
                        <Link to="/perfil">Perfil</Link>
                        <a href="#" onClick={manejarLogout}>Cerrar sesión</a>
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

            <main className="confirmacion-container">
                <h2>Finalizar Pedido</h2>

                <div className="confirmacion-grid">
                    <div className="columna-info">
                        <section className="bloque-confirmacion" id="container-productos">
                            <h3>Resumen de Productos</h3>
                            <div className="productos-lista">
                                {productos.map((p) => (
                                    <div key={p.producto_id} className="producto-confirmacion" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #333', paddingBottom: '5px' }}>
                                        <span>{p.nombre} (x{p.cantidad})</span>
                                        <strong>{mostrarPrecio(p.precio * p.cantidad)}</strong>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="bloque-confirmacion">
                            <h3>Dirección de Envío</h3>
                            <p className="info-texto" id="display-direccion">
                                <strong>{usuario.nombre_usuario}</strong><br />
                                {usuario.direccion || 'Sin dirección registrada'}<br />
                                México
                            </p>
                        </section>

                        <section className="bloque-confirmacion">
                            <h3>Método de Pago</h3>
                            <p className="info-texto" id="display-pago">{metodoPago} <br /> **** 0000</p>
                            <div className="editar-form" style={{marginTop: '10px'}}>
                                <select id="select-metodo" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                                    <option value="Tarjeta">Tarjeta de crédito / Débito (Stripe)</option>
                                    <option value="Efectivo" disabled>Efectivo (No disponible en demo)</option>
                                </select>
                            </div>
                        </section>
                    </div>

                    <aside className="columna-resumen">
                        <section className="bloque-confirmacion total-confirmacion">
                            <h3>Total del Pedido</h3>
                            
                            <div className="selector-moneda-confirmacion">
                                <button id="btn-toggle-moneda" className="btn-moneda-resumen" onClick={toggleMoneda}>
                                    {modoDolar ? "Cambiar a MXN" : "Cambiar a USD"}
                                </button>
                            </div>

                            <div className="linea-total">
                                <span>Subtotal</span>
                                <span>{mostrarPrecio(subtotalGlobalMXN)}</span>
                            </div>

                            <div className="linea-total">
                                <span>Envío</span>
                                <span>{mostrarPrecio(costoEnvio)}</span>
                            </div>

                            <div className="linea-total final">
                                <span>Total</span>
                                <span id="resumen-total">{mostrarPrecio(subtotalGlobalMXN + costoEnvio)}</span>
                            </div>

                            <button className="btn-principal" onClick={manejarPago}>
                                Proceder al Pago Seguro
                            </button>

                            <Link to="/carrito" className="btn-secundario">
                                ← Volver al carrito
                            </Link>
                        </section>
                    </aside>
                </div>
            </main>

            <footer className="footer">
                <p>&copy; 2026 LE PARFUM</p>
            </footer>
        </>
    );
}

export default Confirmacion;