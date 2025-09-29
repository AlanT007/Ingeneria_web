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

// Conexión Mongo
async function conectarMongo() {
  if (!client.topology?.isConnected()) {
    await client.connect();
    console.log("Conectado a MongoDB!");
  }
  return client.db(dbName);
}

// landing_page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "landing_page.html"));
});

// Registro de cliente
app.post("/guardar", async (req, res) => {
  try {
    const { usuario, password } = req.body;
    if (!usuario || !password) {
      return res.status(400).json({ ok: false, msg: "Faltan datos" });
    }

    const db = await conectarMongo();
    const collection = db.collection("usuarios");

    // Guardamos como cliente por defecto
    await collection.insertOne({ usuario, password, rol: "cliente" });

    res.json({ ok: true, rol: "cliente" });
  } catch (err) {
    console.error("Error en /guardar:", err);
    res.status(500).json({ ok: false, msg: "Error en el servidor" });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { usuario, password } = req.body;

    // Roles fijos
    if (usuario === "admin" && password === "admin123") {
      return res.json({ ok: true, rol: "admin" });
    }
    if (usuario === "operador" && password === "operador123") {
      return res.json({ ok: true, rol: "operador" });
    }

    // Clientes en Mongo
    const db = await conectarMongo();
    const collection = db.collection("usuarios");
    let user = await collection.findOne({ usuario });

    if (!user) {
      // Si no existe, lo creamos automáticamente como cliente
      await collection.insertOne({ usuario, password, rol: "cliente" });
      user = { usuario, password, rol: "cliente" };
      console.log("Usuario creado automáticamente:", usuario);
    }

    // Verificación de contraseña
    if (user.password === password) {
      res.json({ ok: true, rol: user.rol });
    } else {
      res.status(401).json({ ok: false, msg: "Credenciales inválidas" });
    }
  } catch (err) {
    console.error("Error en /login:", err);
    res.status(500).json({ ok: false, msg: "Error en el servidor" });
  }
});

app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});
