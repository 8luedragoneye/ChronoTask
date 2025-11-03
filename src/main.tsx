import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import App from './App'

const rootElement = document.getElementById('app')

if (!rootElement) {
  throw new Error('Root element not found')
}

try {
  const root = createRoot(rootElement)
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  )
} catch (error) {
  console.error('Failed to render app:', error)
  rootElement.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif;">
      <h1 style="color: red;">Error Loading App</h1>
      <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
      <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">
        ${error instanceof Error ? error.stack : String(error)}
      </pre>
    </div>
  `
}

