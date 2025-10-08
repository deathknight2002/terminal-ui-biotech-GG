import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Command, ArrowRight, Clock } from 'lucide-react';
import type { FunctionCode, CommandPaletteItem } from '../../../../../src/types/biotech';
import './CommandPalette.css';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  functionCodes: FunctionCode[];
  recentCommands?: CommandPaletteItem[];
  onExecute: (item: CommandPaletteItem | FunctionCode) => void;
  className?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  functionCodes,
  recentCommands = [],
  onExecute,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredResults, setFilteredResults] = useState<(FunctionCode | CommandPaletteItem)[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Filter and rank results
  useEffect(() => {
    if (!query.trim()) {
      // Show recent commands when no query
      setFilteredResults(recentCommands.slice(0, 8));
      return;
    }

    const searchQuery = query.toLowerCase().trim();
    const results: (FunctionCode | CommandPaletteItem)[] = [];

    // Exact function code match (highest priority)
    const exactCodeMatch = functionCodes.find(
      (fc) => fc.code.toLowerCase() === searchQuery
    );
    if (exactCodeMatch) {
      results.push(exactCodeMatch);
    }

    // Partial function code matches
    functionCodes.forEach((fc) => {
      if (fc !== exactCodeMatch && fc.code.toLowerCase().startsWith(searchQuery)) {
        results.push(fc);
      }
    });

    // Keyword and label matches
    functionCodes.forEach((fc) => {
      if (
        results.includes(fc) ||
        fc.label.toLowerCase().includes(searchQuery) ||
        fc.description.toLowerCase().includes(searchQuery) ||
        fc.keywords?.some((k) => k.toLowerCase().includes(searchQuery))
      ) {
        if (!results.includes(fc)) {
          results.push(fc);
        }
      }
    });

    // Recent command matches
    recentCommands.forEach((cmd) => {
      if (
        cmd.label.toLowerCase().includes(searchQuery) ||
        cmd.subtitle?.toLowerCase().includes(searchQuery) ||
        cmd.keywords?.some((k) => k.toLowerCase().includes(searchQuery))
      ) {
        results.push(cmd);
      }
    });

    setFilteredResults(results.slice(0, 10));
    setSelectedIndex(0);
  }, [query, functionCodes, recentCommands]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, filteredResults.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredResults[selectedIndex]) {
            onExecute(filteredResults[selectedIndex]);
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filteredResults, selectedIndex, onExecute, onClose]
  );

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const isFunctionCode = (item: FunctionCode | CommandPaletteItem): item is FunctionCode => {
    return 'code' in item;
  };

  if (!isOpen) return null;

  return (
    <div className={`command-palette-overlay ${className}`} onClick={handleBackdropClick}>
      <div className="command-palette" role="dialog" aria-modal="true" aria-labelledby="command-palette-title">
        <div className="command-palette-header">
          <div className="command-palette-search">
            <Command className="command-icon" size={20} />
            <input
              ref={inputRef}
              type="text"
              className="command-input"
              placeholder="Enter function code or search... (e.g., CO for Companies)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Command palette search"
              aria-autocomplete="list"
              aria-controls="command-results"
              aria-activedescendant={`command-item-${selectedIndex}`}
            />
            <kbd className="command-kbd">ESC</kbd>
          </div>
        </div>

        <div className="command-palette-body">
          {filteredResults.length === 0 ? (
            <div className="command-empty">
              <Search size={48} className="command-empty-icon" />
              <p className="command-empty-text">
                {query ? 'No matching commands found' : 'Start typing to search...'}
              </p>
              <p className="command-empty-hint">
                Try function codes like <kbd>CO</kbd> <kbd>TR</kbd> <kbd>CA</kbd> <kbd>NE</kbd>
              </p>
            </div>
          ) : (
            <>
              {!query && recentCommands.length > 0 && (
                <div className="command-section-label">
                  <Clock size={14} /> RECENT
                </div>
              )}
              <div className="command-results" ref={resultsRef} id="command-results">
                {filteredResults.map((item, index) => {
                  const isFC = isFunctionCode(item);
                  return (
                    <button
                      key={isFC ? item.code : item.id}
                      id={`command-item-${index}`}
                      className={`command-result-item ${index === selectedIndex ? 'selected' : ''}`}
                      onClick={() => {
                        onExecute(item);
                        onClose();
                      }}
                      role="option"
                      aria-selected={index === selectedIndex}
                    >
                      <div className="command-result-icon">
                        {isFC ? (
                          <div className="function-code-badge">{item.code}</div>
                        ) : (
                          item.type === 'recent' && <Clock size={16} />
                        )}
                      </div>
                      <div className="command-result-content">
                        <div className="command-result-label">
                          {isFC ? item.label : item.label}
                        </div>
                        <div className="command-result-description">
                          {isFC ? item.description : item.subtitle}
                        </div>
                      </div>
                      {isFC && item.shortcut && (
                        <kbd className="command-result-shortcut">{item.shortcut}</kbd>
                      )}
                      <ArrowRight size={16} className="command-result-arrow" />
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="command-palette-footer">
          <div className="command-palette-tips">
            <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Execute</span>
            <span><kbd>ESC</kbd> Close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
