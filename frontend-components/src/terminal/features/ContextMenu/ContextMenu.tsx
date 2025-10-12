import React, { useState, useEffect, useRef } from 'react';
import { Copy, Download, Share2, Bookmark, ExternalLink, TrendingUp, FileText, AlertCircle, MoreHorizontal } from 'lucide-react';
import './ContextMenu.css';

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  divider?: boolean;
  danger?: boolean;
}

export interface ContextMenuProps {
  items: ContextMenuItem[];
  x: number;
  y: number;
  onClose: () => void;
  className?: string;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ items, x, y, onClose, className = '' }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }

      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [x, y]);

  return (
    <div ref={menuRef} className={`context-menu ${className}`} style={{ left: x, top: y }}>
      {items.map((item, index) => {
        if (item.divider) {
          return <div key={index} className="context-menu-divider" />;
        }
        return (
          <button key={index} className={`context-menu-item ${item.disabled ? 'disabled' : ''} ${item.danger ? 'danger' : ''}`} onClick={() => { if (!item.disabled) { item.onClick(); onClose(); }}} disabled={item.disabled}>
            {item.icon && <span className="context-menu-icon">{item.icon}</span>}
            <span className="context-menu-label">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ContextMenuItem[]; } | null>(null);

  const openContextMenu = (e: React.MouseEvent, items: ContextMenuItem[]) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, items });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  return { contextMenu, openContextMenu, closeContextMenu };
}

export const commonContextMenuItems = {
  copy: (onCopy: () => void): ContextMenuItem => ({ label: 'Copy', icon: <Copy size={14} />, onClick: onCopy }),
  download: (onDownload: () => void): ContextMenuItem => ({ label: 'Download', icon: <Download size={14} />, onClick: onDownload }),
  share: (onShare: () => void): ContextMenuItem => ({ label: 'Share', icon: <Share2 size={14} />, onClick: onShare }),
  bookmark: (onBookmark: () => void): ContextMenuItem => ({ label: 'Add to Watchlist', icon: <Bookmark size={14} />, onClick: onBookmark }),
  viewDetails: (onView: () => void): ContextMenuItem => ({ label: 'View Details', icon: <ExternalLink size={14} />, onClick: onView }),
  analyze: (onAnalyze: () => void): ContextMenuItem => ({ label: 'Analyze', icon: <TrendingUp size={14} />, onClick: onAnalyze }),
  export: (onExport: () => void): ContextMenuItem => ({ label: 'Export Data', icon: <FileText size={14} />, onClick: onExport }),
  alert: (onAlert: () => void): ContextMenuItem => ({ label: 'Create Alert', icon: <AlertCircle size={14} />, onClick: onAlert }),
  more: (onMore: () => void): ContextMenuItem => ({ label: 'More Actions...', icon: <MoreHorizontal size={14} />, onClick: onMore }),
  divider: (): ContextMenuItem => ({ label: '', onClick: () => {}, divider: true })
};
