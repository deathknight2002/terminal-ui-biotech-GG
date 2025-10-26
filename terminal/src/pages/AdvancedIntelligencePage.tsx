/**
 * Advanced Intelligence Page
 *
 * Showcases the advanced biotech intelligence features powered by multiple APIs
 */

import React from 'react';
import { AdvancedIntelligenceDashboard } from '../components/AdvancedIntelligenceDashboard';
import './AdvancedIntelligencePage.css';

export const AdvancedIntelligencePage: React.FC = () => {
  return (
    <div className="advanced-intelligence-page">
      <AdvancedIntelligenceDashboard />
    </div>
  );
};
