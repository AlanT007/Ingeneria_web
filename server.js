const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || "mi_secreto";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

mongoose.connect("mongodb://localhost:27017/usuariosDB");

const usuarioSchema = new mongoose.Schema({
  usuario: String,
  password: String,
  rol: { type: String, default: "cliente" }
});
const Usuario = mongoose.model("Usuario", usuarioSchema);

function autenticarToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ ok: false, msg: "Token requerido" });
  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ ok: false, msg: "Token inválido o expirado" });
    req.user = user;
    next();
  });
}

function soloAdmin(req, res, next) {
  if (req.user.rol !== "admin") return res.status(403).json({ ok: false, msg: "Acceso denegado" });
  next();
}

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "landing_page.html")));
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "public", "login.html")));
app.get("/crear_usuario", (req, res) => res.sendFile(path.join(__dirname, "public", "crear_usuario.html")));
app.get("/admin_usuarios.html", (req, res) => res.sendFile(path.join(__dirname, "public", "admin_usuarios.html")));

app.post("/login", async (req, res) => {
  const { usuario, password } = req.body;
  try {
    if (usuario === "admin" && password === "admin123") {
      const token = jwt.sign({ usuario, rol: "admin" }, SECRET, { expiresIn: "1h" });
      return res.json({ ok: true, rol: "admin", token });
    }
    if (usuario === "operador" && password === "operador123") {
      const token = jwt.sign({ usuario, rol: "operador" }, SECRET, { expiresIn: "1h" });
      return res.json({ ok: true, rol: "operador", token });
    }
    const user = await Usuario.findOne({ usuario });
    if (!user || user.password !== password) return res.status(401).json({ ok: false, msg: "Credenciales inválidas" });
    const token = jwt.sign({ usuario: user.usuario, rol: user.rol }, SECRET, { expiresIn: "1h" });
    res.json({ ok: true, rol: user.rol, token });
  } catch {
    res.status(500).json({ ok: false, msg: "Error interno del servidor" });
  }
});

app.post("/crear_usuario", async (req, res) => {
  const { usuario, password } = req.body;
  try {
    if ((usuario === "admin" && password === "admin123") || (usuario === "operador" && password === "operador123"))
      return res.status(400).json({ ok: false, msg: "Usuario no permitido" });
    const existe = await Usuario.findOne({ usuario });
    if (existe) return res.status(400).json({ ok: false, msg: "El usuario ya existe" });
    const nuevo = new Usuario({ usuario, password, rol: "cliente" });
    await nuevo.save();
    res.json({ ok: true, msg: "Usuario creado con éxito!" });
  } catch {
    res.status(500).json({ ok: false, msg: "Error interno del servidor" });
  }
});

app.get("/admin_usuarios", autenticarToken, soloAdmin, async (req, res) => {
  try {
    const usuarios = await Usuario.find({}, "-__v");
    res.json({ ok: true, usuarios });
  } catch {
    res.status(500).json({ ok: false, msg: "Error al obtener usuarios" });
  }
});

app.post("/admin_usuarios", autenticarToken, soloAdmin, async (req, res) => {
  try {
    const { usuario, password, rol } = req.body;
    const existe = await Usuario.findOne({ usuario });
    if (existe) return res.json({ ok: false, msg: "El usuario ya existe" });
    const nuevoUsuario = new Usuario({ usuario, password, rol });
    await nuevoUsuario.save();
    res.json({ ok: true, msg: "Usuario creado correctamente" });
  } catch {
    res.status(500).json({ ok: false, msg: "Error al crear usuario" });
  }
});

app.put("/admin_usuarios/:id", autenticarToken, soloAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario, password, rol } = req.body;
    const target = await Usuario.findById(id);
    if (!target) return res.json({ ok: false, msg: "Usuario no encontrado" });
    if (target.usuario === "admin") return res.status(400).json({ ok: false, msg: "No se puede modificar al usuario admin" });
    const existe = await Usuario.findOne({ usuario, _id: { $ne: id } });
    if (existe) return res.json({ ok: false, msg: "Ya existe otro usuario con ese nombre" });
    await Usuario.findByIdAndUpdate(id, { usuario, password, rol });
    res.json({ ok: true, msg: "Usuario actualizado correctamente" });
  } catch {
    res.status(500).json({ ok: false, msg: "Error al actualizar usuario" });
  }
});

app.delete("/admin_usuarios/:id", autenticarToken, soloAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const target = await Usuario.findById(id);
    if (!target) return res.json({ ok: false, msg: "Usuario no encontrado" });
    if (target.usuario === "admin") return res.status(400).json({ ok: false, msg: "No se puede eliminar al usuario admin" });
    await Usuario.findByIdAndDelete(id);
    res.json({ ok: true, msg: "Usuario eliminado correctamente" });
  } catch {
    res.status(500).json({ ok: false, msg: "Error al eliminar usuario" });
  }
});

app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
