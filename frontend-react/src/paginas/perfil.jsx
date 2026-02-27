import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config'; 

function Perfil({ setToken }) {
  const navigate = useNavigate();
  
  const [datos, setDatos] = useState({
    nombre_usuario: '',
    email: '',
    direccion: ''
  });
  
  const [editMode, setEditMode] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const cargarPerfil = async () => {
      try {
        const res = await fetch(`${API_URL}/api/perfil`, {
          headers: { 'Authorization': token }
        });

        if (res.status === 401 || res.status === 403) {
          manejarCerrarSesion();
          return;
        }

        const data = await res.json();
        setDatos({
          nombre_usuario: data.nombre_usuario,
          email: data.email,
          direccion: data.direccion || ""
        });
      } catch (err) {
        console.error("Error cargando perfil", err);
      }
    };

    cargarPerfil();

    const sincronizar = (event) => {
      if (event.key === 'token' && !event.newValue) {
        navigate('/login');
      }
    };
    window.addEventListener('storage', sincronizar);
    return () => window.removeEventListener('storage', sincronizar);
  }, [token, navigate]);

  const manejarCerrarSesion = (e) => {
    if (e) e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    if (setToken) setToken(null);
    alert("Sesión cerrada.");
    navigate('/');
  };

  const manejarToggleEdit = async () => {
    if (editMode) {
      try {
        const res = await fetch(`${API_URL}/api/perfil`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token
          },
          body: JSON.stringify({
            nombre: datos.nombre_usuario,
            direccion: datos.direccion
          })
        });

        if (res.ok) {
          alert("Información actualizada");
          const storedUser = localStorage.getItem('usuario');
          if (storedUser) {
            const userLocal = JSON.parse(storedUser);
            userLocal.nombre = datos.nombre_usuario;
            localStorage.setItem('usuario', JSON.stringify(userLocal));
          }
        } else {
          alert("Error al actualizar la información.");
        }
      } catch (error) {
        console.error("Error en la petición:", error);
        alert("Error de conexión con el servidor.");
      }
    }
    setEditMode(!editMode);
  };

  const manejarCambioInput = (e) => {
    setDatos({
      ...datos,
      [e.target.name]: e.target.value
    });
  };

  return (
    <>
      <header className="header-principal">
        <div className="header-top">
          <div className="logo"><h1>LE PARFUM</h1></div>
          <div className="auth-links">
            <a href="#" onClick={manejarCerrarSesion} id="btn-logout">Cerrar sesión</a>
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

      <main className="perfil-container">
        <section className="perfil-card">
          <div className="perfil-header">
            <h2>Mi perfil</h2>
            <span className="perfil-subtitulo">Información de tu cuenta</span>
          </div>

          <form id="form-perfil" className="recomendaciones">
            <div className="dato">
              <label className="label">Usuario</label>
              <input 
                type="text" 
                name="nombre_usuario"
                value={datos.nombre_usuario}
                onChange={manejarCambioInput}
                disabled={!editMode}
              />
            </div>

            <div className="dato">
              <label className="label">Correo electrónico</label>
              <input 
                type="email" 
                name="email"
                value={datos.email}
                disabled
              />
            </div>

            <div className="dato">
              <label className="label">Dirección de envío</label>
              <input 
                type="text" 
                name="direccion"
                value={datos.direccion}
                onChange={manejarCambioInput}
                disabled={!editMode}
              />
            </div>

            <div className="perfil-acciones">
              <button 
                type="button" 
                id="btn-edit-toggle" 
                className="btn-secundario"
                onClick={manejarToggleEdit}
                style={editMode ? { backgroundColor: 'var(--color-acento)', color: '#1e1e1e' } : {}}
              >
                {editMode ? "Guardar cambios" : "Editar información"}
              </button>
              
              <Link to="/cambiar-password" handle="true" className="btn-primario">
                Cambiar contraseña
              </Link>
            </div>
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

export default Perfil;