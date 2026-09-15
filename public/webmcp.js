import { invokeDeskTool, TOOL_NAMES } from "./data.js";

export function getModelContext() {
  if (typeof document !== "undefined" && document.modelContext) return document.modelContext;
  if (typeof navigator !== "undefined" && navigator.modelContext) return navigator.modelContext;
  return null;
}

function mcpResult(payload) {
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
  };
}

export const TOOL_DEFS = [
  {
    name: "list_upcoming_deadlines",
    description:
      "List upcoming hard deadlines and renewals on Deadline Desk (Florida landlord + small dealer ops). Categories: insurance, lease, registration, license, vendor, other. Returns the same rows the human board shows.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        days: {
          type: "integer",
          minimum: 1,
          maximum: 730,
          description: "How far ahead to look, in days. Default 90.",
        },
        category: {
          type: "string",
          enum: ["insurance", "lease", "registration", "license", "vendor", "other", "all"],
          description: "Filter by category. Default all.",
        },
        include_handled: {
          type: "boolean",
          description: "If true, include already handled/renewed rows.",
        },
        q: { type: "string", description: "Optional free-text filter." },
        limit: { type: "integer", minimum: 1, maximum: 200, description: "Max rows. Default 100." },
      },
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    async execute(args = {}) {
      return mcpResult(await invokeDeskTool("list_upcoming_deadlines", args || {}));
    },
  },
  {
    name: "get_deadline_detail",
    description:
      "Get one deadline by id from Deadline Desk. Highlights that row in the UI. Use an id from list_upcoming_deadlines.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["id"],
      properties: {
        id: { type: "string", description: "Deadline id, e.g. dl-ins-auto-dealer." },
      },
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    async execute(args = {}) {
      return mcpResult(await invokeDeskTool("get_deadline_detail", args || {}));
    },
  },
  {
    name: "mark_handled",
    description:
      "Mark a deadline as handled or renewed. Updates the shared in-memory store and the UI. Note: Worker cold starts re-seed demo data.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["id"],
      properties: {
        id: { type: "string", description: "Deadline id." },
        renewed: { type: "boolean", description: "If true, status becomes renewed instead of handled." },
        note: { type: "string", description: "Optional note appended to the row." },
      },
    },
    annotations: { readOnlyHint: false, openWorldHint: false },
    async execute(args = {}) {
      return mcpResult(await invokeDeskTool("mark_handled", args || {}));
    },
  },
  {
    name: "suggest_prep_checklist",
    description:
      "Suggest 2–5 concrete prep steps for a deadline type (insurance, lease, registration, license, vendor, other). Same checklist the human detail panel can show.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["id"],
      properties: {
        id: { type: "string", description: "Deadline id from list_upcoming_deadlines." },
      },
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    async execute(args = {}) {
      return mcpResult(await invokeDeskTool("suggest_prep_checklist", args || {}));
    },
  },
];

export async function registerWebMcpTools() {
  const ctx = getModelContext();
  const status = {
    supported: Boolean(ctx && typeof ctx.registerTool === "function"),
    registered: [],
    error: null,
    surface: document.modelContext
      ? "document.modelContext"
      : navigator.modelContext
        ? "navigator.modelContext"
        : null,
  };

  if (!status.supported) return status;

  const controller = new AbortController();
  window.__deadlineDeskAbort = controller;

  try {
    for (const tool of TOOL_DEFS) {
      await ctx.registerTool(tool, { signal: controller.signal });
      status.registered.push(tool.name);
    }
  } catch (err) {
    status.error = err instanceof Error ? err.message : String(err);
  }

  return status;
}

export { TOOL_NAMES };
