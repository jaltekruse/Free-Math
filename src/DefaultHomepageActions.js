import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import './App.css';
import TeX from './TeX.js';
import LogoHomeNav from './LogoHomeNav.js';
import { assignmentReducer } from './Assignment.js';
import FreeMath, { getPersistentState, getEphemeralState, getCompositeState, getAutoSaveIndex, base64ToArrayBuffer} from './FreeMath.js';
import Button, { CloseButton, LightButton, HtmlButton } from './Button.js';
import FreeMathModal from './Modal.js';
import { removeExtension, readSingleFile, openAssignment, GoogleClassroomSubmissionSelector } from './AssignmentEditorMenubar.js';
import { aggregateStudentWork, studentSubmissionsZip, loadStudentDocsFromZip,
         calculateGrades, removeStudentsFromGradingView } from './TeacherInteractiveGrader.js';
import { downloadFileNoFailureAlert, openDriveFile, listGoogleClassroomCourses,
         listGoogleClassroomSubmissions, listClassroomStudents, createGoogeClassroomAssignment,
         listGoogleClassroomSubmissionsNoFailureAlert, doOnceGoogleAuthLoads, restCall } from './GoogleApi.js';

var SET_ASSIGNMENTS_TO_GRADE = 'SET_ASSIGNMENTS_TO_GRADE';
const SET_STUDENT_QUIZ = 'SET_STUDENT_QUIZ';
const SET_EDIT_QUIZ = 'SET_EDIT_QUIZ';
const JOIN_CODE = 'JOIN_CODE';
const SESSION_NAME = 'SESSION_NAME';
const SET_LIST_TEACHER_QUIZZES = 'SET_LIST_TEACHER_QUIZZES';
const TEACHER_QUIZZES = 'TEACHER_QUIZZES';
const URL = "http://localhost/";
var JSON_MIME = 'application/json';

var MathQuill = window.MathQuill;

var STEPS = 'STEPS';
var CONTENT = "CONTENT";
var ADD_DEMO_PROBLEM = 'ADD_DEMO_PROBLEM';

var GOOGLE_ID = 'GOOGLE_ID';
var SET_GOOGLE_ID = 'SET_GOOGLE_ID';
// state for google drive auto-save
// Property name and possible values, also can be DIRTY_WORKING_COPY, SAVING
var GOOGLE_DRIVE_STATE = 'GOOGLE_DRIVE_STATE';
var ALL_SAVED = 'ALL_SAVED';
var SET_GOOGLE_CLASS_LIST = 'SET_GOOGLE_CLASS_LIST';

var SET_SHOW_TUTORIAL = 'SET_SHOW_TUTORIAL';

var APP_MODE = 'APP_MODE';
var MODE_CHOOSER = 'MODE_CHOOSER';

var EDIT_ASSIGNMENT = 'EDIT_ASSIGNMENT';
var GRADE_ASSIGNMENTS = 'GRADE_ASSIGNMENTS';

var PROBLEMS = 'PROBLEMS';
// used to swap out the entire content of the document, for opening
// a document from a file
var SET_ASSIGNMENT_CONTENT = 'SET_ASSIGNMENT_CONTENT';

// when grading google classroom docs, show student name instead of filename
var STUDENT_NAME = 'STUDENT_NAME';
// needed to update the student grade while saving to classroom
var STUDENT_SUBMISSION_ID = 'STUDENT_SUBMISSION_ID';

var MODIFY_GLOBAL_WAITING_MSG = 'MODIFY_GLOBAL_WAITING_MSG';
var GLOBAL_WAITING_MSG = 'GLOBAL_WAITING_MSG';

var SHOW_GOOGLE_VIDEO = 'SHOW_GOOGLE_VIDEO';

function checkAllSaved() {
    const appState = getCompositeState();
    if (appState[APP_MODE] !== MODE_CHOOSER &&
        !(appState[GOOGLE_ID] && appState[GOOGLE_DRIVE_STATE] === ALL_SAVED)) {
        return true;
    } else {
        return null;
    }
}

function loadDemoGrading () {
    const closeSpinner = () => {
        window.ephemeralStore.dispatch(
            { type : MODIFY_GLOBAL_WAITING_MSG,
              GLOBAL_WAITING_MSG: false});
    };

    const openSpinner = () => {
        window.ephemeralStore.dispatch(
            { type : MODIFY_GLOBAL_WAITING_MSG,
              GLOBAL_WAITING_MSG: 'Loading demo grading assignments...'});
    };
    var xhr = new XMLHttpRequest();
    xhr.open('get', 'student_submission_demo_with_images.zip');
    xhr.overrideMimeType('text\/plain; charset=x-user-defined');
    openSpinner();
    xhr.onload = function() {
        if (this.readyState === 4) {
            if (this.status == 200) {
            try {
                console.log(this.response);
                loadStudentDocsFromZip(this.response, 'student_submission_demo',
                    function() {closeSpinner(); window.store.dispatch({type: SET_SHOW_TUTORIAL});},
                    function() {closeSpinner()},
                    false);
             } catch (e) {
                 console.log(e);
                 closeSpinner();
             }
             } else {
                 closeSpinner();
                 alert(this.responsetext);
             }
         } else {
             // ignore other events for request still in progress
         }
     };
     xhr.send();
};

function render() {
    window.MathQuill = MathQuill.getInterface(1);
    const globalState = getCompositeState();
    ReactDOM.render(
        <div>
            <FreeMathModal
                showModal={ typeof globalState[GLOBAL_WAITING_MSG] === 'string'
                            && globalState[GLOBAL_WAITING_MSG].trim() !== '' }
                content={(
                    <div style={{alignItems: "center"}}>
                        <img style={{
                            "display": "flex",
                            "marginLeft":"auto",
                            "marginRight": "auto"
                             }}
                             src="images/Ajax-loader.gif" alt="loading spinner" /><br />
                        {globalState[GLOBAL_WAITING_MSG]}
                    </div>)}
            />

            <FreeMath value={globalState} />
        </div>,
        document.getElementById('root')
    );
}

// assumes prefix of "auto save teacher/student" has been stripped off already
// as well as the seconds and milliseconds on the date/time
function splitNameAndDate(recoveredDocName) {
    var nameAndDate = recoveredDocName.match(/(.*) (\d\d\d\d-\d+-\d+ \d+:\d+)/);
    return nameAndDate;
}

function sortByDate(arrayOfAutoSaveDocNames) {
    return arrayOfAutoSaveDocNames.sort(function (a, b) {
        var dateA = a.match(/\d\d\d\d-\d+-\d+ \d+:\d+:\d\d\..*/);
        var dateB = b.match(/\d\d\d\d-\d+-\d+ \d+:\d+:\d\d\..*/);
        if (dateA && dateA.length === 1) {
            if (dateB && dateB.length === 1) {
                return moment(dateB[0]) - moment(dateA[0]);
            }
        }
        return 0;
    });
}

function sortCaseInsensitive(arrayOfStrings) {
    return arrayOfStrings.sort(function (a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
    });
}

function getTeacherRecoveredDocs() {
    var recoveredTeacherDocs = [];
    for (var key in localStorage){
        if (startsWith(key, "auto save teachers")) {
            recoveredTeacherDocs.push(key);
        }
    }
    return recoveredTeacherDocs;
}

function getStudentRecoveredDocs() {
    var recoveredStudentDocs = [];
    for (var key in localStorage){
        if (startsWith(key,"auto save students")) {
            recoveredStudentDocs.push(key);
        }
    }
    return recoveredStudentDocs;
}

function startsWith(str, maybePrefix) {
    //https://stackoverflow.com/a/4579228
    return str.lastIndexOf(maybePrefix, 0) === 0
}

