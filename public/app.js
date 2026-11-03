const form = document.getElementById("report-form");
const feedback = document.getElementById("feedback");
const records = document.getElementById("records");
const count = document.getElementById("count");
const refresh = document.getElementById("refresh");

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Erro na solicitação.");
  }

  return data;
}

// Registrar ocorrência individual
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const number = document.getElementById("number").value.trim();
  const reason = document.getElementById("reason").value;
  const notes = document.getElementById("notes").value.trim();

  feedback.textContent = "Registrando ocorrência...";
  feedback.className = "feedback";

  try {
    await api("/api/reports", {
      method: "POST",
      body: JSON.stringify({
        number,
        reason,
        notes
      })
    });

    feedback.textContent = "Ocorrência registrada com sucesso!";
    feedback.className = "feedback success";

    form.reset();

    await loadReports();

  } catch (error) {
    feedback.textContent = error.message;
    feedback.className = "feedback error";
  }
});

// Carregar histórico
async function loadReports() {
  try {
    const reports = await api("/api/reports");

    count.textContent = reports.length;

    if (!reports.length) {
      records.innerHTML = `
        <div class="empty">
          Nenhum registro por enquanto.
        </div>
      `;

      return;
    }

    records.innerHTML = reports.map((report) => `
      <article class="record">
        <div class="record-top">
          <strong>${escapeHTML(report.id)}</strong>
          <span>${escapeHTML(report.status)}</span>
        </div>

        <p>${escapeHTML(report.number)}</p>
        <p>${escapeHTML(report.reason)}</p>

        <small>
          ${new Date(report.createdAt).toLocaleString("pt-BR")}
        </small>
      </article>
    `).join("");

  } catch (error) {
    records.innerHTML = `
      <div class="empty">
        Não foi possível carregar os registros.
      </div>
    `;
  }
}

// Escapar conteúdo para evitar HTML injetado
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// Atualizar histórico
refresh.addEventListener("click", loadReports);

// Inicialização
loadReports();
