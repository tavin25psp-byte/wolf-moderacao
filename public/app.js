const form = document.querySelector("#report-form");
const feedback = document.querySelector("#feedback");
const records = document.querySelector("#records");
const count = document.querySelector("#count");

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

function prettyDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("pt-BR");
}

async function loadRecords() {
  try {
    const response = await fetch("/api/reports");
    if (!response.ok) throw new Error("Falha ao carregar");
    const data = await response.json();
    count.textContent = data.length;

    if (!data.length) {
      records.innerHTML = '<div class="empty">Nenhum registro por enquanto.</div>';
      return;
    }

    records.innerHTML = data.map(item => `
      <article class="record">
        <div class="record-top">
          <span>${escapeHtml(item.reason)} · ${escapeHtml(item.id)}</span>
          <span class="badge">${escapeHtml(item.status)}</span>
        </div>
        <small>Número: ${escapeHtml(item.number)}<br>
        ${escapeHtml(prettyDate(item.createdAt))}
        ${item.notes ? "<br>" + escapeHtml(item.notes) : ""}</small>
      </article>
    `).join("");
  } catch {
    records.innerHTML = '<div class="empty">Não foi possível carregar. Verifique se o servidor está ativo.</div>';
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  feedback.className = "feedback";
  feedback.textContent = "Registrando…";

  const payload = {
    number: document.querySelector("#number").value,
    reason: document.querySelector("#reason").value,
    notes: document.querySelector("#notes").value
  };

  try {
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Não foi possível registrar.");

    feedback.textContent = "Ocorrência registrada. Nenhuma conta foi denunciada ou bloqueada.";
    form.reset();
    await loadRecords();
  } catch (error) {
    feedback.className = "feedback error";
    feedback.textContent = error.message;
  }
});

document.querySelector("#refresh").addEventListener("click", loadRecords);
loadRecords();
