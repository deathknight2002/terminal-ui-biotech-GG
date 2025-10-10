import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import styles from './TherapeuticAreaRadarChart.module.css';

export interface TherapeuticAreaSeries {
  id: string;
  name: string;
  values: number[];  // 0-10 scale
  color: string;
  description?: string;
}

export interface TherapeuticAreaRadarChartProps {
  series: TherapeuticAreaSeries[];
  attributes: string[];
  size?: number;
  levels?: number;
  animate?: boolean;
  showLabels?: boolean;
  showLegend?: boolean;
  auroraGradient?: boolean;  // Use Aurora-themed gradient coloring
  maxValue?: number;  // Max value for scale (default: 10)
  className?: string;
  onSeriesClick?: (seriesId: string) => void;
}

/**
 * TherapeuticAreaRadarChart - Enhanced radar chart for comparing therapeutic areas
 * 
 * Features:
 * - Multi-series support (multiple therapeutic areas on one chart)
 * - Aurora-themed gradient coloring based on values
 * - Interactive hover tooltips
 * - Toggle series visibility
 * - 0-10 scale for science attributes
 * 
 * Example usage:
 * ```tsx
 * <TherapeuticAreaRadarChart
 *   series={[
 *     { id: 'DMD', name: 'Duchenne MD', values: [9.5, 7.8, 8.5, 8.2, 7.5, 8.0, 9.0], color: '#00d4ff' },
 *     { id: 'Cardiology', name: 'Cardiovascular', values: [8.5, 9.5, 7.5, 9.0, 9.0, 8.5, 7.0], color: '#fbbf24' }
 *   ]}
 *   attributes={['Unmet Need', 'Market Size', 'Regulatory Support', ...]}
 *   auroraGradient={true}
 * />
 * ```
 */
