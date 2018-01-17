import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import _ from 'underscore';
import logo from './logo.svg';
import './App.css';
import MathInput from './MathInput.js';
import TeX from './TeX.js';
import FreeMath from './FreeMath.js';
import { autoSave } from './FreeMath.js';
import { studentSubmissionsZip } from './TeacherInteractiveGrader.js';
import { readSingleFile } from './AssignmentEditorMenubar.js';
import Problem from './Problem.js';

var MathQuill = window.MathQuill;
var Khan = window.Khan;
var MathJax = window.MathJax;
var katex = window.katex;
var katexA11y = window.katexA11y;

var KAS = window.KAS;

const physicsExample =
{"PROBLEM_NUMBER":"","STEPS":[{"CONTENT":"\\text{A ball is thrown from 1 m above the ground.}"},{"CONTENT":"\\text{It is given an initial velocity of 20 m/s at an angle of 40 degrees above the horizontal}"},{"CONTENT":"\\text{Find the maximum height and velocity at the point it is reached}"},{"CONTENT":"x\\left(t\\right)=v\\cos\\left(\\theta\\right)t=20\\cos\\left(40\\right)t=15.3t"},{"CONTENT":"y\\left(t\\right)=y_0+v\\sin\\left(\\theta\\right)t-\\frac{9.8t^2}{2}"},{"CONTENT":"y\\left(t\\right)=1+20\\sin\\left(40\\right)t-4.9t^2"},{"CONTENT":"y\\left(t\\right)=1+12.9t-4.9t^2"},{"CONTENT":"v_y\\left(t\\right)=v\\sin\\left(\\theta\\right)-9.8t"},{"CONTENT":"v_y\\left(t\\right)=12.9-9.8t"},{"CONTENT":"\\max\\ height\\ at\\ v_y\\left(t\\right)=0"},{"CONTENT":"12.9-9.8t=0"},{"CONTENT":"-9.8t=-12.9"},{"CONTENT":"t=\\frac{-12.9}{-9.8}=1.3"},{"CONTENT":"y\\left(1.3\\right)=1+12.9\\left(1.3\\right)-4.9\\left(1.3\\right)^2"},{"CONTENT":"y\\left(1.3\\right)=9.5\\ m"},{"CONTENT":"y\\ component\\ of\\ velocity\\ is\\ 0\\ at\\ highest\\ pt"},{"CONTENT":"total\\ velocity\\ =v_x=15.3\\ \\frac{m}{s}"}],"LAST_SHOWN_STEP":19};

const algebraExample =
{"SCORE":"","FEEDBACK":"","LAST_SHOWN_STEP":8,"STEPS":[{"CONTENT":"\\frac{1}{x-4}+\\frac{2}{x^2-16}=\\frac{3}{x+4}"},{"CONTENT":"\\frac{1}{x-4}+\\frac{2}{\\left(x-4\\right)\\left(x+4\\right)}=\\frac{3}{x+4}"},{"CONTENT":"\\frac{1}{x-4}\\cdot\\left(\\frac{x+4}{x+4}\\right)+\\frac{2}{\\left(x-4\\right)\\left(x+4\\right)}=\\frac{3}{x+4}\\cdot\\left(\\frac{x-4}{x-4}\\right)"},{"CONTENT":"\\frac{1\\left(x+4\\right)}{\\left(x-4\\right)\\left(x+4\\right)}+\\frac{2}{\\left(x-4\\right)\\left(x+4\\right)}=\\frac{3\\left(x-4\\right)}{\\left(x+4\\right)\\left(x-4\\right)}"},{"CONTENT":"1\\left(x+4\\right)+2=3\\left(x-4\\right)"},{"CONTENT":"x+6=3x-12"},{"CONTENT":"x+18=3x"},{"CONTENT":"18=2x"},{"CONTENT":"9=x"}]};

