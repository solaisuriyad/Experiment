export type GstRate = 0 | 5 | 12 | 18 | 28;
export const GST_RATES: GstRate[] = [0, 5, 12, 18, 28];

export interface CompanyProfile {
  businessName: string;
  tagline: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
  gstin: string;
  bankName: string;
  bankAccount: string;
  bankIfsc: string;
  upiId: string;
  logoUri: string | null;
  terms: string;
  quotePrefix: string;
  quoteNext: number;
  signatureName: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  hsn: string;
  unit: string;
  rate: number;
  gstRate: GstRate;
  gstInclusive: boolean;
}

export interface QuoteItem {
  id: string;
  name: string;
  description: string;
  hsn: string;
  unit: string;
  qty: number;
  rate: number;
  gstRate: GstRate;
  gstInclusive: boolean;
  discountPct: number;
}

export interface Customer {
  name: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

export interface Quotation {
  id: string;
  number: string;
  date: string;
  validUntil: string;
  customer: Customer;
  items: QuoteItem[];
  notes: string;
  terms: string;
  status: QuoteStatus;
}

export const DEFAULT_TERMS = [
  '1. This quotation is valid for 15 days from the date of issue.',
  '2. Prices are exclusive of GST, transport and packaging unless stated otherwise.',
  '3. Payment terms: 50% advance with order, balance before delivery.',
  '4. Goods once sold will not be taken back or exchanged.',
  '5. Subject to local jurisdiction.',
].join('\n');

export const DEFAULT_PROFILE: CompanyProfile = {
  businessName: '',
  tagline: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
  email: '',
  website: '',
  gstin: '',
  bankName: '',
  bankAccount: '',
  bankIfsc: '',
  upiId: '',
  logoUri: null,
  terms: DEFAULT_TERMS,
  quotePrefix: 'QTN',
  quoteNext: 1,
  signatureName: '',
};
