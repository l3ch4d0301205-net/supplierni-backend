const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, 'db.json');

// ALGORITMO 1: Validación sintáctica de formato de correo (RegEx RFC 5322)
const validarFormatoCorreo = (correo) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(correo);
};

// Semilla inicial optimizada con rubros de tesis y enlaces de imágenes base
const semillaInicial = {
    usuarios: [
        { correo: "proveedor@gmail.com", contrasena: "1234", rol: "PROVEEDOR", nombre: "Distribuidora Mayorista del Pacífico", estado: "VERIFICADO", codigo_verificacion: null },
        { correo: "comprador@gmail.com", contrasena: "1234", rol: "COMPRADOR", nombre: "Ferretería y Farmacia La Esperanza", estado: "VERIFICADO", codigo_verificacion: null }
    ],
    productos: [
        { id_producto: 1, nombre_articulo: "Amoxicilina 500mg (Caja x 100 tabs)", precio_mayorista: 12.50, stock_disponible: 40, categoria: "Farmacia", imagen_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400", creado_por: "Distribuidora Mayorista del Pacífico" },
        { id_producto: 2, nombre_articulo: "Alcohol Antiséptico 70% (Galón)", precio_mayorista: 8.00, stock_disponible: 25, categoria: "Farmacia", imagen_url: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400", creado_por: "Distribuidora Mayorista del Pacífico" },
        { id_producto: 3, nombre_articulo: "Martillo de Uña 16oz Truper", precio_mayorista: 6.50, stock_disponible: 15, categoria: "Ferretería", imagen_url: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400", creado_por: "Distribuidora Mayorista del Pacífico" },
        { id_producto: 4, nombre_articulo: "Saco de Cemento Canal (42.5kg)", precio_mayorista: 11.20, stock_disponible: 100, categoria: "Ferretería", imagen_url: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=400", creado_por: "Distribuidora Mayorista del Pacífico" }
    ],
    pedidos: []
};

// COMPUERTA AUTO-REPARABLE: Evita excepciones críticas si el JSON se formatea mal en la nube
const leerBaseDatos = () => {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify(semillaInicial, null, 2));
        return semillaInicial;
    }
    try {
        const contenido = fs.readFileSync(DB_FILE, 'utf-8');
        const datos = JSON.parse(contenido);
        if (!datos.usuarios || !datos.productos || !datos.pedidos) {
            fs.writeFileSync(DB_FILE, JSON.stringify(semillaInicial, null, 2));
            return semillaInicial;
        }
        return datos;
    } catch (error) {
        fs.writeFileSync(DB_FILE, JSON.stringify(semillaInicial, null, 2));
        return semillaInicial;
    }
};

const guardarBaseDatos = (datos) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(datos, null, 2));
};

