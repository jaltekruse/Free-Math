import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import './App.css';
import TeX from './TeX.js';
import LogoHomeNav from './LogoHomeNav.js';
import FreeMath, { getPersistentState, getEphemeralState, getCompositeState, getAutoSaveIndex } from './FreeMath.js';
import Button, { CloseButton, LightButton, HtmlButton } from './Button.js';
import FreeMathModal from './Modal.js';
import { removeExtension, readSingleFile, openAssignment, GoogleClassroomSubmissionSelector } from './AssignmentEditorMenubar.js';
import { aggregateStudentWork, studentSubmissionsZip, loadStudentDocsFromZip,
         calculateGrades, removeStudentsFromGradingView } from './TeacherInteractiveGrader.js';

var MathQuill = window.MathQuill;

const physicsExample =
{"PROBLEM_NUMBER":"","STEPS":[{"CONTENT":"\\text{A ball is thrown from 1 m above the ground.}"},{"CONTENT":"\\text{It is given an initial velocity of 20 m/s}"},{"CONTENT":"\\text{At an angle of 40 degrees above the horizontal}"}, {"CONTENT":"\\text{Find the maximum height reached}"}, {"CONTENT":"\\text{And velocity at that point}"}, {"CONTENT":"x\\left(t\\right)=v\\cos\\left(\\theta\\right)t=20\\cos\\left(40\\right)t=15.3t"},{"CONTENT":"y\\left(t\\right)=y_0+v\\sin\\left(\\theta\\right)t-\\frac{9.8t^2}{2}"},{"CONTENT":"y\\left(t\\right)=1+20\\sin\\left(40\\right)t-4.9t^2"},{"CONTENT":"y\\left(t\\right)=1+12.9t-4.9t^2"},{"CONTENT":"v_y\\left(t\\right)=v\\sin\\left(\\theta\\right)-9.8t"},{"CONTENT":"v_y\\left(t\\right)=12.9-9.8t"},{"CONTENT":"\\max\\ height\\ at\\ v_y\\left(t\\right)=0"},{"CONTENT":"12.9-9.8t=0"},{"CONTENT":"-9.8t=-12.9"},{"CONTENT":"t=\\frac{-12.9}{-9.8}=1.3"},{"CONTENT":"y\\left(1.3\\right)=1+12.9\\left(1.3\\right)-4.9\\left(1.3\\right)^2"},{"CONTENT":"y\\left(1.3\\right)=9.5\\ m"},{"CONTENT":"y\\ component\\ of\\ velocity\\ is\\ 0\\ at\\ highest\\ pt"},{"CONTENT":"total\\ velocity\\ =v_x=15.3\\ \\frac{m}{s}"}],"LAST_SHOWN_STEP":19};

const algebraExample =
{"SCORE":"","FEEDBACK":"","LAST_SHOWN_STEP":8,"STEPS":[{"CONTENT":"\\frac{1}{x-4}+\\frac{2}{x^2-16}=\\frac{3}{x+4}"},{"CONTENT":"\\frac{1}{x-4}+\\frac{2}{\\left(x-4\\right)\\left(x+4\\right)}=\\frac{3}{x+4}"},{"CONTENT":"\\frac{1}{x-4}\\cdot\\left(\\frac{x+4}{x+4}\\right)+\\frac{2}{\\left(x-4\\right)\\left(x+4\\right)}=\\frac{3}{x+4}\\cdot\\left(\\frac{x-4}{x-4}\\right)"},{"CONTENT":"\\frac{1\\left(x+4\\right)}{\\left(x-4\\right)\\left(x+4\\right)}+\\frac{2}{\\left(x-4\\right)\\left(x+4\\right)}=\\frac{3\\left(x-4\\right)}{\\left(x+4\\right)\\left(x-4\\right)}"},{"CONTENT":"1\\left(x+4\\right)+2=3\\left(x-4\\right)"},{"CONTENT":"x+6=3x-12"},{"CONTENT":"x+18=3x"},{"CONTENT":"18=2x"},{"CONTENT":"9=x"}]};

