import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { rootReducer } from './FreeMath';
import { render } from './DefaultHomepageActions';
import registerServiceWorker from './registerServiceWorker';

window.onload = function() {
	const Redux = window.Redux;
    var MathQuill = window.MathQuill;
    window.MathQuill = MathQuill.getInterface(1);
    window.KAS = window.KAS;
    window.store = Redux.createStore(rootReducer);
    window.store.subscribe(render);
	render();
};
registerServiceWorker();
