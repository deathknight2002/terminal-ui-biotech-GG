import React from 'react';

export const GradientText: React.FC<React.PropsWithChildren<{ as?: keyof JSX.IntrinsicElements; className?: string }>> = ({ as: Tag = 'span', className, children }) => (
  <Tag className={`gradient-text bg-clip-text font-semibold tracking-tight ${className ?? ''}`}>{children}</Tag>
);
