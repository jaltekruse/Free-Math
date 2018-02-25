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
window.MathQuill = MathQuill.getInterface(1);
var Khan = window.Khan;
var MathJax = window.MathJax;
var katex = window.katex;
var katexA11y = window.katexA11y;

var KAS = window.KAS;

const physicsExample =
{"PROBLEM_NUMBER":"","STEPS":[{"CONTENT":"\\text{A ball is thrown from 1 m above the ground.}"},{"CONTENT":"\\text{It is given an initial velocity of 20 m/s}"},{"CONTENT":"\\text{At an angle of 40 degrees above the horizontal}"}, {"CONTENT":"\\text{Find the maximum height reached}"}, {"CONTENT":"\\text{And velocity at that point}"}, {"CONTENT":"x\\left(t\\right)=v\\cos\\left(\\theta\\right)t=20\\cos\\left(40\\right)t=15.3t"},{"CONTENT":"y\\left(t\\right)=y_0+v\\sin\\left(\\theta\\right)t-\\frac{9.8t^2}{2}"},{"CONTENT":"y\\left(t\\right)=1+20\\sin\\left(40\\right)t-4.9t^2"},{"CONTENT":"y\\left(t\\right)=1+12.9t-4.9t^2"},{"CONTENT":"v_y\\left(t\\right)=v\\sin\\left(\\theta\\right)-9.8t"},{"CONTENT":"v_y\\left(t\\right)=12.9-9.8t"},{"CONTENT":"\\max\\ height\\ at\\ v_y\\left(t\\right)=0"},{"CONTENT":"12.9-9.8t=0"},{"CONTENT":"-9.8t=-12.9"},{"CONTENT":"t=\\frac{-12.9}{-9.8}=1.3"},{"CONTENT":"y\\left(1.3\\right)=1+12.9\\left(1.3\\right)-4.9\\left(1.3\\right)^2"},{"CONTENT":"y\\left(1.3\\right)=9.5\\ m"},{"CONTENT":"y\\ component\\ of\\ velocity\\ is\\ 0\\ at\\ highest\\ pt"},{"CONTENT":"total\\ velocity\\ =v_x=15.3\\ \\frac{m}{s}"}],"LAST_SHOWN_STEP":19};

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
    componentDidMount: function() {
        // React 15 doesn't support custom attributes in JSX
        var element = ReactDOM.findDOMNode(this.refs.youtubeEmbed);
        element.setAttribute("fs", "1");
        element.setAttribute("allowfullscreen", "allowfullscreen");
        element.setAttribute("mozallowfullscreen", "mozallowfullscreen");
        element.setAttribute("msallowfullscreen", "msallowfullscreen");
        element.setAttribute("oallowfullscreen", "oallowfullscreen");
        element.setAttribute("webkitallowfullscreen", "webkitallowfullscreen");
    },
	getInitialState: function() {
		return {
			emailString : ''
		}
	},
    render: function() {
        var divStyle = {
            width:"44%",
            float: "left",
            borderRadius:"3px",
            border:"1px solid #cfcfcf",
            backgroundColor:"white",
            margin:"5px",
            padding:"20px",
    		boxShadow: "0 5px 3px -3px #cfcfcf"
        };
		var divStyleNoBorder = {
			...divStyle,
    		boxShadow: "none",
    		border: "none"
		};
        var wrapperDivStyle = {
            padding:"0px 30px 0px 30px",
            //"backgroundColor":"#fafafa",
            "backgroundColor":"#ffffff",
            "marginLeft":"auto",
            "marginRight": "auto",
            width:"1024px"
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
		const handleEmailFieldChange = function(evt) {this.state.emailString = evt.target.value};
        return (
            <div style={wrapperDivStyle}>
                <div style={{display:"block", overflow:"auto"}}>
                <div style={divStyleNoBorder}>
                <h2>Meet Your New Math Classroom</h2>
                <p>Students digitally record step-by-step math work.</p>
                <p>Teachers simultaneously review all assignments with complete solutions grouped by similar final answer.</p>
                <p>Free for teachers and students.</p>
                <p>No account setup required.  Student work and grading feedback both save as files that integrate seamlessly with standard LMS tools.</p>

				<link href="//cdn-images.mailchimp.com/embedcode/classic-10_7.css" rel="stylesheet" type="text/css" />
				<div id="mc_embed_signup">
				<form action="https://freemathapp.us17.list-manage.com/subscribe/post?u=9529516f2eeb3f44372a20887&amp;id=ed42803cd3" method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" className="validate" target="_blank" style={{paddingLeft:"0px"}} noValidate>
<div id="mc_embed_signup_scroll">
    <div style={{position: "absolute", left: "-5000px"}} aria-hidden="true"><input type="text" name="b_14d49781dec57b609b6a58f1a_b843990eea" tabIndex="-1" value=""/></div>
    <input style={{float:"right", margin:"5px"}} type="submit" value="Subscribe" name="subscribe" id="mc-embedded-subscribe" className="button"/></div>
	<div style={{overflow: "hidden"}}>
    <label htmlFor="mce-EMAIL">Subscribe for updates &nbsp;&nbsp;</label>
    <input type="email" value="" name="EMAIL" className="email" size="25" id="mce-EMAIL" placeholder="email address" value={this.state.emailString} onChange={function(evt) {
				this.setState({emailString : evt.target.value});
			}.bind(this)}/>
	</div>
				</form>
				</div>

                <p><a href="https://github.com/jaltekruse/Free-Math">Source Code</a> released under Open Source License.</p>
                </div>
                <div style={{...divStyleNoBorder, float: "right"}}>
                <div ref="youtubeEmbed" style={{position:"relative",height:"0",paddingTop:"30px", "paddingBottom":"56.25%"}}><iframe src="https://www.youtube.com/embed/XYiRdKe4Zd8?ecver=2" width="640" height="360" frameBorder="0" gesture="media" style={{position:"absolute",width:"100%",height:"100%",left:0}}></iframe></div>
                </div>
                </div>
                <div style={{padding:"0px 0px 0px 0px"}}>
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
                                <br />
                                <br />
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
                        <div style={{...divStyle, float: "right"}}>
                            <h3>Teachers</h3>
                            Grade Assignments <input type="file" id="open-student-submissions-input" onChange={openAssignments}/>
                                <br />
						<small>Select a zip file full of student work, these are generated when downloading files from your LMS in bulk. <a href="https://www.wikihow.com/Make-a-Zip-File">Click here for info on zip files</a></small>
                                <br />
                            <p><a href="https://drive.google.com/uc?export=download&id=1Cgi0E4vXJ4P41nJrjEAD9my51gHc9h67">Download Example Assignments To Test Grading</a></p>
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
                        </div>
                    </div>
                </div>
					<div className="answer-incorrect" style={{display:"block", padding:"10px", margin: "10px"}}>
					<span>DATA LOSS WARNING: School districts may clear your downloads folder when logging off. It is recommended to save your files on a USB drive, LMS (Canvas, Moodle, Blackboard) or your institution's preferred cloud storage provider like Google Drive, Dropbox, etc.</span>
					</div>
                <br />
                <span id="examples" />
                <div style={{paddingTop: "80px", marginTop: "-100px"}} />
                <h2>Great for many areas of Math</h2>
                <div style={{float:"none", display:"inline-block"}}>
                    <div style={{float:"left", margin:"5px"}}>
                        <h3>Algebra</h3>
                        {renderExampleWork(algebraExample) }
                    </div>
                    <div style={{float:"left",margin:"5px"}}>
                        <h3>Calculus</h3>
                        {renderExampleWork(calculusExample) }
                    </div>
                    <div style={{float:"left", margin:"5px"}}>
                        <h3>Physics</h3>
                        {renderExampleWork(physicsExample) }
                    </div>
                </div>
                <span id="lms" />
                <div style={{paddingTop: "80px", marginTop: "-100px"}} />
                <h2>Using Free Math with an LMS</h2>
				<p>LMS products come with features for collecting documents from students and managing them in bulk. These features are often used for grading files like papers or presentations. These types of files must be examined individually for grading. One great advantage of Free Math is that all documents are graded together, with optimized actions for grading similar work.</p>
				<p>Here are some links to help for managing student files in specific LMS products. As Free Math natively opens and saves zip files, you can often avoid steps related to unzipping downloaded documents and manually creating a new zip of the graded documents when re-uploading. Keep this in mind as you follow these instructions.</p>
				<a href="https://www.umass.edu/it/support/moodle/grade-assignments-moodle" target="_blank">Moodle</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
				<a href="https://imgur.com/a/0rskc" target="_blank">Google Classroom</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
				Canvas (
					<a href="https://community.canvaslms.com/docs/DOC-12813" target="_blank">Download</a>&nbsp;&nbsp;
					<a href="https://community.canvaslms.com/docs/DOC-10003-415275096" target="_blank">Upload</a>
				)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
				<a href="https://telhelp.shu.ac.uk/batch-upload-feedback-file-attachments-grade-centre-assignments-submitted-online" target="_blank">Blackboard</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
				D2L (
					<a href="https://oit.colorado.edu/tutorial/d2l-download-all-dropbox-folder-submissions" target="_blank">Download</a>&nbsp;&nbsp;
					<a href="https://oit.colorado.edu/tutorial/d2l-upload-feedback-files" target="_blank">Upload</a>
				)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
				<a href="https://support.schoology.com/hc/en-us/articles/201001503-How-do-teachers-use-Assignment-Submissions-" target="_blank">Schoology</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;

                <span id="contact" />
                <div style={{paddingTop: "80px", marginTop: "-100px"}} />
				<br />
                <h2>Contact the Developer</h2>
                <p>If you would like to discuss how you could use Free Math in your classroom, send a message to this address. Bug reports, questions and press inquiries can be directed here as well.</p>
                <p>developers@freemathapp.org</p>
                <div>Follow the project <a href="https://www.facebook.com/freemathapp"><img alt="facebook" src="/images/facebook.png" style={{height:"35px"}}></img></a>
                    <a href="https://twitter.com/freemathapp"><img alt="twitter" src="/images/twitter.png" style={{height:"35px"}}></img></a>
    <a href="https://github.com/jaltekruse/Free-Math/issues">Report Bug or Request Feature</a>
    </div>
				<br />

                <span id="faq" />
                <div style={{paddingTop: "80px", marginTop: "-100px"}} />
                <h2>FAQ</h2>
				<p><b>Does Free Math solve math problems?</b></p>
				<p>No, Free Math allows students to record their work, but does not solve problems automatically.</p>
				<p><b>Where are the problems for Free Math?</b></p>
				<p>Free Math is designed to work with any existing exercises from a book, worksheet or digital problem bank. Students copy problems into Free Math just as they would with a paper notebook.</p>
				<p><b>Where is the answer key for grading?</b></p>
				<p>There is no need to provide Free Math with an answer key. The grading page finds similar student answers on each problem, you only need to grade each final answer once and confirm that work was provided by each student to justify reaching their answer.</p>
				<p><b>If students submit files for their assignments, how does the system prevent cheating?</b></p>
				<p>In addition to comparing individual answers, Free Math also compares students' overall documents for similarity. If two or more documents share a lot of work, they will be flagged for you to review side by side.</p>
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
            </div>
        );
    }
});

export default DefaultHomepageActions;
