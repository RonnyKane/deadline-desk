import type {
  Deadline,
  DeadlineCategory,
  DeadlineRow,
  ListUpcomingArgs,
} from "./types.ts";

/** Seed offsets are relative to "today" so demos stay fresh after cold starts. */
const SEED_SPEC: Array<Omit<Deadline, "dueDate" | "status"> & { dayOffset: number }> = [
  {
    id: "dl-ins-auto-dealer",
    title: "Commercial auto insurance renewal",
    category: "insurance",
    entity: "Honest Autos (Tampa) — fleet & dealer plates",
    domain: "dealership",
    amountHint: "~$4,800 / yr",
    notes: "FL dealer package: liability + physical damage on lot inventory and transporter.",
    consequence: "No dealer tags / can't move inventory if lapsed.",
    source: "Carrier renewal notice",
    dayOffset: 12,
  },
  {
    id: "dl-ins-prop-oak",
    title: "Landlord property insurance — Oak St duplex",
    category: "insurance",
    entity: "1842 Oak St, Tampa FL — duplex rental",
    domain: "property",
    amountHint: "~$2,150 / yr",
    notes: "Dwelling + loss of rents. Mortgagee clause for First National (FL).",
    consequence: "Mortgage escrow force-place at higher premium.",
    source: "Agent email",
    dayOffset: 28,
  },
  {
    id: "dl-ins-flood",
    title: "NFIP flood insurance — Bayshore rental",
    category: "insurance",
    entity: "412 Bayshore Ct, Tampa FL — coastal rental",
    domain: "property",
    amountHint: "~$1,890 / yr",
    notes: "FL Zone AE. Preferred Risk no longer available — shop private market too.",
    consequence: "Lender may force-place; tenant lease requires proof.",
    source: "NFIP reminder",
    dayOffset: 45,
  },
  {
    id: "dl-ins-wc",
    title: "Workers' compensation — Honest Autos",
    category: "insurance",
    entity: "Honest Autos LLC (FL)",
    domain: "dealership",
    amountHint: "~$3,200 / yr",
    notes: "Two W-2 techs + office on the Fowler Ave lot. Audit closes with renewal.",
    consequence: "FL stop-work order risk if lapsed with employees.",
    source: "Payroll carrier",
    dayOffset: 60,
  },
  {
    id: "dl-ins-garage",
    title: "Garage keepers liability",
    category: "insurance",
    entity: "Honest Autos — recon bay",
    domain: "dealership",
    amountHint: "~$1,100 / yr",
    notes: "Covers customer / inventory vehicles in custody during recon.",
    consequence: "Uninsured loss if a car is hit in the bay.",
    source: "Package rider",
    dayOffset: 75,
  },
  {
    id: "dl-lease-2b",
    title: "Tenant lease renewal — Oak St 2B",
    category: "lease",
    entity: "1842 Oak St #2B, Tampa — Ramirez",
    domain: "property",
    amountHint: "$1,650 / mo → propose $1,725",
    notes: "Good payer. Wants 12-month FL residential. Pets already approved.",
    consequence: "Month-to-month gap or vacancy if notice missed.",
    source: "Lease calendar",
    dayOffset: 21,
  },
  {
    id: "dl-lease-1a",
    title: "Tenant lease end — Unit 1A",
    category: "lease",
    entity: "1842 Oak St #1A — Chen",
    domain: "property",
    amountHint: "Vacate or renew",
    notes: "Tenant gave soft signal they may move. Start listing photos now.",
    consequence: "Empty unit + make-ready rush if you wait.",
    source: "Lease calendar",
    dayOffset: 35,
  },
  {
    id: "dl-lease-lot",
    title: "Commercial lot ground lease — Fowler Ave",
    category: "lease",
    entity: "Honest Autos — Fowler Ave lot, Tampa",
    domain: "dealership",
    amountHint: "$4,200 / mo",
    notes: "3-year FL commercial term with CPI bump. Landlord wants 60-day notice.",
    consequence: "Lose retail frontage if non-renewed without plan.",
    source: "Lease PDF",
    dayOffset: 90,
  },
  {
    id: "dl-reg-dealer-plates",
    title: "FL dealer plate / series renewal",
    category: "registration",
    entity: "Honest Autos — Hillsborough dealer series",
    domain: "dealership",
    amountHint: "Tax collector fee schedule",
    notes: "Bundle with FL dealer license packet. Need proof of commercial auto.",
    consequence: "Cannot demo or transport with expired series.",
    source: "County tax collector",
    dayOffset: 18,
  },
  {
    id: "dl-reg-f150",
    title: "Personal F-150 registration / tags",
    category: "registration",
    entity: "2019 F-150 — personal",
    domain: "personal",
    amountHint: "~$85",
    notes: "Renew online via FL tax collector. Insurance card ready.",
    consequence: "Citation risk; toll pass may bounce.",
    source: "DHSMV reminder",
    dayOffset: 9,
  },
  {
    id: "dl-reg-trailer",
    title: "Equipment trailer tags",
    category: "registration",
    entity: "16' dual-axle trailer — lot use",
    domain: "dealership",
    amountHint: "~$45",
    notes: "Used for parts runs and occasional vehicle transport.",
    consequence: "Stopped on roadway without current decal.",
    source: "Glovebox sticker",
    dayOffset: 40,
  },
  {
    id: "dl-reg-shuttle",
    title: "Customer shuttle van tags",
    category: "registration",
    entity: "2016 Odyssey — shuttle",
    domain: "dealership",
    amountHint: "~$70",
    notes: "Keep commercial insurance card with registration.",
    consequence: "Can't offer rides during recon delays.",
    source: "Office binder",
    dayOffset: 55,
  },
  {
    id: "dl-lic-dealer",
    title: "FL MV dealer license (DHSMV)",
    category: "license",
    entity: "Honest Autos LLC — FL DHSMV",
    domain: "dealership",
    amountHint: "State renewal + surety evidence",
    notes: "FL bond must be active. Update officers if changed.",
    consequence: "Cannot retail vehicles; criminal for unlicensed sales.",
    source: "DHSMV portal",
    dayOffset: 70,
  },
  {
    id: "dl-lic-cam",
    title: "Community association manager CE / renewal",
    category: "license",
    entity: "Joseph — DBPR CAM (if active)",
    domain: "personal",
    amountHint: "CE hours + renewal fee",
    notes: "Track CE credits before the window closes.",
    consequence: "Cannot bill CAM services if lapsed.",
    source: "DBPR",
    dayOffset: 100,
  },
  {
    id: "dl-lic-btr",
    title: "Tampa business tax receipt (BTR)",
    category: "license",
    entity: "City of Tampa — Honest Autos lot",
    domain: "dealership",
    amountHint: "~$180",
    notes: "Municipal BTR / occupational license for the Fowler Ave address.",
    consequence: "Code enforcement fine; some banks want proof.",
    source: "City notice",
    dayOffset: 25,
  },
  {
    id: "dl-lic-surety",
    title: "Dealer surety bond renewal",
    category: "license",
    entity: "Honest Autos — $25k bond",
    domain: "dealership",
    amountHint: "~$250 premium",
    notes: "Required companion to dealer license. Same expiry window.",
    consequence: "Dealer license cannot renew without active bond.",
    source: "Bonding agency",
    dayOffset: 68,
  },
  {
    id: "dl-ven-hvac",
    title: "HVAC preventative contract",
    category: "vendor",
    entity: "CoolBreeze Mechanical — Oak St",
    domain: "property",
    amountHint: "$89 / mo",
    notes: "Semi-annual visits. Auto-renews unless 30-day written cancel.",
    consequence: "No priority service in summer if cancelled late.",
    source: "Vendor PDF",
    dayOffset: 14,
  },
  {
    id: "dl-ven-pest",
    title: "Pest control quarterly contract",
    category: "vendor",
    entity: "Bay Pest — both rentals",
    domain: "property",
    amountHint: "$55 / visit",
    notes: "Includes exterior bait stations. Send cancel by day 15 of month.",
    consequence: "Tenant complaints + possible lease credit.",
    source: "Auto-pay",
    dayOffset: 32,
  },
  {
    id: "dl-ven-lawn",
    title: "Lawn & landscape agreement",
    category: "vendor",
    entity: "GreenEdge — Oak St + Bayshore",
    domain: "property",
    amountHint: "$240 / mo combined",
    notes: "Seasonal cut schedule. Renegotiate if quality slipped.",
    consequence: "HOA / neighbor complaints; curb appeal hit for listing.",
    source: "Vendor email",
    dayOffset: 48,
  },
  {
    id: "dl-ven-tow",
    title: "Tow / transport vendor agreement",
    category: "vendor",
    entity: "Gulf Coast Hauling — dealer",
    domain: "dealership",
    amountHint: "Per-haul rates",
    notes: "Preferred rates expire; get 2027 rate card in writing.",
    consequence: "Pay street rates for auction pickups.",
    source: "Rate card",
    dayOffset: 85,
  },
  {
    id: "dl-other-tax",
    title: "Hillsborough property tax — installment #2",
    category: "other",
    entity: "Hillsborough County — Oak St parcel",
    domain: "property",
    amountHint: "~$1,420",
    notes: "Pay before FL discount windows close if applicable.",
    consequence: "Interest + potential tax certificate sale path.",
    source: "Tax collector",
    dayOffset: 5,
  },
  {
    id: "dl-other-fire",
    title: "Fire extinguisher annual inspection",
    category: "other",
    entity: "Honest Autos showroom + bay",
    domain: "dealership",
    amountHint: "~$120",
    notes: "Required for occupancy / insurance inspection.",
    consequence: "Failed insurance walkthrough; fine risk.",
    source: "Last tag on canister",
    dayOffset: 22,
  },
  {
    id: "dl-other-domain",
    title: "honestautos.example domain renewal",
    category: "other",
    entity: "Registrar — retail site",
    domain: "ops",
    amountHint: "~$18 / yr",
    notes: "Enable auto-renew; confirm WHOIS privacy still on.",
    consequence: "Site and email hard-down if domain drops.",
    source: "Registrar email",
    dayOffset: 110,
  },
  {
    id: "dl-ins-umb",
    title: "Personal umbrella policy",
    category: "insurance",
    entity: "Joseph — $1M umbrella",
    domain: "personal",
    amountHint: "~$420 / yr",
    notes: "Requires underlying auto/home limits. Align renewals.",
    consequence: "Gap above underlying if claim hits.",
    source: "Personal agent",
    dayOffset: 95,
  },
];

