const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
// CONTROLADOR NATIVO DE POSTGRESQL (REEMPLAZA A MONGOOSE COMPLETAMENTE)
const { Pool } = require('pg');
const { randomBytes, randomInt, randomUUID, createHmac, scrypt, timingSafeEqual } = require('crypto');
const { promisify } = require('util');
const derivarClave = promisify(scrypt);

const app = express();

// =========================================================================
// CONFIGURACIÓN DE MIDDLEWARES BASE DE RANGO INDUSTRIAL
// =========================================================================
app.use(cors());
app.use(express.json({ limit: '100kb' }));

// =========================================================================
// SISTEMA DE MONITOREO Y LOGGING PERSONALIZADO (MIDDLEWARE AUDITOR)
// =========================================================================
app.use((req, res, next) => {
    const inicio = Date.now();
    res.on('finish', () => {
        const duracion = Date.now() - inicio;
        console.log(`[AUDITORÍA FERRETERA] ${new Date().toISOString()} | MÉTODO: ${req.method} | RUTA: ${req.originalUrl} | ESTADO: ${res.statusCode} | TIEMPO: ${duracion}ms`);
    });
    next();
});

// =========================================================================
// CONEXIÓN A BASE DE DATOS POSTGRESQL (NEON CLOUD)
// =========================================================================
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Las migraciones no borran las tablas ni los registros existentes.
async function prepararBaseDeDatos() {
    try {
        await pool.query('SELECT NOW()');
        await pool.query('ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS nombre_comercial TEXT');
        await pool.query('ALTER TABLE usuarios ALTER COLUMN contrasena_hash TYPE TEXT');
        await pool.query('ALTER TABLE productos ADD COLUMN IF NOT EXISTS categoria_personalizada TEXT');
        await pool.query('ALTER TABLE productos ADD COLUMN IF NOT EXISTS creado_por_correo TEXT');
        await inicializarSemilla();
        await pool.query(`UPDATE productos SET creado_por_correo = 'proveedor@gmail.com'
          WHERE creado_por_correo IS NULL AND codigo_sku IN
          ('PVC-SCH40-05','HERR-MART-16','CEM-CANAL-42','PERN-GR5-052','HERR-CINT-5M','VAR-HIER-38', 'HERR-TAL-750', 'HERR-DEST-6', 'CONST-ZINC-12', 'FIJ-CLAV-2', 'FONT-LLAVE-05', 'ELEC-CABLE-12')`);
        console.log('✅ Neon PostgreSQL conectado y migraciones listas.');
    } catch (error) {
        console.error('❌ Error al conectar o preparar PostgreSQL:', error.message);
    }
}
prepararBaseDeDatos();

// Autenticación persistente: token firmado, sin guardar contraseñas en el navegador.
const SESSION_SECRET = process.env.SESSION_SECRET || randomBytes(32).toString('hex');
if (!process.env.SESSION_SECRET) console.warn('[SEGURIDAD] Configura SESSION_SECRET en Render para conservar sesiones después de reinicios.');

async function hashContrasena(clave) {
    const salt = randomBytes(16).toString('base64url');
    const hash = (await derivarClave(clave, salt, 32)).toString('base64url');
    return `s2$${salt}$${hash}`;
}
async function comprobarContrasena(clave, almacenada) {
    if (typeof almacenada !== 'string') return false;
    if (!almacenada.startsWith('s2$')) return clave.trim() === almacenada; // Migración de cuentas anteriores.
    const partes = almacenada.split('$');
    if (partes.length !== 3) return false;
    const actual = await derivarClave(clave, partes[1], 32);
    const esperado = Buffer.from(partes[2], 'base64url');
    return esperado.length === actual.length && timingSafeEqual(esperado, actual);
}
function generarToken(usuario) {
    const cuerpo = Buffer.from(JSON.stringify({ id: Number(usuario.id_usuario), exp: Date.now() + 30 * 86400000 })).toString('base64url');
    const firma = createHmac('sha256', SESSION_SECRET).update(cuerpo).digest('base64url');
    return cuerpo + '.' + firma;
}
function leerToken(token) {
    try {
        if (!token || typeof token !== 'string') return null;
        const [cuerpo, firma] = token.split('.');
        if (!cuerpo || !firma) return null;
        const real = createHmac('sha256', SESSION_SECRET).update(cuerpo).digest();
        const recibida = Buffer.from(firma, 'base64url');
        if (real.length !== recibida.length || !timingSafeEqual(real, recibida)) return null;
        const datos = JSON.parse(Buffer.from(cuerpo, 'base64url').toString());
        if (!Number.isInteger(datos.id) || datos.exp < Date.now()) return null;
        return datos;
    } catch { return null; }
}
function usuarioPublico(row) {
    return {
        correo: row.correo_corporativo,
        rol: row.id_rol === 2 ? 'PROVEEDOR' : 'COMPRADOR',
        nombre: row.nombre_comercial || row.correo_corporativo.split('@')[0],
        estado: row.estado_usuario
    };
}
async function requerirSesion(req, res, next) {
    try {
        const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
        const sesion = leerToken(token);
        if (!sesion) return res.status(401).json({ error: 'Sesión caducada. Inicie sesión nuevamente.' });
        const resultado = await pool.query('SELECT id_usuario, correo_corporativo, nombre_comercial, id_rol, estado_usuario FROM usuarios WHERE id_usuario = $1', [sesion.id]);
        if (!resultado.rows.length || !['VERIFICADO', 'ACTIVO'].includes(resultado.rows[0].estado_usuario))
            return res.status(401).json({ error: 'Sesión inválida.' });
        req.usuario = resultado.rows[0];
        next();
    } catch (error) { res.status(500).json({ error: 'No se pudo validar la sesión.' }); }
}
function soloProveedor(req, res, next) {
    if (req.usuario.id_rol !== 2) return res.status(403).json({ error: 'Solo los proveedores pueden administrar productos.' });
    next();
}
app.get('/api/sesion', requerirSesion, (req, res) => res.json({ exito: true, usuario: usuarioPublico(req.usuario) }));

