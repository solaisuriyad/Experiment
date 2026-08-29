import { CompanyProfile, Quotation } from './types';
import { calcQuote } from './gst';
import { amountInWords, formatDate, inrPlain } from './format';

export type ExportFormat = 'pdf' | 'doc' | 'html' | 'txt';

export interface ExportOption {
  id: ExportFormat;
  icon: string;
  label: string;
  desc: string;
  ext: string;
  mime: string;
}

export const EXPORT_OPTIONS: ExportOption[] = [
  { id: 'pdf', icon: '📄', label: 'PDF', desc: 'Professional, print-ready document (best quality)', ext: 'pdf', mime: 'application/pdf' },
  { id: 'doc', icon: '📝', label: 'Word (DOC)', desc: 'Opens and edits in MS Word / Google Docs / WPS', ext: 'doc', mime: 'application/msword' },
  { id: 'html', icon: '🌐', label: 'HTML', desc: 'Web page version — opens in any browser', ext: 'html', mime: 'text/html' },
  { id: 'txt', icon: '📃', label: 'Text (TXT)', desc: 'Plain text summary — easy to copy into chat', ext: 'txt', mime: 'text/plain' },
];

export function filenameFor(q: Quotation, ext: string): string {
  const stamp = q.date ? q.date.slice(0, 10) : 'date';
  return `${q.number.replace(/[^A-Za-z0-9_-]/g, '_')}_${stamp}.${ext}`;
}

/* ------------------------------------------------------------------ */
/* HTML (shared by PDF, .doc and .html exports)                        */
/* ------------------------------------------------------------------ */

const esc = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br/>');