let store: Map<string, Deadline> | null = null;
let seededAt: string | null = null;

export function utcToday(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function addDays(isoDay: string, offset: number): string {
  const d = new Date(`${isoDay}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.parse(`${fromIso}T12:00:00.000Z`);
  const b = Date.parse(`${toIso}T12:00:00.000Z`);
  return Math.round((b - a) / 86_400_000);
}

function urgencyFor(days: number): DeadlineRow["urgency"] {
  if (days < 0) return "past";
  if (days === 0) return "today";
  if (days <= 7) return "week";
  if (days <= 30) return "month";
  if (days <= 90) return "quarter";
  return "later";
}

export function ensureStore(): { items: Map<string, Deadline>; seededAt: string; resetNote: string } {
  if (!store) {
    const today = utcToday();
    store = new Map();
    for (const spec of SEED_SPEC) {
      const { dayOffset, ...rest } = spec;
      store.set(rest.id, {
        ...rest,
        dueDate: addDays(today, dayOffset),
        status: "open",
      });
    }
    seededAt = new Date().toISOString();
  }
  return {
    items: store,
    seededAt: seededAt!,
    resetNote:
      "In-memory store. Mutations (mark_handled) survive only for this Worker isolate lifetime; cold start re-seeds from offsets relative to today.",
  };
}

export function resetStore(): { count: number; seededAt: string } {
  store = null;
  seededAt = null;
  const s = ensureStore();
  return { count: s.items.size, seededAt: s.seededAt };
}

export function toRow(d: Deadline, today = utcToday()): DeadlineRow {
  const daysRemaining = daysBetween(today, d.dueDate);
  return { ...d, daysRemaining, urgency: urgencyFor(daysRemaining) };
}

export function listUpcoming(args: ListUpcomingArgs = {}): {
  today: string;
  query: Required<Pick<ListUpcomingArgs, "days" | "category">> & ListUpcomingArgs;
  count: number;
  rows: DeadlineRow[];
  categories: DeadlineCategory[];
  store: { seededAt: string; resetNote: string; total: number };
} {
  const s = ensureStore();
  const today = utcToday();
  const days = clampInt(args.days ?? 90, 1, 730, 90);
  const category = normalizeCategory(args.category);
  const includeHandled = Boolean(args.include_handled);
  const q = (args.q || "").trim().toLowerCase();
  const limit = clampInt(args.limit ?? 100, 1, 200, 100);

  let rows = [...s.items.values()]
    .map((d) => toRow(d, today))
    .filter((r) => includeHandled || r.status === "open")
    .filter((r) => r.daysRemaining <= days)
    .filter((r) => category === "all" || r.category === category);

  if (q) {
    rows = rows.filter((r) =>
      [r.title, r.entity, r.notes, r.category, r.domain, r.id].join(" ").toLowerCase().includes(q),
    );
  }

  rows.sort((a, b) => a.daysRemaining - b.daysRemaining || a.title.localeCompare(b.title));
  rows = rows.slice(0, limit);

  const categories = uniqueCategories([...s.items.values()]);
  return {
    today,
    query: { days, category, include_handled: includeHandled, q: args.q, limit },
    count: rows.length,
    rows,
    categories,
    store: { seededAt: s.seededAt, resetNote: s.resetNote, total: s.items.size },
  };
}

export function getDeadline(id: string): DeadlineRow | null {
  const s = ensureStore();
  const d = s.items.get(id);
  return d ? toRow(d) : null;
}

export function markHandled(
  id: string,
  opts: { renewed?: boolean; note?: string } = {},
): { ok: true; row: DeadlineRow } | { ok: false; error: string } {
  const s = ensureStore();
  const d = s.items.get(id);
  if (!d) return { ok: false, error: `Unknown deadline id "${id}".` };
  d.status = opts.renewed ? "renewed" : "handled";
  d.handledAt = new Date().toISOString();
  if (opts.note) {
    d.notes = `${d.notes}\n[handled] ${opts.note}`.trim();
  }
  s.items.set(id, d);
  return { ok: true, row: toRow(d) };
}

export function allIds(): string[] {
  return [...ensureStore().items.keys()];
}

function normalizeCategory(raw?: string | null): DeadlineCategory | "all" {
  const v = (raw || "all").toLowerCase();
  if (v === "all") return "all";
  if (
    v === "insurance" ||
    v === "lease" ||
    v === "registration" ||
    v === "license" ||
    v === "vendor" ||
    v === "other"
  ) {
    return v;
  }
  return "all";
}

function uniqueCategories(items: Deadline[]): DeadlineCategory[] {
  return [...new Set(items.map((i) => i.category))].sort();
}

function clampInt(n: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

export const TOOL_NAMES = [
  "list_upcoming_deadlines",
  "get_deadline_detail",
  "mark_handled",
  "suggest_prep_checklist",
] as const;
