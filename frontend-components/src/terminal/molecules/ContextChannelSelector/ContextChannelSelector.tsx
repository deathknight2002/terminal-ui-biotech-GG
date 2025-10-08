import React from 'react';
import type { ContextChannel } from '../../../../../src/types/biotech';
import './ContextChannelSelector.css';

export interface ContextChannelSelectorProps {
  currentChannel: ContextChannel;
  onChannelChange: (channel: ContextChannel) => void;
  className?: string;
  disabled?: boolean;
}

const CHANNEL_COLORS: Record<ContextChannel, string> = {
  A: '#ff6b6b',
  B: '#4dabf7',
  C: '#51cf66',
  NONE: '#868e96',
};

const CHANNEL_LABELS: Record<ContextChannel, string> = {
  A: 'CHANNEL A',
  B: 'CHANNEL B',
  C: 'CHANNEL C',
  NONE: 'NONE',
};

/**
 * Context Channel Selector - Bloomberg/LSEG-style linked workspace channels
 * Allows panels to subscribe to color-coded context groups (A/B/C)
 */
export const ContextChannelSelector: React.FC<ContextChannelSelectorProps> = ({
  currentChannel,
  onChannelChange,
  className = '',
  disabled = false,
}) => {
  const channels: ContextChannel[] = ['A', 'B', 'C', 'NONE'];

  return (
    <div className={`context-channel-selector ${className}`}>
      <div className="channel-selector-label">LINK:</div>
      <div className="channel-buttons">
        {channels.map((channel) => (
          <button
            key={channel}
            className={`channel-button ${currentChannel === channel ? 'active' : ''}`}
            onClick={() => onChannelChange(channel)}
            disabled={disabled}
            style={{
              '--channel-color': CHANNEL_COLORS[channel],
            } as React.CSSProperties}
            aria-label={`Select ${CHANNEL_LABELS[channel]}`}
            title={`Link to ${CHANNEL_LABELS[channel]}`}
          >
            <span className="channel-indicator" />
            <span className="channel-text">{channel}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
