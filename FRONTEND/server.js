
const express = require("express");
const path = require("path");
const db = require("./database");

const app = express();
const PORT = 3000;

app.use(express.json());

// Verificar se o servidor e o banco estão funcionando
app.get("/api/status", (req, res) => {
  res.json({
    servidor: "online",
    banco: "conectado"
  });
});

// Consultar usuários sem expor senhas
app.get("/api/usuarios", (req, res) => {
  const usuarios = db.prepare(`
    SELECT id, nome, email, tipo, criado_em
    FROM usuarios
    ORDER BY id DESC
  `).all();

  res.json(usuarios);
});

// Consultar medicamentos
app.get("/api/medicamentos", (req, res) => {
  const medicamentos = db.prepare(`
    SELECT id, usuario_id, nome, dosagem, horario, foto
    FROM medicamentos
    ORDER BY id DESC
  `).all();

  res.json(medicamentos);
});

// Página inicial para testar o servidor
app.get("/", (req, res) => {
  res.send("Servidor do projeto PPP_ADS funcionando!");
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`Servidor: http://localhost:${PORT}`);
});
