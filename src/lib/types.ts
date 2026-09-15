export type DeadlineCategory =
  | "insurance"
  | "lease"
  | "registration"
  | "license"
  | "vendor"
  | "other";

export type DeadlineStatus = "open" | "handled" | "renewed";

export interface Deadline {
  id: string;
  title: string;
  category: DeadlineCategory;
  dueDate: string; // YYYY-MM-DD
  entity: string;
  domain: "property" | "dealership" | "personal" | "ops";
  amountHint?: string;
  notes: string;
  consequence: string;
  status: DeadlineStatus;
  handledAt?: string;
  source: string;
}

export interface DeadlineRow extends Deadline {
  daysRemaining: number;
  urgency: "today" | "week" | "month" | "quarter" | "later" | "past";
}

export interface ListUpcomingArgs {
  days?: number;
  category?: DeadlineCategory | "all";
  include_handled?: boolean;
  q?: string;
  limit?: number;
}

export interface ChecklistResult {
  id: string;
  title: string;
  category: DeadlineCategory;
  steps: string[];
  note: string;
}
