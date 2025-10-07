import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@deaxu/terminal-ui/styles'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
