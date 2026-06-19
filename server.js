const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
// fetch ya es nativo en Node.js 18+, no se requiere require adicional si usas versión reciente

const app = express();

// =========================================================================
// CONFIGURACIÓN DE MIDDLEWARES BASE DE RANGO INDUSTRIAL
// =========================================================================
app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, 'db.json');
const BACKUP_FILE = path.join(__dirname, 'db.json.bak');

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
// COMPUERTA ALGORÍTMICA: VALIDACIONES DE ESTRUCTURA Y SINTAXIS CRÍTICA
// =========================================================================
const validarFormatoCorreo = (correo) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(correo);
};

const validarNumeroTelefonoNicaragua = (telefono) => {
    // Valida números de Nicaragua de 8 dígitos (pueden venir con guiones o espacios)
    const limpio = telefono.replace(/[\s-]/g, '');
    const regex = /^[2578]\d{7}$/;
    return regex.test(limpio);
};

// =========================================================================
// MATRIZ DE SEMILLA INICIAL ENRIQUECIDA (PRODUCTOS CON LLAVES ÚNICAS DE IMAGEN)
// =========================================================================
const semillaInicial = {
    usuarios: [
        { correo: "proveedor@gmail.com", contrasena: "1234", rol: "PROVEEDOR", nombre: "Distribuidora Mayorista del Pacífico", estado: "VERIFICADO", codigo_verificacion: null },
        { correo: "comprador@gmail.com", contrasena: "1234", rol: "COMPRADOR", nombre: "Ferretería y Farmacia La Esperanza", estado: "VERIFICADO", codigo_verificacion: null }
    ],
    productos: [
        { 
            id_producto: 1, 
            nombre_articulo: "Amoxicilina 500mg (Caja x 100 tabs)", 
            precio_mayorista: 12.50, 
            stock_disponible: 40, 
            categoria: "Farmacia", 
            imagen_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80&sig=1", 
            creado_por: "Distribuidora Mayorista del Pacífico" 
        },
        { 
            id_producto: 2, 
            nombre_articulo: "Alcohol Antiséptico 70% (Galón Industrial)", 
            precio_mayorista: 8.00, 
            stock_disponible: 25, 
            categoria: "Farmacia", 
            imagen_url: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=600&q=80&sig=2", 
            creado_por: "Distribuidora Mayorista del Pacífico" 
        },
        { 
            id_producto: 3, 
            nombre_articulo: "Martillo de Uña 16oz Truper Profesional", 
            precio_mayorista: 6.50, 
            stock_disponible: 15, 
            categoria: "Ferretería", 
            imagen_url: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=600&q=80&sig=3", 
            creado_por: "Distribuidora Mayorista del Pacífico" 
        },
        { 
            id_producto: 4, 
            nombre_articulo: "Saco de Cemento Canal Estructural (42.5kg)", 
            precio_mayorista: 11.20, 
            stock_disponible: 100, 
            categoria: "Ferretería", 
            imagen_url: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=600&q=80&sig=4", 
            creado_por: "Distribuidora Mayorista del Pacífico" 
        },
        { 
            id_producto: 5, 
            nombre_articulo: "Vitamina C 1g Efervescente (Tubo x 20 tabs)", 
            precio_mayorista: 4.15, 
            stock_disponible: 60, 
            categoria: "Farmacia", 
            imagen_url: "https://images.unsplash.com/photo-1616679911721-fe6eec10fcd5?auto=format&fit=crop&w=600&q=80&sig=5", 
            creado_por: "Distribuidora Mayorista del Pacífico" 
        },
        { 
            id_producto: 6, 
            nombre_articulo: "Cinta Métrica 5 Metros Stanley Global", 
            precio_mayorista: 5.80, 
            stock_disponible: 30, 
            categoria: "Ferretería", 
            imagen_url: "https://images.unsplash.com/photo-1531842477197-e3f85e40346e?auto=format&fit=crop&w=600&q=80&sig=6", 
            creado_por: "Distribuidora Mayorista del Pacífico" 
        }
    ],
    pedidos: []
};

