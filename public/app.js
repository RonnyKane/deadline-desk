import {
  getHealth,
  invokeDeskTool,
  listUpcomingDeadlines,
  TOOL_NAMES,
} from "./data.js";
import { registerWebMcpTools } from "./webmcp.js";

const $ = (id) => document.getElementById(id);

const state = {
  rows: [],
  selectedId: null,
  categories: [],
  lastTool: null,
  query: {
    days: 90,
    category: "all",
    include_handled: false,
    q: "",
    limit: 100,
  },
};

function daysPhrase(n) {
  if (n === 0) return "today";
  if (n === 1) return "1 day";
  if (n === -1) return "1 day ago";
  if (n < 0) return `${Math.abs(n)} days ago`;
  return `${n} days`;
}

function setPill(el, text, dataState) {
  el.textContent = text;
  if (dataState) el.dataset.state = dataState;
}

async function boot() {
  wireFilters();
  wireChat();
  window.addEventListener("deadline-desk:tool", onToolEvent);
  window.__deadlineDesk = {
    invoke: invokeDeskTool,
    tools: TOOL_NAMES,
    state,
  };

  const [health, mcp] = await Promise.all([
    getHealth().catch((err) => ({ ok: false, error: err.message })),
    registerWebMcpTools(),
  ]);

  if (health.ok) {
    setPill($("store-pill"), `${health.deadlineCount} deadlines · seed ${new Date(health.seededAt).toLocaleString()}`);
  } else {
    setPill($("store-pill"), `store error: ${health.error || "unknown"}`);
  }

  const help = $("webmcp-help");
  if (mcp.supported && mcp.registered.length === 4) {
    setPill($("webmcp-pill"), `WebMCP · ${mcp.registered.length} tools · ${mcp.surface}`, "on");
    help.textContent = "Tools registered. Alexa+ sim below still works via the same invoke path.";
  } else if (mcp.supported) {
    setPill($("webmcp-pill"), `WebMCP partial: ${mcp.error || mcp.registered.join(",")}`, "off");
    help.textContent = mcp.error || "Some tools failed to register.";
  } else {
    setPill($("webmcp-pill"), "WebMCP optional — Alexa+ sim live", "off");
    help.textContent =
      "Path B: use the Alexa+ simulator on this page. Optional: enable chrome://flags/#enable-webmcp-testing for document.modelContext.registerTool.";
  }

  setPill($("agent-pill"), "Agent idle", "idle");
  await refresh();
}

function wireFilters() {
  const form = $("filters");
  $("days").addEventListener("input", () => {
    $("days-label").textContent = `${$("days").value} days`;
  });
  const apply = () => {
    state.query.days = Number($("days").value);
    state.query.category = $("category").value;
    state.query.q = $("q").value.trim();
    state.query.include_handled = $("handled").checked;
    refresh();
  };
  form.addEventListener("change", apply);
  $("q").addEventListener("input", debounce(apply, 250));
}

async function refresh() {
  $("summary").textContent = "Refreshing the board…";
  try {
    const data = await listUpcomingDeadlines(state.query);
    state.rows = data.rows || [];
    state.categories = data.categories || [];
    renderBoard();
    const open = state.rows.filter((r) => r.status === "open");
    const first = open[0] || state.rows[0];
    $("summary").textContent = first
      ? `${data.count} in the next ${state.query.days} days. Soonest open: ${first.title} (${daysPhrase(first.daysRemaining)}).`
      : `No deadlines in the next ${state.query.days} days for this filter.`;
    if (state.selectedId && state.rows.some((r) => r.id === state.selectedId)) {
      await openRow(state.selectedId, { quiet: true });
    } else if (first) {
      state.selectedId = first.id;
      await openRow(first.id, { quiet: true });
    }
  } catch (err) {
    $("summary").textContent = `Could not load deadlines: ${err.message}`;
    $("board-list").innerHTML = `<div class="empty-board">${escapeHtml(err.message)}</div>`;
  }
}

