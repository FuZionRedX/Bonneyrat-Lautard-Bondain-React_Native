// Shared building blocks for the "fresh & soft" design.
import Feather from '@expo/vector-icons/Feather';
import React, { type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  type StyleProp,
  StyleSheet,
  Text,
  type TextStyle,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { CATEGORY_LABELS } from '@/constants/meals';
import { Colors, Fonts, Radius, type ThemeColors } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import type { Meal, MealCategory } from '@/contexts/meal-plan-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getMealImage } from '@/lib/meal-images';

export type IconName = ComponentProps<typeof Feather>['name'];

export function useThemeColors(): ThemeColors {
  const scheme = useColorScheme() ?? 'light';
  return Colors[scheme];
}

// Soft drop shadow shared by cards (iOS shadow* + Android elevation).
export function softShadow(colors: ThemeColors): ViewStyle {
  return {
    shadowColor: colors.shadow,
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  };
}

export function heading(size: number, weight: 'black' | 'bold' = 'black'): TextStyle {
  return { fontFamily: weight === 'black' ? Fonts.heading : Fonts.headingBold, fontSize: size };
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const colors = useThemeColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground }, softShadow(colors), style]}>
      {children}
    </View>
  );
}

export function categoryColors(colors: ThemeColors, category: MealCategory) {
  return {
    breakfast: { bg: colors.breakfastBg, fg: colors.breakfastText },
    lunch: { bg: colors.lunchBg, fg: colors.lunchText },
    dinner: { bg: colors.dinnerBg, fg: colors.dinnerText },
    snack: { bg: colors.snackBg, fg: colors.snackText },
  }[category];
}

export function Pill({ label, bg, fg, style }: { label: string; bg: string; fg: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }, style]}>
      <Text style={[styles.pillText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function CategoryChip({ category, style }: { category: MealCategory; style?: StyleProp<ViewStyle> }) {
  const colors = useThemeColors();
  const { t } = useLanguage();
  const c = categoryColors(colors, category);
  return <Pill label={t(CATEGORY_LABELS[category])} bg={c.bg} fg={c.fg} style={style} />;
}

export function MealThumb({ meal, size = 56, radius = 16 }: { meal: Pick<Meal, 'name' | 'category'>; size?: number; radius?: number }) {
  return (
    <Image
      source={getMealImage(meal)}
      style={{ width: size, height: size, borderRadius: radius }}
      accessibilityIgnoresInvertColors
      accessible={false}
    />
  );
}

export function ProgressRing({
  progress,
  size = 128,
  stroke = 13,
  label,
  sublabel,
  color,
  accessibilityLabel,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  label: string;
  sublabel?: string;
  // Solid color instead of the brand gradient (used for the over-limit state).
  color?: string;
  accessibilityLabel?: string;
}) {
  const colors = useThemeColors();
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(progress, 1));
  const gradientId = `ring-${size}`;
  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.brandLime} />
            <Stop offset="1" stopColor={colors.brandTeal} />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.progressTrack} strokeWidth={stroke} fill="none" />
        {clamped > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color ?? `url(#${gradientId})`}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - clamped)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </Svg>
      <View style={styles.ringCenter} pointerEvents="none">
        <Text style={[heading(size > 110 ? 28 : 22), { color: colors.text }]}>{label}</Text>
        {sublabel ? <Text style={[styles.ringSub, { color: colors.secondaryText }]}>{sublabel}</Text> : null}
      </View>
    </View>
  );
}

export function ProgressBar({ progress, color, height = 10 }: { progress: number; color?: string; height?: number }) {
  const colors = useThemeColors();
  const pct = `${Math.max(0, Math.min(progress, 1)) * 100}%` as const;
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: colors.progressTrack, overflow: 'hidden' }}>
      <View style={{ height, width: pct, borderRadius: height / 2, backgroundColor: color ?? colors.primary }} />
    </View>
  );
}

export function ScreenTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const colors = useThemeColors();
  return (
    <View style={styles.screenTitle}>
      <View style={styles.flex}>
        <Text style={[heading(28), { color: colors.text }]} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.tertiaryText }]}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
  right,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  right?: ReactNode;
}) {
  const colors = useThemeColors();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[heading(18, 'bold'), { color: colors.text }]} accessibilityRole="header">
        {title}
      </Text>
      {actionLabel && onAction ? (
        <TouchableOpacity onPress={onAction} accessibilityRole="button" hitSlop={10} style={styles.sectionAction}>
          <Text style={[styles.actionText, { color: colors.primaryText }]}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : (
        right
      )}
    </View>
  );
}

export function CapsLabel({ children, color, style }: { children: ReactNode; color?: string; style?: StyleProp<TextStyle> }) {
  const colors = useThemeColors();
  return <Text style={[styles.caps, { color: color ?? colors.secondaryText }, style]}>{children}</Text>;
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  label,
  onPress,
  icon,
  iconRight,
  variant = 'primary',
  disabled,
  loading,
  style,
  accessibilityHint,
}: {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  // Show the icon after the label (e.g. a "Continue" arrow).
  iconRight?: boolean;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}) {
  const colors = useThemeColors();
  const look = {
    primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary },
    secondary: { bg: colors.cardBackground, fg: colors.text, border: colors.border },
    ghost: { bg: 'transparent', fg: colors.tertiaryText, border: 'transparent' },
    danger: { bg: colors.dangerLight, fg: colors.dangerText, border: colors.dangerLight },
  }[variant];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      accessibilityHint={accessibilityHint}
      style={[
        styles.button,
        { backgroundColor: look.bg, borderColor: look.border, opacity: disabled ? 0.5 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={look.fg} />
      ) : (
        <>
          {icon && !iconRight ? <Feather name={icon} size={19} color={look.fg} /> : null}
          <Text style={[styles.buttonText, { color: look.fg }]}>{label}</Text>
          {icon && iconRight ? <Feather name={icon} size={19} color={look.fg} /> : null}
        </>
      )}
    </TouchableOpacity>
  );
}