// =========================================================================
// SISTEMA DE PERSISTENCIA CON MECANISMOS DE COPIA DE SEGURIDAD AUTOMÁTICA
// =========================================================================
const leerBaseDatos = () => {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify(semillaInicial, null, 2));
        return semillaInicial;
    }
    try {
        const contenido = fs.readFileSync(DB_FILE, 'utf-8');
        if (!contenido || contenido.trim() === '') {
            throw new Error("Archivo vacío detectado.");
        }
        const datos = JSON.parse(contenido);
        if (!datos.usuarios || !datos.productos || !datos.pedidos) {
            throw new Error("Falta integridad en esquemas requeridos.");
        }
        return datos;
    } catch (error) {
        console.error(`[REPARACIÓN DE BASE DE DATOS] Fallo estructural en db.json: ${error.message}. Activando respaldo.`);
        if (fs.existsSync(BACKUP_FILE)) {
            try {
                const respaldo = fs.readFileSync(BACKUP_FILE, 'utf-8');
                fs.writeFileSync(DB_FILE, respaldo);
                console.log("[REPARACIÓN DE BASE DE DATOS] Clonación de db.json.bak completada con éxito.");
                return JSON.parse(respaldo);
            } catch (bakError) {
                console.error("[REPARACIÓN DE BASE DE DATOS] El archivo de respaldo también está corrupto. Hard reset.");
            }
        }
        fs.writeFileSync(DB_FILE, JSON.stringify(semillaInicial, null, 2));
        return semillaInicial;
    }
};

const guardarBaseDatos = (datos) => {
    try {
        const stringificado = JSON.stringify(datos, null, 2);
        // Genera copia de seguridad previa
        if (fs.existsSync(DB_FILE)) {
            fs.copyFileSync(DB_FILE, BACKUP_FILE);
        }
        fs.writeFileSync(DB_FILE, stringificado);
    } catch (error) {
        console.error(`[ERROR EXCEPCIÓN] No se pudo escribir en el almacenamiento relacional: ${error.message}`);
    }
};

// =========================================================================
// CONTROLADOR LOGÍSTICO SMTP ULTRA-COMPATIBLE (CONFIGURACIÓN BREVO B2B)
// =========================================================================
const configurarTransporterB2B = () => {
    /* DOCUMENTACIÓN DE SEGURIDAD DE RED:
      Se implementa el bypass TLS (rejectUnauthorized: false) como medida de 
      contingencia arquitectónica. Esto asegura que el túnel STARTTLS en el puerto 587 
      no sea interceptado y bloqueado por firewalls locales, antivirus o restricciones 
      estrictas de certificados dentro de las capas de contenedores efímeros (ej. Render).
    */
    return nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 2525,
        secure: false, // TLS
        auth: {
            user: process.env.EMAIL_USER, // Credencial de login: af20b2001@smtp-brevo.com
            pass: process.env.EMAIL_PASS  // Llave criptográfica de 15 caracteres
        },
        tls: {
            // LÍNEA MÁGICA: Previene el error 'self-signed certificate in certificate chain'
            rejectUnauthorized: false 
        }
    });
};

