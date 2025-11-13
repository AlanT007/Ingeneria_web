const express = require("express");
const path = require("path");
const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) =>{
    res.sendFile(path.join(__dirname, "landing_page.html"));
});

app.listen(PORT, () => {
    console.log (`Servidor escuchando en http://localhost:${PORT}`);
});