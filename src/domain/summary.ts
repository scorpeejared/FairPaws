import { formatMoney, formatPercent } from './money';
import type { Adjustment, Bill, BillResult } from './types';

function adjustmentLabel(label: string, adj: Adjustment): string {
  return adj.kind === 'percent' && adj.value > 0 ? `${label} (${formatPercent(adj.value)})` : label;
}

/** Plain-text breakdown for the system share sheet. */
export function buildShareText(bill: Bill, result: BillResult): string {
  const m = (v: number) => formatMoney(v, bill.currency);
  const lines: string[] = [];
  lines.push(bill.title.trim() || 'Bill split');
  lines.push('');
  lines.push(`Subtotal  ${m(result.subtotal)}`);
  if (result.discount > 0)
    lines.push(`${adjustmentLabel('Discount', bill.discount)}  −${m(result.discount)}`);
  if (result.service > 0) lines.push(`${adjustmentLabel('Service', bill.service)}  ${m(result.service)}`);
  if (result.tax > 0) lines.push(`${adjustmentLabel('Tax', bill.tax)}  ${m(result.tax)}`);
  if (result.tip > 0) lines.push(`${adjustmentLabel('Tip', bill.tip)}  ${m(result.tip)}`);
  if (result.rounding !== 0)
    lines.push(`Rounding  ${formatMoney(result.rounding, bill.currency, { signed: true })}`);
  lines.push(`Total  ${m(result.total)}`);
  lines.push('');
  for (const p of result.people) {
    lines.push(`${p.name}: ${m(p.total)}`);
  }
  lines.push('');
  lines.push('Split with Fair Paws 🐾');
  return lines.join('\n');
}
