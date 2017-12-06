import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

window.onload = function() {
    var MathQuill = window.MathQuill;
    MathQuill = MathQuill.getInterface(1);
    ReactDOM.render(<App />, document.getElementById('root'));
};
registerServiceWorker();
