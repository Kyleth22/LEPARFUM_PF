import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config'; 

function CambiarPassword({ setToken }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const manejarLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    if (setToken) setToken(null);
    alert("Sesión cerrada.");
    navigate('/');
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();

    const actual = document.getElementById('pass-actual').value;
    const nueva = document.getElementById('pass-nueva').value;
    const confirmar = document.getElementById('pass-confirmar').value;

    if (nueva !== confirmar) return alert("Las contraseñas nuevas no coinciden");
    if (nueva.length < 8) return alert("La nueva contraseña debe tener al menos 8 caracteres");

    try {
      const res = await fetch(`${API_URL}/api/cambiar-password`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': token 
        },
        body: JSON.stringify({ passwordActual: actual, passwordNueva: nueva })
      });

      const data = await res.json();
      
      if (res.ok) {
        alert("Contraseña actualizada con éxito");
        navigate('/perfil');
      } else {
        alert(data.message || "Error al actualizar");
      }
    } catch (err) { 
      alert("Error al conectar con el servidor"); 
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
            <Link to="/perfil">Perfil</Link>
            <a href="#" onClick={manejarLogout}>Cerrar sesión</a>
          </div>
        </div>
      </header>

      <main className="contenedor-seguridad">
        <section className="tarjeta-seguridad">
          <h2>Seguridad de la cuenta</h2>
          <p className="texto-seguridad">
            Por tu seguridad, es necesario confirmar tu contraseña actual antes de establecer una nueva.
          </p>

          <form className="form-seguridad" id="form-password" onSubmit={manejarSubmit}>
            
            <div className="campo-form">
              <label>Contraseña actual</label>
              <input 
                type="password" 
                id="pass-actual" 
                placeholder="••••••••" 
                required 
              />
            </div>

            <div className="campo-form">
              <label>Nueva contraseña</label>
              <input 
                type="password" 
                id="pass-nueva" 
                placeholder="Mínimo 8 caracteres" 
                required 
              />
            </div>

            <div className="campo-form">
              <label>Confirmar nueva contraseña</label>
              <input 
                type="password" 
                id="pass-confirmar" 
                placeholder="Repite la contraseña" 
                required 
              />
            </div>

            <div className="acciones-seguridad">
              <button type="submit" className="btn-primario">
                Actualizar contraseña
              </button>
              <Link to="/perfil" className="btn-secundario">
                Cancelar
              </Link>
            </div>
          </form>
        </section>
      </main>

      <footer className="footer">
        <p>&copy; 2026 LE PARFUM</p>
      </footer>
    </>
  );
}

export default CambiarPassword;