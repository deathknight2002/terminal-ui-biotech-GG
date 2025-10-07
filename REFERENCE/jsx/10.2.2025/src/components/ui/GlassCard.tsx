import React, { PropsWithChildren } from 'react';

export const GlassCard: React.FC<PropsWithChildren<{heading?: string; footer?: React.ReactNode; className?: string;}>> = ({ heading, children, footer, className }) => (
  <div className={`glass p-5 shadow-lg transition hover:shadow-aurora-500/40 ${className ?? ''}`}>
    {heading && <h3 className="text-lg font-semibold mb-3 gradient-text">{heading}</h3>}
    <div className="text-sm leading-relaxed">{children}</div>
    {footer && <div className="mt-4 text-xs opacity-70">{footer}</div>}
  </div>
);
