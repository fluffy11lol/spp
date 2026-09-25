import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ToastProvider } from './components/Toast';
import { RecipeProvider } from './context/RecipeContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <RecipeProvider>
        <App />
      </RecipeProvider>
    </ToastProvider>
  </React.StrictMode>
);
