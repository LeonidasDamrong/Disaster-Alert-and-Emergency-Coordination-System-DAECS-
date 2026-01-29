import React from 'react';
import ReactDOM from 'react-dom/client';
import SampleComponent from './components/SampleComponent';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Mount React components to elements with specific IDs
    const reactRoot = document.getElementById('react-root');

    if (reactRoot) {
        const root = ReactDOM.createRoot(reactRoot);
        root.render(<SampleComponent />);
    }
});
