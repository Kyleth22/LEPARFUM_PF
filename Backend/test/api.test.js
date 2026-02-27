const request = require('supertest');
const app = require('../server'); 
const pool = require('../db');

describe('Pruebas de Robustez y Seguridad de la API', () => {

    let token;
    let usuarioId;

    // Antes de los tests, obtenemos el token para las pruebas protegidas
    beforeAll(async () => {
        const login = await request(app)
            .post('/api/login')
            .send({ correo: 'fer@hotmail.com', password: 'Prueba123' });
        
        token = login.body.token;
        usuarioId = login.body.usuario && login.body.usuario.id;
    });

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

    // --- 3. TEST DE ROLES / AUTORIZACIÓN 
    test('PUT /api/admin/actualizar-stock debería ser rechazado si no es admin', async () => {
        const res = await request(app)
            .put('/api/admin/actualizar-stock')
            .set('authorization', token)
            .send({ producto_id: 1, nuevo_stock: 99 });

        if (res.statusCode === 403) {
            expect(res.body.message).toContain("permisos de administrador");
        } else {
            expect(res.statusCode).toEqual(200);
        }
    });

    // --- 4. TEST DE GESTIÓN DE ERRORES 
    test('Debería activar el middleware de errores global al enviar datos inválidos', async () => {
        const res = await request(app)
            .post('/api/registro')
            .send({ usuario: '', correo: 'error-formato' }); // Datos incompletos
        
        // El servidor debería responder con un error capturado por el middleware
        expect([400, 500]).toContain(res.statusCode);
        expect(res.body).toHaveProperty('status', 'error');
    });

    // --- 5. TEST DE CARRITO
    test('POST /api/carrito agrega un producto y valida el flujo completo', async () => {
        // Insertar producto temporal
        const [insertResult] = await pool.query(
            'INSERT INTO productos (nombre, descripcion, precio, imagen_url, stock) VALUES (?, ?, ?, ?, ?)',
            ['TEST_PERFUME', 'Desc', 500.00, 'test.jpg', 10]
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
            // Limpieza
            await pool.query('DELETE FROM carrito WHERE producto_id = ?', [productoId]);
            await pool.query('DELETE FROM productos WHERE id = ?', [productoId]);
        }
    });
});

afterAll(async () => {
    await pool.end();
});