export function quoteHtml(profile: CompanyProfile, q: Quotation): string {
  const calc = calcQuote(q.items);
  const logo = profile.logoUri
    ? `<img class="logo" src="${profile.logoUri}" alt="logo" />`
    : `<div class="logo placeholder">${esc((profile.businessName || 'LOGO').slice(0, 2).toUpperCase())}</div>`;

  const rows = calc.lines
    .map((l, i) => {
      const item = q.items[i];
      const disc = item && item.discountPct > 0 ? `<div class="disc">(-${item.discountPct}%)</div>` : '';
      return `<tr>
        <td class="c">${i + 1}</td>
        <td>
          <div class="iname">${esc(item?.name || '')}</div>
          ${item?.description ? `<div class="idesc">${esc(item.description)}</div>` : ''}
          ${item?.hsn ? `<div class="ihsn">HSN: ${esc(item.hsn)}</div>` : ''}
        </td>
        <td class="c">${esc(item?.unit || '')}</td>
        <td class="r">${inrPlain(item?.qty || 0)}</td>
        <td class="r">${inrPlain(item?.rate || 0)}</td>
        <td class="c">${item?.gstRate ?? 0}%</td>
        <td class="r">${disc}${inrPlain(l.taxable)}</td>
        <td class="r">${inrPlain(l.total)}</td>
      </tr>`;
    })
    .join('');

  const slabRows = calc.bySlab
    .map(
      (s) => `<tr>
        <td class="r">${s.rate}%</td>
        <td class="r">${inrPlain(s.taxable)}</td>
        <td class="r">${inrPlain(s.cgst)}</td>
        <td class="r">${inrPlain(s.sgst)}</td>
        <td class="r">${inrPlain(s.gst)}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  @page { margin: 14mm 12mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111827; font-size: 11px; margin: 0; }
  .top { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1e40af; padding-bottom: 12px; }
  .logo { width: 74px; height: 74px; object-fit: contain; border-radius: 10px; }
  .logo.placeholder { display: flex; align-items: center; justify-content: center; background: #1e40af; color: #fff; font-size: 26px; font-weight: 800; }
  .bname { font-size: 21px; font-weight: 800; color: #1e40af; margin-bottom: 7px; }
  .bline { line-height: 1.55; color: #374151; }
  .quote { text-align: right; }
  .quote h1 { font-size: 24px; letter-spacing: 3px; color: #1e40af; margin: 0 0 4px; }
  .qno { font-size: 13px; font-weight: 700; color: #111827; }
  .right-head { text-align: right; margin-top: 14px; }
  .right-head .big { font-size: 15px; font-weight: 800; }
  .right-head .small { color: #6b7280; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1e40af; color: #fff; font-size: 10px; text-align: left; padding: 7px 6px; font-weight: 700; }
  th.r, td.r { text-align: right; }
  th.c, td.c { text-align: center; }
  td { padding: 7px 6px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  .iname { font-weight: 700; }
  .idesc, .ihsn { color: #6b7280; font-size: 10px; margin-top: 1px; }
  .disc { color: #b91c1c; font-size: 9px; }
  .totals { width: 320px; margin-left: auto; margin-top: 10px; }
  .totals td { border: none; padding: 4px 6px; }
  .totals .lbl { color: #374151; }
  .totals .amt { text-align: right; font-weight: 600; }
  .totals .grand td { border-top: 2px solid #1e40af; font-size: 14px; font-weight: 800; color: #1e40af; padding-top: 6px; }
  .tax-table { width: 320px; margin-left: auto; margin-top: 8px; }
  .tax-table th { font-size: 9px; padding: 5px 6px; }
  .tax-table td { padding: 5px 6px; font-size: 10px; }
  .words { margin-top: 14px; padding: 9px 12px; background: #f3f4f6; border-left: 3px solid #1e40af; font-style: italic; color: #374151; }
  .midsection { display: flex; gap: 16px; margin-top: 16px; }
  .mid { flex: 1; }
  .head2 { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #1e40af; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; margin-bottom: 6px; }
  .bank div { padding: 1.5px 0; }
  .notes { white-space: pre-wrap; color: #374151; line-height: 1.55; }
  .bottom { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 34px; }
  .con { font-size: 11px; color: #1e40af; font-weight: 800; }
  .sig { text-align: center; }
  .sig .line { width: 180px; border-top: 1px solid #374151; margin-bottom: 5px; display: inline-block; }
  .signame { font-weight: 700; }
  .sigsub { color: #6b7280; font-size: 10px; }
</style>
</head>
<body>
  <div class="top">
    <div style="display:flex; gap:12px; align-items:center;">
      ${logo}
      <div>
        <div class="bname">${esc(profile.businessName || 'Your Business Name')}</div>
        <div class="bline">
          ${esc(profile.tagline)}<br/>
          ${esc(profile.address)}${profile.address ? '<br/>' : ''}
          ${[profile.city, profile.state, profile.pincode].filter(Boolean).map(esc).join(', ')}<br/>
          ${[profile.phone, profile.email].filter(Boolean).map(esc).join(' · ')}
          ${profile.website ? `<br/>${esc(profile.website)}` : ''}
          ${profile.gstin ? `<br/><b>GSTIN:</b> ${esc(profile.gstin)}` : ''}
        </div>
      </div>
    </div>
    <div class="quote">
      <h1>QUOTATION</h1>
      <div class="qno">${esc(q.number)}</div>
    </div>
  </div>

  <div class="midsection">
    <div class="mid">
      <div class="head2">Quotation for</div>
      <div class="bline">
        <b>${esc(q.customer.name || '—')}</b><br/>
        ${q.customer.gstin ? `GSTIN: ${esc(q.customer.gstin)}<br/>` : ''}
        ${esc(q.customer.address)}${q.customer.address ? '<br/>' : ''}
        ${[q.customer.phone, q.customer.email].filter(Boolean).map(esc).join(' · ')}
      </div>
    </div>
    <div class="mid right-head">
      <div class="big">Quotation date: ${esc(formatDate(q.date))}</div>
      <div class="small">Valid until: ${esc(formatDate(q.validUntil))}</div>
    </div>
  </div>

  <table style="margin-top:14px;">
    <thead>
      <tr>
        <th class="c" style="width:26px;">#</th>
        <th>Item &amp; description</th>
        <th class="c" style="width:44px;">Unit</th>
        <th class="r" style="width:52px;">Qty</th>
        <th class="r" style="width:64px;">Rate</th>
        <th class="c" style="width:44px;">GST</th>
        <th class="r" style="width:76px;">Taxable</th>
        <th class="r" style="width:76px;">Amount</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <table class="totals">
    <tr><td class="lbl">Subtotal</td><td class="amt">${inrPlain(calc.subtotal)}</td></tr>
    ${
      calc.discount > 0
        ? `<tr><td class="lbl">Discount</td><td class="amt">- ${inrPlain(calc.discount)}</td></tr>`
        : ''
    }
    <tr><td class="lbl">Taxable value</td><td class="amt">${inrPlain(calc.taxableValue)}</td></tr>
    ${calc.bySlab
      .map((s) => `<tr><td class="lbl">CGST @ ${s.rate}% + SGST @ ${s.rate}%</td><td class="amt">${inrPlain(s.gst)}</td></tr>`)
      .join('')}
    ${calc.roundOff !== 0 ? `<tr><td class="lbl">Round off</td><td class="amt">${calc.roundOff > 0 ? '+' : '-'} ${inrPlain(Math.abs(calc.roundOff))}</td></tr>` : ''}
    <tr class="grand"><td class="lbl">Grand total</td><td class="amt">₹ ${inrPlain(calc.roundedTotal)}</td></tr>
  </table>

  <div class="words">Amount in words: <b>${esc(amountInWords(calc.roundedTotal))}</b></div>

  ${
    calc.bySlab.length > 0
      ? `<table class="tax-table">
          <thead><tr><th class="r">GST rate</th><th class="r">Taxable</th><th class="r">CGST</th><th class="r">SGST</th><th class="r">Total GST</th></tr></thead>
          <tbody>${slabRows}</tbody>
        </table>`
      : ''
  }

  <div class="midsection terms">
    <div class="mid">
      <div class="head2">Notes</div>
      <div class="notes">${esc(q.notes || '—')}</div>
    </div>
    <div class="mid">
      <div class="head2">Terms &amp; conditions</div>
      <div class="notes">${esc(q.terms || '—')}</div>
    </div>
  </div>

  ${
    profile.bankName || profile.upiId
      ? `<div class="midsection" style="margin-top:18px;">
          <div class="bank">
            <div class="head2">Bank details</div>
            ${profile.bankName ? `<div><b>${esc(profile.bankName)}</b></div>` : ''}
            ${profile.bankAccount ? `<div>A/c: ${esc(profile.bankAccount)}</div>` : ''}
            ${profile.bankIfsc ? `<div>IFSC: ${esc(profile.bankIfsc)}</div>` : ''}
            ${profile.upiId ? `<div>UPI: ${esc(profile.upiId)}</div>` : ''}
          </div>
        </div>`
      : ''
  }

  <div class="bottom">
    <div class="con">
      For ${esc(profile.businessName || 'Your Business')}<br/>
      Authorised signatory
    </div>
    <div class="sig">
      <div class="line"></div>
      <div class="signame">${esc(profile.signatureName || profile.businessName || '')}</div>
      <div class="sigsub">Authorised signatory</div>
    </div>
  </div>

  <div class="bottom" style="margin-top:16px; font-size:9px; color:#9ca3af;">
    <span>This is a computer generated quotation.</span>
    <span>${esc(profile.businessName || '')} · Contact: ${[profile.phone, profile.email].filter(Boolean).map(esc).join(' / ')}</span>
  </div>
</body>
</html>`;
}

function wordSafeHtml(html: string): string {
  return html
    .replace(
      '<head>',
      `<head>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<meta name="ProgId" content="Word.Document" />
<meta name="Generator" content="VyaparQuotes" />`,
    )
    .replace('</head>', '<style>body{font-family:Calibri,Arial,sans-serif;}</style></head>');
}

/** Word-compatible document (saved as .doc — opens in MS Word/Google Docs/WPS). */
export function quoteDoc(profile: CompanyProfile, q: Quotation): string {
  return wordSafeHtml(quoteHtml(profile, q));
}

export function quoteHtmlFile(profile: CompanyProfile, q: Quotation): string {
  return quoteHtml(profile, q);
}

/* ------------------------------------------------------------------ */
/* Plain text                                                          */
/* ------------------------------------------------------------------ */

export function quoteText(profile: CompanyProfile, q: Quotation): string {
  const calc = calcQuote(q.items);
  const L: string[] = [];
  const line = '='.repeat(58);
  const thin = '-'.repeat(58);
  const push = (s = '') => L.push(s);

  push(line);
  push((profile.businessName || 'Your Business Name').toUpperCase());
  if (profile.tagline) push(profile.tagline);
  push(line);
  push(`${profile.address}${profile.address ? ', ' : ''}${[profile.city, profile.state, profile.pincode].filter(Boolean).join(', ')}`);
  if (profile.phone) push(`Phone : ${profile.phone}`);
  if (profile.email) push(`Email : ${profile.email}`);
  if (profile.website) push(`Web   : ${profile.website}`);
  if (profile.gstin) push(`GSTIN : ${profile.gstin}`);
  push();
  push('                QUOTATION');
  push(`Quotation No.  : ${q.number}`);
  push(`Date           : ${formatDate(q.date)}`);
  push(`Valid until    : ${formatDate(q.validUntil)}`);
  push();
  push('QUOTATION FOR');
  push(`  ${q.customer.name || '—'}`);
  if (q.customer.gstin) push(`  GSTIN: ${q.customer.gstin}`);
  if (q.customer.address) push(`  ${q.customer.address}`);
  if (q.customer.phone) push(`  Phone: ${q.customer.phone}`);
  if (q.customer.email) push(`  Email: ${q.customer.email}`);
  push();

  push(thin);
  push('#  ITEM                                     QTY    RATE      GST   AMOUNT');
  push(thin);
  calc.lines.forEach((l, i) => {
    const item = q.items[i];
    const name = (item?.name || 'Item').slice(0, 36);
    push(
      String(i + 1).padEnd(3) +
        name.padEnd(41) +
        String(item?.qty || 0).padStart(6) +
        (item?.rate ?? 0).toFixed(2).padStart(10) +
        String(item?.gstRate ?? 0).padStart(5) + '%' +
        l.total.toFixed(2).padStart(11),
    );
    if (item?.description) push(`     ${item.description}`);
  });
  push(thin);
  push(`Subtotal                                  ${calc.subtotal.toFixed(2)}`);
  if (calc.discount > 0) push(`Discount                                  -${calc.discount.toFixed(2)}`);
  push(`Taxable value                             ${calc.taxableValue.toFixed(2)}`);
  calc.bySlab.forEach((s) => {
    push(`GST @ ${s.rate}% (CGST + SGST)                    ${s.gst.toFixed(2)}`);
  });
  push(line);
  push(`GRAND TOTAL (inclusive)                   ₹ ${calc.roundedTotal.toFixed(2)}`);
  push(line);
  push(`Amount in words : ${amountInWords(calc.roundedTotal)}`);
  push();

  if (q.notes) {
    push('NOTES');
    q.notes.split('\n').forEach((n) => push(`  ${n}`));
    push();
  }
  if (q.terms) {
    push('TERMS & CONDITIONS');
    q.terms.split('\n').forEach((n) => push(`  ${n}`));
    push();
  }
  if (profile.bankName || profile.upiId) {
    push('BANK / PAYMENT DETAILS');
    if (profile.bankName) push(`  Bank: ${profile.bankName}`);
    if (profile.bankAccount) push(`  A/c: ${profile.bankAccount}`);
    if (profile.bankIfsc) push(`  IFSC: ${profile.bankIfsc}`);
    if (profile.upiId) push(`  UPI: ${profile.upiId}`);
    push();
  }
  push();
  push(`For ${profile.businessName || 'Your Business'}`);
  push();
  push();
  push(`Signature: ${profile.signatureName || ''}`);
  push('(Authorised signatory)');
  push();
  push(`Generated by VyaparQuotes — ${formatDate(new Date().toISOString())}`);

  return L.join('\n');
}
