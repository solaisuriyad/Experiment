import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  CompanyProfile,
  DEFAULT_PROFILE,
  Product,
  Quotation,
} from '@/lib/types';
import {
  loadProducts,
  loadProfile,
  loadQuotes,
  saveProducts,
  saveProfile,
  saveQuotes,
} from '@/lib/storage';

interface AppContextValue {
  ready: boolean;
  profile: CompanyProfile;
  products: Product[];
  quotes: Quotation[];
  updateProfile: (p: CompanyProfile) => Promise<void>;
  setProducts: (p: Product[]) => Promise<void>;
  setQuotes: (q: Quotation[]) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  nextQuoteNumberPreview: string;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfileState] = useState<CompanyProfile>(DEFAULT_PROFILE);
  const [products, setProductsState] = useState<Product[]>([]);
  const [quotes, setQuotesState] = useState<Quotation[]>([]);

  useEffect(() => {
    (async () => {
      const [p, pr, q] = await Promise.all([loadProfile(), loadProducts(), loadQuotes()]);
      setProfileState(p);
      setProductsState(pr);
      setQuotesState(q);
      setReady(true);
    })();
  }, []);

  const updateProfile = useCallback(async (p: CompanyProfile) => {
    setProfileState(p);
    await saveProfile(p);
  }, []);

  const setProducts = useCallback(async (p: Product[]) => {
    setProductsState(p);
    await saveProducts(p);
  }, []);

  const setQuotes = useCallback(async (q: Quotation[]) => {
    setQuotesState(q);
    await saveQuotes(q);
  }, []);

  const deleteQuote = useCallback(
    async (id: string) => {
      const next = quotes.filter((q) => q.id !== id);
      setQuotesState(next);
      await saveQuotes(next);
    },
    [quotes],
  );

  const nextQuoteNumberPreview = useMemo(() => {
    const n = profile.quoteNext || 1;
    return `${profile.quotePrefix || 'QTN'}-${String(n).padStart(4, '0')}`;
  }, [profile.quoteNext, profile.quotePrefix]);

  const value = useMemo(
    () => ({
      ready,
      profile,
      products,
      quotes,
      updateProfile,
      setProducts,
      setQuotes,
      deleteQuote,
      nextQuoteNumberPreview,
    }),
    [ready, profile, products, quotes, updateProfile, setProducts, setQuotes, deleteQuote, nextQuoteNumberPreview],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
