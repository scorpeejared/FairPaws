import type { Money } from './types';

/**
 * Splits `total` across `weights` using the largest-remainder method so that
 * the parts always sum to exactly `total`.
 *
 * `offset` rotates who wins ties for the leftover units, so the same person
 * isn't always the one who absorbs the extra centavo.
 */
export function allocate(total: Money, weights: number[], offset = 0): Money[] {
  const n = weights.length;
  if (n === 0) return [];
  if (!Number.isInteger(total) || total < 0) {
    throw new Error(`allocate: total must be a non-negative integer, got ${total}`);
  }
  if (weights.some((w) => !Number.isInteger(w) || w < 0)) {
    throw new Error('allocate: weights must be non-negative integers');
  }
  const weightSum = weights.reduce((a, b) => a + b, 0);
  if (weightSum === 0) {
    throw new Error('allocate: at least one weight must be positive');
  }
  if (total === 0) return weights.map(() => 0);

  // BigInt: total * weight can exceed 2^53 for large bills.
  const t = BigInt(total);
  const W = BigInt(weightSum);
  const base: number[] = [];
  const remainder: bigint[] = [];
  let assigned = 0;
  for (const w of weights) {
    const product = t * BigInt(w);
    const floor = Number(product / W);
    base.push(floor);
    remainder.push(product % W);
    assigned += floor;
  }

  let leftover = total - assigned;
  const order = weights
    .map((_, i) => i)
    .sort((a, b) => {
      if (remainder[a] !== remainder[b]) return remainder[a] > remainder[b] ? -1 : 1;
      const da = (a - offset + n * 2) % n;
      const db = (b - offset + n * 2) % n;
      return da - db;
    });
  for (const i of order) {
    if (leftover <= 0) break;
    base[i] += 1;
    leftover -= 1;
  }
  return base;
}
