export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  textFaint: string;
  border: string;
  primary: string;
  onPrimary: string;
  primarySoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  overlay: string;
  tabBar: string;
  input: string;
  pro: string;
  proSoft: string;
}

// Billnest palette: a deep "nest" green as the primary, warm sand neutrals, straw amber for Pro.
export const lightColors: ThemeColors = {
  background: '#F6F5F0',
  surface: '#FFFFFF',
  surfaceAlt: '#ECEFEA',
  text: '#14201A',
  textMuted: '#5B6B63',
  textFaint: '#97A59D',
  border: '#E0E5DF',
  primary: '#1F7A5C',
  onPrimary: '#FFFFFF',
  primarySoft: '#DCF0E6',
  success: '#16A34A',
  successSoft: '#DCFCE7',
  warning: '#C2410C',
  warningSoft: '#FFEDD5',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  overlay: 'rgba(20, 32, 26, 0.45)',
  tabBar: '#FFFFFF',
  input: '#FFFFFF',
  pro: '#B7791F',
  proSoft: '#FBEFD6',
};

export const darkColors: ThemeColors = {
  background: '#0F1613',
  surface: '#182019',
  surfaceAlt: '#222C25',
  text: '#F2F5F1',
  textMuted: '#A6B3AA',
  textFaint: '#6F7D74',
  border: '#2B372F',
  primary: '#4CC39A',
  onPrimary: '#0F1613',
  primarySoft: '#1C3A2E',
  success: '#4ADE80',
  successSoft: '#14352A',
  warning: '#FDBA74',
  warningSoft: '#3A2412',
  danger: '#F87171',
  dangerSoft: '#3F1B1B',
  overlay: 'rgba(0, 0, 0, 0.6)',
  tabBar: '#141C17',
  input: '#1C2620',
  pro: '#F5C06A',
  proSoft: '#3A2E12',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;

export const typography = {
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5, lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3, lineHeight: 28 },
  h3: { fontSize: 17, fontWeight: '600', lineHeight: 22 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 22 },
  bodyBold: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  small: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
  money: { fontSize: 36, fontWeight: '800', letterSpacing: -1, lineHeight: 42 },
} as const;

export type TypographyVariant = keyof typeof typography;
