import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import styles from './BarChart.module.css';

export interface BarDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface BarChartProps {
  data: BarDataPoint[];
  height?: number;
  showValues?: boolean;
  showGrid?: boolean;
  animate?: boolean;
  horizontal?: boolean;
  color?: string;
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 300,
  showValues = true,
  showGrid = true,
  animate = true,
  horizontal = false,
  color = 'var(--accent-cyan)',
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

      const maxValue = Math.max(...data.map(d => d.value));
      const padding = { top: 40, right: 40, bottom: 60, left: 60 };
      const chartWidth = width - padding.left - padding.right;
      const chartHeight = canvasHeight - padding.top - padding.bottom;

      // Draw grid
      if (showGrid) {
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);

        const gridLines = 5;
        for (let i = 0; i <= gridLines; i++) {
          const y = padding.top + (chartHeight / gridLines) * i;
          ctx.beginPath();
          ctx.moveTo(padding.left, y);
          ctx.lineTo(width - padding.right, y);
          ctx.stroke();

          // Draw y-axis labels
          const value = maxValue * (1 - i / gridLines);
          ctx.fillStyle = 'var(--text-secondary)';
          ctx.font = '10px var(--font-mono)';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText(value.toFixed(0), padding.left - 10, y);
        }

        ctx.setLineDash([]);
      }

      // Draw bars
      const barWidth = chartWidth / data.length;
      const barPadding = barWidth * 0.2;
      const actualBarWidth = barWidth - barPadding;

      data.forEach((point, index) => {
        const barColor = point.color || color;
        const x = padding.left + index * barWidth + barPadding / 2;
        const normalizedValue = point.value / maxValue;
        const barHeight = chartHeight * normalizedValue * (animate ? progress : 1);
        const y = padding.top + chartHeight - barHeight;

        // Draw bar with gradient
        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        const baseColor = barColor.includes('var(')
          ? getComputedStyle(document.documentElement).getPropertyValue(barColor.slice(4, -1))
          : barColor;

        gradient.addColorStop(0, baseColor);
        gradient.addColorStop(1, baseColor.replace(')', ', 0.6)').replace('rgb', 'rgba'));

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, actualBarWidth, barHeight);

        // Draw border
        ctx.strokeStyle = barColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, actualBarWidth, barHeight);

        // Draw value on top
        if (showValues && progress > 0.8) {
          ctx.fillStyle = barColor;
          ctx.font = '11px var(--font-mono)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(point.value.toString(), x + actualBarWidth / 2, y - 5);
        }

        // Draw label
        ctx.fillStyle = 'var(--text-primary)';
        ctx.font = '11px var(--font-mono)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.save();
        ctx.translate(x + actualBarWidth / 2, padding.top + chartHeight + 10);
        ctx.rotate(-Math.PI / 4);
        ctx.fillText(point.label.toUpperCase(), 0, 0);
        ctx.restore();
      });

      // Draw axes
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
      ctx.lineWidth = 2;

      // Y-axis
      ctx.beginPath();
      ctx.moveTo(padding.left, padding.top);
      ctx.lineTo(padding.left, padding.top + chartHeight);
      ctx.stroke();

      // X-axis
      ctx.beginPath();
      ctx.moveTo(padding.left, padding.top + chartHeight);
      ctx.lineTo(width - padding.right, padding.top + chartHeight);
      ctx.stroke();
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
  }, [data, height, showValues, showGrid, animate, color]);

  return (
    <div ref={containerRef} className={clsx(styles.barChart, className)}>
      <canvas ref={canvasRef} />
    </div>
  );
};
