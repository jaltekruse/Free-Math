import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import _ from 'underscore';
import logo from './logo.svg';
import './App.css';
import LogoHomeNav from './LogoHomeNav.js';
import { saveGradedStudentWork } from './TeacherInteractiveGrader.js';
import { studentSubmissionsZip } from './TeacherInteractiveGrader.js';

var SET_TO_VIEW_GRADES = 'SET_TO_VIEW_GRADES';
// the state resulting from above ttanstion action
var VIEW_GRADES = 'VIEW_GRADES';
var NAV_BACK_TO_GRADING = 'NAV_BACK_TO_GRADING';

const GradingMenuBar = React.createClass({
    render: function() {
        return (
            <div className="menuBar">
                <div className="nav">
                    <LogoHomeNav /> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    <div style={{float:"left", verticalAlign:"top", marginTop:"5px", lineHeight : 1}}>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        <input type="submit" id="save-graded-assignments" value="Save graded" onClick={
                            function() {
                                saveGradedStudentWork(window.store.getState());
                            }
                        }/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        <input type="submit" id="view-grades" value="View grades" onClick={
                            function() {window.store.dispatch({type : SET_TO_VIEW_GRADES})}
                        }/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        <input type="submit" id="scroll-to-top" value="Scroll to top" onClick={
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

export const ModalWhileGradingMenuBar = React.createClass({
    render: function() {
        return (
            <div className="menuBar">
                <div className="nav">
                    <LogoHomeNav /> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    <div style={{float:"left", verticalAlign:"top", marginTop:"5px", lineHeight : 1}}>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        <input type="submit" id="back-to-grading" value="Back to grading" onClick={
                            function() {window.store.dispatch({type : NAV_BACK_TO_GRADING})}
                        }/>
                    </div>
                </div>
            </div>
        );
    }
});

export default GradingMenuBar;
