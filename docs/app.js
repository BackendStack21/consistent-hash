import { JumpConsistentHash } from "./jch.js";

// Storage keys
const STORE_KEY = "jch_entries_v1";
const STORE_SLOTS = "jch_default_slots_v1";

// Elements
const keyInput = document.getElementById("keyInput");
const slotsInput = document.getElementById("slotsInput");
const liveKey = document.getElementById("liveKey");
const liveIndex = document.getElementById("liveIndex");
const liveSlots = document.getElementById("liveSlots");
const clearAllBtn = document.getElementById("clearAllBtn");
const enterBtn = document.getElementById("enterBtn");
const entriesBody = document.getElementById("entriesBody");

let jch = new JumpConsistentHash(5);
let entries = [];

// Helpers to safely read/write value on native HTML inputs
const getValueSafely = (el) => {
  if (!el) return "";
  return el.value || "";
};

const setValueSafely = (el, v) => {
  if (!el) return;
  el.value = v;
};

function loadSession() {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    entries = raw ? JSON.parse(raw) : [];
  } catch {
    entries = [];
  }
  const savedSlots = parseInt(sessionStorage.getItem(STORE_SLOTS) || "5", 10);
  if (Number.isInteger(savedSlots) && savedSlots > 0) {
    setValueSafely(slotsInput, String(savedSlots));
    jch.setIndexes(savedSlots);
    liveSlots.textContent = String(savedSlots);
  }
}

function saveSession() {
  sessionStorage.setItem(STORE_KEY, JSON.stringify(entries));
  sessionStorage.setItem(STORE_SLOTS, String(jch.size()));
}

function fmtWhen(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderTable() {
  if (!entries.length) {
    entriesBody.innerHTML =
      '<tr class="empty"><td colspan="5">No entries yet. Type a key and press Enter or click Record.</td></tr>';
    return;
  }
  const rows = entries
    .slice()
    .sort((a, b) => b.ts - a.ts) // DESC
    .map(
      (e) => `
      <tr>
        <td class="key-cell" title="${e.key}">${escapeHtml(e.key)}</td>
        <td class="slots-cell">${e.slots}</td>
        <td class="index-cell"><span class="index-pill">${e.index}</span></td>
        <td class="when-cell">${fmtWhen(e.ts)}</td>
        <td class="action-cell"><md-icon-button aria-label="Remove entry" data-id="${
          e.id
        }"><md-icon>close</md-icon></md-icon-button></td>
      </tr>
    `
    )
    .join("");
  entriesBody.innerHTML = rows;
  // Hook delete buttons
  entriesBody.querySelectorAll("md-icon-button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      removeEntry(id);
    });
  });
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function updateLive() {
  const key = getValueSafely(keyInput).trim();
  const slots = parseInt(getValueSafely(slotsInput) || "5", 10);
  liveKey.textContent = key || "—";
  liveSlots.textContent = String(slots > 0 ? slots : 5);
  if (!key || !Number.isInteger(slots) || slots <= 0) {
    liveIndex.textContent = "—";
    return;
  }
  try {
    jch.setIndexes(slots);
    const idx = await jch.getIndex(key);
    liveIndex.textContent = String(idx);
  } catch (e) {
    liveIndex.textContent = "—";
  }
}

async function commitEntry() {
  const key = getValueSafely(keyInput).trim();
  const slots = parseInt(getValueSafely(slotsInput) || "5", 10);
  if (!key || !Number.isInteger(slots) || slots <= 0) return;
  jch.setIndexes(slots);
  const index = await jch.getIndex(key);
  const ts = Date.now();
  entries.push({ id: `${ts}-${Math.random().toString(36).slice(2)}`, key, slots, index, ts });
  saveSession();
  renderTable();
}

function removeEntry(id) {
  entries = entries.filter((e) => e.id !== id);
  saveSession();
  renderTable();
}

function clearAll() {
  entries = [];
  // reset slots to default 5
  jch.setIndexes(5);
  setValueSafely(slotsInput, "5");
  liveSlots.textContent = "5";
  sessionStorage.setItem(STORE_SLOTS, "5");
  saveSession();
  renderTable();
}

// Events
keyInput.addEventListener("input", updateLive);
keyInput.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    await commitEntry();
    keyInput.select();
  }
});
slotsInput.addEventListener("input", async () => {
  // sanitize
  let v = parseInt(getValueSafely(slotsInput) || "5", 10);
  if (!Number.isInteger(v) || v <= 0) v = 5;
  setValueSafely(slotsInput, String(v));
  jch.setIndexes(v);
  liveSlots.textContent = String(v);
  sessionStorage.setItem(STORE_SLOTS, String(v));
  await updateLive();
});
clearAllBtn.addEventListener("click", clearAll);

// Record button event listener for all interaction types
if (enterBtn) {
  // Handle click events (mouse and touch)
  enterBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    await commitEntry();
    keyInput.select();
  });
}

// Init
loadSession();
renderTable();
updateLive();