const calculusExample =
{"PROBLEM_NUMBER":"1","STEPS":[{"CONTENT":"\\int x\\ln xdx"},{"CONTENT":"u=\\ln x"},{"CONTENT":"dv=xdx"},{"CONTENT":"du=\\frac{1}{x}dx"},{"CONTENT":"v=\\frac{x^2}{2}"},{"CONTENT":"\\int x\\ln sdx=\\frac{x^2}{2}\\ln x-\\int\\frac{x^2}{2}\\cdot\\frac{1}{x}dx"},{"CONTENT":"\\frac{x^2}{2}\\ln x-\\frac{1}{2}\\int xdx"},{"CONTENT":"\\frac{x^2}{2}\\ln x-\\frac{1}{2}\\left(\\frac{x^2}{2}\\right)+c"},{"CONTENT":"\\frac{x^2}{2}\\ln x-\\frac{1}{4}x^2+c"}],"LAST_SHOWN_STEP":8};

var STEPS = 'STEPS';
var CONTENT = "CONTENT";

export function render() {
    ReactDOM.render(
        <FreeMath value={window.store.getState()} />,
        document.getElementById('root')
    );
}

const DefaultHomepageActions = React.createClass({
    render: function() {
        var divStyle = {
            width:"42%",
            float: "left",
            borderRadius:"3px",
            border:"1px solid #cfcfcf",
            backgroundColor:"white",
            margin:"0px 15px 15px 15px",
            padding:"0px 15px 15px 15px"
        };
        var wrapperDivStyle = {
            padding:"30px 30px 0px 30px",
            //"backgroundColor":"#fafafa",
            "backgroundColor":"#ffffff",
            "margin-left":"auto",
            "margin-right": "auto",
            width:"1024"
        };

        var openAssignments = function(evt){
            // turn on confirmation dialog upon navigation away
            window.onbeforeunload = function() {
                    return true;
            };
            console.log(evt);
            studentSubmissionsZip(evt);
        };

        var recoverAutoSaveCallback = function(docName) {
            // turn on confirmation dialog upon navigation away
            window.onbeforeunload = function() {
                    return true;
            };
            var recovered = JSON.parse(window.localStorage.getItem(docName));
            window.store.dispatch({"type" : "SET_GLOBAL_STATE", "newState" : recovered });
        };
        var deleteAutoSaveCallback = function(docName) {
            if (!window.confirm("Are you sure you want to delete this recovered document?")) {
                return;
            }
            window.localStorage.removeItem(docName);
            // TODO - fix this hack, should not explicitly call render, this should be fixed while
            // addressing TODO below about component directly accessing localStorage
            render();
        };

        // TODO - this is ugly, a component shouldn't access localStorage, this should be read in at app startup
        // stored in the redux state tree and then kept in sync with what is actually stored through actions
        // use subscribers - https://stackoverflow.com/questions/35305661/where-to-write-to-localstorage-in-a-redux-app
        var recoveredStudentDocs = [];
        var recoveredTeacherDocs = [];
        // recovered autoSaved docs
        for (var key in localStorage){
            if (key.startsWith("auto save students")) {
                recoveredStudentDocs.push(key);
            } else if (key.startsWith("auto save teachers")) {
                recoveredTeacherDocs.push(key);
            }
        }

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
        return (
            <div style={wrapperDivStyle}>
                <div style={{display:"inline-block", width:"100%"}}>
                    <div>
                        <div style={divStyle}>
                            <h3>Students</h3>
                                New Assignment &nbsp;&nbsp;&nbsp;
                                <input type="submit" id="new-assignment" name="New assignment" value="Create" onClick={
                                    function() {
                                        // turn on confirmation dialog upon navigation away
                                        window.onbeforeunload = function() {
                                                return true;
                                        };
                                        window.store.dispatch({type : "NEW_ASSIGNMENT"});
                                }}/><br />

                                Open Assignment &nbsp;&nbsp;&nbsp;
                                <input type="file" id="open-file-input" onChange={
                                    function(evt) {
                                        // turn on confirmation dialog upon navigation away
                                        window.onbeforeunload = function() {
                                                return true;
                                        };
                                        readSingleFile(evt, false /* don't warn about data loss */);
                                }}/>
                                { (recoveredStudentDocs.length > 0) ? (<h4>Recovered assignments:</h4>) : null }
                                { (recoveredStudentDocs.length > 0) ?

                                        recoveredStudentDocs.map(function(docName, docIndex) {
                                            return (
                                                <div key={docName}><input type="submit" value="open" onClick={function() {recoverAutoSaveCallback(docName)}} />
                                                     <input type="submit" value="delete" onClick={function() {deleteAutoSaveCallback(docName)}} />

                                                {docName.replace("auto save students ","").replace(/:\d\d\..*/, "")}</div>
                                            );
                                        })
                                   : null
                                }
                                { (recoveredStudentDocs.length > 0) ? (<p>Recovered assignments stored temporarily in your browser, save to your device as soon as possible</p>) : null }
                        </div>
                        <div style={divStyle}>
                            <h3>Teachers</h3>
                            Grade Student Assignments <input type="file" id="open-student-submissions-input" onChange={openAssignments}/>
                            { (recoveredTeacherDocs.length > 0) ? (<h4>Recovered grading sessions:</h4>) : null }
                            { (recoveredTeacherDocs.length > 0) ?

                                    recoveredTeacherDocs.map(function(docName, docIndex) {
                                        return (
                                            <div key={docName}><input type="submit" value="open" onClick={function() {recoverAutoSaveCallback(docName)}} />
                                                 <input type="submit" value="delete" onClick={function() {deleteAutoSaveCallback(docName)}} />
                                            {docName.replace("auto save teachers ","").replace(/:\d\d\..*/, "")}</div>
                                        );
                                    })
                               : null
                            }
                            { (recoveredTeacherDocs.length > 0) ? (<p>Recovered grading sessions stored temporarily in your browser, save to your device as soon as possible</p>) : null }
                            <p><a href="student_submissions.zip">Download Example Assignments To Test Grading</a></p>
                        </div>
                    </div>
                </div>
                <span id="about" />
                <div style={{paddingTop: "80px", marginTop: "-100px"}} />
                <h1>Meet Your New Math Classroom</h1>
                <p>Students digitally record step-by-step math work.</p>
                <p>No account setup required, free for teachers and students. Work saves as files on your local device, share docs through your existing course management solution.</p>
                <p>Teachers load all students docs for simultaneous grading, reviewing complete solutions grouped by similar final answer.</p>
                <p>Provide targeted feedback before a test or quiz and improve daily communication with students.</p>
                <p>The software is released under the terms of the Open Source GNU General Public License. <a href="https://github.com/jaltekruse/Free-Math">Source Code</a></p>
                <div style={{position:"relative",height:"0","padding-bottom":"56.25%"}}><iframe src="https://www.youtube.com/embed/vB7KCDeBYpI?ecver=2" width="640" height="360" frameborder="0" gesture="media" style={{position:"absolute",width:"100%",height:"100%",left:0}} allowfullscreen></iframe></div>
                <br />
                <span id="examples" />
                <div style={{paddingTop: "80px", marginTop: "-100px"}} />
                <h2>Great for many areas of Math</h2>
                <h3>Algebra</h3>
                {renderExampleWork(algebraExample) }
                <h3>Physics</h3>
                {renderExampleWork(physicsExample) }
                <h3>Calculus</h3>
                {renderExampleWork(calculusExample) }
                <span id="contact" />
                <div style={{paddingTop: "80px", marginTop: "-100px"}} />
                <h2>Contact the Developer</h2>
                <p>I am currently looking for classes to pilot the software, if you would like to discuss how you could use Free Math in your classroom send me a message to this address. Bug reports, questions and press inquries can also be directed to this address.</p>
                <p>developers@freemathapp.org</p>
                <div>Follow the project <a href="https://www.facebook.com/freemathapp"><img alt="facebook" src="/images/facebook.png" style={{height:"35px"}}></img></a>
                    <a href="https://twitter.com/freemathapp"><img alt="twitter" src="/images/twitter.png" style={{height:"35px"}}></img></a>
    <a href="https://github.com/jaltekruse/Free-Math/issues">Report Bug or Request Feature</a>
    </div>
                <h2>Supported Platforms</h2>
                <p>
                Modern browsers on Chromebooks, Windows, Mac and Linux. <br />
                Android and iOS are currently unsupported, but some devices may work.
                </p>
                <span id="license" />
                <div style={{paddingTop: "80px", marginTop: "-100px"}} />
                <h3>Legal</h3>
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
        );
    }
});

export default DefaultHomepageActions;
