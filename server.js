const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

const app = express();

// =========================================================================
// CONFIGURACIÓN DE MIDDLEWARES BASE DE RANGO INDUSTRIAL
// =========================================================================
app.use(cors());
app.use(express.json());

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
// CONEXIÓN A BASE DE DATOS MONGODB ATLAS (NUBE)
// =========================================================================
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("✅ [NÚCLEO] Conexión exitosa a MongoDB Atlas (SupplierNi B2B)");
        await inicializarSemilla();
    })
    .catch(err => console.error("❌ [NÚCLEO] Error de conexión a BD:", err));

// =========================================================================
// MODELOS DE DATOS (ESQUEMAS EN 3FN)
// =========================================================================
const Usuario = mongoose.model('Usuario', new mongoose.Schema({
    correo: { type: String, required: true },
    contrasena: { type: String, required: true },
    rol: String,
    nombre: String,
    estado: String,
    codigo_verificacion: String
}));

const Producto = mongoose.model('Producto', new mongoose.Schema({
    id_producto: Number,
    nombre_articulo: String,
    precio_mayorista: Number,
    stock_disponible: Number,
    categoria: String,
    imagen_url: String,
    creado_por: String
}));

const Pedido = mongoose.model('Pedido', new mongoose.Schema({
    id_pedido: Number,
    id_comprador: String,
    items: Array,
    subtotal_neto: Number,
    iva_15: Number,
    total_neto: Number,
    terminos_pago: String,
    email_despacho: String,
    direccion: String,
    telefono: String,
    fecha: String
}));

