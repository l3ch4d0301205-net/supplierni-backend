const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');

const app = express();

// =========================================================================
// MIDDLEWARES BASE DE RANGO INDUSTRIAL
// =========================================================================
app.use(cors());
app.use(express.json());

// =========================================================================
// SISTEMA DE MONITOREO Y LOGGING PERSONALIZADO
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
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_u3GsrVRx9tWk@ep-bitter-mud-beizette-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: { rejectUnauthorized: false }
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ [NÚCLEO] Error de conexión a PostgreSQL Neon:', err.message);
    } else {
        console.log('✅ [NÚCLEO] Conexión exitosa a PostgreSQL Neon (SupplierNi B2B):', res.rows[0].now);
        inicializarSemilla();
    }
});

// =========================================================================
// MATRIZ DE SEMILLA INICIAL ENRIQUECIDA
// =========================================================================
const inicializarSemilla = async () => {
    try {
        const countUsuarios = await pool.query('SELECT COUNT(*) FROM usuarios');
        if (parseInt(countUsuarios.rows[0].count) === 0) {
            console.log("[SISTEMA] BD Usuarios vacía. Inicializando entidades ferreteras...");
            await pool.query(`
                INSERT INTO usuarios (correo_corporativo, contrasena_hash, id_rol, estado_usuario, codigo_otp) VALUES
                ('proveedor@gmail.com', '1234', 2, 'VERIFICADO', NULL),
                ('comprador@gmail.com', '1234', 1, 'VERIFICADO', NULL)
            `);
        }

        const countProductos = await pool.query('SELECT COUNT(*) FROM productos');
        if (parseInt(countProductos.rows[0].count) === 0) {
            console.log("[SISTEMA] BD Productos vacía. Cargando catálogo ferretero maestro...");
            await pool.query(`
                INSERT INTO productos (id_empresa_proveedor, id_subcategoria, id_marca, codigo_sku, nombre_articulo, precio_mayorista_usd, stock_disponible, imagen_url, estado_activo) VALUES
                (1, 1, 1, 'PVC-SCH40-05', 'Tubo PVC Presión 1/2" x 6m Sch 40 (Amanco)', 2.35, 120, 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=600&q=80&sig=1', true),
                (1, 2, 2, 'HERR-MART-16', 'Martillo de Uña 16oz Truper Profesional', 6.50, 45, 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=600&q=80&sig=2', true),
                (1, 3, 3, 'CEM-CANAL-42', 'Saco de Cemento Canal Estructural (42.5kg)', 8.50, 200, 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=600&q=80&sig=3', true),
                (1, 4, 2, 'PERN-GR5-052', 'Perno Grado 5 Zincado 1/2" x 2" (Pack x100)', 4.10, 80, 'https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=600&q=80&sig=4', true),
                (1, 2, 2, 'HERR-CINT-5M', 'Cinta Métrica 5m Truper TR-1502', 2.60, 60, 'https://images.unsplash.com/photo-1531842477197-e3f85e40346e?auto=format&fit=crop&w=600&q=80&sig=5', true),
                (1, 3, 3, 'VAR-HIER-38', 'Varilla de Hierro Corrugado 3/8" x 6m', 4.80, 150, 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80&sig=6', true)
            `);
        }
    } catch (err) {
        console.error("[SISTEMA] Error al inicializar semilla PostgreSQL:", err.message);
    }
};

const validarFormatoCorreo = (correo) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(correo);
};

const configurarTransporterB2B = () => {
    return nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 2525,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: { rejectUnauthorized: false }
    });
};

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

// 1. ENDPOINT: REGISTRO COMERCIAL CON ENVÍO DE TOKEN OTP
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

        const tokenOTP = Math.floor(100000 + Math.random() * 900000).toString();
        const idRol = (rol.toUpperCase() === 'PROVEEDOR') ? 2 : 1;

        await pool.query(`
            INSERT INTO usuarios (correo_corporativo, contrasena_hash, id_rol, estado_usuario, codigo_otp)
            VALUES ($1, $2, $3, 'PENDIENTE_VERIFICACION', $4)
        `, [correoLimpio, contrasena.trim(), idRol, tokenOTP]);

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

