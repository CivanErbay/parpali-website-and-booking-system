import React, { useRef, useState } from 'react';
import styles from './ContactForm.module.css';
import { buildColorStyle, SectionColors } from '../../shared/colors';
import { getModeStyle, SectionMode } from '../../shared/modes';
import { ArrowIcon } from '../ArrowIcon/ArrowIcon';
import { useArrowDrawHover } from '../../shared/useArrowDrawHover';
import { capture } from '../../shared/posthog';

export interface ContactFormProps extends SectionColors {
  mode?: SectionMode;
  surface?: 'default' | 'elev';
  sectionId?: string;
  sectionLabel?: string;
  eyebrowNum: string;
  eyebrowLabel: string;
  calloutTitle: string;
  calloutBody: React.ReactNode;
  textareaPlaceholder: string;
  textareaHint: React.ReactNode;
  privacyNote: React.ReactNode;
  submitText: string;
  submitConfirmHeading: React.ReactNode;
  submitConfirmBody: React.ReactNode;
  endpoint?: string;
  eventName?: string;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  mode = 'dark',
  surface = 'elev',
  sectionId,
  sectionLabel,
  eyebrowNum,
  eyebrowLabel,
  calloutTitle,
  calloutBody,
  textareaPlaceholder,
  textareaHint,
  privacyNote,
  submitText,
  submitConfirmHeading,
  submitConfirmBody,
  endpoint,
  eventName,
  bgColor,
  textColor,
  accentColor,
  mutedColor,
}) => {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', company: '', email: '', description: '' });
  const btnRef = useRef<HTMLButtonElement>(null);
  useArrowDrawHover(btnRef);
  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((s) => ({ ...s, [k]: e.target.value }));
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    capture(eventName ?? 'contact_form_submit', { company: form.company });
    if (!endpoint) {
      e.preventDefault();
      setSent(true);
    }
  };

  return (
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

        <div className={styles.callout}>
          <h3 className={styles.calloutTitle}>{calloutTitle}</h3>
          <div className={styles.calloutBody}>{calloutBody}</div>
        </div>

        {sent ? (
          <div className={styles.confirm}>
            <div className={styles.confirmHeading}>{submitConfirmHeading}</div>
            <div className={styles.confirmBody}>{submitConfirmBody}</div>
          </div>
        ) : (
          <form
            className={styles.form}
            action={endpoint || undefined}
            method={endpoint ? 'POST' : undefined}
            onSubmit={submit}
            data-event={eventName}
          >
            <label>
              <span className={styles.lbl}>Name *</span>
              <input value={form.name} onChange={upd('name')} placeholder="Dein Name" required />
            </label>
            <label>
              <span className={styles.lbl}>Unternehmen *</span>
              <input
                value={form.company}
                onChange={upd('company')}
                placeholder="Firmenname"
                required
              />
            </label>
            <label className={styles.full}>
              <span className={styles.lbl}>E-Mail *</span>
              <input
                type="email"
                value={form.email}
                onChange={upd('email')}
                placeholder="deine@email.de"
                required
              />
            </label>
            <label className={styles.full}>
              <span className={styles.lbl}>Prozessbeschreibung *</span>
              <textarea
                rows={6}
                value={form.description}
                onChange={upd('description')}
                placeholder={textareaPlaceholder}
                required
              />
              <div className={styles.fieldHint}>{textareaHint}</div>
            </label>
            <div className={`${styles.formMeta} ${styles.full}`}>{privacyNote}</div>
            <div className={styles.full}>
              <button ref={btnRef} type="submit" className={styles.btn}>
                <span data-arrow-text>{submitText}</span>
                <ArrowIcon />
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};
