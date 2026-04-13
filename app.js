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
    title.setAttribute("role", "button");
    title.setAttribute("tabindex", "0");
    title.setAttribute("aria-expanded", "true");

    const toggleGroup = () => {
      const group = title.closest(".phase-group");
      if (!group) return;
      group.classList.toggle("collapsed");
      const isExpanded = !group.classList.contains("collapsed");
      title.setAttribute("aria-expanded", String(isExpanded));
      const body = group.querySelector(".step-list");
      if (body) {
        body.style.display = isExpanded ? "" : "none";
      }
    };

    title.addEventListener("click", toggleGroup);
    title.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleGroup();
      }
    });
  });
}

function applyGuideFilters() {
  const searchInput = document.getElementById("guide-search");
  const pendingOnly = document.getElementById("toggle-pending")?.checked;
  const query = searchInput?.value.trim().toLowerCase() || "";

  document.querySelectorAll(".phase-group").forEach((group) => {
    let groupHasVisibleItems = false;

    group.querySelectorAll(".step-item").forEach((item) => {
      const stepCheck = item.querySelector("input.qc-check");
      const itemText = item.textContent.toLowerCase();
      const matchQuery = !query || itemText.includes(query);
      const matchPending = !pendingOnly || !stepCheck?.checked;
      const isVisible = matchQuery && matchPending;

      item.classList.toggle("filtered-out", !isVisible);
      if (isVisible) groupHasVisibleItems = true;
    });

    group.classList.toggle("filtered-out", !groupHasVisibleItems);
  });
}

function initGuideTools() {
  const searchInput = document.getElementById("guide-search");
  const pendingToggle = document.getElementById("toggle-pending");
  const collapseBtn = document.getElementById("btn-collapse-all");

  searchInput?.addEventListener("input", applyGuideFilters);
  pendingToggle?.addEventListener("change", applyGuideFilters);

  collapseBtn?.addEventListener("click", () => {
    const groups = document.querySelectorAll(".phase-group");
    const shouldCollapse = collapseBtn.dataset.mode !== "expand";

    groups.forEach((group) => {
      group.classList.toggle("collapsed", shouldCollapse);
      const title = group.querySelector(".phase-title");
      const body = group.querySelector(".step-list");
      if (title) title.setAttribute("aria-expanded", String(!shouldCollapse));
      if (body) body.style.display = shouldCollapse ? "none" : "";
    });

    collapseBtn.dataset.mode = shouldCollapse ? "expand" : "collapse";
    collapseBtn.textContent = shouldCollapse ? "Expandir todo" : "Colapsar todo";
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
  initGuideTools();
  applyGuideFilters();
  initReset();
});