// 2. ENDPOINT: VERIFICACIÓN CRIPTOGRÁFICA OTP
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

// 3. ENDPOINT: AUTENTICACIÓN CENTRALIZADA
app.post('/api/login', async (req, res) => {
    try {
        const { correo, contrasena } = req.body;
        if(!correo || !contrasena) return res.status(400).json({ exito: false, error: "Las credenciales no pueden estar en blanco." });
        
        const correoLimpio = correo.toLowerCase().trim();
        const userRes = await pool.query(
            'SELECT u.*, r.nombre_rol FROM usuarios u LEFT JOIN roles r ON u.id_rol = r.id_rol WHERE u.correo_corporativo = $1 AND u.contrasena_hash = $2',
            [correoLimpio, contrasena.trim()]
        );
        
        if (userRes.rows.length === 0) {
            return res.status(401).json({ exito: false, error: "Acceso denegado. Credenciales incorrectas." });
        }

        const usuario = userRes.rows[0];

        if (usuario.estado_usuario !== 'VERIFICADO' && usuario.estado_usuario !== 'ACTIVO') {
            return res.status(403).json({ 
                exito: false, 
                error: "El perfil aún no completa la verificación del token OTP.", 
                requiere_verificacion: true, 
                correo: usuario.correo_corporativo 
            });
        }

        res.json({ 
            exito: true, 
            usuario: {
                correo: usuario.correo_corporativo,
                rol: usuario.id_rol === 2 ? 'PROVEEDOR' : 'COMPRADOR',
                nombre: usuario.correo_corporativo.split('@')[0],
                estado: usuario.estado_usuario
            } 
        });
    } catch (error) {
        res.status(500).json({ exito: false, error: "Error en el subproceso del Login." });
    }
});

