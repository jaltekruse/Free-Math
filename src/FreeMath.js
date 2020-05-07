import React from 'react';
import GradingMenuBar, { ModalWhileGradingMenuBar } from './GradingMenuBar.js';
import Assignment from './Assignment.js';
import { GradesView, SimilarDocChecker } from './TeacherInteractiveGrader.js';
import AssignmentEditorMenubar, { saveAssignment } from './AssignmentEditorMenubar.js';
import { openAssignment } from './AssignmentEditorMenubar.js';
import DefaultHomepageActions from './DefaultHomepageActions.js';
import { assignmentReducer } from './Assignment.js';
import { gradingReducer } from './TeacherInteractiveGrader.js';
import TeacherInteractiveGrader, { saveGradedStudentWorkToBlob, calculateGradingOverview,
                                   saveBackToClassroom } from './TeacherInteractiveGrader.js';
import { getStudentRecoveredDocs, getTeacherRecoveredDocs, sortByDate } from './DefaultHomepageActions.js';

// Application modes
var APP_MODE = 'APP_MODE';
var EDIT_ASSIGNMENT = 'EDIT_ASSIGNMENT';
var GRADE_ASSIGNMENTS = 'GRADE_ASSIGNMENTS';
var MODE_CHOOSER = 'MODE_CHOOSER';

var POSSIBLE_POINTS = "POSSIBLE_POINTS";
var SCORE = "SCORE";
var FEEDBACK = 'FEEDBACK';
var HIGHLIGHT = 'HIGHLIGHT';
var STEPS = 'STEPS';

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

var GOOGLE_ORIGIN_SERVICE = 'GOOGLE_ORIGIN_SERVICE';
var CLASSROOM = 'CLASSROOM';
// also can be DRIVE, although this is currently the default behavior
// if GOOGLE_ID is set and this property isn't

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

var CURRENT_PROBLEM = 'CURRENT_PROBLEM';

// Problem properties
var PROBLEM_NUMBER = 'PROBLEM_NUMBER';

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
                console.log("clean out oldest recovered docs");
                var sortedDocs = sortByDate(docList);
                // this diliberately leaves one item, this ensures even if the current save fails for some
                // reason, like it crosses the threshold of what can be saved, there will still be an older
                // version around in auto-save, this does cut in half what can be saved in recovered space
                // TODO -
                // If I added a lookup table with each browsers size, then I could know before saving if it
                // would fix and go all the way to the maximum, need to remember to take into account the save index
                var oldestDocs = sortedDocs.slice(Math.ceil(sortedDocs.length / 2.0));
                oldestDocs.forEach(function(recoveredDoc) {
                    // TODO - also should clean up the entry in the auto-save index, but currently that would require
                    // unzipping and reading the entry, would be good to add the doc ID to the local storage key
                    window.localStorage.removeItem(recoveredDoc);
                });
                return oldestDocs.length > 0;
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

function merge(student, teacher) {
    console.log("conflict found, merging");
    console.log("student");
    console.log(student);
    console.log("teacher");
    console.log(teacher);

    return {...student,
        PROBLEMS : student[PROBLEMS].map(function (problem, probIndex) {
            if (! teacher[PROBLEMS]) return problem;
            else if (! teacher[PROBLEMS][probIndex]) return problem;
            return {
                ...problem,
                FEEDBACK : teacher[PROBLEMS][probIndex][FEEDBACK],
                SCORE : teacher[PROBLEMS][probIndex][SCORE],
                POSSIBLE_POINTS : teacher[PROBLEMS][probIndex][POSSIBLE_POINTS],
                STEPS: problem[STEPS].map(function (step, stepIndex) {
                    let teacherSteps = teacher[PROBLEMS][probIndex][STEPS]
                    if (!teacherSteps) return step;
                    else if (!teacherSteps[stepIndex]) return step;
                    // TODO - is throwing an exception here the right thing to do, untill
                    // full collaborative editor merging logic is present, stop trying to
                    // merge if there are edits to steps still in student view, not just adding/removing
                    // highlights
                    // Current design, caller need to catch this exception and just keep the current
                    // local state, and alert the user of another user concurrently modifying the doc
                    // TODO - might need to detect if the other user was a teacher/student
                    // and behave a little differently, a teacher making highlights and the step
                    // no longer being there should probably be silently dropped on student side
                    // but the teacher should be notified of a refresh of new student state
                    // preferrable in a non-invasive bit of text local to the problem, not global alert
                    //    - this current code too aggressively considers this unmergable, kind of
                    //      targeted at two student mode editors concurrently
                    /*
                    else if (teacherStepsteacher[stepIndex][CONTENT] !== step[CONTENT]) {
                        throw "Umergable concurrent edit";
                    } else if (teacherStepsteacher[stepIndex][FORMAT] !== step[FORMAT]) {
                        throw "Umergable concurrent edit";
                    }
                    */
                    // TODO - should this check if the content of the step matches between
                    // teacher and student before applying the highlight?
                    return {
                        ...step,
                        HIGHLIGHT: teacherSteps[stepIndex][HIGHLIGHT]
                    }
                })
            };
        })
    };
}

