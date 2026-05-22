import React from 'react';
import styles from './SectionEyebrow.module.css';

export interface SectionEyebrowProps {
  num: string;
  label: string;
}

export const SectionEyebrow: React.FC<SectionEyebrowProps> = ({ num, label }) => (
  <div className={styles.eyebrow}>
    <span className={styles.num}>{num}</span>
    <span className={`${styles.lbl} ${styles.paren}`}>{label}</span>
  </div>
);
