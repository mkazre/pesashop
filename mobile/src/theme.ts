import { Platform } from 'react-native';

const ENV_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
const API_URL = Platform.OS === 'web' ? 'http://localhost:5000' : ENV_URL;

/** Resolve an image value (string path or {url} object) to a full URL */
export function resolveImageUrl(img: any): string | undefined {
  if (!img) return undefined;
  const raw = typeof img === 'string' ? img : img.url || img.uri;
  if (!raw) return undefined;
  if (raw.startsWith('http')) return raw;
  return `${API_URL}${raw.startsWith('/') ? '' : '/'}${raw}`;
}

export const colors = {
  primary: '#0F604B',
  primaryLight: '#E8F5F0',
  primaryDark: '#0A4035',
  accent: '#a8ffca',
  white: '#ffffff',
  black: '#000000',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  red50: '#fef2f2',
  red500: '#ef4444',
  red600: '#dc2626',
  green500: '#22c55e',
  green600: '#16a34a',
  amber500: '#f59e0b',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  title: 30,
};
