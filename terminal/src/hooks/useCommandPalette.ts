import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CommandPaletteItem, FunctionCode } from '../../../src/types/biotech';
import { FUNCTION_CODES } from '../../../src/config/functionCodes';

/**
 * Hook for managing command palette state
 */
export function useCommandPalette() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [recentCommands, setRecentCommands] = useState<CommandPaletteItem[]>([]);

  // Keyboard shortcut to open (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load recent commands from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentCommands');
    if (stored) {
      try {
        setRecentCommands(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent commands', e);
      }
    }
  }, []);

  // Save recent commands to localStorage
  const saveRecentCommand = useCallback((item: CommandPaletteItem) => {
    setRecentCommands((prev) => {
      const filtered = prev.filter((cmd) => cmd.id !== item.id);
      const updated = [item, ...filtered].slice(0, 10);
      localStorage.setItem('recentCommands', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const execute = useCallback(
    (item: CommandPaletteItem | FunctionCode) => {
      // Check if it's a function code or command palette item
      if ('code' in item) {
        // It's a FunctionCode
        navigate(item.path);
        
        // Convert to CommandPaletteItem for recent history
        const cmdItem: CommandPaletteItem = {
          id: item.code,
          type: 'function',
          label: item.label,
          subtitle: item.description,
          action: () => navigate(item.path),
        };
        saveRecentCommand(cmdItem);
      } else {
        // It's a CommandPaletteItem
        item.action();
        saveRecentCommand(item);
      }
      
      close();
    },
    [navigate, close, saveRecentCommand]
  );

  return {
    isOpen,
    open,
    close,
    execute,
    functionCodes: FUNCTION_CODES,
    recentCommands,
  };
}
