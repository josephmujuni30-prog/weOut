import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';

// FIX: use non-null assertion with a fallback error for better DX
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found. Check your index.html.');
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
