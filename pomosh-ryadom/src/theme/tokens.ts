/** Brand palette «Сообща» — see ../Сообща/.../brand-pack/colors.txt */
export const T = {
  primary: '#1E7A4F',
  primaryDark: '#165A3C',
  primarySoft: '#DDEFE3',
  primaryTint: '#B8D9C6',

  accent: '#E07A3F',
  accentSoft: '#FBE8D8',
  accentDark: '#C46830',

  /** Screen background */
  bg: '#F4EEDE',
  /** Inputs, modals, bottom sheets, map chrome */
  surface: '#FFFFFF',
  /** Subtle fills inside raised cards (toggles, placeholders) */
  surface2: '#F0E8D8',
  border: '#E5D9C4',
  borderSoft: '#EDE4D0',

  ink: '#2A2620',
  ink2: '#4A4438',
  muted: '#7A7264',
  mutedSoft: '#A89F8E',

  success: '#1E7A4F',
  successSoft: '#DDEFE3',
  danger: '#C75653',
  dangerSoft: '#F8E5E3',
  warning: '#D89324',
  warningSoft: '#F8E9C7',
  info: '#446D9E',
  infoSoft: '#E2EAF3',
} as const;

/** Default background for cards and content blocks on scroll screens (same as T.bg). */
export const CARD_BG = T.bg;

/** @deprecated Use CARD_BG */
export const INLINE_SECTION_BG = CARD_BG;

export const RADIUS = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 26,
  pill: 999,
} as const;

export const shadowSm = {
  shadowColor: '#2A2620',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
} as const;

export const shadowMd = {
  shadowColor: '#2A2620',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.08,
  shadowRadius: 16,
  elevation: 4,
} as const;

export const shadowLg = {
  shadowColor: '#2A2620',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.1,
  shadowRadius: 24,
  elevation: 8,
} as const;

export const shadowFab = {
  shadowColor: '#1E7A4F',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.32,
  shadowRadius: 18,
  elevation: 8,
} as const;
