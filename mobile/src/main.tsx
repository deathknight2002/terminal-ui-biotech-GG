import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import '../../frontend-components/src/styles/global.css';
import '../../frontend-components/src/styles/glass-ui-enhanced.css';
import './styles/mobile-glass.css';
import './styles/ios-theme.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
