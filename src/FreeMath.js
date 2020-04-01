import React from 'react';
import createReactClass from 'create-react-class';
import GradingMenuBar from './GradingMenuBar.js';
import Assignment from './Assignment.js';
import TeacherInteractiveGrader from './TeacherInteractiveGrader.js';
import { GradesView, SimilarDocChecker } from './TeacherInteractiveGrader.js';
import AssignmentEditorMenubar from './AssignmentEditorMenubar.js';
import { ModalWhileGradingMenuBar } from './GradingMenuBar.js';
import DefaultHomepageActions from './DefaultHomepageActions.js';
import { assignmentReducer } from './Assignment.js';
import { gradingReducer } from './TeacherInteractiveGrader.js';
import { calculateGradingOverview, genStudentWorkZip } from './TeacherInteractiveGrader.js';
import { makeBackwardsCompatible, convertToCurrentFormat } from './TeacherInteractiveGrader.js';

// Application modes
var APP_MODE = 'APP_MODE';
var EDIT_ASSIGNMENT = 'EDIT_ASSIGNMENT';
var GRADE_ASSIGNMENTS = 'GRADE_ASSIGNMENTS';
var MODE_CHOOSER = 'MODE_CHOOSER';

var VIEW_GRADES = 'VIEW_GRADES';

var SIMILAR_DOC_CHECK = 'SIMILAR_DOC_CHECK';

// Actions to change modes
var GO_TO_MODE_CHOOSER = 'GO_TO_MODE_CHOOSER';
var SET_ASSIGNMENTS_TO_GRADE = 'SET_ASSIGNMENTS_TO_GRADE';
// action properties
var NEW_STATE = 'NEW_STATE';

// Assignment properties
var ASSIGNMENT_NAME = 'ASSIGNMENT_NAME';
var SET_ASSIGNMENT_NAME = 'SET_ASSIGNMENT_NAME';
var PROBLEMS = 'PROBLEMS';

var SET_GOOGLE_CLASS_LIST = 'SET_GOOGLE_CLASS_LIST';
var GOOGLE_CLASS_LIST = 'GOOGLE_CLASS_LIST';
var GOOGLE_ASSIGNMENT_LIST = 'GOOGLE_ASSIGNMENT_LIST';
var GOOGLE_SELECTED_CLASS = 'GOOGLE_SELECTED_CLASS';
var GOOGLE_SELECTED_ASSIGNMENT = 'GOOGLE_SELECTED_ASSIGNMENT';
var GOOGLE_COURSEWORK_LIST = 'GOOGLE_COURSEWORK_LIST';
var GOOGLE_SELECTED_CLASS_NAME = 'GOOGLE_SELECTED_CLASS_NAME';
var GOOGLE_SELECTED_ASSIGNMENT_NAME = 'GOOGLE_SELECTED_ASSIGNMENT_NAME';

var GOOGLE_ID = 'GOOGLE_ID';
var SET_GOOGLE_ID = 'SET_GOOGLE_ID';
// state for google drive auto-save
// action
var SET_GOOGLE_DRIVE_STATE = 'SET_GOOGLE_DRIVE_STATE';
// Property name and possible values
var GOOGLE_DRIVE_STATE = 'GOOGLE_DRIVE_STATE';
var SAVING = 'SAVING';
var ALL_SAVED = 'ALL_SAVED';
var DIRTY_WORKING_COPY = 'DIRTY_WORKING_COPY';
var SET_KEYBOARD_BUTTON_GROUP = 'SET_KEYBOARD_BUTTON_GROUP';
var BUTTON_GROUP = 'BUTTON_GROUP';

// used to swap out the entire content of the document, for opening
// a document from a file
var SET_ASSIGNMENT_CONTENT = 'SET_ASSIGNMENT_CONTENT';

// Problem properties
var PROBLEM_NUMBER = 'PROBLEM_NUMBER';
var STEPS = 'STEPS';
var CONTENT = "CONTENT";

// TODO - make this more efficient, or better yet replace uses with the spread operator
// to avoid unneeded object creation
function cloneDeep(oldObject) {
    return JSON.parse(JSON.stringify(oldObject));
}

function genID() {
    return Math.floor(Math.random() * 200000000);
}

