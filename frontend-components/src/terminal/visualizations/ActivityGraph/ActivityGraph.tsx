import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import styles from './ActivityGraph.module.css';

export interface ActivityDataPoint {
  timestamp: number;
  value: number;
}

export interface ActivityGraphProps {
  data: ActivityDataPoint[];
  height?: number;
  color?: string;
  gradient?: boolean;
  animate?: boolean;
  showGrid?: boolean;
  className?: string;
}

export const ActivityGraph: React.FC<ActivityGraphProps> = ({
  data,
  height = 150,
  color = 'var(--accent-cyan)',
  gradient = true,
  animate = true,
  showGrid = true,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const progressRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = height;
      draw(progressRef.current);
    };

    const draw = (progress: number) => {
      const { width, height: canvasHeight } = canvas;
      ctx.clearRect(0, 0, width, canvasHeight);

      if (data.length === 0) return;

      // Find min and max values
      const values = data.map(d => d.value);
      const maxValue = Math.max(...values);
      const minValue = Math.min(...values);
      const range = maxValue - minValue || 1;

      // Draw grid
      if (showGrid) {
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);

        // Horizontal lines
        for (let i = 0; i <= 4; i++) {
          const y = (canvasHeight / 4) * i;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        ctx.setLineDash([]);
      }

      // Calculate points
      const points: [number, number][] = data.map((point, index) => {
        const x = (index / (data.length - 1)) * width;
        const normalizedValue = (point.value - minValue) / range;
        const y = canvasHeight - (normalizedValue * canvasHeight * 0.9) - (canvasHeight * 0.05);
        return [x, y];
      });

      // Determine how many points to show based on animation progress
      const visiblePoints = animate
        ? Math.floor(points.length * progress)
        : points.length;

      if (visiblePoints < 2) return;

      const displayPoints = points.slice(0, visiblePoints);

      // Draw gradient fill
      if (gradient) {
        const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
        const baseColor = color.includes('var(')
          ? getComputedStyle(document.documentElement).getPropertyValue(color.slice(4, -1))
          : color;

        grad.addColorStop(0, baseColor.replace(')', ', 0.3)').replace('rgb', 'rgba'));
        grad.addColorStop(1, baseColor.replace(')', ', 0)').replace('rgb', 'rgba'));

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(displayPoints[0][0], canvasHeight);
        displayPoints.forEach(([x, y]) => {
          ctx.lineTo(x, y);
        });
        ctx.lineTo(displayPoints[displayPoints.length - 1][0], canvasHeight);
        ctx.closePath();
        ctx.fill();
      }

      // Draw line
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      ctx.beginPath();
      displayPoints.forEach(([x, y], i) => {
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Draw points
      displayPoints.forEach(([x, y]) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);

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
      window.removeEventListener('resize', updateSize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [data, height, color, gradient, animate, showGrid]);

  return (
    <div ref={containerRef} className={clsx(styles.activityGraph, className)}>
      <canvas ref={canvasRef} />
    </div>
  );
};
