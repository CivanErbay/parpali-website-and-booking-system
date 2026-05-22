import type { CSSProperties } from 'react';

export type SectionMode = 'light' | 'dark';

const MODE_VARS: Record<SectionMode, Record<string, string>> = {
  light: {
    '--section-bg': 'var(--parpali-cream)',
    '--section-bg-elev': 'var(--parpali-sand)',
    '--section-text': 'var(--parpali-espresso)',
    '--section-text-2': 'var(--fg-2)',
    '--section-muted': 'var(--fg-3)',
    '--section-border': 'var(--border)',
    '--section-border-strong': 'var(--border-strong)',
    '--section-accent': 'var(--parpali-red)',
    '--section-highlight': 'var(--parpali-gold)',
    '--section-card-bg': 'var(--parpali-sand)',
    '--section-card-border': 'var(--border)',
    '--section-dotgrid': 'none',
    '--section-dotgrid-size': '16px 16px',
  },
  dark: {
    '--section-bg': 'var(--parpali-espresso)',
    '--section-bg-elev': 'var(--parpali-espresso-2)',
    '--section-text': 'var(--parpali-cream)',
    '--section-text-2': '#cbb89e',
    '--section-muted': '#9a8770',
    '--section-border': 'rgba(217, 201, 168, 0.18)',
    '--section-border-strong': 'var(--parpali-gold)',
    '--section-accent': 'var(--parpali-red-soft)',
    '--section-highlight': 'var(--parpali-gold)',
    '--section-card-bg': 'var(--parpali-espresso-2)',
    '--section-card-border': 'rgba(217, 201, 168, 0.18)',
    '--section-dotgrid':
      'radial-gradient(circle at 1px 1px, rgba(251, 247, 241, 0.06) 1px, transparent 0)',
    '--section-dotgrid-size': '16px 16px',
  },
};

export const getModeStyle = (mode: SectionMode = 'light'): CSSProperties =>
  MODE_VARS[mode] as CSSProperties;

export const MODE_OPTIONS: SectionMode[] = ['light', 'dark'];