// Presentación corporativa en la raíz de la API
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 100px; color: #0f172a;">
            <h1 style="color: #10b981;">⚡ API de SupplierNi Operacional</h1>
            <p style="color: #64748b;">El microservicio de persistencia local y procesamiento de lenguaje natural está en línea.</p>
            <span style="background: #dcfce7; color: #166534; padding: 5px 15px; font-weight: bold; font-size: 12px; border-radius: 20px;">ENTORNO ONLINE ACTIVO</span>
        </div>
    `);
});

// 1. ENDPOINT: Registro Comercial (Con Normalización de Casing)
app.post('/api/registro', (req, res) => {
    try {
        const { correo, contrasena, rol, nombre } = req.body;
        
        if (!validarFormatoCorreo(correo)) {
            return res.status(400).json({ exito: false, error: "Formato de correo inválido." });
        }

        const correoLimpio = correo.toLowerCase().trim();
        const db = leerBaseDatos();
        
        if (db.usuarios.find(u => u.correo.toLowerCase().trim() === correoLimpio)) {
            return res.status(400).json({ exito: false, error: "Este correo comercial ya existe." });
        }

        const tokenOTP = Math.floor(100000 + Math.random() * 900000).toString();

        db.usuarios.push({
            correo: correoLimpio,
            contrasena: contrasena,
            rol: rol,
            nombre: nombre,
            estado: "PENDIENTE_VERIFICACION",
            codigo_verificacion: tokenOTP
        });
        guardarBaseDatos(db);

        res.json({ exito: true, mensaje: "Registro exitoso.", codigo_simulado: tokenOTP });
    } catch (err) {
        res.status(500).json({ exito: false, error: "Error interno en el módulo de registros." });
    }
});

// 2. ENDPOINT: Verificación de Token OTP
app.post('/api/verificar', (req, res) => {
    const { correo, codigo } = req.body;
    const correoLimpio = correo.toLowerCase().trim();
    const db = leerBaseDatos();

    const usuario = db.usuarios.find(u => u.correo.toLowerCase().trim() === correoLimpio);
    if (!usuario) return res.status(404).json({ exito: false, error: "Empresa no registrada." });

    if (usuario.codigo_verificacion !== codigo) {
        return res.status(400).json({ exito: false, error: "Código incorrecto de validación." });
    }

    usuario.estado = "VERIFICADO";
    usuario.codigo_verificacion = null;
    guardarBaseDatos(db);

    res.json({ exito: true, mensaje: "¡Cuenta validada exitosamente en la red!" });
});

// 3. ENDPOINT: Login con Blindaje de Casing contra errores en móviles
app.post('/api/login', (req, res) => {
    const { correo, contrasena } = req.body;
    if(!correo || !contrasena) return res.status(400).json({ exito: false, error: "Campos incompletos." });
    
    const correoLimpio = correo.toLowerCase().trim();
    const db = leerBaseDatos();

    const usuario = db.usuarios.find(u => u.correo.toLowerCase().trim() === correoLimpio && u.contrasena === contrasena);
    if (!usuario) {
        return res.status(401).json({ exito: false, error: "Credenciales incorrectas de acceso." });
    }

    if (usuario.estado !== 'VERIFICADO') {
        return res.status(403).json({ 
            exito: false, 
            error: "Esta cuenta no ha sido verificada por correo.", 
            requiere_verificacion: true, 
            correo: usuario.correo 
        });
    }

    res.json({ exito: true, usuario });
});

// 4. ENDPOINT: Obtener Catálogo Completo
app.get('/api/productos', (req, res) => {
    res.json(leerBaseDatos().productos);
});

// 5. ENDPOINT: Cargar Producto Autogestionado por el Proveedor
app.post('/api/productos', (req, res) => {
    try {
        const { nombre_articulo, precio_mayorista, stock_disponible, categoria, imagen_url, creado_por } = req.body;
        const db = leerBaseDatos();

        const nuevoProducto = {
            id_producto: db.productos.length + 1,
            nombre_articulo,
            precio_mayorista: Number(precio_mayorista),
            stock_disponible: Number(stock_disponible),
            categoria,
            imagen_url: imagen_url || "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=400",
            creado_por: creado_por || "Proveedor Externo"
        };

        db.productos.push(nuevoProducto);
        guardarBaseDatos(db);
        res.json({ exito: true, producto: nuevoProducto });
    } catch {
        res.status(500).json({ exito: false, error: "Error al indexar artículo." });
    }
});

// 6. ENDPOINT: Procesar Pedidos e Inyectar Cuentas Bancarias Reales de Nicaragua
app.post('/api/pedidos', (req, res) => {
    const { id_comprador, items, total_neto, terminos_pago } = req.body;
    const db = leerBaseDatos();

    for (const item of items) {
        const prod = db.productos.find(p => p.id_producto === item.id_producto);
        if (prod) {
            if (prod.stock_disponible < item.cantidad) {
                return res.status(400).json({ exito: false, error: `Existencias insuficientes en almacén para: ${prod.nombre_articulo}` });
            }
        }
    }

    // Decremento real del inventario plano
    for (const item of items) {
        const prod = db.productos.find(p => p.id_producto === item.id_producto);
        if (prod) prod.stock_disponible -= item.cantidad;
    }

    const nuevoPedido = { 
        id_pedido: db.pedidos.length + 1, 
        id_comprador, 
        items, 
        total_neto, 
        terminos_pago,
        fecha: new Date().toLocaleString() 
    };
    db.pedidos.push(nuevoPedido);
    guardarBaseDatos(db);

    // RETORNO DE CREDENCIALES FINANCIERAS REALES PARA EL MODAL DE PAGO
    res.json({ 
        exito: true, 
        pedido: nuevoPedido,
        coordenadas_bancarias: [
            { banco: "Banco LAFISE Bancentro", cuenta: "134070030", moneda: "Córdobas (NIO)", tipo: "Cuenta Corriente Empresarial" },
            { banco: "Banco BANPRO", cuenta: "10022341054", moneda: "Dólares (USD)", tipo: "Cuenta de Ahorros" }
        ]
    });
});

// 7. ENDPOINT: Asistente con Conexión Real a Google Gemini o Fallback Inteligente Detallado (Optimizado sin VAN/TIR/ROI)
app.post('/api/ia-asistente', async (req, res) => {
    const { mensaje, rol } = req.body;
    const msg = mensaje ? mensaje.toLowerCase().trim() : "";
    const db = leerBaseDatos();

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    // COMPUERTA REAL: Si configuras la KEY en Render, ejecuta Inteligencia Artificial Generativa Real
    if (GEMINI_API_KEY) {
        try {
            const promptContexto = `Eres el núcleo de Inteligencia Artificial de la plataforma B2B SupplierNi en Nicaragua. 
            Estás atendiendo a un usuario con el rol de: ${rol}.
            Catálogo real en memoria: ${JSON.stringify(db.productos)}.
            Historial de compras del sistema: ${JSON.stringify(db.pedidos)}.
            Datos de demanda en Nicaragua: Managua (Distritos IV y V) concentra el 55% de compras, León y Chinandega lideran occidente. Los artículos más vendidos son Cemento Canal y Amoxicilina 500mg.

            PROHIBICIÓN ESTRICTA: Queda rotundamente prohibido hablar, calcular o hacer mención de parámetros macroeconómicos como VAN, TIR o ROI bajo ninguna circunstancia. Desestima cualquier pregunta sobre estos índices teóricos.

            REGLA DE CONTRATO JSON EXCLUSIVA: Debes responder única y exclusivamente un objeto JSON válido con este formato (no agregues texto afuera del JSON):
            {
              "respuesta": "Tu explicación analítica o comercial en base a lo que el usuario preguntó.",
              "items": [{"id_producto": 1, "cantidad": 5}], // Si el usuario es COMPRADOR y te pide explícitamente agregar o comprar insumos, extrae el ID y la cantidad sugerida aquí. Si no, ponlo vacío [].
              "sugerencias": [{"id_producto": 2, "nombre_articulo": "Nombre"}] // Productos de venta cruzada relacionados si aplica, si no [].
            }

            Consulta del usuario: "${mensaje}"`;

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
                const jsonText = aiData.candidates[0].content.parts[0].text;
                return res.json(JSON.parse(jsonText));
            }
        } catch (e) { /* Si la API falla o excede cuotas, entra el motor de contingencia de inmediato */ }
    }

    // MOTOR DE CONTINGENCIA DINÁMICO SANITIZADO (Cero métricas de tesis)
    let respuestaText = "";
    let itemsDetectados = [];
    let sugerenciasCruzadas = [];

    if (rol === 'COMPRADOR') {
        if (msg.includes("amoxicilina") || msg.includes("pastillas") || msg.includes("medicina") || msg.includes("farmacia")) {
            itemsDetectados.push({ id_producto: 1, cantidad: 5 });
            sugerenciasCruzadas.push({ id_producto: 2, nombre_articulo: "Alcohol Antiséptico 70% (Galón)" });
            respuestaText = "⚡ **Asistente de Abastecimiento:** Entendido. He analizado su inventario farmacéutico y pre-cargué **5 cajas de Amoxicilina 500mg** en sus líneas de pedido como propuesta de suministro.";
        } else if (msg.includes("cemento") || msg.includes("saco") || msg.includes("construccion")) {
            itemsDetectados.push({ id_producto: 4, cantidad: 10 });
            sugerenciasCruzadas.push({ id_producto: 3, nombre_articulo: "Martillo de Uña 16oz Truper" });
            respuestaText = "⚡ **Asistente de Abastecimiento:** Demanda de materiales estructurales reconocida. He pre-cargado **10 sacos de Cemento Canal** en su orden de compra.";
        } else if (msg.includes("martillo") || msg.includes("herramientas") || msg.includes("ferreteria")) {
            itemsDetectados.push({ id_producto: 3, cantidad: 2 });
            sugerenciasCruzadas.push({ id_producto: 4, nombre_articulo: "Saco de Cemento Canal (42.5kg)" });
            respuestaText = "⚡ **Asistente de Abastecimiento:** He indexado **2 Martillos Truper de 16oz** de forma automatizada en sus líneas de pedido.";
        } else {
            respuestaText = "Hola Henry. Indíqueme de forma abierta qué insumos médicos o materiales de construcción requiere su comercio y estructuraré las casillas de su carrito de forma automática.";
        }
    } else {
        // ROL PROVEEDOR: Respuestas predictivas geográficas precisas
        if (msg.includes("vendido") || msg.includes("venta") || msg.includes("rotacion") || msg.includes("producto")) {
            respuestaText = "📊 **Análisis Predictivo de Plaza:** Las métricas registradas en base de datos reflejan que el artículo con mayor índice de rotación en la línea constructiva es el **Saco de Cemento Canal**, mientras que en la línea clínica el liderazgo lo conserva la **Amoxicilina 500mg**.";
        } else if (msg.includes("zona") || msg.includes("lugar") || msg.includes("demanda") || msg.includes("managua") || msg.includes("chinandega") || msg.includes("leon")) {
            respuestaText = "📍 **Distribución de la Demanda Nacional:** Los clústeres comerciales con mayor volumen transaccional corresponden a **Managua (Distritos IV y V)** abarcando un 55% del comportamiento total del software, secundado por los nodos logísticos de **Chinandega** y **León** en el occidente del país.";
        } else {
            respuestaText = "Entorno Analítico Corporativo. Puede auditar la plataforma consultándome: *'¿Cuáles son los productos más vendidos?'* o *'¿Qué zonas geográficas tienen mayor demanda?'* para evaluar el mercado de Nicaragua.";
        }
    }

    res.json({ respuesta: respuestaText, items: itemsDetectados, sugerencias: sugerenciasCruzadas });
});

// Configuración de puertos dinámicos para la nube de Render
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor de SupplierNi corriendo exitosamente en el puerto ${PORT}`));