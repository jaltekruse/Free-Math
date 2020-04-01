import React from 'react';
import ReactDOM from 'react-dom';
import createReactClass from 'create-react-class';
import './App.css';
import LogoHomeNav from './LogoHomeNav.js';
import { saveGradedStudentWork, genStudentWorkZip } from './TeacherInteractiveGrader.js';
import { LightButton, HtmlButton } from './Button.js';

var SET_TO_VIEW_GRADES = 'SET_TO_VIEW_GRADES';
var SET_TO_SIMILAR_DOC_CHECK = 'SET_TO_SIMILAR_DOC_CHECK';
var NAV_BACK_TO_GRADING = 'NAV_BACK_TO_GRADING';

var ASSIGNMENT_NAME = 'ASSIGNMENT_NAME';
var SET_ASSIGNMENT_NAME = 'SET_ASSIGNMENT_NAME';

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

const GradingMenuBar = createReactClass({
    componentDidMount: function() {
        const saveCallback = function() {
            var zip = genStudentWorkZip(window.store.getState());
            var content = zip.generate({type: "blob"});
            var googleId = window.store.getState()[GOOGLE_ID];
            console.log("update in google drive:" + googleId);
            if (googleId) {
                window.updateFileWithBinaryContent (
                    window.store.getState()[ASSIGNMENT_NAME] + '.zip',
                    content,
                    googleId,
                    'application/zip',
                    function() {
                        window.store.dispatch(
                            { type : SET_GOOGLE_DRIVE_STATE,
                                GOOGLE_DRIVE_STATE : ALL_SAVED});
                    }
                );
            } else {
                window.createFileWithBinaryContent (
                    window.store.getState()[ASSIGNMENT_NAME] + '.zip',
                    content,
                    'application/zip',
                    function(driveFileId) {
                        window.store.dispatch({type : SET_GOOGLE_ID,
                            GOOGLE_ID: driveFileId,
                        });
                        window.store.dispatch(
                            { type : SET_GOOGLE_DRIVE_STATE,
                                GOOGLE_DRIVE_STATE : ALL_SAVED});
                    }
                );
            }
        }
        const saveToDrive = ReactDOM.findDOMNode(this.refs.saveToDrive)
        window.gapi.auth2.getAuthInstance().attachClickHandler(saveToDrive, {},
            saveCallback, function(){/* TODO - on sign in error*/})
    },
    render: function() {
        var browserIsIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream; 
        var assignmentName = this.props.value[ASSIGNMENT_NAME];
        if (typeof(assignmentName) === "undefined" || assignmentName == null) {
            assignmentName = "";
        }
        var saveStateMsg = '';
        var googleId = window.store.getState()[GOOGLE_ID];
        if (googleId) {
            var state = this.props.value[GOOGLE_DRIVE_STATE];
            if (state === ALL_SAVED) saveStateMsg = "All changes saved in Drive";
            else if (state === SAVING) saveStateMsg = "Saving in Drive...";
        }
        return (
            <div className="menuBar">
                <div className="nav" style={{maxWidth:1024,marginLeft:"auto", marginRight:"auto"}}>
                    <LogoHomeNav /> 
                    <div className="navBarElms" style={{float:"right", verticalAlign:"top", lineHeight : 1}}>
                        <span style={{margin : "0px 15px 0px 15px"}}>
                            {saveStateMsg}</span>
                        Name &nbsp;
                        <input type="text" id="assignment-name-text" size="20"
                                name="assignment name"
                                value={this.props.value[ASSIGNMENT_NAME]}
                                onChange={
                                    function(evt) {
                                        window.store.dispatch(
                                            { type : SET_ASSIGNMENT_NAME,
                                                ASSIGNMENT_NAME : evt.target.value});
                                    }}
                        />&nbsp;&nbsp;
                        {/* TODO - Don't show option to save to local device on iOS - {!browserIsIOS ?  */} 
                        <LightButton text="Save to Device" onClick={
                            function() {
                                window.ga('send', 'event', 'Actions', 'edit', 'Save Graded Docs');
                                saveGradedStudentWork(window.store.getState());
                            }
                        }/>&nbsp;&nbsp;
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
                            )} />&nbsp;&nbsp;
                        <LightButton text="Similar Docs" onClick={
                            function() {
                                window.location.hash = '';
                                document.body.scrollTop = document.documentElement.scrollTop = 0;
                                window.ga('send', 'event', 'Actions', 'edit', 'Open similar doc check');
                                window.store.dispatch({type : SET_TO_SIMILAR_DOC_CHECK});
                            }
                        }/>&nbsp;&nbsp;
                        <LightButton text="Grades" onClick={
                            function() {
                                window.location.hash = '';
                                document.body.scrollTop = document.documentElement.scrollTop = 0;
                                window.ga('send', 'event', 'Actions', 'edit', 'View Grades');
                                window.store.dispatch({type : SET_TO_VIEW_GRADES});
                            }
                        }/>&nbsp;&nbsp;
                    </div>
                </div>
            </div>
        );
    }
});

export const ModalWhileGradingMenuBar = createReactClass({
    render: function() {
        return (
            <div className="menuBar">
                <div className="nav" style={{width:1024,marginLeft:"auto", marginRight:"auto"}}>
                    <LogoHomeNav /> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    <div style={{float:"left", verticalAlign:"top",
                                 marginTop:"5px", lineHeight : 1}}>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        <LightButton text="Back to Grading" onClick={
                            function() {window.store.dispatch({type : NAV_BACK_TO_GRADING})}
                        }/>
                    </div>
                </div>
            </div>
        );
    }
});

export default GradingMenuBar;
