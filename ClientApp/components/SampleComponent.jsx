import React, { useState } from 'react';

const SampleComponent = () => {
    const [count, setCount] = useState(0);

    return (
        <div style={{
            padding: '20px',
            border: '2px solid #4CAF50',
            borderRadius: '8px',
            maxWidth: '400px',
            margin: '20px auto',
            textAlign: 'center',
            backgroundColor: '#f9f9f9'
        }}>
            <h2 style={{ color: '#333' }}>🎉 React Component Working!</h2>
            <p style={{ fontSize: '18px', color: '#666' }}>
                You clicked <strong>{count}</strong> times
            </p>
            <button
                onClick={() => setCount(count + 1)}
                style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginRight: '10px'
                }}
            >
                Increment
            </button>
            <button
                onClick={() => setCount(0)}
                style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                }}
            >
                Reset
            </button>
        </div>
    );
};

export default SampleComponent;
