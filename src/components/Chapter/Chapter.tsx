import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './Chapter.module.css';
import { ANIM } from '../../shared/animations';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export interface ChapterProps {
  /** "01", "02", … */
  num: string;
  /** "Problem", "Journey", … */
  label: string;
  /** Optional sub-eyebrow shown under label (e.g. progress "002 / 11"). */
  counter?: string;
  /** Pin the rail while chapter scrolls. */
  pin?: boolean;
  /** Wrapper id (for hash links). */
  id?: string;
  children: React.ReactNode;
}

export const Chapter: React.FC<ChapterProps> = ({
  num,
  label,
  counter,
  pin = false,
  id,
  children,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current!;
      const rail = root.querySelector(`.${styles.rail}`) as HTMLElement;
      const body = root.querySelector(`.${styles.body}`) as HTMLElement;
      const reveals = body.querySelectorAll<HTMLElement>('[data-chapter-reveal]');

      if (pin && rail) {
        ScrollTrigger.create({
          trigger: root,
          start: 'top top+=80',
          end: 'bottom bottom',
          pin: rail,
          pinSpacing: false,
        });
      }

      // Chapter label slide-in
      gsap.from(rail, {
        opacity: 0,
        y: ANIM.chapterRail.y,
        duration: ANIM.chapterRail.duration,
        ease: ANIM.chapterRail.ease,
        scrollTrigger: {
          trigger: root,
          start: ANIM.chapterRail.start,
          toggleActions: 'play none none reverse',
        },
      });

      // Generic reveal targets inside chapter body
      if (reveals.length) {
        gsap.from(reveals, {
          opacity: 0,
          y: ANIM.chapterReveal.y,
          duration: ANIM.chapterReveal.duration,
          ease: ANIM.chapterReveal.ease,
          stagger: ANIM.chapterReveal.stagger,
          scrollTrigger: {
            trigger: body,
            start: ANIM.chapterReveal.start,
            toggleActions: 'play none none reverse',
          },
        });
      }
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} className={styles.chapter} id={id} data-pin={pin || undefined}>
      <aside className={styles.rail} aria-hidden="true">
        <span className={styles.num}>CHAPTER {num}</span>
        <span className={styles.label}>{label}</span>
        {counter && <span className={styles.counter}>{counter}</span>}
      </aside>
      <div className={styles.body}>{children}</div>
    </section>
  );
};
