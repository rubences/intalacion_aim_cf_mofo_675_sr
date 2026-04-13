/**
 * app.js – AiM EVO4 · CFMoto / Triumph 675 SR
 * v3.0 — Toast · Hash routing · Export/Import · Celebration · Shortcuts
 */

const STORAGE_KEY = "aim675sr_state_v3";

// ── State ─────────────────────────────────────────────────────────────────────
function loadState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}

function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { /* quota exceeded — ignore */ }
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function ensureToastContainer() {
  let c = document.getElementById("toast-container");
  if (!c) {
    c = document.createElement("div");
    c.id = "toast-container";
    document.body.appendChild(c);
  }
  return c;
}

function showToast(msg, type = "info", duration = 2800) {
  const icons = { success: "✔", info: "ℹ", warning: "⚠" };
  const container = ensureToastContainer();
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] ?? "•"}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("out");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  }, duration);
}

// ── Celebration overlay ───────────────────────────────────────────────────────
function ensureCelebration() {
  let el = document.getElementById("celebration");
  if (!el) {
    el = document.createElement("div");
    el.id = "celebration";
    el.innerHTML = `
      <div class="celebration-badge">
        <span class="emoji">🏁</span>
        <h2>¡Instalación Completada!</h2>
        <p>Todas las verificaciones QC aprobadas. ¡A pista!</p>
      </div>
      <button class="btn-celebration" id="btn-close-celebration">Continuar →</button>`;
    document.body.appendChild(el);
    document.getElementById("btn-close-celebration")
      .addEventListener("click", () => el.classList.remove("visible"));
  }
  return el;
}

function checkCompletion(pct) {
  if (pct === 100) {
    const cel = ensureCelebration();
    if (!cel.classList.contains("visible")) {
      cel.classList.add("visible");
    }
  }
}

// ── Tabs + hash routing ───────────────────────────────────────────────────────
function initTabs() {
  const buttons = document.querySelectorAll("nav.tabs button");
  const panels  = document.querySelectorAll(".tab-panel");

  const activateTab = (tabId) => {
    buttons.forEach(b => b.classList.remove("active"));
    panels.forEach(p => p.classList.remove("active"));
    const btn = document.querySelector(`nav.tabs button[data-tab="${tabId}"]`);
    const panel = document.getElementById(tabId);
    if (btn && panel) {
      btn.classList.add("active");
      panel.classList.add("active");
      history.replaceState(null, "", `#${tabId}`);
    }
  };

  buttons.forEach(btn => {
    btn.addEventListener("click", () => activateTab(btn.dataset.tab));
  });

  // Restore from hash
  const hash = location.hash.replace("#", "");
  if (hash && document.getElementById(hash)) {
    activateTab(hash);
  }
}

