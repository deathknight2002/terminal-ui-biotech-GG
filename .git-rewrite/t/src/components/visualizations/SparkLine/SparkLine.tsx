import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import styles from './SparkLine.module.css';

export interface SparkLineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillColor?: string;
  showArea?: boolean;
  showDots?: boolean;
  animate?: boolean;
  className?: string;
}

export const SparkLine: React.FC<SparkLineProps> = ({
  data,
  width = 100,
  height = 30,
  color = 'var(--accent-cyan)',
  fillColor,
  showArea = true,
  showDots = false,
  animate = true,
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

    canvas.width = width;
    canvas.height = height;

    const draw = (progress: number) => {
      ctx.clearRect(0, 0, width, height);

      if (data.length === 0) return;

      const minValue = Math.min(...data);
      const maxValue = Math.max(...data);
      const range = maxValue - minValue || 1;
      const padding = 4;

      // Calculate points
      const points: [number, number][] = data.map((value, index) => {
        const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
        const normalizedValue = (value - minValue) / range;
        const y = height - padding - normalizedValue * (height - padding * 2);
        return [x, y];
      });

      // Determine visible points based on animation
      const visibleCount = animate
        ? Math.floor(points.length * progress)
        : points.length;

      if (visibleCount < 2) return;

      const visiblePoints = points.slice(0, visibleCount);

      const lineColor = color.includes('var(')
        ? getComputedStyle(document.documentElement).getPropertyValue(color.slice(4, -1))
        : color;

      // Draw area
      if (showArea) {
        const areaColor = fillColor || lineColor.replace(')', ', 0.2)').replace('rgb', 'rgba');

        ctx.fillStyle = areaColor;
        ctx.beginPath();
        ctx.moveTo(visiblePoints[0][0], height - padding);
        visiblePoints.forEach(([x, y]) => {
          ctx.lineTo(x, y);
        });
        ctx.lineTo(visiblePoints[visiblePoints.length - 1][0], height - padding);
        ctx.closePath();
        ctx.fill();
      }

      // Draw line
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      ctx.beginPath();
      visiblePoints.forEach(([x, y], i) => {
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Draw dots
      if (showDots) {
        visiblePoints.forEach(([x, y]) => {
          ctx.fillStyle = lineColor;
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Highlight last point
      const lastPoint = visiblePoints[visiblePoints.length - 1];
      ctx.fillStyle = lineColor;
      ctx.beginPath();
      ctx.arc(lastPoint[0], lastPoint[1], 3, 0, Math.PI * 2);
      ctx.fill();

      // Glow effect on last point
      ctx.shadowColor = lineColor;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(lastPoint[0], lastPoint[1], 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    if (animate) {
      const duration = 800;
      const startTime = Date.now();

      const animateFrame = () => {
        const elapsed = Date.now() - startTime;
        progressRef.current = Math.min(elapsed / duration, 1);

        // Ease out quad
        const eased = 1 - Math.pow(1 - progressRef.current, 2);
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
  }, [data, width, height, color, fillColor, showArea, showDots, animate]);

  return (
    <div className={clsx(styles.sparkLine, className)}>
      <canvas ref={canvasRef} />
    </div>
  );
};