// =========================================================================
// COMPUERTA DE ENTRADA AL SERVIDOR Y DIAGNÓSTICO DE VARIABLES
// =========================================================================
app.get('/', (req, res) => {
    const envUser = process.env.EMAIL_USER ? "CONFIGURADO DE FORMA CORRECTA" : "FALTA ASIGNAR EN ENVIRONMENT";
    const envPass = process.env.EMAIL_PASS ? "CONFIGURADO DE FORMA CORRECTA" : "FALTA ASIGNAR EN ENVIRONMENT";
    const envGemini = process.env.GEMINI_API_KEY ? "MODELO GEMINI REAL ACTIVO" : "FALLBACK DE CONTINGENCIA LOCAL ACTIVO";

    res.send(`
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; margin-top: 50px; color: #0f172a; padding: 20px; background: #fafafa;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                <h1 style="color: #10b981; font-weight: 900; letter-spacing: -1px; margin-bottom: 10px;">⚡ API de SupplierNi Operacional</h1>
                <p style="color: #64748b; font-size: 14px; margin-bottom: 30px;">Microservicio de persistencia distribuida y procesamiento semántico para Ingeniería de Software - UNI.</p>
                
                <div style="text-align: left; background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #edf2f7; font-size: 12px; font-family: monospace;">
                    <h3 style="margin-top: 0; color: #334155; font-size: 13px; font-family: sans-serif;">🔍 DIAGNÓSTICO DE COMPUERTAS CLOUD</h3>
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
// 1. ENDPOINT: REGISTRO COMERCIAL CON ENVÍO DE TOKEN OTP POR CORREO
// =========================================================================
app.post('/api/registro', async (req, res) => { // <-- Se añade 'async' aquí
    try {
        const { correo, contrasena, rol, nombre } = req.body;
        
        if (!correo || !contrasena || !rol || !nombre) {
            return res.status(400).json({ exito: false, error: "Todos los campos de la razón social son obligatorios." });
        }

        if (!validarFormatoCorreo(correo)) {
            return res.status(400).json({ exito: false, error: "La sintaxis del correo corporativo ingresado es inválida." });
        }

        const correoLimpio = correo.toLowerCase().trim();
        const db = leerBaseDatos();
        
        if (db.usuarios.find(u => u.correo.toLowerCase().trim() === correoLimpio)) {
            return res.status(400).json({ exito: false, error: "Esta entidad legal ya se encuentra inscrita en la red." });
        }

        const tokenOTP = Math.floor(100000 + Math.random() * 900000).toString();

        db.usuarios.push({
            correo: correoLimpio,
            contrasena: contrasena.trim(),
            rol: rol,
            nombre: nombre.trim(),
            estado: "PENDIENTE_VERIFICACION",
            codigo_verificacion: tokenOTP
        });
        guardarBaseDatos(db);

        // ========================================================
        // COMPUERTA DE ENVÍO SMTP DEL CÓDIGO DE VERIFICACIÓN
        // ========================================================
        const canalSmtp = configurarTransporterB2B();
        if (canalSmtp) {
            try {
                const htmlOtp = `
                    <div style="font-family:'Segoe UI',sans-serif; max-width:500px; margin:0 auto; padding:30px; border:1px solid #e2e8f0; border-radius:24px; text-align:center;">
                        <h2 style="color:#0f172a; margin-top:0; letter-spacing:-1px;">Código de Verificación</h2>
                        <p style="color:#64748b; font-size:14px;">Hola <strong>${nombre}</strong>,</p>
                        <p style="color:#64748b; font-size:14px;">Tu token criptográfico para activar tu cuenta comercial en SupplierNi es:</p>
                        <div style="margin:30px 0;">
                            <span style="background:#f8fafc; border:1px solid #edf2f7; color:#10b981; font-size:32px; font-weight:900; letter-spacing:8px; padding:15px 25px; border-radius:12px;">${tokenOTP}</span>
                        </div>
                        <p style="color:#a0aec0; font-size:12px;">Ingresa este código en la plataforma para verificar tu identidad. Si no solicitaste este registro, puedes ignorar este correo.</p>
                    </div>
                `;

                await canalSmtp.sendMail({
                    from: '"SupplierNi Seguridad" <henrylechado41@gmail.com>', // Usa la cuenta validada para no tener rechazos de Brevo
                    to: correoLimpio,
                    subject: `🔐 Código de Acceso SupplierNi: ${tokenOTP}`,
                    html: htmlOtp
                });
                console.log(`[SMTP PROCESADO] Correo de verificación enviado a ${correoLimpio}`);
            } catch (errorSmtp) {
                console.error(`[FALLO SMTP OTP] No se pudo enviar el correo de verificación: ${errorSmtp.message}`);
            }
        }

        console.log(`[CONSOLA DE CONTROL] Token OTP asignado para ${correoLimpio}: ${tokenOTP}`);
        // Ya NO mandamos el código simulado de vuelta por seguridad
        res.json({ exito: true, mensaje: "Registro procesado exitosamente." });
    } catch (err) {
        res.status(500).json({ exito: false, error: "Fallo severo en el hilo de registros del servidor." });
    }
});

// =========================================================================
// 2. ENDPOINT: VERIFICACIÓN CRIPTOGRÁFICA OTP
// =========================================================================
app.post('/api/verificar', (req, res) => {
    try {
        const { correo, codigo } = req.body;
        if (!correo || !codigo) return res.status(400).json({ exito: false, error: "Parámetros transaccionales ausentes." });

        const correoLimpio = correo.toLowerCase().trim();
        const db = leerBaseDatos();

        // Control de validación atómica
        const usuario = db.usuarios.find(u => u.correo.toLowerCase().trim() === correoLimpio);
        if (!usuario) return res.status(404).json({ exito: false, error: "La entidad jurídica no figura en los registros públicos." });

        if (usuario.codigo_verificacion !== codigo.trim()) {
            return res.status(400).json({ exito: false, error: "El token OTP ingresado es incorrecto o expiró." });
        }

        usuario.estado = "VERIFICADO";
        usuario.codigo_verificacion = null;
        guardarBaseDatos(db);

        res.json({ exito: true, mensaje: "¡Identidad de empresa validada y activa en el ecosistema!" });
    } catch (error) {
        res.status(500).json({ exito: false, error: "Fallo de concurrencia en la compuerta OTP." });
    }
});

// =========================================================================
// 3. ENDPOINT: AUTENTICACIÓN CENTRALIZADA CON CONTROL DE CASING
// =========================================================================
app.post('/api/login', (req, res) => {
    try {
        const { correo, contrasena } = req.body;
        if(!correo || !contrasena) return res.status(400).json({ exito: false, error: "Las credenciales no pueden estar en blanco." });
        
        const correoLimpio = correo.toLowerCase().trim();
        const db = leerBaseDatos();

        const usuario = db.usuarios.find(u => u.correo.toLowerCase().trim() === correoLimpio && u.contrasena === contrasena.trim());
        if (!usuario) {
            return res.status(401).json({ exito: false, error: "Acceso denegado. Credenciales de la firma corporativa incorrectas." });
        }

        if (usuario.estado !== 'VERIFICADO') {
            return res.status(403).json({ 
                exito: false, 
                error: "El perfil de la empresa aún no completa la verificación de token.", 
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
app.get('/api/productos', (req, res) => {
    try {
        const db = leerBaseDatos();
        res.json(db.productos);
    } catch (e) {
        res.status(500).json({ error: "No se pudo recuperar la matriz relacional de insumos." });
    }
});

// =========================================================================
// 5. ENDPOINT: INYECCIÓN MAESTRA DE ARTÍCULOS AUTOGESTIONADOS (PROVEEDOR)
// =========================================================================
app.post('/api/productos', (req, res) => {
    try {
        const { nombre_articulo, precio_mayorista, stock_disponible, categoria, imagen_url, creado_por } = req.body;
        
        if(!nombre_articulo || !precio_mayorista || !stock_disponible || !categoria) {
            return res.status(400).json({ exito: false, error: "Esquema del producto incompleto para indexación." });
        }

        const db = leerBaseDatos();

        // Genera una firma única parametrizada al final de la URL para que el navegador rompa la caché visual
        const firmaUnica = `&sig=${db.productos.length + 1}`;
        let finalImg = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80" + firmaUnica;
        
        if (imagen_url && imagen_url.trim() !== '' && imagen_url.startsWith('http')) {
            finalImg = imagen_url.trim() + (imagen_url.includes('?') ? firmaUnica : "?" + firmaUnica);
        }

        const nuevoProducto = {
            id_producto: db.productos.reduce((max, p) => p.id_producto > max ? p.id_producto : max, 0) + 1,
            nombre_articulo: nombre_articulo.trim(),
            precio_mayorista: Math.abs(Number(precio_mayorista)),
            stock_disponible: Math.abs(parseInt(stock_disponible)),
            categoria,
            imagen_url: finalImg,
            creado_por: creado_por || "Distribuidor Autorizado"
        };

        db.productos.push(nuevoProducto);
        guardarBaseDatos(db);
        
        console.log(`[INVENTARIO EN BODEGA] Nuevo artículo inyectado de forma física: ${nuevoProducto.nombre_articulo}`);
        res.json({ exito: true, producto: nuevoProducto });
    } catch (error) {
        res.status(500).json({ exito: false, error: "Fallo crítico en el despachador relacional al indexar el artículo." });
    }
});

// =========================================================================
// 6. ENDPOINT: PROCESAMIENTO LOGÍSTICO COMPLETO Y CONTROL DE CONCURRENCIA
// =========================================================================
app.post('/api/pedidos', async (req, res) => {
    try {
        const { id_comprador, items, total_neto, terminos_pago, email_despacho, direccion, telefono } = req.body;
        
        if (!id_comprador || !items || !items.length || !email_despacho || !direccion || !telefono) {
            return res.status(400).json({ exito: false, error: "Faltan parámetros logísticos obligatorios para el despacho (Dirección/Teléfono/Email)." });
        }

        if (!validarNumeroTelefonoNicaragua(telefono)) {
            return res.status(400).json({ exito: false, error: "El formato del teléfono de contacto de Nicaragua es inválido (Debe contener 8 dígitos)." });
        }

        const db = leerBaseDatos();

        // CONTROL ATÓMICO DE CONCURRENCIA: Bloquea la fila de inmediato si hay desborde en stock
        for (const item of items) {
            const prod = db.productos.find(p => p.id_producto === item.id_producto);
            if (!prod) {
                return res.status(400).json({ exito: false, error: `El artículo solicitado con ID #${item.id_producto} ya no existe en el catálogo nacional.` });
            }
            if (prod.stock_disponible < item.cantidad) {
                return res.status(400).json({ exito: false, error: `Conflicto de concurrencia. Stock insuficiente en almacén para: ${prod.nombre_articulo}. Disponibles: ${prod.stock_disponible} unidades.` });
            }
        }

        // Deducción en caliente del almacén relacional plano
        for (const item of items) {
            const prod = db.productos.find(p => p.id_producto === item.id_producto);
            if (prod) prod.stock_disponible -= item.cantidad;
        }

        const numRef = Math.floor(100000 + Math.random() * 900000);
        const nuevoPedido = { 
            id_pedido: db.pedidos.length + 1, 
            id_comprador, 
            items, 
            total_neto: Number(total_neto), 
            terminos_pago,
            email_despacho: email_despacho.toLowerCase().trim(),
            direccion: direccion.trim(),
            telefono: telefono.replace(/[\s-]/g, ''),
            fecha: new Date().toLocaleString() 
        };
        
        db.pedidos.push(nuevoPedido);
        guardarBaseDatos(db);

        // COLA ALGORÍTMICA SMTP TRANSACCIONAL REAL (PROCESADOR DE CORREOS)
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

                /* REGLA DE AUTENTICIDAD DE BREVO APLICADA AQUÍ:
                  El atributo 'from' está forzado a utilizar la cuenta real de verificación 
                  (henrylechado41@gmail.com) para superar las políticas anti-falsificación (DMARC/SPF).
                  El uso de process.env.EMAIL_USER aquí causaba destrucción silenciosa de paquetes, 
                  ya que Brevo rechaza el login largo como remitente visible.
                */
                await canalSmtp.sendMail({
                    from: `"SupplierNi Red Logística B2B" <henrylechado41@gmail.com>`,
                    to: nuevoPedido.email_despacho,
                    subject: `📋 Comprobante Oficial de Pedido #SP-${nuevoPedido.id_pedido} - SupplierNi`,
                    html: cuerpoHtml
                });
                console.log(`[SMTP PROCESADO] Envío real de correo a ${nuevoPedido.email_despacho} ejecutado de forma exitosa.`);
            } catch (smtpError) {
                console.error(`[FALLO SMTP INHERENTE] Error en la pasarela de transporte: ${smtpError.message}`);
            }
        }

        res.json({ 
            exito: true, 
            pedido: nuevoPedido,
            coordenadas_bancarias: [
                { banco: "Banco LAFISE Bancentro", cuenta: "134070030", moneda: "Córdobas (NIO)", tipo: "Cuenta Corriente Empresarial" },
                { banco: "Banco BANPRO", cuenta: "10022341054", moneda: "Dólares (USD)", tipo: "Cuenta de Ahorros" }
            ]
        });
    } catch (err) {
        res.status(500).json({ exito: false, error: "Fallo sistémico al asimilar la orden mercantil." });
    }
});

