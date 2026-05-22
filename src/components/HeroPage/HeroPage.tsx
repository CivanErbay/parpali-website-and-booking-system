import React, { useRef } from 'react';
import styles from './HeroPage.module.css';
import { buildColorStyle, SectionColors } from '../../shared/colors';
import { getModeStyle, SectionMode } from '../../shared/modes';
import { ArrowIcon } from '../ArrowIcon/ArrowIcon';
import { useArrowDrawHover } from '../../shared/useArrowDrawHover';

export interface HeroPageProps extends SectionColors {
  mode?: SectionMode;
  sectionId?: string;
  sectionLabel?: string;
  eyebrow: string;
  heading: React.ReactNode;
  sub: React.ReactNode;
  ctaText?: string;
  ctaHref?: string;
}

export const HeroPage: React.FC<HeroPageProps> = ({
  mode = 'dark',
  sectionId,
  sectionLabel,
  eyebrow,
  heading,
  sub,
  ctaText,
  ctaHref,
  bgColor,
  textColor,
  accentColor,
  mutedColor,
}) => {
  const btnRef = useRef<HTMLAnchorElement>(null);
  useArrowDrawHover(btnRef);
  return (
    <section
      id={sectionId}
      data-screen-label={sectionLabel}
      data-mode={mode}
      className={styles.section}
      style={{ ...getModeStyle(mode), ...buildColorStyle({ bgColor, textColor, accentColor, mutedColor }) }}
    >
      <div className={styles.container}>
        <span className={`${styles.eyebrow} ${styles.paren}`}>{eyebrow}</span>
        <h1 className={styles.heading}>{heading}</h1>
        <div className={styles.sub}>{sub}</div>
        {ctaText && ctaHref && (
          <a ref={btnRef} href={ctaHref} className={styles.btn}>
            <span data-arrow-text>{ctaText}</span>
            <ArrowIcon />
          </a>
        )}
      </div>
    </section>
  );
};
