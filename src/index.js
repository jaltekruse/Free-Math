import React from 'react';
import ReactDOM from 'react-dom';
import { createStore } from 'redux';
import './index.css';
import { rootReducer, ephemeralStateReducer } from './FreeMath';
import Problem, { problemReducer } from './Problem.js';
//import { render } from './DefaultHomepageActions';
import { autoSave, getCompositeState} from './FreeMath.js';
import { unregister } from './registerServiceWorker';

var MathQuill = window.MathQuill;

var BUTTON_GROUP = 'BUTTON_GROUP';

function render() {
    window.MathQuill = MathQuill.getInterface(1);
    const globalState = getCompositeState();
    ReactDOM.render(
        <div>
            <Problem buttonGroup={globalState[BUTTON_GROUP]} value={globalState} />
        </div>,
        document.getElementById('root')
    );
}

window.onload = function() {
    window.store = createStore(problemReducer);
    window.store.subscribe(render);
    window.ephemeralStore = createStore(ephemeralStateReducer);
    window.ephemeralStore.subscribe(render);
    render();
}


window.DISABLED_onload = function() {
    /* No longer necessary, figured out how to set up server level https
    var location = window.location;
    if (location.hostname !== "localhost" && location.protocol !== 'https:')
    {
         location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
         return;
    }
    */
    // TODO - remove use of window global var
    window.store = createStore(rootReducer);
    window.ephemeralStore = createStore(ephemeralStateReducer);
    window.ephemeralStore.subscribe(render);
    window.store.subscribe(render);
    window.store.subscribe(autoSave);
    render();
};
unregister();