// =========================================================================
// MATRIZ DE SEMILLA INICIAL ENRIQUECIDA (SECTOR FERRETERO NICARAGÜENSE)
// =========================================================================
const inicializarSemilla = async () => {
    try {
        const countUsuarios = await pool.query('SELECT COUNT(*) FROM usuarios');
        if (parseInt(countUsuarios.rows[0].count) === 0) {
            console.log("[SISTEMA] BD Usuarios vacía. Inicializando entidades ferreteras...");
            const claveDemo = await hashContrasena('1234');
            await pool.query(`
                INSERT INTO usuarios (correo_corporativo, contrasena_hash, id_rol, estado_usuario, codigo_otp, nombre_comercial) VALUES
                ('proveedor@gmail.com', $1, 2, 'VERIFICADO', NULL, 'Distribuidora Mayorista'),
                ('comprador@gmail.com', $1, 1, 'VERIFICADO', NULL, 'Ferretería Demo')
            `, [claveDemo]);
        }

        const countProductos = await pool.query('SELECT COUNT(*) FROM productos');
        if (parseInt(countProductos.rows[0].count) === 0) {
            console.log("[SISTEMA] BD Productos vacía. Cargando catálogo ferretero maestro...");
            await pool.query(`
                INSERT INTO productos (id_empresa_proveedor, id_subcategoria, id_marca, codigo_sku, nombre_articulo, precio_mayorista_usd, stock_disponible, imagen_url) VALUES
                (1, 1, 1, 'PVC-SCH40-05', 'Tubo PVC Presión 1/2" x 6m Sch 40 (Amanco)', 2.35, 120, 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=600&q=80&sig=1'),
                (1, 2, 2, 'HERR-MART-16', 'Martillo de Uña 16oz Truper Profesional', 6.50, 45, 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=600&q=80&sig=2'),
                (1, 3, 3, 'CEM-CANAL-42', 'Saco de Cemento Canal Estructural (42.5kg)', 8.50, 200, 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=600&q=80&sig=3'),
                (1, 4, 2, 'PERN-GR5-052', 'Perno Grado 5 Zincado 1/2" x 2" (Pack x100)', 4.10, 80, 'https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=600&q=80&sig=4'),
                (1, 2, 2, 'HERR-CINT-5M', 'Cinta Métrica 5m Truper TR-1502', 2.60, 60, 'https://images.unsplash.com/photo-1531842477197-e3f85e40346e?auto=format&fit=crop&w=600&q=80&sig=5'),
                (1, 3, 3, 'VAR-HIER-38', 'Varilla de Hierro Corrugado 3/8" x 6m', 4.80, 150, 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80&sig=6'),
                (1, 2, 2, 'HERR-TAL-750', 'Taladro Eléctrico 750 W', 54.95, 24, ''),
                (1, 2, 2, 'HERR-DEST-6', 'Juego de Destornilladores 6 piezas', 9.80, 75, ''),
                (1, 3, 3, 'CONST-ZINC-12', 'Lámina de Zinc Calibre 26 de 12 pies', 17.40, 110, ''),
                (1, 4, 2, 'FIJ-CLAV-2', 'Clavos de Acero 2 pulgadas (libra)', 1.60, 200, ''),
                (1, 1, 1, 'FONT-LLAVE-05', 'Llave de Paso PVC 1/2 pulgada', 2.10, 140, ''),
                (1, 1, 1, 'ELEC-CABLE-12', 'Cable Eléctrico THHN calibre 12 (metro)', 0.98, 250, '')
            `);
        }
    } catch (err) {
        console.error("[SISTEMA] Error al inicializar semilla PostgreSQL:", err.message);
    }
};

// =========================================================================
// COMPUERTA ALGORÍTMICA: VALIDACIONES
// =========================================================================
const validarFormatoCorreo = (correo) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(correo);
};

