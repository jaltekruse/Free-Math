import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import logo from './logo.svg';
import './App.css';
import GradingMenuBar from './GradingMenuBar.js';
import LogoHomeNav from './LogoHomeNav.js';
import Assignment from './Assignment.js';
import TeacherInteractiveGrader from './TeacherInteractiveGrader.js';
import AssignmentEditorMenubar from './AssignmentEditorMenubar.js';
import { ModalWhileGradingMenuBar } from './GradingMenuBar.js';
import DefaultHomepageActions from './DefaultHomepageActions.js';

var FreeMath = React.createClass({
  render: function() {
    // TODO - figure out how to best switch between teacher and
    // student mode rendering
    var wrapperDivStyle = {
        padding:"30px 30px 0px 30px",
        "backgroundColor":"#fafafa",
        "margin-left":"auto",
        "margin-right": "auto",
        width:"1024",
        height:"100%"
    };
    if (this.props.value[APP_MODE] === EDIT_ASSIGNMENT) {
        return (
            <div style={wrapperDivStyle}>
                <AssignmentEditorMenubar value={this.props.value}/>
                <div style={{display:"inline-block", width:"100%"}}>
                    <Assignment value={this.props.value}/>
                </div>
            </div>
        );
    } else if (this.props.value[APP_MODE] === GRADE_ASSIGNMENTS) {
        return (
            <div style={{...wrapperDivStyle, width : "95%" }}>
                <GradingMenuBar />
                <TeacherInteractiveGrader value={this.props.value}/>
            </div>
        );
    } else if (this.props.value[APP_MODE] === MODE_CHOOSER) {
        return (
        <div>
            <div className="menuBar">
                <div className="nav">
                    <LogoHomeNav />
                </div>
            </div>
            <DefaultHomepageActions />
        </div>
        );
    } else if (this.props.value[APP_MODE] === VIEW_GRADES) {
        var props = this.props;
        return (
            <div>
                <ModalWhileGradingMenuBar />
                <table>
                    <thead>
                    <tr><th>Student File</th><th>Score</th></tr>
                    </thead>
                    <tbody>
                    {
                        function() {
                            var tableRows = [];
                            var grades = props.value[GRADE_INFO][STUDENT_GRADES];
                            for (var studentFileName in grades) {
                                if (grades.hasOwnProperty(studentFileName)) {
                                    tableRows.push(
                                    (<tr><td>{studentFileName}</td><td>{grades[studentFileName]}</td></tr> ));
                                }
                            }
                            return tableRows;
                        }()
                    }
                    </tbody>
                </table>
            </div>
        );
    } else  {
        alert(this.props.value);
    }
  }
});

export default FreeMath;

// Application modes
var APP_MODE = 'APP_MODE';
var EDIT_ASSIGNMENT = 'EDIT_ASSIGNMENT';
var GRADE_ASSIGNMENTS = 'GRADE_ASSIGNMENTS';
var MODE_CHOOSER = 'MODE_CHOOSER';


var VIEW_GRADES = 'VIEW_GRADES';
var GRADE_INFO = 'GRADE_INFO';
var STUDENT_GRADES = 'STUDENT_GRADES';
