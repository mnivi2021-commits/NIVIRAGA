import { PRODUCTS, ProductRow } from './products';

export type Qty = Record<number, number>;

export const paise = (x: number) => Math.round(x * 100);

export const fmt = (p: number) =>
  '₹' +
  (p / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const lineTotal = (r: ProductRow, q: number) => paise(r[4]) * q;

export type Summary = {
  discountTotal: number;
  less: number;
  afterDiscount: number;
  netTotal: number;
  grand: number;
  products: number;
  units: number;
};

// Summary rules: 75% OFF items are discounted in the summary; net-rate items are not.
export function summarize(qty: Qty): Summary {
  let D = 0, N = 0, n = 0, u = 0;
  for (const r of PRODUCTS) {
    const q = qty[r[0]] || 0;
    if (!q) continue;
    n++;
    u += q;
    if (r[5]) D += lineTotal(r, q);
    else N += lineTotal(r, q);
  }
  const L = Math.round(D * 0.75);
  const A = D - L;
  return { discountTotal: D, less: L, afterDiscount: A, netTotal: N, grand: A + N, products: n, units: u };
}

export const countText = (s: Summary) =>
  s.products ? `${s.products} products · ${s.units} qty` : 'No items selected';
