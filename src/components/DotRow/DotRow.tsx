import React from 'react';
import styles from './DotRow.module.css';
import { buildColorStyle, SectionColors } from '../../shared/colors';
import { getModeStyle, SectionMode } from '../../shared/modes';

export interface DotRowItem {
  strong: string;
  body: string;
}

export interface DotRowProps extends SectionColors {
  mode?: SectionMode;
  surface?: 'default' | 'elev';
  sectionId?: string;
  sectionLabel?: string;
  eyebrowNum: string;
  eyebrowLabel: string;
  heading: React.ReactNode;
  body?: React.ReactNode;
  items: DotRowItem[];
}

export const DotRow: React.FC<DotRowProps> = ({
  mode = 'dark',
  surface = 'default',
  sectionId,
  sectionLabel,
  eyebrowNum,
  eyebrowLabel,
  heading,
  body,
  items,
  bgColor,
  textColor,
  accentColor,
  mutedColor,
}) => (
  <section
    id={sectionId}
    data-screen-label={sectionLabel}
    data-mode={mode}
    className={`${styles.section} ${surface === 'elev' ? styles.sElev : ''}`}
    style={{ ...getModeStyle(mode), ...buildColorStyle({ bgColor, textColor, accentColor, mutedColor }) }}
  >
    <div className={styles.container}>
      <div className={styles.eyebrow}>
        <span className={styles.eyebrowNum}>{eyebrowNum}</span>
        <span className={`${styles.eyebrowLbl} ${styles.paren}`}>{eyebrowLabel}</span>
      </div>
      <h2 className={styles.heading}>{heading}</h2>
      {body && <div className={styles.body}>{body}</div>}
      <div className={styles.list}>
        {items.map((it, i) => (
          <div key={i} className={styles.row}>
            <span className={styles.dot} />
            <p>
              <strong>{it.strong}</strong> {it.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
