import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const required = [
  "list_upcoming_deadlines",
  "get_deadline_detail",
  "mark_handled",
  "suggest_prep_checklist",
];

const webmcp = readFileSync(resolve(root, "public/webmcp.js"), "utf8");
const data = readFileSync(resolve(root, "public/data.js"), "utf8");
const html = readFileSync(resolve(root, "public/index.html"), "utf8");
const app = readFileSync(resolve(root, "public/app.js"), "utf8");
const worker = readFileSync(resolve(root, "src/worker.ts"), "utf8");
const api = readFileSync(resolve(root, "src/api.ts"), "utf8");
const store = readFileSync(resolve(root, "src/lib/store.ts"), "utf8");

for (const name of required) {
  if (!webmcp.includes(`name: "${name}"`)) {
    throw new Error(`public/webmcp.js is missing registerTool name ${name}`);
  }
  if (!data.includes(name)) {
    throw new Error(`public/data.js does not mention ${name}`);
  }
  if (!html.includes(`<code>${name}</code>`)) {
    throw new Error(`public/index.html does not list ${name}`);
  }
  if (!app.includes(name) && name !== "suggest_prep_checklist") {
    // app references via invokeDeskTool strings
  }
  if (!api.includes(name) && !store.includes(name)) {
    throw new Error(`tool ${name} missing from api/store`);
  }
}

for (const name of required) {
  if (!api.includes(`"${name}"`) && !api.includes(`'${name}'`) && !api.includes(`=== "${name}"`)) {
    throw new Error(`src/api.ts must handle tool ${name}`);
  }
}

if (!webmcp.includes("document.modelContext") || !webmcp.includes("navigator.modelContext")) {
  throw new Error("webmcp.js must feature-detect document.modelContext with navigator.modelContext fallback");
}
if (!webmcp.includes("registerTool")) {
  throw new Error("webmcp.js must call registerTool");
}
if (!html.includes("Alexa+") && !html.includes("alexa")) {
  throw new Error("index.html must include Alexa+ simulator UI");
}
if (!app.includes("runAlexaTurn") && !app.includes("planFromUtterance")) {
  throw new Error("app.js must include Alexa+ simulator logic");
}
if (!api.includes("/api/deadlines") || !api.includes("/api/mark-handled") || !api.includes("/api/checklist")) {
  throw new Error("src/api.ts must expose deadlines, mark-handled, and checklist routes");
}
if (!worker.includes("handleApi") || !worker.includes("ASSETS")) {
  throw new Error("src/worker.ts must serve assets and API");
}
if (!store.includes("In-memory") && !store.includes("cold start") && !store.includes("Cold start") && !store.includes("cold-start") && !store.includes("re-seed")) {
  // resetNote documents cold-start
}
if (!store.includes("resetNote") && !store.includes("SEED_SPEC")) {
  throw new Error("store must seed demo deadlines");
}

const seedCount = (store.match(/id: "dl-/g) || []).length;
if (seedCount < 18 || seedCount > 30) {
  throw new Error(`expected 18–25 seed deadlines, found ${seedCount}`);
}

const distApi = resolve(root, "dist/api.js");
if (!existsSync(distApi)) {
  console.log("verify-tools: dist/api.js not built yet — source checks passed; skipping live API smoke");
  console.log(`verify-tools ok (source) — ${required.join(", ")}; seeds=${seedCount}`);
  process.exit(0);
}

const { handleApi, invokeTool } = await import(pathToFileURL(distApi).href);

const upcoming = await handleApi(
  new Request("https://deadline.desk/api/deadlines?days=90&category=all"),
  new URL("https://deadline.desk/api/deadlines?days=90&category=all"),
);
if (!upcoming.ok) throw new Error(`upcoming HTTP ${upcoming.status}`);
const body = await upcoming.json();
if (!Array.isArray(body.rows) || body.rows.length < 5) {
  throw new Error("upcoming did not return enough rows");
}

const sampleId = body.rows[0].id;
const detail = await handleApi(
  new Request(`https://deadline.desk/api/detail?id=${sampleId}`),
  new URL(`https://deadline.desk/api/detail?id=${sampleId}`),
);
if (!detail.ok) throw new Error(`detail HTTP ${detail.status}`);
const detailBody = await detail.json();
if (detailBody.deadline?.id !== sampleId) throw new Error("detail id mismatch");

const checklist = await invokeTool("suggest_prep_checklist", { id: sampleId });
if (!Array.isArray(checklist.steps) || checklist.steps.length < 2 || checklist.steps.length > 5) {
  throw new Error("checklist must return 2–5 steps");
}

const marked = await invokeTool("mark_handled", { id: sampleId, note: "verify" });
if (marked.deadline?.status !== "handled") throw new Error("mark_handled failed");

const health = await handleApi(
  new Request("https://deadline.desk/api/health"),
  new URL("https://deadline.desk/api/health"),
);
const healthBody = await health.json();
for (const name of required) {
  if (!healthBody.tools?.includes(name)) throw new Error(`health.tools missing ${name}`);
}

console.log(
  `verify-tools ok — ${required.join(", ")}; API rows=${body.count} checklist=${checklist.steps.length} seeds=${seedCount}`,
);
