import React from 'react';
import ReactDOM from 'react-dom/client';
import SampleComponent from './components/SampleComponent';

// Mount React app
const rootElement = document.getElementById('react-root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <SampleComponent />
        </React.StrictMode>
    );
}
