// src/main.jsx
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import { registerSW } from './registerSW';

// Registrar Service Worker para PWA
registerSW();

// Anti Google Translate (previene error insertBefore)
document.documentElement.setAttribute('lang', 'es');
document.documentElement.setAttribute('translate', 'no');
document.getElementById('root')?.setAttribute('translate', 'no');

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <ThemeProvider>
      <App />
      <ToastContainer
        position="bottom-right"
        autoClose={3500}
        theme="dark"
        toastStyle={{
          background:  'var(--bg-card)',
          border:      '1px solid var(--border-light)',
          color:       'var(--text-primary)',
          fontFamily:  'Space Grotesk, sans-serif',
          fontSize:    '14px',
          boxShadow:   'var(--shadow-lg)',
        }}
      />
    </ThemeProvider>
  </ErrorBoundary>
);