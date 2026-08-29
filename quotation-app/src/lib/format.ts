export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

const nf2 = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function inr(n: number): string {
  return '₹' + nf2.format(round2(n));
}

export function inrPlain(n: number): string {
  return nf2.format(round2(n));
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function addDaysIso(days: number, from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function todayIso(): string {
  return new Date().toISOString();
}

/* ---------- Amount in words (Indian system) ---------- */

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return TENS[t] + (o ? ' ' + ONES[o] : '');
}

function numWords(n: number): string {
  if (n === 0) return '';
  const parts: string[] = [];
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = Math.floor((n % 1000) / 100);
  const rest = n % 100;
  if (crore) parts.push(numWords(crore) + ' Crore');
  if (lakh) parts.push(twoDigits(lakh) + ' Lakh');
  if (thousand) parts.push(twoDigits(thousand) + ' Thousand');
  if (hundred) parts.push(ONES[hundred] + ' Hundred');
  if (rest) parts.push(twoDigits(rest));
  return parts.join(' ');
}

/** e.g. "One Lakh Twenty Three Thousand Four Hundred Fifty Six Rupees and Seventy Eight Paise Only" */
export function amountInWords(amount: number): string {
  const abs = Math.abs(amount);
  const rupees = Math.floor(abs);
  const paise = Math.round((abs - rupees) * 100);
  let out = '';
  if (rupees > 0) {
    out = `${numWords(rupees)} Rupee${rupees === 1 ? '' : 's'}`;
  }
  if (paise > 0) {
    out = `${out ? out + ' and ' : ''}${twoDigits(paise)} Paise`;
  }
  return (out || 'Zero Rupees') + ' Only';
}

export function compactNumber(n: number): string {
  if (Math.abs(n) >= 10000000) return (n / 10000000).toFixed(2).replace(/\.00$/, '') + ' Cr';
  if (Math.abs(n) >= 100000) return (n / 100000).toFixed(2).replace(/\.00$/, '') + ' L';
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(Math.round(n));
}
