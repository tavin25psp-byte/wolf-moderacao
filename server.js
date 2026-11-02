const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = process.env.DATA_DIR || __dirname;
const DATA_FILE = path.join(DATA_DIR, "reports.json");

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

function readReports() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeReports(reports) {
  const tempFile = DATA_FILE + ".tmp";

  fs.writeFileSync(
    tempFile,
    JSON.stringify(reports, null, 2),
    "utf8"
  );

  fs.renameSync(tempFile, DATA_FILE);
}

app.get("/api/reports", (req, res) => {
  res.json(readReports());
});

app.post("/api/reports", (req, res) => {
  const { number, reason, notes } = req.body || {};

  if (!number || !reason) {
    return res.status(400).json({
      error: "Número e categoria são obrigatórios."
    });
  }

  const normalizedNumber = String(number).trim();

  if (
    normalizedNumber.length < 7 ||
    normalizedNumber.length > 30
  ) {
    return res.status(400).json({
      error: "Informe um número válido."
    });
  }

  const reports = readReports();

  const report = {
    id: "WOLF-" + Date.now().toString(36).toUpperCase(),
    number: normalizedNumber,
    reason: String(reason).slice(0, 80),
    notes: String(notes || "").slice(0, 1000),
    status: "Registrado",
    createdAt: new Date().toISOString()
  };

  reports.unshift(report);

  try {
    writeReports(reports);
  } catch (error) {
    return res.status(500).json({
      error: "Não foi possível salvar o registro."
    });
  }

  res.status(201).json(report);
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "online"
  });
});

app.listen(PORT, () => {
  console.log("WOLF Moderação rodando na porta " + PORT);
});
