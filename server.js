const http = require("http");
const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

const url = "mongodb://127.0.0.1:27017";
const client = new MongoClient(url);
const dbName = "AppLogin";

async function conectarMongo() {
  await client.connect();
  console.log("Conectado a MongoDB!");
  return client.db(dbName);
}

const server = http.createServer(async (req, res) => {
  // Sirve archivos estáticos de /public
  if (req.method === "GET") {
    let filePath = "";
    if (req.url === "/") filePath = "./public/landing_page.html";
    else filePath = `./public${req.url}`;

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Página no encontrada");
      } else {
        let ext = path.extname(filePath);
        let contentType = "text/html";
        if (ext === ".css") contentType = "text/css";
        if (ext === ".js") contentType = "application/javascript";
        res.writeHead(200, { "Content-Type": contentType });
        res.end(content);
      }
    });
  }

  // Guardar usuario (registro/login)
  else if (req.method === "POST" && req.url === "/guardar") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", async () => {
      const datos = JSON.parse(body);
      const { usuario, password } = datos;

      const db = await conectarMongo();
      const collection = db.collection("usuarios");

      await collection.insertOne({ usuario, password, rol: "cliente" });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, rol: "cliente" }));
    });
  }

  // Endpoint para login
  else if (req.method === "POST" && req.url === "/login") {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", async () => {
      const { usuario, password } = JSON.parse(body);

      // Roles fijos
      if (usuario === "admin" && password === "admin123") {
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ ok: true, rol: "admin" }));
      }
      if (usuario === "operador" && password === "operador123") {
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ ok: true, rol: "operador" }));
      }

      // Clientes desde MongoDB
      const db = await conectarMongo();
      const collection = db.collection("usuarios");
      const user = await collection.findOne({ usuario, password });

      if (user) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, rol: "cliente" }));
      } else {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, msg: "Credenciales inválidas" }));
      }
    });
  }
});

server.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});
