import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useApp } from '@/context/app-context';
import { GstRate, GST_RATES, Product } from '@/lib/types';
import { sampleProduct } from '@/lib/storage';
import { inr } from '@/lib/format';
import { Badge, Button, Card, EmptyState, Field, palette, Screen, SectionHeader, Select } from '@/components/ui';

function ProductEditor({
  initial,
  onSave,
  onDelete,
  onClose,
}: {
  initial: Product;
  onSave: (p: Product) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [p, setP] = useState<Product>(initial);
  const set = (patch: Partial<Product>) => setP((prev) => ({ ...prev, ...patch }));

  const save = () => {
    if (!p.name.trim()) {
      Alert.alert('Name required', 'Give the product a name.');
      return;
    }
    onSave(p);
    onClose();
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalWrap}>
        <View style={styles.modalSheet}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{initial.name ? 'Edit product' : 'New product'}</Text>
              <Pressable onPress={onClose} hitSlop={10}><Text style={styles.close}>Close</Text></Pressable>
            </View>
            <Field label="Product name *" value={p.name} onChangeText={(v) => set({ name: v })} placeholder="e.g. Steel Almirah" />
            <Field label="Description" value={p.description} onChangeText={(v) => set({ description: v })} placeholder="Optional" />
            <View style={styles.row2}>
              <Field label="HSN/SAC" value={p.hsn} onChangeText={(v) => set({ hsn: v })} placeholder="9403" containerStyle={{ flex: 1 }} />
              <Field label="Unit" value={p.unit} onChangeText={(v) => set({ unit: v })} placeholder="Pcs" containerStyle={{ flex: 1 }} />
            </View>
            <Field label="Selling rate (₹) *" value={String(p.rate || '')} onChangeText={(v) => set({ rate: parseFloat(v) || 0 })} keyboardType="decimal-pad" />
            <Select
              label="GST rate"
              value={String(p.gstRate)}
              options={GST_RATES.map((r) => ({ value: String(r), label: `${r}%` }))}
              onChange={(v) => set({ gstRate: parseInt(v) as GstRate })}
            />
            <View style={[styles.fieldWrap]}>
              <SectionHeader title="Price includes GST" />
              <Pressable
                style={[styles.incToggle, p.gstInclusive && styles.incToggleOn]}
                onPress={() => set({ gstInclusive: !p.gstInclusive })}
              >
                <Text style={[styles.incText, p.gstInclusive && styles.incTextOn]}>
                  {p.gstInclusive ? 'Yes — rate includes GST' : 'No — GST extra'}
                </Text>
              </Pressable>
            </View>
            <View style={styles.actions}>
              {onDelete ? (
                <Button title="Delete" variant="danger" onPress={onDelete} />
              ) : null}
              <Button title="Save product" onPress={save} style={{ flex: 1 }} />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function ProductsScreen() {
  const { products, setProducts } = useApp();
  const [editing, setEditing] = useState<Product | null>(null);
  const [showNew, setShowNew] = useState(false);

  const saveProduct = (p: Product) => {
    const exists = products.some((x) => x.id === p.id);
    const next = exists ? products.map((x) => (x.id === p.id ? p : x)) : [...products, p];
    void setProducts(next);
  };

  const deleteProduct = (p: Product) => {
    Alert.alert('Delete product?', `"${p.name}" will be removed from your catalog.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void setProducts(products.filter((x) => x.id !== p.id)),
      },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        <SectionHeader
          title="Your product catalog"
          action={
            <Pressable onPress={() => setShowNew(true)}>
              <Text style={styles.addLink}>+ Add</Text>
            </Pressable>
          }
        />
        <Text style={styles.hint}>
          Save your products here, then pick them while creating a quotation — no retyping.
        </Text>
        {products.length === 0 ? (
          <EmptyState
            icon="📦"
            title="No products yet"
            subtitle="Add the products you sell with their price and GST rate. They'll appear in the quotation builder."
          />
        ) : (
          products.map((p) => (
            <Pressable key={p.id} style={({ pressed }) => [styles.productRow, pressed && { opacity: 0.7 }]} onPress={() => setEditing(p)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pName}>{p.name}</Text>
                <Text style={styles.pMeta}>
                  {p.description}
                  {p.description ? ' · ' : ''}
                  {p.hsn ? `HSN ${p.hsn} · ` : ''}
                  {p.unit}
                </Text>
              </View>
              <View style={styles.pRight}>
                <Text style={styles.pRate}>{inr(p.rate)}</Text>
                <Badge label={`GST ${p.gstRate}%${p.gstInclusive ? ' incl.' : '+'}`} tone="gray" />
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      {showNew && (
        <ProductEditor initial={sampleProduct()} onSave={saveProduct} onClose={() => setShowNew(false)} />
      )}
      {editing && (
        <ProductEditor
          initial={editing}
          onSave={saveProduct}
          onDelete={() => {
            deleteProduct(editing);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row2: { flexDirection: 'row', gap: 10 },
  hint: { fontSize: 13.5, color: palette.sub, marginBottom: 14, marginTop: -4 },
  addLink: { color: palette.brand, fontWeight: '800', fontSize: 15 },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 14,
    marginBottom: 10,
  },
  pName: { fontSize: 15, fontWeight: '700', color: palette.ink },
  pMeta: { fontSize: 12.5, color: palette.faint, marginTop: 2 },
  pRight: { alignItems: 'flex-end', gap: 5, marginLeft: 10 },
  pRate: { fontSize: 16, fontWeight: '800', color: palette.ink },
  modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.4)' },
  modalSheet: {
    backgroundColor: palette.bg,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    paddingBottom: 44,
    maxHeight: '92%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: palette.ink },
  close: { color: palette.red, fontWeight: '700' },
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
  fieldWrap: { marginBottom: 14 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
});
