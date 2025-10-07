import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import styles from './Gauge.module.css';
import type { Status } from '@/types';

export interface GaugeProps {
  value: number; // 0-100
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: number;
  thickness?: number;
  status?: Status;
  animate?: boolean;
  className?: string;
}

export const Gauge: React.FC<GaugeProps> = ({
  value,
  max = 100,
  label,
  showValue = true,
  size = 200,
  thickness = 20,
  status = 'info',
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
    const radius = (size / 2) - thickness - 10;
    const color = getColor(status);

    const draw = (progress: number) => {
      ctx.clearRect(0, 0, size, size);

      const normalizedValue = (value / max) * 100;
      const currentValue = animate ? normalizedValue * progress : normalizedValue;

      // Start angle: -135 degrees (bottom left)
      // End angle: +135 degrees (bottom right)
      // Total arc: 270 degrees
      const startAngle = -Math.PI * 0.75;
      const endAngle = Math.PI * 0.75;
      const totalAngle = endAngle - startAngle;

      // Draw background arc
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = thickness;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.stroke();

      // Draw value arc
      const valueAngle = startAngle + (totalAngle * (currentValue / 100));

      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, size, size);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, color + '80');

      ctx.strokeStyle = gradient;
      ctx.lineWidth = thickness;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, valueAngle);
      ctx.stroke();

      // Draw center dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Draw tick marks
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (let i = 0; i <= 10; i++) {
        const tickAngle = startAngle + (totalAngle * (i / 10));
        const tickRadius1 = radius - thickness / 2 - 8;
        const tickRadius2 = radius - thickness / 2 + 8;

        const x1 = centerX + Math.cos(tickAngle) * tickRadius1;
        const y1 = centerY + Math.sin(tickAngle) * tickRadius1;
        const x2 = centerX + Math.cos(tickAngle) * tickRadius2;
        const y2 = centerY + Math.sin(tickAngle) * tickRadius2;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    };

    if (animate) {
      const duration = 1500;
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
  }, [value, max, size, thickness, status, animate]);

  return (
    <div className={clsx(styles.gauge, className)}>
      <canvas ref={canvasRef} />
      <div className={styles.content}>
        {showValue && (
          <div className={styles.value} style={{ color: getColor(status) }}>
            {Math.round((value / max) * 100)}%
          </div>
        )}
        {label && <div className={styles.label}>{label}</div>}
      </div>
    </div>
  );
};