function loadStudentWorkFromServer(username, join_code, quiz_name) {
    restCall(URL + "rest.php", 'post',
        JSON.stringify({verb: 'get_all_responses',
            username: username, quiz_join_code: join_code,
        }),
        JSON_MIME,
        (result) => {
            //console.log(result.responseText);
            var parsedJson = JSON.parse(result.responseText);
            if (parsedJson && parsedJson.length > 0) {
                var allProblems = parsedJson;
                // TODO - consolidate with teacher quiz editing maybe
                var allStudentDocs = {};
                const probCount = allProblems.length;
                var readInSoFar = 0;
                allProblems.forEach((questionAloneInDoc) => {
                    openAssignment(base64ToArrayBuffer(
                        questionAloneInDoc['question_content']),
                        '', (recovered) => {
                            var student_id = questionAloneInDoc['user_id'];
                            if (! questionAloneInDoc['user_id']) {
                                // skip entires with no user for now, these are the questions themselves
                                student_id = 'original_problem';
                            }
                            console.log(student_id);
                            console.log(allStudentDocs[student_id]);
                            var overallDoc;
                            if (! allStudentDocs[student_id]) {
                                overallDoc = assignmentReducer();
                                // clear out the defualt blank first problem
                                overallDoc[PROBLEMS] = [];
                                allStudentDocs[student_id] = overallDoc;
                            } else {
                                overallDoc = allStudentDocs[student_id];
                            }
                            overallDoc[PROBLEMS].push(recovered[PROBLEMS][0]);
                            readInSoFar++;
                            if (readInSoFar === probCount) {
                                var listOfDocs = [];
                                for (var student in allStudentDocs){
                                    if (allStudentDocs.hasOwnProperty(student)) {
                                        listOfDocs.push({STUDENT_FILE: student, ASSIGNMENT: allStudentDocs[student][PROBLEMS]});
                                    }
                                }

                                var aggregatedWork = aggregateStudentWork(listOfDocs);
                                console.log("opened docs");
                                //console.log(aggregatedWork);

                                // TODO - This probably isn't be needed anymore. The ephemeral state should still be in place
                                // from before this call, but defensively re-setting ti anyway. This was previously set as part
                                // of SET_ASSIGNMENTS_TO_GRADE, before the google id was moved the ephemeral state
                                //window.ephemeralStore.dispatch(
                                //    {type : SET_GOOGLE_ID, GOOGLE_ID: googleId});

                                window.store.dispatch(
                                    { type : SET_ASSIGNMENTS_TO_GRADE,
                                      NEW_STATE :
                                        {...aggregatedWork, ASSIGNMENT_NAME: quiz_name + " - " + join_code,
                                            JOIN_CODE: join_code
                                        }});
                                /*
                                window.store.dispatch({type : SET_ASSIGNMENT_CONTENT,
                                    ASSIGNMENT_NAME : '',
                                    DOC_ID: recovered['DOC_ID'], PROBLEMS : overallDoc[PROBLEMS]});
                                window.store.dispatch({type: SET_EDIT_QUIZ,
                                    JOIN_CODE: quiz.join_code, SESSION_NAME : quiz.quiz_name})
                                    */
                            }
                        });
                });
            } else {
                window.store.dispatch({type : "NEW_ASSIGNMENT"});
                window.store.dispatch({type: SET_EDIT_QUIZ,
                    JOIN_CODE: join_code, SESSION_NAME : quiz_name })
            }
        }, (err) => {
            console.log(err);
        }
    );
}

class UserActions extends React.Component {
    state = {
             showActionsMobile: false,
             teacherRecoveredSorting: "DATE",
             studentRecoveredSorting: "DATE"
         };

    componentDidMount() {

        const attachClickHandlers = function() {
            // componentDidMount is called after all the child components have been mounted,
            // but before any parent components have been mounted.
            // https://stackoverflow.com/questions/49887433/dom-isnt-ready-in-time-after-componentdidmount-in-react
            // put a small delay to hopefully let the parent mount, also putting a setTimeout at all will free up
            // the main thread to allow a repaint

            setTimeout(function() {

                // this view also shows while the demo teacher assignments are downloading, and those can finish downloading before
                // this event fires
                if (getCompositeState()[APP_MODE] !== MODE_CHOOSER) return;

                const justAskForScopesButton = ReactDOM.findDOMNode(this.refs.justAskForScopes)
                window.gapi.auth2.getAuthInstance().attachClickHandler(justAskForScopesButton, {},
                    function() {
                        alert('Successfully added the new Drive integration');
                    },
                    function(error){
                        //alert("Error contacting google services\n\n" + JSON.stringify(error, undefined, 2));
                        if (error.error && error.error === "popup_closed_by_user") {
                            alert("If the sign-in popup window just closed itself quickly your browser may have 3rd party cookies disabled, " +
                                  "you need to enable them to use the google integration.\n\n" +
                                  "On Chrome, look for an eye with a line through it in the address bar.\n\n" +
                                  "While Free Math doesn't have ads, some ad blockers also have this behavior and " +
                                  "may need to be disabled.");
                        }
                        console.log(JSON.stringify(error, undefined, 2));
                        window.ga('send', 'exception', { 'exDescription' : 'google login failure: ' + JSON.stringify(error, undefined, 2)} );
                    });

                const studentOpenButton = ReactDOM.findDOMNode(this.refs.studentDriveOpen)
                window.gapi.auth2.getAuthInstance().attachClickHandler(studentOpenButton, {},
                    function() {
                        window.ga('send', 'event', 'Actions', 'edit', 'Open Assignment from Drive.');
                        openDriveFile(true, false, null, function(docs) {
                            let name = docs[0].name;
                            let driveFileId = docs[0].id;
                            downloadFileNoFailureAlert(driveFileId, true, function(content) {
                                openAssignment(content, name, function(newDoc) {
                                    window.store.dispatch({type : SET_ASSIGNMENT_CONTENT,
                                        PROBLEMS : newDoc[PROBLEMS],
                                        ASSIGNMENT_NAME : removeExtension(name)});

                                    window.ephemeralStore.dispatch(
                                        {type : SET_GOOGLE_ID, GOOGLE_ID: driveFileId});
                                    // turn on confirmation dialog upon navigation away
                                    window.onbeforeunload = checkAllSaved;
                                    window.location.hash = '';
                                    document.body.scrollTop = document.documentElement.scrollTop = 0;
                                }, driveFileId);
                            },
                            function(xhr) {
                                if (xhr.status === 200) {
                                    alert("Error reading file, make sure you are selecting a file created using Free Math");
                                } else {
                                    alert("Error downloading file from Google Drive.");
                                }
                            } // failure callback
                            );
                        });
                    },
                    function(error){
                        //alert("Error contacting google services\n\n" + JSON.stringify(error, undefined, 2));
                        if (error.error && error.error === "popup_closed_by_user") {
                            alert("If the sign-in popup window just closed itself quickly your browser may have 3rd party cookies disabled, " +
                                  "you need to enable them to use the google integration.\n\n" +
                                  "On Chrome, look for an eye with a line through it in the address bar.\n\n" +
                                  "While Free Math doesn't have ads, some ad blockers also have this behavior and " +
                                  "may need to be disabled.");
                        }
                        console.log(JSON.stringify(error, undefined, 2));
                        window.ga('send', 'exception', { 'exDescription' : 'google login failure: ' + JSON.stringify(error, undefined, 2)} );
                    });

                /* Disabled for now, this is confusing to have alongside the Google Classroom support
                 * might be useful in the future to give people with other LMSes, but also a google
                 * account a way to more easily back up grading sessions in the cloud
                const teacherOpenButton = ReactDOM.findDOMNode(this.refs.teacherDriveOpen)
                window.gapi.auth2.getAuthInstance().attachClickHandler(teacherOpenButton, {},
                    function() {
                        openDriveFile(true, false, null, function(docs) {
                            console.log(docs);
                            let name = docs[0].name;
                            let driveFileId = docs[0].id;
                            window.onbeforeunload = checkAllSaved;
                            window.location.hash = '';
                            document.body.scrollTop = document.documentElement.scrollTop = 0;
                            // TODO - also show this while downloading file
                            this.openSpinner();
                            setTimeout(function() {
                                downloadFile(driveFileId, true, function(content) {
                                    loadStudentDocsFromZip(content, name,
                                        function() {this.closeSpinner();}.bind(this),
                                        function() {this.closeSpinner();}.bind(this),
                                        driveFileId);
                                }.bind(this),
                                function() { this.closeSpinner() }.bind(this) // failure callback
                                );
                            }.bind(this), 50);
                        }.bind(this));
                    }.bind(this), function(e){
                        alert("error signing in to google");
                        console.log(e);
                    });
                    */

                const createClassroomAssignment = ReactDOM.findDOMNode(this.refs.createClassroomAssignment)
                window.gapi.auth2.getAuthInstance().attachClickHandler(createClassroomAssignment, {},
                    function() {
                        window.ga('send', 'event', 'Actions', 'edit', 'Create Classroom Assignment.');
                        listGoogleClassroomCourses(function(response) {
                            this.setState({GOOGLE_CLASS_LIST : response});
                            // TODO - make this safe when no classes
                            if (response && response.courses && response.courses.length > 0) {
                                this.setState({courseId: response.courses[0].id});
                            }

                            this.createAssignment();
                        }.bind(this));
                    }.bind(this),
                    function(error){
                        //alert("Error contacting google services\n\n" + JSON.stringify(error, undefined, 2));
                        if (error.error && error.error === "popup_closed_by_user") {
                            alert("If the sign-in popup window just closed itself quickly your browser may have 3rd party cookies disabled, " +
                                  "you need to enable them to use the google integration.\n\n" +
                                  "On Chrome, look for an eye with a line through it in the address bar.\n\n" +
                                  "While Free Math doesn't have ads, some ad blockers also have this behavior and " +
                                  "may need to be disabled.");
                        }
                        console.log(JSON.stringify(error, undefined, 2));
                        window.ga('send', 'exception', { 'exDescription' : 'google login failure: ' + JSON.stringify(error, undefined, 2)} );
                    });

                const gradeClassroomAssignmentCallback = function() {
                    this.refs.submissionSelectorTeacher.listClasses();
                }.bind(this);

                const gradeClassroomAssignment = ReactDOM.findDOMNode(this.refs.gradeClassroomAssignment)
                window.gapi.auth2.getAuthInstance().attachClickHandler(gradeClassroomAssignment, {},
                    gradeClassroomAssignmentCallback,
                    function(error){
                        //alert("Error contacting google services\n\n" + JSON.stringify(error, undefined, 2));
                        if (error.error && error.error === "popup_closed_by_user") {
                            alert("If the sign-in popup window just closed itself quickly your browser may have 3rd party cookies disabled, " +
                                  "you need to enable them to use the google integration.\n\n" +
                                  "On Chrome, look for an eye with a line through it in the address bar.\n\n" +
                                  "While Free Math doesn't have ads, some ad blockers also have this behavior and " +
                                  "may need to be disabled.");
                        }
                        console.log(JSON.stringify(error, undefined, 2));
                        window.ga('send', 'exception', { 'exDescription' : 'google login failure: ' + JSON.stringify(error, undefined, 2)} );
                    });
            }.bind(this), 250);
        }.bind(this);

        doOnceGoogleAuthLoads(10, attachClickHandlers);
    }

