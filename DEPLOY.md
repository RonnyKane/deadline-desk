# Deploy Deadline Desk (Cloudflare)

Do **not** create Devpost/Amazon accounts from the build agent. Cloudflare auth may need a human (`wrangler login`).

## Prerequisites

- Node 20+
- Cloudflare account
- `npx wrangler login` (or API token in CI)

## Build locally first

```bash
cd deadline-desk
npm install
npm run build
npm test
```

Confirm: four tool names verified; API smoke passes.

## Worker deploy (assets binding)

`wrangler.jsonc` already points `main` at `src/worker.ts` and `assets.directory` at `./public`.

```bash
npm run deploy
# same as: npx wrangler deploy
```

Wrangler prints the `*.workers.dev` URL. That URL is judge-ready for Path B.

**Current live:** https://deadline-desk.oldhambyron.workers.dev  
**Repo:** https://github.com/RonnyKane/deadline-desk  
**Demo video:** https://youtu.be/BQkXYTpgLiY

### Optional: custom domain

In the Cloudflare dashboard → Workers → deadline-desk → Triggers → Custom Domains.

## Pages vs Workers

This MVP is a **Worker with static assets** (same pattern as EOL Desk). You do **not** need a separate Pages project unless you prefer it.

If you ever switch to Pages:

1. Keep `/api/*` on a Worker or Pages Functions.
2. Publish `public/` as the static root.
3. Ensure SPA fallback still serves `index.html`.

`npm run deploy` (Worker) is the intended path.

## Post-deploy checklist

- [ ] `GET https://<host>/api/health` → `ok: true`, four tools listed
- [ ] Open `/` → board loads, dark UI
- [ ] Alexa+ chip “30-day renewals” returns rows
- [ ] `mark_handled` updates UI (remember: cold start resets store)
- [ ] Paste live URL into Devpost when Joseph submits

## Cold-start note (demo honesty)

Mutations live in Worker memory. After idle eviction, seed data returns with dates relative to **that** day’s “today”. Call `POST /api/reset` to re-seed deliberately during a live demo if needed.

## Auth / secrets

None required for the MVP. No Amazon Alexa credentials for Path B.