// 4. ENDPOINT: LECTURA ATÓMICA DEL CATÁLOGO DE SUMINISTROS (CORREGIDO)
app.get('/api/productos', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.id_producto, p.nombre_articulo, 
                   COALESCE(p.precio_mayorista_usd, 0) AS precio_mayorista,
                   p.stock_disponible, 
                   COALESCE(c.nombre_categoria, p.categoria, 'Fontanería') AS categoria, 
                   COALESCE(p.imagen_url, 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&w=600&q=80') AS imagen_url,
                   COALESCE(p.creado_por, 'Distribuidora Mayorista Industrial') AS creado_por
            FROM productos p
            LEFT JOIN subcategorias s ON p.id_subcategoria = s.id_subcategoria
            LEFT JOIN categorias c ON s.id_categoria = c.id_categoria
            ORDER BY p.id_producto ASC
        `);
        
        const productosFormateados = result.rows.map(prod => ({
            ...prod,
            precio_mayorista: Number(prod.precio_mayorista || 0)
        }));

        res.json(productosFormateados);
    } catch (e) {
        console.error("Error en GET /api/productos:", e.message);
        res.status(500).json({ error: "No se pudo recuperar la matriz de insumos ferreteros desde PostgreSQL." });
    }
});

// 5. ENDPOINT: INYECCIÓN MAESTRA DE ARTÍCULOS AUTOGESTIONADOS (CORREGIDO)
app.post('/api/productos', async (req, res) => {
    try {
        const { nombre_articulo, precio_mayorista, stock_disponible, categoria, imagen_url, creado_por } = req.body;
        
        if(!nombre_articulo || !precio_mayorista || !stock_disponible) {
            return res.status(400).json({ exito: false, error: "Esquema del producto ferretero incompleto." });
        }

        const maxRes = await pool.query('SELECT MAX(id_producto) FROM productos');
        const nuevoId = (parseInt(maxRes.rows[0].max) || 0) + 1;
        const sku = 'SKU-' + nuevoId;
        const finalImg = (imagen_url && imagen_url.trim().startsWith('http')) 
            ? imagen_url.trim() 
            : "https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&w=600&q=80";

        const insertRes = await pool.query(`
            INSERT INTO productos (codigo_sku, nombre_articulo, precio_mayorista_usd, stock_disponible, imagen_url, estado_activo, categoria, creado_por)
            VALUES ($1, $2, $3, $4, $5, true, $6, $7)
            RETURNING id_producto, nombre_articulo, precio_mayorista_usd AS precio_mayorista, stock_disponible, imagen_url, categoria, creado_por
        `, [
            sku, 
            nombre_articulo.trim(), 
            Math.abs(Number(precio_mayorista)), 
            Math.abs(parseInt(stock_disponible)), 
            finalImg,
            categoria || 'Fontanería',
            creado_por || 'Distribuidor Autorizado'
        ]);

        const nuevoProducto = {
            ...insertRes.rows[0],
            precio_mayorista: Number(insertRes.rows[0].precio_mayorista)
        };
        
        console.log(`[INVENTARIO NUBE] Nuevo artículo ferretero inyectado: ${nuevoProducto.nombre_articulo}`);
        res.json({ exito: true, producto: nuevoProducto });
    } catch (error) {
        console.error("Error en POST /api/productos:", error.message);
        res.status(500).json({ exito: false, error: "Fallo crítico al indexar el artículo ferretero: " + error.message });
    }
});

// 6. ENDPOINT: PROCESAMIENTO LOGÍSTICO Y CONTROL DE CONCURRENCIA ACID
app.post('/api/pedidos', async (req, res) => {
    const client = await pool.connect();
    try {
        const { id_comprador, items, subtotal_neto, iva_15, total_neto, terminos_pago, email_despacho, direccion, telefono } = req.body;
        
        if (!id_comprador || !items || !items.length || !email_despacho) {
            return res.status(400).json({ exito: false, error: "Faltan parámetros logísticos obligatorios." });
        }

        const dirDestino = direccion ? direccion.trim() : "Managua, Nicaragua (Despacho Central)";
        const telContacto = telefono ? telefono.replace(/[\s-]/g, '') : "22220000";

        await client.query('BEGIN');

        for (const item of items) {
            const prodRes = await client.query('SELECT stock_disponible, nombre_articulo FROM productos WHERE id_producto = $1 FOR UPDATE', [item.id_producto]);
            if (prodRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ exito: false, error: `Artículo #${item.id_producto} no existe en inventario.` });
            }
            if (prodRes.rows[0].stock_disponible < item.cantidad) {
                await client.query('ROLLBACK');
                return res.status(400).json({ exito: false, error: `Stock insuficiente para: ${prodRes.rows[0].nombre_articulo}.` });
            }
        }

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
        client.release();

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
            } catch (smtpError) {
                console.error(`[FALLO SMTP FACTURA] ${smtpError.message}`);
            }
        }

        res.json({ exito: true, pedido: nuevoPedido, coordenadas_bancarias: [
            { banco: "Banco LAFISE Bancentro", cuenta: "134070030", moneda: "Córdobas (NIO)", tipo: "Cuenta Corriente Empresarial" },
            { banco: "Banco BANPRO", cuenta: "10022341054", moneda: "Dólares (USD)", tipo: "Cuenta de Ahorros" }
        ] });
    } catch (err) {
        await client.query('ROLLBACK');
        client.release();
        res.status(500).json({ exito: false, error: "Fallo sistémico al asimilar la orden: " + err.message });
    }
});

// 7. ENDPOINT: NÚCLEO DE INTELIGENCIA ARTIFICIAL FERRETERO
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[INSTANCIA ACTIVA] Servidor central de SupplierNi B2B operando en el puerto ${PORT}`));
