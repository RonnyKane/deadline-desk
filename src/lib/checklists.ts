import type { ChecklistResult, Deadline, DeadlineCategory } from "./types.ts";

const BY_CATEGORY: Record<DeadlineCategory, string[]> = {
  insurance: [
    "Pull the declarations page and note policy number, carrier, and agent phone.",
    "Compare premium quote vs last year; ask for multi-policy or deductible options.",
    "Confirm covered locations / VINs match current inventory and properties.",
    "Schedule payment or escrow before the cancel/non-renew date.",
    "File the new declarations PDF in the policy folder and update this desk.",
  ],
  lease: [
    "Confirm move-out / renewal intent with the other party in writing.",
    "Walk the unit or premises; photograph condition and outstanding repairs.",
    "Draft renewal terms (rent, deposits, notice) or start listing if vacating.",
    "Collect keys, remotes, and utility transfer dates if ending.",
    "Update ledger and calendar with the new end date once signed.",
  ],
  registration: [
    "Check FL DHSMV / county tax collector for amount due and required docs.",
    "Confirm VIN, plate, and insurance card are current and matching.",
    "Pay online or at tax collector before the month-end grace window.",
    "Install new decal / keep receipt in the glovebox and deal jacket.",
    "Mark this desk handled and set next-year reminder (+11 months).",
  ],
  license: [
    "Log into the issuing portal (DBPR / DHSMV / county) and confirm renewal window.",
    "Gather CE credits, bond, fingerprints, or affidavits if required.",
    "Pay renewal fee and download the updated license PDF.",
    "Post a copy at the place of business if required by statute.",
    "Update this desk and share the new expiry with bookkeeping.",
  ],
  vendor: [
    "Review scope, SLA, and auto-renew clause in the current contract PDF.",
    "Get competing quotes if price or quality slipped this year.",
    "Negotiate renewal or send written non-renew notice before the cutoff.",
    "Update PO / autopay and emergency contact on file with the vendor.",
    "Archive the signed renewal and mark this row handled.",
  ],
  other: [
    "Confirm the exact due date and payment/portal URL from the notice.",
    "Gather any supporting docs (EIN, parcel ID, account number).",
    "Pay or file before the late-fee / penalty date.",
    "Save confirmation number and PDF receipt.",
    "Mark handled here and set the next cycle reminder.",
  ],
};

export function suggestPrepChecklist(deadline: Deadline): ChecklistResult {
  const pool = BY_CATEGORY[deadline.category];
  const steps = pool.slice(0, 2 + (deadline.id.charCodeAt(deadline.id.length - 1) % 3));
  // Always 2–5 steps
  const trimmed = steps.length < 2 ? pool.slice(0, 2) : steps.slice(0, 5);
  return {
    id: deadline.id,
    title: deadline.title,
    category: deadline.category,
    steps: trimmed,
    note: `Concrete prep for ${deadline.category} · ${deadline.entity}. Not legal advice — verify with the issuer.`,
  };
}