export function IconTile({ icon, bg, fg, size = 38 }: { icon: IconName; bg?: string; fg?: string; size?: number }) {
  const colors = useThemeColors();
  return (
    <View style={[styles.iconTile, { width: size, height: size, borderRadius: size / 3, backgroundColor: bg ?? colors.cardMuted }]}>
      <Feather name={icon} size={Math.round(size / 2)} color={fg ?? colors.primaryText} />
    </View>
  );
}

export function ListRow({
  icon,
  label,
  value,
  onPress,
  danger,
  last,
  right,
  accessibilityHint,
}: {
  icon: IconName;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  last?: boolean;
  right?: ReactNode;
  accessibilityHint?: string;
}) {
  const colors = useThemeColors();
  const content = (
    <>
      <IconTile icon={icon} bg={danger ? colors.dangerLight : undefined} fg={danger ? colors.dangerText : undefined} />
      <Text style={[styles.rowLabel, { color: danger ? colors.dangerText : colors.text }]}>{label}</Text>
      {value ? <Text style={[styles.rowValue, { color: colors.secondaryText }]}>{value}</Text> : null}
      {right ?? (onPress && !danger ? <Feather name="chevron-right" size={18} color={colors.secondaryText} /> : null)}
    </>
  );
  const rowStyle = [styles.row, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }];
  if (!onPress) return <View style={rowStyle}>{content}</View>;
  return (
    <TouchableOpacity style={rowStyle} onPress={onPress} accessibilityRole="button" accessibilityHint={accessibilityHint} activeOpacity={0.7}>
      {content}
    </TouchableOpacity>
  );
}

export function GroupCard({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      {title ? <CapsLabel style={styles.groupTitle}>{title}</CapsLabel> : null}
      <Card style={styles.groupCard}>{children}</Card>
    </View>
  );
}

export function BackHeader({ title, onBack, backLabel }: { title: string; onBack: () => void; backLabel: string }) {
  const colors = useThemeColors();
  return (
    <View style={styles.backHeader}>
      <TouchableOpacity
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        style={[styles.backButton, { backgroundColor: colors.cardBackground }, softShadow(colors)]}
      >
        <Feather name="chevron-left" size={22} color={colors.text} />
      </TouchableOpacity>
      <Text style={[heading(19, 'bold'), styles.backTitle, { color: colors.text }]} accessibilityRole="header" numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.backSpacer} />
    </View>
  );
}

type SheetTone = 'success' | 'danger' | 'info';

// Bottom-sheet dialog used for confirmations and alerts.
export function Sheet({
  visible,
  onClose,
  icon,
  tone = 'success',
  title,
  message,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  icon: IconName;
  tone?: SheetTone;
  title: string;
  message?: string;
  // Buttons, laid out in a row.
  children?: ReactNode;
}) {
  const colors = useThemeColors();
  const toneColors = {
    success: { bg: colors.primaryLight, fg: colors.primaryText },
    danger: { bg: colors.dangerLight, fg: colors.dangerText },
    info: { bg: colors.cardMuted, fg: colors.primaryText },
  }[tone];
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={[styles.sheet, { backgroundColor: colors.cardBackground }]} accessibilityViewIsModal>
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <View style={[styles.sheetIcon, { backgroundColor: toneColors.bg }]}>
            <Feather name={icon} size={28} color={toneColors.fg} />
          </View>
          <Text style={[heading(22), { color: colors.text, textAlign: 'center' }]} accessibilityRole="header">
            {title}
          </Text>
          {message ? <Text style={[styles.sheetMessage, { color: colors.tertiaryText }]}>{message}</Text> : null}
          {children ? <View style={styles.sheetButtons}>{children}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(8,16,12,0.45)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    alignItems: 'center',
    gap: 12,
  },
  sheetHandle: { width: 40, height: 5, borderRadius: 3 },
  sheetIcon: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  sheetMessage: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
  sheetButtons: { flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 8 },

  flex: { flex: 1 },
  card: { borderRadius: Radius.lg, padding: 16 },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.pill },
  pillText: { fontSize: 11, fontWeight: '700' },
  ringCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  ringSub: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  screenTitle: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 60, gap: 12 },
  subtitle: { fontSize: 14, marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 22,
    marginBottom: 10,
  },
  sectionAction: { paddingVertical: 8 },
  actionText: { fontSize: 14, fontWeight: '700' },
  caps: { fontSize: 11, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase' },
  button: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: { fontSize: 16, fontWeight: '800' },
  iconTile: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 6 },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  rowValue: { fontSize: 14 },
  group: { marginHorizontal: 20, marginTop: 20 },
  groupTitle: { marginLeft: 4, marginBottom: 8 },
  groupCard: { paddingVertical: 4, paddingHorizontal: 12 },
  backHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  backButton: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  backTitle: { flex: 1, textAlign: 'center' },
  backSpacer: { width: 44 },
});
