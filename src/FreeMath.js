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


var stillSaving = 0;
function updateAutoSave(docType, docName, appState) {
    // TODO - validate this against actual saved data on startup
    // or possibly just re-derive it each time?
    var saveIndex = getAutoSaveIndex();
    if (saveIndex[docType][appState["DOC_ID"]]) {
        var toDelete = saveIndex[docType][appState["DOC_ID"]];
    }

    if (stillSaving === 1) {
        return;
    }
    stillSaving = 1;

    const saveBlobToLocalStorage = function(finalBlob, docType) {
        blobToBase64(finalBlob, function(base64Data) {
            // TODO - escape underscores (with double underscore?) in doc name, to allow splitting cleanly
            // and presenting a better name to users
            // nvm will just store a key with spaces
            console.log(base64Data);
            var dt = new Date();
            var dateString = datetimeToStr(dt);
            var saveKey = "auto save " + docType.toLowerCase() + " " + docName + " " + dateString;
            try {
                window.localStorage.setItem(saveKey, base64Data);
                saveIndex[docType][appState["DOC_ID"]] = saveKey;
                window.localStorage.setItem("save_index", JSON.stringify(saveIndex));
            } catch (e) {
                console.log("Error updating auto-save, likely out of space");
                console.log(e);
                return;
            }

            if (toDelete !== undefined) {
                window.localStorage.removeItem(toDelete);
            }
            stillSaving--;
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

    var checkSaveFinished = function() {
        if (stillSaving === 0) {
            return;
        } else {
            // if not all of the images are loaded, check again in 50 milliseconds
            setTimeout(checkSaveFinished, 50);
        }
    }
    checkSaveFinished();
}

function datetimeToStr(dt) {
    return dt.getFullYear() + "-" + (dt.getMonth() + 1) + "-" + dt.getDate() + " " + dt.getHours() +
                    ":" + ("00" + dt.getMinutes()).slice(-2) + ":" + ("00" + dt.getSeconds()).slice(-2) + "." + dt.getMilliseconds();
}

function autoSave() {
    var appState = window.store.getState();

    if (appState[APP_MODE] === EDIT_ASSIGNMENT) {
        var problems = appState[PROBLEMS];
        // check for the initial state, do not save this
        if (problems.length === 1) {
            var steps = problems[0][STEPS];
            if (steps.length === 1 && steps[0][CONTENT] === '') {
                return;
            }
        }
        updateAutoSave("STUDENTS", appState["ASSIGNMENT_NAME"], appState);
    } else if (appState[APP_MODE] === GRADE_ASSIGNMENTS) {
        // TODO - add input for assignment name to teacher page
        updateAutoSave("TEACHERS", appState["ASSIGNMENT_NAME"], appState);
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
