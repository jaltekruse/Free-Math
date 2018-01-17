import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { createStore } from 'redux';
import './index.css';
import { rootReducer } from './FreeMath';
import { render } from './DefaultHomepageActions';
import { autoSave } from './FreeMath.js';
import registerServiceWorker from './registerServiceWorker';

window.onload = function() {
	const Redux = window.Redux;
    var MathQuill = window.MathQuill;
    window.MathQuill = MathQuill.getInterface(1);
    window.KAS = window.KAS;
    // TODO - remove use of window global var
    window.store = createStore(rootReducer);
    window.store.subscribe(render);
    window.store.subscribe(autoSave);
	render();
};
registerServiceWorker();
