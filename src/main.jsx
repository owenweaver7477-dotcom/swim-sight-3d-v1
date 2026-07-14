import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from '@/lib/ThemeContext'
import App from '@/App.jsx'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  // Light/dark theme, persisted to localStorage("theme"), class-based on <html>
  // to match tailwind darkMode:"class". A pre-paint script in index.html applies
  // the saved theme first so there is no flash of the wrong theme.
  <ThemeProvider defaultTheme="light">
    <App />
  </ThemeProvider>
)
