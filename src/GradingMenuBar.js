import React from 'react';
import ReactDOM from 'react-dom';
import './App.css';
import LogoHomeNav from './LogoHomeNav.js';
import { saveGradedStudentWork, saveGradedStudentWorkToBlob} from './TeacherInteractiveGrader.js';
import { LightButton, HtmlButton } from './Button.js';
import { getPersistentState, getEphemeralState, saveToLocalStorageOrDrive } from './FreeMath.js';
import { updateFileWithBinaryContent, createFileWithBinaryContent,
         doOnceGoogleAuthLoads } from './GoogleApi.js';

var SET_TO_VIEW_GRADES = 'SET_TO_VIEW_GRADES';
var SET_TO_SIMILAR_DOC_CHECK = 'SET_TO_SIMILAR_DOC_CHECK';
var NAV_BACK_TO_GRADING = 'NAV_BACK_TO_GRADING';

var ASSIGNMENT_NAME = 'ASSIGNMENT_NAME';
var SET_ASSIGNMENT_NAME = 'SET_ASSIGNMENT_NAME';

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
var ERROR_DOC_TOO_BIG = 'ERROR_DOC_TOO_BIG';
var PENDING_SAVES = 'PENDING_SAVES';

class GradingMenuBar extends React.Component {
    componentDidMount() {
        const attachClickHandlers = function() {
            // componentDidMount is called after all the child components have been mounted,
            // but before any parent components have been mounted.
            // https://stackoverflow.com/questions/49887433/dom-isnt-ready-in-time-after-componentdidmount-in-react
            // put a small delay to hopefully let the parent mount, also putting a setTimeout at all will free up
            // the main thread to allow a repaint

            setTimeout(function() {
                const saveCallback = function() {
                    var persistentState = getPersistentState();
                    var zip = saveGradedStudentWorkToBlob(persistentState);
                    var content = zip.generate({type: "blob"});
                    var googleId = getEphemeralState()[GOOGLE_ID];
                    console.log("update in google drive:" + googleId);
                    if (googleId) {
                        updateFileWithBinaryContent (
                            persistentState[ASSIGNMENT_NAME] + '.zip',
                            content,
                            googleId,
                            'application/zip',
                            function() {
                                window.ephemeralStore.dispatch(
                                    { type : SET_GOOGLE_DRIVE_STATE,
                                        GOOGLE_DRIVE_STATE : ALL_SAVED});
                            }
                        );
                    } else {
                        createFileWithBinaryContent (
                            persistentState[ASSIGNMENT_NAME] + '.zip',
                            content,
                            'application/zip',
                            function(response) {
                                window.ephemeralStore.dispatch(
                                    {type : SET_GOOGLE_ID, GOOGLE_ID: response.id});
                                window.ephemeralStore.dispatch(
                                    { type : SET_GOOGLE_DRIVE_STATE,
                                        GOOGLE_DRIVE_STATE : ALL_SAVED});
                            }
                        );
                    }
                }
                // TODO - old code, may bring back, this was for allong saving a graded zip to drive,
                // I thought it would be confusing to have this along with the classroom features.
                // Could consider re-enabling now that the grading experience is stateful and knows when it is
                // working with classroom, so could allow this for non-classroom grading sessions as lots
                // of people have personal google accounts and would be useful for users of other LMSes
                /*
                const saveToDrive = ReactDOM.findDOMNode(this.refs.saveToDrive)
                window.gapi.auth2.getAuthInstance().attachClickHandler(saveToDrive, {},
                    saveCallback,
                    function(error){
                        if (error.error && error.error === "popup_closed_by_user") {
                            alert("If the sign-in popup window just closed itself quickly your browser may have 3rd party cookies disabled, " +
                                  "you need to enable them to use the google integration.\n\n" +
                                  "On Chrome, look for an eye with a line through it in the address bar.\n\n" +
                                  "While Free Math doesn't have ads, some ad blockers also have this behavior and " +
                                  "may need to be disabled.");
                        }
                        console.log(JSON.stringify(error, undefined, 2));
                        //alert("Error contacting google services\n\n" + JSON.stringify(error, undefined, 2));
                        window.ga('send', 'exception', { 'exDescription' : 'google login failure: ' + JSON.stringify(error, undefined, 2)} );
                    });
                */
            }.bind(this), 250);
        }.bind(this);

        doOnceGoogleAuthLoads(10, attachClickHandlers);
    }

