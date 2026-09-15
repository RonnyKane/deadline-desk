/**
 * Shared data layer used by the human UI, Alexa+ simulator, and WebMCP tools.
 * All reads/mutations go through the Worker /api routes against the same store.
 */

async function getJson(path, options = {}) {
  const res = await fetch(path, {
    headers: { Accept: "application/json", "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || `Request failed (${res.status})`);
    err.detail = body;
    throw err;
  }
  return body;
}

export async function listUpcomingDeadlines(args = {}) {
  const params = new URLSearchParams();
  const days = args.days ?? args.days_ahead ?? 90;
  params.set("days", String(days));
  if (args.category) params.set("category", args.category);
  if (args.include_handled) params.set("include_handled", "true");
  if (args.q) params.set("q", args.q);
  if (args.limit) params.set("limit", String(args.limit));
  return getJson(`/api/deadlines?${params}`);
}

export async function getDeadlineDetail(args = {}) {
  const id = args.id || args.deadline_id || "";
  if (!id) throw new Error("id is required");
  return getJson(`/api/detail?id=${encodeURIComponent(id)}`);
}

export async function markHandled(args = {}) {
  const id = args.id || args.deadline_id || "";
  if (!id) throw new Error("id is required");
  return getJson("/api/mark-handled", {
    method: "POST",
    body: JSON.stringify({
      id,
      renewed: Boolean(args.renewed),
      note: args.note || undefined,
    }),
  });
}

export async function suggestPrepChecklist(args = {}) {
  const id = args.id || args.deadline_id || "";
  if (!id) throw new Error("id is required");
  return getJson(`/api/checklist?id=${encodeURIComponent(id)}`);
}

export async function getHealth() {
  return getJson("/api/health");
}

export const TOOL_NAMES = [
  "list_upcoming_deadlines",
  "get_deadline_detail",
  "mark_handled",
  "suggest_prep_checklist",
];

export async function invokeDeskTool(name, args = {}) {
  let result;
  if (name === "list_upcoming_deadlines") result = await listUpcomingDeadlines(args);
  else if (name === "get_deadline_detail") result = await getDeadlineDetail(args);
  else if (name === "mark_handled") result = await markHandled(args);
  else if (name === "suggest_prep_checklist") result = await suggestPrepChecklist(args);
  else throw new Error(`Unknown tool ${name}`);

  window.dispatchEvent(
    new CustomEvent("deadline-desk:tool", {
      detail: { name, args, result, at: new Date().toISOString() },
    }),
  );
  return result;
}
