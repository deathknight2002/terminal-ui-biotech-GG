import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import styles from './WorldMap.module.css';

export interface MapMarker {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  label: string;
  status?: 'success' | 'warning' | 'error' | 'info' | 'idle';
  pulse?: boolean;
}

export interface WorldMapProps {
  markers?: MapMarker[];
  showGrid?: boolean;
  showConnections?: boolean;
  className?: string;
}

export const WorldMap: React.FC<WorldMapProps> = ({
  markers = [],
  showGrid = true,
  showConnections = false,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      drawMap();
    };

    const drawMap = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // Draw world map outline (simplified continents)
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);

      // Simplified world map coordinates (very basic representation)
      const continents = [
        // North America
        { points: [[15, 20], [15, 35], [30, 35], [30, 20]] },
        // South America
        { points: [[20, 45], [20, 65], [30, 65], [28, 45]] },
        // Europe
        { points: [[45, 15], [45, 30], [55, 28], [55, 15]] },
        // Africa
        { points: [[45, 35], [50, 35], [52, 60], [47, 60]] },
        // Asia
        { points: [[55, 15], [55, 40], [85, 40], [85, 15]] },
        // Australia
        { points: [[75, 60], [75, 70], [85, 70], [85, 60]] },
      ];

      continents.forEach(continent => {
        ctx.beginPath();
        continent.points.forEach((point, i) => {
          const x = (point[0] / 100) * width;
          const y = (point[1] / 100) * height;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.closePath();
        ctx.stroke();
      });

      // Draw grid
      if (showGrid) {
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
        ctx.lineWidth = 0.5;
        ctx.setLineDash([2, 4]);

        // Vertical lines
        for (let i = 0; i <= 10; i++) {
          const x = (i / 10) * width;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }

        // Horizontal lines
        for (let i = 0; i <= 10; i++) {
          const y = (i / 10) * height;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }

      // Draw connections between markers
      if (showConnections && markers.length > 1) {
        ctx.strokeStyle = 'rgba(255, 149, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);

        for (let i = 0; i < markers.length - 1; i++) {
          const marker1 = markers[i];
          const marker2 = markers[i + 1];
          const x1 = (marker1.x / 100) * width;
          const y1 = (marker1.y / 100) * height;
          const x2 = (marker2.x / 100) * width;
          const y2 = (marker2.y / 100) * height;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [markers, showGrid, showConnections]);

  return (
    <div ref={containerRef} className={clsx(styles.worldMap, className)}>
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.markers}>
        {markers.map((marker) => (
          <div
            key={marker.id}
            className={clsx(
              styles.marker,
              marker.status && styles[marker.status],
              marker.pulse && styles.pulse
            )}
            style={{
              left: `${marker.x}%`,
              top: `${marker.y}%`,
            }}
            title={marker.label}
          >
            <div className={styles.markerDot} />
            <div className={styles.markerLabel}>{marker.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