    render() {
        var browserIsIOS = false; ///iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        var assignmentName = this.props.value[ASSIGNMENT_NAME];
        if (typeof(assignmentName) === "undefined" || assignmentName == null) {
            assignmentName = "";
        }
        var saveStateMsg = '';
        var googleId = this.props.value[GOOGLE_ID];
        var saveState = this.props.value[GOOGLE_DRIVE_STATE];
        if (googleId) {
            if (saveState === ALL_SAVED) saveStateMsg = "Saved Grades and Feedback in Classroom";
            else if (saveState === SAVING) saveStateMsg = "Saving in Classroom...";
            else if (saveState === ERROR_DOC_TOO_BIG) saveStateMsg = "Error saving to Classroom";
        } else {
            if (saveState === ALL_SAVED) saveStateMsg = "Saved recovery doc in browser";
            else if (saveState === SAVING) saveStateMsg = "Saving recovery doc in browser...";
            else if (saveState === ERROR_DOC_TOO_BIG) saveStateMsg = "Too big to save recovery doc in browser";
        }
        if (this.props.value[PENDING_SAVES]) {
            //saveStateMsg += " (" + this.props.value[PENDING_SAVES] + ")";
        }
        return (
            <div className="menuBar">
                <div className="nav" style={{maxWidth:1200,marginLeft:"auto", marginRight:"auto"}}>
                    <LogoHomeNav />
                    <div className="navBarElms" style={{float: "right", marginTop: "0px",
                                                        verticalAlign:"top", lineHeight : 1}}>

                       <div style={{ visibility: (saveStateMsg === '' ? 'hidden' : 'visible'),
                               color: (saveState === ERROR_DOC_TOO_BIG ? "#FFAEAE" : "inherit")
                            }}
                            className="save-state-message"
                            title={saveStateMsg === '' ? 'Remember to save often' : saveStateMsg}>
                            { /* This inline constant is just to take up some space, it is diliberately hidden
                                 but is a reasonable message to for to users if it was ever accidentally shown */
                                <span>{saveStateMsg === '' ? 'Remember to save often' : saveStateMsg}</span>
                            }
                        </div>
                        {googleId
                            ?
                                <span className="google-assignment-name"
                                        style={{ textOverflow: "ellipsis", overflow: "hidden",
                                               display: "inline-block", whiteSpace: "nowrap",
                                               marginLeft: "15px", marginRight: "15px"}}
                                          title={this.props.value[ASSIGNMENT_NAME]}>
                                        {this.props.value[ASSIGNMENT_NAME]}
                                </span>
                            : null}

                        {/* Don't show option to save on iOS*/}
                        {!browserIsIOS ?
                        (<div className="navBarItem" style={{display:"inline-block"}}>
                            {googleId
                            ?
                                <div className="navBarItem" style={{display:"inline-block"}}>
                                    <HtmlButton
                                        className="fm-button-light"
                                        title="Save feedback and grades to Google Classroom"
                                        onClick={function() {
                                            window.ga('send', 'event', 'Actions', 'edit', 'Save Graded Docs to Classroom');
                                            saveToLocalStorageOrDrive(0);
                                        }}
                                        content={(
                                                <div style={{display: "inline-block"}}>
                                                    <div style={{float: "left", paddingTop: "4px"}}>
                                                        Save to Classroom&nbsp;
                                                    </div>
                                                     <img style={{paddingTop: "2px"}}
                                                            src="images/google_classroom_small.png"
                                                            alt="Google Classroom logo"
                                                            height="16px"/>
                                                </div>
                                        )} />&nbsp;&nbsp;&nbsp;
                                </div>
                            :
                                <div className="navBarItem" style={{display:"inline-block"}}>
                                Assignment &nbsp;
                                <input type="text" id="assignment-name-text" size="20"
                                        name="assignment name"
                                        value={this.props.value[ASSIGNMENT_NAME]}
                                        onChange={
                                            function(evt) {
                                                window.store.dispatch(
                                                    { type : SET_ASSIGNMENT_NAME,
                                                        ASSIGNMENT_NAME : evt.target.value});
                                            }}
                                />
                                </div>
                        }
                        </div>) : null }
                        {/* Don't show option to save on iOS*/}
                        {!browserIsIOS ?
                        (<div style={{display:"inline-block"}}>
                        <LightButton text="Save to Device" onClick={
                            function() {
                                window.ga('send', 'event', 'Actions', 'edit', 'Save Graded Docs');
                                saveGradedStudentWork(getPersistentState());
                            }
                        }/>&nbsp;&nbsp;&nbsp;

                        <LightButton text="Similar Docs" onClick={
                            function() {
                                window.location.hash = '';
                                document.body.scrollTop = document.documentElement.scrollTop = 0;
                                window.ga('send', 'event', 'Actions', 'edit', 'Open similar doc check');
                                window.store.dispatch({type : SET_TO_SIMILAR_DOC_CHECK});
                            }
                        }/>&nbsp;&nbsp;&nbsp;
                        <LightButton text="Grades" onClick={
                            function() {
                                window.location.hash = '';
                                document.body.scrollTop = document.documentElement.scrollTop = 0;
                                window.ga('send', 'event', 'Actions', 'edit', 'View Grades');
                                window.store.dispatch({type : SET_TO_VIEW_GRADES});
                            }
                        }/>&nbsp;&nbsp;
                        </div>) : null }
                    </div>
                </div>
            </div>
        );
    }
}

export class ModalWhileGradingMenuBar extends React.Component {
    render() {
        return (
            <div className="menuBar">
                <div className="nav" style={{width:1024,marginLeft:"auto", marginRight:"auto"}}>
                    <div style={{float:"left"}}> <LogoHomeNav /> </div>
                    <div style={{float:"left", verticalAlign:"top",
                                 marginTop:"5px", marginLeft:"30px", lineHeight : 1}}>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        <LightButton text="Back to Grading" onClick={
                            function() {window.store.dispatch({type : NAV_BACK_TO_GRADING})}
                        }/>
                    </div>
                </div>
            </div>
        );
    }
}

export default GradingMenuBar;
