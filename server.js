const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 3000;
const SECRET = "mi_secreto"; // para generar tokens

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // carpeta public

// Conectar a MongoDB
mongoose.connect("mongodb://localhost:27017/usuariosDB");

// Modelo de Usuario
const usuarioSchema = new mongoose.Schema({
  usuario: String,
  password: String,
  rol: { type: String, default: "cliente" }
});

const Usuario = mongoose.model("Usuario", usuarioSchema);

// Rutas de páginas principales
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "landing_page.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/crear_usuario", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "crear_usuario.html"));
});

// Endpoint: LOGIN
app.post("/login", async (req, res) => {
  const { usuario, password } = req.body;

  try {
    // Admin y operador hardcodeados
    if (usuario === "admin" && password === "admin123") {
      const token = jwt.sign({ usuario, rol: "admin" }, SECRET, { expiresIn: "1h" });
      return res.json({ ok: true, rol: "admin", token });
    }
    if (usuario === "operador" && password === "operador123") {
      const token = jwt.sign({ usuario, rol: "operador" }, SECRET, { expiresIn: "1h" });
      return res.json({ ok: true, rol: "operador", token });
    }

    // Buscar en MongoDB
    const user = await Usuario.findOne({ usuario, password });
    if (!user) {
      return res.status(401).json({ ok: false, msg: "Credenciales inválidas" });
    }

    const token = jwt.sign({ usuario, rol: user.rol }, SECRET, { expiresIn: "1h" });
    res.json({ ok: true, rol: user.rol, token });

  } catch (err) {
    console.error("Error en /login:", err);
    res.status(500).json({ ok: false, msg: "Error interno del servidor" });
  }
});

// Endpoint: CREAR USUARIO
app.post("/crear_usuario", async (req, res) => {
  const { usuario, password } = req.body;

  try {
    // No permitir crear admin u operador
    if (
      (usuario === "admin" && password === "admin123") ||
      (usuario === "operador" && password === "operador123")
    ) {
      return res.status(400).json({ ok: false, msg: "Usuario no permitido" });
    }

    // Revisar si ya existe
    const existe = await Usuario.findOne({ usuario });
    if (existe) {
      return res.status(400).json({ ok: false, msg: "El usuario ya existe" });
    }

    // Crear usuario nuevo con rol cliente
    const nuevo = new Usuario({ usuario, password, rol: "cliente" });
    await nuevo.save();

    res.json({ ok: true, msg: "Usuario creado con éxito!" });

  } catch (err) {
    console.error("Error en /crear_usuario:", err);
    res.status(500).json({ ok: false, msg: "Error interno del servidor" });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
