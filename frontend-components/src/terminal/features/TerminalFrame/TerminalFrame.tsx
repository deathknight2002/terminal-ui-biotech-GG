import React from 'react';
import clsx from 'clsx';

import styles from './TerminalFrame.module.css';

export interface TerminalFrameProps {
  headline: {
    title: string;
    subtitle?: string;
    eyebrow?: string;
  };
  watchlistSlot?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export const TerminalFrame: React.FC<TerminalFrameProps> = ({
  headline,
  watchlistSlot,
  className,
  children,
}) => {
  return (
    <section className={clsx(styles.root, className)}>
      <div className={styles.backdrop} aria-hidden="true" />
      <div className={styles.content}>
        <header className={styles.header}>
          <div className={styles.headline}>
            <div className={styles.titleRow}>
              <h1>{headline.title}</h1>
              {headline.eyebrow && <span className={styles.eyebrow}>{headline.eyebrow}</span>}
            </div>
            {headline.subtitle && <p>{headline.subtitle}</p>}
          </div>
          {watchlistSlot}
        </header>
        <div className={styles.body}>{children}</div>
      </div>
    </section>
  );
};

export default TerminalFrame;
