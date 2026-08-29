import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '@/context/app-context';
import { calcQuote } from '@/lib/gst';
import { amountInWords, formatDate, inr } from '@/lib/format';
import { buildQuotePdf, sharePdf } from '@/lib/pdf';
import { Badge, Button, Card, palette, Screen } from '@/components/ui';

export default function PreviewScreen() {
  const { id, share } = useLocalSearchParams<{ id: string; share?: string }>();
  const { profile, quotes, setQuotes } = useApp();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const quote = useMemo(() => quotes.find((q) => q.id === id), [quotes, id]);
  const calc = useMemo(() => (quote ? calcQuote(quote.items) : null), [quote]);

  useEffect(() => {
    if (share === '1' && quote) {
      doShare();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [share, quote?.id]);

  if (!quote || !calc) {
    return (
      <Screen style={styles.center}>
        <Text style={styles.missing}>Quotation not found.</Text>
        <Button title="Back to home" onPress={() => router.replace('/')} style={{ marginTop: 14, paddingHorizontal: 40 }} />
      </Screen>
    );
  }

  const doShare = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const uri = await buildQuotePdf(profile, quote);
      await sharePdf(uri);
    } catch (e) {
      Alert.alert('Could not create PDF', String(e));
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (status: 'sent' | 'accepted' | 'rejected') => {
    const next = quotes.map((q) => (q.id === quote.id ? { ...q, status } : q));
    await setQuotes(next);
    Alert.alert('Status updated', `Marked as ${status}.`);
  };

  const callCustomer = () => {
    if (quote.customer.phone) {
      Linking.openURL(`tel:${quote.customer.phone}`).catch(() => {});
    }
  };
  const mailCustomer = () => {
    if (quote.customer.email) {
      Linking.openURL(`mailto:${quote.customer.email}?subject=Quotation ${quote.number}`).catch(() => {});
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        <Card>
          <View style={styles.head}>
            <View style={{ flex: 1 }}>
              <Text style={styles.number}>{quote.number}</Text>
              <Text style={styles.date}>
                {formatDate(quote.date)} · valid till {formatDate(quote.validUntil)}
              </Text>
            </View>
            <Badge label={quote.status} tone={quote.status === 'accepted' ? 'green' : quote.status === 'sent' ? 'amber' : quote.status === 'rejected' ? 'red' : 'gray'} />
          </View>

          <View style={styles.customerCard}>
            <Text style={styles.custLabel}>Quotation for</Text>
            <Text style={styles.custName}>{quote.customer.name || '—'}</Text>
            {!!quote.customer.gstin && <Text style={styles.custMeta}>GSTIN: {quote.customer.gstin}</Text>}
            {!!quote.customer.address && <Text style={styles.custMeta}>{quote.customer.address}</Text>}
            <View style={styles.contactRow}>
              {!!quote.customer.phone && (
                <Pressable onPress={callCustomer} style={styles.contactBtn}>
                  <Text style={styles.contactText}>📞 Call</Text>
                </Pressable>
              )}
              {!!quote.customer.email && (
                <Pressable onPress={mailCustomer} style={styles.contactBtn}>
                  <Text style={styles.contactText}>✉️ Email</Text>
                </Pressable>
              )}
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 320 }}>
            <View>
              <View style={[styles.tRow, styles.tHead]}>
                <Text style={[styles.tCell, { width: 26 }]}>#</Text>
                <Text style={[styles.tCell, { flex: 1 }]}>Item</Text>
                <Text style={[styles.tCell, styles.tRight, { width: 70 }]}>Qty</Text>
                <Text style={[styles.tCell, styles.tRight, { width: 80 }]}>Rate</Text>
                <Text style={[styles.tCell, styles.tCenter, { width: 44 }]}>GST</Text>
                <Text style={[styles.tCell, styles.tRight, { width: 86 }]}>Amount</Text>
              </View>
              {quote.items.map((item, i) => {
                const l = calc.lines[i];
                return (
                  <View key={item.id} style={styles.tRow}>
                    <Text style={[styles.tCell, { width: 26 }]}>{i + 1}</Text>
                    <Text style={[styles.tCell, { flex: 1 }]} numberOfLines={2}>
                      {item.name}
                      {item.hsn ? `\n${item.hsn}` : ''}
                    </Text>
                    <Text style={[styles.tCell, styles.tRight, { width: 70 }]}>{item.qty} {item.unit}</Text>
                    <Text style={[styles.tCell, styles.tRight, { width: 80 }]}>{inr(item.rate)}</Text>
                    <Text style={[styles.tCell, styles.tCenter, { width: 44 }]}>{item.gstRate}%</Text>
                    <Text style={[styles.tCell, styles.tRight, { width: 86 }]}>{inr(l?.total ?? 0)}</Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.totals}>
            <View style={styles.tRow}><Text style={styles.tLbl}>Subtotal</Text><Text style={styles.tVal}>{inr(calc.subtotal)}</Text></View>
            {calc.discount > 0 && (
              <View style={styles.tRow}><Text style={styles.tLbl}>Discount</Text><Text style={styles.tVal}>{inr(-calc.discount)}</Text></View>
            )}
            {calc.bySlab.map((s) => (
              <View key={s.rate} style={styles.tRow}>
                <Text style={styles.tLbl}>GST @ {s.rate}%</Text>
                <Text style={styles.tVal}>{inr(s.gst)}</Text>
              </View>
            ))}
            <View style={[styles.tRow, styles.grandRow]}>
              <Text style={styles.grandLbl}>Grand total</Text>
              <Text style={styles.grandVal}>{inr(calc.roundedTotal)}</Text>
            </View>
            <Text style={styles.words}>{amountInWords(calc.roundedTotal)}</Text>
          </View>
        </Card>

        {!!quote.notes && (
          <Card style={{ marginTop: 14 }}>
            <Text style={styles.sectionLbl}>Notes</Text>
            <Text style={styles.body}>{quote.notes}</Text>
          </Card>
        )}
        {!!quote.terms && (
          <Card style={{ marginTop: 14 }}>
            <Text style={styles.sectionLbl}>Terms & conditions</Text>
            <Text style={styles.body}>{quote.terms}</Text>
          </Card>
        )}

        <View style={styles.actions}>
          <Button title="✏️ Edit" variant="outline" onPress={() => router.push({ pathname: '/quote/[id]', params: { id: quote.id } })} />
          <Button title="📄 Share PDF" loading={busy} onPress={doShare} />
        </View>

        <View style={styles.statusRow}>
          <Pressable style={[styles.statusBtn, styles.statusSent]} onPress={() => setStatus('sent')}>
            <Text style={styles.statusText}>Mark sent</Text>
          </Pressable>
          <Pressable style={[styles.statusBtn, styles.statusAccepted]} onPress={() => setStatus('accepted')}>
            <Text style={styles.statusBtnTextWhite}>✓ Accepted</Text>
          </Pressable>
          <Pressable style={[styles.statusBtn, styles.statusRejected]} onPress={() => setStatus('rejected')}>
            <Text style={styles.statusBtnTextWhite}>✕ Rejected</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  missing: { color: palette.sub, fontSize: 16 },
  head: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  number: { fontSize: 20, fontWeight: '800', color: palette.ink },
  date: { fontSize: 13, color: palette.sub, marginTop: 2 },
  customerCard: {
    backgroundColor: palette.bg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  custLabel: { fontSize: 11, fontWeight: '800', color: palette.faint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  custName: { fontSize: 16, fontWeight: '700', color: palette.ink },
  custMeta: { fontSize: 13, color: palette.sub, marginTop: 2 },
  contactRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  contactBtn: {
    backgroundColor: palette.brandSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  contactText: { color: palette.brand, fontSize: 12.5, fontWeight: '700' },
  tRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: palette.line, paddingVertical: 7 },
  tHead: { borderBottomWidth: 2, borderBottomColor: palette.brand },
  tCell: { fontSize: 12.5, color: palette.ink, paddingHorizontal: 3 },
  tRight: { textAlign: 'right' },
  tCenter: { textAlign: 'center' },
  totals: { marginTop: 8 },
  tLbl: { color: palette.sub, fontSize: 14 },
  tVal: { color: palette.ink, fontSize: 14, fontWeight: '600' },
  grandRow: { borderTopWidth: 2, borderTopColor: palette.brand, marginTop: 4, paddingTop: 8 },
  grandLbl: { color: palette.ink, fontSize: 16, fontWeight: '800' },
  grandVal: { color: palette.brand, fontSize: 18, fontWeight: '800' },
  words: { fontStyle: 'italic', color: palette.sub, fontSize: 12, marginTop: 8, lineHeight: 18 },
  sectionLbl: { fontSize: 12, fontWeight: '800', color: palette.faint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  body: { fontSize: 13.5, color: palette.sub, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  statusRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  statusBtn: { flex: 1, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  statusSent: { backgroundColor: palette.amberSoft, borderWidth: 1, borderColor: '#fcd34d' },
  statusAccepted: { backgroundColor: palette.green },
  statusRejected: { backgroundColor: palette.red },
  statusText: { fontWeight: '700', color: palette.amber, fontSize: 13 },
  statusBtnTextWhite: { fontWeight: '700', color: '#fff', fontSize: 13 },
});
