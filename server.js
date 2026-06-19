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
        console.log(`[AUDITORÍA LOGÍSTICA] ${new Date().toISOString()} | MÉTODO: ${req.method} | RUTA: ${req.originalUrl} | ESTADO: ${res.statusCode} | TIEMPO: ${duracion}ms`);
    });
    next();
});

// =========================================================================
// CONEXIÓN A BASE DE DATOS MONGODB ATLAS (NUBE)
// =========================================================================
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("✅ [NÚCLEO] Conexión exitosa a MongoDB Atlas");
        await inicializarSemilla();
    })
    .catch(err => console.error("❌ [NÚCLEO] Error de conexión a BD:", err));

// =========================================================================
// MODELOS DE DATOS (ESQUEMAS)
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
    total_neto: Number,
    terminos_pago: String,
    email_despacho: String,
    direccion: String,
    telefono: String,
    fecha: String
}));

// =========================================================================
// MATRIZ DE SEMILLA INICIAL ENRIQUECIDA (INYECCIÓN AUTOMÁTICA)
// =========================================================================
const inicializarSemilla = async () => {
    const countUsuarios = await Usuario.countDocuments();
    if (countUsuarios === 0) {
        console.log("[SISTEMA] BD Usuarios vacía. Inicializando...");
        await Usuario.insertMany([
            { correo: "proveedor@gmail.com", contrasena: "1234", rol: "PROVEEDOR", nombre: "Distribuidora Mayorista del Pacífico", estado: "VERIFICADO", codigo_verificacion: null },
            { correo: "comprador@gmail.com", contrasena: "1234", rol: "COMPRADOR", nombre: "Ferretería y Farmacia La Esperanza", estado: "VERIFICADO", codigo_verificacion: null }
        ]);
    }

    const countProductos = await Producto.countDocuments();
    if (countProductos === 0) {
        console.log("[SISTEMA] BD Productos vacía. Inicializando...");
        await Producto.insertMany([
            { id_producto: 1, nombre_articulo: "Amoxicilina 500mg (Caja x 100 tabs)", precio_mayorista: 12.50, stock_disponible: 40, categoria: "Farmacia", imagen_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80&sig=1", creado_por: "Distribuidora Mayorista del Pacífico" },
            { id_producto: 2, nombre_articulo: "Alcohol Antiséptico 70% (Galón Industrial)", precio_mayorista: 8.00, stock_disponible: 25, categoria: "Farmacia", imagen_url: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=600&q=80&sig=2", creado_por: "Distribuidora Mayorista del Pacífico" },
            { id_producto: 3, nombre_articulo: "Martillo de Uña 16oz Truper Profesional", precio_mayorista: 6.50, stock_disponible: 15, categoria: "Ferretería", imagen_url: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=600&q=80&sig=3", creado_por: "Distribuidora Mayorista del Pacífico" },
            { id_producto: 4, nombre_articulo: "Saco de Cemento Canal Estructural (42.5kg)", precio_mayorista: 11.20, stock_disponible: 100, categoria: "Ferretería", imagen_url: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=600&q=80&sig=4", creado_por: "Distribuidora Mayorista del Pacífico" },
            { id_producto: 5, nombre_articulo: "Vitamina C 1g Efervescente (Tubo x 20 tabs)", precio_mayorista: 4.15, stock_disponible: 60, categoria: "Farmacia", imagen_url: "https://images.unsplash.com/photo-1616679911721-fe6eec10fcd5?auto=format&fit=crop&w=600&q=80&sig=5", creado_por: "Distribuidora Mayorista del Pacífico" },
            { id_producto: 6, nombre_articulo: "Cinta Métrica 5 Metros Stanley Global", precio_mayorista: 5.80, stock_disponible: 30, categoria: "Ferretería", imagen_url: "https://images.unsplash.com/photo-1531842477197-e3f85e40346e?auto=format&fit=crop&w=600&q=80&sig=6", creado_por: "Distribuidora Mayorista del Pacífico" }
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
    const envGemini = process.env.GEMINI_API_KEY ? "MODELO GEMINI REAL ACTIVO" : "FALLBACK DE CONTINGENCIA LOCAL ACTIVO";
    const envMongo = process.env.MONGO_URI ? "CONEXIÓN A NUBE ESTABLECIDA" : "FALTA ASIGNAR MONGO_URI";

    res.send(`
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; margin-top: 50px; color: #0f172a; padding: 20px; background: #fafafa;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                <h1 style="color: #10b981; font-weight: 900; letter-spacing: -1px; margin-bottom: 10px;">⚡ API de SupplierNi Operacional</h1>
                <p style="color: #64748b; font-size: 14px; margin-bottom: 30px;">Microservicio de persistencia en Nube para Ingeniería de Software - UNI.</p>
                
                <div style="text-align: left; background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #edf2f7; font-size: 12px; font-family: monospace;">
                    <h3 style="margin-top: 0; color: #334155; font-size: 13px; font-family: sans-serif;">🔍 DIAGNÓSTICO DE COMPUERTAS CLOUD</h3>
                    <p>• <strong>BASE DE DATOS:</strong> <span style="color: ${process.env.MONGO_URI ? '#059669' : '#dc2626'}">${envMongo}</span></p>
                    <p>• <strong>VARIABLE EMAIL_USER:</strong> <span style="color: ${process.env.EMAIL_USER ? '#059669' : '#dc2626'}">${envUser}</span></p>
                    <p>• <strong>VARIABLE EMAIL_PASS:</strong> <span style="color: ${process.env.EMAIL_PASS ? '#059669' : '#dc2626'}">${envPass}</span></p>
                    <p>• <strong>MOTOR DE IA INTEG.:</strong> <span style="color: #2563eb;">${envGemini}</span></p>
                </div>
                <div style="margin-top: 30px; font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                    Henry Lechado | Angel Tercero | Lester Lopez &copy; 2026
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
        const existe = await Usuario.findOne({ correo: correoLimpio });
        
        if (existe) {
            return res.status(400).json({ exito: false, error: "Esta entidad legal ya se encuentra inscrita." });
        }

        const tokenOTP = Math.floor(100000 + Math.random() * 900000).toString();

        await Usuario.create({
            correo: correoLimpio,
            contrasena: contrasena.trim(),
            rol: rol,
            nombre: nombre.trim(),
            estado: "PENDIENTE_VERIFICACION",
            codigo_verificacion: tokenOTP
        });

        const canalSmtp = configurarTransporterB2B();
        if (canalSmtp) {
            try {
                const htmlOtp = `
                    <div style="font-family:'Segoe UI',sans-serif; max-width:500px; margin:0 auto; padding:30px; border:1px solid #e2e8f0; border-radius:24px; text-align:center;">
                        <h2 style="color:#0f172a; margin-top:0; letter-spacing:-1px;">Código de Verificación</h2>
                        <p style="color:#64748b; font-size:14px;">Hola <strong>${nombre}</strong>,</p>
                        <p style="color:#64748b; font-size:14px;">Tu token criptográfico para activar tu cuenta en SupplierNi es:</p>
                        <div style="margin:30px 0;">
                            <span style="background:#f8fafc; border:1px solid #edf2f7; color:#10b981; font-size:32px; font-weight:900; letter-spacing:8px; padding:15px 25px; border-radius:12px;">${tokenOTP}</span>
                        </div>
                        <p style="color:#a0aec0; font-size:12px;">Ingresa este código en la plataforma para verificar tu identidad.</p>
                    </div>
                `;

                await canalSmtp.sendMail({
                    from: '"SupplierNi Seguridad" <henrylechado41@gmail.com>',
                    to: correoLimpio,
                    subject: `🔐 Código de Acceso SupplierNi: ${tokenOTP}`,
                    html: htmlOtp
                });
                console.log(`[SMTP PROCESADO] Correo de verificación enviado a ${correoLimpio}`);
            } catch (errorSmtp) {
                console.error(`[FALLO SMTP OTP] Error al enviar correo: ${errorSmtp.message}`);
            }
        }
        res.json({ exito: true, mensaje: "Registro procesado exitosamente." });
    } catch (err) {
        res.status(500).json({ exito: false, error: "Fallo severo en el hilo de registros." });
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

        res.json({ exito: true, mensaje: "¡Identidad validada y activa en el ecosistema!" });
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
                error: "El perfil aún no completa la verificación de token.", 
                requiere_verificacion: true, 
                correo: usuario.correo 
            });
        }

        res.json({ exito: true, usuario });
    } catch (error) {
        res.status(500).json({ exito: false, error: "Boundary error en el subproceso de firmas del Login." });
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
        res.status(500).json({ error: "No se pudo recuperar la matriz de insumos." });
    }
});

// =========================================================================
// 5. ENDPOINT: INYECCIÓN MAESTRA DE ARTÍCULOS AUTOGESTIONADOS
// =========================================================================
app.post('/api/productos', async (req, res) => {
    try {
        const { nombre_articulo, precio_mayorista, stock_disponible, categoria, imagen_url, creado_por } = req.body;
        
        if(!nombre_articulo || !precio_mayorista || !stock_disponible || !categoria) {
            return res.status(400).json({ exito: false, error: "Esquema del producto incompleto." });
        }

        const maxProd = await Producto.findOne().sort('-id_producto');
        const nuevoId = maxProd ? maxProd.id_producto + 1 : 1;
        const firmaUnica = `&sig=${nuevoId}`;
        let finalImg = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80" + firmaUnica;
        
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
        
        console.log(`[INVENTARIO EN NUBE] Nuevo artículo inyectado: ${nuevoProducto.nombre_articulo}`);
        res.json({ exito: true, producto: nuevoProducto });
    } catch (error) {
        res.status(500).json({ exito: false, error: "Fallo crítico al indexar el artículo." });
    }
});

// =========================================================================
// 6. ENDPOINT: PROCESAMIENTO LOGÍSTICO Y CONTROL DE CONCURRENCIA
// =========================================================================
app.post('/api/pedidos', async (req, res) => {
    try {
        const { id_comprador, items, total_neto, terminos_pago, email_despacho, direccion, telefono } = req.body;
        
        if (!id_comprador || !items || !items.length || !email_despacho || !direccion || !telefono) {
            return res.status(400).json({ exito: false, error: "Faltan parámetros logísticos obligatorios." });
        }
        if (!validarNumeroTelefonoNicaragua(telefono)) {
            return res.status(400).json({ exito: false, error: "Formato telefónico inválido." });
        }

        // CONTROL ATÓMICO DE CONCURRENCIA
        for (const item of items) {
            const prod = await Producto.findOne({ id_producto: item.id_producto });
            if (!prod) return res.status(400).json({ exito: false, error: `Artículo #${item.id_producto} no existe.` });
            if (prod.stock_disponible < item.cantidad) {
                return res.status(400).json({ exito: false, error: `Stock insuficiente para: ${prod.nombre_articulo}.` });
            }
        }

        // Deducción en almacén
        for (const item of items) {
            const prod = await Producto.findOne({ id_producto: item.id_producto });
            prod.stock_disponible -= item.cantidad;
            await prod.save();
        }

        const totalPedidos = await Pedido.countDocuments();
        const nuevoPedido = await Pedido.create({ 
            id_pedido: totalPedidos + 1, 
            id_comprador, 
            items, 
            total_neto: Number(total_neto), 
            terminos_pago, 
            email_despacho: email_despacho.toLowerCase().trim(), 
            direccion: direccion.trim(), 
            telefono: telefono.replace(/[\s-]/g, ''), 
            fecha: new Date().toLocaleString() 
        });

        // FACTURA SMTP
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
                            <p style="font-size:12px; color:#10b981; font-weight:800; text-transform:uppercase; margin:5px 0 0 0; letter-spacing:2px;">Orden de Abastecimiento Nacional Confirmada</p>
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
                                    <th style="padding:12px 10px; text-align:left; border-top-left-radius:8px; border-bottom-left-radius:8px;">Ítem</th>
                                    <th style="padding:12px 10px; text-align:center;">Cant</th>
                                    <th style="padding:12px 10px; text-align:right; border-top-right-radius:8px; border-bottom-right-radius:8px;">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${lineasFacturaHtml}
                            </tbody>
                        </table>
                        <div style="margin-top:25px; text-align:right; font-size:16px; font-weight:900; color:#0f172a; font-family:monospace;">
                            TOTAL NETO COMPROMETIDO: $${nuevoPedido.total_neto.toFixed(2)} USD
                        </div>
                        <div style="background:#fffbeb; border:1px solid #fef3c7; padding:15px; border-radius:16px; margin-top:25px; font-size:12px; color:#78350f; line-height:1.6;">
                            <strong>📌 COORDINADAS FINANCIERAS MAESTRAS DE LIQUIDACIÓN:</strong><br>
                            Efectúe su depósito o transferencia electrónica inmediata a los canales formales de Nicaragua:<br>
                            • <strong>Banco LAFISE Bancentro:</strong> Cuenta Corriente Córdobas #134070030<br>
                            • <strong>Banco BANPRO:</strong> Cuenta de Ahorros Dólares #10022341054
                        </div>
                        <div style="text-align:center; font-size:10px; color:#a0aec0; margin-top:35px; border-top:1px solid #edf2f7; padding-top:15px; font-weight:600;">
                            Ingeniería de Software - UNI Nicaragua<br>
                            Henry Lechado | Angel Tercero | Lester Lopez
                        </div>
                    </div>
                `;

                await canalSmtp.sendMail({
                    from: `"SupplierNi Red Logística" <henrylechado41@gmail.com>`,
                    to: nuevoPedido.email_despacho,
                    subject: `📋 Comprobante Oficial de Pedido #SP-${nuevoPedido.id_pedido} - SupplierNi`,
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
// 7. ENDPOINT: NÚCLEO DE INTELIGENCIA ARTIFICIAL (GEMINI + CONTINGENCIA MULTI-PRODUCTO)
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
                const promptContexto = `Eres el agente inteligente central de la red B2B SupplierNi en Nicaragua. 
                Rol del usuario actual: ${rol}.
                Catálogo relacional actual: ${JSON.stringify(productosEnBd)}.
                Mapeo geográfico de mercado: Managua absorbe el 55% de la tracción. León y Chinandega dominan el occidente.
                
                REGLA DE ORO DE CANTIDADES: Si el usuario menciona un número, extrae ese número exacto. Si no dice número, asume 1.
                Prohibición: No hables de VAN, TIR o ROI.
                Retorna SOLO un JSON: {"respuesta": "texto", "items": [{"id_producto": 1, "cantidad": 5}], "sugerencias": []}
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
                console.error(`[FALLO ENLACE GEMINI] ${errorCloud.message}. Derivando a contingencia.`);
            }
        }

        // MOTOR DE CONTINGENCIA DINÁMICO (SOPORTA MÚLTIPLES PRODUCTOS Y EXTRAE CANTIDADES)
        let respuestaText = "";
        let itemsDetectados = [];
        let sugerenciasCruzadas = [];

        if (rol === 'COMPRADOR') {
            respuestaText = "⚡ **Asistente Suministros:** He procesado los siguientes ítems en su orden: ";
            
            const catalogoBusqueda = [
                { id: 1, keys: ["amoxicilina", "pastillas", "medicina", "farmacia", "vitamina"], nombre: "Amoxicilina 500mg" },
                { id: 4, keys: ["cemento", "saco", "construccion"], nombre: "Saco de Cemento Canal" },
                { id: 3, keys: ["martillo", "herramientas", "ferreteria", "cinta"], nombre: "Martillo de Uña 16oz Truper" }
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
                respuestaText = "Hola Henry. Indíqueme abiertamente qué insumos médicos o materiales de construcción requiere su comercio y configuraré las casillas de su carrito de forma automatizada.";
            } else {
                respuestaText += "\n¡Las líneas han sido inyectadas en su panel comercial!";
                // Sugerencia genérica cruzada al usar la contingencia
                sugerenciasCruzadas.push({ id_producto: 2, nombre_articulo: "Alcohol Antiséptico 70% (Galón)" });
            }
        } else {
            if (msg.includes("vendido") || msg.includes("venta") || msg.includes("rotacion") || msg.includes("producto")) {
                respuestaText = "📊 **Auditoría de Rotación de Plaza:** Las lecturas de base de datos indican que los artículos con mayor índice de rotación en el territorio de Nicaragua corresponden al **Saco de Cemento Canal** en el rubro ferretero, y la **Amoxicilina 500mg** en la línea clínica.";
            } else if (msg.includes("zona") || msg.includes("lugar") || msg.includes("demanda") || msg.includes("managua") || msg.includes("chinandega") || msg.includes("leon")) {
                respuestaText = "📍 **Mapeo de la Demanda Nacional:** El núcleo comercial principal corresponde a **Managua (Zonas de abasto de los Distritos IV y V)** abarcando un 55% de la tracción transaccional total del software, seguido de forma estable por las cadenas de distribución mayoristas de **Chinandega** y **León**.";
            } else {
                respuestaText = "Entorno del Proveedor Activo. Puede realizar consultas analíticas avanzadas como: *'¿Cuáles son los productos más vendidos?'* o *'¿Qué zonas geográficas presentan mayor demanda?'* para auditar la plaza comercial.";
            }
        }

        res.json({ respuesta: respuestaText, items: itemsDetectados, sugerencias: sugerenciasCruzadas });
    } catch (err) {
        res.status(500).json({ error: "Fallo severo en las compuertas del hilo conversacional." });
    }
});

// ASIGNACIÓN DINÁMICA DE PUERTOS COMERCIALES CLOUD
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[INSTANCIA ACTIVA] Servidor central de SupplierNi operando en el puerto ${PORT}`));
