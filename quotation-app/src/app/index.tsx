import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/app-context';
import { calcQuote } from '@/lib/gst';
import { compactNumber, formatDate, inr } from '@/lib/format';
import { Badge, Button, Card, EmptyState, palette, Screen, SectionHeader } from '@/components/ui';

const statusTone: Record<string, 'green' | 'amber' | 'red' | 'gray'> = {
  accepted: 'green',
  sent: 'amber',
  rejected: 'red',
  draft: 'gray',
};

export default function HomeScreen() {
  const { profile, quotes, products, ready } = useApp();
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'draft' | 'sent' | 'accepted'>('all');

  const filtered = useMemo(
    () => (filter === 'all' ? quotes : quotes.filter((q) => q.status === filter)),
    [quotes, filter],
  );

  const stats = useMemo(() => {
    let total = 0;
    let open = 0;
    let accepted = 0;
    for (const q of quotes) {
      const t = calcQuote(q.items).roundedTotal;
      total += t;
      if (q.status === 'sent') open += t;
      if (q.status === 'accepted') accepted += t;
    }
    return { total, open, accepted };
  }, [quotes]);

  if (!ready) {
    return <Screen style={styles.center}><Text style={styles.loading}>Loading…</Text></Screen>;
  }

  const setupDone = Boolean(profile.businessName);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        {!setupDone && (
          <Card style={styles.setupCard}>
            <Text style={styles.setupTitle}>👋 Welcome! Let's set up your business</Text>
            <Text style={styles.setupText}>
              Add your company name, logo, GSTIN and bank details — they'll appear on every quotation PDF.
            </Text>
            <Button title="Complete setup" onPress={() => router.push('/settings')} />
          </Card>
        )}

        <View style={styles.statsRow}>
          <StatCard label="Quotes" value={String(quotes.length)} sub="total made" />
          <StatCard label="Open" value={compactNumber(stats.open)} sub="awaiting reply" accent />
          <StatCard label="Won" value={compactNumber(stats.accepted)} sub="accepted" />
        </View>

        <View style={styles.quickRow}>
          <Button title="＋ New quotation" onPress={() => router.push('/new-quote')} style={{ flex: 1 }} />
          <Button title="Products" variant="soft" onPress={() => router.push('/products')} style={{ flex: 1 }} />
        </View>

        <SectionHeader
          title="Your quotations"
          action={
            <View style={styles.filters}>
              {(['all', 'draft', 'sent', 'accepted'] as const).map((f) => (
                <Pressable key={f} onPress={() => setFilter(f)}>
                  <Text style={[styles.filter, filter === f && styles.filterActive]}>{f}</Text>
                </Pressable>
              ))}
            </View>
          }
        />

        {filtered.length === 0 ? (
          <EmptyState
            icon="📄"
            title={quotes.length === 0 ? 'No quotations yet' : 'Nothing in this filter'}
            subtitle={
              quotes.length === 0
                ? 'Create your first GST quotation in under a minute and share it as a PDF.'
                : 'Try a different filter.'
            }
          />
        ) : (
          filtered.map((q) => {
            const total = calcQuote(q.items).roundedTotal;
            return (
              <Pressable
                key={q.id}
                onPress={() => router.push({ pathname: '/preview', params: { id: q.id } })}
                style={({ pressed }) => [styles.quoteRow, pressed && { opacity: 0.7 }]}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.quoteTop}>
                    <Text style={styles.quoteNo}>{q.number}</Text>
                    <Badge label={q.status} tone={statusTone[q.status] ?? 'gray'} />
                  </View>
                  <Text style={styles.quoteCustomer}>{q.customer.name || 'Unnamed customer'}</Text>
                  <Text style={styles.quoteMeta}>
                    {formatDate(q.date)} · {q.items.length} item{q.items.length === 1 ? '' : 's'}
                  </Text>
                </View>
                <View style={styles.quoteRight}>
                  <Text style={styles.quoteTotal}>{inr(total)}</Text>
                  <Text style={styles.quoteAction}>View ›</Text>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <View style={styles.fabWrap}>
        <Pressable
          style={styles.fab}
          onPress={() => router.push('/new-quote')}
          onLongPress={() => Alert.alert('Quick add', 'Tap to start a new quotation.')}
        >
          <Text style={styles.fabText}>＋</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <Card style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, accent && { color: palette.brand }]}>{value}</Text>
      <Text style={styles.statSub}>{sub}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  loading: { color: palette.sub, fontSize: 16 },
  setupCard: { marginBottom: 14, backgroundColor: palette.brandSoft, borderColor: '#bfdbfe' },
  setupTitle: { fontSize: 17, fontWeight: '800', color: palette.ink, marginBottom: 6 },
  setupText: { fontSize: 14, color: palette.sub, lineHeight: 20, marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  stat: { flex: 1, padding: 12 },
  statLabel: { fontSize: 12, fontWeight: '700', color: palette.sub, textTransform: 'uppercase', letterSpacing: 0.4 },
  statValue: { fontSize: 22, fontWeight: '800', color: palette.ink, marginTop: 4 },
  statSub: { fontSize: 11, color: palette.faint, marginTop: 2 },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  filters: { flexDirection: 'row', gap: 12 },
  filter: { fontSize: 13, fontWeight: '700', color: palette.faint, textTransform: 'capitalize' },
  filterActive: { color: palette.brand },
  quoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 14,
    marginBottom: 10,
  },
  quoteTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  quoteNo: { fontSize: 13, fontWeight: '800', color: palette.brand },
  quoteCustomer: { fontSize: 15, fontWeight: '700', color: palette.ink, marginBottom: 2 },
  quoteMeta: { fontSize: 12.5, color: palette.faint },
  quoteRight: { alignItems: 'flex-end', marginLeft: 10 },
  quoteTotal: { fontSize: 16, fontWeight: '800', color: palette.ink },
  quoteAction: { fontSize: 12, fontWeight: '700', color: palette.brand, marginTop: 4 },
  fabWrap: { position: 'absolute', right: 18, bottom: 18 },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 30, fontWeight: '700', lineHeight: 34 },
});