// ── Checkboxes ────────────────────────────────────────────────────────────────
function initCheckboxes() {
  const state = loadState();

  document.querySelectorAll("input.qc-check").forEach(cb => {
    const id = cb.dataset.id;
    if (state[id]) { cb.checked = true; markRowDone(cb); }

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
  row.classList.toggle("done", cb.checked);
}

// ── Firma inputs ──────────────────────────────────────────────────────────────
function initFirmaInputs() {
  const state = loadState();

  document.querySelectorAll("input.firma-input").forEach(input => {
    const id = input.dataset.id;
    if (state[id]) input.value = state[id];

    input.addEventListener("input", () => {
      state[id] = input.value;
      saveState(state);
    });
  });
}

// ── Progress ──────────────────────────────────────────────────────────────────
let _lastPct = -1;

function updateAllProgress() {
  const all     = document.querySelectorAll("input.qc-check");
  const checked = document.querySelectorAll("input.qc-check:checked");
  const pct     = all.length ? Math.round((checked.length / all.length) * 100) : 0;

  const fillEl = document.getElementById("global-fill");
  const pctEl  = document.getElementById("global-pct");
  if (fillEl) fillEl.style.width = pct + "%";
  if (pctEl)  animateCounter(pctEl, _lastPct < 0 ? pct : _lastPct, pct);
  _lastPct = pct;

  // Per-phase
  document.querySelectorAll(".phase-group").forEach(group => {
    const total   = group.querySelectorAll("input.qc-check").length;
    const done    = group.querySelectorAll("input.qc-check:checked").length;
    const progEl  = group.querySelector(".phase-progress");
    if (progEl) progEl.textContent = `${done}/${total}`;
  });

  checkCompletion(pct);
}

function animateCounter(el, from, to) {
  const duration = 400;
  const start    = performance.now();
  const step     = (ts) => {
    const progress = Math.min((ts - start) / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(from + (to - from) * eased) + "%";
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ── Accordions ────────────────────────────────────────────────────────────────
function initAccordions() {
  document.querySelectorAll(".phase-title").forEach(title => {
    title.setAttribute("role", "button");
    title.setAttribute("tabindex", "0");
    title.setAttribute("aria-expanded", "true");

    const toggle = () => {
      const group = title.closest(".phase-group");
      if (!group) return;
      const collapsing = !group.classList.contains("collapsed");
      group.classList.toggle("collapsed", collapsing);
      title.setAttribute("aria-expanded", String(!collapsing));
      const body = group.querySelector(".step-list");
      if (body) body.style.display = collapsing ? "none" : "";
    };

    title.addEventListener("click", toggle);
    title.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
  });
}

// ── Guide toolbar (search + filter) ──────────────────────────────────────────
function applyGuideFilters() {
  const query       = document.getElementById("guide-search")?.value.trim().toLowerCase() || "";
  const pendingOnly = document.getElementById("toggle-pending")?.checked;

  document.querySelectorAll(".phase-group").forEach(group => {
    let hasVisible = false;
    group.querySelectorAll(".step-item").forEach(item => {
      const cb     = item.querySelector("input.qc-check");
      const match  = !query || item.textContent.toLowerCase().includes(query);
      const pend   = !pendingOnly || !cb?.checked;
      const show   = match && pend;
      item.classList.toggle("filtered-out", !show);
      if (show) hasVisible = true;
    });
    group.classList.toggle("filtered-out", !hasVisible);
  });
}

function initGuideTools() {
  document.getElementById("guide-search")    ?.addEventListener("input",  applyGuideFilters);
  document.getElementById("toggle-pending")  ?.addEventListener("change", applyGuideFilters);

  const collapseBtn = document.getElementById("btn-collapse-all");
  collapseBtn?.addEventListener("click", () => {
    const shouldCollapse = collapseBtn.dataset.mode !== "expand";
    document.querySelectorAll(".phase-group").forEach(group => {
      group.classList.toggle("collapsed", shouldCollapse);
      const title = group.querySelector(".phase-title");
      const body  = group.querySelector(".step-list");
      title?.setAttribute("aria-expanded", String(!shouldCollapse));
      if (body) body.style.display = shouldCollapse ? "none" : "";
    });
    collapseBtn.dataset.mode  = shouldCollapse ? "expand" : "collapse";
    collapseBtn.textContent   = shouldCollapse ? "Expandir todo" : "Colapsar todo";
  });
}

// ── Reset ─────────────────────────────────────────────────────────────────────
function initReset() {
  document.getElementById("btn-reset")?.addEventListener("click", () => {
    if (!confirm("¿Seguro que quieres reiniciar todos los checks y firmas?")) return;
    localStorage.removeItem(STORAGE_KEY);
    _lastPct = 0;
    document.querySelectorAll("input.qc-check").forEach(cb => { cb.checked = false; markRowDone(cb); });
    document.querySelectorAll("input.firma-input").forEach(i => { i.value = ""; });
    updateAllProgress();
    showToast("Progreso reiniciado", "warning");
  });
}

// ── Export / Import ───────────────────────────────────────────────────────────
function initDataToolbar() {
  // Inject toolbar HTML next to btn-reset in .global-progress
  const progress = document.querySelector(".global-progress");
  if (!progress) return;

  const wrap = document.createElement("div");
  wrap.className = "data-toolbar";
  wrap.innerHTML = `
    <button class="btn-data" id="btn-export">⬇ Exportar</button>
    <button class="btn-data" id="btn-import">⬆ Importar</button>`;
  progress.appendChild(wrap);

  document.getElementById("btn-export").addEventListener("click", () => {
    const state = loadState();
    const blob  = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement("a");
    a.href      = url;
    a.download  = `aim-progress-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Progreso exportado", "success");
  });

  document.getElementById("btn-import").addEventListener("click", () => {
    const input       = document.createElement("input");
    input.type        = "file";
    input.accept      = ".json";
    input.addEventListener("change", e => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const raw = JSON.parse(ev.target.result);
          // Validate: must be a plain object with string/boolean/string values only
          if (typeof raw !== "object" || Array.isArray(raw) || raw === null) throw new Error("Invalid format");
          for (const [k, v] of Object.entries(raw)) {
            if (typeof k !== "string") throw new Error("Invalid key");
            if (typeof v !== "boolean" && typeof v !== "string") throw new Error("Invalid value");
          }
          saveState(raw);
          _lastPct = 0;
          // Apply checkboxes
          document.querySelectorAll("input.qc-check").forEach(cb => {
            cb.checked = !!raw[cb.dataset.id];
            markRowDone(cb);
          });
          document.querySelectorAll("input.firma-input").forEach(i => {
            i.value = raw[i.dataset.id] || "";
          });
          updateAllProgress();
          showToast("Progreso importado correctamente", "success");
        } catch {
          showToast("Archivo inválido — no se importó", "warning");
        }
      };
      reader.readAsText(file);
    });
    input.click();
  });
}

// ── Keyboard shortcuts ────────────────────────────────────────────────────────
function initKeyboardShortcuts() {
  const tabIds = ["tab-componentes", "tab-fases", "tab-guia", "tab-piezas-3d"];

  document.addEventListener("keydown", e => {
    // Skip if typing in an input
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= tabIds.length) {
      const btn = document.querySelector(`nav.tabs button[data-tab="${tabIds[n - 1]}"]`);
      btn?.click();
    }
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initCheckboxes();
  initFirmaInputs();
  initAccordions();
  initGuideTools();
  applyGuideFilters();
  initReset();
  initDataToolbar();
  initKeyboardShortcuts();
});
