import { Platform } from 'react-native';

/**
 * Legacy brand theme: navy / gold / ivory with a serif (Georgia) for headings.
 */
export const palette = {
  navy: '#142A47',
  navyDeep: '#0E1F36',
  gold: '#E9A13B',
  goldDeep: '#C9842A',
  ivory: '#F5EFE3',
  ivoryDeep: '#EBE2CF',
  white: '#FFFFFF',
  ink: '#1C2433',
  text: '#243049',
  textMuted: '#5C6679',
  line: '#DED4C0',
  lineSoft: '#ECE4D4',
  danger: '#B3402F',
  success: '#2E7D5B',
  surface: '#FFFFFF',
};

export const serifFont = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'Georgia, "Times New Roman", serif',
}) as string;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export const maxContentWidth = 720;

export type Palette = typeof palette;