function renderBoard() {
  const root = $("board-list");
  if (!state.rows.length) {
    root.innerHTML = `<div class="empty-board">Nothing on the desk for these filters.</div>`;
    return;
  }
  root.innerHTML = "";
  for (const row of state.rows) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "row";
    btn.dataset.id = row.id;
    btn.dataset.urgency = row.urgency;
    btn.dataset.status = row.status;
    btn.setAttribute("role", "listitem");
    if (row.id === state.selectedId) btn.classList.add("is-active");
    if (row.status !== "open") btn.classList.add("is-handled");
    btn.innerHTML = `
      <div class="days">${escapeHtml(daysPhrase(row.daysRemaining))}<small>${escapeHtml(row.dueDate)}</small></div>
      <div>
        <h3>${escapeHtml(row.title)}</h3>
        <p class="meta">${escapeHtml(row.entity)} · ${escapeHtml(row.category)} · ${escapeHtml(row.domain)}</p>
      </div>
      <div class="badges">
        <span class="badge cat">${escapeHtml(row.category)}</span>
        ${row.status !== "open" ? `<span class="badge done">${escapeHtml(row.status)}</span>` : ""}
        ${row.amountHint ? `<span class="badge">${escapeHtml(row.amountHint)}</span>` : ""}
      </div>
    `;
    btn.addEventListener("click", () => openRow(row.id));
    root.appendChild(btn);
  }
}

async function openRow(id, opts = {}) {
  const row = state.rows.find((r) => r.id === id) || null;
  state.selectedId = id;
  for (const el of document.querySelectorAll(".row")) {
    el.classList.toggle("is-active", el.dataset.id === id);
  }

  let detail = row;
  if (!detail) {
    try {
      const res = await invokeDeskTool("get_deadline_detail", { id });
      detail = res.deadline;
    } catch {
      return;
    }
  }

  $("detail-title").textContent = detail.title;
  $("detail-body").textContent = `${detail.consequence} Due ${detail.dueDate} (${daysPhrase(detail.daysRemaining)}).`;
  const dl = $("detail-dl");
  dl.hidden = false;
  dl.innerHTML = [
    ["Id", detail.id],
    ["Category", detail.category],
    ["Entity", detail.entity],
    ["Domain", detail.domain],
    ["Due", detail.dueDate],
    ["Status", detail.status],
    ["Amount", detail.amountHint || "—"],
    ["Source", detail.source],
    ["Notes", detail.notes],
  ]
    .map(([k, v]) => `<dt>${k}</dt><dd>${escapeHtml(String(v))}</dd>`)
    .join("");

  $("detail-actions").hidden = false;
  $("btn-handled").onclick = async () => {
    await invokeDeskTool("mark_handled", { id: detail.id });
  };
  $("btn-renewed").onclick = async () => {
    await invokeDeskTool("mark_handled", { id: detail.id, renewed: true });
  };
  $("btn-checklist").onclick = async () => {
    const res = await invokeDeskTool("suggest_prep_checklist", { id: detail.id });
    showChecklist(res);
  };

  if (!opts.quiet) {
    $("detail").scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

function showChecklist(res) {
  const box = $("checklist");
  box.hidden = false;
  const steps = (res.steps || []).map((s) => `<li>${escapeHtml(s)}</li>`).join("");
  box.innerHTML = `<p class="path-to">Prep · ${escapeHtml(res.title || "")}</p><ol>${steps}</ol><p class="meta">${escapeHtml(res.note || "")}</p>`;
}

function onToolEvent(event) {
  const { name, args, result, at } = event.detail || {};
  state.lastTool = { name, args, at };
  setPill($("agent-pill"), `Last tool: ${name}`, "on");

  const log = $("agent-log");
  const li = document.createElement("li");
  const when = at ? new Date(at).toLocaleTimeString() : "";
  let summary = "";
  if (result?.count != null) summary = `${result.count} rows`;
  else if (result?.deadline?.title) summary = result.deadline.title;
  else if (result?.title) summary = result.title;
  else if (result?.steps) summary = `${result.steps.length} steps`;
  li.innerHTML = `<time>${escapeHtml(when)}</time><code>${escapeHtml(name)}</code> ${escapeHtml(JSON.stringify(args || {}))} <span>${escapeHtml(String(summary))}</span>`;
  if (log.querySelector(".empty")) log.innerHTML = "";
  log.prepend(li);

  if (name === "list_upcoming_deadlines" && result?.rows) {
    if (result.query?.days) {
      $("days").value = result.query.days;
      $("days-label").textContent = `${result.query.days} days`;
      state.query.days = result.query.days;
    }
    if (result.query?.category) {
      $("category").value = result.query.category;
      state.query.category = result.query.category;
    }
    state.rows = result.rows;
    renderBoard();
    $("summary").textContent = `Agent listed ${result.count} deadlines.`;
  }

  if (name === "get_deadline_detail" && result?.deadline) {
    const d = result.deadline;
    if (!state.rows.some((r) => r.id === d.id)) {
      state.rows = [d, ...state.rows];
      renderBoard();
    }
    openRow(d.id, { quiet: false });
  }

  if (name === "mark_handled" && result?.deadline) {
    const d = result.deadline;
    const idx = state.rows.findIndex((r) => r.id === d.id);
    if (idx >= 0) state.rows[idx] = d;
    else state.rows.unshift(d);
    if (!state.query.include_handled) {
      state.rows = state.rows.filter((r) => r.status === "open" || r.id === d.id);
    }
    renderBoard();
    openRow(d.id, { quiet: true });
    appendChat("assistant", `Marked **${d.title}** as ${d.status}.`);
  }

  if (name === "suggest_prep_checklist" && result?.steps) {
    showChecklist(result);
    if (result.id) {
      state.selectedId = result.id;
      for (const el of document.querySelectorAll(".row")) {
        el.classList.toggle("is-active", el.dataset.id === result.id);
      }
    }
  }
}

/* ——— Alexa+ simulator ——— */
function wireChat() {
  const form = $("chat-form");
  const input = $("chat-input");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    appendChat("user", text);
    await runAlexaTurn(text);
  });
  for (const chip of document.querySelectorAll("[data-chip]")) {
    chip.addEventListener("click", async () => {
      const text = chip.getAttribute("data-chip");
      appendChat("user", text);
      await runAlexaTurn(text);
    });
  }
}

