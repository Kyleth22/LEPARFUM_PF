const express = require('express');
const cors = require('cors');
const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const path = require('path');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://leparfumpf.vercel.app';

app.use(express.static(path.join(__dirname, '../Frontend/dist')));

app.use(cors({
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json());

// Endpoint para obtener el tipo de cambio USD/MXN
app.get('/api/tipo-cambio', async (req, res, next) => { 
    try {
        const response = await fetch(`https://open.er-api.com/v6/latest/MXN`);
        const apiData = await response.json();

        if (apiData.result !== "success") throw new Error("Error en API externa");

        res.json({
            status: 'success',
            tasaUSD: apiData.rates.USD 
        });
    } catch (error) {
        next(error);
    }
});

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// --- ENDPOINT ACTUALIZADO PARA STRIPE ---
app.post('/api/crear-sesion-stripe', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'mxn',
                    product_data: { name: 'Compra en Le Parfum' },
                    unit_amount: Math.round(req.body.total * 100), 
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${FRONTEND_URL}/compra-exitosa`, 
            cancel_url: `${FRONTEND_URL}/confirmacion`,   
        });

        res.json({ 
            id: session.id, 
            url: session.url 
        });
    } catch (error) {
        console.error("Error en Stripe:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// --- MIDDLEWARE DE AUTENTICACIÓN Y ROLES

const esAdmin = (req, res, next) => {
    if (req.usuarioRol !== 'admin') {
        return res.status(403).json({ message: "Acceso denegado: Se requieren permisos de administrador" });
    }
    next();
};

const verificarToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ message: "No se proporcionó un token." });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: "Token inválido o expirado." });
        req.usuarioId = decoded.id; 
        req.usuarioRol = decoded.rol;
        next();
    });
};

app.post('/api/registro', async (req, res, next) => {
    const { usuario, correo, password, direccion } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Asegúrate de que el número de '?' coincida con el array de abajo
        const query = 'INSERT INTO usuarios (nombre_usuario, email, password, direccion, rol) VALUES (?, ?, ?, ?, ?)';
        
        // Pasamos exactamente 5 valores para los 5 '?'
        await db.query(query, [
            usuario, 
            correo, 
            hashedPassword, 
            direccion || "", // Si está vacío, manda texto vacío para evitar error de NULL
            "cliente"        // El rol se pasa como el quinto elemento del array
        ]);

        res.status(201).json({ status: 'success', message: 'Usuario creado correctamente' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'El correo ya existe.' });
        next(error);
    }
});

app.post('/api/login', async (req, res, next) => {
    const { correo, password } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [correo]);
        if (rows.length === 0) return res.status(401).json({ message: "Credenciales incorrectas." });

        const usuario = rows[0];
        const esValida = await bcrypt.compare(password, usuario.password);
        if (!esValida) return res.status(401).json({ message: "Credenciales incorrectas." });

        const token = jwt.sign(
            { id: usuario.id, rol: usuario.rol }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );

        res.json({ 
            status: 'success', 
            token, 
            usuario: { 
                id: usuario.id, 
                nombre: usuario.nombre_usuario,
                rol: usuario.rol
            } 
        });
    } catch (error) { next(error); }
});

app.get('/api/perfil', verificarToken, async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT nombre_usuario, email, direccion FROM usuarios WHERE id = ?', [req.usuarioId]);
        res.json(rows[0]);
    } catch (error) { next(error); }
});

app.put('/api/perfil', verificarToken, async (req, res, next) => {
    const { nombre, direccion } = req.body;
    const usuarioId = req.usuarioId;
    try {
        const query = 'UPDATE usuarios SET nombre_usuario = ?, direccion = ? WHERE id = ?';
        await db.query(query, [nombre, direccion, usuarioId]);
        res.json({ status: 'success', message: 'Perfil actualizado correctamente' });
    } catch (error) {
        next(error);
    }
});

app.get('/api/productos', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 30;
        const offset = (page - 1) * limit;

        const [rows] = await db.query(
            'SELECT * FROM productos LIMIT ? OFFSET ?', 
            [limit, offset]
        );

        const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM productos');

        res.json({
            status: 'success',
            data: rows,
            pagination: {
                totalProductos: total,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                itemsPerPage: limit
            }
        });
    } catch (error) { next(error); }
});

app.get('/api/carrito-usuario', verificarToken, async (req, res, next) => {
    try {
        const query = `
            SELECT c.producto_id, c.cantidad, p.nombre, p.precio, p.imagen_url 
            FROM carrito c 
            JOIN productos p ON c.producto_id = p.id 
            WHERE c.usuario_id = ?`;
        const [rows] = await db.query(query, [req.usuarioId]);
        res.json(rows);
    } catch (error) { next(error); }
});

app.post('/api/carrito', verificarToken, async (req, res, next) => {
    const { producto_id } = req.body;
    try {
        const query = `
            INSERT INTO carrito (usuario_id, producto_id, cantidad) 
            VALUES (?, ?, 1) 
            ON DUPLICATE KEY UPDATE cantidad = cantidad + 1`;
        await db.query(query, [req.usuarioId, producto_id]);
        res.json({ status: 'success', message: "Carrito actualizado" });
    } catch (error) { next(error); }
});

app.put('/api/carrito/cantidad', verificarToken, async (req, res, next) => {
    const { producto_id, cantidad } = req.body;
    try {
        const [producto] = await db.query('SELECT stock FROM productos WHERE id = ?', [producto_id]);
        if (producto.length === 0) return res.status(404).json({ message: "Producto no encontrado" });

        if (cantidad > producto[0].stock) {
            return res.status(400).json({ 
                status: 'error', 
                message: `Lo sentimos, solo quedan ${producto[0].stock} unidades en stock.` 
            });
        }

        await db.query('UPDATE carrito SET cantidad = ? WHERE usuario_id = ? AND producto_id = ?', 
            [cantidad, req.usuarioId, producto_id]);
            
        res.json({ status: 'success', message: "Cantidad actualizada" });
    } catch (error) { next(error); }
});

app.delete('/api/carrito/:id', verificarToken, async (req, res, next) => {
    try {
        await db.query('DELETE FROM carrito WHERE usuario_id = ? AND producto_id = ?', [req.usuarioId, req.params.id]);
        res.json({ message: "Eliminado del carrito" });
    } catch (error) { next(error); }
});

app.get('/api/deseos-usuario', verificarToken, async (req, res, next) => {
    try {
        const query = `
            SELECT p.* FROM productos p
            INNER JOIN deseos d ON p.id = d.producto_id
            WHERE d.usuario_id = ?`;
        const [rows] = await db.query(query, [req.usuarioId]);
        res.json(rows);
    } catch (error) { next(error); }
});

app.post('/api/deseos', verificarToken, async (req, res, next) => {
    const { producto_id } = req.body;
    try {
        const query = 'INSERT IGNORE INTO deseos (usuario_id, producto_id) VALUES (?, ?)';
        await db.query(query, [req.usuarioId, producto_id]);
        res.json({ status: 'success', message: "Añadido a deseos" });
    } catch (error) { next(error); }
});

app.delete('/api/deseos/:productoId', verificarToken, async (req, res, next) => {
    try {
        await db.query('DELETE FROM deseos WHERE usuario_id = ? AND producto_id = ?', [req.usuarioId, req.params.productoId]);
        res.json({ status: 'success', message: 'Eliminado de deseos' });
    } catch (error) { next(error); }
});

app.post('/api/recomendaciones', async (req, res, next) => {
    const { nombre, correo, tipo, mensaje } = req.body;
    try {
        const query = 'INSERT INTO recomendaciones (nombre, correo, tipo_recomendacion, mensaje) VALUES (?, ?, ?, ?)';
        await db.query(query, [nombre, correo, tipo, mensaje]);
        res.status(201).json({ status: 'success', message: '¡Recomendación guardada!' });
    } catch (error) { next(error); }
});

app.post('/api/pedidos', verificarToken, async (req, res, next) => {
    const { total } = req.body;
    const usuario_id = req.usuarioId;
    const codigo_pedido = `LP-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    try {
        const query = 'INSERT INTO pedidos (usuario_id, codigo_pedido, total, fecha_pedido) VALUES (?, ?, ?, NOW())';
        await db.query(query, [usuario_id, codigo_pedido, total]);

        res.status(201).json({ 
            status: 'success', 
            codigo: codigo_pedido 
        });
    } catch (error) {
        next(error);
    }
});

app.put('/api/cambiar-password', verificarToken, async (req, res, next) => {
    const { passwordActual, passwordNueva } = req.body;
    const usuarioId = req.usuarioId;

    try {
        const [rows] = await db.query('SELECT password FROM usuarios WHERE id = ?', [usuarioId]);
        if (rows.length === 0) return res.status(404).json({ message: "Usuario no encontrado" });

        const esValida = await bcrypt.compare(passwordActual, rows[0].password);
        if (!esValida) return res.status(401).json({ message: "La contraseña actual es incorrecta" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(passwordNueva, salt);

        await db.query('UPDATE usuarios SET password = ? WHERE id = ?', [hashedPassword, usuarioId]);

        res.json({ status: 'success', message: "Contraseña actualizada correctamente" });
    } catch (error) {
        next(error);
    }
});

app.delete('/api/carrito-vaciar', verificarToken, async (req, res, next) => {
    try {
        await db.query('DELETE FROM carrito WHERE usuario_id = ?', [req.usuarioId]);
        res.json({ message: "Carrito vaciado" });
    } catch (error) { next(error); }
});

// --- MANEJADOR DE ERRORES GLOBAL ---
app.use((err, req, res, next) => {
    console.error("Error detectado:", err.message);
    res.status(500).json({
        status: 'error',
        message: 'Algo salió mal en el servidor',
        detalles: err.message
    });
});

// --- INICIO DEL SERVIDOR ---
const PORT = process.env.PORT || 3000;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Backend listo en puerto ${PORT}`);
    });
}

module.exports = app;
