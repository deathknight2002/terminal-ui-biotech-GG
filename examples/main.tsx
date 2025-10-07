import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@deaxu/terminal-ui/styles'
import App from './App.tsx'

// Start MSW in development
async function enableMocking() {
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  const { worker } = await import('../src/mocks/browser')

  // `worker.start()` returns a Promise that resolves
  // once the Service Worker is up and ready to intercept requests.
  return worker.start({
    onUnhandledRequest: 'warn'
  })
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
