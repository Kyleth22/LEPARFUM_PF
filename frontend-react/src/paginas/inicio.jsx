import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config'; 

function Inicio({ setToken }) {
  const [usuario, setUsuario] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const usuarioData = localStorage.getItem('usuario');

    if (token && usuarioData) {
      setUsuario(JSON.parse(usuarioData));
    } else {
      setUsuario(null);
    }

    const sincronizarSesion = (e) => {
      if (e.key === 'token' && !e.newValue) {
        setUsuario(null);
        window.location.reload();
      }
    };
    window.addEventListener('storage', sincronizarSesion);
    return () => window.removeEventListener('storage', sincronizarSesion);
  }, []);

  const manejarLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    
    if (setToken) setToken(null);
    setUsuario(null);
    
    alert("Has cerrado sesión correctamente.");
    navigate('/'); 
  };

  const manejarRecomendacion = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const datos = {
      nombre: formData.get('nombre').trim(),
      correo: formData.get('correo').trim(),
      tipo: formData.get('tipo'),
      mensaje: formData.get('mensaje').trim()
    };

    try {
      const respuesta = await fetch(`${API_URL}/api/recomendaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });
      if (respuesta.ok) {
        alert(`¡Gracias ${datos.nombre}! Tu recomendación ha sido recibida.`);
        e.target.reset();
      }
    } catch (error) {
      alert('No se pudo conectar con el servidor.');
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
            {usuario ? (
              <>
                <span style={{ color: 'white', marginRight: '15px' }}>
                  Bienvenido, <strong>{usuario.nombre}</strong>
                </span>
                <Link to="/perfil">Mi Perfil</Link>
                <a href="#" id="logout-btn-index" onClick={manejarLogout}>Cerrar sesión</a>
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
            <li><Link to="/" className="activo">Inicio</Link></li>
            <li><Link to="/catalogo">Catálogo</Link></li>
            <li><Link to="/deseos">Lista de deseos</Link></li>
            <li><Link to="/carrito">Carrito</Link></li>
          </ul>
        </nav>
      </header>

      <main>
        <section className="contenido-header">
          <p>
            LE PARFUM se dedica a la venta de perfumes y fragancias, brindando atención personalizada
            a sus clientes según sus gustos y preferencias...
          </p>
          <p><strong>Misión:</strong> Brindar perfumes de alta calidad...</p>
          <p><strong>Visión:</strong> Ser una perfumería reconocida...</p>
        </section>

        <section className="perfumes">
          <h2>Nuestros perfumes</h2>
          <div className="contenedor_perfumes">
            <article className="caja_perfume">
              <h3>Hugo Boss Bottled Infinite</h3>
              <img src="/img/HugoBoss.jpg" alt="Hugo Boss" />
              <p>Fragancia fresca y amaderada...</p>
            </article>
            <article className="caja_perfume">
              <h3>Armaf Odyssey Spectra</h3>
              <img src="/img/Spectra.png" alt="Spectra" />
              <p>Fragancia vibrante...</p>
            </article>
            <article className="caja_perfume">
              <h3>CR7 Cristiano Ronaldo</h3>
              <img src="/img/CR7.jpg" alt="CR7" />
              <p>Aroma fougère...</p>
            </article>
          </div>
          <Link to="/catalogo" className="boton_vermas">Ver catálogo completo</Link>
        </section>

        <section className="recomendaciones">
          <h2>Envíanos tus recomendaciones</h2>
          <form id="form-recomendacion" onSubmit={manejarRecomendacion}>
            <label>Nombre</label>
            <input type="text" name="nombre" required />
            <label>Correo electrónico</label>
            <input type="email" name="correo" required />
            <label>Tipo de recomendación</label>
            <select name="tipo">
              <option value="perfume">Nuevo perfume</option>
              <option value="mejora">Mejora de la página</option>
              <option value="otro">Otro</option>
            </select>
            <label>Mensaje</label>
            <textarea name="mensaje" rows="4" required></textarea>
            <button type="submit">Enviar recomendación</button>
          </form>
        </section>
      </main>

      <footer className="footer">
        <p>Teléfono: 899-999-9999 | leparfum@hotmail.com</p>
        <p className="copyright">&copy; LE PARFUM</p>
      </footer>
    </>
  );
}

export default Inicio;