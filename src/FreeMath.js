import React from 'react';
import GradingMenuBar from './GradingMenuBar.js';
import Assignment from './Assignment.js';
import TeacherInteractiveGrader, { saveGradedStudentWorkToBlob } from './TeacherInteractiveGrader.js';
import { GradesView, SimilarDocChecker } from './TeacherInteractiveGrader.js';
import AssignmentEditorMenubar, { saveAssignment } from './AssignmentEditorMenubar.js';
import { ModalWhileGradingMenuBar } from './GradingMenuBar.js';
import DefaultHomepageActions from './DefaultHomepageActions.js';
import { assignmentReducer } from './Assignment.js';
import { gradingReducer } from './TeacherInteractiveGrader.js';
import { calculateGradingOverview } from './TeacherInteractiveGrader.js';
import { getStudentRecoveredDocs, getTeacherRecoveredDocs, sortByDate } from './DefaultHomepageActions.js';

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

var SET_KEYBOARD_BUTTON_GROUP = 'SET_KEYBOARD_BUTTON_GROUP';
var BUTTON_GROUP = 'BUTTON_GROUP';

// used to swap out the entire content of the document, for opening
// a document from a file
var SET_ASSIGNMENT_CONTENT = 'SET_ASSIGNMENT_CONTENT';

// Problem properties
var PROBLEM_NUMBER = 'PROBLEM_NUMBER';
var STEPS = 'STEPS';
var CONTENT = "CONTENT";

// TODO - cleanup when merging full google integration
// this is used to detect some events that shouldn't prompt
// auto-saves, although the event doesn't fire anywhere on
// this branch, defining this heare allows keeping the same auto-save
// logic that is over on that branch
var GOOGLE_CLASS_LIST = 'GOOGLE_CLASS_LIST';

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

// TODO - make this more efficient, or better yet replace uses with the spread operator
// to avoid unneeded object creation
function cloneDeep(oldObject) {
    return JSON.parse(JSON.stringify(oldObject));
}

function genID() {
    return Math.floor(Math.random() * 200000000);
}

function base64ToBlob(b64Data, contentType='', sliceSize=512) {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, {type: contentType});
  return blob;
}

function blobToBase64(blob, callback) {
        var reader = new FileReader();
        reader.onloadend = function() {
            var base64data = reader.result;
            base64data = base64data.substr(base64data.indexOf(',')+1);
            callback(base64data);

        }
        reader.readAsDataURL(blob);
}

function getAutoSaveIndex() {
    var saveIndex = window.localStorage.getItem("save_index");
    if (saveIndex) {
        return JSON.parse(saveIndex);
    } else {
        return { "TEACHERS" : {}, "STUDENTS" : {}};
    }
}

