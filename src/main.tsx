import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { I18nProvider } from './i18n/I18nContext'
import { ThemeProvider } from './theme/ThemeContext'
import { KomariDataProvider } from './hooks/useKomariData'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <KomariDataProvider>
          <App />
        </KomariDataProvider>
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>,
)
