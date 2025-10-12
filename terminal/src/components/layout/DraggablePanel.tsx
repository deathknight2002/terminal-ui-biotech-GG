import React, { useState, useRef, useEffect } from 'react';
import { Panel } from '@biotech-terminal/frontend-components/terminal';
import './DraggablePanel.css';

export interface DraggablePanelProps {
  id: string;
  title: string;
  children: React.ReactNode;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  minWidth?: number;
  minHeight?: number;
  onPositionChange?: (id: string, position: { x: number; y: number }) => void;
  onSizeChange?: (id: string, size: { width: number; height: number }) => void;
  onClose?: (id: string) => void;
  cornerBrackets?: boolean;
  className?: string;
}

export const DraggablePanel: React.FC<DraggablePanelProps> = ({
  id,
  title,
  children,
  initialPosition = { x: 0, y: 0 },
  initialSize = { width: 400, height: 300 },
  minWidth = 200,
  minHeight = 150,
  onPositionChange,
  onSizeChange,
  onClose,
  cornerBrackets = true,
  className = '',
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.panel-header')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  // Handle resize start
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    });
  };

  // Handle mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newPosition = {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        };
        setPosition(newPosition);
      } else if (isResizing) {
        const newWidth = Math.max(minWidth, resizeStart.width + (e.clientX - resizeStart.x));
        const newHeight = Math.max(minHeight, resizeStart.height + (e.clientY - resizeStart.y));
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onPositionChange?.(id, position);
      }
      if (isResizing) {
        setIsResizing(false);
        onSizeChange?.(id, size);
      }
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart, position, size, id, onPositionChange, onSizeChange, minWidth, minHeight]);

  return (
    <div
      ref={panelRef}
      className={`draggable-panel ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${className}`}
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: isDragging || isResizing ? 1000 : 1,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="draggable-panel-header panel-header">
        <span className="draggable-panel-title">{title}</span>
        <div className="draggable-panel-controls">
          {onClose && (
            <button
              className="draggable-panel-close"
              onClick={(e) => {
                e.stopPropagation();
                onClose(id);
              }}
              aria-label="Close panel"
            >
              ×
            </button>
          )}
        </div>
      </div>
      
      <div className="draggable-panel-content">
        <Panel cornerBrackets={cornerBrackets} className="inner-panel">
          {children}
        </Panel>
      </div>

      {/* Resize handle */}
      <div
        className="resize-handle"
        onMouseDown={handleResizeMouseDown}
        aria-label="Resize panel"
      />
    </div>
  );
};