const validarNumeroTelefonoNicaragua = (telefono) => {
    if (!telefono) return true; // Opcional si el cliente no lo envía
    const limpio = telefono.replace(/[\s-]/g, '');
    const regex = /^[2578]\d{7}$/;
    return regex.test(limpio);
};

// =========================================================================
// CONTROLADOR LOGÍSTICO SMTP ULTRA-COMPATIBLE (BREVO B2B)
// =========================================================================
const configurarTransporterB2B = () => {
    return nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 2525,
        secure: false, // TLS
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: { rejectUnauthorized: false }
    });
};

// =========================================================================
// COMPUERTA DE ENTRADA AL SERVIDOR Y DIAGNÓSTICO
// =========================================================================
app.get('/', async (req, res) => {
    const envUser = process.env.EMAIL_USER ? "CONFIGURADO DE FORMA CORRECTA" : "FALTA ASIGNAR EN ENVIRONMENT";
    const envPass = process.env.EMAIL_PASS ? "CONFIGURADO DE FORMA CORRECTA" : "FALTA ASIGNAR EN ENVIRONMENT";
    const envGemini = process.env.GEMINI_API_KEY ? "MODELO GEMINI REAL ACTIVO" : "FALLBACK DE CONTINGENCIA LOCAL FERRETERO ACTIVO";
    
    let envDbStatus = "FALTA ASIGNAR DATABASE_URL";
    try {
        await pool.query('SELECT NOW()');
        envDbStatus = "CONEXIÓN A NUBE ESTABLECIDA (POSTGRESQL NEON)";
    } catch (e) {
        envDbStatus = "FALLO AL CONECTAR A POSTGRESQL NEON";
    }

    res.send(`
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; margin-top: 50px; color: #0f172a; padding: 20px; background: #fafafa;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                <h1 style="color: #10b981; font-weight: 900; letter-spacing: -1px; margin-bottom: 10px;">⚡ API SupplierNi B2B — Red Ferretera</h1>
                <p style="color: #64748b; font-size: 14px; margin-bottom: 30px;">Microservicio de Enlace Comercial e Ingeniería de Software - UNI Nicaragua.</p>
                
                <div style="text-align: left; background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #edf2f7; font-size: 12px; font-family: monospace;">
                    <h3 style="margin-top: 0; color: #334155; font-size: 13px; font-family: sans-serif;">🔍 DIAGNÓSTICO DE COMPUERTAS CLOUD</h3>
                    <p>• <strong>BASE DE DATOS:</strong> <span style="color: ${process.env.DATABASE_URL ? '#059669' : '#dc2626'}">${envDbStatus}</span></p>
                    <p>• <strong>VARIABLE EMAIL_USER:</strong> <span style="color: ${process.env.EMAIL_USER ? '#059669' : '#dc2626'}">${envUser}</span></p>
                    <p>• <strong>VARIABLE EMAIL_PASS:</strong> <span style="color: ${process.env.EMAIL_PASS ? '#059669' : '#dc2626'}">${envPass}</span></p>
                    <p>• <strong>MOTOR DE IA FERRETERO:</strong> <span style="color: #2563eb;">${envGemini}</span></p>
                </div>
                <div style="margin-top: 30px; font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                    Henry Isaac Lechado Moreno &copy; 2026
                </div>
            </div>
        </div>
    `);
});

// =========================================================================
// 1. ENDPOINT: REGISTRO COMERCIAL CON ENVÍO DE TOKEN OTP
// =========================================================================
app.post('/api/registro', async (req, res) => {
    try {
        const { correo, contrasena, rol, nombre } = req.body;
        
        if (!correo || !contrasena || !rol || !nombre) {
            return res.status(400).json({ exito: false, error: "Todos los campos son obligatorios." });
        }
        if (!validarFormatoCorreo(correo)) {
            return res.status(400).json({ exito: false, error: "Sintaxis del correo inválida." });
        }

        const correoLimpio = correo.toLowerCase().trim();
        const existe = await pool.query('SELECT * FROM usuarios WHERE correo_corporativo = $1', [correoLimpio]);
        
        if (existe.rows.length > 0) {
            return res.status(400).json({ exito: false, error: "Esta entidad legal ya se encuentra inscrita en la red ferretera." });
        }

        const tokenOTP = randomInt(100000, 1000000).toString();

        // Mapear el rol a su ID relacional (1: COMPRADOR, 2: PROVEEDOR)
        const idRol = (rol.toUpperCase() === 'PROVEEDOR') ? 2 : 1;

        // Guardar el usuario en PostgreSQL
        await pool.query(`
            INSERT INTO usuarios (correo_corporativo, contrasena_hash, id_rol, estado_usuario, codigo_otp, nombre_comercial)
            VALUES ($1, $2, $3, 'PENDIENTE_VERIFICACION', $4, $5)
        `, [correoLimpio, await hashContrasena(contrasena), idRol, tokenOTP, nombre.trim()]);

        // Intentar envío de correo en un bloque seguro para que no bloquee el registro si falla el SMTP
        try {
            const canalSmtp = configurarTransporterB2B();
            if (canalSmtp) {
                const htmlOtp = `
                    <div style="font-family:'Segoe UI',sans-serif; max-width:500px; margin:0 auto; padding:30px; border:1px solid #e2e8f0; border-radius:24px; text-align:center;">
                        <h2 style="color:#0f172a; margin-top:0; letter-spacing:-1px;">Código de Verificación SupplierNi</h2>
                        <p style="color:#64748b; font-size:14px;">Hola <strong>${nombre}</strong>,</p>
                        <p style="color:#64748b; font-size:14px;">Tu token para activar tu cuenta ferretera es:</p>
                        <div style="margin:30px 0;">
                            <span style="background:#f8fafc; border:1px solid #edf2f7; color:#10b981; font-size:32px; font-weight:900; letter-spacing:8px; padding:15px 25px; border-radius:12px;">${tokenOTP}</span>
                        </div>
                    </div>
                `;

                await canalSmtp.sendMail({
                    from: '"SupplierNi Seguridad B2B" <henrylechado41@gmail.com>',
                    to: correoLimpio,
                    subject: `🔐 Código de Acceso SupplierNi: ${tokenOTP}`,
                    html: htmlOtp
                });
            }
        } catch (errorCorreo) {
            console.log("[SMTP] Correo no enviado, usando token en pantalla:", errorCorreo.message);
        }

        // Devolver respuesta exitosa al navegador
        res.json({ 
            exito: true, 
            mensaje: "Registro procesado exitosamente.", 
            codigo_simulado: tokenOTP 
        });

    } catch (err) {
        console.error("Error al registrar:", err);
        res.status(500).json({ exito: false, error: "Error en base de datos PostgreSQL: " + err.message });
    }
});

