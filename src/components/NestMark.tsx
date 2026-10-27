import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

interface NestMarkProps {
  size?: number;
  /** Nest and bill-outline colour; defaults to the theme primary. */
  color?: string;
  /** Bill fill; defaults to the theme surface colour. */
  billColor?: string;
}

/**
 * The Billnest mark (a bill resting in a nest) drawn with plain Views so it
 * renders identically on iOS, Android and web without an SVG dependency.
 * Mirrors the vector used for the app icon in scripts/generate-assets.mjs.
 */
export function NestMark({ size = 72, color, billColor }: NestMarkProps) {
  const { colors } = useTheme();
  const nest = color ?? colors.primary;
  const bill = billColor ?? colors.surface;
  const s = size / 100;
  return (
    <View style={{ width: size, height: size }} accessible accessibilityLabel="Billnest">
      <View
        style={[
          styles.bill,
          {
            left: 36 * s,
            top: 14 * s,
            width: 30 * s,
            height: 42 * s,
            borderRadius: 5 * s,
            backgroundColor: bill,
            borderColor: nest,
            borderWidth: Math.max(1.5, 2.6 * s),
            paddingTop: 7 * s,
            paddingLeft: 5 * s,
          },
        ]}
      >
        {[18, 18, 12].map((w, i) => (
          <View key={i} style={{ width: w * s, height: Math.max(1.5, 2.6 * s), borderRadius: 2 * s, backgroundColor: nest, marginBottom: 5 * s }} />
        ))}
      </View>
      <View
        style={[
          styles.nest,
          {
            left: 15 * s,
            top: 50 * s,
            width: 70 * s,
            height: 35 * s,
            borderBottomLeftRadius: 35 * s,
            borderBottomRightRadius: 35 * s,
            backgroundColor: nest,
          },
        ]}
      >
        <View style={{ marginTop: 8 * s, marginHorizontal: 8 * s, height: 2 * s, borderRadius: s, backgroundColor: bill, opacity: 0.45 }} />
        <View style={{ marginTop: 7 * s, marginHorizontal: 16 * s, height: 2 * s, borderRadius: s, backgroundColor: bill, opacity: 0.45 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bill: { position: 'absolute', transform: [{ rotate: '-7deg' }] },
  nest: { position: 'absolute', overflow: 'hidden' },
});