    closeSpinner = () => {
        window.ephemeralStore.dispatch(
            { type : MODIFY_GLOBAL_WAITING_MSG,
              GLOBAL_WAITING_MSG: false});
    };

    openSpinner = () => {
        window.ephemeralStore.dispatch(
            { type : MODIFY_GLOBAL_WAITING_MSG,
              GLOBAL_WAITING_MSG: 'Opening, analyzing and grouping student work...'});
    };

    createAssignment = () => {
        this.setState({ 'CREATING_GOOGLE_CLASSROOM_ASSINGMENT' : true });
    };

    teacherLogin = () => {
        this.setState({ 'LOGIN_OVERLAY' : true });
    };

    render() {
        var openAssignments = function(evt){
            // turn on confirmation dialog upon navigation away
            window.onbeforeunload = checkAllSaved;
            this.openSpinner();

            window.location.hash = '';
            window.ga('send', 'event', 'Actions', 'open', 'Grade Assignments');
            document.body.scrollTop = document.documentElement.scrollTop = 0;
            studentSubmissionsZip(evt,
                function() { this.closeSpinner() }.bind(this),
                function() { this.closeSpinner() }.bind(this)
            );
        }.bind(this);

        var openDriveAssignments = function(assignment) {
            console.log(assignment);

            listGoogleClassroomSubmissions(assignment.courseId, assignment.id,
                function(resp) {

                    let isSubmitted = function(submission) {
                        return ( typeof submission.assignmentSubmission.attachments !== 'undefined'
                                  // this would filter to just submitted docs, preventing conflicts between
                                  // teacher and student edits, unfortunately students can unsubmit whenever
                                  // and this would eliminate a teachers ability to see in-progress work
                                  // so for now trying to work out concurrent editing by teacher and student
                                  // Update - merging updates from students and teachers is partly working
                                  // but there are some known issues around truely concurrent requests, so
                                  // defering this for now and will remove unsubmitted from view when they are detected
                                  && submission.state !== 'CREATED'
                                  && submission.state !== 'RECLAIMED_BY_STUDENT');
                    };

                    var atLeastOneSubmitted = false;
                    resp.studentSubmissions.forEach(function(submission) {
                        // loop through and keep setting atLestOneSubmitted to the current value
                        // until it becomes true, no early exit, but it works
                        if (! atLeastOneSubmitted ) {
                            atLeastOneSubmitted = isSubmitted(submission);
                        }
                    });
                    if (! atLeastOneSubmitted) {
                        alert("No students have submitted their assignments for review yet.");
                        return;
                    }
                    console.log(resp)
                    alert("The google drive folder with your students submissions will show next.\n\n" +
                           "To give Free Math access to modify the files with your grades and feedback " +
                           "highlight all of the files and click 'Select'.\n\n" +
                           "Please note that draft and submitted files will show in the list, " +
                           "you will only be able to grade submitted files.\n\n" +
                           "To quickly highlight all of the files, the keyboard shortcut Ctrl-A " +
                           "(Windows and Chrombooks) or Command-A (Mac) can be used.");
                    openDriveFile(true, true, assignment.assignment.studentWorkFolder.id, function(docs) {
                        // TODO - message to users if they didn't select all necessary files
                        let selectedDocs = {};
                        docs.forEach(function(doc) {
                            selectedDocs[doc.id] = true;
                        });

                        this.openSpinner();
                        listClassroomStudents(assignment.courseId, function(studentList) {
                            let students = {};
                            studentList.students.forEach(function(student) {
                                console.log(student);
                                students[student.userId] = student.profile.name.fullName;
                            });
                            console.log(students);
                            var allStudentWork = [];
                            let pendingOpens = 0;
                            let downloadQueue = [];
                            let studentWithMultipleSubmissions = [];
                            let errorsDownloading = [];
                            resp.studentSubmissions.forEach(function(submission) {
                            /* NOTE - temp code to read all selected files from folder regardless of what is submitted in classrom
                             *        Good for stress testing without making a bunch of students accounts
                            docs.forEach(function(doc) {
                                var submission = {
                                    assignmentSubmission: { attachments: [ {driveFile: {id : doc.id}}] }
                                };
                                */
                                // TODO - warn teacher about multiple submissions
                                // TODO- sort on modification date or attachment date, pick latest
                                // TODO- handle other types of attahement (just report error)
                                // should probably rename - this is just checking if an attachment is
                                // present, google classroom does have a separate status of "submitted/turned in"
                                // that is no longer being used to filter students docs out of the view
                                var submitted = isSubmitted(submission);

                                let attachments = null;
                                // TODO - inform teacher
                                if (!submitted) {
                                    console.log("skipping - not submited");
                                    console.log(submission);
                                    return;
                                } else {
                                    attachments  = submission.assignmentSubmission.attachments;
                                    if (attachments.length === 0) {
                                        console.log("skipping - no attachments");
                                        return;
                                    } else {
                                        // if no drive file is listed with the submission, or it wasn't selected in the picker
                                        if (! attachments[0].driveFile || ! selectedDocs[attachments[0].driveFile.id]) {
                                            console.log(attachments);
                                            console.log(selectedDocs);
                                            console.log("skipping - no drive file, or not selected in picker");
                                            return;
                                        }
                                        if (attachments.length > 1) {
                                            studentWithMultipleSubmissions.push(students[submission.userId]);
                                        }
                                    }
                                }
                                console.log(submission);
                                var attachment = attachments[0].driveFile;
                                // TODO - pull in student name, don't just show filename
                                pendingOpens++;
                                console.log(attachment.id);
                                downloadQueue.push({ GOOGLE_ID: attachment.id, STUDENT_NAME: students[submission.userId],
                                                     STUDENT_SUBMISSION_ID: submission.id });
                            });

                            const checkAllDownloaded = function() {
                                if (pendingOpens === 0) {

                                    if (errorsDownloading.length > 0) {
                                        alert("One or more student docs failed to download, " +
                                              "or they submitted a file that wasn't a Free Math document.\n\n" +
                                              errorsDownloading.join()
                                        );
                                    }
                                    if (studentWithMultipleSubmissions.length > 0) {
                                        alert("One or more students had multiple attachments, this isn't recommended.\n\n"
                                        + studentWithMultipleSubmissions.join());
                                    }

                                    console.log(allStudentWork);
                                    if (allStudentWork.length === 0) {
                                        alert("No student work is currently accessible, you need to make sure to select " +
                                              "all of the files from the Google Drive folder. If that doesn't work then none of " +
                                              "your students have submitted a Free Math file yet, or we are having trouble " +
                                              "downloading from Google Drive right now.");
                                        this.closeSpinner();
                                        return;
                                    }

                                    // check student submissions every 30 seconds, if they have unsubmitted
                                    // remove them from view
                                    const checkForUnsubmits = function() {
                                        try {
                                            let state = getPersistentState();
                                            var grades = calculateGrades(state[PROBLEMS]);
                                            console.log('checking for unsubmits');
                                            listGoogleClassroomSubmissionsNoFailureAlert(assignment.courseId, assignment.id,
                                                function(resp) {
                                                    // array of obj { fileId: '134', name: 'Bob Doe'}{
                                                    let toRemove = [];
                                                    resp.studentSubmissions.forEach(function(submission) {
                                                        let isSubmitted = function(submission) {
                                                            return ( typeof submission.assignmentSubmission.attachments !== 'undefined'
                                                                      && submission.state !== 'CREATED'
                                                                      && submission.state !== 'RECLAIMED_BY_STUDENT');
                                                        };
                                                        console.log('check still submitted');
                                                        console.log(submission.id);
                                                        console.log(grades);
                                                        if ( typeof grades['GOOGLE_STUDENT_GRADES'][submission.id] !== 'undefined'
                                                             && !isSubmitted(submission)) {
                                                            console.log('removing student from view');
                                                            toRemove.push({fileId : submission.assignmentSubmission.attachments[0].driveFile.id,
                                                                           name : students[submission.userId]
                                                            });
                                                        }
                                                    });
                                                    if (toRemove.length > 0) {
                                                        let allUnsubmittedStudents = toRemove.map(unsubmitted => unsubmitted.name);
                                                        alert("One or more students unsubmitted, removing them from the grading page to prevent " +
                                                               "your updates from overwriting their edits:\n\n" + allUnsubmittedStudents.join());
                                                        let allUnsubmittedFileIds = toRemove.map(unsubmitted => unsubmitted.fileId);
                                                        removeStudentsFromGradingView(allUnsubmittedFileIds, state);
                                                    }
                                            });
                                        } catch (e) {
                                            console.log('Failure while checking for unsubmits');
                                            console.log(e);
                                        }
                                    }
                                    // Note for handling nav away from grading, this is cleared in LogoNavHome
                                    window.checkUnsumitsInterval = setInterval(checkForUnsubmits, 1000 * 120);

                                    var aggregatedWork = aggregateStudentWork(allStudentWork);
                                    this.closeSpinner();

                                    // turn on the gaurd for navigating away
                                    window.onbeforeunload = checkAllSaved;
                                    // This might not be needed anymore? This placeholder was added before
                                    // the google id was moved the ephemeral state
                                    window.ephemeralStore.dispatch(
                                        {type : SET_GOOGLE_ID, GOOGLE_ID: 'PLACEHOLDER'});
                                    window.store.dispatch(
                                        { type : 'SET_ASSIGNMENTS_TO_GRADE',
                                          NEW_STATE :
                                            {...aggregatedWork,
                                                GOOGLE_ORIGIN_SERVICE : 'CLASSROOM',
                                                COURSE_ID: assignment.courseId,
                                                COURSEWORK_ID: assignment.id,
                                                // maybe put assignment name here?
                                                // or refactor auto save to look for GOOGLE_ORIGIN_SERVICE?
                                                ASSIGNMENT_NAME: removeExtension(assignment.title)}
                                        });
                                    return true;
                                } else {
                                    return false;
                                }
                            }.bind(this);

                            const downloadFile = function(fileId, studentName, submissionId) {
                                downloadFileNoFailureAlert(fileId, true,
                                    function(response) {
                                        openAssignment(response, "filename", function(newDoc) {
                                            allStudentWork.push(
                                                { STUDENT_FILE : fileId, STUDENT_NAME: studentName,
                                                  STUDENT_SUBMISSION_ID: submissionId,
                                                  ASSIGNMENT : newDoc[PROBLEMS]});
                                            pendingOpens--;
                                            if (downloadQueue.length > 0) {
                                                let next = downloadQueue.pop();
                                                downloadFile(next[GOOGLE_ID], next[STUDENT_NAME], next[STUDENT_SUBMISSION_ID]);
                                            } else {
                                                checkAllDownloaded();
                                            }
                                        }, /* TODO */);
                                    },
                                    function() { // failure callback
                                        errorsDownloading.push(studentName);
                                        pendingOpens--;
                                        if (downloadQueue.length > 0) {
                                            let next = downloadQueue.pop();
                                            downloadFile(next[GOOGLE_ID], next[STUDENT_NAME], next[STUDENT_SUBMISSION_ID]);
                                        } else {
                                            checkAllDownloaded();
                                        }
                                    }
                                );
                            };
                            if (downloadQueue.length === 0) {
                                alert("No selected students have submitted their assignments for review yet.");
                                this.closeSpinner();
                                return;
                            }
                            let CONCURRENT_REQUESTS = 5;
                            let i;
                            for (i = 0; i < CONCURRENT_REQUESTS && downloadQueue.length > 0; i++) {
                                let next = downloadQueue.pop();
                                downloadFile(next[GOOGLE_ID], next[STUDENT_NAME], next[STUDENT_SUBMISSION_ID]);
                            }
                        }.bind(this), function(){this.closeSpinner()}.bind(this));

                }.bind(this), function() {this.closeSpinner()}.bind(this));
            }.bind(this));
        }.bind(this);

        var recoverAutoSaveCallback = function(autoSaveFullName, filename, appMode) {
            // turn on confirmation dialog upon navigation away
            window.onbeforeunload = checkAllSaved;
            window.location.hash = '';

            var recovered;
            const loadLegacyFormat = function() {
                try {
                    document.body.scrollTop = document.documentElement.scrollTop = 0;
                    recovered = JSON.parse(window.localStorage.getItem(autoSaveFullName));
                    window.store.dispatch({"type" : "SET_GLOBAL_STATE", "newState" : recovered });
                } catch (e2) {
                    alert("Error reading recovery document");
                    return;
                }
            }
            document.body.scrollTop = document.documentElement.scrollTop = 0;
            if (appMode === EDIT_ASSIGNMENT) {
                window.ga('send', 'event', 'Actions', 'open', 'Recovered Assignment');
                try {
                    openAssignment(base64ToArrayBuffer(
                        window.localStorage.getItem(autoSaveFullName)),
                        filename, function(recovered) {
                            window.store.dispatch({type : SET_ASSIGNMENT_CONTENT,
                                ASSIGNMENT_NAME : filename,
                                DOC_ID: recovered['DOC_ID'], PROBLEMS : recovered[PROBLEMS]});
                        });
                } catch (e) {
                    loadLegacyFormat();
                    return;
                }
            } else if (appMode === GRADE_ASSIGNMENTS) {
                // TODO - NEED a convert to current format here!!
                window.ga('send', 'event', 'Actions', 'open', 'Recovered Grading');

                // look up DOC_ID in save_index, this value isn't written anywhere into
                // the teacher save file like it is for students, but it is needed
                // to prevent opening from an auto-save spawning a new auto-save, rather
                // than updating the old one in place
                const saveIndex = getAutoSaveIndex();

                var matchingDocId = undefined;
                for (var docId in saveIndex["TEACHERS"]) {
                    if ( saveIndex["TEACHERS"].hasOwnProperty(docId)
                            && autoSaveFullName === saveIndex["TEACHERS"][docId]) {
                        matchingDocId = docId;
                        break;
                    }
                }

                try {
                    loadStudentDocsFromZip(
                        base64ToArrayBuffer(window.localStorage.getItem(autoSaveFullName)),
                        filename, function() {/* success */}, function() {
                            // loading failed, try the old format
                            loadLegacyFormat();
                        },
                        matchingDocId, false);
                } catch (e) {
                    loadLegacyFormat();
                }
            }
        };
        var deleteAutoSaveCallback = function(docName) {
            if (!window.confirm("Are you sure you want to delete this recovered document?")) {
                return;
            }
            window.localStorage.removeItem(docName);
            // TODO - fix this hack, should not explicitly call render,
            // this should be fixed while addressing TODO below about
            // component directly accessing localStorage
            render();
        };

        var deleteAllTeacherAutoSavesCallback = function(docName) {
            if (!window.confirm("Are you sure you want to delete all recovered grading sessions?")) {
                return;
            }

            for (var key in localStorage){
                if (startsWith(key, "auto save teachers")) {
                    window.localStorage.removeItem(key);
                }
            }

            const saveIndex = getAutoSaveIndex();
            saveIndex["TEACHERS"] = {};
            window.localStorage.setItem("save_index", JSON.stringify(saveIndex));
            // TODO - fix this hack, should not explicitly call render,
            // this should be fixed while addressing TODO below about
            // component directly accessing localStorage
            render();
        };

        var deleteAllStudentAutoSavesCallback = function(docName) {
            if (!window.confirm("Are you sure you want to delete all recovered assignments?")) {
                return;
            }

            for (var key in localStorage){
                if (startsWith(key, "auto save students")) {
                    window.localStorage.removeItem(key);
                }
            }
            const saveIndex = getAutoSaveIndex();
            saveIndex["STUDENTS"] = {};
            window.localStorage.setItem("save_index", JSON.stringify(saveIndex));
            // TODO - fix this hack, should not explicitly call render,
            // this should be fixed while addressing TODO below about
            // component directly accessing localStorage
            render();
        };

        // TODO - this is ugly, a component shouldn't access localStorage,
        // this should be read in at app startup stored in the redux state
        // tree and then kept in sync with what is actually stored through
        // actions use subscribers
        //https://stackoverflow.com/questions/35305661/where-to-write-to-localstorage-in-a-redux-app
        var recoveredStudentDocs = getStudentRecoveredDocs();
        var recoveredTeacherDocs = getTeacherRecoveredDocs();

        // sort by date, TODO - also allow switch to sort by name
        if (this.state.studentRecoveredSorting === "DATE") {
            recoveredStudentDocs = sortByDate(recoveredStudentDocs);
        } else {
            recoveredStudentDocs = sortCaseInsensitive(recoveredStudentDocs);
        }
        if (this.state.teacherRecoveredSorting === "DATE") {
            recoveredTeacherDocs = sortByDate(recoveredTeacherDocs);
        } else {
            recoveredTeacherDocs = sortCaseInsensitive(recoveredTeacherDocs);
        }

        var teacher_quizzes = this.props.value[TEACHER_QUIZZES] ? this.props.value[TEACHER_QUIZZES] : [];

        var username = window.localStorage.getItem('username');
        var reload_quizzes = () => {
            var username = window.localStorage.getItem('username');
            restCall(URL + "rest.php", 'post', JSON.stringify({verb: 'list_quizzes', username: this.state.username}), JSON_MIME,
                (result) => {
                    window.ephemeralStore.dispatch({ type: SET_LIST_TEACHER_QUIZZES, TEACHER_QUIZZES : JSON.parse(result.responseText)});
                }, (err) => {
                    console.log(err);
                }
            );
        };

        var openQuizContent = (allProblems, join_code, quiz_name) => {
            var overallDoc = assignmentReducer();
            // clear out the defualt blank first problem
            overallDoc[PROBLEMS] = [];
            const probCount = allProblems.length;
            var readInSoFar = 0;
            allProblems.forEach((questionAloneInDoc) => {
                openAssignment(base64ToArrayBuffer(
                    questionAloneInDoc['question_content']),
                    '', function(recovered) {
                        overallDoc[PROBLEMS].push(recovered[PROBLEMS][0]);
                        readInSoFar++;
                        if (readInSoFar === probCount) {
                            window.store.dispatch({type : SET_ASSIGNMENT_CONTENT,
                                ASSIGNMENT_NAME : '',
                                DOC_ID: recovered['DOC_ID'], PROBLEMS : overallDoc[PROBLEMS]});
                        }
                    });
            });
        };

        var divStyle = {
            border:"1px solid #cfcfcf",
            boxShadow: "0 5px 3px -3px #cfcfcf"
        };
        console.log("state on homepage");
        console.log(this.props.value);
        return (
            <div className="homepage-user-actions">
            <GoogleClassroomSubmissionSelector
                value={this.props.value}
                selectAssignmentCallback={function(assignment) {
                    // this closes the modal
                    window.ephemeralStore.dispatch(
                        { type : SET_GOOGLE_CLASS_LIST,
                          GOOGLE_CLASS_LIST : undefined});
                    console.log(assignment);
                    if ( ! assignment.assignment ) {
                        alert("There are no student submissions yet, or you do not have permissions to grade this assignment.");
                        return;
                    }
                    openDriveAssignments(assignment);
                }}
                ref="submissionSelectorTeacher"/>
            <FreeMathModal
                showModal={this.state['LOGIN_OVERLAY']}
                content={(
                    <div style={{alignItems: "center"}}>
                    <div><b>Teacher Login</b></div>
                    <br />
                            Username &nbsp;&nbsp;
                            <input type="text" style={{width:"150px"}}
                               value={this.state.username}
                               onChange={function(evt) {
                                        this.setState({username: evt.target.value});
                               }.bind(this)}/>
                            <br />
                            <br />
                            Password &nbsp;&nbsp;
                            <input type="password"  style={{fontFamily: "sans-serif", fontSize: "20px", width:"158px" }}
                               value={this.state.password}
                               onChange={(evt) => {
                                        this.setState({password: evt.target.value});
                               }}
                               onSubmit={(e) => {
                                    e.oreventDefault();
                                    window.localStorage.setItem("username", this.state.username);
                                    //window.localStorage.removeItem(docName);
                                    //base64ToArrayBuffer(window.localStorage.getItem(autoSaveFullName)),
                               }}/><br />
                            <Button text="Login"
                                onClick={ () => {
                                    // login
                                    window.localStorage.setItem("username", this.state.username);
                                    this.setState({ 'LOGIN_OVERLAY' : false });
                                }} />
                    </div>
                )}
            />
            <FreeMathModal
                showModal={this.state['CREATING_GOOGLE_CLASSROOM_ASSINGMENT']}
                content={(
                    <div style={{alignItems: "center"}}>
                    <CloseButton type="submit" text="&#10005;" title="Close"
                                 onClick={ function() {
                                        // this closes the modal
                                        this.setState({ 'CREATING_GOOGLE_CLASSROOM_ASSINGMENT' : false});
                                    }.bind(this)}
                    />
                    <div><b>Create Assignment</b></div>
                    <br />
                    {this.state['GOOGLE_CLASS_LIST'] === undefined
                            || this.state['GOOGLE_CLASS_LIST'].courses === undefined
                            ? (
                                <div className="answer-partially-correct">
                                  This Google account is not an instructor of any Classroom classes.
                                </div>
                              )
                            :
                        (
                            <div>
                            Class &nbsp;&nbsp;
                            <select style={{maxWidth: "500px", textOverflow: "ellipsis"}}
                                onChange={
                                function(event) {
                                    this.setState({courseId: event.target.value});
                                }.bind(this)}
                            >
                                {this.state['GOOGLE_CLASS_LIST'].courses
                                    .map(function(classInfo, index) {
                                        return (
                                            <option value={classInfo.id}>
                                            {classInfo.name +
                                             " \u00A0  Section: "
                                             + (classInfo.section === undefined ? "None" : classInfo.section) +
                                             " \u00A0 Room: "
                                             + (classInfo.room === undefined ? "None" : classInfo.room)}
                                            </option>)
                                    })
                                }
                            </select>
                            </div>
                        )
                    }
                    {/* TODO - required field validation */}
                    {/* TODO - add due date*/}
                    <br />
                    Title * &nbsp;<input type="text"
                       value={this.state.assignmentName}
                       onChange={function(evt) {
                                this.setState({assignmentName: evt.target.value});
                       }.bind(this)}/><br />
                    <br />
                    Description<br />
                    <textarea
                       value={this.state.assignmentDescription}
                       cols="60" rows="8"
                       onChange={function(evt) {
                                this.setState({assignmentDescription: evt.target.value});
                       }.bind(this)}/><br />
                    <Button type="submit" text="Create"
                        disabled={this.state['GOOGLE_CLASS_LIST'] === undefined
                                    || this.state['GOOGLE_CLASS_LIST'].courses === undefined}
                        onClick={ function() {
                            createGoogeClassroomAssignment(
                                this.state.courseId, this.state.assignmentName,
                                this.state.assignmentDescription,
                                function(response) {
                                    console.log(response);
                                    this.setState({ 'CREATING_GOOGLE_CLASSROOM_ASSINGMENT' : false});
                                    alert("Successfully created draft asignment, " +
                                        "use Google Classroom to set a due date, attach " +
                                        "any needed files, and publish it.");
                                }.bind(this)
                            );
                        }.bind(this)}
                    /><br />
                    <small>* denotes a required field</small>
                    </div>
                )}
            />
            <FreeMathModal
                showModal={this.state['JOIN_QUIZ_OVERLAY']}
                content={(
                    <div style={{alignItems: "center"}}>
                    <div><b>Join a Live Session</b></div>
                    <br />
                            Join Code &nbsp;&nbsp;
                            <input type="text" style={{width:"150px"}}
                               value={this.state.join_code}
                               onChange={function(evt) {
                                        this.setState({join_code: evt.target.value});
                               }.bind(this)}/>
                            <br />
                            <br />
                            Your Name &nbsp;&nbsp;
                            <input type="text" style={{width:"150px"}}
                               value={this.state.name}
                               onChange={function(evt) {
                                        this.setState({name: evt.target.value});
                               }.bind(this)}/>
                            <br />
                            <br />
                        <Button text="Join"
                            onClick={ () => {
                                // login
                                window.localStorage.setItem("username", this.state.name);
                                restCall(URL + "rest.php", 'post',
                                    JSON.stringify({verb: 'get_quiz_content',
                                        username: this.state.name, quiz_join_code: this.state.join_code,
                                    }),
                                    JSON_MIME,
                                    (result) => {
                                        console.log(result.responseText);
                                        var parsedJson = JSON.parse(result.responseText);
                                        if (parsedJson && parsedJson.length > 0) {
                                            var allProblems = parsedJson;
                                            // TODO - consolidate with teacher quiz editing maybe
                                            var overallDoc = assignmentReducer();
                                            // clear out the defualt blank first problem
                                            overallDoc[PROBLEMS] = [];
                                            const probCount = allProblems.length;
                                            var readInSoFar = 0;
                                            allProblems.forEach((questionAloneInDoc) => {
                                                openAssignment(base64ToArrayBuffer(
                                                    questionAloneInDoc['question_content']),
                                                    '', (recovered) => {
                                                        overallDoc[PROBLEMS].push(recovered[PROBLEMS][0]);
                                                        readInSoFar++;
                                                        if (readInSoFar === probCount) {
                                                            window.store.dispatch({type: SET_STUDENT_QUIZ,
                                                                PROBLEMS : overallDoc[PROBLEMS],
                                                                ASSIGNMENT_NAME : '', DOC_ID: recovered['DOC_ID'],
                                                                JOIN_CODE: this.state.join_code, SESSION_NAME : "" })
                                                        }
                                                    });
                                            });
                                        } else {
                                            alert("Not a valid join code");
                                        }
                                    }, (err) => {
                                        console.log(err);
                                    }
                                );
                            }} />
                    </div>
                )}
            />
            <div style={{display:"inline-block", width:"100%"}}>
            <div className="homepage-center-mobile">
                <div className="homepage-actions-container" style={{...divStyle, textAlign: "left"}}>
                    <h3>Students</h3>
                        <Button text="Join Live Session" onClick={
                            () => {
                                this.setState({ 'JOIN_QUIZ_OVERLAY' : true });
                            }}
                        /><br />
                        New Assignment &nbsp;&nbsp;&nbsp;
                        <Button text="Create" onClick={
                            function() {
                                // turn on confirmation dialog upon navigation away
                                window.onbeforeunload = checkAllSaved;
                                window.location.hash = '';
                                window.ga('send', 'event', 'Actions', 'open', 'New Assignment');
                                document.body.scrollTop = document.documentElement.scrollTop = 0;
                                window.store.dispatch({type : "NEW_ASSIGNMENT"});
                            }}
                        /><br />
                        <br />
                        Open Assignment &nbsp;&nbsp;&nbsp;
                        <br />
                        <HtmlButton
                            className="fm-button"
                            ref="studentDriveOpen"
                            title="Open assignment from Google Drive"
                            onClick={/* contrlled by google auth in componentDidMount*/function(){}}
                            content={(
                                    <div style={{display: "inline-block"}}>
                                        <div style={{float: "left", paddingTop: "2px"}}>Open from Drive &nbsp;</div>
                                         <img src="images/google_drive_small_logo.png"
                                            alt="google logo" />
                                    </div>
                            )} />
                        <br />
                        <br />
                        Open a Free Math file from your device
                        <input type="file" accept="*" id="open-file-input" onChange={
                            function(evt) {
                                // turn on confirmation dialog upon navigation away
                                window.onbeforeunload = checkAllSaved;
                                window.location.hash = '';
                                window.ga('send', 'event', 'Actions', 'open', 'Open Assignment');
                                document.body.scrollTop = document.documentElement.scrollTop = 0;
                                readSingleFile(evt);
                        }}/>
                        <br />
                        <br />
                                Select a Free Math file you previously saved, or one that your teacher
                                returned to you after grading.
                        <br />
                        { (recoveredStudentDocs.length > 0) ?
                            (<span><h4>Recovered Assignments &nbsp;
                                <Button text="Clear All" onClick={deleteAllStudentAutoSavesCallback} />
                                </h4>
                                <p>Sort by
                                <Button text="Date"
                                        className={(this.state.studentRecoveredSorting === "DATE" ?
                                            "fm-button-selected " : "") +
                                            "fm-button"}
                                        onClick={function() {
                                            this.setState({studentRecoveredSorting: "DATE"});
                                        }.bind(this)}
                                />
                                <Button text="Name"
                                        className={(this.state.studentRecoveredSorting === "NAME" ?
                                            "fm-button-selected " : "") +
                                            "fm-button"}
                                        onClick={function() {
                                            this.setState({studentRecoveredSorting: "NAME"});
                                        }.bind(this)}
                                />
                                </p>
                                    { recoveredStudentDocs.map(function(autoSaveFullName, index) {
                                                // strip off milliseconds and seconds, and the type of doc label when displaying to user
                                                var filenameAndDate = autoSaveFullName.replace("auto save students","")
                                                        .replace(/:\d\d\..*/, "")
                                                var nameAndDate = splitNameAndDate(filenameAndDate);
                                                var filename = nameAndDate[1];
                                                var datePart = nameAndDate[2];
                                                return (
                                                        <div style={{marginBottom:"20px",
                                                                     textOverflow:"ellipsis",
                                                                     overflow: "hidden"}}
                                                             key={autoSaveFullName}
                                                             title={filename}
                                                        >
                                                        {filename}
                                                        <br />
                                                        <Button text="Open"
                                                                onClick={function() {
                                                                    recoverAutoSaveCallback(autoSaveFullName, filename, EDIT_ASSIGNMENT)}
                                                                } />
                                                        <Button text="Delete"
                                                                onClick={function() {
                                                                    deleteAutoSaveCallback(autoSaveFullName)}
                                                                } />
                                                        &nbsp;&nbsp;{datePart}
                                                        <br />
                                                        </div>
                                                );
                                            }) }
                                    </span>) : null }
                        { (recoveredStudentDocs.length > 0) ?
                            (<p>Recovered assignments stored temporarily in your
                                browser, save to your device as soon as
                                possible</p>) : null}
                </div>
            <FreeMathModal
                showModal={this.state['CREATE_QUIZ_OVERLAY']}
                content={(
                    <div style={{alignItems: "center"}}>
                    <div><b>Teacher Login</b></div>
                    <br />
                            Session Name (i.e class/activity)
                            <br />
                            <input type="text" style={{width:"150px"}}
                               value={this.state.quiz_name}
                               onChange={function(evt) {
                                        this.setState({quiz_name: evt.target.value});
                               }.bind(this)}/>
                            <br />
                            <br />
                            <Button text="Create"
                                onClick={ () => {
                                    // login
                                    restCall(URL + "rest.php", 'post',
                                        JSON.stringify({verb: 'create_quiz',
                                            username: this.state.username, quiz_name: this.state.quiz_name}),
                                        JSON_MIME,
                                        (result) => {
                                            reload_quizzes();
                                            alert("Successfully created new live session.");
                                            this.setState({ 'CREATE_QUIZ_OVERLAY' : false });
                                        }, (err) => {
                                            console.log(err);
                                        }
                                    );
                                }} />
                    </div>
                )}
            />
                <div className="homepage-actions-container" style={{...divStyle, textAlign: "left"}}>
                    <h3>Teachers</h3>
                        <Button type="submit" text="Create New Live Session" onClick={
                            () => {
                                this.setState({ 'CREATE_QUIZ_OVERLAY' : true });
                            }}
                        /><br />
                        <Button type="submit" text="Teacher Login" onClick={
                            () => {
                                this.teacherLogin();
                            }}
                        /><br />
                    <HtmlButton
                        className="fm-button"
                        title="Create new Google Classroom assignment"
                        ref="createClassroomAssignment"
                        onClick={function(){}}
                        content={(
                                <div style={{display: "inline-block"}}>
                                    <div style={{float: "left", paddingTop: "2px"}}>New Classroom Assignment&nbsp;</div>
                                     <img style={{paddingTop: "1px"}}
                                            src="images/google_classroom_small.png"
                                            alt="Google logo"
                                            height="16px"/>
                                </div>
                        )} />
                    <br />
                    <br />
                    Grade Assignments <br />
                    <HtmlButton
                        className="fm-button"
                        title="Grade a Google Classroom Assignment"
                        onClick={function() {} /* action assigned in didMount to hook into google auth */}
                        ref="gradeClassroomAssignment"
                        content={(
                                <div style={{display: "inline-block"}}>
                                    <div style={{float: "left", paddingTop: "2px"}}>
                                        Grade Classroom Assignment&nbsp;
                                    </div>
                                     <img style={{paddingTop: "1px"}}
                                            src="images/google_classroom_small.png"
                                            alt="Google logo"
                                            height="16px"/>
                                </div>
                        )} /> <br />
                        <p>
                            Open a zip file from your device
                            <br />
                            <input type="file" accept="*" onChange={openAssignments}/>
                        </p>
                        {/* TODO - I don't understand why this isn't the same size
                            as the similar text in the student box...*/}
                            Select a zip file full of student assignments. Zip files are generated
                            when downloading assignment files from your LMS in bulk.
                            <br />
                            <a href="gettingStarted.html">
                                LMS Integration Info
                            </a>
                        <br />
                        {teacher_quizzes.length > 0 ?
                            (<span><h4>Live Sessions </h4>
                                    { teacher_quizzes.map(function(quiz, index) {
                                            return (
                                                <div>
                                                {quiz.quiz_name + " - " + quiz.join_code} &nbsp;&nbsp;
                                                <Button text="Edit"
                                                    key={quiz.join_code}
                                                    onClick={
                                                        () => {
                                                            // make a request to see if there is a saved draft of this quiz
                                                            // TODO - later optimization, can send at least a boolean in the list of sessions
                                                            // to say if any draft is saved or if it is just a number so far

                                                            restCall(URL + "rest.php", 'post',
                                                                JSON.stringify({verb: 'get_quiz_content',
                                                                    username: username, quiz_join_code: quiz.join_code,
                                                                }),
                                                                JSON_MIME,
                                                                (result) => {
                                                                    //console.log(result.responseText);
                                                                    var parsedJson = JSON.parse(result.responseText);
                                                                    if (parsedJson && parsedJson.length > 0) {
                                                                        var allProblems = parsedJson;
                                                                        // TODO - consolidate with teacher quiz editing maybe
                                                                        var overallDoc = assignmentReducer();
                                                                        // clear out the defualt blank first problem
                                                                        overallDoc[PROBLEMS] = [];
                                                                        const probCount = allProblems.length;
                                                                        var readInSoFar = 0;
                                                                        allProblems.forEach((questionAloneInDoc) => {
                                                                            openAssignment(base64ToArrayBuffer(
                                                                                questionAloneInDoc['question_content']),
                                                                                '', (recovered) => {
                                                                                    overallDoc[PROBLEMS].push(recovered[PROBLEMS][0]);
                                                                                    readInSoFar++;
                                                                                    if (readInSoFar === probCount) {
                                                                                        window.store.dispatch({type : SET_ASSIGNMENT_CONTENT,
                                                                                            ASSIGNMENT_NAME : '',
                                                                                            DOC_ID: recovered['DOC_ID'], PROBLEMS : overallDoc[PROBLEMS]});
                                                                                        window.store.dispatch({type: SET_EDIT_QUIZ,
                                                                                            JOIN_CODE: quiz.join_code, SESSION_NAME : quiz.quiz_name})
                                                                                    }
                                                                                });
                                                                        });
                                                                    } else {
                                                                        window.store.dispatch({type : "NEW_ASSIGNMENT"});
                                                                        window.store.dispatch({type: SET_EDIT_QUIZ,
                                                                            JOIN_CODE: quiz.join_code, SESSION_NAME : quiz.quiz_name })
                                                                    }
                                                                }, (err) => {
                                                                    console.log(err);
                                                                }
                                                            );
                                                        }
                                                    }
                                                />
                                                <Button text="Grade"
                                                    key={quiz.join_code}
                                                    onClick={
                                                        () => {
                                                            // make a request to see if there is a saved draft of this quiz
                                                            // TODO - later optimization, can send at least a boolean in the list of sessions
                                                            // to say if any draft is saved or if it is just a number so far

                                                            var username = window.localStorage.getItem('username');
                                                            loadStudentWorkFromServer(username, quiz.join_code, quiz.quiz_name);
                                                        }
                                                    }
                                                />
                                                </div>
                                            );
                                      })
                                    }
                                </span>
                            ) : null
                        }
                        { (recoveredTeacherDocs.length > 0) ?
                            (<span><h4>Recovered Grading Sessions &nbsp;
                                <Button text="Clear All" onClick={deleteAllTeacherAutoSavesCallback} />
                                </h4>
                                <p>Sort by
                                <Button text="Date"
                                        className={(this.state.teacherRecoveredSorting === "DATE" ?
                                            "fm-button-selected " : "") +
                                            "fm-button"}
                                        onClick={function() {
                                            this.setState({teacherRecoveredSorting: "DATE"});
                                        }.bind(this)}
                                />
                                <Button text="Name"
                                        className={(this.state.teacherRecoveredSorting === "NAME" ?
                                            "fm-button-selected " : "") +
                                            "fm-button"}
                                        onClick={function() {
                                            this.setState({teacherRecoveredSorting: "NAME"});
                                        }.bind(this)}
                                />
                                </p>
                                    { recoveredTeacherDocs.map(function(autoSaveFullName, index) {
                                                // strip off milliseconds and seconds, and the type of doc label when displaying to user
                                                var filenameAndDate = autoSaveFullName.replace("auto save teachers ","")
                                                        .replace(/:\d\d\..*/, "")
                                                var nameAndDate = splitNameAndDate(filenameAndDate);
                                                var filename = nameAndDate[1];
                                                var datePart = nameAndDate[2];
                                                return (
                                                        <div style={{marginBottom:"20px",
                                                                     textOverflow:"ellipsis",
                                                                     overflow: "hidden"}}
                                                             key={autoSaveFullName}
                                                             title={filename}
                                                        >
                                                        {filename}
                                                        <br />
                                                        <Button text="Open"
                                                                onClick={function() {
                                                                    recoverAutoSaveCallback(autoSaveFullName, filename, GRADE_ASSIGNMENTS)}
                                                                } />
                                                        <Button text="Delete"
                                                                onClick={function() {
                                                                    deleteAutoSaveCallback(autoSaveFullName)}
                                                                } />
                                                        &nbsp;&nbsp;{datePart}
                                                        <br />
                                                        </div>
                                                );
                                            }) }
                                    </span>) : null }
                    { (recoveredTeacherDocs.length > 0) ?
                            (<p>Recovered grading sessions stored temporarily in
                                your browser, save to your device as soon as
                                possible</p>) : null }
                </div>
            </div>
            </div>
            </div>
        );
    }
    /*
     *
            <div className="answer-incorrect"
                 style={{display:"block", padding:"10px", margin: "10px"}}>
                <span>DATA LOSS WARNING: School districts may clear your
                      downloads folder when logging off. It is recommended
                      to save your files on a USB drive, LMS (Canvas, Moodle,
                      Blackboard) or your institution's preferred cloud
                      storage provider like Google Drive, Dropbox, etc.</span>
            </div>
     */
}