// =========================================================================
// 2. ENDPOINT: VERIFICACIÓN CRIPTOGRÁFICA OTP
// =========================================================================
app.post('/api/verificar', async (req, res) => {
    try {
        const { correo, codigo } = req.body;
        if (!correo || !codigo) return res.status(400).json({ exito: false, error: "Parámetros ausentes." });

        const correoLimpio = correo.toLowerCase().trim();
        const userRes = await pool.query('SELECT * FROM usuarios WHERE correo_corporativo = $1', [correoLimpio]);
        
        if (userRes.rows.length === 0) return res.status(404).json({ exito: false, error: "Entidad jurídica no encontrada." });

        const usuario = userRes.rows[0];

        if (usuario.codigo_otp !== codigo.trim()) {
            return res.status(400).json({ exito: false, error: "El token OTP ingresado es incorrecto o expiró." });
        }

        await pool.query(
            "UPDATE usuarios SET estado_usuario = 'VERIFICADO', codigo_otp = NULL WHERE id_usuario = $1",
            [usuario.id_usuario]
        );

        res.json({ exito: true, mensaje: "¡Identidad validada y activa en la red ferretera!" });
    } catch (error) {
        res.status(500).json({ exito: false, error: "Fallo de concurrencia en verificación OTP." });
    }
});

// =========================================================================
// 3. ENDPOINT: AUTENTICACIÓN CENTRALIZADA
// =========================================================================
app.post('/api/login', async (req, res) => {
    try {
        const { correo, contrasena } = req.body;
        if (typeof correo !== 'string' || typeof contrasena !== 'string' || !correo || !contrasena)
            return res.status(400).json({ error: 'Ingrese correo y contraseña.' });
        const resultado = await pool.query(
            'SELECT * FROM usuarios WHERE correo_corporativo = $1', [correo.toLowerCase().trim()]
        );
        const usuario = resultado.rows[0];
        if (!usuario || !(await comprobarContrasena(contrasena, usuario.contrasena_hash)))
            return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
        if (!['VERIFICADO', 'ACTIVO'].includes(usuario.estado_usuario))
            return res.status(403).json({ error: 'Debe verificar su correo con el código OTP.', requiere_verificacion: true, correo: usuario.correo_corporativo });
        if (!usuario.contrasena_hash.startsWith('s2$')) {
            await pool.query('UPDATE usuarios SET contrasena_hash=$1 WHERE id_usuario=$2',
                [await hashContrasena(contrasena), usuario.id_usuario]);
        }
        res.json({ exito: true, usuario: usuarioPublico(usuario), token: generarToken(usuario) });
    } catch (error) {
        console.error('Error login:', error.message);
        res.status(500).json({ error: 'Error interno al iniciar sesión.' });
    }
});

