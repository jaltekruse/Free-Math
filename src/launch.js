import { createStore } from 'redux';
import './index.css';
import { getCompositeState, getEphemeralState, rootReducer, ephemeralStateReducer } from './FreeMath';
import { render, loadDemoGrading, checkAllSaved } from './DefaultHomepageActions';
import { removeExtension, openAssignment} from './AssignmentEditorMenubar.js';
import { autoSave } from './FreeMath.js';
import { addImageToEnd, handleImg } from './Problem.js';
import { unregister } from './registerServiceWorker';
import URLSearchParams from '@ungap/url-search-params'
import { handleGoogleClientLoad, downloadFileMetadata, downloadFileNoFailureAlert,
         doOnceGoogleUserLoggedIn } from './GoogleApi.js';

var ADD_DEMO_PROBLEM = 'ADD_DEMO_PROBLEM';
var APP_MODE = 'APP_MODE';
var EDIT_ASSIGNMENT = 'EDIT_ASSIGNMENT';

var IMAGE_BEING_EDITED = 'IMAGE_BEING_EDITED';

var CURRENT_PROBLEM = 'CURRENT_PROBLEM';
var STEPS = 'STEPS';
var PROBLEMS = 'PROBLEMS';
var FORMAT = 'FORMAT';
var IMG = 'IMG';
var CONTENT = 'CONTENT';
var PROBLEM_INDEX = 'PROBLEM_INDEX';

// this action expects an index for which problem to change
var UNDO = 'UNDO';
// this action expects an index for which problem to change
var REDO = 'REDO';

// used to swap out the entire content of the document, for opening
// a document from a file
var SET_ASSIGNMENT_CONTENT = 'SET_ASSIGNMENT_CONTENT';
var SET_GOOGLE_ID = 'SET_GOOGLE_ID';

var MODIFY_GLOBAL_WAITING_MSG = 'MODIFY_GLOBAL_WAITING_MSG';

// key values from google launch app directly from the drive UI
var ids = 'ids';
var action = 'action';
var open = 'open';
var create = 'create';
var userId = 'userId';
var resourceKeys = 'resourceKeys';

// keys from google file details response
var title = 'title';
var capabilities = 'capabilities';
var canEdit = 'canEdit';

function imageEditorNotActive() {
    const rootState = getEphemeralState();
    const imageBeingEdited = rootState[IMAGE_BEING_EDITED];
    return (rootState[APP_MODE] === EDIT_ASSIGNMENT &&
            ( !imageBeingEdited ||
              (imageBeingEdited && imageBeingEdited[PROBLEM_INDEX] == null)
            ));
}

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
    window.handleGoogleClientLoad = handleGoogleClientLoad;
    window.handleClientLoad();

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
    } else if (urlParams.get("state")) {// open from the google Drive UI
        try {
            var state = JSON.parse(urlParams.get("state"));
            var files = state[ids];
            var driveFileId = files[0];
            const errorCallback = function(xhr) {
                window.ephemeralStore.dispatch(
                    { type : MODIFY_GLOBAL_WAITING_MSG,
                      GLOBAL_WAITING_MSG: false});
                if (xhr.status === 200) {
                    alert("Error reading file, make sure you are selecting a file created using Free Math");
                } else {
                    alert("Error downloading file from Google Drive.");
                }
            };
            const downloadDriveFile = function() {
                downloadFileNoFailureAlert(driveFileId, true,
                    function(content) {
                        // this is up here so that a failure to read the doc will not hit the error
                        // handler of the next request, which will display the successful drive
                        // file metadata reponse payload in an alert
                        //
                        // temp doc name is overwritten below after getting file metadata from drive
                        var newDoc = openAssignment(content, "temp doc name", driveFileId);
                        downloadFileMetadata(driveFileId,
                            function(response) {
                                window.ephemeralStore.dispatch(
                                    { type : MODIFY_GLOBAL_WAITING_MSG,
                                      GLOBAL_WAITING_MSG: false});
                                if (!response[capabilities][canEdit]) {
                                    // TODO - search assignments to find which one is associated with the file
                                    // to allow making the request for user to unsubmit right here, instead of
                                    // sending them back to the classroom interface
                                    //
                                    // Unfortunately this will require repeated network requests so for now I
                                    // will skip it
                                    alert('Cannot edit, you may need to unsubmit over in google ' +
                                          'classroom or ask for edit permissions from the owner.');
                                }
                                window.store.dispatch({type : SET_ASSIGNMENT_CONTENT,
                                    PROBLEMS : newDoc[PROBLEMS],
                                    ASSIGNMENT_NAME : removeExtension(response[title])});

                                window.ephemeralStore.dispatch(
                                    {type : SET_GOOGLE_ID, GOOGLE_ID: driveFileId});
                                // turn on confirmation dialog upon navigation away
                                window.onbeforeunload = checkAllSaved;
                                window.location.hash = '';
                                document.body.scrollTop = document.documentElement.scrollTop = 0;
                            },
                            errorCallback);
                    },
                    errorCallback
                );
            }

            window.ephemeralStore.dispatch(
                { type : MODIFY_GLOBAL_WAITING_MSG,
                  GLOBAL_WAITING_MSG: 'Downloading from drive...'});
            doOnceGoogleUserLoggedIn(10, downloadDriveFile);

        } catch(e) {
            console.log(e);
            alert("error loading file from drive");
        }
    }
    document.onpaste = function(event){
      var items = (event.clipboardData || event.originalEvent.clipboardData).items;
      //console.log(JSON.stringify(items)); // will give you the mime types
      for (var index in items) {
        var item = items[index];
        if (item.kind === 'file') {
            var blob = item.getAsFile();
            //console.log(event.target.result);
            const rootState = getCompositeState();
            if (rootState[APP_MODE] === EDIT_ASSIGNMENT && imageEditorNotActive()) {
                // see if there is a step of type image with empty contents
                // if so paste it there
                const currProbSteps = rootState[PROBLEMS][rootState[CURRENT_PROBLEM]][STEPS];
                const blankImageStep = currProbSteps.find(step => step[FORMAT] === IMG && !step[CONTENT]);
                if (blankImageStep) {
                    const stepIndex = currProbSteps.findIndex(step => step[FORMAT] === IMG && !step[CONTENT]);
                    handleImg(blob, stepIndex, rootState[CURRENT_PROBLEM], currProbSteps);
                } else {
                    addImageToEnd(blob,
                                  rootState[CURRENT_PROBLEM],
                                  rootState[PROBLEMS][rootState[CURRENT_PROBLEM]][STEPS]);
                }
            }
        }
      }
    }
    document.addEventListener('keydown', function(event) {
        const rootState = getCompositeState();
        if ((event.ctrlKey || event.metaKey) && event.key === 'z' && imageEditorNotActive()) {
            if (rootState[APP_MODE] === EDIT_ASSIGNMENT) {
                window.store.dispatch({ type : UNDO, PROBLEM_INDEX : rootState[CURRENT_PROBLEM]})
            }
        } else if ((event.ctrlKey || event.metaKey) && event.key === 'y' && imageEditorNotActive()) {
            if (rootState[APP_MODE] === EDIT_ASSIGNMENT) {
                window.store.dispatch({ type : REDO, PROBLEM_INDEX : rootState[CURRENT_PROBLEM]})
            }
        }
    });

    render();
};
unregister();
