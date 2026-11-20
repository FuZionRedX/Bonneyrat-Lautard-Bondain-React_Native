import { type BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { Stack, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import Feather from '@expo/vector-icons/Feather';

import { BackHeader, Button, Card, CapsLabel, CategoryPicker, heading, Pill, useThemeColors } from '@/components/ui/kit';
import { useLanguage } from '@/contexts/language-context';
import { MealCategory, useMealPlan } from '@/contexts/meal-plan-context';
import { fetchProduct, type FoodProduct } from '@/lib/openfoodfacts';

type ScanState =
  | { status: 'scanning' }
  | { status: 'loading' }
  | { status: 'not_found'; barcode: string }
  | { status: 'error' }
  | { status: 'found'; product: FoodProduct };

// Official Nutri-Score colours.
const NUTRI_SCORE: Record<string, { bg: string; fg: string }> = {
  a: { bg: '#038141', fg: '#FFFFFF' },
  b: { bg: '#85BB2F', fg: '#13261C' },
  c: { bg: '#FECB02', fg: '#13261C' },
  d: { bg: '#EE8100', fg: '#13261C' },
  e: { bg: '#E63E11', fg: '#FFFFFF' },
};

export default function ScanScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { locale, t } = useLanguage();
  const { addCustomFood } = useMealPlan();
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<ScanState>({ status: 'scanning' });
  const [grams, setGrams] = useState('100');
  const [category, setCategory] = useState<MealCategory>('snack');
  // The camera reports the same barcode many times a second: only the first one counts.
  const locked = useRef(false);

  // Typed by hand when the camera can't read the code (or there is no camera access).
  const [manualCode, setManualCode] = useState('');
  const validManualCode = /^\d{8,14}$/.test(manualCode);

  async function lookUp(code: string) {
    if (locked.current) return;
    locked.current = true;
    setState({ status: 'loading' });
    try {
      const product = await fetchProduct(code);
      if (!product) {
        setState({ status: 'not_found', barcode: code });
        return;
      }
      setGrams(String(Math.round(product.servingGrams ?? 100)));
      setState({ status: 'found', product });
    } catch {
      setState({ status: 'error' });
    }
  }

  function scanAgain() {
    locked.current = false;
    setState({ status: 'scanning' });
  }

  const number = (value: number) => value.toLocaleString(locale, { maximumFractionDigits: 1 });

  function renderProduct(product: FoodProduct) {
    const g = Number.parseInt(grams, 10);
    const portionKcal = product.kcalPer100g !== null && g > 0 ? Math.round((product.kcalPer100g * g) / 100) : null;
    const name = product.name || t('Unknown product');
    const score = product.nutriScore ? NUTRI_SCORE[product.nutriScore] : null;
    const rows: [string, number | null, string][] = [
      [t('Energy'), product.kcalPer100g, 'kcal'],
      [t('Proteins'), product.per100g.proteins, 'g'],
      [t('Carbohydrates'), product.per100g.carbs, 'g'],
      [t('of which sugars'), product.per100g.sugars, 'g'],
      [t('Fat'), product.per100g.fat, 'g'],
      [t('of which saturates'), product.per100g.saturatedFat, 'g'],
      [t('Fiber'), product.per100g.fiber, 'g'],
      [t('Salt'), product.per100g.salt, 'g'],
    ];

    return (
      <>
        <Card style={styles.block}>
          <View style={styles.productHead}>
            {product.imageUrl ? (
              <Image source={{ uri: product.imageUrl }} style={styles.productImage} resizeMode="contain" accessible={false} />
            ) : (
              <View style={[styles.productImage, styles.noImage, { backgroundColor: colors.cardMuted }]}>
                <Feather name="package" size={28} color={colors.secondaryText} />
              </View>
            )}
            <View style={styles.flex}>
              <Text style={[heading(18), { color: colors.text }]}>{name}</Text>
              {product.brand ? <Text style={[styles.muted, { color: colors.secondaryText }]}>{product.brand}</Text> : null}
              <View style={styles.badges}>
                {score ? <Pill label={`Nutri-Score ${product.nutriScore!.toUpperCase()}`} bg={score.bg} fg={score.fg} /> : null}
                {product.novaGroup ? (
                  <Pill
                    label={`NOVA ${product.novaGroup}`}
                    bg={product.novaGroup === 4 ? colors.dangerLight : colors.cardMuted}
                    fg={product.novaGroup === 4 ? colors.dangerText : colors.tertiaryText}
                  />
                ) : null}
              </View>
            </View>
          </View>
        </Card>

        <Card style={styles.block}>
          <CapsLabel>{t('Per 100 g')}</CapsLabel>
          {rows.map(([label, value, unit]) =>
            value === null ? null : (
              <View key={label} style={[styles.row, { borderColor: colors.border }]}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
                <Text style={[styles.rowValue, { color: colors.text }]}>{number(value)} {unit}</Text>
              </View>
            ),
          )}
        </Card>

        <Card style={styles.block}>
          <CapsLabel>{t('Additives')}</CapsLabel>
          {product.additives.length > 0 ? (
            <View style={styles.tags}>
              {product.additives.map((code) => (
                <Pill key={code} label={code} bg={colors.breakfastBg} fg={colors.breakfastText} />
              ))}
            </View>
          ) : (
            <Text style={[styles.muted, { color: colors.secondaryText }]}>{t('No additives listed')}</Text>
          )}
          <CapsLabel style={styles.spaced}>{t('Allergens')}</CapsLabel>
          {product.allergens.length > 0 ? (
            <View style={styles.tags}>
              {product.allergens.map((allergen) => (
                <Pill key={allergen} label={allergen} bg={colors.dangerLight} fg={colors.dangerText} />
              ))}
            </View>
          ) : (
            <Text style={[styles.muted, { color: colors.secondaryText }]}>{t('No allergens listed')}</Text>
          )}
        </Card>

        <Card style={styles.block}>
          {product.kcalPer100g === null ? (
            <Text style={[styles.muted, { color: colors.secondaryText }]}>{t('No calorie data for this product.')}</Text>
          ) : (
            <>
              <Text style={[styles.inputLabel, { color: colors.labelText }]}>{t('Portion (g)')}</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]}
                value={grams}
                onChangeText={(text) => setGrams(text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={4}
                accessibilityLabel={t('Portion (g)')}
              />
              <CategoryPicker value={category} onChange={setCategory} />
              <Button
                label={t('Add to plan ({n} kcal)', { n: portionKcal ?? 0 })}
                icon="plus"
                disabled={portionKcal === null}
                onPress={() => {
                  if (portionKcal === null) return;
                  addCustomFood(`${name} (${g} g)`, category, portionKcal);
                  router.back();
                }}
                style={styles.spaced}
              />
            </>
          )}
        </Card>

        <Button label={t('Scan again')} icon="camera" variant="secondary" onPress={scanAgain} style={styles.block} />
        <Text style={[styles.source, { color: colors.secondaryText }]}>{t('Data from Open Food Facts')}</Text>
      </>
    );
  }

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: colors.screenBackground }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ headerShown: false }} />
      <BackHeader title={t('Scan a barcode')} onBack={() => router.back()} backLabel={t('Go back')} />

      {state.status === 'scanning' ? (
        <Card style={styles.block}>
          <Text style={[styles.inputLabel, { color: colors.labelText }]}>{t('Or type the barcode number')}</Text>
          <View style={styles.manualRow}>
            <TextInput
              style={[styles.input, styles.manualInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]}
              value={manualCode}
              onChangeText={(text) => setManualCode(text.replace(/[^0-9]/g, ''))}
              onSubmitEditing={() => validManualCode && lookUp(manualCode)}
              placeholder="3017620422003"
              placeholderTextColor={colors.placeholderText}
              keyboardType="number-pad"
              returnKeyType="search"
              maxLength={14}
              accessibilityLabel={t('Or type the barcode number')}
            />
            <Button label={t('Search')} icon="search" disabled={!validManualCode} onPress={() => lookUp(manualCode)} />
          </View>
        </Card>
      ) : null}

      {!permission ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : !permission.granted ? (
        <Card style={[styles.block, styles.center]}>
          <Feather name="camera-off" size={32} color={colors.secondaryText} />
          <Text style={[styles.message, { color: colors.tertiaryText }]}>{t('VitalSync needs the camera to scan barcodes.')}</Text>
          <Button
            label={t('Allow camera')}
            onPress={() => (permission.canAskAgain ? requestPermission() : Linking.openSettings())}
            style={styles.stretch}
          />
        </Card>
      ) : state.status === 'scanning' ? (
        <>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
            onBarcodeScanned={({ data }: BarcodeScanningResult) => lookUp(data)}
          />
          <Text style={[styles.message, { color: colors.tertiaryText }]}>
            {t('Point the camera at the barcode on the packaging.')}
          </Text>
        </>
      ) : state.status === 'loading' ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          <Text style={[styles.message, { color: colors.tertiaryText }]}>{t('Looking up product…')}</Text>
        </View>
      ) : state.status === 'found' ? (
        renderProduct(state.product)
      ) : (
        <Card style={[styles.block, styles.center]}>
          <Feather name={state.status === 'error' ? 'wifi-off' : 'search'} size={32} color={colors.secondaryText} />
          <Text style={[heading(18), { color: colors.text }]}>
            {state.status === 'error' ? t('Connection problem') : t('Product not found')}
          </Text>
          <Text style={[styles.message, { color: colors.tertiaryText }]}>
            {state.status === 'error'
              ? t('Could not reach Open Food Facts. Check your connection.')
              : t('Barcode {code} is not in the Open Food Facts database. You can add it by hand from the Planner.', {
                  code: state.barcode,
                })}
          </Text>
          <Button label={t('Scan again')} icon="camera" onPress={scanAgain} style={styles.stretch} />
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: 32 },
  block: { marginHorizontal: 20, marginTop: 14 },
  center: { alignItems: 'center', gap: 10 },
  stretch: { alignSelf: 'stretch' },
  loader: { marginTop: 40 },
  message: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginHorizontal: 24, marginTop: 12 },
  camera: { height: 380, marginHorizontal: 20, marginTop: 14, borderRadius: 26, overflow: 'hidden' },

  productHead: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  productImage: { width: 84, height: 84, borderRadius: 18 },
  noImage: { alignItems: 'center', justifyContent: 'center' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  muted: { fontSize: 13, marginTop: 4 },

  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth },
  rowLabel: { fontSize: 14 },
  rowValue: { fontSize: 14, fontWeight: '700' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  spaced: { marginTop: 14 },

  inputLabel: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  input: { minHeight: 50, borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14, fontSize: 16, marginBottom: 12 },
  source: { fontSize: 12, textAlign: 'center', marginTop: 14 },
  manualRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  manualInput: { flex: 1, marginBottom: 0 },
});