export const TherapeuticAreaRadarChart: React.FC<TherapeuticAreaRadarChartProps> = ({
  series,
  attributes,
  size = 500,
  levels = 5,
  animate = true,
  showLabels = true,
  showLegend = true,
  auroraGradient = true,
  maxValue = 10,
  className,
  onSeriesClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const progressRef = useRef<number>(0);
  const [activeSeries, setActiveSeries] = useState<Set<string>>(new Set(series.map(s => s.id)));
  const [hoveredSeries, setHoveredSeries] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<{ x: number; y: number; text: string } | null>(null);

  const toggleSeries = (seriesId: string) => {
    setActiveSeries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(seriesId)) {
        newSet.delete(seriesId);
      } else {
        newSet.add(seriesId);
      }
      return newSet;
    });
  };

  const getAuroraGradientColor = (value: number, baseColor: string): string => {
    if (!auroraGradient) return baseColor;
    
    // Create gradient based on value (0-10 scale)
    const intensity = value / maxValue;
    
    // Parse base color (assumes hex format)
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Apply intensity gradient (brighter = higher value)
    const adjustedR = Math.round(r + (255 - r) * (1 - intensity) * 0.3);
    const adjustedG = Math.round(g + (255 - g) * (1 - intensity) * 0.3);
    const adjustedB = Math.round(b + (255 - b) * (1 - intensity) * 0.3);
    
    return `rgb(${adjustedR}, ${adjustedG}, ${adjustedB})`;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size / 2) - 80;
    const angleStep = (Math.PI * 2) / attributes.length;

    const draw = (progress: number) => {
      ctx.clearRect(0, 0, size, size);

      // Draw level circles (grid)
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';  // slate-400 with low opacity
      ctx.lineWidth = 1;

      for (let level = 1; level <= levels; level++) {
        const levelRadius = (radius / levels) * level;
        ctx.beginPath();

        attributes.forEach((_, i) => {
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
        
        // Draw level label
        if (level === levels) {
          ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
          ctx.font = '9px var(--font-mono)';
          ctx.textAlign = 'center';
          ctx.fillText(`${maxValue}`, centerX + levelRadius + 15, centerY);
        }
      }

      // Draw axes
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
      ctx.lineWidth = 1;

      attributes.forEach((_, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();
      });

      // Draw data polygons for each active series
      const currentProgress = animate ? progress : 1;
      
      series.forEach(s => {
        if (!activeSeries.has(s.id)) return;

        const isHovered = hoveredSeries === s.id;
        const opacity = isHovered ? 1 : 0.7;
        const fillOpacity = isHovered ? 0.25 : 0.15;

        ctx.strokeStyle = s.color;
        ctx.globalAlpha = opacity;
        ctx.fillStyle = s.color.replace(')', `, ${fillOpacity})`).replace('rgb', 'rgba');
        ctx.lineWidth = isHovered ? 3 : 2;

        ctx.beginPath();
        
        s.values.forEach((value, i) => {
          const angle = angleStep * i - Math.PI / 2;
          const normalizedValue = (value / maxValue) * currentProgress;
          const pointRadius = radius * normalizedValue;
          const x = centerX + Math.cos(angle) * pointRadius;
          const y = centerY + Math.sin(angle) * pointRadius;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });

        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw data points
        s.values.forEach((value, i) => {
          const angle = angleStep * i - Math.PI / 2;
          const normalizedValue = (value / maxValue) * currentProgress;
          const pointRadius = radius * normalizedValue;
          const x = centerX + Math.cos(angle) * pointRadius;
          const y = centerY + Math.sin(angle) * pointRadius;

          ctx.save();
          
          // Use gradient color for points if auroraGradient is enabled
          const pointColor = auroraGradient ? getAuroraGradientColor(value, s.color) : s.color;
          ctx.fillStyle = pointColor;
          
          ctx.beginPath();
          ctx.arc(x, y, isHovered ? 5 : 4, 0, Math.PI * 2);
          ctx.fill();
          
          // Add glow effect for hovered series
          if (isHovered) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = s.color;
            ctx.fill();
          }
          
          ctx.restore();
        });
        
        ctx.globalAlpha = 1;
      });

      // Draw attribute labels
      if (showLabels) {
        ctx.fillStyle = 'var(--text-primary)';
        ctx.font = '11px var(--font-mono)';
        ctx.textBaseline = 'middle';

        attributes.forEach((label, i) => {
          const angle = angleStep * i - Math.PI / 2;
          const labelRadius = radius + 40;
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

          // Word wrap for long labels
          const words = label.toUpperCase().split(' ');
          if (words.length > 1 && label.length > 15) {
            ctx.fillText(words[0], x, y - 8);
            ctx.fillText(words.slice(1).join(' '), x, y + 8);
          } else {
            ctx.fillText(label.toUpperCase(), x, y);
          }
        });
      }
    };

    if (animate) {
      const duration = 1200; // 1.2 seconds
      const startTime = Date.now();

      const animateFrame = () => {
        const elapsed = Date.now() - startTime;
        progressRef.current = Math.min(elapsed / duration, 1);

        // Ease-out cubic
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
  }, [series, attributes, size, levels, animate, showLabels, activeSeries, hoveredSeries, maxValue, auroraGradient]);

  return (
    <div className={clsx(styles.therapeuticAreaRadarChart, className)}>
      <canvas 
        ref={canvasRef}
        onMouseMove={(e) => {
          // TODO: Implement hover detection for tooltips
        }}
        onMouseLeave={() => {
          setHoveredSeries(null);
          setTooltipData(null);
        }}
      />
      
      {showLegend && (
        <div className={styles.legend}>
          {series.map(s => (
            <button
              key={s.id}
              className={clsx(
                styles.legendItem,
                !activeSeries.has(s.id) && styles.legendItemInactive
              )}
              onClick={() => {
                toggleSeries(s.id);
                if (onSeriesClick) onSeriesClick(s.id);
              }}
              onMouseEnter={() => setHoveredSeries(s.id)}
              onMouseLeave={() => setHoveredSeries(null)}
            >
              <span 
                className={styles.legendColor} 
                style={{ backgroundColor: s.color }}
              />
              <span className={styles.legendLabel}>{s.name}</span>
              {s.description && (
                <span className={styles.legendDescription}>{s.description}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {tooltipData && (
        <div 
          className={styles.tooltip}
          style={{ 
            left: tooltipData.x, 
            top: tooltipData.y 
          }}
        >
          {tooltipData.text}
        </div>
      )}
    </div>
  );
};