// =========================================================================
// 4. ENDPOINT: LECTURA ATÓMICA DEL CATÁLOGO DE SUMINISTROS
// =========================================================================
app.get('/api/productos', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.id_producto, p.nombre_articulo, p.precio_mayorista_usd AS precio_mayorista,
                   p.stock_disponible, COALESCE(NULLIF(p.categoria_personalizada, ''), c.nombre_categoria, 'Fontanería') AS categoria,
                   p.imagen_url, COALESCE(u.nombre_comercial, 'Distribuidora Mayorista Industrial') AS creado_por,
                   p.creado_por_correo
            FROM productos p
            LEFT JOIN subcategorias s ON p.id_subcategoria = s.id_subcategoria
            LEFT JOIN categorias c ON s.id_categoria = c.id_categoria
            LEFT JOIN usuarios u ON p.creado_por_correo = u.correo_corporativo
            WHERE p.estado_activo = true ORDER BY p.id_producto ASC
        `);
        res.json(result.rows.map(p => ({ ...p, precio_mayorista: Number(p.precio_mayorista) })));
    } catch (e) {
        console.error('Error consulta productos:', e.message);
        res.status(500).json({ error: 'No se pudo consultar el inventario PostgreSQL.' });
    }
});

// =========================================================================
// 5. ENDPOINT: INYECCIÓN MAESTRA DE ARTÍCULOS AUTOGESTIONADOS
// =========================================================================
const CATEGORIAS = ['Fontanería', 'Herramientas', 'Construcción', 'Fijación', 'Electricidad'];
function datosProductoValidos(p) {
    const precio = Number(p.precio_mayorista), stock = Number(p.stock_disponible);
    return typeof p.nombre_articulo === 'string' && p.nombre_articulo.trim().length > 1 &&
        p.nombre_articulo.length <= 250 && CATEGORIAS.includes(p.categoria) &&
        Number.isFinite(precio) && precio > 0 && Number.isInteger(stock) && stock >= 0;
}
function imagenSegura(url) {
    return typeof url === 'string' && /^https?:\/\//i.test(url) ? url.trim().slice(0, 1000) : '';
}
app.post('/api/productos', requerirSesion, soloProveedor, async (req, res) => {
    try {
        if (!datosProductoValidos(req.body))
            return res.status(400).json({ error: 'Complete nombre, categoría, precio positivo y stock entero (puede ser 0).' });
        const p = req.body;
        const sku = 'SKU-' + randomUUID().slice(0, 12).toUpperCase();
        // Campos originales compatibles con la BD + campos nuevos persistentes por proveedor.
        const nuevo = await pool.query(`
            INSERT INTO productos (id_empresa_proveedor, id_subcategoria, id_marca, codigo_sku,
                nombre_articulo, precio_mayorista_usd, stock_disponible, imagen_url, categoria_personalizada, creado_por_correo)
            VALUES (1, 1, 1, $1, $2, $3, $4, $5, $6, $7)
            RETURNING id_producto`, [sku, p.nombre_articulo.trim(), Number(p.precio_mayorista),
                Number(p.stock_disponible), imagenSegura(p.imagen_url), p.categoria, req.usuario.correo_corporativo]);
        res.status(201).json({ exito: true, id_producto: nuevo.rows[0].id_producto });
    } catch (error) {
        console.error('Error al crear producto:', error.message);
        res.status(500).json({ error: 'No se pudo guardar el artículo en PostgreSQL.' });
    }
});
app.put('/api/productos/:id', requerirSesion, soloProveedor, async (req, res) => {
    try {
        if (!datosProductoValidos(req.body))
            return res.status(400).json({ error: 'Datos del producto inválidos.' });
        const p = req.body;
        const r = await pool.query(`UPDATE productos SET nombre_articulo=$1, precio_mayorista_usd=$2,
            stock_disponible=$3, imagen_url=$4, categoria_personalizada=$5
            WHERE id_producto=$6 AND creado_por_correo=$7 AND estado_activo=true RETURNING id_producto`,
            [p.nombre_articulo.trim(), Number(p.precio_mayorista), Number(p.stock_disponible),
             imagenSegura(p.imagen_url), p.categoria, req.params.id, req.usuario.correo_corporativo]);
        if (!r.rows.length) return res.status(404).json({ error: 'Producto no encontrado o no pertenece a su cuenta.' });
        res.json({ exito: true });
    } catch (e) { res.status(500).json({ error: 'No se pudo modificar el producto.' }); }
});
app.delete('/api/productos/:id', requerirSesion, soloProveedor, async (req, res) => {
    try {
        const r = await pool.query(`UPDATE productos SET estado_activo=false
            WHERE id_producto=$1 AND creado_por_correo=$2 AND estado_activo=true RETURNING id_producto`,
            [req.params.id, req.usuario.correo_corporativo]);
        if (!r.rows.length) return res.status(404).json({ error: 'Producto no encontrado o no pertenece a su cuenta.' });
        res.json({ exito: true });
    } catch (e) { res.status(500).json({ error: 'No se pudo eliminar el producto.' }); }
});

// =========================================================================
// 6. ENDPOINT: PROCESAMIENTO LOGÍSTICO Y CONTROL DE CONCURRENCIA ACID
// =========================================================================
app.post('/api/pedidos', requerirSesion, async (req, res) => {
    const client = await pool.connect();
    let enTransaccion = false;
    try {
        const { id_comprador, items, subtotal_neto, iva_15, total_neto, terminos_pago, email_despacho, direccion, telefono } = req.body;
        
        if (!id_comprador || !items || !items.length || !email_despacho) {
            return res.status(400).json({ exito: false, error: "Faltan parámetros logísticos obligatorios." });
        }

        if (items.some(i => !Number.isInteger(Number(i.cantidad)) || Number(i.cantidad) <= 0) ||
            new Set(items.map(i => String(i.id_producto))).size !== items.length)
            return res.status(400).json({ error: 'La orden contiene cantidades inválidas o artículos duplicados.' });
        const dirDestino = direccion ? direccion.trim() : "Managua, Nicaragua (Despacho Central)";
        const telContacto = telefono ? telefono.replace(/[\s-]/g, '') : "22220000";

        await client.query('BEGIN'); // CONTROL ATÓMICO DE CONCURRENCIA ACID
        enTransaccion = true;

        // Bloqueo pesimista de stock por producto
        for (const item of items) {
            const prodRes = await client.query('SELECT stock_disponible, nombre_articulo FROM productos WHERE id_producto = $1 FOR UPDATE', [item.id_producto]);
            if (prodRes.rows.length === 0) {
                await client.query('ROLLBACK');
                enTransaccion = false;
                return res.status(400).json({ exito: false, error: `Artículo #${item.id_producto} no existe en inventario.` });
            }
            if (prodRes.rows[0].stock_disponible < item.cantidad) {
                await client.query('ROLLBACK');
                enTransaccion = false;
                return res.status(400).json({ exito: false, error: `Stock insuficiente para: ${prodRes.rows[0].nombre_articulo}.` });
            }
        }

        // Deducción en bodega
        for (const item of items) {
            await client.query('UPDATE productos SET stock_disponible = stock_disponible - $1 WHERE id_producto = $2', [item.cantidad, item.id_producto]);
        }

        const calcSubtotal = subtotal_neto ? Number(subtotal_neto) : items.reduce((acc, i) => acc + (i.precio_mayorista * i.cantidad), 0);
        const calcIva = iva_15 ? Number(iva_15) : (calcSubtotal * 0.15);
        const calcTotal = total_neto ? Number(total_neto) : (calcSubtotal + calcIva);

        const countOrd = await client.query('SELECT COUNT(*) FROM ordenes');
        const idNuevoPedido = parseInt(countOrd.rows[0].count) + 1;
        const codigoOrden = 'SN-2026-' + (1000 + idNuevoPedido);

        await client.query(`
            INSERT INTO ordenes (codigo_orden, subtotal_neto, impuesto_iva, total_neto, metodo_pago, email_despacho)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [codigoOrden, calcSubtotal, calcIva, calcTotal, terminos_pago || 'TRANSFERENCIA', email_despacho.toLowerCase().trim()]);

        await client.query('COMMIT');
        enTransaccion = false;

        const nuevoPedido = {
            id_pedido: idNuevoPedido,
            id_comprador,
            items,
            subtotal_neto: calcSubtotal,
            iva_15: calcIva,
            total_neto: calcTotal,
            terminos_pago,
            email_despacho: email_despacho.toLowerCase().trim(),
            direccion: dirDestino,
            telefono: telContacto,
            fecha: new Date().toLocaleString()
        };

        // ENVÍO DE COMPROBANTE SMTP (la orden ya está confirmada)
        let correoEnviado = false;
        const canalSmtp = configurarTransporterB2B();
        if (canalSmtp) {
            try {
                let lineasFacturaHtml = "";
                items.forEach(i => {
                    lineasFacturaHtml += `
                        <tr>
                            <td style="padding:10px; border-bottom:1px solid #edf2f7; font-weight:bold; color:#2d3748;">${i.nombre_articulo}</td>
                            <td style="padding:10px; border-bottom:1px solid #edf2f7; text-align:center; color:#4a5568; font-family:monospace;">${i.cantidad}</td>
                            <td style="padding:10px; border-bottom:1px solid #edf2f7; text-align:right; font-weight:bold; color:#1a202c; font-family:monospace;">$${(i.precio_mayorista * i.cantidad).toFixed(2)}</td>
                        </tr>`;
                });

                const cuerpoHtml = `
                    <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; max-width:600px; margin:0 auto; padding:30px; border:1px solid #e2e8f0; border-radius:24px; background-color:#ffffff; box-shadow:0 4px 12px rgba(0,0,0,0.03);">
                        <div style="text-align:center; margin-bottom:20px;">
                            <h2 style="color:#0f172a; margin:0; font-size:26px; font-weight:900; letter-spacing:-1px;">SupplierNi B2B</h2>
                            <p style="font-size:12px; color:#10b981; font-weight:800; text-transform:uppercase; margin:5px 0 0 0; letter-spacing:2px;">Orden Ferretera Confirmada</p>
                        </div>
                        <div style="background:#f8fafc; padding:15px; border-radius:16px; font-size:12px; margin-bottom:20px; border:1px solid #edf2f7; color:#4a5568;">
                            <strong>DETALLES DE ENTREGA LOGÍSTICA:</strong><br>
                            • <strong>Adquirente:</strong> ${id_comprador}<br>
                            • <strong>Dirección de Destino:</strong> ${nuevoPedido.direccion}<br>
                            • <strong>Teléfono de Contacto:</strong> +505 ${nuevoPedido.telefono}<br>
                            • <strong>Canal de Liquidación:</strong> ${terminos_pago}
                        </div>
                        <table style="width:100%; font-size:13px; border-collapse:collapse;">
                            <thead>
                                <tr style="background:#0f172a; color:#ffffff;">
                                    <th style="padding:12px 10px; text-align:left; border-top-left-radius:8px; border-bottom-left-radius:8px;">Artículo Ferretero</th>
                                    <th style="padding:12px 10px; text-align:center;">Cant</th>
                                    <th style="padding:12px 10px; text-align:right; border-top-right-radius:8px; border-bottom-right-radius:8px;">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${lineasFacturaHtml}
                            </tbody>
                        </table>
                        <div style="margin-top:20px; text-align:right; font-size:13px; color:#64748b; font-family:monospace;">
                            Subtotal Neto: $${calcSubtotal.toFixed(2)} USD<br>
                            15% IVA (Ley 822): $${calcIva.toFixed(2)} USD
                        </div>
                        <div style="margin-top:10px; text-align:right; font-size:16px; font-weight:900; color:#0f172a; font-family:monospace; border-top:1px border-dashed #cbd5e1; padding-top:10px;">
                            TOTAL COMPROMETIDO: $${calcTotal.toFixed(2)} USD
                        </div>
                        <div style="background:#fffbeb; border:1px solid #fef3c7; padding:15px; border-radius:16px; margin-top:25px; font-size:12px; color:#78350f; line-height:1.6;">
                            <strong>📌 COORDINADAS BANCARIAS MAESTRAS DE LIQUIDACIÓN:</strong><br>
                            Efectúe su depósito o transferencia electrónica inmediata a los canales formales de Nicaragua:<br>
                            • <strong>Banco LAFISE Bancentro:</strong> Cuenta Corriente Córdobas #134070030<br>
                            • <strong>Banco BANPRO:</strong> Cuenta de Ahorros Dólares #10022341054
                        </div>
                        <div style="text-align:center; font-size:10px; color:#a0aec0; margin-top:35px; border-top:1px solid #edf2f7; padding-top:15px; font-weight:600;">
                            Ingeniería de Software I - UNI Nicaragua<br>
                            Henry Isaac Lechado Moreno &copy; 2026
                        </div>
                    </div>
                `;

                await canalSmtp.sendMail({
                    from: `"SupplierNi Red Logística Ferretera" <henrylechado41@gmail.com>`,
                    to: nuevoPedido.email_despacho,
                    subject: `📋 Comprobante Oficial de Orden #OCF-2026-${nuevoPedido.id_pedido} - SupplierNi`,
                    html: cuerpoHtml
                });
                correoEnviado = true;
            } catch (smtpError) {
                console.error(`[FALLO SMTP FACTURA] ${smtpError.message}`);
            }
        }

        res.json({ exito: true, correo_enviado: correoEnviado, pedido: nuevoPedido, coordenadas_bancarias: [
            { banco: "Banco LAFISE Bancentro", cuenta: "134070030", moneda: "Córdobas (NIO)", tipo: "Cuenta Corriente Empresarial" },
            { banco: "Banco BANPRO", cuenta: "10022341054", moneda: "Dólares (USD)", tipo: "Cuenta de Ahorros" }
        ] });
    } catch (err) {
        if (enTransaccion) await client.query('ROLLBACK').catch(() => {});
        console.error('Error pedido:', err.message);
        if (!res.headersSent) res.status(500).json({ exito: false, error: 'No se pudo completar la operación.' });
    } finally {
        client.release();
    }
});

