import React, { useState } from 'react';
import { Panel } from '../../../frontend-components/src/terminal/organisms/Panel';
import { ContextChannelSelector } from '../../../frontend-components/src/terminal/molecules/ContextChannelSelector';
import type { ContextChannel } from '../../../src/types/biotech';
import './TerminalFeaturesDemo.css';

/**
 * Demo page showcasing terminal-grade features
 * - Context Channel Selector
 * - Command Palette (⌘+K to test)
 * - App Library (grid icon in top bar)
 */
export const TerminalFeaturesDemo: React.FC = () => {
  const [panel1Channel, setPanel1Channel] = useState<ContextChannel>('A');
  const [panel2Channel, setPanel2Channel] = useState<ContextChannel>('A');
  const [panel3Channel, setPanel3Channel] = useState<ContextChannel>('B');

  return (
    <div className="terminal-features-demo">
      <div className="demo-header">
        <h1>TERMINAL-GRADE FEATURES DEMO</h1>
        <p>Explore Bloomberg/FactSet/LSEG-inspired features</p>
      </div>

      <div className="demo-instructions">
        <div className="instruction-card">
          <h3>⌘ Command Palette</h3>
          <p>Press <kbd>⌘+K</kbd> or <kbd>Ctrl+K</kbd></p>
          <p>Type function codes: <kbd>CO</kbd> <kbd>NE</kbd> <kbd>TR</kbd> <kbd>CA</kbd></p>
        </div>

        <div className="instruction-card">
          <h3>📱 App Library</h3>
          <p>Click the <strong>grid icon</strong> in the top-right corner</p>
          <p>Browse 30+ apps, filter by category, star favorites</p>
        </div>

        <div className="instruction-card">
          <h3>🔗 Context Groups</h3>
          <p>Use the channel selectors below</p>
          <p>Panels on same channel sync together</p>
        </div>
      </div>

      <div className="demo-panels">
        <Panel
          title="WATCHLIST"
          cornerBrackets
          headerAction={
            <ContextChannelSelector
              currentChannel={panel1Channel}
              onChannelChange={setPanel1Channel}
            />
          }
        >
          <div className="demo-content">
            <p>Channel: <strong>{panel1Channel}</strong></p>
            <p>Click items to broadcast to other panels on {panel1Channel}</p>
            <div className="demo-list">
              <button className="demo-item">ARYAZ - Arya Therapeutics</button>
              <button className="demo-item">BCRX - BioCryst Pharmaceuticals</button>
              <button className="demo-item">SRPT - Sarepta Therapeutics</button>
            </div>
          </div>
        </Panel>

        <Panel
          title="NEWS FEED"
          cornerBrackets
          headerAction={
            <ContextChannelSelector
              currentChannel={panel2Channel}
              onChannelChange={setPanel2Channel}
            />
          }
        >
          <div className="demo-content">
            <p>Channel: <strong>{panel2Channel}</strong></p>
            <p>Listening for updates on {panel2Channel}</p>
            {panel1Channel === panel2Channel ? (
              <div className="demo-status success">
                ✓ Linked to WATCHLIST
              </div>
            ) : (
              <div className="demo-status neutral">
                ⊘ Independent
              </div>
            )}
          </div>
        </Panel>

        <Panel
          title="CATALYST CALENDAR"
          cornerBrackets
          headerAction={
            <ContextChannelSelector
              currentChannel={panel3Channel}
              onChannelChange={setPanel3Channel}
            />
          }
        >
          <div className="demo-content">
            <p>Channel: <strong>{panel3Channel}</strong></p>
            <p>Listening for updates on {panel3Channel}</p>
            {panel1Channel === panel3Channel ? (
              <div className="demo-status success">
                ✓ Linked to WATCHLIST
              </div>
            ) : (
              <div className="demo-status neutral">
                ⊘ Independent
              </div>
            )}
          </div>
        </Panel>
      </div>

      <div className="demo-features">
        <h2>Implemented Features</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <h3>✅ Context Groups</h3>
            <p>A/B/C channel linking</p>
            <p>Panel synchronization</p>
            <p>Color-coded indicators</p>
          </div>
          
          <div className="feature-card">
            <h3>✅ Command Palette</h3>
            <p>50+ function codes</p>
            <p>Keyboard shortcuts</p>
            <p>Recent commands</p>
          </div>

          <div className="feature-card">
            <h3>✅ App Library</h3>
            <p>30+ apps configured</p>
            <p>Category filtering</p>
            <p>Favorites tracking</p>
          </div>

          <div className="feature-card">
            <h3>✅ Starter Layouts</h3>
            <p>Oncology PM</p>
            <p>Catalyst War-Room</p>
            <p>Epi Ops</p>
            <p>Market Intelligence</p>
          </div>
        </div>
      </div>
    </div>
  );
};
