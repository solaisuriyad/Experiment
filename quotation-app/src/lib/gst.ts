import { GST_RATES, QuoteItem } from './types';
import { round2 } from './format';

export interface LineCalc {
  itemId: string;
  rate: number; // GST slab of the line
  gross: number; // qty x rate before discount
  discount: number;
  taxable: number;
  cgst: number;
  sgst: number;
  gst: number;
  total: number;
}

export interface SlabCalc {
  rate: number;
  taxable: number;
  cgst: number;
  sgst: number;
  gst: number;
}

export interface QuoteCalc {
  lines: LineCalc[];
  subtotal: number;
  discount: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  gst: number;
  total: number;
  roundedTotal: number;
  roundOff: number;
  bySlab: SlabCalc[];
}

export function calcLine(item: QuoteItem): LineCalc {
  const qty = item.qty || 0;
  const rate = item.rate || 0;
  const gross = qty * rate;
  const discount = gross * ((item.discountPct || 0) / 100);
  const afterDisc = gross - discount;
  let taxable: number;
  let gst: number;
  if (item.gstInclusive) {
    taxable = afterDisc / (1 + item.gstRate / 100);
    gst = afterDisc - taxable;
  } else {
    taxable = afterDisc;
    gst = afterDisc * (item.gstRate / 100);
  }
  const t = round2(taxable);
  const g = round2(gst);
  return {
    itemId: item.id,
    rate: item.gstRate,
    gross: round2(gross),
    discount: round2(discount),
    taxable: t,
    cgst: round2(g / 2),
    sgst: round2(g / 2),
    gst: g,
    total: round2(t + g),
  };
}

export function calcQuote(items: QuoteItem[]): QuoteCalc {
  const lines = items.map(calcLine);
  const sum = (fn: (l: LineCalc) => number) => round2(lines.reduce((a, l) => a + fn(l), 0));
  const subtotal = sum((l) => l.gross);
  const discount = sum((l) => l.discount);
  const taxableValue = sum((l) => l.taxable);
  const cgst = sum((l) => l.cgst);
  const sgst = sum((l) => l.sgst);
  const gst = round2(cgst + sgst);
  const total = round2(taxableValue + gst);
  const roundedTotal = Math.round(total);
  const bySlab: SlabCalc[] = GST_RATES.map((rate) => {
    const ls = lines.filter((l) => l.rate === rate);
    const t = round2(ls.reduce((a, l) => a + l.taxable, 0));
    const c = round2(ls.reduce((a, l) => a + l.cgst, 0));
    const s = round2(ls.reduce((a, l) => a + l.sgst, 0));
    return { rate, taxable: t, cgst: c, sgst: s, gst: round2(c + s) };
  }).filter((s) => s.taxable > 0 || s.gst > 0);

  return {
    lines,
    subtotal,
    discount,
    taxableValue,
    cgst,
    sgst,
    gst,
    total,
    roundedTotal,
    roundOff: round2(roundedTotal - total),
    bySlab,
  };
}
