import React from 'react';
import createReactClass from 'create-react-class';
import './App.css';
import LogoHomeNav from './LogoHomeNav.js';
import { saveGradedStudentWork } from './TeacherInteractiveGrader.js';
import { LightButton } from './Button.js';

var SET_TO_VIEW_GRADES = 'SET_TO_VIEW_GRADES';
var SET_TO_SIMILAR_DOC_CHECK = 'SET_TO_SIMILAR_DOC_CHECK';
var NAV_BACK_TO_GRADING = 'NAV_BACK_TO_GRADING';

var ASSIGNMENT_NAME = 'ASSIGNMENT_NAME';
var SET_ASSIGNMENT_NAME = 'SET_ASSIGNMENT_NAME';

const GradingMenuBar = createReactClass({
    render: function() {
        var assignmentName = this.props.value[ASSIGNMENT_NAME];
        if (typeof(assignmentName) === "undefined" || assignmentName == null) {
            assignmentName = "";
        }
        return (
            <div className="menuBar">
                <div className="nav" style={{maxWidth:1024,marginLeft:"auto", marginRight:"auto"}}>
                    <LogoHomeNav /> 
                    <div className="navBarElms" style={{float:"right", verticalAlign:"top", lineHeight : 1}}>
                        Assignment Name &nbsp;&nbsp;
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
                        <LightButton text="Save Graded" onClick={
                            function() {
                                window.ga('send', 'event', 'Actions', 'edit', 'Save Graded Docs');
                                saveGradedStudentWork(window.store.getState());
                            }
                        }/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        <LightButton text="Similar Doc Check" onClick={
                            function() {
                                window.location.hash = '';
                                document.body.scrollTop = document.documentElement.scrollTop = 0;
                                window.ga('send', 'event', 'Actions', 'edit', 'Open similar doc check');
                                window.store.dispatch({type : SET_TO_SIMILAR_DOC_CHECK});
                            }
                        }/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        <LightButton text="View Grades" onClick={
                            function() {
                                window.location.hash = '';
                                document.body.scrollTop = document.documentElement.scrollTop = 0;
                                window.ga('send', 'event', 'Actions', 'edit', 'View Grades');
                                window.store.dispatch({type : SET_TO_VIEW_GRADES});
                            }
                        }/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        <LightButton text="Scroll to Top" onClick={
                            function() {
                                window.location.hash = '';
                                document.body.scrollTop = document.documentElement.scrollTop = 0;}
                        }/>
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
