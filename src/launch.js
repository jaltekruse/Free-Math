import { createStore } from 'redux';
import './index.css';
import { rootReducer, ephemeralStateReducer } from './FreeMath';
import { render, loadDemoGrading, checkAllSaved } from './DefaultHomepageActions';
import { autoSave } from './FreeMath.js';
import { unregister } from './registerServiceWorker';
import URLSearchParams from '@ungap/url-search-params'

var ADD_DEMO_PROBLEM = 'ADD_DEMO_PROBLEM';

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
    window.ephemeralStore = createStore(ephemeralStateReducer);
    window.ephemeralStore.subscribe(render);
    window.store.subscribe(render);
    window.store.subscribe(autoSave);
    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("mode") === "studentDemo") {
        window.location.hash = '';
        document.body.scrollTop = document.documentElement.scrollTop = 0;
        // turn on confirmation dialog upon navigation away
        window.onbeforeunload = checkAllSaved;
        window.ga('send', 'event', 'Demos', 'open', 'Student Demo');
        window.store.dispatch({type : "NEW_ASSIGNMENT"});
        window.store.dispatch({type : ADD_DEMO_PROBLEM});
    }
    else if (urlParams.get("mode") === "teacherDemo") {
        // turn on confirmation dialog upon navigation away
        window.onbeforeunload = checkAllSaved;
        window.ga('send', 'event', 'Demos', 'open', 'Teacher Demo');
        loadDemoGrading();
    }
    render();
};
unregister();