function appendChat(role, text) {
  const log = $("chat-log");
  const div = document.createElement("div");
  div.className = `bubble ${role}`;
  div.innerHTML = formatChat(text);
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function formatChat(text) {
  return escapeHtml(text)
    .replaceAll("**", "")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

async function runAlexaTurn(text) {
  const thinking = document.createElement("div");
  thinking.className = "bubble assistant thinking";
  thinking.textContent = "Alexa+ (sim) · calling tools…";
  $("chat-log").appendChild(thinking);

  try {
    const plan = planFromUtterance(text, state);
    const parts = [];
    for (const step of plan.steps) {
      const result = await invokeDeskTool(step.name, step.args);
      parts.push({ step, result });
    }
    thinking.remove();
    appendChat("assistant", renderAlexaReply(plan, parts));
  } catch (err) {
    thinking.remove();
    appendChat("assistant", `I hit a snag: ${err.message}`);
  }
}

function planFromUtterance(text, st) {
  const t = text.toLowerCase();
  const category = detectCategory(t);
  const days = detectDays(t) ?? st.query.days ?? 90;
  const selected = st.selectedId;

  if (/\b(mark|handled|done|renewed|complete)\b/.test(t)) {
    const id = extractId(t) || selected;
    if (!id) {
      return {
        intent: "need_id",
        steps: [{ name: "list_upcoming_deadlines", args: { days: 30, category: category || "all" } }],
      };
    }
    return {
      intent: "mark",
      steps: [{ name: "mark_handled", args: { id, renewed: /\brenew/.test(t) } }],
    };
  }

  if (/\b(checklist|prep|steps|what do i need|how do i)\b/.test(t)) {
    const id = extractId(t) || selected;
    if (!id) {
      return {
        intent: "list_then_hint",
        steps: [{ name: "list_upcoming_deadlines", args: { days, category: category || "all" } }],
      };
    }
    return {
      intent: "checklist",
      steps: [
        { name: "get_deadline_detail", args: { id } },
        { name: "suggest_prep_checklist", args: { id } },
      ],
    };
  }

  if (/\b(detail|open|tell me about|what about|show)\b/.test(t) || extractId(t)) {
    const id = extractId(t) || selected;
    if (id) {
      return { intent: "detail", steps: [{ name: "get_deadline_detail", args: { id } }] };
    }
  }

  return {
    intent: "list",
    steps: [
      {
        name: "list_upcoming_deadlines",
        args: { days, category: category || "all", q: softQuery(t) },
      },
    ],
  };
}

function detectCategory(t) {
  for (const c of ["insurance", "lease", "registration", "license", "vendor", "other"]) {
    if (t.includes(c) || (c === "registration" && /\b(tags?|plates?|reg)\b/.test(t))) return c;
    if (c === "license" && /\blicen[cs]e\b/.test(t)) return c;
  }
  return null;
}

function detectDays(t) {
  const m = t.match(/\b(\d{1,3})\s*days?\b/);
  if (m) return Number(m[1]);
  if (/\b(this )?week\b/.test(t)) return 7;
  if (/\b(this )?month\b/.test(t)) return 30;
  if (/\bquarter\b|\b90\b/.test(t)) return 90;
  if (/\byear\b/.test(t)) return 365;
  return null;
}

function extractId(t) {
  const m = t.match(/\b(dl-[a-z0-9-]+)\b/i);
  return m ? m[1] : null;
}

function softQuery(t) {
  const cleaned = t
    .replace(/what|which|show|list|upcoming|deadlines?|renewals?|in the next|please|alexa/gi, " ")
    .replace(/\b\d+\s*days?\b/gi, " ")
    .replace(/\b(insurance|lease|registration|license|vendor|other|all)\b/gi, " ")
    .trim();
  return cleaned.length > 2 ? cleaned : undefined;
}

function renderAlexaReply(plan, parts) {
  if (plan.intent === "list" || plan.intent === "list_then_hint" || plan.intent === "need_id") {
    const result = parts[0]?.result;
    const rows = result?.rows || [];
    if (!rows.length) return `Nothing upcoming in that window. Try a wider days filter.`;
    const lines = rows.slice(0, 6).map(
      (r) => `• ${r.title} — ${r.dueDate} (${daysPhrase(r.daysRemaining)}) [${r.id}]`,
    );
    let msg = `Here are ${rows.length} upcoming deadlines:\n${lines.join("\n")}`;
    if (rows.length > 6) msg += `\n…and ${rows.length - 6} more on the board.`;
    if (plan.intent === "list_then_hint" || plan.intent === "need_id") {
      msg += `\nPick one (say its id) for a checklist or to mark handled.`;
    }
    return msg;
  }
  if (plan.intent === "detail") {
    const d = parts[0]?.result?.deadline;
    if (!d) return "I couldn't find that deadline.";
    return `${d.title} is due ${d.dueDate} (${daysPhrase(d.daysRemaining)}). ${d.consequence} Status: ${d.status}.`;
  }
  if (plan.intent === "checklist") {
    const check = parts.find((p) => p.step.name === "suggest_prep_checklist")?.result;
    if (!check) return "No checklist available.";
    return `Prep for ${check.title}:\n${(check.steps || []).map((s, i) => `${i + 1}. ${s}`).join("\n")}`;
  }
  if (plan.intent === "mark") {
    const d = parts[0]?.result?.deadline;
    return d ? `Done — ${d.title} is now ${d.status}.` : "Could not mark that row.";
  }
  return "Done.";
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

boot();
