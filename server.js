const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const reports = [];

app.get("/api/reports", (req, res) => res.json(reports));

app.post("/api/reports", (req, res) => {
  const { number, reason, notes } = req.body;
  if (!number || !reason) {
    return res.status(400).json({ error: "Número e categoria são obrigatórios." });
  }
  const report = {
    id: "R" + (reports.length + 1),
    number: String(number).slice(0, 30),
    reason: String(reason).slice(0, 80),
    notes: String(notes || "").slice(0, 500),
    status: "Registrado",
    createdAt: new Date().toISOString()
  };
  reports.unshift(report);
  res.status(201).json(report);
});

app.listen(process.env.PORT || 3000, () => console.log("Rodando"));
