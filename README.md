# Deadline Desk

Hard deadlines and renewals board for a **Florida landlord + small dealer**. One Cloudflare-hosted page is the source of truth for humans **and** a simulated Alexa+ agent.

**Contest:** [Amazon Developer Hackathon 2026](https://amazonappdev2026.devpost.com/) — Alexa+ track, **Path B** (simulated Alexa+ web app first).  
**Live:** https://deadline-desk.oldhambyron.workers.dev  
**Demo:** https://youtu.be/BQkXYTpgLiY  
**Repo:** https://github.com/RonnyKane/deadline-desk  
**License:** MIT  
**Stack:** Cloudflare Worker + static assets (`./public`), esbuild, wrangler 4.34.x (Node 20).

---

## What it is

- **Human** browses/filters upcoming cutoffs: insurance, lease, registration/tags, license, vendor contracts, other.
- **Alexa+ simulator** on the same page calls real tools against the **same** Worker API / in-memory store.
- Optional **WebMCP** `document.modelContext.registerTool` when the browser supports it (Chrome flag / ChatGPT in-app browser).

### Tools (real, not stubs)

| Tool | Purpose |
|---|---|
| `list_upcoming_deadlines` | `days` (default 90), `category`: insurance\|lease\|registration\|license\|vendor\|other\|all |
| `get_deadline_detail` | `id` — UI highlights that row |
| `mark_handled` | mark handled / renewed — UI updates |
| `suggest_prep_checklist` | 2–5 concrete prep steps for that type |

### Data layer

- 24 realistic seed deadlines with **dates relative to today**.
- **In-memory** store on the Worker isolate. Mutations survive until cold start; cold start re-seeds (documented in `/api/health` → `resetNote`).
- `POST /api/reset` re-seeds without waiting for eviction.

---

## Local run

```bash
cd /workspace/deadline-desk   # or your clone
npm install
npm run build                 # esbuild + verify-tools
npm run dev                   # wrangler dev (preferred)
# or, after build:
npm run dev:node              # Node static+API on :8788
```

Open the URL wrangler prints (usually `http://127.0.0.1:8787`) or `http://127.0.0.1:8788` for `dev:node`.

### Scripts

| Script | What |
|---|---|
| `npm run build` | Bundle worker + api; run verify |
| `npm test` / `npm run verify` | Confirm four tool names in page/API; smoke API |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run deploy` | `wrangler deploy` (needs Cloudflare auth) |

---

## How to demo (human + agent)

1. Open the live page (or local). Dark board loads ~20+ deadlines.
2. **Human:** filter category = Insurance, open a row, click **Prep checklist**.
3. **Agent:** in the Alexa+ panel, click **30-day renewals** or type *What renews in the next 30 days?*
4. Watch **Agent activity** + the **Last tool** pill; the board updates from the same tool results.
5. Say *Mark the selected deadline handled* — row dims / status updates.
6. Optional: DevTools `await window.__deadlineDesk.invoke('list_upcoming_deadlines', { days: 30 })`.

See [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) for a timed ≤3 min narration. Deploy notes: [DEPLOY.md](./DEPLOY.md).

---

## API (shared)

- `GET /api/health`
- `GET /api/deadlines?days=90&category=all`
- `GET /api/detail?id=dl-…`
- `POST /api/mark-handled` `{ id, renewed?, note? }`
- `GET /api/checklist?id=dl-…`
- `POST /api/tools` `{ name, …args }` or `/api/tools/:name`
- `POST /api/reset` — re-seed demo data

---

## Project layout

```
deadline-desk/
  public/           # UI, Alexa+ sim, WebMCP, styles
  src/worker.ts     # Worker fetch + assets binding
  src/api.ts        # /api/* + tool invoke
  src/lib/store.ts  # seed + in-memory mutations
  src/lib/checklists.ts
  scripts/build.mjs, verify-tools.mjs, dev-server.mjs
  wrangler.jsonc
```

Mirrors EOL Desk patterns (Worker + `assets` → `./public` + esbuild) but is a **new** project. Do not edit `/workspace/eol-desk`.

---

## Status

| Item | Value |
|---|---|
| Live URL | https://deadline-desk.oldhambyron.workers.dev |
| Public repo | https://github.com/RonnyKane/deadline-desk |
| Demo video | https://youtu.be/BQkXYTpgLiY |
| Contest | [Amazon Developer Hackathon 2026](https://amazonappdev2026.devpost.com/) — Alexa+ Path B · submit by Oct 23 2026 |
| Tool names | `list_upcoming_deadlines`, `get_deadline_detail`, `mark_handled`, `suggest_prep_checklist` |
