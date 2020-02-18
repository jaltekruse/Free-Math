import React from 'react';
import ReactDOM from 'react-dom';
import createReactClass from 'create-react-class';
import { saveAs } from 'file-saver';
import './App.css';
import LogoHomeNav from './LogoHomeNav.js';
import { loadStudentDocsFromZip, makeBackwardsCompatible, convertToCurrentFormat } from './TeacherInteractiveGrader.js';
import Button from './Button.js';
import { LightButton, HtmlButton } from './Button.js';
import FreeMathModal from './Modal.js';
import { CloseButton } from './Button.js';

// Assignment properties
var ASSIGNMENT_NAME = 'ASSIGNMENT_NAME';
var PROBLEMS = 'PROBLEMS';
var PROBLEM_NUMBER = 'PROBLEM_NUMBER';

// editing assignmnt mode actions
var SET_ASSIGNMENT_NAME = 'SET_ASSIGNMENT_NAME';
// used to swap out the entire content of the document, for opening
// a document from a file
var SET_ASSIGNMENT_CONTENT = 'SET_ASSIGNMENT_CONTENT';
var UNDO_STACK = 'UNDO_STACK';
var REDO_STACK = 'REDO_STACK';

var SET_GOOGLE_CLASS_LIST = 'SET_GOOGLE_CLASS_LIST';
var GOOGLE_CLASS_LIST = 'GOOGLE_CLASS_LIST';
var GOOGLE_SELECTED_CLASS = 'GOOGLE_SELECTED_CLASS';
var GOOGLE_ASSIGNMENT_LIST = 'GOOGLE_ASSIGNMENT_LIST';
var GOOGLE_SELECTED_ASSIGNMENT = 'GOOGLE_SELECTED_ASSIGNMENT';
var GOOGLE_COURSEWORK_LIST = 'GOOGLE_COURSEWORK_LIST';
var GOOGLE_SELECTED_CLASS_NAME = 'GOOGLE_SELECTED_CLASS_NAME';
var GOOGLE_SELECTED_ASSIGNMENT_NAME = 'GOOGLE_SELECTED_ASSIGNMENT_NAME';

var GOOGLE_ID = 'GOOGLE_ID';
var SET_GOOGLE_ID = 'SET_GOOGLE_ID';
// state for google drive auto-save
// action
var SET_GOOGLE_DRIVE_STATE = 'GOOGLE_DRIVE_STATE';
// Property name and possible values
var GOOGLE_DRIVE_STATE = 'GOOGLE_DRIVE_STATE';
var SAVING = 'SAVING';
var ALL_SAVED = 'ALL_SAVED';
var DIRTY_WORKING_COPY = 'DIRTY_WORKING_COPY';

function saveAssignment() {
    var atLeastOneProblemNumberNotSet = false;
    window.store.getState()[PROBLEMS].forEach(function(problem, index, array) {
        if (problem[PROBLEM_NUMBER].trim() === "") {
            atLeastOneProblemNumberNotSet = true;
        }
    });
    if (atLeastOneProblemNumberNotSet) {
        if (! window.confirm("At least one problem is missing a problem number. "
                            + "These are needed for your teacher to grade your "
                            + "assignment effectively. It is reccomended you "
                            + "cancel the save and fill them in.")) {
            return;
        }
    }

    var blob =
        new Blob([
            JSON.stringify({
            PROBLEMS : removeUndoRedoHistory(
                        makeBackwardsCompatible(
                            window.store.getState()
                        )
                    )[PROBLEMS]
            })],
        {type: "text/plain;charset=utf-8"});
    saveAs(blob, window.store.getState()[ASSIGNMENT_NAME] + '.math');
}

function removeUndoRedoHistory(globalState) {
    globalState[PROBLEMS].forEach(function (problem) {
        problem[UNDO_STACK] = [];
        problem[REDO_STACK] = [];
    });
    return globalState;
}

