import React from 'react'
import { BioAuroraDashboard } from '../../../frontend-components/src/biotech'
import type { Catalyst, PortfolioPosition } from '../../../frontend-components/src/types/biotech'
import styles from './DashboardPage.module.css'
import { previewDashboard } from '../data/previewData'

export function DashboardPage() {
  const handleSelectCatalyst = (catalyst: Catalyst) => {
    if (catalyst.url) {
      window.open(catalyst.url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleSelectPosition = (position: PortfolioPosition) => {
    const searchQuery = `${position.company} stock analysis`.replace(/\s+/g, '+')
    window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank', 'noopener,noreferrer')
  }

  const handleRefreshNews = () => {
    window.location.reload()
  }

  return (
    <div className={`${styles.frame} terminal-frame aurora-shimmer`}>
      <BioAuroraDashboard
        {...previewDashboard}
        onSelectCatalyst={handleSelectCatalyst}
        onSelectPosition={handleSelectPosition}
        onRefreshNews={handleRefreshNews}
      />
    </div>
  )
}
