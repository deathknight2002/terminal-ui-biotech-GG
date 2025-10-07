import React, { forwardRef, useRef, useEffect } from 'react';
import clsx from 'clsx';
import styles from './Input.module.css';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  error?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  tabularNums?: boolean;
  fullWidth?: boolean;
  onEnter?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      error = false,
      prefix,
      suffix,
      tabularNums = false,
      fullWidth = true,
      onEnter,
      className,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const prefixRef = useRef<HTMLSpanElement>(null);
    const suffixRef = useRef<HTMLSpanElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (wrapperRef.current && prefixRef.current) {
        wrapperRef.current.style.setProperty(
          '--prefix-width',
          `${prefixRef.current.offsetWidth}px`
        );
      }
      if (wrapperRef.current && suffixRef.current) {
        wrapperRef.current.style.setProperty(
          '--suffix-width',
          `${suffixRef.current.offsetWidth}px`
        );
      }
    }, [prefix, suffix]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && onEnter) {
        onEnter();
      }
      onKeyDown?.(e);
    };

    const wrapperClasses = clsx(
      styles.wrapper,
      error && styles.error,
      prefix && styles.hasPrefix,
      suffix && styles.hasSuffix,
      tabularNums && styles.tabularNums,
      fullWidth && styles.fullWidth,
      className
    );

    return (
      <div ref={wrapperRef} className={wrapperClasses}>
        {prefix && (
          <span ref={prefixRef} className={styles.prefix}>
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          className={styles.input}
          onKeyDown={handleKeyDown}
          {...props}
        />
        {suffix && (
          <span ref={suffixRef} className={styles.suffix}>
            {suffix}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
