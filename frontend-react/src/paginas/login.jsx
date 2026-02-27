import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

function Login({ setToken }) {
  const navigate = useNavigate();

  const manejarSubmit = async (e) => {
    e.preventDefault();

    const correo = document.getElementById('login-correo').value.trim();
    const password = document.getElementById('login-password').value;

    try {
      const respuesta = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, password })
      });

      const resultado = await respuesta.json();

      if (respuesta.ok) {
        localStorage.setItem('token', resultado.token);
        localStorage.setItem('usuario', JSON.stringify(resultado.usuario));

        if (setToken) setToken(resultado.token);

        alert(`¡Bienvenido de nuevo, ${resultado.usuario.nombre}!`);
        
        navigate('/');
      } else {
        alert(resultado.message);
      }

    } catch (error) {
      console.error("Error en el login:", error);
      alert("Error al conectar con el servidor.");
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
            <Link to="/registro">Registrarse</Link>
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

      <section className="recomendaciones auth-page">
        <h2>Iniciar sesión</h2>
        <p>Accede a tu cuenta para gestionar tus compras y perfumes favoritos.</p>

        <form id="form-login" onSubmit={manejarSubmit}>
          <input 
            type="email" 
            id="login-correo" 
            name="correo" 
            placeholder="Correo electrónico" 
            required 
          />

          <input 
            type="password" 
            id="login-password" 
            name="password" 
            placeholder="Contraseña" 
            required 
          />

          <button type="submit">Ingresar</button>
        </form>

        <p style={{ marginTop: '20px' }}>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" style={{ color: 'var(--color-acento)', textDecoration: 'none', fontWeight: 'bold' }}>
            Regístrate aquí
          </Link>
        </p>
      </section>

      <footer className="footer">
        <p>Teléfono: 899-999-9999</p>
        <p>Correo electrónico: leparfum@hotmail.com</p>
        <p>Redes sociales: @LE_PARFUM</p>
        <p className="copyright">&copy; LE PARFUM</p>
      </footer>
    </>
  );
}

export default Login;