/**
 * app.js – AiM EVO4 Instalación Triumph 675 SR
 * Interactividad: checkboxes, progreso, persistencia localStorage, acordeones.
 */

const STORAGE_KEY = "aim675sr_state";

// ── State ────────────────────────────────────────────────────────────────────
function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ── Tabs ─────────────────────────────────────────────────────────────────────
function initTabs() {
  const buttons = document.querySelectorAll("nav.tabs button");
  const panels  = document.querySelectorAll(".tab-panel");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      panels.forEach((p)  => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
    });
  });
}

// ── Checkboxes ────────────────────────────────────────────────────────────────
function initCheckboxes() {
  const state = loadState();

  document.querySelectorAll("input.qc-check").forEach((cb) => {
    const id = cb.dataset.id;
    if (state[id]) {
      cb.checked = true;
      markRowDone(cb);
    }

    cb.addEventListener("change", () => {
      state[id] = cb.checked;
      saveState(state);
      markRowDone(cb);
      updateAllProgress();
    });
  });

  updateAllProgress();
}

function markRowDone(cb) {
  const row = cb.closest("tr, li.step-item");
  if (!row) return;
  if (cb.checked) {
    row.classList.add("done");
  } else {
    row.classList.remove("done");
  }
}

// ── Firma inputs ──────────────────────────────────────────────────────────────
function initFirmaInputs() {
  const state = loadState();

  document.querySelectorAll("input.firma-input").forEach((input) => {
    const id = input.dataset.id;
    if (state[id]) input.value = state[id];

    input.addEventListener("input", () => {
      state[id] = input.value;
      saveState(state);
    });
  });
}

// ── Progress ──────────────────────────────────────────────────────────────────
function updateAllProgress() {
  // Global
  const allCbs    = document.querySelectorAll("input.qc-check");
  const checkedCbs = document.querySelectorAll("input.qc-check:checked");
  const pct = allCbs.length ? Math.round((checkedCbs.length / allCbs.length) * 100) : 0;
  const fillEl  = document.getElementById("global-fill");
  const pctEl   = document.getElementById("global-pct");
  if (fillEl)  fillEl.style.width = pct + "%";
  if (pctEl)   pctEl.textContent  = pct + "%";

  // Per-phase group progress
  document.querySelectorAll(".phase-group").forEach((group) => {
    const total   = group.querySelectorAll("input.qc-check").length;
    const checked = group.querySelectorAll("input.qc-check:checked").length;
    const progEl  = group.querySelector(".phase-progress");
    if (progEl) progEl.textContent = `${checked}/${total}`;
  });
}

// ── Accordions ────────────────────────────────────────────────────────────────
function initAccordions() {
  document.querySelectorAll(".phase-title").forEach((title) => {
    title.addEventListener("click", () => {
      const group = title.closest(".phase-group");
      group.classList.toggle("collapsed");
      const body = group.querySelector(".step-list");
      if (body) {
        body.style.display = group.classList.contains("collapsed") ? "none" : "";
      }
    });
  });
}

// ── Reset ─────────────────────────────────────────────────────────────────────
function initReset() {
  const btn = document.getElementById("btn-reset");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (!confirm("¿Seguro que quieres reiniciar todos los checks y firmas?")) return;
    localStorage.removeItem(STORAGE_KEY);
    document.querySelectorAll("input.qc-check").forEach((cb) => {
      cb.checked = false;
      markRowDone(cb);
    });
    document.querySelectorAll("input.firma-input").forEach((inp) => {
      inp.value = "";
    });
    updateAllProgress();
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initCheckboxes();
  initFirmaInputs();
  initAccordions();
  initReset();
});
