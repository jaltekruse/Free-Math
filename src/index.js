import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { rootReducer } from './App';
import { render } from './App';
import registerServiceWorker from './registerServiceWorker';

window.onload = function() {
	const Redux = window.Redux;
    var MathQuill = window.MathQuill;
    window.MathQuill = MathQuill.getInterface(1);
    window.store = Redux.createStore(rootReducer);
    window.store.subscribe(render);
	render();
};
registerServiceWorker();
