import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import styles from './RadarChart.module.css';

export interface RadarDataPoint {
  label: string;
  value: number; // 0-100
}

export interface RadarChartProps {
  data: RadarDataPoint[];
  size?: number;
  levels?: number;
  animate?: boolean;
  showLabels?: boolean;
  color?: string;
  className?: string;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  data,
  size = 300,
  levels = 5,
  animate = true,
  showLabels = true,
  color = 'var(--accent-cyan)',
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const progressRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = size;
    canvas.height = size;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size / 2) - 60;
    const angleStep = (Math.PI * 2) / data.length;

    const draw = (progress: number) => {
      ctx.clearRect(0, 0, size, size);

      // Draw levels (concentric polygons)
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.2)';
      ctx.lineWidth = 1;

      for (let level = 1; level <= levels; level++) {
        const levelRadius = (radius / levels) * level;
        ctx.beginPath();

        data.forEach((_, i) => {
          const angle = angleStep * i - Math.PI / 2;
          const x = centerX + Math.cos(angle) * levelRadius;
          const y = centerY + Math.sin(angle) * levelRadius;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });

        ctx.closePath();
        ctx.stroke();
      }

      // Draw axes
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
      ctx.lineWidth = 1;

      data.forEach((_, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();
      });

      // Draw data polygon
      const currentProgress = animate ? progress : 1;
      ctx.strokeStyle = color;
      ctx.fillStyle = color.replace(')', ', 0.2)').replace('rgb', 'rgba');
      ctx.lineWidth = 2;

      ctx.beginPath();
      data.forEach((point, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const value = (point.value / 100) * currentProgress;
        const pointRadius = radius * value;
        const x = centerX + Math.cos(angle) * pointRadius;
        const y = centerY + Math.sin(angle) * pointRadius;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        // Draw point
        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw labels
      if (showLabels) {
        ctx.fillStyle = 'var(--text-primary)';
        ctx.font = '11px var(--font-mono)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        data.forEach((point, i) => {
          const angle = angleStep * i - Math.PI / 2;
          const labelRadius = radius + 30;
          const x = centerX + Math.cos(angle) * labelRadius;
          const y = centerY + Math.sin(angle) * labelRadius;

          // Adjust text alignment based on position
          if (x < centerX - 5) {
            ctx.textAlign = 'right';
          } else if (x > centerX + 5) {
            ctx.textAlign = 'left';
          } else {
            ctx.textAlign = 'center';
          }

          ctx.fillText(point.label.toUpperCase(), x, y);
        });
      }
    };

    if (animate) {
      const duration = 1000; // 1 second
      const startTime = Date.now();

      const animateFrame = () => {
        const elapsed = Date.now() - startTime;
        progressRef.current = Math.min(elapsed / duration, 1);

        draw(progressRef.current);

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
  }, [data, size, levels, animate, showLabels, color]);

  return (
    <div className={clsx(styles.radarChart, className)}>
      <canvas ref={canvasRef} />
    </div>
  );
};
