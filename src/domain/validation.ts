import { z } from 'zod';
import { isSupportedCurrency } from './currency';
import { MAX_BPS, MAX_MONEY } from './money';
import type { Bill } from './types';

export const MAX_PARTICIPANTS = 50;
export const MAX_ITEMS = 500;

const money = z.number().int().min(0).max(MAX_MONEY);

const adjustmentSchema = z
  .object({
    kind: z.enum(['percent', 'fixed']),
    value: z.number().int().min(0),
  })
  .refine((a) => (a.kind === 'percent' ? a.value <= MAX_BPS : a.value <= MAX_MONEY), {
    message: 'Adjustment out of range',
  });

export const billSchema = z.object({
  id: z.string().min(1),
  title: z.string().max(80),
  currency: z.string().refine(isSupportedCurrency, 'Unsupported currency'),
  mode: z.enum(['equal', 'items']),
  participants: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().trim().min(1).max(40),
        colorIndex: z.number().int().min(0),
      }),
    )
    .max(MAX_PARTICIPANTS),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().max(80),
        unitPrice: money,
        quantity: z.number().int().min(1).max(999),
        shares: z.record(z.string(), z.number().int().min(1).max(999)),
      }),
    )
    .max(MAX_ITEMS),
  equalAmount: money,
  service: adjustmentSchema,
  tax: adjustmentSchema,
  discount: adjustmentSchema,
  tip: adjustmentSchema,
  rounding: z.object({
    step: z.number().int().min(0).max(1000),
    direction: z.enum(['nearest', 'up']),
  }),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
});

export const settingsSchema = z.object({
  theme: z.enum(['system', 'light', 'dark']).catch('system'),
  currency: z.string().refine(isSupportedCurrency).catch('PHP'),
  haptics: z.boolean().catch(true),
});

export type Settings = z.infer<typeof settingsSchema>;

type IssueLevel = 'error' | 'warning';
export interface BillIssue {
  level: IssueLevel;
  code: 'no-people' | 'no-amount' | 'no-items' | 'unassigned' | 'unpriced';
  message: string;
}

/** Problems the UI should surface before the user trusts the split. */
export function getBillIssues(bill: Bill, unassignedCount = 0): BillIssue[] {
  const issues: BillIssue[] = [];
  if (bill.participants.length === 0) {
    issues.push({ level: 'error', code: 'no-people', message: 'Add at least one person.' });
  }
  if (bill.mode === 'equal') {
    if (bill.equalAmount === 0) {
      issues.push({ level: 'error', code: 'no-amount', message: 'Enter the bill amount.' });
    }
  } else {
    if (bill.items.length === 0) {
      issues.push({ level: 'error', code: 'no-items', message: 'Add at least one item.' });
    }
    const unpriced = bill.items.filter((i) => i.unitPrice === 0).length;
    if (unpriced > 0) {
      issues.push({
        level: 'warning',
        code: 'unpriced',
        message: `${unpriced} ${unpriced === 1 ? 'item has' : 'items have'} no price.`,
      });
    }
    if (unassignedCount > 0) {
      issues.push({
        level: 'warning',
        code: 'unassigned',
        message: `${unassignedCount} ${unassignedCount === 1 ? 'item is' : 'items are'} unassigned and split evenly.`,
      });
    }
  }
  return issues;
}
