import AsyncStorage from '@react-native-async-storage/async-storage';
import { CompanyProfile, DEFAULT_PROFILE, DEFAULT_TERMS, Product, Quotation } from './types';
import { todayIso, uid, addDaysIso } from './format';

const KEYS = {
  profile: 'gq.profile.v1',
  products: 'gq.products.v1',
  quotes: 'gq.quotes.v1',
};

export async function loadProfile(): Promise<CompanyProfile> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.profile);
    if (!raw) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(raw) as Partial<CompanyProfile>;
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      terms: parsed.terms || DEFAULT_TERMS,
      quotePrefix: parsed.quotePrefix || 'QTN',
      quoteNext: typeof parsed.quoteNext === 'number' ? parsed.quoteNext : 1,
    };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export async function saveProfile(p: CompanyProfile): Promise<void> {
  await AsyncStorage.setItem(KEYS.profile, JSON.stringify(p));
}

export async function loadProducts(): Promise<Product[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.products);
    return raw ? (JSON.parse(raw) as Product[]) : [];
  } catch {
    return [];
  }
}

export async function saveProducts(ps: Product[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.products, JSON.stringify(ps));
}

export async function loadQuotes(): Promise<Quotation[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.quotes);
    return raw ? (JSON.parse(raw) as Quotation[]) : [];
  } catch {
    return [];
  }
}

export async function saveQuotes(qs: Quotation[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.quotes, JSON.stringify(qs));
}

export function nextQuoteNumber(prefix: string, n: number): string {
  return `${prefix}-${String(n).padStart(4, '0')}`;
}

export function createQuotation(profile: CompanyProfile): Quotation {
  return {
    id: uid(),
    number: nextQuoteNumber(profile.quotePrefix || 'QTN', profile.quoteNext || 1),
    date: todayIso(),
    validUntil: addDaysIso(15),
    customer: { name: '', phone: '', email: '', address: '', gstin: '' },
    items: [],
    notes: '',
    terms: profile.terms || DEFAULT_TERMS,
    status: 'draft',
  };
}

export function sampleProduct(): Product {
  return {
    id: uid(),
    name: '',
    description: '',
    hsn: '',
    unit: 'Pcs',
    rate: 0,
    gstRate: 18,
    gstInclusive: false,
  };
}