class DefaultHomepageActions extends React.Component {
    state = {
        SHOW_GOOGLE_VIDEO: false,
        emailString : ''
    };

    componentDidMount() {
    }

    closeSpinner = () => {
        window.ephemeralStore.dispatch(
            { type : MODIFY_GLOBAL_WAITING_MSG,
              GLOBAL_WAITING_MSG: false});
    };

    openSpinner = () => {
        window.ephemeralStore.dispatch(
            { type : MODIFY_GLOBAL_WAITING_MSG,
              GLOBAL_WAITING_MSG: 'Loading demo grading assignments...'});
    };

    render() {
        var halfScreenStyle= {
            width:"44%",
            height: "auto",
            float: "left",
            borderRadius:"3px",
            margin:"5px 5px 10px 5px",
            padding:"10px"
        }
        var demoButtonStyle = {
            ...halfScreenStyle,
            width:"350px",
            borderRadius:"60px",
            textAlign: "center",
        };
        var wrapperDivStyle = {
            padding:"0px 0px 0px 0px",
            backgroundColor:"#ffffff",
        };

        const renderExampleWork = function(problemData) {
            return (
                <div>
                    {
                        problemData[STEPS].map(function(step, stepIndex) {
                        return (
                            <div key={stepIndex}>
                                <TeX>{step[CONTENT]}</TeX>
                            </div>
                        );
                    })}
                </div>
            );
        };

        const openSpinner = this.openSpinner;
        const closeSpinner = this.closeSpinner;
        var browserIsIOS = false; ///iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        return (
            <div>
            <FreeMathModal
                showModal={this.state[SHOW_GOOGLE_VIDEO]}
                closeModal={function() {
                            this.setState({ SHOW_GOOGLE_VIDEO : false});
                        }.bind(this)}
                content={(
                    <div>
                        <iframe title="Free Math Video"
                            src="https://www.youtube.com/embed/cR9R3tXbiug?ecver=2"
                            allowFullScreen frameBorder="0"
                            className="tutorial-video"
                            ></iframe>
                    <br />
                        <p>If you are new to the site, you can check out the&nbsp;
                        <a href="https://www.youtube.com/watch?v=NcsJK771YFg"
                           target="_blank" rel="noopener noreferrer">
                            general Free Math intro video</a>
                        </p>
                    </div>
            )} />
            <div className="menuBar">
                <div style={{maxWidth:1024,marginLeft:"auto",
                             marginRight:"auto", padding: "0 10px 0 10px"}}
                     className="nav">
                    <LogoHomeNav />
                    <div className="navBarElms" style={{float:"right"}}>
                    <a href="gettingStarted.html"
                        style={{color:"white", marginRight:"15px"}} >
                            Get Started
                    </a>{' '}
                    <a href="edsurge_article.html"
                        style={{color:"white", marginRight:"15px"}} >
                            Classroom Impact
                    </a>{' '}
                    <a href="contact.html"
                        style={{color:"white", marginRight:"15px"}} >
                            Contact
                    </a>
                    </div>
                </div>
            </div>
            <div style={{...wrapperDivStyle, paddingTop:"50px"}}>
            <div>
            <UserActions value={this.props.value} />
            <div style={{width : "100%", margin:"50px 0px 20px 0px",
                         padding:"50px 0px 50px 0px",
                         }}
                 className="homepage-center">
                   <div id="mc_embed_signup">
                       <form action="https://freemathapp.us17.list-manage.com/subscribe/post?u=9529516f2eeb3f44372a20887&id=ed42803cd3"
                              method="post" id="mc-embedded-subscribe-form"
                              name="mc-embedded-subscribe-form" className="validate"
                              target="_blank" style={{paddingLeft:"0px"}} noValidate>
                        <div id="mc_embed_signup_scroll">
                        <div style={{position: "absolute", left: "-5000px"}} aria-hidden="true">
                            <input type="text" name="b_14d49781dec57b609b6a58f1a_b843990eea"
                                   tabIndex="-1" readOnly={true} value=""/>
                        </div>

                        <div style={{overflow: "hidden"}}>
                            <label htmlFor="mce-EMAIL">
                                <h2 style={{"display":"inline"}}>
                                    Subscribe for Updates <br />
                                </h2>
                            </label>
                            <h3>
                                <p style={{fontSize: "25px"}}>
                                    Join our e-mail list to find out first about new features and updates to the site.
                                </p>
                                <input type="email" name="EMAIL" className="email" size="25"
                                       id="mce-EMAIL" placeholder="  email address"
                                       style={{padding: "5px",
                                               fontSize: "25px"}}
                                       value={this.state.emailString}
                                       onChange={function(evt) {
                                                this.setState({emailString : evt.target.value});
                                       }.bind(this)}/>
                                &nbsp;
                                <Button style={{fontSize: "25px", borderRadius: "30px", padding: "8px 16px"}}
                                       text="Subscribe" id="mc-embedded-subscribe"
                                       onClick={function() {
                                            window.ga('send', 'event', 'Actions', 'signup', 'Mail list');
                                }} />
                            </h3>
                   </div>
                   </div>
                   </form>
                   </div>
               </div>

            <br />
            <div className="homepage-center">
                <a href="index.html" className="fm-button"
                        style={{width:"350px", height:"auto", float:"left", borderRadius: "60px",
                                margin:"5px 5px 10px 5px", padding: "10px", textAlign: "center"}}>
                    <h2 style={{color: "#eeeeee"}}>Return to Homepage</h2>
                </a>
            </div>

            <div style={{"width" : "100%", "margin":"100px 0px 0px 0px",
                             "padding":"50px 0px 70px 0px",
                             "backgroundColor": "rgba(10,0,30,1)",
                              color: "#eee"
                             }}>

            <div style={{"padding":"0px 100px 0px 100px"}}>
                    <p>
                        <a className="lightLink" href="privacyPolicy.html">Privacy Policy</a>
                        &nbsp;&nbsp;&nbsp;
                        <a className="lightLink" href="acknowledgements.html">Creative Commons Media and Open Source Code Used in this Site</a>
                    </p>
                    <small>
                        Free Math is free software: you can redistribute it and/or modify
                        it under the terms of the GNU General Public License as published by
                        the Free Software Foundation, either version 3 of the License, or
                        (at your option) any later version.

                        Free Math is distributed in the hope that it will be useful,
                        but WITHOUT ANY WARRANTY; without even the implied warranty of
                        MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
                        GNU General Public License for more details.

                        You should have received a copy of the GNU General Public License
                        along with Free Math.  If not, see &lt;http://www.gnu.org/licenses/&gt;.
                    </small>
                    </div>
                </div>
            </div>
            </div>
            </div>
        );
    }
}


export { DefaultHomepageActions as default, render, checkAllSaved, getStudentRecoveredDocs, getTeacherRecoveredDocs, sortByDate, loadDemoGrading,
    loadStudentWorkFromServer };
