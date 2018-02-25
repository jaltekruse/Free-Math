import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { createStore } from 'redux';
import './index.css';
import { rootReducer } from './FreeMath';
import { render } from './DefaultHomepageActions';
import { autoSave } from './FreeMath.js';
import registerServiceWorker from './registerServiceWorker';

window.onload = function() {
    var location = window.location;
    if (location.hostname != "localhost" && location.protocol != 'https:')
    {
         location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
    }
	const Redux = window.Redux;
    window.KAS = window.KAS;
    // TODO - remove use of window global var
    window.store = createStore(rootReducer);
    window.store.subscribe(render);
    window.store.subscribe(autoSave);
	render();
};
registerServiceWorker();
