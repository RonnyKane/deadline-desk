import { suggestPrepChecklist } from "./lib/checklists.ts";
import {
  TOOL_NAMES,
  ensureStore,
  getDeadline,
  listUpcoming,
  markHandled,
  resetStore,
  utcToday,
} from "./lib/store.ts";
import type { ListUpcomingArgs } from "./lib/types.ts";

export async function handleApi(request: Request, url: URL): Promise<Response> {
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const method = request.method.toUpperCase();

  if (path === "/api/health") {
    const s = ensureStore();
    return json({
      ok: true,
      service: "deadline-desk",
      tools: [...TOOL_NAMES],
      today: utcToday(),
      seededAt: s.seededAt,
      deadlineCount: s.items.size,
      resetNote: s.resetNote,
      hackathon: "Amazon Alexa+ Path B (simulated)",
    });
  }

  if (path === "/api/reset" && (method === "POST" || method === "GET")) {
    const result = resetStore();
    return json({ ok: true, ...result, today: utcToday() });
  }

  if (path === "/api/deadlines" || path === "/api/upcoming") {
    const args = parseListArgs(url.searchParams);
    return json(listUpcoming(args));
  }

  if (path === "/api/detail" || path.startsWith("/api/deadlines/")) {
    const id =
      url.searchParams.get("id") ||
      (path.startsWith("/api/deadlines/") ? path.slice("/api/deadlines/".length).split("/")[0] : "");
    if (!id) return json({ error: "Missing id." }, 400);
    const row = getDeadline(id);
    if (!row) return json({ error: `Unknown deadline "${id}".`, hint: "Use an id from list_upcoming_deadlines." }, 404);
    return json({ today: utcToday(), deadline: row });
  }

  if (path === "/api/mark-handled" || path === "/api/handled") {
    if (method !== "POST" && method !== "GET") return json({ error: "POST preferred." }, 405);
    let id = url.searchParams.get("id") || "";
    let renewed = truthy(url.searchParams.get("renewed"));
    let note = url.searchParams.get("note") || undefined;
    if (method === "POST") {
      const body = await readJson(request);
      id = String(body.id || id || "");
      renewed = Boolean(body.renewed ?? renewed);
      note = body.note != null ? String(body.note) : note;
    }
    if (!id) return json({ error: "Missing id." }, 400);
    const result = markHandled(id, { renewed, note });
    if (!result.ok) return json({ error: result.error }, 404);
    return json({ ok: true, today: utcToday(), deadline: result.row });
  }

  if (path === "/api/checklist") {
    const id = url.searchParams.get("id") || "";
    if (!id) return json({ error: "Missing id." }, 400);
    const row = getDeadline(id);
    if (!row) return json({ error: `Unknown deadline "${id}".` }, 404);
    return json({ today: utcToday(), ...suggestPrepChecklist(row) });
  }

  // Unified tool invoke for Alexa+ sim + WebMCP clients
  if (path === "/api/tools" || path.startsWith("/api/tools/")) {
    const nameFromPath = path.startsWith("/api/tools/") ? path.slice("/api/tools/".length) : "";
    let name = nameFromPath || url.searchParams.get("name") || "";
    let args: Record<string, unknown> = {};
    url.searchParams.forEach((value, key) => {
      if (key !== "name") args[key] = value;
    });
    if (method === "POST") {
      const body = await readJson(request);
      name = String(body.name || name || "");
      args = { ...(body.args && typeof body.args === "object" ? body.args : body) };
      delete args.name;
    }
    if (!name) {
      return json({ error: "Missing tool name.", tools: [...TOOL_NAMES] }, 400);
    }
    try {
      const result = await invokeTool(name, args);
      return json({ ok: true, tool: name, result });
    } catch (err) {
      const message = err instanceof Error ? err.message : "tool error";
      const status = message.startsWith("Unknown tool") ? 400 : 404;
      return json({ error: message }, status);
    }
  }

  return json({ error: "Not found." }, 404);
}

export async function invokeTool(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
  if (name === "list_upcoming_deadlines") {
    return listUpcoming({
      days: num(args.days ?? args.days_ahead),
      category: (args.category as ListUpcomingArgs["category"]) || "all",
      include_handled: Boolean(args.include_handled),
      q: args.q != null ? String(args.q) : undefined,
      limit: num(args.limit),
    });
  }

  if (name === "get_deadline_detail") {
    const id = String(args.id || args.deadline_id || "");
    if (!id) throw new Error("id is required");
    const row = getDeadline(id);
    if (!row) throw new Error(`Unknown deadline "${id}".`);
    return { today: utcToday(), deadline: row };
  }

  if (name === "mark_handled") {
    const id = String(args.id || args.deadline_id || "");
    if (!id) throw new Error("id is required");
    const result = markHandled(id, {
      renewed: Boolean(args.renewed),
      note: args.note != null ? String(args.note) : undefined,
    });
    if (!result.ok) throw new Error(result.error);
    return { ok: true, today: utcToday(), deadline: result.row };
  }

  if (name === "suggest_prep_checklist") {
    const id = String(args.id || args.deadline_id || "");
    if (!id) throw new Error("id is required");
    const row = getDeadline(id);
    if (!row) throw new Error(`Unknown deadline "${id}".`);
    return { today: utcToday(), ...suggestPrepChecklist(row) };
  }

  throw new Error(`Unknown tool ${name}`);
}

function parseListArgs(params: URLSearchParams): ListUpcomingArgs {
  return {
    days: num(params.get("days") || params.get("days_ahead")),
    category: (params.get("category") as ListUpcomingArgs["category"]) || "all",
    include_handled: truthy(params.get("include_handled")),
    q: params.get("q") || params.get("query") || undefined,
    limit: num(params.get("limit")),
  };
}

function num(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function truthy(value: string | null): boolean {
  if (!value) return false;
  return value === "1" || value.toLowerCase() === "true" || value.toLowerCase() === "yes";
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const text = await request.text();
    if (!text) return {};
    const parsed = JSON.parse(text) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Origin-Agent-Cluster": "?1",
      "X-Content-Type-Options": "nosniff",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