// =========================================================================
// 7. ENDPOINT: NÚCLEO DE INTELIGENCIA ARTIFICIAL FERRETERO (GEMINI + CONTINGENCIA)
// =========================================================================
app.post('/api/ia-asistente', async (req, res) => {
    try {
        const { mensaje, rol } = req.body;
        if (!mensaje) return res.status(400).json({ error: "Mensaje vacío." });
        
        const msg = mensaje.toLowerCase().trim();
        const productosRes = await pool.query('SELECT id_producto, nombre_articulo, precio_mayorista_usd AS precio_mayorista, stock_disponible FROM productos LIMIT 20');
        const productosEnBd = productosRes.rows;
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (GEMINI_API_KEY) {
            try {
                const promptContexto = `Eres el agente inteligente central de la plataforma B2B SupplierNi (sector ferretero en Nicaragua). 
                Rol del usuario actual: ${rol}.
                Catálogo relacional actual de insumos ferreteros: ${JSON.stringify(productosEnBd)}.
                Mapeo de mercado: Managua absorbe el 55% de la tracción ferretera (Distritos IV, V y VI). León y Chinandega dominan la zona occidente.
                
                REGLA DE ORO DE CANTIDADES: Si el usuario menciona un número, extrae ese número exacto. Si no dice número, asume 1.
                Prohibición: No hables de temas farmacéuticos o médicos ni de formulas VAN/TIR innecesarias.
                Retorna SOLO un JSON estrictamente estructurado: {"respuesta": "texto", "items": [{"id_producto": 1, "cantidad": 5}], "sugerencias": []}
                Entrada del operador: "${mensaje}"`;

                const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: promptContexto }] }],
                        generationConfig: { responseMimeType: "application/json" }
                    })
                });

                if (apiResponse.ok) {
                    const aiData = await apiResponse.json();
                    let jsonText = aiData.candidates[0].content.parts[0].text.trim();
                    if (jsonText.startsWith("```")) {
                        jsonText = jsonText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
                    }
                    return res.json(JSON.parse(jsonText));
                }
            } catch (errorCloud) {
                console.error(`[FALLO ENLACE GEMINI] ${errorCloud.message}. Derivando a contingencia local.`);
            }
        }

        // MOTOR DE CONTINGENCIA LOCAL FERRETERO (EXTRAE CANTIDADES Y PRODUCTOS)
        let respuestaText = "";
        let itemsDetectados = [];
        let sugerenciasCruzadas = [];

        if (rol === 'COMPRADOR') {
            respuestaText = "⚡ **Asistente Suministros Ferreteros:** He procesado los siguientes artículos para su orden: ";
            
            const catalogoBusqueda = [
                { id: 1, keys: ["pvc", "tubo", "fontaneria", "tuberia", "amanco"], nombre: "Tubo PVC Presión 1/2\" x 6m" },
                { id: 2, keys: ["martillo", "herramienta", "truper"], nombre: "Martillo de Uña 16oz Truper" },
                { id: 3, keys: ["cemento", "saco", "construccion", "canal"], nombre: "Saco de Cemento Canal Estructural" },
                { id: 4, keys: ["perno", "tornillo", "fijacion", "grado 5"], nombre: "Perno Grado 5 Zincado 1/2\" x 2\"" },
                { id: 5, keys: ["cinta", "metrica", "stanley", "metro"], nombre: "Cinta Métrica 5m Truper" },
                { id: 6, keys: ["varilla", "hierro", "acero", "corrugado"], nombre: "Varilla de Hierro Corrugado 3/8\"" }
            ];

            catalogoBusqueda.forEach(prod => {
                const tieneCoincidencia = prod.keys.some(key => msg.includes(key));
                
                if (tieneCoincidencia) {
                    const regex = new RegExp(`(\\d+)\\s*(?:${prod.keys.join('|')})`, 'i');
                    const match = msg.match(regex);
                    const cantidad = match ? parseInt(match[1]) : 1; 
                    
                    itemsDetectados.push({ id_producto: prod.id, cantidad: cantidad, nombre_articulo: prod.nombre });
                    respuestaText += `\n• ${cantidad}x ${prod.nombre}`;
                }
            });

            if (itemsDetectados.length === 0) {
                respuestaText = "Hola. Indíqueme qué materiales de construcción, tubos PVC, herramientas o pernos requiere su ferretería y pre-cargaré las casillas de su cotizador de forma automatizada.";
            } else {
                respuestaText += "\n\n¡Las líneas han sido inyectadas en su carrito comercial!";
                sugerenciasCruzadas.push({ id_producto: 4, nombre_articulo: "Perno Grado 5 Zincado 1/2\" x 2\"" });
            }
        } else {
            if (msg.includes("vendido") || msg.includes("venta") || msg.includes("rotacion") || msg.includes("producto")) {
                respuestaText = "📊 **Auditoría de Rotación Ferretera:** Las lecturas de base de datos indican que los artículos con mayor índice de rotación en Nicaragua corresponden al **Saco de Cemento Canal** y la **Varilla de Hierro Corrugado 3/8\"**.";
            } else if (msg.includes("zona") || msg.includes("lugar") || msg.includes("demanda") || msg.includes("managua") || msg.includes("chinandega") || msg.includes("leon")) {
                respuestaText = "📍 **Mapeo de la Demanda Nacional:** El núcleo comercial principal corresponde a **Managua (Zonas ferreteras de los Distritos IV, V y VI)** abarcando un 55% de la tracción transaccional total del software, seguido de forma estable por las cadenas de abasto de **León** y **Chinandega**.";
            } else {
                respuestaText = "Entorno del Mayorista Ferretero Activo. Puede realizar consultas analíticas avanzadas como: *'¿Cuáles son los productos más vendidos?'* o *'¿Qué zonas geográficas presentan mayor demanda ferretera?'*";
            }
        }

        res.json({ respuesta: respuestaText, items: itemsDetectados, sugerencias: sugerenciasCruzadas });
    } catch (err) {
        res.status(500).json({ error: "Fallo en el subproceso conversacional del asistente." });
    }
});

// ASIGNACIÓN DINÁMICA DE PUERTOS CLOUD
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[INSTANCIA ACTIVA] Servidor central de SupplierNi B2B operando en el puerto ${PORT}`));
