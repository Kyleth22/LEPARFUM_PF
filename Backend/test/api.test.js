const request = require('supertest');
const app = require('../server'); 
const pool = require('../db');

describe('Pruebas de Robustez y Seguridad de la API', () => {

    let token;
    let usuarioId;

    // Aumentamos el tiempo a 20s porque las DBs en la nube (Render) tardan en responder
    beforeAll(async () => {
        try {
            const login = await request(app)
                .post('/api/login')
                .send({ correo: 'fer@hotmail.com', password: 'Prueba123' });
            
            if (login.body.status === 'success') {
                token = login.body.token;
                usuarioId = login.body.usuario && login.body.usuario.id;
            } else {
                console.warn("ADVERTENCIA: No se pudo loguear a fer@hotmail.com. Revisa si existe en la DB.");
            }
        } catch (error) {
            console.error("Error en beforeAll:", error);
        }
    }, 20000); 

    // --- 1. TEST DE LOGIN 
    test('Debería loguear un usuario correctamente', async () => {
        expect(token).toBeTruthy();
        expect(usuarioId).toBeTruthy();
    });

    // --- 2. TEST DE PAGINACIÓN 
    test('GET /api/productos debería devolver estructura de paginación', async () => {
        const res = await request(app).get('/api/productos?page=1&limit=2');
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('pagination');
        expect(res.body.pagination).toHaveProperty('totalPages');
        expect(res.body.data.length).toBeLessThanOrEqual(2);
    });

    // --- 3. TEST DE ROLES / AUTORIZACIÓN (SEGURIDAD)
    test('Seguridad: PUT /api/admin/actualizar-stock debería ser rechazado', async () => {
        const res = await request(app)
            .put('/api/admin/actualizar-stock')
            .set('authorization', token || 'token-falso')
            .send({ producto_id: 1, nuevo_stock: 99 });

        // Si el token es inválido o no es admin, debería dar 401 o 403
        expect([401, 403]).toContain(res.statusCode);
    });

    // --- 4. TEST DE GESTIÓN DE ERRORES 
    test('Debería activar el middleware de errores global al enviar datos inválidos', async () => {
        const res = await request(app)
            .post('/api/registro')
            .send({ usuario: '', correo: 'error-formato' }); 
        
        expect([400, 500]).toContain(res.statusCode);
        expect(res.body).toHaveProperty('status', 'error');
    });

    // --- 5. TEST DE CARRITO (FUNCIONAL)
    test('POST /api/carrito agrega un producto y valida el flujo completo', async () => {
        if (!token) throw new Error("No hay token disponible para este test");

        // Insertar producto temporal para la prueba
        const [insertResult] = await pool.query(
            'INSERT INTO productos (nombre, descripcion, precio, imagen_url, stock, marca) VALUES (?, ?, ?, ?, ?, ?)',
            ['TEST_PERFUME', 'Desc', 500.00, 'test.jpg', 10, 'MarcaTest']
        );
        const productoId = insertResult.insertId;

        try {
            const res = await request(app)
                .post('/api/carrito')
                .set('authorization', token)
                .send({ producto_id: productoId });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('status', 'success');

            const [rows] = await pool.query(
                'SELECT cantidad FROM carrito WHERE usuario_id = ? AND producto_id = ?',
                [usuarioId, productoId]
            );
            expect(rows.length).toBeGreaterThan(0);
        } finally {
            // Limpieza absoluta para no ensuciar la DB de producción
            await pool.query('DELETE FROM carrito WHERE producto_id = ?', [productoId]);
            await pool.query('DELETE FROM productos WHERE id = ?', [productoId]);
        }
    }, 15000); // Timeout individual para DB

    // Cerramos la conexión al finalizar todos los tests del bloque
    afterAll(async () => {
        await pool.end();
    });
});
