import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import styles from './ProgressCircle.module.css';
import type { Status } from '../../../types';

export interface ProgressCircleProps {
  value: number; // 0-100
  size?: number;
  thickness?: number;
  status?: Status;
  showValue?: boolean;
  label?: string;
  animate?: boolean;
  className?: string;
}

export const ProgressCircle: React.FC<ProgressCircleProps> = ({
  value,
  size = 80,
  thickness = 6,
  status = 'info',
  showValue = true,
  label,
  animate = true,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const progressRef = useRef<number>(0);

  const getColor = (status: Status): string => {
    const colors = {
      success: '#00d964',
      error: '#ff3b30',
      warning: '#ffb800',
      info: '#00d4ff',
      idle: '#808080',
    };
    return colors[status];
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = size;
    canvas.height = size;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size / 2) - thickness / 2 - 2;
    const color = getColor(status);

    const draw = (progress: number) => {
      ctx.clearRect(0, 0, size, size);

      const currentValue = animate ? value * progress : value;

      // Background circle
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = thickness;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Progress arc
      const startAngle = -Math.PI / 2; // Start at top
      const endAngle = startAngle + (Math.PI * 2 * (currentValue / 100));

      ctx.strokeStyle = color;
      ctx.lineWidth = thickness;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.stroke();
    };

    if (animate) {
      const duration = 1000;
      const startTime = Date.now();

      const animateFrame = () => {
        const elapsed = Date.now() - startTime;
        progressRef.current = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const eased = 1 - Math.pow(1 - progressRef.current, 3);
        draw(eased);

        if (progressRef.current < 1) {
          animationRef.current = requestAnimationFrame(animateFrame);
        }
      };

      animateFrame();
    } else {
      draw(1);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, size, thickness, status, animate]);

  return (
    <div className={clsx(styles.progressCircle, className)}>
      <canvas ref={canvasRef} />
      <div className={styles.content}>
        {showValue && (
          <div className={styles.value} style={{ color: getColor(status) }}>
            {Math.round(value)}%
          </div>
        )}
        {label && <div className={styles.label}>{label}</div>}
      </div>
    </div>
  );
};
