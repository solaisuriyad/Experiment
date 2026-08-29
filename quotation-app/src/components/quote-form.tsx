import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/app-context';
import { Customer, GstRate, GST_RATES, Product, Quotation, QuoteItem } from '@/lib/types';
import { calcQuote } from '@/lib/gst';
import { inr, uid, todayIso, addDaysIso, formatDate } from '@/lib/format';
import { Button, Card, Divider, Field, Label, palette, Screen, SectionHeader, Select } from './ui';

const emptyCustomer: Customer = { name: '', phone: '', email: '', address: '', gstin: '' };

function newItem(base?: Product): QuoteItem {
  return {
    id: uid(),
    name: base?.name ?? '',
    description: base?.description ?? '',
    hsn: base?.hsn ?? '',
    unit: base?.unit ?? 'Pcs',
    rate: base?.rate ?? 0,
    gstRate: base?.gstRate ?? 18,
    gstInclusive: base?.gstInclusive ?? false,
    qty: 1,
    discountPct: 0,
  };
}

function ItemEditor({
  item,
  onChange,
  onDelete,
}: {
  item: QuoteItem;
  onChange: (i: QuoteItem) => void;
  onDelete: () => void;
}) {
  const set = (patch: Partial<QuoteItem>) => onChange({ ...item, ...patch });
  return (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>Item</Text>
        <Pressable onPress={onDelete} hitSlop={10}>
          <Text style={styles.remove}>Remove</Text>
        </Pressable>
      </View>
      <Field label="Item name *" value={item.name} onChangeText={(v) => set({ name: v })} placeholder="e.g. Steel Almirah" />
      <Field label="Description" value={item.description} onChangeText={(v) => set({ description: v })} placeholder="Optional details" />
      <View style={styles.row2}>
        <Field label="HSN/SAC" value={item.hsn} onChangeText={(v) => set({ hsn: v })} placeholder="9403" containerStyle={{ flex: 1 }} />
        <Field
          label="Unit"
          value={item.unit}
          onChangeText={(v) => set({ unit: v })}
          placeholder="Pcs"
          containerStyle={{ flex: 1 }}
        />
      </View>
      <View style={styles.row2}>
        <Field
          label="Qty *"
          value={String(item.qty || '')}
          onChangeText={(v) => set({ qty: parseFloat(v) || 0 })}
          keyboardType="decimal-pad"
          containerStyle={{ flex: 1 }}
        />
        <Field
          label="Rate / unit (₹) *"
          value={String(item.rate || '')}
          onChangeText={(v) => set({ rate: parseFloat(v) || 0 })}
          keyboardType="decimal-pad"
          containerStyle={{ flex: 1 }}
        />
      </View>
      <View style={styles.row2}>
        <Select
          label="GST rate"
          value={String(item.gstRate)}
          options={GST_RATES.map((r) => ({ value: String(r), label: `${r}%` }))}
          onChange={(v) => set({ gstRate: parseInt(v) as GstRate })}
        />
      </View>
      <View style={styles.row2}>
        <Field
          label="Discount %"
          value={String(item.discountPct || '')}
          onChangeText={(v) => set({ discountPct: parseFloat(v) || 0 })}
          keyboardType="decimal-pad"
          containerStyle={{ flex: 1 }}
        />
        <View style={[styles.fieldWrap, { flex: 1 }]}>
          <Label>Price includes GST</Label>
          <Pressable
            style={[styles.incToggle, item.gstInclusive && styles.incToggleOn]}
            onPress={() => set({ gstInclusive: !item.gstInclusive })}
          >
            <Text style={[styles.incText, item.gstInclusive && styles.incTextOn]}>
              {item.gstInclusive ? 'Yes — rate includes GST' : 'No — GST extra'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function QuoteFormScreen({ quoteId }: { quoteId: string | null }) {
  const { profile, products, quotes, setQuotes, updateProfile, nextQuoteNumberPreview } = useApp();
  const router = useRouter();
  const editing = quoteId ? quotes.find((q) => q.id === quoteId) : undefined;

  const [customer, setCustomer] = useState<Customer>(emptyCustomer);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState(profile.terms);
  const [date, setDate] = useState(todayIso());
  const [validUntil, setValidUntil] = useState(addDaysIso(15));
  const [number, setNumber] = useState(nextQuoteNumberPreview);
  const [productPicker, setProductPicker] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (editing) {
      setCustomer(editing.customer);
      setItems(editing.items);
      setNotes(editing.notes);
      setTerms(editing.terms);
      setDate(editing.date);
      setValidUntil(editing.validUntil);
      setNumber(editing.number);
    } else {
      setNumber(nextQuoteNumberPreview);
    }
    setReady(true);
  }, [editing, nextQuoteNumberPreview]);

  const calc = useMemo(() => calcQuote(items), [items]);

  const addItem = (base?: Product) => setItems((prev) => [...prev, newItem(base)]);
  const updateItem = (id: string, patch: QuoteItem) =>
    setItems((prev) => prev.map((i) => (i.id === id ? patch : i)));

  const save = async (status: 'draft' | 'done', thenShare = false) => {
    if (!customer.name.trim()) {
      Alert.alert('Customer name required', 'Please enter the customer / company name.');
      return;
    }
    if (items.length === 0) {
      Alert.alert('No items', 'Add at least one item to the quotation.');
      return;
    }
    const q: Quotation = {
      id: editing?.id ?? uid(),
      number,
      date,
      validUntil,
      customer,
      items,
      notes,
      terms,
      status: editing?.status ?? 'draft',
    };
    const next = editing ? quotes.map((x) => (x.id === q.id ? q : x)) : [q, ...quotes];
    await setQuotes(next);
    if (!editing) {
      await updateProfile({ ...profile, quoteNext: (profile.quoteNext || 1) + 1 });
    }
    if (thenShare) {
      router.replace({ pathname: '/preview', params: { id: q.id, share: '1' } });
    } else {
      router.back();
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Card>
          <SectionHeader title="Quotation details" />
          <View style={styles.row2}>
            <Field label="Quotation no." value={number} onChangeText={setNumber} containerStyle={{ flex: 1 }} />
            <Field label="Date" value={formatDate(date)} editable={false} containerStyle={{ flex: 1 }} />
          </View>
          <Field label="Valid until" value={formatDate(validUntil)} editable={false} />
        </Card>

        <Card style={{ marginTop: 14 }}>
          <SectionHeader title="Customer" />
          <Field label="Name / company *" value={customer.name} onChangeText={(v) => setCustomer({ ...customer, name: v })} placeholder="Customer name" />
          <View style={styles.row2}>
            <Field label="Phone" value={customer.phone} onChangeText={(v) => setCustomer({ ...customer, phone: v })} keyboardType="phone-pad" containerStyle={{ flex: 1 }} />
            <Field label="Email" value={customer.email} onChangeText={(v) => setCustomer({ ...customer, email: v })} keyboardType="email-address" containerStyle={{ flex: 1 }} />
          </View>
          <Field label="Address" value={customer.address} onChangeText={(v) => setCustomer({ ...customer, address: v })} placeholder="Billing address" />
          <Field label="Customer GSTIN (optional)" value={customer.gstin} onChangeText={(v) => setCustomer({ ...customer, gstin: v.toUpperCase() })} autoCapitalize="characters" placeholder="22AAAAA0000A1Z5" />
        </Card>

        <Card style={{ marginTop: 14 }}>
          <SectionHeader
            title="Items"
            action={
              <Pressable onPress={() => setProductPicker(true)}>
                <Text style={styles.pickFrom}>Pick from catalog</Text>
              </Pressable>
            }
          />
          {items.length === 0 ? (
            <Text style={styles.noItems}>No items yet. Add one below or pick from your product catalog.</Text>
          ) : (
            items.map((item, idx) => (
              <ItemEditor
                key={item.id}
                item={item}
                onChange={(patch) => updateItem(item.id, patch)}
                onDelete={() => setItems((prev) => prev.filter((x) => x.id !== item.id))}
              />
            ))
          )}
          <Button variant="soft" title="+ Add item" onPress={() => addItem()} />
        </Card>

        <Card style={{ marginTop: 14 }}>
          <SectionHeader title="Summary" />
          {items.length > 0 && (
            <View>
              {calc.bySlab.map((s) => (
                <View key={s.rate} style={styles.sumRow}>
                  <Text style={styles.sumLabel}>GST @ {s.rate}%</Text>
                  <Text style={styles.sumValue}>{inr(s.gst)}</Text>
                </View>
              ))}
              <Divider />
              <View style={styles.sumRow}>
                <Text style={styles.sumLabelStrong}>Total (incl. GST)</Text>
                <Text style={styles.sumValueStrong}>{inr(calc.roundedTotal)}</Text>
              </View>
              {calc.roundOff !== 0 && (
                <View style={styles.sumRow}>
                  <Text style={styles.sumLabel}>Round off</Text>
                  <Text style={styles.sumValue}>{calc.roundOff > 0 ? '+' : ''}{inr(calc.roundOff)}</Text>
                </View>
              )}
            </View>
          )}
        </Card>

        <Card style={{ marginTop: 14 }}>
          <SectionHeader title="Notes & terms" />
          <Field label="Notes (shown on quotation)" value={notes} onChangeText={setNotes} multiline numberOfLines={3} placeholder="Payment terms, delivery, warranty…" />
          <Field label="Terms & conditions" value={terms} onChangeText={setTerms} multiline numberOfLines={6} />
        </Card>

        <View style={styles.actions}>
          <Button variant="outline" title="Save" onPress={() => save('draft')} style={{ flex: 1 }} />
          <Button variant="primary" title="Save & Preview" onPress={() => save('done', false)} style={{ flex: 1 }} />
        </View>
        <Pressable style={{ marginTop: 10 }} onPress={() => save('done', true)}>
          <Text style={styles.saveShare}>Save, preview & share PDF →</Text>
        </Pressable>
      </ScrollView>

      <ProductPickerModal
        visible={productPicker}
        products={products}
        onClose={() => setProductPicker(false)}
        onPick={(p) => {
          addItem(p);
          setProductPicker(false);
        }}
      />
    </Screen>
  );
}

function ProductPickerModal({
  visible,
  products,
  onClose,
  onPick,
}: {
  visible: boolean;
  products: Product[];
  onClose: () => void;
  onPick: (p: Product) => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalWrap}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Your catalog</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.close}>Close</Text>
            </Pressable>
          </View>
          <ScrollView style={{ maxHeight: 480 }} keyboardShouldPersistTaps="handled">
            {products.length === 0 ? (
              <Text style={styles.noItems}>
                Your catalog is empty. Add products from the Products tab to use them here.
              </Text>
            ) : (
              products.map((p) => (
                <Pressable key={p.id} style={styles.productRow} onPress={() => onPick(p)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{p.name || 'Unnamed product'}</Text>
                    <Text style={styles.productMeta}>
                      {p.description}
                      {p.description ? ' · ' : ''}₹{p.rate}/{p.unit} · GST {p.gstRate}%{p.gstInclusive ? ' (incl.)' : ''}
                    </Text>
                  </View>
                  <Text style={styles.addPlus}>+</Text>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  row2: { flexDirection: 'row', gap: 10 },
  itemCard: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fbfcfe',
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemTitle: { fontSize: 13, fontWeight: '700', color: palette.sub, textTransform: 'uppercase', letterSpacing: 0.5 },
  remove: { color: palette.red, fontWeight: '700', fontSize: 13 },
  incToggle: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 12,
    backgroundColor: palette.card,
  },
  incToggleOn: { backgroundColor: palette.greenSoft, borderColor: palette.green },
  incText: { fontSize: 14, color: palette.sub, fontWeight: '600' },
  incTextOn: { color: palette.green },
  pickFrom: { color: palette.brand, fontWeight: '700' },
  noItems: { color: palette.sub, fontSize: 14, marginBottom: 12, lineHeight: 20 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  sumLabel: { color: palette.sub, fontSize: 14 },
  sumValue: { color: palette.ink, fontSize: 14, fontWeight: '600' },
  sumLabelStrong: { color: palette.ink, fontSize: 16, fontWeight: '800' },
  sumValueStrong: { color: palette.brand, fontSize: 18, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  saveShare: { color: palette.brand, textAlign: 'center', fontWeight: '700', fontSize: 14 },
  modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.4)' },
  modalSheet: {
    backgroundColor: palette.bg,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    paddingBottom: 40,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: palette.ink },
  close: { color: palette.red, fontWeight: '700' },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  productName: { fontSize: 15, fontWeight: '700', color: palette.ink },
  productMeta: { fontSize: 12.5, color: palette.sub, marginTop: 2 },
  addPlus: { fontSize: 24, color: palette.brand, fontWeight: '800', marginLeft: 10 },
  fieldWrap: { marginBottom: 14 },
});
