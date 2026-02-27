import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config'; 

function Registro() {
  const navigate = useNavigate();

  const manejarSubmit = async (e) => {
    e.preventDefault();

    const usuario = document.getElementById('reg-usuario').value.trim();
    const correo = document.getElementById('reg-correo').value.trim();
    const password = document.getElementById('reg-password').value;
    const direccion = document.getElementById('reg-direccion').value.trim();

    if (password.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      const respuesta = await fetch(`${API_URL}/api/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, correo, password, direccion })
      });

      const resultado = await respuesta.json();

      if (respuesta.ok) {
        alert(`¡Bienvenido, ${usuario}! Tu cuenta ha sido creada exitosamente.`);
        navigate('/login');
      } else {
        alert(resultado.message || "Error al registrar usuario");
      }

    } catch (error) {
      console.error("Error de conexión:", error);
      alert("No se pudo conectar con el servidor.");
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
            <Link to="/login">Iniciar sesión</Link>
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
        <h2>Crear cuenta</h2>
        <p>Regístrate para guardar tus compras, deseos y recibir recomendaciones personalizadas.</p>

        <form id="form-registro" onSubmit={manejarSubmit}>
          <input 
            type="text" 
            id="reg-usuario" 
            name="usuario" 
            placeholder="Nombre de usuario" 
            required 
          />

          <input 
            type="email" 
            id="reg-correo" 
            name="correo" 
            placeholder="Correo electrónico" 
            required 
          />

          <input 
            type="password" 
            id="reg-password" 
            name="password" 
            placeholder="Contraseña" 
            required 
          />

          <input 
            type="text" 
            id="reg-direccion" 
            name="direccion" 
            placeholder="Dirección (opcional)" 
          />

          <button type="submit">Registrarme</button>
        </form>

        <p style={{ marginTop: '20px' }}>
          ¿Ya tienes cuenta?{' '}
          <Link 
            to="/login" 
            style={{ color: 'var(--color-acento)', textDecoration: 'none', fontWeight: 'bold' }}
          >
            Inicia sesión aquí
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

export default Registro;