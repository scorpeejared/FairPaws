import { allocate } from './allocate';
import { getCurrency } from './currency';
import { percentOf } from './money';
import type { Adjustment, Bill, BillResult, Money, PersonBreakdown, PersonItemLine, Rounding } from './types';

const EQUAL_SHARE_ID = 'equal-share';

/** Resolve an adjustment against a base amount. Fixed amounts never exceed `cap`. */
export function resolveAdjustment(adj: Adjustment, base: Money, cap = Infinity): Money {
  const raw = adj.kind === 'percent' ? percentOf(base, adj.value) : adj.value;
  return Math.max(0, Math.min(raw, cap));
}

export function roundAmount(amount: Money, rounding: Rounding, decimals: number): Money {
  if (rounding.step <= 0 || amount === 0) return amount;
  const step = rounding.step * 10 ** decimals;
  return rounding.direction === 'up' ? Math.ceil(amount / step) * step : Math.round(amount / step) * step;
}

export function itemTotal(unitPrice: Money, quantity: number): Money {
  return unitPrice * quantity;
}

/** Weights to spread a charge by; falls back to equal if every weight is zero. */
function weightsOrEqual(weights: number[]): number[] {
  return weights.some((w) => w > 0) ? weights : weights.map(() => 1);
}

/**
 * Pure bill calculation. Everything is integer minor units, every charge is
 * allocated with largest-remainder, so per-person totals always sum exactly to
 * `result.total`.
 *
 * Order of operations:
 *   discount   on the subtotal
 *   service    on subtotal - discount
 *   tax        on subtotal - discount + service
 *   tip        on subtotal - discount
 *   rounding   per person, difference reported as a separate line
 */
export function calculateBill(bill: Bill): BillResult {
  const { participants } = bill;
  const n = participants.length;
  const decimals = getCurrency(bill.currency).decimals;
  let tieBreak = 0;
  const nextOffset = () => (n > 0 ? tieBreak++ % n : 0);

  const people: PersonBreakdown[] = participants.map((p) => ({
    participantId: p.id,
    name: p.name,
    colorIndex: p.colorIndex,
    lines: [],
    subtotal: 0,
    discount: 0,
    service: 0,
    tax: 0,
    tip: 0,
    rounding: 0,
    total: 0,
  }));
  const unassignedItemIds: string[] = [];

  // 1. Base amounts per person.
  let subtotal: Money = 0;
  if (bill.mode === 'equal') {
    subtotal = bill.equalAmount;
    if (n > 0) {
      const parts = allocate(
        subtotal,
        people.map(() => 1),
        nextOffset(),
      );
      people.forEach((person, i) => {
        person.subtotal = parts[i];
        person.lines.push({ itemId: EQUAL_SHARE_ID, name: 'Equal share', amount: parts[i], sharedBy: n });
      });
    }
  } else {
    const index = new Map(participants.map((p, i) => [p.id, i]));
    for (const item of bill.items) {
      const total = itemTotal(item.unitPrice, item.quantity);
      subtotal += total;
      if (n === 0) continue;

      const weights = people.map(() => 0);
      for (const [pid, portions] of Object.entries(item.shares)) {
        const i = index.get(pid);
        if (i !== undefined && portions > 0) weights[i] = portions;
      }
      let sharedBy = weights.filter((w) => w > 0).length;
      if (sharedBy === 0) {
        unassignedItemIds.push(item.id);
        weights.fill(1);
        sharedBy = n;
      }
      const parts = allocate(total, weights, nextOffset());
      parts.forEach((amount, i) => {
        if (weights[i] === 0) return;
        const line: PersonItemLine = { itemId: item.id, name: item.name, amount, sharedBy };
        people[i].lines.push(line);
        people[i].subtotal += amount;
      });
    }
  }

  // Equal mode spreads every charge evenly; item mode follows what each person ordered.
  const spread = (total: Money, weights: number[]): Money[] =>
    n === 0 || total === 0
      ? people.map(() => 0)
      : allocate(total, weightsOrEqual(bill.mode === 'equal' ? weights.map(() => 1) : weights), nextOffset());

  // 2. Discount.
  const discount = resolveAdjustment(bill.discount, subtotal, subtotal);
  spread(
    discount,
    people.map((p) => p.subtotal),
  ).forEach((v, i) => (people[i].discount = v));
  const net = subtotal - discount;
  const personNet = people.map((p) => p.subtotal - p.discount);

  // 3. Service charge.
  const service = resolveAdjustment(bill.service, net);
  spread(service, personNet).forEach((v, i) => (people[i].service = v));

  // 4. Tax.
  const tax = resolveAdjustment(bill.tax, net + service);
  spread(
    tax,
    people.map((p, i) => personNet[i] + p.service),
  ).forEach((v, i) => (people[i].tax = v));

  // 5. Tip.
  const tip = resolveAdjustment(bill.tip, net);
  spread(tip, personNet).forEach((v, i) => (people[i].tip = v));

  // 6. Totals and rounding.
  const totalBeforeRounding = net + service + tax + tip;
  let total = 0;
  for (const [i, p] of people.entries()) {
    const exact = personNet[i] + p.service + p.tax + p.tip;
    const rounded = roundAmount(exact, bill.rounding, decimals);
    p.rounding = rounded - exact;
    p.total = rounded;
    total += rounded;
  }
  if (n === 0) total = totalBeforeRounding;

  return {
    subtotal,
    discount,
    service,
    tax,
    tip,
    totalBeforeRounding,
    rounding: total - totalBeforeRounding,
    total,
    people,
    unassignedItemIds,
  };
}
