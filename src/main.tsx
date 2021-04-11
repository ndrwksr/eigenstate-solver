import React from 'react';
import ReactDOM from 'react-dom';
import './react/index.css';
import App from './react/App';

ReactDOM.render(React.createElement(React.StrictMode, null,
    React.createElement(App, null)), document.getElementById('root')
);