function updateAutoSave(docType, docName, appState, onSuccess = function(){}, onFailure = function(){}) {
    // TODO - validate this against actual saved data on startup
    // or possibly just re-derive it each time?
    var saveIndex = getAutoSaveIndex();
    if (saveIndex[docType][appState["DOC_ID"]]) {
        var toDelete = saveIndex[docType][appState["DOC_ID"]];
    }

    const saveBlobToLocalStorage = function(finalBlob, docType) {
        blobToBase64(finalBlob, function(base64Data) {
            // TODO - escape underscores (with double underscore?) in doc name, to allow splitting cleanly
            // and presenting a better name to users
            // nvm will just store a key with spaces
            var dt = new Date();
            var dateString = datetimeToStr(dt);
            var saveKey = "auto save " + docType.toLowerCase() + " " + docName + " " + dateString;

            const cleanOldestDocs = function(docList) {
                var sortedDocs = sortByDate(docList);
                var oldestDocs = sortedDocs .slice(Math.ceil(sortedDocs.length / 2.0));
                oldestDocs.forEach(function(recoveredDoc) {
                    window.localStorage.removeItem(recoveredDoc);
                });
            }

            const attemptSave = function() {
                try {
                    window.localStorage.setItem(saveKey, base64Data);
                    saveIndex[docType][appState["DOC_ID"]] = saveKey;
                    window.localStorage.setItem("save_index", JSON.stringify(saveIndex));
                    return true;
                } catch (e) {
                    console.log(e);
                    //console.log("Error updating auto-save, likely out of space");
                    // getStudentRecoveredDocs
                    console.log("clean out oldest recovered docs");
                    var success;
                    if (cleanOldestDocs(getTeacherRecoveredDocs())) {
                        success = attemptSave();
                    }
                    if (success) {
                        return true;
                    } else if (cleanOldestDocs(getStudentRecoveredDocs())) {
                        return attemptSave();
                    } else {
                        return false;
                    }
                }
            }
            var saveSuccessful = attemptSave();
            if (!saveSuccessful) {
                onFailure();
                return;
            }

            if (toDelete !== undefined) {
                window.localStorage.removeItem(toDelete);
            }
            onSuccess();
         });
    };
    if (docType === 'STUDENTS') {
        saveAssignment(appState, function(finalBlob) {
            saveBlobToLocalStorage(finalBlob, docType);
        });
    } else if (docType === 'TEACHERS') {
        saveGradedStudentWorkToBlob(appState, function(finalBlob) {
            saveBlobToLocalStorage(finalBlob, docType);
        });
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
        // filter out changes to state made in this function, saving state, pending save count
        // also filter out the initial load of the page when a doc opens
        // TODO - Jason - looks like I did previously have the pending save count in redux
        // I must have fixed some bug by taking it out, I think the situation has improved, but I
        // still want to clear this state when switching to a new doc, but I will also need to cancel
        // pending save actions as they will decrement it, so settting to 0 is not good
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
        console.log("incremented pendingSave to ");
        console.log(pendingSaves);
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
            // this does deliberately go grab the app state again, it is called
            // after a 2 second timeout below, want to let edit build up for 2 seconds
            // and then at the end of that we want to auto-save whatever is the current state
            saveAssignment(window.store.getState(), function(finalBlob) {
                window.updateFileWithBinaryContent(
                    window.store.getState()[ASSIGNMENT_NAME] + '.math',
                    finalBlob, googleId, 'application/zip',
                    onSuccess,
                    onFailure
                );
            });
        }
        const saveTeacherGrading = function() {
            // this does deliberately go grab the app state again, it is called
            // after a 2 second timeout below, want to let edit build up for 2 seconds
            // and then at the end of that we want to auto-save whatever is the current state
            saveGradedStudentWorkToBlob(window.store.getState(), function(finalBlob) {
                window.updateFileWithBinaryContent (
                    window.store.getState()[ASSIGNMENT_NAME] + '.zip',
                    finalBlob, googleId, 'application/zip',
                    onSuccess,
                    onFailure
                );
            });
        }
        const saveStudentToLocal = function() {
            console.log("auto saving student to local");
            try {
                updateAutoSave("STUDENTS", window.store.getState()["ASSIGNMENT_NAME"], window.store.getState(),
                    onSuccess, onFailure);
            } catch (e) {
                console.log(e);
            }
        }
        const saveTeacherToLocal = function() {
            console.log("auto saving student to local");
            try {
                updateAutoSave("TEACHERS", window.store.getState()["ASSIGNMENT_NAME"], window.store.getState(),
                    onSuccess, onFailure);
            } catch (e) {
                console.log(e);
            }
        }
        var saveFunc;
        if (appState[APP_MODE] === EDIT_ASSIGNMENT) {
            if (googleId) saveFunc = saveStudentDoc;
            else saveFunc = saveStudentToLocal;
        } else if (appState[APP_MODE] === GRADE_ASSIGNMENTS) {
            if (googleId) saveFunc = saveTeacherGrading;
            else saveFunc = saveTeacherToLocal;
        }
        setTimeout(function() {
            currentlyGatheringUpdates = false;
            // check for the initial state, do not save this
            if (problems.length === 1) {
                var steps = problems[0][STEPS];
                if (steps.length === 1 && steps[0][CONTENT] === '') {
                    console.log("not auto-saving because empty doc");
                    pendingSaves--;
                    if (pendingSaves === 0) {
                        window.store.dispatch(
                            {type : SET_GOOGLE_DRIVE_STATE, GOOGLE_DRIVE_STATE : DIRTY_WORKING_COPY});
                    }
                    return;
                }
            }
            saveFunc();
            console.log("update in google drive:" + googleId);
        }, 2000);
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
            "DOC_ID" : action["DOC_ID"] ? action["DOC_ID"] : genID() ,
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
            CURRENT_PROBLEM : 0,
            ASSIGNMENT_NAME : action[ASSIGNMENT_NAME],
            "DOC_ID" : action["DOC_ID"] ? action["DOC_ID"] : genID() ,
            BUTTON_GROUP : 'BASIC'
        };
    } else if (state[APP_MODE] === EDIT_ASSIGNMENT) {
        return {
            ...assignmentReducer(state, action),
            APP_MODE : EDIT_ASSIGNMENT
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

class FreeMath extends React.Component {
    render() {
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
              <DefaultHomepageActions />
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
}

export {FreeMath as default, autoSave, rootReducer, cloneDeep, genID, base64ToBlob, getAutoSaveIndex };