const calculusExample =
{"PROBLEM_NUMBER":"1","STEPS":[{"CONTENT":"\\int x\\ln xdx"},{"CONTENT":"u=\\ln x"},{"CONTENT":"dv=xdx"},{"CONTENT":"du=\\frac{1}{x}dx"},{"CONTENT":"v=\\frac{x^2}{2}"},{"CONTENT":"\\int x\\ln sdx=\\frac{x^2}{2}\\ln x-\\int\\frac{x^2}{2}\\cdot\\frac{1}{x}dx"},{"CONTENT":"\\frac{x^2}{2}\\ln x-\\frac{1}{2}\\int xdx"},{"CONTENT":"\\frac{x^2}{2}\\ln x-\\frac{1}{2}\\left(\\frac{x^2}{2}\\right)+c"},{"CONTENT":"\\frac{x^2}{2}\\ln x-\\frac{1}{4}x^2+c"}],"LAST_SHOWN_STEP":8};

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

class UserActions extends React.Component {
    state = {
             showActionsMobile: false,
             teacherRecoveredSorting: "DATE",
             studentRecoveredSorting: "DATE"
         };

    componentDidMount() {
        const studentOpenButton = ReactDOM.findDOMNode(this.refs.studentDriveOpen)
        if (!window.gapi) {
            return;
        }
        window.gapi.auth2.getAuthInstance().attachClickHandler(studentOpenButton, {},
            function() {
                window.openDriveFile(true, false, null, function(docs) {
                    let name = docs[0].name;
                    let driveFileId = docs[0].id;
                    window.downloadFileNoFailureAlert(driveFileId, true, function(content) {
                        var newDoc = openAssignment(content, name, driveFileId);

                        window.store.dispatch({type : SET_ASSIGNMENT_CONTENT,
                            PROBLEMS : newDoc[PROBLEMS],
                            ASSIGNMENT_NAME : removeExtension(name)});

                        window.ephemeralStore.dispatch(
                            {type : SET_GOOGLE_ID, GOOGLE_ID: driveFileId});
                        // turn on confirmation dialog upon navigation away
                        window.onbeforeunload = checkAllSaved;
                        window.location.hash = '';
                        document.body.scrollTop = document.documentElement.scrollTop = 0;
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
            }, function(e){
                //alert("error signing in to google");
                console.log(e);
            });

        /* Disabled for now, this is confusing to have alongside the Google Classroom support
         * might be useful in the future to give people with other LMSes, but also a google
         * account a way to more easily back up grading sessions in the cloud
        const teacherOpenButton = ReactDOM.findDOMNode(this.refs.teacherDriveOpen)
        window.gapi.auth2.getAuthInstance().attachClickHandler(teacherOpenButton, {},
            function() {
                window.openDriveFile(true, false, null, function(docs) {
                    console.log(docs);
                    let name = docs[0].name;
                    let driveFileId = docs[0].id;
                    window.onbeforeunload = checkAllSaved;
                    window.location.hash = '';
                    document.body.scrollTop = document.documentElement.scrollTop = 0;
                    // TODO - also show this while downloading file
                    this.openSpinner();
                    setTimeout(function() {
                        window.downloadFile(driveFileId, true, function(content) {
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
                window.listGoogleClassroomCourses(function(response) {
                    this.setState({GOOGLE_CLASS_LIST : response});
                    // TODO - make this safe when no classes
                    if (response && response.courses && response.courses.length > 0) {
                        this.setState({courseId: response.courses[0].id});
                    }

                    this.createAssignment();
                }.bind(this));
            }.bind(this)
        );

        const gradeClassroomAssignmentCallback = function() {
            this.refs.submissionSelector.listClasses();
        }.bind(this);

        const gradeClassroomAssignment = ReactDOM.findDOMNode(this.refs.gradeClassroomAssignment)
        window.gapi.auth2.getAuthInstance().attachClickHandler(gradeClassroomAssignment, {},
            gradeClassroomAssignmentCallback, function(e){
                //alert("error signing in to google");
                console.log(e);
            });
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
            // hack to make this method accessible to index.html
            window.loadStudentDocsFromZip = loadStudentDocsFromZip;
            console.log(assignment);

            window.listGoogleClassroomSubmissions(assignment.courseId, assignment.id,
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
                    window.openDriveFile(true, true, assignment.assignment.studentWorkFolder.id, function(docs) {
                        // TODO - message to users if they didn't select all necessary files
                        let selectedDocs = {};
                        docs.forEach(function(doc) {
                            selectedDocs[doc.id] = true;
                        });

                        this.openSpinner();
                        window.listClassroomStudents(assignment.courseId, function(studentList) {
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
                                            window.listGoogleClassroomSubmissionsNoFailureAlert(assignment.courseId, assignment.id,
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
                                    window.checkUnsumitsInterval = setInterval(checkForUnsubmits, 1000 * 10);

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
                                window.downloadFileNoFailureAlert(fileId, true,
                                    function(response) {
                                        var newDoc = openAssignment(response, "filename" /* TODO */);
                                        allStudentWork.push(
                                            { STUDENT_FILE : fileId, STUDENT_NAME: studentName,
                                              STUDENT_SUBMISSION_ID: submissionId,
                                              ASSIGNMENT : newDoc[PROBLEMS]});
                                        // TODO - also do this on error, and report to user
                                        pendingOpens--;
                                        if (downloadQueue.length > 0) {
                                            let next = downloadQueue.pop();
                                            downloadFile(next[GOOGLE_ID], next[STUDENT_NAME], next[STUDENT_SUBMISSION_ID]);
                                        } else {
                                            checkAllDownloaded();
                                        }
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
                            let CONCURRENT_REQUESTS = 15;
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
            function base64ToArrayBuffer(base64) {
                var binary_string = window.atob(base64);
                var len = binary_string.length;
                var bytes = new Uint8Array(len);
                for (var i = 0; i < len; i++) {
                    bytes[i] = binary_string.charCodeAt(i);
                }
                return bytes.buffer;
            }

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
                    recovered = openAssignment(base64ToArrayBuffer(
                        window.localStorage.getItem(autoSaveFullName)),
                        filename);
                } catch (e) {
                    loadLegacyFormat();
                    return;
                }
                window.store.dispatch({type : SET_ASSIGNMENT_CONTENT,
                    ASSIGNMENT_NAME : filename,
                    DOC_ID: recovered['DOC_ID'], PROBLEMS : recovered[PROBLEMS]});
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
                        alert("You do not have permissions to grade this assignment.");
                        return;
                    }
                    openDriveAssignments(assignment);
                }}
                ref="submissionSelector"/>
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
                            <select onChange={
                                function(event) {
                                    this.setState({courseId: event.target.value});
                                }.bind(this)}
                            >
                                {this.state['GOOGLE_CLASS_LIST'].courses
                                    .map(function(classInfo, index) {
                                        return (
                                            <option value={classInfo.id}>{classInfo.name}</option>
                                        )
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
                            window.createGoogeClassroomAssignment(
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
            <div style={{display:"inline-block", width:"100%"}}>
            <div className="homepage-center-mobile">
                <div className="homepage-actions-container" style={{...divStyle, textAlign: "left"}}>
                    <h3>Students</h3>
                        New Assignment &nbsp;&nbsp;&nbsp;
                        <Button type="submit" text="Create" onClick={
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
                                                             key={autoSaveFullName}>
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
                <div className="homepage-actions-container" style={{...divStyle, textAlign: "left"}}>
                    <h3>Teachers</h3>
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
                                                        <div style={{marginBottom:"20px"}} key={autoSaveFullName}>
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
        const loadDemoGrading = function() {
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
                            function() {closeSpinner();},
                            function() {closeSpinner()},
                            false);
                        window.store.dispatch({type: SET_SHOW_TUTORIAL});
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
                        Getting Started
                    </a>{' '}
                    <a href="contact.html"
                        style={{color:"white", marginRight:"15px"}} >
                            Contact
                    </a>{' '}
                    <a href="faq.html" style={{color:"white"}} >
                        FAQ
                    </a>
                    </div>
                </div>
            </div>
            <div style={{...wrapperDivStyle, paddingTop:"50px"}}>
                <h1 className="homepage-center homepage-headline">
                    Give your students feedback,
                    <br />
                    meaningfully and efficiently.
                </h1>
            <div>
            <div className="homepage-center">
            <div className="homepage-center-mobile" style={{"padding":"0px 0px 30px 0px"}}>
            <button className="fm-button big-mobile-button" style={{...demoButtonStyle, "float" : "left"}}
                onClick={function() {
                    // turn on confirmation dialog upon navigation away
                    window.onbeforeunload = checkAllSaved;
                    window.location.hash = '';
                    document.body.scrollTop = document.documentElement.scrollTop = 0;
                    window.ga('send', 'event', 'Demos', 'open', 'Student Demo');
                    window.store.dispatch({type : "NEW_ASSIGNMENT"});
                    window.store.dispatch({type : ADD_DEMO_PROBLEM});
                }}
            >
                <span style={{color:"#eeeeee"}}>Students Start Here</span>
            </button>
            <button className="fm-button big-mobile-button" style={{...demoButtonStyle, "float" : "left"}}
                onClick={function() {
                    window.ga('send', 'event', 'Demos', 'open', 'Teacher Demo');
                    loadDemoGrading();
                    //window.store.dispatch(demoGradingAction);
                }}
            >
                <span style={{color:"#eeeeee"}}>Demo Teacher Grading</span>
            </button>
            </div>
            {
            <div className="homepage-only-on-mobile">
                { ! browserIsIOS ?
                    (<button className="fm-button big-mobile-button" style={{...demoButtonStyle, "float" : "left"}}
                             onClick={function() {
                                    this.setState({"showActionsMobile": ! this.state.showActionsMobile});
                                }.bind(this)}
                            >   <span>
                                    {this.state.showActionsMobile ? "Hide Actions" : "Returning Users"}
                                </span>
                            </button>
                    ) : null
                }
            </div>
            }
            </div>
            <div className="homepage-only-on-mobile" >
                {this.state.showActionsMobile ? <UserActions value={this.props.value} /> : null }
            </div>
            <div className="homepage-disappear-mobile" >
                <UserActions value={this.props.value} />
            </div>
            </div>
            <div style={{padding:"0px 0px 0px 0px", width: "100%", "display":"inline-block"}}>
                <div className="homepage-wrapper">
                    <div className="homepage-text homepage-left homepage-center-mobile">
                        <h2>Students Show Step-by-Step Work</h2>
                            <p>Students can start with a blank Free Math document, copying
                                down and working through problems just as they would in
                                paper notebooks.</p>
                            <p>Students save their work as a file and submit it through an LMS in response to an assignment.</p>
                    </div>
                    <div className="homepage-right homepage-video homepage-center-mobile">
                        <video alt="student.webm" autoPlay muted playsInline loop width="100%">
                            <track kind="captions" />
                            <source src="fm_assignment_faster_and_cropped.mp4" type="video/mp4" />
                        </video>
                    </div>
                </div>
                <div className="homepage-wrapper">
                    <div className="homepage-text homepage-right homepage-center-mobile">
                        <h2>Embrace Visual Learning</h2>
                        <p>Students can include images in their solutions.</p>
                        <p>Including quickly snapping a picture of written work with their webcam.</p>
                    </div>
                    <div className="homepage-video homepage-left homepage-center-mobile">
                        <video alt="student.webm" autoPlay muted playsInline loop width="100%">
                            <track kind="captions" />
                            <source src="fm_webcam_capture_cropped.mp4" type="video/mp4" /></video>
                    </div>
                </div>
                <div className="homepage-wrapper">
                    <div className="homepage-text homepage-left homepage-center-mobile">
                        <h2>Simultaneously Review All Assignments</h2>
                        <p>Complete solutions are shown, grouped by similar final answer.</p>
                        <p>You can award partial credit and give feedback to students that need help.</p>
                        <p>You don't need to type in an answer key, Free Math just provides an organized view of all student work.</p>
                    </div>
                    <div className="homepage-right homepage-video homepage-center-mobile">
                        <video alt="student.webm" autoPlay muted playsInline loop width="100%">
                            <track kind="captions" />
                            <source src="grading_with_images.mp4" type="video/mp4" /></video>
                    </div>
                </div>
                <div className="homepage-wrapper" style={{marginBottom: "100px"}}>
                    <div className="homepage-center">
                    <h2>Analytics Show Where Students Struggled</h2>
                    <p>Give feedback on the most impactful problems first, <br />
                        everything else gets completion points.</p>
                    <br />
                    <img style={{width:"100%",
                                 boxShadow: "rgb(176, 177, 178) 0px 10px 50px"
                               }}
                         alt="grading_analytics_graph"
                         src="images/teacher_grading_analytics.png"/>
                    </div>
                </div>

                <div className="homepage-wrapper" style={{marginBottom: "100px"}}>
                    <div className="homepage-text homepage-left homepage-center-mobile">
                        <h2>No Accounts Or Downloads Required</h2>
                            <p>The entire experience runs right in your web browser.</p>
                            <p>Assignments and grading sessions save directly from the browser to files
                                in your downloads folder. From there you can store the files in any cloud
                                system like Google Drive, Dropbox, OneDrive, etc.</p>
                            <p>The files can easily be collected in any LMS, downloaded all together and loaded
                                for grading. After grading, your LMS also easily provides an individual feedback
                                file to each student.</p>
                    </div>
                    <div className="homepage-right homepage-video homepage-center-mobile">
                        <img src="images/lms.png" alt="lms logos" style={{width:"100%"}}/>
                    </div>
                </div>
            <div className="homepage-center">
                <a href="gettingStarted.html">
                <div className="fm-button" style={{...demoButtonStyle, "float" : "left"}}>
                    <h2 style={{color:"#eeeeee"}}>Get Started</h2>
                </div>
                </a>
            </div>
            <div style={{width : "100%", margin:"100px 0px 20px 0px",
                         padding:"50px 0px 50px 0px",
                         background: "linear-gradient(180deg, rgba(10,0,30,1) 0%, rgba(41,0,70,1) 65%)"
                         }}>
		    <div id="mc_embed_signup" style={{"padding":"0px 100px 0px 100px"}}>
			<form action="https://freemathapp.us17.list-manage.com/subscribe/post?u=9529516f2eeb3f44372a20887&amp;id=ed42803cd3"
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
                                <h2 style={{"display":"inline", color: "#eee"}}>
                                    Subscribe for Updates <br />
                                </h2>
                            </label>
                            <h3>
                                <p style={{color: "#eee", fontSize: "25px"}}>
                                    Join our e-mail list to find out first about new features and updates to the site.
                                </p>
                                <input type="email" name="EMAIL" className="email" size="25"
                                       id="mce-EMAIL" placeholder="  email address"
                                       style={{"border": "0px", padding: "5px",
                                               fontSize: "25px"}}
                                       value={this.state.emailString}
                                       onChange={function(evt) {
                                                this.setState({emailString : evt.target.value});
                                       }.bind(this)}/>
                                &nbsp;
                                <LightButton style={{fontSize: "25px", borderRadius: "30px", padding: "8px 16px"}}
                                       text="Subscribe" id="mc-embedded-subscribe"
                                       className="fm-button-light" onClick={function() {
                                            window.ga('send', 'event', 'Actions', 'signup', 'Mail list');
                                }} />
                            </h3>
	            </div>
	            </div>
		    </form>
		    </div>
		</div>
                { browserIsIOS ?
                    (
                    <div className="homepage-center-mobile">
                        <h2> Windows PCs, Macs, Chromebooks, and Android devices Currently Supported </h2>
                            <p> It looks like you are on a iOS device, please save the link and visit on
                                one of the supported devices for the full exprience. </p>
                    </div>
                   ) : null }
                <div className="homepage-center"
                     style={{marginTop: "100px", width:"70%", height: "0",
                             position:"relative", padding:"0px 0px 39.375% 0px"}}>
                <iframe title="Free Math Video"
                        src="https://www.youtube.com/embed/XYiRdKe4Zd8?ecver=2"
                        width="80%" height="auto" allowFullScreen frameBorder="0"
                        style={{width:"100%", height:"100%", position: "absolute", }}></iframe></div>

                <div className="homepage-wrapper" style={{paddingTop: "100px"}}>
                    <div className="homepage-text homepage-center">
                    <h2>Office Hours</h2>
                        <p>
                        Have questions about how to get started with Free Math? <br />
                        Want to talk with the development team about a feature suggestion? <br />
                        Interested in meeting other teachers improving their classrooms with Free Math? <br />
                        <br />
                        Come to office hours on Google Meet, held Monday, Wednesday and Friday at 8:30-9:30am CST <br />
                        <br />
                        </p>
                        <div className="homepage-center">
                            <a href="https://meet.google.com/hjr-fxfm-erq" target="_blank" rel="noopener noreferrer">
                            <div className="fm-button" style={{...demoButtonStyle, "float" : "left"}}>
                                <h2 style={{color:"#eeeeee"}}>Join the Conversation!</h2>
                            </div>
                            </a>
                        </div>
                    </div>
                </div>
                <div className="homepage-wrapper" style={{paddingTop: "100px", marginBottom: "100px"}}>
                    <div className="homepage-text homepage-center">
                    <h2>Spread the Word</h2>
                    <p>Help us bring simple freeform digital math assignments to the world's classrooms.</p>
                    <br />
                    <div>
                        <a href="https://www.facebook.com/sharer/sharer.php?kid_directed_site=1&u=https%3A%2F%2Ffreemathapp.org%2F&display=popup&ref=plugin&src=share_button" target="_blank" rel="noopener noreferrer" onClick={function() {
                            window.ga('send', 'event', 'Actions', 'share', 'facebook');
                        }}>
                            <img alt="facebook" src="images/facebook.png" style={{"height": "50px"}}></img></a>&nbsp;
                        <a href="https://twitter.com/intent/tweet?text=Free%20Math%20%20-%20bringing%20simple%20freeform%20digital%20math%20assignments%20to%20the%20world%27s%20classrooms.&tw_p=tweetbutton&url=https://freemathapp.org&via=freemathapp" target="_blank" rel="noopener noreferrer" onClick={function() {
                            window.ga('send', 'event', 'Actions', 'share', 'twitter');
                        }}>
                            <img alt="twitter" src="images/twitter.png" style={{"height": "50px"}}></img></a>&nbsp;
                        <a href="https://www.reddit.com/r/freemath" target="_blank" rel="noopener noreferrer"
                           onClick={function() {
                            window.ga('send', 'event', 'Actions', 'share', 'reddit');
                        }}>
                            <img alt="reddit" src="images/snoo.png" style={{"height": "50px"}}></img></a>&nbsp;&nbsp;
                        <a href="https://www.pinterest.com/pin/create/button/?url=https://freemathapp.org&media=https://freemathapp.org/images/grading_screenshot.png" target="_blank" rel="noopener noreferrer"  onClick={function() {
                            window.ga('send', 'event', 'Actions', 'share', 'pinterest');
                        }}>
                            <img alt="pinterest" src="images/pinterest.png" style={{"height": "50px"}}></img></a>&nbsp;&nbsp;
                    </div>
                    </div>
                </div>
                <div style={{alignItems: "center", textAlign: "center"}}>
                <h2>Great for Many Areas of Math</h2>
                <br />
                <br />
                <div style={{float:"none", display:"inline-block"}}>
                    <div className="homepage-center-mobile homepage-left">
                        <h3>Algebra</h3>
                        {renderExampleWork(algebraExample) }
                    </div>
                    <div className="homepage-center-mobile homepage-left">
                        <h3>Calculus</h3>
                        {renderExampleWork(calculusExample) }
                    </div>
                    <div className="homepage-center-mobile homepage-left">
                        <h3>Physics</h3>
                        {renderExampleWork(physicsExample) }
                    </div>
                </div>
                </div>
                <div style={{"width" : "100%", "margin":"100px 0px 0px 0px",
                             "padding":"50px 0px 50px 0px",
                             "backgroundColor": "rgba(10,0,30,1)",
                              color: "#eee"
                             }}>

		    <div style={{"padding":"0px 100px 0px 100px"}}>
                    <p>
                        <a className="lightLink" href="privacyPolicy.html">Privacy Policy</a>
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


export { DefaultHomepageActions as default, render, checkAllSaved, getStudentRecoveredDocs, getTeacherRecoveredDocs, sortByDate};