function removeExtension(filename) {
    // remove preceding directory (for when filename comes out of the ZIP directory)
    // inside of character class slash is not a special character,
    // this is highlighted incorrectly in some editors, but the escaping this slash
    // fires the no-useless-escape es-lint rule
    filename = filename.replace(/[^/]*\//, "");
    // actually remove extension
    filename = filename.replace(/\.[^/.]+$/, "");
    return filename;
}

// TODO - consider giving legacy docs an ID upon opening, allows auto-save to work properly when
// opening older docs
export function openAssignment(serializedDoc, filename, discardDataWarning, driveFileId) {
    // this is now handled at a higher level, this is mostly triggered by onChange events of "file" input elements
    // if the user selects "cancel", I want them to be able to try re-opening again. If they pick the same file I
    // won't get on onChange event without resetting the value, and here I don't have a reference to the DOM element
    // to reset its value
    //if (discardDataWarning && !window.confirm("Discard your current work and open the selected document?")) {
    //    return;
    //}

    try {
        var newDoc = JSON.parse(serializedDoc);
        // compatibility for old files, need to convert the old proerty names as
        // well as add the LAST_SHOWN_STEP
        newDoc = convertToCurrentFormat(newDoc);
        window.store.dispatch({type : SET_ASSIGNMENT_CONTENT,
            PROBLEMS : newDoc[PROBLEMS], GOOGLE_ID: driveFileId,
            ASSIGNMENT_NAME : removeExtension(filename)});
    } catch (e) {
        console.log(e);
        alert("Error reading the file, Free Math can only read files with " +
              "a .math extension that it creates. If you saved this file " +
              "with Free Math please send it to developers@freemathapp.org " +
              "to allow us to debug the issue.");
    }
}

// read a file from the local disk, pass an onChange event from a "file" input type
// http://www.htmlgoodies.com/beyond/javascript/read-text-files-using-the-javascript-filereader.html
export function readSingleFile(evt, discardDataWarning) {
    //Retrieve the first (and only!) File from the FileList object
    var f = evt.target.files[0];

    if (f) {
        var r = new FileReader();
        r.onload = function(e) {
            var contents = e.target.result;
            openAssignment(contents, f.name, discardDataWarning);
        }
        r.readAsText(f);
    } else {
        alert("Failed to load file");
    }
}


function submitAssignment(submission, selectedClass, selectedAssignment, googleId) {
    window.modifyGoogeClassroomSubmission(
        selectedClass,
        selectedAssignment,
        submission.id, googleId,
        function(response) {
            console.log(response);
            // clear the class list to stop showing the modal
            window.store.dispatch({type : SET_GOOGLE_CLASS_LIST,
                GOOGLE_CLASS_LIST : undefined});
            alert('Successfully submitted to classroom.');
        },
        function(errorXhr) {
            if (errorXhr.status == 403) {
                alert('This assignment was not created using Free Math, ' +
                      'and google only allows 3rd party apps like Free Math ' +
                      'to edit assignments that they create.\n\n' +
                      'Your document has been saved in your Google Drive, you will ' +
                      'need to go to Google Classroom and attach the file to the ' +
                      'assignment yourself.');
            } else {
                alert('Save Failed.');
            }

            // in the case of error also close the modal
            // and make them select a different class/assignment
            window.store.dispatch({type : SET_GOOGLE_CLASS_LIST,
                GOOGLE_CLASS_LIST : undefined});
        }
    );
}

var GoogleClassroomSubmissionSelector = createReactClass({
    componentDidMount: function() {
    },
    listClasses: function() {
        window.listGoogeClassroomCourses(function(response) {
            if (response.courses.length == 1) {
                var classList = response;
                var classInfo = response.courses[0];
                window.listGoogeClassroomAssignments(classInfo.id,
                    function(response) {
                        window.store.dispatch(
                            { type : SET_GOOGLE_CLASS_LIST,
                              GOOGLE_CLASS_LIST :
                                classList,
                              GOOGLE_SELECTED_CLASS : classInfo.id,
                              GOOGLE_SELECTED_CLASS_NAME : classInfo.name,
                              GOOGLE_ASSIGNMENT_LIST : response
                            });
                    }
                );
            } else {
                window.store.dispatch({type : SET_GOOGLE_CLASS_LIST,
                    GOOGLE_CLASS_LIST : response});
            }
        });
    },
    render: function() {
        var rootState = this.props.value;
        var selectSubmissionCallback = this.props.selectSubmissionCallback;
        var selectAssignmentCallback = this.props.selectAssignmentCallback;

        const courseList = function() {
            return (<div>
                <div>Pick a class</div>
                {rootState[GOOGLE_CLASS_LIST].courses
                    .map(function(classInfo, index) {
                        return (
                            <Button text={classInfo.name}
                                onClick={function() {
                                    window.listGoogeClassroomAssignments(classInfo.id,
                                        function(response) {

                                        window.store.dispatch(
                                            { type : SET_GOOGLE_CLASS_LIST,
                                              GOOGLE_CLASS_LIST :
                                                rootState[GOOGLE_CLASS_LIST],
                                              GOOGLE_SELECTED_CLASS : classInfo.id,
                                              GOOGLE_SELECTED_CLASS_NAME : classInfo.name,
                                              GOOGLE_ASSIGNMENT_LIST : response
                                            });
                                    });
                                    // load docs for this class id
                                    // classInfo.id
                                }} />
                        )
                    })
                }
            </div>)
        };

        const listSubmissionsSubmitIfOnlyOne = function(assignment) {
            window.listGoogeClassroomSubmissions(
                rootState[GOOGLE_SELECTED_CLASS],
                assignment.id,
                function(response) {
                    console.log(response);
                    if (response.studentSubmissions.length == 1) {
                        var submission = response.studentSubmissions[0];
                        // close the modal by setting null class list, and also set "SELECTED_ASSIGNMENT"
                        // which is needed for next method call to save the submission
                        // TODO - make suer to show a spinner or somthing while waiting
                        // for the final request to save the assignment
                        window.store.dispatch(
                            { type : SET_GOOGLE_CLASS_LIST,
                              GOOGLE_CLASS_LIST :
                                null,
                              GOOGLE_SELECTED_CLASS :
                                rootState[GOOGLE_SELECTED_CLASS],
                              GOOGLE_ASSIGNMENT_LIST :
                                rootState[GOOGLE_ASSIGNMENT_LIST],
                              GOOGLE_SELECTED_ASSIGNMENT : assignment.id,
                              GOOGLE_SELECTED_ASSIGNMENT_NAME: assignment.title,
                              GOOGLE_COURSEWORK_LIST : response
                            });
                        selectSubmissionCallback(submission,
                                        rootState[GOOGLE_SELECTED_CLASS],
                                        assignment.id,
                                        rootState[GOOGLE_ID]);
                    } else {
                        window.store.dispatch(
                            { type : SET_GOOGLE_CLASS_LIST,
                              GOOGLE_CLASS_LIST :
                                rootState[GOOGLE_CLASS_LIST],
                              GOOGLE_SELECTED_CLASS :
                                rootState[GOOGLE_SELECTED_CLASS],
                              GOOGLE_ASSIGNMENT_LIST :
                                rootState[GOOGLE_ASSIGNMENT_LIST],
                              GOOGLE_SELECTED_ASSIGNMENT : assignment.id,
                              GOOGLE_SELECTED_ASSIGNMENT_NAME: assignment.title,
                              GOOGLE_COURSEWORK_LIST : response
                            });
                    }
            });
        }

        const assignmentList = function() {
            return (
                <div>
                    <div>Pick an assignment - {rootState[GOOGLE_SELECTED_CLASS_NAME]}</div>
                        {rootState[GOOGLE_ASSIGNMENT_LIST].courseWork
                            .map(function(assignment, index) {
                                return (
                                    <Button text={assignment.title}
                                        onClick={
                                            function() {
                                                if (selectAssignmentCallback) {
                                                    selectAssignmentCallback(assignment);
                                                } else {
                                                    listSubmissionsSubmitIfOnlyOne(assignment);
                                                }
                                            }
                                        }
                                    />)
                            })
                        }
                </div>
            )
        };

        const courseWorkList = function() {
            return (
                <div>
                    <div>Pick an submission - {rootState[GOOGLE_SELECTED_ASSIGNMENT_NAME]}</div>
                        {rootState[GOOGLE_COURSEWORK_LIST].studentSubmissions
                            .map(function(submission, index) {
                                return (
                                    <Button text={submission.creationTime}
                                        onClick={function() {
                                            // TODO - auto save doc to drive before doing this
                                            selectSubmissionCallback(submission,
                                                            rootState[GOOGLE_SELECTED_CLASS],
                                                            rootState[GOOGLE_SELECTED_ASSIGNMENT],
                                                            rootState[GOOGLE_ID]
                                            );
                                        }}
                                    />
                                );
                            })
                        }
                </div>
            );
        };
        return (
            <FreeMathModal
                showModal={rootState[GOOGLE_CLASS_LIST]}
                content={(
                    <div style={{"align-items": "center"}}>
                        <CloseButton type="submit" text="&#10005;" title="Close"
                                     onClick={
                                        function() {
                                            // this closes the modal
                                            window.store.dispatch(
                                                { type : SET_GOOGLE_CLASS_LIST,
                                                  GOOGLE_CLASS_LIST : undefined});
                                        }
                                     }
                        />
                        { (rootState[GOOGLE_CLASS_LIST] === undefined ||
                            rootState[GOOGLE_SELECTED_CLASS] !== undefined ||
                            rootState[GOOGLE_SELECTED_ASSIGNMENT] !== undefined) ? null :
                            courseList()
                        }
                        {(rootState[GOOGLE_SELECTED_CLASS] === undefined ||
                            rootState[GOOGLE_SELECTED_ASSIGNMENT] !== undefined)? null :
                            assignmentList()
                        }
                        {rootState[GOOGLE_SELECTED_ASSIGNMENT] === undefined ? null :
                           courseWorkList()
                        }
                    </div>)}
                />
        );
    }
});


var AssignmentEditorMenubar = createReactClass({
    componentDidMount: function() {
        // TODO - problem with onSuccessCallback when canceling and re-opening dialog to submit
        // might have been manifesting a different bug leaving out a callback in functions doing
        // the actual requests to google in index.html
        const saveCallback = function(onSuccessCallback = function() {}) {
            var assignment = JSON.stringify(
                        { PROBLEMS : makeBackwardsCompatible(
                                     this.props.value)[PROBLEMS]
                        }
            );
            assignment = new Blob([assignment], {type: 'application/json'});
            var googleId = this.props.value[GOOGLE_ID];
            if (googleId) {
                console.log("update in google drive:" + googleId);
                window.updateFileWithBinaryContent(
                    this.props.value[ASSIGNMENT_NAME] + '.math',
                    assignment,
                    googleId,
                    'application/json',
                    function() {
                        window.store.dispatch(
                            { type : SET_GOOGLE_DRIVE_STATE,
                                GOOGLE_DRIVE_STATE : ALL_SAVED});
                        onSuccessCallback();
                    }
                );
            } else {
                window.createFileWithBinaryContent(
                    this.props.value[ASSIGNMENT_NAME] + '.math',
                    assignment,
                    'application/json',
                    function(driveFileId) {
                        window.store.dispatch({type : SET_GOOGLE_ID,
                            GOOGLE_ID: driveFileId,
                        });
                        window.store.dispatch(
                            { type : SET_GOOGLE_DRIVE_STATE,
                                GOOGLE_DRIVE_STATE : ALL_SAVED});
                        onSuccessCallback();
                    }
                );
            }
        }.bind(this);
        const saveToDrive = ReactDOM.findDOMNode(this.refs.saveToDrive)
        window.gapi.auth2.getAuthInstance().attachClickHandler(saveToDrive, {},
            saveCallback, function(){/* TODO - on sign in error*/})

        const submitToClassroomCallback = function() {
            // save the file to Drive first
            saveCallback(function() {
                this.refs.submissionSelector.listClasses();
            }.bind(this));
        }.bind(this);

        const submitToClassroom = ReactDOM.findDOMNode(this.refs.submitToClassroom)
        window.gapi.auth2.getAuthInstance().attachClickHandler(submitToClassroom, {},
            submitToClassroomCallback, function(){/* TODO - on sign in error*/})
    },
    render: function() {
        const responseGoogle = (response) => {
            console.log(response);
        }
        var saveStateMsg = '';
        var googleId = this.props.value[GOOGLE_ID];
        if (googleId) {
            var state = this.props.value[GOOGLE_DRIVE_STATE];
            if (state === ALL_SAVED) saveStateMsg = "All changes saved in Drive";
            else if (state === SAVING) saveStateMsg = "Saving in Drive...";
        }
        var rootState = this.props.value;
        var selectSubmissionCallback = function(submission, selectedClass, selectedAssignment, googleId) {
            submitAssignment(submission,
                            selectedClass,
                            selectedAssignment,
                            googleId);
        }
        return (
            <div className="menuBar">
                <GoogleClassroomSubmissionSelector
                    value={this.props.value}
                    selectSubmissionCallback={selectSubmissionCallback}
                    ref="submissionSelector"/>
                <div style={{width:1024,marginLeft:"auto", marginRight:"auto"}} className="nav">
                    <LogoHomeNav /> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;

                    <div className="navBarElms" style={{float: "right", verticalAlign:"top", lineHeight : 1}}>
                        <span style={{margin : "0px 15px 0px 15px"}}>
                            {saveStateMsg}</span>
                        Filename &nbsp;&nbsp;
                        <input type="text" id="assignment-name-text" size="20"
                               name="assignment name"
                               value={rootState[ASSIGNMENT_NAME]}
                               onChange={
                                    function(evt) {
                                        window.store.dispatch(
                                            { type : SET_ASSIGNMENT_NAME,
                                              ASSIGNMENT_NAME : evt.target.value});
                            }}
                        />&nbsp;&nbsp;

                        <LightButton text="Save to Device" onClick={
                            function() { saveAssignment() }} /> &nbsp;&nbsp;&nbsp;

                        <HtmlButton
                            className="fm-button-light"
                            ref="saveToDrive"
                            title="Save to Google Drive"
                            onClick={function() {}}
                            content={(
                                    <div style={{display: "inline-block"}}>
                                        <div style={{float: "left", paddingTop: "4px"}}>Save to&nbsp;</div>
                                         <img style={{paddingTop: "2px"}}
                                                src="images/google_drive_small_logo.png"
                                                alt="google logo" />
                                    </div>
                            )} />&nbsp;&nbsp;&nbsp;
                        <HtmlButton
                            className="fm-button-light"
                            title="Submit assignment to Google Classroom"
                            onClick={function() {}}
                            ref="submitToClassroom"
                            content={(
                                    <div style={{display: "inline-block"}}>
                                        <div style={{float: "left", paddingTop: "4px"}}>
                                            Submit to Classroom&nbsp;
                                        </div>
                                         <img style={{paddingTop: "2px"}}
                                                src="images/google_classroom_small.png"
                                                alt="Google logo"
                                                height="16px"/>
                                    </div>
                            )} />
                    </div>
                </div>
            </div>
        );
  }
});

export {AssignmentEditorMenubar as default, removeExtension, GoogleClassroomSubmissionSelector };
