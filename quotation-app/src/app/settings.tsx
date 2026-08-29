import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '@/context/app-context';
import { CompanyProfile } from '@/lib/types';
import { Button, Card, Field, palette, Screen, SectionHeader } from '@/components/ui';

export default function SettingsScreen() {
  const { profile, updateProfile } = useApp();
  const [p, setP] = useState<CompanyProfile>(profile);
  const [saving, setSaving] = useState(false);
  const scrollRef = null;

  const set = (patch: Partial<CompanyProfile>) => setP((prev) => ({ ...prev, ...patch }));

  const pickLogo = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });
    if (!res.canceled && res.assets[0]) {
      const a = res.assets[0];
      const uri = a.base64
        ? `data:${a.mimeType || 'image/jpeg'};base64,${a.base64}`
        : a.uri;
      set({ logoUri: uri });
    }
  };

  const save = async () => {
    if (!p.businessName.trim()) {
      Alert.alert('Business name required', 'Enter your business name to save the profile.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile(p);
      Alert.alert('Saved', 'Your business profile is updated.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
        >
          <Card>
            <SectionHeader title="Brand" />
            <View style={styles.logoRow}>
              <Pressable onPress={pickLogo} style={styles.logoBox}>
                {p.logoUri ? (
                  <Image source={{ uri: p.logoUri }} style={styles.logoImg} />
                ) : (
                  <Text style={styles.logoPlaceholder}>＋ Logo</Text>
                )}
              </Pressable>
              <View style={{ flex: 1, gap: 8 }}>
                <Text style={styles.logoHint}>Add your brand logo — it appears at the top of every PDF.</Text>
                {p.logoUri ? (
                  <Pressable onPress={() => set({ logoUri: null })}>
                    <Text style={styles.removeLogo}>Remove logo</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
            <Field label="Business name *" value={p.businessName} onChangeText={(v) => set({ businessName: v })} placeholder="e.g. Shri Balaji Steels" />
            <Field label="Tagline" value={p.tagline} onChangeText={(v) => set({ tagline: v })} placeholder="e.g. Quality steel, fair prices" />
          </Card>

          <Card style={{ marginTop: 14 }}>
            <SectionHeader title="Contact & address" />
            <Field label="Address" value={p.address} onChangeText={(v) => set({ address: v })} placeholder="Shop / building, street" />
            <View style={styles.row3}>
              <Field label="City" value={p.city} onChangeText={(v) => set({ city: v })} containerStyle={{ flex: 1 }} />
              <Field label="State" value={p.state} onChangeText={(v) => set({ state: v })} containerStyle={{ flex: 1 }} />
              <Field label="PIN" value={p.pincode} onChangeText={(v) => set({ pincode: v })} keyboardType="number-pad" containerStyle={{ flex: 1 }} />
            </View>
            <View style={styles.row2}>
              <Field label="Phone" value={p.phone} onChangeText={(v) => set({ phone: v })} keyboardType="phone-pad" containerStyle={{ flex: 1 }} />
              <Field label="Email" value={p.email} onChangeText={(v) => set({ email: v })} keyboardType="email-address" containerStyle={{ flex: 1 }} />
            </View>
            <Field label="Website" value={p.website} onChangeText={(v) => set({ website: v })} autoCapitalize="none" placeholder="https://…" />
            <Field label="GSTIN" value={p.gstin} onChangeText={(v) => set({ gstin: v.toUpperCase() })} autoCapitalize="characters" placeholder="22AAAAA0000A1Z5" />
          </Card>

          <Card style={{ marginTop: 14 }}>
            <SectionHeader title="Bank / payment details" />
            <Field label="Bank name" value={p.bankName} onChangeText={(v) => set({ bankName: v })} placeholder="e.g. State Bank of India" />
            <Field label="Account number" value={p.bankAccount} onChangeText={(v) => set({ bankAccount: v })} keyboardType="number-pad" />
            <Field label="IFSC" value={p.bankIfsc} onChangeText={(v) => set({ bankIfsc: v.toUpperCase() })} autoCapitalize="characters" placeholder="SBIN0001234" />
            <Field label="UPI ID" value={p.upiId} onChangeText={(v) => set({ upiId: v })} autoCapitalize="none" placeholder="shop@upi" />
          </Card>

          <Card style={{ marginTop: 14 }}>
            <SectionHeader title="Quotation settings" />
            <View style={styles.row2}>
              <Field label="Number prefix" value={p.quotePrefix} onChangeText={(v) => set({ quotePrefix: v })} autoCapitalize="characters" containerStyle={{ flex: 1 }} />
              <Field label="Next number" value={String(p.quoteNext || 1)} onChangeText={(v) => set({ quoteNext: parseInt(v) || 1 })} keyboardType="number-pad" containerStyle={{ flex: 1 }} />
            </View>
            <Text style={styles.preview}>Next quotation: {p.quotePrefix || 'QTN'}-{String(p.quoteNext || 1).padStart(4, '0')}</Text>
            <Field
              label="Default terms & conditions"
              value={p.terms}
              onChangeText={(v) => set({ terms: v })}
              multiline
              numberOfLines={8}
            />
            <Field label="Authorised signatory name" value={p.signatureName} onChangeText={(v) => set({ signatureName: v })} placeholder="Your name for the signature line" />
          </Card>

          <Button title="Save profile" size="lg" loading={saving} onPress={save} style={{ marginTop: 18 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row2: { flexDirection: 'row', gap: 10 },
  row3: { flexDirection: 'row', gap: 8 },
  logoRow: { flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 16 },
  logoBox: {
    width: 84,
    height: 84,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: palette.line,
    borderStyle: 'dashed',
    backgroundColor: palette.bg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImg: { width: '100%', height: '100%' },
  logoPlaceholder: { color: palette.faint, fontWeight: '700', fontSize: 13 },
  logoHint: { color: palette.sub, fontSize: 13, lineHeight: 19 },
  removeLogo: { color: palette.red, fontWeight: '700', fontSize: 13 },
  preview: { fontSize: 13, color: palette.brand, fontWeight: '700', marginBottom: 14 },
});
