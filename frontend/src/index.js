import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import App from './AppRouter';

createRoot(document.getElementById('root')).render(
<Router>
    <App />
</Router>
);
