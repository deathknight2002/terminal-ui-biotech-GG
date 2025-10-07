import React from 'react';
import '../../styles/aurora.css';

export const AuroraBackground: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`aurora-bg ${className ?? ''}`}> <div className="aurora-layer" /> </div>
);
