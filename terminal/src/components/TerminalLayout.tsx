import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { AuroraTopBar } from '../../../frontend-components/src/terminal/organisms/AuroraTopBar/AuroraTopBar'
import { CommandPalette } from '../../../frontend-components/src/terminal/organisms/CommandPalette/CommandPalette'
import { AppLibrary } from '../../../frontend-components/src/terminal/organisms/AppLibrary/AppLibrary'
import { useToast } from '../../../frontend-components/src/terminal/molecules/Toast'
import { useCommandPalette } from '../hooks/useCommandPalette'
import { useAppLibrary } from '../hooks/useAppLibrary'
import { menuStructure } from '../config/menuStructure'
import { StatusBanner } from './StatusBanner'
import '../styles/glass-theme.css'

interface TerminalLayoutProps {
  children: React.ReactNode
}

export function TerminalLayout({ children }: TerminalLayoutProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const commandPalette = useCommandPalette()
  const appLibrary = useAppLibrary()
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toISOString())

  useEffect(() => {
    setLastRefreshed(new Date().toISOString())
  }, [])

  const handleNavigate = (path: string) => {
    navigate(path)
  }

  const handleRefresh = async (source: string): Promise<{ success: boolean; message: string }> => {
    await queryClient.invalidateQueries()
    const now = new Date().toISOString()
    setLastRefreshed(now)
    showToast({
      title: 'Preview refreshed',
      description: source === 'all' ? 'Reset all preview panes' : `Updated ${source}`,
      variant: 'success',
    })
    return { success: true, message: `Refreshed ${source}` }
  }

  return (
    <div className="terminal-layout">
      <StatusBanner message="Preview mode - static data" variant="warning" visible={true} onDismiss={() => null} />

      <AuroraTopBar
        menuItems={menuStructure}
        onNavigate={handleNavigate}
        onRefresh={handleRefresh}
        onOpenCommandPalette={commandPalette.open}
        onOpenAppLibrary={appLibrary.open}
        cornerBrackets
      />

      <main className="terminal-main">{children}</main>

      <footer className="terminal-footer">
        <div className="glass-container">
          <div className="footer-content">
            <span>🧬 BIOTECH TERMINAL</span>
            <span>STATUS: <span className="status-operational">PREVIEW</span></span>
            <span>LAST REFRESHED: {new Date(lastRefreshed).toLocaleString()}</span>
          </div>
        </div>
      </footer>

      <CommandPalette
        isOpen={commandPalette.isOpen}
        onClose={commandPalette.close}
        functionCodes={commandPalette.functionCodes}
        recentCommands={commandPalette.recentCommands}
        onExecute={commandPalette.execute}
      />

      <AppLibrary
        isOpen={appLibrary.isOpen}
        onClose={appLibrary.close}
        apps={appLibrary.apps}
        onLaunchApp={appLibrary.launchApp}
        onToggleFavorite={appLibrary.toggleFavorite}
      />
    </div>
  )
}