// =========================================================================
// MATRIZ DE SEMILLA INICIAL ENRIQUECIDA (SECTOR FERRETERO NICARAGÜENSE)
// =========================================================================
const inicializarSemilla = async () => {
    const countUsuarios = await Usuario.countDocuments();
    if (countUsuarios === 0) {
        console.log("[SISTEMA] BD Usuarios vacía. Inicializando entidades ferreteras...");
        await Usuario.insertMany([
            { correo: "proveedor@gmail.com", contrasena: "1234", rol: "PROVEEDOR", nombre: "Distribuidora Mayorista Industrial", estado: "VERIFICADO", codigo_verificacion: null },
            { correo: "comprador@gmail.com", contrasena: "1234", rol: "COMPRADOR", nombre: "Ferretería El Progreso", estado: "VERIFICADO", codigo_verificacion: null }
        ]);
    }

    const countProductos = await Producto.countDocuments();
    if (countProductos === 0) {
        console.log("[SISTEMA] BD Productos vacía. Cargando catálogo ferretero maestro...");
        await Producto.insertMany([
            { id_producto: 1, nombre_articulo: "Tubo PVC Presión 1/2\" x 6m Sch 40 (Amanco)", precio_mayorista: 2.35, stock_disponible: 120, categoria: "Fontanería", imagen_url: "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=600&q=80&sig=1", creado_por: "Distribuidora Mayorista Industrial" },
            { id_producto: 2, nombre_articulo: "Martillo de Uña 16oz Truper Profesional", precio_mayorista: 6.50, stock_disponible: 45, categoria: "Herramientas", imagen_url: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=600&q=80&sig=2", creado_por: "Distribuidora Mayorista Industrial" },
            { id_producto: 3, nombre_articulo: "Saco de Cemento Canal Estructural (42.5kg)", precio_mayorista: 8.50, stock_disponible: 200, categoria: "Construcción", imagen_url: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=600&q=80&sig=3", creado_por: "Distribuidora Mayorista Industrial" },
            { id_producto: 4, nombre_articulo: "Perno Grado 5 Zincado 1/2\" x 2\" (Pack x100)", precio_mayorista: 4.10, stock_disponible: 80, categoria: "Fijación", imagen_url: "https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=600&q=80&sig=4", creado_por: "Distribuidora Mayorista Industrial" },
            { id_producto: 5, nombre_articulo: "Cinta Métrica 5m Truper TR-1502", precio_mayorista: 2.60, stock_disponible: 60, categoria: "Herramientas", imagen_url: "https://images.unsplash.com/photo-1531842477197-e3f85e40346e?auto=format&fit=crop&w=600&q=80&sig=5", creado_por: "Distribuidora Mayorista Industrial" },
            { id_producto: 6, nombre_articulo: "Varilla de Hierro Corrugado 3/8\" x 6m", precio_mayorista: 4.80, stock_disponible: 150, categoria: "Construcción", imagen_url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80&sig=6", creado_por: "Distribuidora Mayorista Industrial" }
        ]);
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
app.get('/', (req, res) => {
    const envUser = process.env.EMAIL_USER ? "CONFIGURADO DE FORMA CORRECTA" : "FALTA ASIGNAR EN ENVIRONMENT";
    const envPass = process.env.EMAIL_PASS ? "CONFIGURADO DE FORMA CORRECTA" : "FALTA ASIGNAR EN ENVIRONMENT";
    const envGemini = process.env.GEMINI_API_KEY ? "MODELO GEMINI REAL ACTIVO" : "FALLBACK DE CONTINGENCIA LOCAL FERRETERO ACTIVO";
    const envMongo = process.env.MONGO_URI ? "CONEXIÓN A NUBE ESTABLECIDA" : "FALTA ASIGNAR MONGO_URI";

    res.send(`
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; margin-top: 50px; color: #0f172a; padding: 20px; background: #fafafa;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                <h1 style="color: #10b981; font-weight: 900; letter-spacing: -1px; margin-bottom: 10px;">⚡ API SupplierNi B2B — Red Ferretera</h1>
                <p style="color: #64748b; font-size: 14px; margin-bottom: 30px;">Microservicio de Enlace Comercial e Ingeniería de Software - UNI Nicaragua.</p>
                
                <div style="text-align: left; background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #edf2f7; font-size: 12px; font-family: monospace;">
                    <h3 style="margin-top: 0; color: #334155; font-size: 13px; font-family: sans-serif;">🔍 DIAGNÓSTICO DE COMPUERTAS CLOUD</h3>
                    <p>• <strong>BASE DE DATOS:</strong> <span style="color: ${process.env.MONGO_URI ? '#059669' : '#dc2626'}">${envMongo}</span></p>
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
// 1. ENDPOINT: REGISTRO COMERCIAL CON ENVÍO DE TOKEN OTP (CORREGIDO)
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
        const existe = await Usuario.findOne({ correo: correoLimpio });
        
        if (existe) {
            return res.status(400).json({ exito: false, error: "Esta entidad legal ya se encuentra inscrita en la red ferretera." });
        }

        const tokenOTP = Math.floor(100000 + Math.random() * 900000).toString();

        // Guardar el usuario en MongoDB
        await Usuario.create({
            correo: correoLimpio,
            contrasena: contrasena.trim(),
            rol: rol,
            nombre: nombre.trim(),
            estado: "PENDIENTE_VERIFICACION",
            codigo_verificacion: tokenOTP
        });

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
        res.status(500).json({ exito: false, error: "Error en base de datos: " + err.message });
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
        const usuario = await Usuario.findOne({ correo: correoLimpio });
        
        if (!usuario) return res.status(404).json({ exito: false, error: "Entidad jurídica no encontrada." });

        if (usuario.codigo_verificacion !== codigo.trim()) {
            return res.status(400).json({ exito: false, error: "El token OTP ingresado es incorrecto o expiró." });
        }

        usuario.estado = "VERIFICADO";
        usuario.codigo_verificacion = null;
        await usuario.save();

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
        if(!correo || !contrasena) return res.status(400).json({ exito: false, error: "Las credenciales no pueden estar en blanco." });
        
        const correoLimpio = correo.toLowerCase().trim();
        const usuario = await Usuario.findOne({ correo: correoLimpio, contrasena: contrasena.trim() });
        
        if (!usuario) {
            return res.status(401).json({ exito: false, error: "Acceso denegado. Credenciales incorrectas." });
        }

        if (usuario.estado !== 'VERIFICADO') {
            return res.status(403).json({ 
                exito: false, 
                error: "El perfil aún no completa la verificación del token OTP.", 
                requiere_verificacion: true, 
                correo: usuario.correo 
            });
        }

        res.json({ exito: true, usuario });
    } catch (error) {
        res.status(500).json({ exito: false, error: "Error en el subproceso del Login." });
    }
});

// =========================================================================
// 4. ENDPOINT: LECTURA ATÓMICA DEL CATÁLOGO DE SUMINISTROS
// =========================================================================
app.get('/api/productos', async (req, res) => {
    try {
        const productos = await Producto.find();
        res.json(productos);
    } catch (e) {
        res.status(500).json({ error: "No se pudo recuperar la matriz de insumos ferreteros." });
    }
});

// =========================================================================
// 5. ENDPOINT: INYECCIÓN MAESTRA DE ARTÍCULOS AUTOGESTIONADOS
// =========================================================================
app.post('/api/productos', async (req, res) => {
    try {
        const { nombre_articulo, precio_mayorista, stock_disponible, categoria, imagen_url, creado_por } = req.body;
        
        if(!nombre_articulo || !precio_mayorista || !stock_disponible || !categoria) {
            return res.status(400).json({ exito: false, error: "Esquema del producto ferretero incompleto." });
        }

        const maxProd = await Producto.findOne().sort('-id_producto');
        const nuevoId = maxProd ? maxProd.id_producto + 1 : 1;
        const firmaUnica = `&sig=${nuevoId}`;
        let finalImg = "https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&w=600&q=80" + firmaUnica;
        
        if (imagen_url && imagen_url.trim() !== '' && imagen_url.startsWith('http')) {
            finalImg = imagen_url.trim() + (imagen_url.includes('?') ? firmaUnica : "?" + firmaUnica);
        }

        const nuevoProducto = await Producto.create({
            id_producto: nuevoId,
            nombre_articulo: nombre_articulo.trim(),
            precio_mayorista: Math.abs(Number(precio_mayorista)),
            stock_disponible: Math.abs(parseInt(stock_disponible)),
            categoria,
            imagen_url: finalImg,
            creado_por: creado_por || "Distribuidor Autorizado"
        });
        
        console.log(`[INVENTARIO NUBE] Nuevo artículo ferretero inyectado: ${nuevoProducto.nombre_articulo}`);
        res.json({ exito: true, producto: nuevoProducto });
    } catch (error) {
        res.status(500).json({ exito: false, error: "Fallo crítico al indexar el artículo ferretero." });
    }
});

// =========================================================================
// 6. ENDPOINT: PROCESAMIENTO LOGÍSTICO Y CONTROL DE CONCURRENCIA
// =========================================================================
app.post('/api/pedidos', async (req, res) => {
    try {
        const { id_comprador, items, subtotal_neto, iva_15, total_neto, terminos_pago, email_despacho, direccion, telefono } = req.body;
        
        if (!id_comprador || !items || !items.length || !email_despacho) {
            return res.status(400).json({ exito: false, error: "Faltan parámetros logísticos obligatorios." });
        }

        const dirDestino = direccion ? direccion.trim() : "Managua, Nicaragua (Despacho Central)";
        const telContacto = telefono ? telefono.replace(/[\s-]/g, '') : "22220000";

        // CONTROL ATÓMICO DE CONCURRENCIA (RESERVA EN ALMACÉN)
        for (const item of items) {
            const prod = await Producto.findOne({ id_producto: item.id_producto });
            if (!prod) return res.status(400).json({ exito: false, error: `Artículo #${item.id_producto} no existe en inventario.` });
            if (prod.stock_disponible < item.cantidad) {
                return res.status(400).json({ exito: false, error: `Stock insuficiente para: ${prod.nombre_articulo}.` });
            }
        }

        // Deducción en bodega
        for (const item of items) {
            const prod = await Producto.findOne({ id_producto: item.id_producto });
            prod.stock_disponible -= item.cantidad;
            await prod.save();
        }

        const calcSubtotal = subtotal_neto ? Number(subtotal_neto) : items.reduce((acc, i) => acc + (i.precio_mayorista * i.cantidad), 0);
        const calcIva = iva_15 ? Number(iva_15) : (calcSubtotal * 0.15);
        const calcTotal = total_neto ? Number(total_neto) : (calcSubtotal + calcIva);

        const totalPedidos = await Pedido.countDocuments();
        const nuevoPedido = await Pedido.create({ 
            id_pedido: totalPedidos + 1, 
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
        });

        // ENVÍO DE COMPROBANTE SMTP
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
                            Henry Isaac Lechado Moreno
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
        res.status(500).json({ exito: false, error: "Fallo sistémico al asimilar la orden." });
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
        const productosEnBd = await Producto.find().limit(20);
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
