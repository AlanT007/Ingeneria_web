const express = require("express");
const path = require("path");
const { MongoClient } = require("mongodb");

const app = express();
const url = "mongodb://127.0.0.1:27017";
const client = new MongoClient(url);
const dbName = "AppLogin";

// Middleware
app.use(express.json()); 
app.use(express.static(path.join(__dirname, "public"))); 

// Conexión a MongoDB
async function conectarMongo() {
  if (!client.topology?.isConnected()) {
    await client.connect();
    console.log("Conectado a MongoDB!");
  }
  return client.db(dbName);
}

// Página principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "landing_page.html"));
});

// Login con registro automático
app.post("/login", async (req, res) => {
  try {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      return res.status(400).json({ ok: false, msg: "Faltan datos" });
    }

    // Roles fijos
    if (usuario === "admin" && password === "admin123") {
      return res.json({ ok: true, rol: "admin" });
    } else if (usuario === "operador" && password === "operador123") {
      return res.json({ ok: true, rol: "operador" });
    }

    // Buscar usuario en Mongo
    const db = await conectarMongo();
    const collection = db.collection("usuarios");
    const user = await collection.findOne({ usuario });

    if (user) {
      // Validar contraseña
      if (user.password === password) {
        return res.json({ ok: true, rol: user.rol });
      } else {
        return res.status(401).json({ ok: false, msg: "Credenciales inválidas" });
      }
    } else {
      // Usuario no existe → registrar automáticamente
      await collection.insertOne({ usuario, password, rol: "cliente" });
      console.log("Usuario registrado automáticamente:", usuario);
      return res.json({ ok: true, rol: "cliente" });
    }
  } catch (err) {
    console.error("Error en /login:", err);
    res.status(500).json({ ok: false, msg: "Error en el servidor" });
  }
});

// Iniciar servidor
app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});