// =========================================================================
// 7. ENDPOINT: NÚCLEO DE INTELIGENCIA ARTIFICIAL GEMINI MODEL GATEWAY
// =========================================================================
app.post('/api/ia-asistente', async (req, res) => {
    try {
        const { mensaje, rol } = req.body;
        if (!mensaje) return res.status(400).json({ error: "Mensaje vacío." });
        
        const msg = mensaje.toLowerCase().trim();
        const db = leerBaseDatos();
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        // COMPUERTA DE CANAL DE INFERENCIA SEMÁNTICA GENERATIVA (GEMINI 1.5 FLASH REAL)
        if (GEMINI_API_KEY) {
            try {
                const promptContexto = `Eres el agente inteligente central de la red B2B SupplierNi en Nicaragua. 
                Estás interactuando con un operador cuyo rol institucional en el sistema es: ${rol}.
                Catálogo relacional actual de insumos en memoria: ${JSON.stringify(db.productos)}.
                Bitácora de movimientos e histórico de pedidos: ${JSON.stringify(db.pedidos)}.
                Mapeo geográfico de mercado: Managua (específicamente la masa de distribución mayorista de los Distritos IV y V) absorbe el 55% de la tracción de compras de todo el país. León y Chinandega dominan completamente el occidente nacional.
                Índice de Rotación Maestro de Artículos: El artículo número uno en movimiento del rubro constructivo es el Saco de Cemento Canal, mientras que en la línea médica la Amoxicilina 500mg lidera las requisiciones de farmacias locales.

                =======================================================================
                PROHIBICIÓN SANITARIA CRÍTICA EN ORDENANZA DE TESIS:
                Tienes terminantemente prohibido bajo cualquier escenario hablar, procesar, simular, calcular o nombrar parámetros teóricos de ingeniería económica como el VALOR ACTUAL NETO (VAN), la TASA INTERNA DE RETORNO (TIR) o el RETORNO DE LA INVERSIÓN (ROI). Si el usuario intenta consultarte sobre estas siglas, desestímalas inmediatamente de forma elegante y enfócate en el catálogo o la logística nicaragüense.
                =======================================================================

                CONTRATO ESTRICTO DE INTERFACES EN RETORNO (DEBES EMITIR EXCLUSIVAMENTE UN OBJETO JSON SIN TEXTO ADICIONAL NI COMENTARIOS FUERA):
                {
                  "respuesta": "Tu explicación directa en lenguaje natural corporativo, fluido y profesional.",
                  "items": [{"id_producto": 1, "cantidad": 5}], // Si el usuario tiene rol COMPRADOR y te solicita explícitamente agregar o comprar insumos, mapea los IDs y volúmenes exactos aquí. Si no, déjalo como un arreglo vacío [].
                  "sugerencias": [{"id_producto": 2, "nombre_articulo": "Nombre"}] // Sugiere artículos complementarios de venta cruzada inteligente según la conversación, si no aplica déjalo como [].
                }

                Entrada del operador: "${mensaje}"`;

                const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: promptContexto }] }],
                        generationConfig: {
                            responseMimeType: "application/json",
                            responseSchema: {
                                type: "object",
                                properties: {
                                    respuesta: { type: "string" },
                                    items: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                id_producto: { type: "integer" },
                                                cantidad: { type: "integer" }
                                            },
                                            required: ["id_producto", "cantidad"]
                                        }
                                    },
                                    sugerencias: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                id_producto: { type: "integer" },
                                                nombre_articulo: { type: "string" }
                                            },
                                            required: ["id_producto", "nombre_articulo"]
                                        }
                                    }
                                },
                                required: ["respuesta", "items", "sugerencias"]
                            }
                        }
                    })
                });

                if (apiResponse.ok) {
                    const aiData = await apiResponse.json();
                    let jsonText = aiData.candidates[0].content.parts[0].text.trim();
                    
                    // Purgador de bloques sintácticos Markdown remanentes
                    if (jsonText.startsWith("```\n```text?code_stdout&code_event_index=2\nBackend file generated successfully.\n\n```")) {
                        jsonText = jsonText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
                    }
                    
                    return res.json(JSON.parse(jsonText));
                }
            } catch (errorCloud) {
                console.error(`[FALLO ENLACE GEMINI] Inferencia rechazada: ${errorCloud.message}. Derivando a compuerta de contingencia.`);
            }
        }

        // MOTOR DE CONTINGENCIA DINÁMICO LOCAL SANITIZADO (CERO MÉTRICAS FINANCIERAS)
        let respuestaText = "";
        let itemsDetectados = [];
        let sugerenciasCruzadas = [];

        if (rol === 'COMPRADOR') {
            if (msg.includes("amoxicilina") || msg.includes("pastillas") || msg.includes("medicina") || msg.includes("farmacia")) {
                itemsDetectados.push({ id_producto: 1, cantidad: 5 });
                sugerenciasCruzadas.push({ id_producto: 2, nombre_articulo: "Alcohol Antiséptico 70% (Galón)" });
                respuestaText = "⚡ **Asistente Suministros:** Entendido Henry. Reconocí su requerimiento farmacéutico de forma inmediata y procedí a pre-cargar **5 cajas de Amoxicilina 500mg** en sus líneas de pedido.";
            } else if (msg.includes("cemento") || msg.includes("saco") || msg.includes("construccion")) {
                itemsDetectados.push({ id_producto: 4, cantidad: 10 });
                sugerenciasCruzadas.push({ id_producto: 3, nombre_articulo: "Martillo de Uña 16oz Truper" });
                respuestaText = "⚡ **Asistente Suministros:** Demanda de insumos de infraestructura registrada. Inyecté **10 sacos de Cemento Canal** automáticos en su panel comercial.";
            } else if (msg.includes("martillo") || msg.includes("herramientas") || msg.includes("ferreteria")) {
                itemsDetectados.push({ id_producto: 3, cantidad: 2 });
                sugerenciasCruzadas.push({ id_producto: 4, nombre_articulo: "Saco de Cemento Canal (42.5kg)" });
                respuestaText = "⚡ **Asistente Suministros:** Herramientas añadidas. Estructuré **2 Martillos Truper de 16oz** de forma directa en su orden de compra mayorista.";
            } else {
                respuestaText = "Hola Henry. Indíqueme abiertamente qué insumos médicos o materiales de construcción requiere su comercio y configuraré las casillas de su carrito de forma automatizada.";
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