import { createStore } from 'redux';
import './index.css';
import { rootReducer } from './FreeMath';
import { render } from './DefaultHomepageActions';
import { autoSave } from './FreeMath.js';
import { unregister } from './registerServiceWorker';

window.onload = function() {
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
    window.store.subscribe(render);
    window.store.subscribe(autoSave);
    render();
};
unregister();