function updateAutoSave(docType, docName, appState) {
    // TODO - validate this against actual saved data on startup
    // or possibly just re-derive it each time?
    var saveIndex = window.localStorage.getItem("save_index");
    if (saveIndex) {
        saveIndex = JSON.parse(saveIndex);
    }
    if (!saveIndex) {
        saveIndex = { "TEACHERS" : {}, "STUDENTS" : {}};
    }
    if (saveIndex[docType][appState["DOC_ID"]]) {
        var toDelete = saveIndex[docType][appState["DOC_ID"]];
    }
    var doc = JSON.stringify(appState);
    // TODO - escape underscores (with double underscore?) in doc name, to allow splitting cleanly
    // and presenting a better name to users
    // nvm will just store a key with spaces
    var dt = new Date();
    var dateString = datetimeToStr(dt);
    var saveKey = "auto save " + docType.toLowerCase() + " " + docName + " " + dateString;
    window.localStorage.setItem(saveKey, doc);
    saveIndex[docType][appState["DOC_ID"]] = saveKey;
    window.localStorage.setItem("save_index", JSON.stringify(saveIndex));
    if (toDelete !== undefined) {
        window.localStorage.removeItem(toDelete);
    }
}

function datetimeToStr(dt) {
    return dt.getFullYear() + "-" + (dt.getMonth() + 1) + "-" + dt.getDate() + " " + dt.getHours() +
                    ":" + ("00" + dt.getMinutes()).slice(-2) + ":" + ("00" + dt.getSeconds()).slice(-2) + "." + dt.getMilliseconds();
}

let currentSaveState;
let currentAppMode;
let currentlyGatheringUpdates;
let pendingSaves = 0;
function autoSave() {
    var appState = window.store.getState();
    let previousSaveState = currentSaveState;
    currentSaveState = appState[GOOGLE_DRIVE_STATE];

    let previousAppMode = currentAppMode;
    currentAppMode = appState[APP_MODE];

    if (appState[APP_MODE] === EDIT_ASSIGNMENT ||
        appState[APP_MODE] === GRADE_ASSIGNMENTS) {

        var problems = appState[PROBLEMS];
        var googleId = appState[GOOGLE_ID];
        if (googleId) {
            // filter out changes to state made in this function, saving state, pending save count
            // also filter out the initial load of the page when a doc opens
            if (previousSaveState !== currentSaveState
               || previousAppMode !== currentAppMode
                // TODO - possibly cleanup, while this prop is set a modal is shown for picking
                // where to submit an assignment to google classroom. This state might not belong in
                // redux store, but for now filter out any actions while this modal is active from
                // triggering auto-saves, otherwise it confusingly reports re-saving while the modal
                // is up, but users should be confident that the docs is saved in drive the whole time.
               || appState[GOOGLE_CLASS_LIST]) {
                // ignore the changes to the drive state, none of them should trigger auto-save events
                // especially as we kick off an update to this value within this function
                return;
            }
            // try to bundle together a few updates, wait 2 seconds before calling save. assume
            // some more keystrokes are incomming
            if (appState[GOOGLE_DRIVE_STATE] !== SAVING) {
                window.store.dispatch({type : SET_GOOGLE_DRIVE_STATE, GOOGLE_DRIVE_STATE : SAVING});
            }
            // assume users will type multiple characters rapidly, don't eagerly send a request
            // to google for each update, let them batch up for a bit first
            if (currentlyGatheringUpdates) {
                console.log("skipping new auto-save because currently gathering updates");
                return;
            }
            currentlyGatheringUpdates = true;
            pendingSaves++;
            // kick off an event that will save to google in N seconds, when the timeout
            // expires the current app state will be requested again to capture any
            // more upates that happened in the meantime, and thoe edits will have avoided
            // creating their own callback with a timeout based on the currentlyGatheringUpdates
            // flag and the check above
            const onSuccess = function() {
                pendingSaves--;
                console.log('pendingSaves');
                console.log(pendingSaves);
                if (pendingSaves === 0) {
                    window.store.dispatch(
                        {type : SET_GOOGLE_DRIVE_STATE, GOOGLE_DRIVE_STATE : ALL_SAVED});
                }
            }
            const onFailure = function() {
                pendingSaves--;
                console.log('pendingSaves');
                console.log(pendingSaves);
                if (pendingSaves === 0) {
                    window.store.dispatch(
                        {type : SET_GOOGLE_DRIVE_STATE, GOOGLE_DRIVE_STATE : DIRTY_WORKING_COPY});
                }
            }
            const saveStudentDoc = function() {
                var assignment = JSON.stringify(
                            { PROBLEMS : makeBackwardsCompatible(window.store.getState())[PROBLEMS]});
                assignment = new Blob([assignment], {type: 'application/json'});
                window.updateFileWithBinaryContent(
                    window.store.getState()[ASSIGNMENT_NAME] + '.math',
                    assignment, googleId, 'application/json',
                    onSuccess,
                    onFailure
                );
            }
            const saveTeacherGrading = function() {
                var zip = genStudentWorkZip(window.store.getState());
                var content = zip.generate({type: "blob"});
                window.updateFileWithBinaryContent (
                    window.store.getState()[ASSIGNMENT_NAME] + '.zip',
                    content, googleId, 'application/zip',
                    onSuccess,
                    onFailure
                );
            }
            const saveFunc = appState[APP_MODE] === EDIT_ASSIGNMENT ? saveStudentDoc : saveTeacherGrading;
            setTimeout(function() {
                currentlyGatheringUpdates = false;
                saveFunc();
                console.log("update in google drive:" + googleId);
            }, 2000);
        } else {
            if (appState[APP_MODE] === EDIT_ASSIGNMENT) {
                // check for the initial state, do not save this
                if (problems.length === 1) {
                    var steps = problems[0][STEPS];
                    if (steps.length === 1 && steps[0][CONTENT] === '') {
                        return;
                    }
                }
                console.log("auto saving problems");
                updateAutoSave("STUDENTS", appState["ASSIGNMENT_NAME"], appState);
            } else if (appState[APP_MODE] === GRADE_ASSIGNMENTS) {
                updateAutoSave("TEACHERS", appState["ASSIGNMENT_NAME"], appState);
            }
        }
    } else {
        // current other states include mode chooser homepage and view grades "modal"
        return;
    }
}

