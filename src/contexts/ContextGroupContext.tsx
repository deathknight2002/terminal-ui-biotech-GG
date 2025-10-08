import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { ContextChannel, ContextGroup, ContextEntity } from '../types/biotech';

interface ContextGroupContextValue {
  groups: Record<ContextChannel, ContextGroup>;
  activeChannel: ContextChannel;
  setActiveChannel: (channel: ContextChannel) => void;
  broadcastEntity: (channel: ContextChannel, entity: ContextEntity | null) => void;
  subscribePanel: (panelId: string, channel: ContextChannel) => void;
  unsubscribePanel: (panelId: string) => void;
  getActiveEntity: (channel: ContextChannel) => ContextEntity | null;
}

const ContextGroupContext = createContext<ContextGroupContextValue | undefined>(undefined);

const INITIAL_GROUPS: Record<ContextChannel, ContextGroup> = {
  A: { channel: 'A', activeEntity: null, subscribers: [] },
  B: { channel: 'B', activeEntity: null, subscribers: [] },
  C: { channel: 'C', activeEntity: null, subscribers: [] },
  NONE: { channel: 'NONE', activeEntity: null, subscribers: [] },
};

interface ContextGroupProviderProps {
  children: ReactNode;
}

export const ContextGroupProvider: React.FC<ContextGroupProviderProps> = ({ children }) => {
  const [groups, setGroups] = useState<Record<ContextChannel, ContextGroup>>(INITIAL_GROUPS);
  const [activeChannel, setActiveChannel] = useState<ContextChannel>('A');

  const broadcastEntity = useCallback((channel: ContextChannel, entity: ContextEntity | null) => {
    setGroups((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        activeEntity: entity,
      },
    }));
  }, []);

  const subscribePanel = useCallback((panelId: string, channel: ContextChannel) => {
    setGroups((prev) => {
      // Remove from all channels first
      const updated = Object.keys(prev).reduce((acc, ch) => {
        const chan = ch as ContextChannel;
        acc[chan] = {
          ...prev[chan],
          subscribers: prev[chan].subscribers.filter((id) => id !== panelId),
        };
        return acc;
      }, {} as Record<ContextChannel, ContextGroup>);

      // Add to new channel
      updated[channel] = {
        ...updated[channel],
        subscribers: [...updated[channel].subscribers, panelId],
      };

      return updated;
    });
  }, []);

  const unsubscribePanel = useCallback((panelId: string) => {
    setGroups((prev) =>
      Object.keys(prev).reduce((acc, ch) => {
        const chan = ch as ContextChannel;
        acc[chan] = {
          ...prev[chan],
          subscribers: prev[chan].subscribers.filter((id) => id !== panelId),
        };
        return acc;
      }, {} as Record<ContextChannel, ContextGroup>)
    );
  }, []);

  const getActiveEntity = useCallback(
    (channel: ContextChannel): ContextEntity | null => {
      return groups[channel].activeEntity;
    },
    [groups]
  );

  return (
    <ContextGroupContext.Provider
      value={{
        groups,
        activeChannel,
        setActiveChannel,
        broadcastEntity,
        subscribePanel,
        unsubscribePanel,
        getActiveEntity,
      }}
    >
      {children}
    </ContextGroupContext.Provider>
  );
};

export const useContextGroups = (): ContextGroupContextValue => {
  const context = useContext(ContextGroupContext);
  if (!context) {
    throw new Error('useContextGroups must be used within ContextGroupProvider');
  }
  return context;
};
