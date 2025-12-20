import React, { useEffect, useState } from 'react'
import { EnhancedNewsFeed } from '../../../frontend-components/src/biotech/organisms/EnhancedNewsFeed/EnhancedNewsFeed'
import type { NewsItem } from '../../../src/types/biotech'
import './NewsPage.css'
import { previewNews } from '../data/previewData'

export function NewsPage() {
  const [articles, setArticles] = useState<NewsItem[]>(previewNews)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // keep preview data in sync with refresh animations
    setArticles(previewNews)
  }, [])

  const handleRefresh = async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 400))
    setArticles([...previewNews])
    setLoading(false)
  }

  return (
    <div className="news-page">
      <EnhancedNewsFeed
        news={articles}
        title="REDMILE BIOTECH NEWS INTELLIGENCE"
        onRefresh={handleRefresh}
        isRefreshing={loading}
        cornerBrackets
        showCategoryTabs
        portfolioWatchlist={['SRRK', 'CRNX', 'AVDX', 'TRVI', 'IONS', 'VRTX', 'BIIB']}
      />
    </div>
  )
}
