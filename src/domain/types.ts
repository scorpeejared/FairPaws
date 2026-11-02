/** Integer minor currency units (e.g. centavos). Never a float. */
export type Money = number;

export type SplitMode = 'equal' | 'items';
export type AdjustmentKind = 'percent' | 'fixed';
export type RoundingDirection = 'nearest' | 'up';

/**
 * A tax / service / discount / tip setting.
 * - percent: `value` is basis points (1250 = 12.5%)
 * - fixed:   `value` is minor currency units
 */
export interface Adjustment {
  kind: AdjustmentKind;
  value: number;
}

/** Per-person rounding. `step` is in major units (0 = off, 1, 5, 10 ...). */
export interface Rounding {
  step: number;
  direction: RoundingDirection;
}

export interface Participant {
  id: string;
  name: string;
  colorIndex: number;
}

export interface Item {
  id: string;
  name: string;
  /** Price of one unit, minor units. */
  unitPrice: Money;
  quantity: number;
  /** participantId -> portions consumed. Absent / 0 = not sharing this item. */
  shares: Record<string, number>;
}

export interface Bill {
  id: string;
  title: string;
  currency: string;
  mode: SplitMode;
  participants: Participant[];
  items: Item[];
  /** Bill amount before extras, used in `equal` mode. */
  equalAmount: Money;
  service: Adjustment;
  tax: Adjustment;
  discount: Adjustment;
  tip: Adjustment;
  rounding: Rounding;
  createdAt: number;
  updatedAt: number;
}

export interface PersonItemLine {
  itemId: string;
  name: string;
  amount: Money;
  /** How many people share this item. */
  sharedBy: number;
}

export interface PersonBreakdown {
  participantId: string;
  name: string;
  colorIndex: number;
  lines: PersonItemLine[];
  subtotal: Money;
  discount: Money;
  service: Money;
  tax: Money;
  tip: Money;
  /** Positive or negative adjustment from rounding. */
  rounding: Money;
  /** What this person pays. */
  total: Money;
}

export interface BillResult {
  subtotal: Money;
  discount: Money;
  service: Money;
  tax: Money;
  tip: Money;
  /** Total before per-person rounding. */
  totalBeforeRounding: Money;
  rounding: Money;
  /** Final bill == sum of every person's total. */
  total: Money;
  people: PersonBreakdown[];
  /** Items nobody was assigned to (split evenly as a fallback). */
  unassignedItemIds: string[];
}
