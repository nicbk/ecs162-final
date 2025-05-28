import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './global_styles/_global.scss'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
