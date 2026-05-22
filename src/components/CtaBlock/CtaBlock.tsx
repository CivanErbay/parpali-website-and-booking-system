import React, { useRef } from 'react';
import styles from './CtaBlock.module.css';
import { buildColorStyle, SectionColors } from '../../shared/colors';
import { ArrowIcon } from '../ArrowIcon/ArrowIcon';
import { useArrowDrawHover } from '../../shared/useArrowDrawHover';

export interface CtaBlockProps extends SectionColors {
  sectionId?: string;
  sectionLabel?: string;
  meta: string;
  heading: React.ReactNode;
  body: React.ReactNode;
  ctaText: string;
  ctaHref: string;
}

export const CtaBlock: React.FC<CtaBlockProps> = ({
  sectionId,
  sectionLabel,
  meta,
  heading,
  body,
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
      className={styles.section}
      style={buildColorStyle({ bgColor, textColor, accentColor, mutedColor })}
    >
      <div className={styles.container}>
        <div>
          <span className={styles.meta}>{meta}</span>
          <h2 className={styles.heading}>{heading}</h2>
        </div>
        <div>
          <div className={styles.body}>{body}</div>
          <a ref={btnRef} href={ctaHref} className={`${styles.btn} ${styles.btnInk}`}>
            <span data-arrow-text>{ctaText}</span>
            <ArrowIcon />
          </a>
        </div>
      </div>
    </section>
  );
};
