import React from 'react';
import {
  ActivityIndicator,
  KeyboardTypeOptions,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

export const palette = {
  ink: '#0f172a',
  sub: '#64748b',
  faint: '#94a3b8',
  line: '#e2e8f0',
  bg: '#f8fafc',
  card: '#ffffff',
  brand: '#1d4ed8',
  brandDark: '#1e40af',
  brandSoft: '#eff6ff',
  green: '#15803d',
  greenSoft: '#f0fdf4',
  amber: '#b45309',
  amberSoft: '#fffbeb',
  red: '#b91c1c',
  redSoft: '#fef2f2',
};

type Variant = 'primary' | 'soft' | 'outline' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface BtnProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({ title, onPress, variant = 'primary', size = 'md', icon, disabled, loading, style }: BtnProps) {
  const s: StyleProp<ViewStyle> = [
    styles.btn,
    styles[`btn_${variant}`],
    size === 'sm' && styles.btn_sm,
    size === 'lg' && styles.btn_lg,
    (disabled || loading) && styles.btn_disabled,
    style,
  ];
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={({ pressed }) => [s, pressed && !disabled && styles.btn_pressed]}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#fff' : palette.brand} />
      ) : (
        <Text style={[styles.btn_text, styles[`btn_text_${variant}`], size === 'sm' && styles.btn_text_sm, size === 'lg' && styles.btn_text_lg]}>
          {icon ? `${icon}  ` : ''}
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function Screen({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

interface FieldProps extends TextInputProps {
  label?: string;
  prefix?: string;
  suffix?: string;
  containerStyle?: StyleProp<ViewStyle>;
  keyboardType?: KeyboardTypeOptions;
}

export function Field({ label, prefix, suffix, containerStyle, style, ...rest }: FieldProps) {
  return (
    <View style={[styles.fieldWrap, containerStyle]}>
      {label ? <Label>{label}</Label> : null}
      <View style={styles.inputRow}>
        {prefix ? <Text style={styles.affix}>{prefix}</Text> : null}
        <TextInput
          placeholderTextColor={palette.faint}
          autoCapitalize="sentences"
          style={[styles.input, prefix ? styles.inputWithAffix : null, suffix ? styles.inputWithAffix : null, style]}
          {...rest}
        />
        {suffix ? <Text style={styles.affix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

export function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Label>{label}</Label>
      <View style={styles.chips}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{subtitle}</Text>
    </View>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

export function Badge({ label, tone }: { label: string; tone: 'green' | 'amber' | 'red' | 'gray' }) {
  const bg = tone === 'green' ? palette.greenSoft : tone === 'amber' ? palette.amberSoft : tone === 'red' ? palette.redSoft : '#f1f5f9';
  const fg = tone === 'green' ? palette.green : tone === 'amber' ? palette.amber : tone === 'red' ? palette.red : palette.sub;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  card: {
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 6,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: palette.ink },
  label: { fontSize: 13, fontWeight: '600', color: palette.sub, marginBottom: 6 },
  fieldWrap: { marginBottom: 14 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 12,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: palette.ink,
  },
  inputWithAffix: { paddingLeft: 10 },
  affix: { paddingHorizontal: 12, fontSize: 15, color: palette.sub, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.card,
  },
  chipActive: { backgroundColor: palette.brand, borderColor: palette.brand },
  chipText: { fontSize: 14, fontWeight: '600', color: palette.sub },
  chipTextActive: { color: '#fff' },
  btn: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  btn_sm: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  btn_lg: { paddingVertical: 16, borderRadius: 14 },
  btn_primary: { backgroundColor: palette.brand },
  btn_soft: { backgroundColor: palette.brandSoft },
  btn_outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: palette.brand },
  btn_danger: { backgroundColor: palette.red },
  btn_ghost: { backgroundColor: 'transparent' },
  btn_disabled: { opacity: 0.5 },
  btn_pressed: { opacity: 0.85 },
  btn_text: { fontSize: 16, fontWeight: '700' },
  btn_text_sm: { fontSize: 13 },
  btn_text_lg: { fontSize: 17 },
  btn_text_primary: { color: '#fff' },
  btn_text_soft: { color: palette.brand },
  btn_text_outline: { color: palette.brand },
  btn_text_danger: { color: '#fff' },
  btn_text_ghost: { color: palette.brand },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyIcon: { fontSize: 44, marginBottom: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: palette.ink, marginBottom: 4 },
  emptySub: { fontSize: 14, color: palette.sub, textAlign: 'center', lineHeight: 20 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  divider: { height: 1, backgroundColor: palette.line, marginVertical: 14 },
});