function rootReducer(state, action) {
    console.log(action);
    if (state === undefined || action.type === GO_TO_MODE_CHOOSER) {
        return {
            APP_MODE : MODE_CHOOSER
        };
    } else if (action.type === "NEW_ASSIGNMENT") {
        return {
            ...assignmentReducer(),
            "DOC_ID" : genID(),
            PENDING_SAVES : 0,
            GOOGLE_DRIVE_STATE : DIRTY_WORKING_COPY,
            BUTTON_GROUP : 'BASIC',
            APP_MODE : EDIT_ASSIGNMENT
        };
    } else if (action.type === "SET_GLOBAL_STATE") {
        return {...action.newState,
            BUTTON_GROUP : 'BASIC',
        };
    } else if (action.type === SET_ASSIGNMENT_NAME) {
        return { ...state,
                 ASSIGNMENT_NAME : action[ASSIGNMENT_NAME]
        }
    } else if (action.type === SET_GOOGLE_DRIVE_STATE) {
        return { ...state,
                 GOOGLE_DRIVE_STATE: action[GOOGLE_DRIVE_STATE]
        }
    } else if (action.type === SET_GOOGLE_ID) {
        return { ...state,
                 GOOGLE_ID: action[GOOGLE_ID]
        }
    } else if (action.type === SET_GOOGLE_CLASS_LIST) {
        const ret = { ...state,
                 GOOGLE_CLASS_LIST : action[GOOGLE_CLASS_LIST],
                 GOOGLE_SELECTED_CLASS : action[GOOGLE_SELECTED_CLASS],
                 GOOGLE_SELECTED_CLASS_NAME : action[GOOGLE_SELECTED_CLASS_NAME],
                 GOOGLE_ASSIGNMENT_LIST : action[GOOGLE_ASSIGNMENT_LIST],
                 GOOGLE_SELECTED_ASSIGNMENT : action[GOOGLE_SELECTED_ASSIGNMENT],
                 GOOGLE_SELECTED_ASSIGNMENT_NAME : action[GOOGLE_SELECTED_ASSIGNMENT_NAME],
                 GOOGLE_COURSEWORK_LIST : action[GOOGLE_COURSEWORK_LIST]
        };
        console.log(ret);
        return ret;
    } else if (action.type === SET_KEYBOARD_BUTTON_GROUP) {
        return { ...state,
                 BUTTON_GROUP : action[BUTTON_GROUP]
        }
    } else if (action.type === SET_ASSIGNMENTS_TO_GRADE) {
        // TODO - consolidate the defaults for filters
        // TODO - get similar assignment list from comparing the assignments
        // overview comes sorted by LARGEST_ANSWER_GROUPS_SIZE ascending (least number of common answers first)
        var overview = calculateGradingOverview(action[NEW_STATE][PROBLEMS]);
        return {
            ...action[NEW_STATE],
            "DOC_ID" : genID(),
            GOOGLE_ID: action.GOOGLE_ID,
            GOOGLE_DRIVE_STATE : ALL_SAVED,
            "GRADING_OVERVIEW" : overview,
            "CURRENT_PROBLEM" : overview[PROBLEMS][0][PROBLEM_NUMBER],
            APP_MODE : GRADE_ASSIGNMENTS,
        }
    } else if (action.type === SET_ASSIGNMENT_CONTENT) {
        // TODO - consider serializing DOC_ID and other future top level attributes into file
        // for now this prevents all opened docs from clobbering other suto-saves
        return {
            APP_MODE : EDIT_ASSIGNMENT,
            PROBLEMS : action.PROBLEMS,
            GOOGLE_ID: action.GOOGLE_ID,
            ASSIGNMENT_NAME : action[ASSIGNMENT_NAME],
            PENDING_SAVES : 0,
            GOOGLE_DRIVE_STATE : ALL_SAVED,
            CURRENT_PROBLEM : 0,
            "DOC_ID" : genID(),
            BUTTON_GROUP : 'BASIC'
        };
    } else if (state[APP_MODE] === EDIT_ASSIGNMENT) {
        return {
            ...assignmentReducer(state, action),
            APP_MODE : EDIT_ASSIGNMENT,
            PENDING_SAVES : 0
        }
    } else if (state[APP_MODE] === GRADE_ASSIGNMENTS
        || state[APP_MODE] === SIMILAR_DOC_CHECK
        || state[APP_MODE] === VIEW_GRADES) {
       return {
            ...gradingReducer(state, action)
        };
    } else {
        return state;
    }
}

