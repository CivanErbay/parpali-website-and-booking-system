import React from 'react';
import styles from './Intro.module.css';
import { buildColorStyle, SectionColors } from '../../shared/colors';
import { getModeStyle, SectionMode } from '../../shared/modes';

export type IntroSurface = 'default' | 'tight' | 'elev';

export interface IntroProps extends SectionColors {
  mode?: SectionMode;
  surface?: IntroSurface;
  sectionId?: string;
  sectionLabel?: string;
  eyebrowNum: string;
  eyebrowLabel: string;
  heading: React.ReactNode;
  body: React.ReactNode;
}

export const Intro: React.FC<IntroProps> = ({
  mode = 'dark',
  surface = 'tight',
  sectionId,
  sectionLabel,
  eyebrowNum,
  eyebrowLabel,
  heading,
  body,
  bgColor,
  textColor,
  accentColor,
  mutedColor,
}) => {
  const surfaceClass =
    surface === 'tight' ? styles.sTight : surface === 'elev' ? styles.sElev : '';
  return (
    <section
      id={sectionId}
      data-screen-label={sectionLabel}
      data-mode={mode}
      data-surface={surface}
      className={`${styles.section} ${surfaceClass}`}
      style={{ ...getModeStyle(mode), ...buildColorStyle({ bgColor, textColor, accentColor, mutedColor }) }}
    >
      <div className={styles.container}>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowNum}>{eyebrowNum}</span>
          <span className={`${styles.eyebrowLbl} ${styles.paren}`}>{eyebrowLabel}</span>
        </div>
        <div className={styles.intro}>
          <h2 className={styles.heading}>{heading}</h2>
          <div className={styles.body}>{body}</div>
        </div>
      </div>
    </section>
  );
};
