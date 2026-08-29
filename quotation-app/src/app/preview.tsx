import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
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
import { exportQuote, EXPORT_OPTIONS, ExportFormat, ExportOutcome } from '@/lib/exporters';
import { Badge, Button, Card, palette, Screen, SectionHeader } from '@/components/ui';

export default function PreviewScreen() {
  const { id, share } = useLocalSearchParams<{ id: string; share?: string }>();
  const { profile, quotes, setQuotes } = useApp();
  const router = useRouter();
  const [exportOpen, setExportOpen] = useState(false);
  const [busyFormat, setBusyFormat] = useState<ExportFormat | null>(null);

  const quote = useMemo(() => quotes.find((q) => q.id === id), [quotes, id]);
  const calc = useMemo(() => (quote ? calcQuote(quote.items) : null), [quote]);

  const doExport = async (format: ExportFormat) => {
    if (!quote || busyFormat) return;
    setBusyFormat(format);
    try {
      const outcome: ExportOutcome = await exportQuote(profile, quote, format);
      setExportOpen(false);
      Alert.alert(
        outcome.format === 'pdf' && outcome.action === 'printed' ? 'Print / Save as PDF' : 'Quotation exported',
        outcome.detail,
        [
          {
            text: outcome.action === 'printed' ? 'OK' : 'Done',
          },
        ],
      );
    } catch (e) {
      Alert.alert('Export failed', String(e instanceof Error ? e.message : e));
    } finally {
      setBusyFormat(null);
    }
  };

  useEffect(() => {
    if (share === '1' && quote) {
      void doExport('pdf');
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
          <Button title="⬇️ Export / Download" onPress={() => setExportOpen(true)} />
        </View>
        <Text style={styles.exportHint}>
          Download as PDF, Word (.doc), HTML or plain text. On a phone, "Save to Files" is available in the share sheet.
        </Text>

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

      <ExportSheet
        visible={exportOpen}
        busyFormat={busyFormat}
        onClose={() => setExportOpen(false)}
        onPick={(f) => void doExport(f)}
      />
    </Screen>
  );
}

function ExportSheet({
  visible,
  busyFormat,
  onClose,
  onPick,
}: {
  visible: boolean;
  busyFormat: ExportFormat | null;
  onClose: () => void;
  onPick: (f: ExportFormat) => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalWrap}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Export quotation</Text>
              <Text style={styles.modalSub}>Choose a format to download</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.close}>Close</Text>
            </Pressable>
          </View>
          {EXPORT_OPTIONS.map((o) => {
            const busy = busyFormat === o.id;
            return (
              <Pressable
                key={o.id}
                style={({ pressed }) => [styles.exportRow, pressed && { opacity: 0.7 }, busy && { opacity: 0.5 }]}
                onPress={() => onPick(o.id)}
                disabled={busyFormat !== null}
              >
                <Text style={styles.exportIcon}>{o.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exportLabel}>{busy ? `Preparing ${o.label}…` : o.label}</Text>
                  <Text style={styles.exportDesc}>{o.desc}</Text>
                </View>
                <Text style={styles.exportArrow}>›</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
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
  exportHint: { fontSize: 12, color: palette.faint, textAlign: 'center', marginTop: 8, lineHeight: 17 },
  statusRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  statusBtn: { flex: 1, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  statusSent: { backgroundColor: palette.amberSoft, borderWidth: 1, borderColor: '#fcd34d' },
  statusAccepted: { backgroundColor: palette.green },
  statusRejected: { backgroundColor: palette.red },
  statusText: { fontWeight: '700', color: palette.amber, fontSize: 13 },
  statusBtnTextWhite: { fontWeight: '700', color: '#fff', fontSize: 13 },
  modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.4)' },
  modalSheet: {
    backgroundColor: palette.bg,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    paddingBottom: 44,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: palette.ink },
  modalSub: { fontSize: 13, color: palette.sub, marginTop: 2 },
  close: { color: palette.red, fontWeight: '700' },
  exportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  exportIcon: { fontSize: 24, marginRight: 12 },
  exportLabel: { fontSize: 15, fontWeight: '700', color: palette.ink },
  exportDesc: { fontSize: 12.5, color: palette.sub, marginTop: 2 },
  exportArrow: { fontSize: 20, color: palette.faint, fontWeight: '700', marginLeft: 8 },
});
