import React, { useState } from 'react';
import { Panel } from '@biotech-terminal/frontend-components/terminal';
import './TabbedPanel.css';

export interface TabConfig {
  id: string;
  label: string;
  content: React.ReactNode;
  closeable?: boolean;
}

export interface TabbedPanelProps {
  title: string;
  tabs: TabConfig[];
  onTabClose?: (tabId: string) => void;
  onAddTab?: () => void;
  cornerBrackets?: boolean;
  className?: string;
}

export const TabbedPanel: React.FC<TabbedPanelProps> = ({
  title,
  tabs,
  onTabClose,
  onAddTab,
  cornerBrackets = true,
  className = '',
}) => {
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id);

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    if (onTabClose) {
      onTabClose(tabId);
      // Switch to first remaining tab
      const remainingTabs = tabs.filter((t) => t.id !== tabId);
      if (remainingTabs.length > 0) {
        setActiveTabId(remainingTabs[0].id);
      }
    }
  };

  return (
    <Panel title={title} cornerBrackets={cornerBrackets} className={`tabbed-panel ${className}`}>
      <div className="tabbed-panel-header">
        <div className="tabbed-panel-tabs">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`tabbed-panel-tab ${activeTabId === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTabId(tab.id)}
              role="tab"
              aria-selected={activeTabId === tab.id}
              tabIndex={0}
            >
              <span className="tab-label">{tab.label}</span>
              {tab.closeable && (
                <button
                  className="tab-close"
                  onClick={(e) => handleTabClose(e, tab.id)}
                  aria-label={`Close ${tab.label}`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {onAddTab && (
            <button
              className="tabbed-panel-add-tab"
              onClick={onAddTab}
              aria-label="Add new tab"
            >
              +
            </button>
          )}
        </div>
      </div>
      <div className="tabbed-panel-content">
        {activeTab?.content}
      </div>
    </Panel>
  );
};
