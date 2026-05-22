import type { CSSProperties } from 'react';

export interface SectionColors {
  bgColor?: string;
  textColor?: string;
  accentColor?: string;
  highlightColor?: string;
  mutedColor?: string;
}

/**
 * Parpali unterscheidet zwischen Rot (Primary Accent) und Gold (Secondary Highlight).
 * - accentColor → überschreibt `--section-accent` (Rot)
 * - highlightColor → überschreibt `--section-highlight` (Gold)
 */
export const buildColorStyle = (c: SectionColors): CSSProperties => {
  const style: Record<string, string> = {};
  if (c.bgColor) style.background = c.bgColor;
  if (c.textColor) style.color = c.textColor;
  if (c.accentColor) style['--parpali-accent-override'] = c.accentColor;
  if (c.highlightColor) style['--parpali-highlight-override'] = c.highlightColor;
  if (c.mutedColor) style['--parpali-muted-override'] = c.mutedColor;
  return style as CSSProperties;
};

export const buildColorProps = (
  textBuilder: (opts: {
    name: string;
    defaultValue?: string;
    group?: string;
    tooltip?: string;
  }) => unknown,
): Record<string, unknown> => ({
  bgColor: textBuilder({
    name: 'Background',
    defaultValue: '',
    group: 'Farben',
    tooltip: 'Hex-Code. Leer = Mode-Default (cream/espresso).',
  }),
  textColor: textBuilder({
    name: 'Text-Farbe',
    defaultValue: '',
    group: 'Farben',
    tooltip: 'Hex-Code. Leer = passend zum Mode.',
  }),
  accentColor: textBuilder({
    name: 'Accent (Rot)',
    defaultValue: '',
    group: 'Farben',
    tooltip: 'Primary-Akzent für Buttons, Active States, Brand. Hex-Code. Leer = Parpali-Rot #A4161A.',
  }),
  highlightColor: textBuilder({
    name: 'Highlight (Gold)',
    defaultValue: '',
    group: 'Farben',
    tooltip: 'Secondary Highlight für Preise, Dividers, Akzente. Hex-Code. Leer = Parpali-Gold #C99537.',
  }),
  mutedColor: textBuilder({
    name: 'Muted',
    defaultValue: '',
    group: 'Farben',
    tooltip: 'Sekundäre Text-/Label-Farbe. Hex-Code. Leer = Default.',
  }),
});
