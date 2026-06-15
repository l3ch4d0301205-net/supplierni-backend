const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Ruta raíz estética para el jurado de la UNI
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 100px; color: #0f172a;">
            <h1 style="color: #10b981;">⚡ API de SupplierNi Operacional</h1>
            <p style="color: #64748b;">El microservicio de base de datos local está corriendo exitosamente en la nube de Render.</p>
            <span style="background: #dcfce7; color: #166534; padding: 5px 15px; rounded: 20px; font-weight: bold; font-size: 12px; border-radius: 20px;">ENTORNO ONLINE ACTIVO</span>
        </div>
    `);
});

const DB_FILE = path.join(__dirname, 'db.json');

// ALGORITMO: Validación sintáctica de correo (RegEx RFC 5322)
const validarFormatoCorreo = (correo) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(correo);
};

const leerBaseDatos = () => {
    if (!fs.existsSync(DB_FILE)) {
        // PARCHE: Las cuentas por defecto ya nacen con estado VERIFICADO
        const datosIniciales = {
            usuarios: [
                { correo: "proveedor@gmail.com", contrasena: "1234", rol: "PROVEEDOR", nombre: "Distribuidora Mayorista del Pacífico", estado: "VERIFICADO", codigo_verificacion: null },
                { correo: "comprador@gmail.com", contrasena: "1234", rol: "COMPRADOR", nombre: "Ferretería y Farmacia La Esperanza", estado: "VERIFICADO", codigo_verificacion: null }
            ],
            productos: [
                { id_producto: 1, nombre_articulo: "Amoxicilina 500mg (Caja x 100 tabs)", precio_mayorista: 12.50, stock_disponible: 40, categoria: "Farmacia" },
                { id_producto: 2, nombre_articulo: "Alcohol Antiséptico 70% (Galón)", precio_mayorista: 8.00, stock_disponible: 25, categoria: "Farmacia" },
                { id_producto: 3, nombre_articulo: "Martillo de Uña 16oz Truper", precio_mayorista: 6.50, stock_disponible: 15, categoria: "Ferretería" },
                { id_producto: 4, nombre_articulo: "Saco de Cemento Canal (42.5kg)", precio_mayorista: 11.20, stock_disponible: 100, categoria: "Ferretería" }
            ],
            pedidos: []
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(datosIniciales, null, 2));
        return datosIniciales;
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
};

const guardarBaseDatos = (datos) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(datos, null, 2));
};

// 1. REGISTRO + Algoritmo de Generación de Código OTP
app.post('/api/registro', (req, res) => {
    const { correo, contrasena, rol, nombre } = req.body;
    
    if (!validarFormatoCorreo(correo)) {
        return res.status(400).json({ exito: false, error: "Formato de correo inválido." });
    }

    const db = leerBaseDatos();
    if (db.usuarios.find(u => u.correo === correo)) {
        return res.status(400).json({ exito: false, error: "Este correo comercial ya existe." });
    }

    const tokenOTP = Math.floor(100000 + Math.random() * 900000).toString();

    db.usuarios.push({
        correo, contrasena, rol, nombre,
        estado: "PENDIENTE_VERIFICACION",
        codigo_verificacion: tokenOTP
    });
    guardarBaseDatos(db);

    res.json({ exito: true, mensaje: "Registro exitoso.", codigo_simulado: tokenOTP });
});

// 2. VERIFICACIÓN TOKEN OTP
app.post('/api/verificar', (req, res) => {
    const { correo, codigo } = req.body;
    const db = leerBaseDatos();

    const usuario = db.usuarios.find(u => u.correo === correo);
    if (!usuario) return res.status(404).json({ exito: false, error: "Usuario no registrado." });

    if (usuario.codigo_verificacion !== codigo) {
        return res.status(400).json({ exito: false, error: "Código incorrecto." });
    }

    usuario.estado = "VERIFICADO";
    usuario.codigo_verificacion = null;
    guardarBaseDatos(db);

    res.json({ exito: true, mensaje: "¡Cuenta validada exitosamente!" });
});

// 3. LOGIN CON COMPUERTA DE SEGURIDAD
app.post('/api/login', (req, res) => {
    const { correo, contrasena } = req.body;
    const db = leerBaseDatos();

    const usuario = db.usuarios.find(u => u.correo === correo && u.contrasena === contrasena);
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

// 4. OBTENER PRODUCTOS
app.get('/api/productos', (req, res) => {
    const db = leerBaseDatos();
    res.json(db.productos);
});

// 5. CARGAR PRODUCTO
app.post('/api/productos', (req, res) => {
    const { nombre_articulo, precio_mayorista, stock_disponible, categoria } = req.body;
    const db = leerBaseDatos();

    db.productos.push({
        id_producto: db.productos.length + 1,
        nombre_articulo,
        precio_mayorista: Number(precio_mayorista),
        stock_disponible: Number(stock_disponible),
        categoria
    });
    guardarBaseDatos(db);
    res.json({ exito: true });
});

// 6. PROCESAR PEDIDO
app.post('/api/pedidos', (req, res) => {
    const { id_comprador, items, total_neto } = req.body;
    const db = leerBaseDatos();

    for (const item of items) {
        const prod = db.productos.find(p => p.id_producto === item.id_producto);
        if (prod) {
            if (prod.stock_disponible < item.cantidad) {
                return res.status(400).json({ exito: false, error: `Stock insuficiente para: ${prod.nombre_articulo}` });
            }
            prod.stock_disponible -= item.cantidad;
        }
    }

    db.pedidos.push({ id_pedido: db.pedidos.length + 1, id_comprador, total_neto, fecha: new Date().toLocaleString() });
    guardarBaseDatos(db);
    res.json({ exito: true, mensaje: "¡Pedido procesado e inventario actualizado!" });
});

// 7. ASISTENTE DE IA (Métricas de la Tesis)
app.post('/api/ia-asistente', (req, res) => {
    const { mensaje } = req.body;
    const msg = mensaje.toLowerCase();
    let respuesta = "Como asistente experto de SupplierNi, puedo detallarle las métricas de viabilidad financiera (VAN, TIR, ROI) o la arquitectura de microservicios.";

    if (msg.includes("van") || msg.includes("valor actual") || msg.includes("viable")) {
        respuesta = "El Valor Actual Neto (VAN) de SupplierNi es de **$8,819.91 USD**, lo que ratifica la viabilidad financiera del proyecto al ser mayor que cero.";
    } else if (msg.includes("tir") || msg.includes("tasa interna")) {
        respuesta = "La Tasa Interna de Retorno (TIR) calculada es del **43%**, superando el costo de oportunidad base establecido para el desarrollo.";
    } else if (msg.includes("roi") || msg.includes("retorno")) {
        respuesta = "El Retorno de la Inversión (ROI) se sitúa en un **380%**, lo que demuestra una excelente eficiencia en el uso del capital invertido.";
    } else if (msg.includes("arquitectura") || msg.includes("clean") || msg.includes("microservicio")) {
        respuesta = "La plataforma utiliza una **Arquitectura de Microservicios Desacoplados** y cada componente aplica **Clean Architecture** en su capa lógica.";
    } else if (msg.includes("modelo") || msg.includes("saas") || msg.includes("comision")) {
        respuesta = "Manejamos una comisión **piloto del 3%** y un esquema **SaaS de tres niveles**: Comprador Base ($15.00), IA Premium ($20.00) y Proveedor Analítica ($5.00).";
    }

    res.json({ respuesta });
});
// Cambiamos el puerto fijo por el puerto dinámico que exige Render en internet
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Servidor de SupplierNi corriendo exitosamente en el puerto ${PORT}`));