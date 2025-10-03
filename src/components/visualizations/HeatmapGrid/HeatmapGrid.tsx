import React from 'react';
import clsx from 'clsx';
import styles from './HeatmapGrid.module.css';

export interface HeatmapCell {
  id: string;
  value: number; // 0-100
  label?: string;
}

export interface HeatmapGridProps {
  data: HeatmapCell[];
  columns?: number;
  cellSize?: number;
  showLabels?: boolean;
  animate?: boolean;
  colorScheme?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export const HeatmapGrid: React.FC<HeatmapGridProps> = ({
  data,
  columns = 10,
  cellSize = 20,
  showLabels = false,
  animate = true,
  colorScheme = 'default',
  className,
}) => {
  const getColor = (value: number): string => {
    const intensity = value / 100;

    switch (colorScheme) {
      case 'success':
        return `rgba(0, 217, 100, ${intensity * 0.8})`;
      case 'warning':
        return `rgba(255, 184, 0, ${intensity * 0.8})`;
      case 'error':
        return `rgba(255, 59, 48, ${intensity * 0.8})`;
      default:
        return `rgba(0, 212, 255, ${intensity * 0.8})`;
    }
  };

  return (
    <div className={clsx(styles.heatmapGrid, className)}>
      <div
        className={styles.grid}
        style={{
          gridTemplateColumns: `repeat(${columns}, ${cellSize}px)`,
          gap: '2px',
        }}
      >
        {data.map((cell, index) => (
          <div
            key={cell.id}
            className={clsx(styles.cell, animate && styles.animate)}
            style={{
              width: `${cellSize}px`,
              height: `${cellSize}px`,
              backgroundColor: getColor(cell.value),
              animationDelay: animate ? `${index * 10}ms` : '0ms',
            }}
            title={cell.label || `${cell.value}%`}
          >
            {showLabels && cell.label && (
              <span className={styles.label}>{cell.label}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
