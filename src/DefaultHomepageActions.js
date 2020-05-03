import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import './App.css';
import TeX from './TeX.js';
import LogoHomeNav from './LogoHomeNav.js';
import FreeMath, { getAutoSaveIndex } from './FreeMath.js';
import Button from './Button.js';
import { CloseButton, LightButton, HtmlButton } from './Button.js';
import demoGradingAction from './demoGradingAction.js';
import FreeMathModal from './Modal.js';
import { removeExtension, readSingleFile, openAssignment, GoogleClassroomSubmissionSelector } from './AssignmentEditorMenubar.js';
import JSZip from 'jszip';
import { aggregateStudentWork, studentSubmissionsZip, loadStudentDocsFromZip, convertToCurrentFormat} from './TeacherInteractiveGrader.js';

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
// action
var SET_GOOGLE_DRIVE_STATE = 'SET_GOOGLE_DRIVE_STATE';
// Property name and possible values
var GOOGLE_DRIVE_STATE = 'GOOGLE_DRIVE_STATE';
var SAVING = 'SAVING';
var ALL_SAVED = 'ALL_SAVED';

var APP_MODE = 'APP_MODE';
var MODE_CHOOSER = 'MODE_CHOOSER';

var EDIT_ASSIGNMENT = 'EDIT_ASSIGNMENT';
var GRADE_ASSIGNMENTS = 'GRADE_ASSIGNMENTS';

var PROBLEMS = 'PROBLEMS';
// used to swap out the entire content of the document, for opening
// a document from a file
var SET_ASSIGNMENT_CONTENT = 'SET_ASSIGNMENT_CONTENT';

function checkAllSaved() {
    const appState = window.store.getState();
    if (appState[APP_MODE] !== MODE_CHOOSER &&
        !(appState[GOOGLE_ID] && appState[GOOGLE_DRIVE_STATE] == ALL_SAVED)) {
        return true;
    } else {
        return null;
    }
}

