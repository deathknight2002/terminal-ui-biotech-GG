import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import styles from './DonutChart.module.css';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export interface DonutChartProps {
  data: DonutSegment[];
  size?: number;
  thickness?: number;
  showLabels?: boolean;
  showLegend?: boolean;
  animate?: boolean;
  centerLabel?: string;
  centerValue?: string;
  className?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  size = 200,
  thickness = 40,
  showLabels = false,
  showLegend = true,
  animate = true,
  centerLabel,
  centerValue,
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
    const radius = (size / 2) - thickness / 2 - 10;

    const total = data.reduce((sum, segment) => sum + segment.value, 0);

    const draw = (progress: number) => {
      ctx.clearRect(0, 0, size, size);

      let currentAngle = -Math.PI / 2; // Start at top

      data.forEach((segment) => {
        const segmentAngle = (segment.value / total) * Math.PI * 2;
        const endAngle = currentAngle + segmentAngle * (animate ? progress : 1);

        // Draw segment
        ctx.strokeStyle = segment.color;
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, currentAngle, endAngle);
        ctx.stroke();

        // Draw labels
        if (showLabels && progress === 1) {
          const labelAngle = currentAngle + segmentAngle / 2;
          const labelRadius = radius + thickness / 2 + 20;
          const x = centerX + Math.cos(labelAngle) * labelRadius;
          const y = centerY + Math.sin(labelAngle) * labelRadius;

          const percentage = ((segment.value / total) * 100).toFixed(1);

          ctx.fillStyle = segment.color;
          ctx.font = '11px var(--font-mono)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${percentage}%`, x, y);
        }

        currentAngle = endAngle;
      });

      // Draw separator lines between segments
      currentAngle = -Math.PI / 2;
      data.forEach((segment) => {
        const segmentAngle = (segment.value / total) * Math.PI * 2;

        ctx.strokeStyle = 'var(--bg-panel)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const x1 = centerX + Math.cos(currentAngle) * (radius - thickness / 2);
        const y1 = centerY + Math.sin(currentAngle) * (radius - thickness / 2);
        const x2 = centerX + Math.cos(currentAngle) * (radius + thickness / 2);
        const y2 = centerY + Math.sin(currentAngle) * (radius + thickness / 2);
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        currentAngle += segmentAngle * (animate ? progress : 1);
      });
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
  }, [data, size, thickness, showLabels, animate]);

  const total = data.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <div className={clsx(styles.donutChart, className)}>
      <div className={styles.chartContainer}>
        <canvas ref={canvasRef} />
        {(centerLabel || centerValue) && (
          <div className={styles.centerContent}>
            {centerValue && <div className={styles.centerValue}>{centerValue}</div>}
            {centerLabel && <div className={styles.centerLabel}>{centerLabel}</div>}
          </div>
        )}
      </div>
      {showLegend && (
        <div className={styles.legend}>
          {data.map((segment, index) => (
            <div key={index} className={styles.legendItem}>
              <div
                className={styles.legendColor}
                style={{ backgroundColor: segment.color }}
              />
              <div className={styles.legendText}>
                <span className={styles.legendLabel}>{segment.label}</span>
                <span className={styles.legendValue}>
                  {((segment.value / total) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
