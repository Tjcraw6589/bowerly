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

export const lightColors: ThemeColors = {
  background: '#F6F7FB',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF0F7',
  text: '#0F1222',
  textMuted: '#5B6075',
  textFaint: '#9AA0B8',
  border: '#E3E6F0',
  primary: '#3D5AFE',
  onPrimary: '#FFFFFF',
  primarySoft: '#E6EAFF',
  success: '#16A34A',
  successSoft: '#DCFCE7',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  overlay: 'rgba(15, 18, 34, 0.45)',
  tabBar: '#FFFFFF',
  input: '#FFFFFF',
  pro: '#B45309',
  proSoft: '#FEF3C7',
};

export const darkColors: ThemeColors = {
  background: '#0F1222',
  surface: '#181C30',
  surfaceAlt: '#222741',
  text: '#F3F4FA',
  textMuted: '#A0A6C0',
  textFaint: '#6B7190',
  border: '#2A2F4A',
  primary: '#8396FF',
  onPrimary: '#0F1222',
  primarySoft: '#232A52',
  success: '#4ADE80',
  successSoft: '#14352A',
  warning: '#FBBF24',
  warningSoft: '#3A2E12',
  danger: '#F87171',
  dangerSoft: '#3F1B1B',
  overlay: 'rgba(0, 0, 0, 0.6)',
  tabBar: '#141830',
  input: '#1D2238',
  pro: '#FCD34D',
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