function saveStudentDoc(googleId, onSuccess, onFailure) {
    window.downloadFileMetadata(googleId, function(fileMeta) {
        console.log(fileMeta);

        const saveToDrive = function(doc) {
            saveAssignment(doc, function(finalBlob) {
                window.updateFileWithBinaryContent(
                    window.store.getState()[ASSIGNMENT_NAME] + '.math',
                    finalBlob, googleId, 'application/zip',
                    onSuccess,
                    onFailure
                );
            });
        };

        if (fileMeta.lastModifyingUser.isAuthenticatedUser) {
            saveToDrive(window.store.getState());
        } else {
            // TODO - cleanup here and elesewhere fileId is same as googleId
            window.directDownloadFile(fileMeta, googleId, true,
                function(response, fileId) {
                    var conflictingDoc = openAssignment(response, "filename" /* TODO */);
                    // this does deliberately go grab the app state again, it is called
                    // after a 2 second timeout below, want to let edit build up for 2 seconds
                    // and then at the end of that we want to auto-save whatever is the current state
                    var currentLocalDoc = window.store.getState();

                    var mergedDoc;
                    var conflictUnresolvable = false;
                    try {
                        var mergedDoc = merge(currentLocalDoc, conflictingDoc);
                    } catch (e) {
                        conflictUnresolvable = true;
                        mergedDoc = currentLocalDoc;
                    }

                    window.store.dispatch({ type: 'SET_GLOBAL_STATE', newState : mergedDoc });
                    saveToDrive(mergedDoc);
                    if (conflictUnresolvable) {
                        alert(fileMeta.lastModifyingUser.displayName +
                            " has modified this file in Drive, whatever they changed will" +
                            " be overwritten with the document as you are currently viewing it");
                    }
                }
            );
        }
    });
}

let currentSaveState;
let currentAppMode;
let currentlyGatheringUpdates;
let currentProblemShowing;
let currentProblemCount;
let currentGoogleId;
let pendingSaves = 0;
function autoSave() {
    var appState = window.store.getState();
    let previousSaveState = currentSaveState;
    currentSaveState = appState[GOOGLE_DRIVE_STATE];

    let previousAppMode = currentAppMode;
    currentAppMode = appState[APP_MODE];


    let previousProblemShowing = currentProblemShowing;
    currentProblemShowing = appState[CURRENT_PROBLEM];

    let previousProblemCount = currentProblemCount;
    currentProblemCount = appState[PROBLEMS] ? appState[PROBLEMS].length : 0;

    let previousGoogleId = currentGoogleId;
    currentGoogleId = appState[GOOGLE_ID];

    if (appState[APP_MODE] === EDIT_ASSIGNMENT ||
        appState[APP_MODE] === GRADE_ASSIGNMENTS) {

        var googleId = appState[GOOGLE_ID];
        // filter out changes to state made in this function, saving state, pending save count
        // also filter out the initial load of the page when a doc opens
        // TODO - Jason - looks like I did previously have the pending save count in redux
        // I must have fixed some bug by taking it out, I think the situation has improved, but I
        // still want to clear this state when switching to a new doc, but I will also need to cancel
        // pending save actions as they will decrement it, so settting to 0 is not good
        if (previousSaveState !== currentSaveState
           || previousAppMode !== currentAppMode
           // don't trigger save if just changing the problme being viewed
           || (currentProblemShowing !== previousProblemShowing && currentProblemCount === previousProblemCount)
           // this if for the first call to create a newly saved Google Drive file, it will set the google ID
           // which doesn't need to trigger another save right away
           || currentGoogleId !== previousGoogleId
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
        // parameter is the document that was saved, doesn't currently have a use here
        const onSuccess = function(docSaved) {
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
        // TODO - possibly remove, this is for auto-saving a zip into drive
        // most people with drive will probably also have classroom
        const saveTeacherGrading = function() {
            if (appState[GOOGLE_ORIGIN_SERVICE] === CLASSROOM) {
                // this is deliberately using getState() instead of appState var, will be called
                // after a delay gathering other updates and other sae events will not be queued
                // during this time
                saveBackToClassroom(window.store.getState(), onSuccess, onFailure);
                // TODO - tie into network requests below "saveBackToClassroom"
                return;
            } else {
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
            if (googleId) saveFunc = function() {saveStudentDoc(googleId, onSuccess, onFailure)};
            else saveFunc = saveStudentToLocal;
        } else if (appState[APP_MODE] === GRADE_ASSIGNMENTS) {
            if (googleId) saveFunc = saveTeacherGrading;
            else saveFunc = saveTeacherToLocal;
        }
        setTimeout(function() {
            currentlyGatheringUpdates = false;
            saveFunc();
            console.log("update in google drive:" + googleId);
        }, 2000);
    } else {
        // current other states include mode chooser homepage and view grades "modal"
        return;
    }
}

function rootReducer(state, action) {
    if (state === undefined || action.type === GO_TO_MODE_CHOOSER) {
        return {
            APP_MODE : MODE_CHOOSER
        };
    } else if (action.type === "NEW_ASSIGNMENT") {
        return {
            ...assignmentReducer(),
            "DOC_ID" : genID(),
            GOOGLE_DRIVE_STATE : ALL_SAVED,
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
                 GOOGLE_ID: action[GOOGLE_ID],
                 GOOGLE_ORIGIN_SERVICE: action[GOOGLE_ORIGIN_SERVICE] ? action[GOOGLE_ORIGIN_SERVICE] : 'DRIVE' // DRIVE OR CLASSROOM
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
            "DOC_ID" : action["DOC_ID"] ? action["DOC_ID"] : genID() ,
            GOOGLE_ID: action[GOOGLE_ID],
            GOOGLE_DRIVE_STATE : ALL_SAVED,
            "GRADING_OVERVIEW" : overview,
            CURRENT_PROBLEM : overview[PROBLEMS][0][PROBLEM_NUMBER],
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
            GOOGLE_DRIVE_STATE : ALL_SAVED,
            CURRENT_PROBLEM : 0,
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
}

export {FreeMath as default, autoSave, rootReducer, cloneDeep, genID, base64ToBlob, getAutoSaveIndex, merge};
