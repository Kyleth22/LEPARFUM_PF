import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

function CompraExitosa({ setToken }) {
    const navigate = useNavigate();
    const [idPedido, setIdPedido] = useState('LP-00000');
    const token = localStorage.getItem('token');

    useEffect(() => {
        const ultimoPedido = localStorage.getItem('ultimo_pedido');
        if (ultimoPedido) {
            setIdPedido(ultimoPedido);
        }

        const limpiarCarritoBackend = async () => {
            if (!token) return;
            try {
                await fetch(`${API_URL}/api/carrito-vaciar`, {
                    method: 'DELETE',
                    headers: { 'Authorization': token }
                });
                console.log("Carrito vaciado exitosamente.");
            } catch (error) {
                console.error("Error al vaciar el carrito:", error);
            }
        };

        limpiarCarritoBackend();
    }, [token]);

    const manejarLogout = (e) => {
        e.preventDefault();
        localStorage.clear();
        if (setToken) setToken(null);
        navigate('/');
    };

    return (
        <>
            <header className="header-principal">
                <div className="header-top">
                    <div className="logo">
                        <h1>LE PARFUM</h1>
                    </div>
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
                        <li><Link to="/carrito">Carrito</Link></li>
                    </ul>
                </nav>
            </header>

            <main className="exito-container">
                <div className="exito-card">
                    <div className="icono-exito" style={{ 
                        fontSize: '50px', 
                        color: '#2ecc71', 
                        marginBottom: '20px',
                        border: '3px solid #2ecc71',
                        borderRadius: '50%',
                        width: '80px',
                        height: '80px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px'
                    }}>
                        ✓
                    </div>

                    <h2>¡Compra realizada con éxito!</h2>

                    <p>
                        Gracias por confiar en <strong>LE PARFUM</strong>.<br />
                        Tu pedido ha sido confirmado y será procesado en breve.
                    </p>

                    <p className="exito-detalle">
                        Número de pedido: <strong id="pedido-id">#{idPedido}</strong><br />
                        Recibirás un correo con los detalles de tu compra.
                    </p>

                    <div className="exito-acciones" style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '30px' }}>
                        <Link to="/catalogo" className="btn-principal">
                            Seguir comprando
                        </Link>

                        <Link to="/perfil" className="btn-secundario">
                            Ver mi perfil
                        </Link>
                    </div>
                </div>
            </main>

            <footer className="footer">
                <p>&copy; 2026 LE PARFUM</p>
            </footer>
        </>
    );
}

export default CompraExitosa;