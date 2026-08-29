import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { QuoteFormScreen } from '@/components/quote-form';

export default function EditQuoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <QuoteFormScreen quoteId={id ?? null} />;
}