var FreeMath = createReactClass({
  render: function() {
    // TODO - figure out how to best switch between teacher and
    // student mode rendering
    var wrapperDivStyle = {
        padding:"0px 30px 0px 30px",
        marginLeft:"auto",
        marginRight: "auto",
        height:"100%"
    };
    /*
    return (
            <div style={wrapperDivStyle}>
                <AssignmentEditorMenubar value={this.props.value}/>
                <div style={{display:"inline-block", width:"100%"}}>
                    <ExprComparisonTests />
                </div>
            </div>
            );
    */

    if (this.props.value[APP_MODE] === EDIT_ASSIGNMENT) {
        return (
            <div>
                <AssignmentEditorMenubar value={this.props.value}/>
                <Assignment value={this.props.value}/>
            </div>
        );
    } else if (this.props.value[APP_MODE] === GRADE_ASSIGNMENTS) {
        return (
            <div>
                <GradingMenuBar value={this.props.value} />
                <TeacherInteractiveGrader value={this.props.value}/>
            </div>
        );
    } else if (this.props.value[APP_MODE] === MODE_CHOOSER) {
        return (
            <DefaultHomepageActions value={this.props.value}/>
        );
    } else if (this.props.value[APP_MODE] === VIEW_GRADES) {
        return (
            <div style={{...wrapperDivStyle, width : "80%" }}>
                <ModalWhileGradingMenuBar />
                <GradesView value={this.props.value} />
            </div>
        );
    } else if (this.props.value[APP_MODE] === SIMILAR_DOC_CHECK) {
        return (
            <div style={{...wrapperDivStyle, width : "95%" }}>
                <ModalWhileGradingMenuBar />
                <div style={{margin:"60px 0px 30px 0px"}}>
                <SimilarDocChecker value={this.props.value} />
                </div>
            </div>
        );
    } else  {
        alert(this.props.value);
    }
  }
});

export {FreeMath as default, autoSave, rootReducer, cloneDeep, genID};
