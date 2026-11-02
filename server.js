const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "reports.json");

fs.mkdirSync(DATA_DIR, { recursive: true });

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, "[]", "utf8");
}

function readReports() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return [];
  }
}

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "X-Content-Type-Options": "nosniff"
  });

  res.end(typeof body === "string" ? body : JSON.stringify(body));
}

function getBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";

    req.on("data", chunk => {
      raw += chunk;

      if (raw.length > 12000) {
        reject(new Error("Corpo muito grande"));
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        resolve(JSON.parse(raw || "{}"));
      } catch {
        reject(new Error("JSON inválido"));
      }
    });

    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(
    req.url,
    `http://${req.headers.host || "localhost"}`
  );

  if (req.method === "GET" && url.pathname === "/api/reports") {
    return send(res, 200, readReports());
  }

  if (req.method === "POST" && url.pathname === "/api/reports") {
    try {
      const body = await getBody(req);

      const number = String(body.number || "").replace(/\D/g, "");
      const reason = String(body.reason || "").trim().slice(0, 80);
      const notes = String(body.notes || "").trim().slice(0, 500);

      if (number.length < 10 || number.length > 15) {
        return send(res, 400, {
          error: "Informe um número com 10 a 15 dígitos."
        });
      }

      const allowedReasons = [
        "Spam ou golpe",
        "Assédio ou ameaça",
        "Impersonação",
        "Outro abuso"
      ];

      if (!allowedReasons.includes(reason)) {
        return send(res, 400, {
          error: "Escolha uma categoria válida."
        });
      }

      const reports = readReports();

      const record = {
        id: `R-${Date.now().toString(36).toUpperCase()}`,
        number,
        reason,
        notes,
        status: "Registrado localmente",
        createdAt: new Date().toISOString()
      };

      reports.unshift(record);

      fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(reports.slice(0, 500), null, 2),
        "utf8"
      );

      return send(res, 201, record);

    } catch (err) {
      return send(res, 400, {
        error: err.message || "Não foi possível registrar."
      });
    }
  }

  if (req.method === "GET") {
    const pathname =
      url.pathname === "/" ? "/index.html" : url.pathname;

    const safePath = path.normalize(
      path.join(PUBLIC, pathname)
    );

    if (!safePath.startsWith(PUBLIC)) {
      return send(res, 403, "Acesso negado", "text/plain");
    }

    fs.readFile(safePath, (err, data) => {
      if (err) {
        return send(res, 404, "Não encontrado", "text/plain");
      }

      const ext = path.extname(safePath);

      const types = {
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "text/javascript; charset=utf-8"
      };

      send(
        res,
        200,
        data,
        types[ext] || "application/octet-stream"
      );
    });

    return;
  }

  send(res, 404, {
    error: "Rota não encontrada."
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`WOLF Moderação ativo na porta ${PORT}`);
});