function render() {
    window.MathQuill = MathQuill.getInterface(1);
    ReactDOM.render(
        <FreeMath value={window.store.getState()} />,
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
    state = { showModal: false,
             showActionsMobile: false,
             teacherRecoveredSorting: "DATE",
             studentRecoveredSorting: "DATE"
         };

    componentDidMount() {
        const studentOpenButton = ReactDOM.findDOMNode(this.refs.studentDriveOpen)
        window.gapi.auth2.getAuthInstance().attachClickHandler(studentOpenButton, {},
            function() {
                window.openDriveFile(true, function(name, content, driveFileId) {
                    var newDoc = openAssignment(content, name, driveFileId);

                    window.store.dispatch({type : SET_ASSIGNMENT_CONTENT,
                        PROBLEMS : newDoc[PROBLEMS], GOOGLE_ID: driveFileId,
                        ASSIGNMENT_NAME : removeExtension(name)});
                    // turn on confirmation dialog upon navigation away
                    window.onbeforeunload = checkAllSaved;
                    window.location.hash = '';
                    document.body.scrollTop = document.documentElement.scrollTop = 0;
                });
            }, function(){/* TODO - on sign in error*/})

        const teacherOpenButton = ReactDOM.findDOMNode(this.refs.teacherDriveOpen)
        window.gapi.auth2.getAuthInstance().attachClickHandler(teacherOpenButton, {},
            function() {
                window.openDriveFile(true, function(name, content, googleId) {
                    // turn on confirmation dialog upon navigation away
                    window.onbeforeunload = checkAllSaved;
                    window.location.hash = '';
                    document.body.scrollTop = document.documentElement.scrollTop = 0;
                    // TODO - also show this while downloading file
                    this.openSpinner();
                    setTimeout(function() {
                        loadStudentDocsFromZip(content, name,
                            function() {}, googleId);
                        this.closeSpinner();
                        }.bind(this), 50);
                }.bind(this));
            }.bind(this), function(){/* TODO - on sign in error*/});

        const createClassroomAssignment = ReactDOM.findDOMNode(this.refs.createClassroomAssignment)
        window.gapi.auth2.getAuthInstance().attachClickHandler(createClassroomAssignment, {},
            function() {
                window.listGoogeClassroomCourses(function(response) {
                    this.setState({GOOGLE_CLASS_LIST : response});
                    // TODO - make this safe when no classes
                    this.setState({courseId: response.courses[0].id});

                    this.createAssignment();
                }.bind(this));
            }.bind(this)
        );

        const gradeClassroomAssignmentCallback = function() {
            this.refs.submissionSelector.listClasses();
        }.bind(this);

        const gradeClassroomAssignment = ReactDOM.findDOMNode(this.refs.gradeClassroomAssignment)
        window.gapi.auth2.getAuthInstance().attachClickHandler(gradeClassroomAssignment, {},
            gradeClassroomAssignmentCallback, function(){/* TODO - on sign in error*/})

    }

    closeSpinner = () => {
        this.setState({ showModal: false });
    };

    openSpinner = () => {
        this.setState({ showModal: true });
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
            studentSubmissionsZip(evt, function() {this.closeSpinner()}.bind(this));
        }.bind(this);

        var openDriveAssignments = function(assignment) {
            // hack to make this method accessible to index.html
            window.loadStudentDocsFromZip = loadStudentDocsFromZip;
            console.log(assignment);
            window.listGoogeClassroomSubmissions(assignment.courseId, assignment.id,
                function(resp) {
                    console.log(resp)
                    var allStudentWork = [];
                    let pendingOpens = 0;
                    resp.studentSubmissions.forEach(function(submission) {
                        // TODO - warn teacher about multiple submissions
                        // TODO- sort on modification date or attachment date, pick latest
                        // TODO- handle other types of attahement (just report error)
                        var submitted = typeof submission.assignmentSubmission.attachments != 'undefined';
                        // TODO - inform teacher
                        if (!submitted) {
                            console.log("skipping");
                            console.log(submission);
                            return;
                        }

                        var attachment = submission.assignmentSubmission.attachments[0].driveFile;
                        // TODO - pull in student name, don't just show filename
                        pendingOpens++;
                        window.downloadFile(attachment.id, true,
                            function(response, fileId) {
                                console.log(response);
                                var newDoc = openAssignment(response, "filename" /* TODO */);
                                allStudentWork.push({STUDENT_FILE : fileId, ASSIGNMENT : newDoc[PROBLEMS]});
                                // TODO - also do this on error, and report to user
                                pendingOpens--;
                        });
                    });

                    // TODO - add a timeout
                    var checkFilesLoaded = function() {
                        if (pendingOpens === 0) {
                            console.log(allStudentWork);

                            var aggregatedWork = aggregateStudentWork(allStudentWork);
                            window.store.dispatch(
                                { type : 'SET_ASSIGNMENTS_TO_GRADE',
                                  NEW_STATE :
                                    {...aggregatedWork, ASSIGNMENT_NAME: removeExtension("TODO fill in")}});
                        } else {
                            // if not all of the images are loaded, check again in 50 milliseconds
                            setTimeout(checkFilesLoaded, 50);
                        }
                    }
                    checkFilesLoaded();
                }, function(){});
        }

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
            document.body.scrollTop = document.documentElement.scrollTop = 0;
            if (appMode === EDIT_ASSIGNMENT) {
                window.ga('send', 'event', 'Actions', 'open', 'Recovered Assignment');
                recovered = openAssignment(base64ToArrayBuffer(
                    window.localStorage.getItem(autoSaveFullName)),
                    filename);
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

                loadStudentDocsFromZip(
                    base64ToArrayBuffer(window.localStorage.getItem(autoSaveFullName)),
                    filename, function() {alert("Loading recovery failed")}, matchingDocId, false);
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
                selectAssignmentCallback={openDriveAssignments}
                ref="submissionSelector"/>
            <FreeMathModal
                showModal={this.state.showModal}
                content={(
                    <div style={{alignItems: "center"}}>
                        <img style={{
                            "display": "flex",
                            "marginLeft":"auto",
                            "marginRight": "auto"
                             }}
                             src="images/Ajax-loader.gif" alt="loading spinner" /><br />
                        Analyzing and grouping student work...
                    </div>)}
            />
            <FreeMathModal
                showModal={this.state['CREATING_GOOGLE_CLASSROOM_ASSINGMENT']}
                content={(
                    <div style={{"align-items": "center"}}>
                    <CloseButton type="submit" text="&#10005;" title="Close"
                                 onClick={ function() {
                                        // this closes the modal
                                        this.setState({ 'CREATING_GOOGLE_CLASSROOM_ASSINGMENT' : false});
                                    }.bind(this)}
                    />
                    <div><b>Create Assignment</b></div>
                    <br />
                    Class &nbsp;&nbsp;
                    {this.state['GOOGLE_CLASS_LIST'] === undefined ? null :
                        (<select onChange={
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
                        )
                    }
                    {/* TODO - required field validation */}
                    {/* TODO - add due date*/}
                    <br />
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
                       onChange={function(evt) {
                                this.setState({assignmentDescription: evt.target.value});
                       }.bind(this)}/><br />
                    <Button type="submit" text="Create" onClick={
                        function() {
                            window.createGoogeClassroomAssignment(
                                this.state.courseId, this.state.assignmentName,
                                this.state.assignmentDescription,
                                function(response) {
                                    console.log(response);
                                    this.setState({ 'CREATING_GOOGLE_CLASSROOM_ASSINGMENT' : false});
                                    alert("successfully created asignment");
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
                        Open Assignment &nbsp;&nbsp;&nbsp;
                        <br />
                        <HtmlButton
                            className="fm-button"
                            ref="studentDriveOpen"
                            title="Open assignment from Google Drive"
                            onClick={/* contrlled by google auth in componentDidMount*/function(){}}
                            content={(
                                    <div style={{display: "inline-block"}}>
                                        <div style={{float: "left", paddingTop: "2px"}}>Open from&nbsp;</div>
                                         <img style={{paddingTop: "2px"}}
                                            src="images/google_drive_small_logo.png"
                                            alt="google logo" />
                                    </div>
                            )} />
                        <br />
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
                        <small>
                                Select a Free Math file you previously saved, or one that your teacher
                                returned to you after grading.
                        </small>
                        <br />
                        { (recoveredStudentDocs.length > 0) ?
                            (<span><h4>Recovered Assignments &nbsp;
                                <Button text="Clear All" onClick={deleteAllStudentAutoSavesCallback} />
                                </h4>
                                Sort by
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
                                <br />
                                <br />

                                    { recoveredStudentDocs.map(function(autoSaveFullName, index) {
                                                // strip off milliseconds and seconds, and the type of doc label when displaying to user
                                                var filenameAndDate = autoSaveFullName.replace("auto save students","")
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
                        )} /><br />
                    Grade Assignments <br />
                    <HtmlButton
                        className="fm-button"
                        title="Submit assignment to Google Classroom"
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
                        <HtmlButton
                            className="fm-button"
                            ref="teacherDriveOpen"
                            title="Open zip file of student assignments from Google Drive"
                            onClick={function(){} /* action assigned in didMount to hook into google auth */}
                            content={(
                                    <div style={{display: "inline-block"}}>
                                        <div style={{float: "left", paddingTop: "2px"}}>Open from&nbsp;</div>
                                         <img style={{paddingTop: "2px"}}
                                            src="images/google_drive_small_logo.png"
                                            alt="google logo" />
                                    </div>
                            )} />
                        <br />
                        Grade Assignments <input type="file" accept="*" onChange={openAssignments}/>
                        <br />
                        <small>
                            Select a zip file full of student assignments. Zip files are generated
                            when downloading assignment files from your LMS in bulk.
                            <br />
                            <a href="gettingStarted.html">
                                LMS Integration Info
                            </a>
                        </small>
                        <br />
                        { (recoveredTeacherDocs.length > 0) ?
                            (<span><h4>Recovered Grading Sessions &nbsp;
                                <Button text="Clear All" onClick={deleteAllTeacherAutoSavesCallback} />
                                </h4>
                                Sort by
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
                                <br />
                                <br />
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
        emailString : ''
    };

    componentDidMount() {
    }

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
            marginLeft:"auto",
            marginRight: "auto",
            //width:"1024px"
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
        var browserIsIOS = false; ///iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        return (
            <div>
            <div className="menuBar">
                <div style={{maxWidth:1024,marginLeft:"auto",
                             marginRight:"auto", padding: "0 10px 0 10px"}}
                     className="nav">
                    <LogoHomeNav />
                    <div className="navBarElms" style={{marginTop:"4px", float:"right"}}>
                    {/* Now handled by auth tied directly into the "Open from" buttons, see componentDidMount()
                    <HtmlButton
                            className="fm-button-light"
                            onClick={
                                function() {window.handleAuthClick() }}
                            content={(
                                    <div style={{display: "inline-block"}}>
                                        <div style={{float: "left", paddingTop: "4px"}}>Connect to&nbsp;</div>
                                         <img style={{paddingTop: "2px"}}
                                                src="images/google_small_logo.png"
                                                alt="google logo" />
                                    </div>
                            )} />
                    <HtmlButton
                            className="fm-button-light"
                            onClick={
                                function() {window.handleSignoutClick() }}
                            content={(
                                    <div style={{display: "inline-block"}}>
                                        <div style={{float: "left", paddingTop: "4px"}}>Disconnect&nbsp;</div>
                                         <img style={{paddingTop: "2px"}}
                                            src="images/google_small_logo.png"
                                            alt="google logo" />
                                    </div>
                            )} />
                    &nbsp;&nbsp;&nbsp;
                    */}
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
            <div style={wrapperDivStyle}>
                <h1 className="homepage-center homepage-headline">
                    Give your students feedback,
                    <br />
                    meaningfully and efficiently.
                </h1>
            <div>
            <div className="homepage-center">
            <div className="homepage-center-mobile" style={{"padding":"0px 0px 30px 0px"}}>
            <button className="fm-button" style={{...demoButtonStyle, "float" : "left"}}
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
                <h3 style={{color:"#eeeeee"}}>Students Start Here</h3>
            </button>
            <button className="fm-button" style={{...demoButtonStyle, "float" : "left"}}
                onClick={function() {
                    window.location.hash = '';
                    document.body.scrollTop = document.documentElement.scrollTop = 0;
                    window.ga('send', 'event', 'Demos', 'open', 'Teacher Demo');
                    window.store.dispatch(demoGradingAction);
                }}
            >
                <h3 style={{color:"#eeeeee"}}>Demo Teacher Grading</h3>
            </button>
            </div>
            {
            <div className="homepage-only-on-mobile">
                { ! browserIsIOS ?
                    (<button className="fm-button" style={{...demoButtonStyle, "float" : "left"}}
                             onClick={function() {
                                    this.setState({"showActionsMobile": ! this.state.showActionsMobile});
                                }.bind(this)}
                            >   <h3 style={{color:"#eeeeee"}}>
                                    {this.state.showActionsMobile ? "Hide Actions" : "Returning Users"}
                                </h3>
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
                <br />
                <div className="homepage-wrapper">
                    <div className="homepage-text homepage-left homepage-center-mobile">
                        <h2>Students Show Step-by-Step Work</h2>
                            <p>Students can start with a blank Free Math document, copying
                                down and working through problems just as if they were completing work in
                                paper notebooks.</p>
                            <p>Students save their work as a file and submit it through an LMS in response to an assignment.</p>
                    </div>
                    <div className="homepage-right homepage-video homepage-center-mobile">
                        <video alt="student.webm" autoPlay muted playsInline loop width="100%">
                            <track kind="captions" />
                            <source src="fm_assignment_cropped.mp4" type="video/mp4" />
                        </video>
                    </div>
                </div>
                <div className="homepage-wrapper">
                    <div className="homepage-text homepage-right homepage-center-mobile">
                        <h2>Simultaneously Review All Assignments</h2>
                        <p>Complete solutions are shown, grouped by similar final answer.</p>
                        <p>You can award partical credit and give feedback to students that need help.</p>
                        <p>You don't need to type in an answer key, Free Math just provides an organized view of all student work.</p>
                    </div>
                    <div className="homepage-video homepage-left homepage-center-mobile">
                        <video alt="student.webm" autoPlay muted playsInline loop width="100%">
                            <track kind="captions" />
                            <source src="free_math_grading.mp4" type="video/mp4" /></video>
                    </div>
                </div>
                <div className="homepage-wrapper homepage-center" style={{marginBottom: "100px"}}>
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
                                   tabIndex="-1" value=""/>
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
                                <input style={{margin:"10px", fontSize: "25px", borderRadius: "30px", padding: "8px 16px"}} type="submit"
                                       value="Subscribe" name="subscribe" id="mc-embedded-subscribe"
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
                     style={{width:"70%", height: "0",
                             position:"relative", padding:"0px 0px 39.375% 0px"}}>
                <iframe title="Free Math Video"
                        src="https://www.youtube.com/embed/XYiRdKe4Zd8?ecver=2"
                        width="80%" height="auto" allowFullScreen frameBorder="0"
                        style={{width:"100%", height:"100%", position: "absolute", }}></iframe></div>
                <div className="homepage-wrapper homepage-center" style={{paddingTop: "100px", marginBottom: "100px"}}>
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
