# Deadline Desk — demo script (≤ 3 minutes)

Record one take: live URL (or local) + voiceover. Public YouTube for Devpost.

- **Live:** https://deadline-desk.oldhambyron.workers.dev
- **Published demo:** https://youtu.be/BQkXYTpgLiY
- **Repo:** https://github.com/RonnyKane/deadline-desk

**Before record:** Board loaded, horizon 90 days, Alexa+ panel visible, zoom so rows are readable.

Suggested length: **2:00–2:45**.

---

## 0:00–0:20 · What it is

**Show:** Masthead “Deadline Desk”, pills, board.

**Say:**
> Deadline Desk is one Cloudflare page for hard renewals — insurance, leases, tags, licenses, vendor contracts — for a Florida landlord and small dealer. Humans browse the board. A simulated Alexa+ agent calls the same tools against the same data. No scraping, no second backend.

---

## 0:20–0:55 · Human path

**Show:** Filter Category → Insurance. Click **Commercial auto insurance renewal**. Click **Prep checklist**.

**Say:**
> Here’s the human path. Filter to insurance. This commercial auto policy renews in about twelve days — if it lapses, dealer plates and inventory moves stop. Prep checklist gives concrete steps: pull the declarations page, compare premium, confirm VINs, schedule payment. Same facts an agent will use.

---

## 0:55–1:45 · Alexa+ sim

**Show:** Alexa+ panel. Click **30-day renewals**. Then *Prep checklist for the selected deadline*. Then *Mark the selected deadline handled*.

**Say:**
> Path B for the Alexa+ hackathon: this chat is simulated, but the tools are real. I ask what renews in thirty days — it calls list_upcoming_deadlines. Agent activity lights up, and the board matches. I ask for a prep checklist — suggest_prep_checklist returns two to five steps. I mark handled — the row updates from mark_handled on the shared store.

Point at the **Last tool** pill.

---

## 1:45–2:20 · Why it matters

**Show:** Scroll registration + license rows briefly.

**Say:**
> Calendars bury cross-domain cutoffs. Asking what renews across properties and the lot needs structured tools, not a spreadsheet scroll. Person and agent share one desk — that’s the product bar, not a bolt-on chatbot.

---

## 2:20–2:40 · Close

**Show:** Tools list in the left rail.

**Say:**
> Four tools: list upcoming deadlines, get detail, mark handled, suggest prep checklist. Optional WebMCP registerTool when the browser supports modelContext. MIT, deployable on Cloudflare Workers. Thanks.

---

## Console smoke (optional cutaway)

```js
await window.__deadlineDesk.invoke("list_upcoming_deadlines", { days: 30, category: "registration" })
```
