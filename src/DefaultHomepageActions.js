import React from 'react';
import ReactDOM from 'react-dom';
import './App.css';
import TeX from './TeX.js';
import LogoHomeNav from './LogoHomeNav.js';
import FreeMath from './FreeMath.js';
import Button from './Button.js';
import demoGradingAction from './demoGradingAction.js';
import createReactClass from 'create-react-class';
import { studentSubmissionsZip } from './TeacherInteractiveGrader.js';
import { readSingleFile } from './AssignmentEditorMenubar.js';

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

export function render() {
    window.MathQuill = MathQuill.getInterface(1);
    ReactDOM.render(
        <FreeMath value={window.store.getState()} />,
        document.getElementById('root')
    );
}

const UserActions = createReactClass({
    render: function() {
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
        var halfScreenStyle= {
            width:"44%",
            height: "auto",
            float: "left",
            borderRadius:"3px",
            margin:"5px 5px 40px 5px",
            padding:"20px",
        }
        var divStyle = {
                ...halfScreenStyle,
            border:"1px solid #cfcfcf",
            boxShadow: "0 5px 3px -3px #cfcfcf"
        };
        return (
            <div style={{
                    "max-width": "900px",
                    "-webkit-box-align": "center",
                    "align-items": "center",
                    "display": "flex",
                    "flex-direction": "column",
                    "marginLeft":"auto",
                    "marginRight": "auto"
            }}>
            <div style={{display:"inline-block", width:"100%"}}>
            <div>
                <div style={divStyle}>
                    <h3>Students</h3>
                        New Assignment &nbsp;&nbsp;&nbsp;
                        <Button type="submit" text="Create" onClick={
                            function() {
                                // turn on confirmation dialog upon navigation away
                                window.onbeforeunload = function() {
                                        return true;
                                };
                                window.store.dispatch({type : "NEW_ASSIGNMENT"});
                            }}
                        /><br />

                        Open Assignment &nbsp;&nbsp;&nbsp;
                        <input type="file" id="open-file-input" onChange={
                            function(evt) {
                                // turn on confirmation dialog upon navigation away
                                window.onbeforeunload = function() {
                                        return true;
                                };
                                readSingleFile(evt, false /*don't warn about data loss*/);
                        }}/>
                        <br />
                        <br />
                        { (recoveredStudentDocs.length > 0) ?
                            (<h4>Recovered Assignments</h4>) : null }
                        { (recoveredStudentDocs.length > 0) ?

                                recoveredStudentDocs.map(function(docName, docIndex) {
                                    return (
                                        <div key={docName}>
                                            <Button type="submit" text="Open"
                                                    onClick={function() {
                                                        recoverAutoSaveCallback(docName)}
                                                    } />
                                            <Button type="submit" text="Delete"
                                                    onClick={function() {
                                                        deleteAutoSaveCallback(docName)}
                                                    } />
                                        {docName.replace("auto save students ","")
                                            .replace(/:\d\d\..*/, "")}</div>
                                    );
                                })
                           : null
                        }
                        { (recoveredStudentDocs.length > 0) ?
                            (<p>Recovered assignments stored temporarily in your
                                browser, save to your device as soon as 
                                possible</p>) : null}
                </div>
                <div style={{...divStyle}}>
                    <h3>Teachers</h3>
                    Grade Assignments <input type="file" onChange={openAssignments}/>
                        <br />
                    <small> Select a zip file full of student work, these are generated
                            when downloading files from your LMS in bulk. 
                        <a href="https://www.wikihow.com/Make-a-Zip-File">
                            More info on zip files
                        </a>
                    </small>
                        <br />
                    { (recoveredTeacherDocs.length > 0) ?
                        (<h4>Recovered Grading Sessions</h4>) : null }
                    { (recoveredTeacherDocs.length > 0) ?
                        recoveredTeacherDocs.map(function(docName, docIndex) {
                            return (
                            <div key={docName}>
                                <Button text="Open" onClick={
                                    function() {recoverAutoSaveCallback(docName)}} />
                                <Button text="Delete" onClick={
                                    function() {deleteAutoSaveCallback(docName)}}
                                />
                                {docName.replace("auto save teachers ","")
                                    .replace(/:\d\d\..*/, "")}</div>
                                );
                            })
                       : null
                    }
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
});

const DefaultHomepageActions = createReactClass({
    componentDidMount: function() {
    },
    getInitialState: function() {
        return {
            emailString : ''
        }
    },
    render: function() {
        var halfScreenStyle= {
            width:"44%",
            height: "auto",
            float: "left",
            borderRadius:"3px",
            margin:"5px 5px 40px 5px",
            padding:"10px",
        }
        var divStyle = {
                ...halfScreenStyle,
            border:"1px solid #cfcfcf",
            boxShadow: "0 5px 3px -3px #cfcfcf"
        };
        var demoButtonStyle = {
            ...halfScreenStyle,
            width:"350px",
            borderRadius:"60px",
            "text-align": "center",
        };
        var wrapperDivStyle = {
            padding:"0px 0px 0px 0px",
            "backgroundColor":"#ffffff",
            "marginLeft":"auto",
            "marginRight": "auto",
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
        return (
            <div>
            <div className="menuBar">
                <div style={{width:1024,marginLeft:"auto", marginRight:"auto"}} className="nav">
                    <LogoHomeNav />
                    <div className="navBarElms" style={{float:"right"}}>
                    <a href="#gettingStarted" style={{color:"white"}} >Getting Started</a>&nbsp;&nbsp;&nbsp;&nbsp;
                    <a href="#contact" style={{color:"white"}} >Contact</a>&nbsp;&nbsp;&nbsp;&nbsp;
                    <a href="#faq" style={{color:"white"}} >FAQ</a>&nbsp;&nbsp;&nbsp;&nbsp;
                    <a href="#license" style={{color:"white"}} >License</a>&nbsp;&nbsp;&nbsp;&nbsp;
                    </div>
                </div>
            </div>
            <div style={wrapperDivStyle}>
                    <h1 style={{"-webkit-box-align": "center",
                                "align-items": "center",
                                "display": "flex",
                                "flex-direction": "column",
                                "font-size": "60",
                                "font-weight": "600",
                                "line-height": "70",
                                "max-width": "850px",
                                "text-align": "center",
                                "margin": "0px auto 0px auto",
                                "padding":"50px 0px 0px 0px"
                    }}>
            <br />
            Give your students feedback, meaningfully and efficiently. <br /><br /></h1>
            <div style={{"padding":"0px 0px 75px 0px",
                    "-webkit-box-align": "center",
                    "align-items": "center",
                    "display": "flex",
            }}>
            <div style={{
                    "width": "100%",
                    "-webkit-box-align": "center",
                    "align-items": "center",
                    "display": "flex",
                    "flex-direction": "column",
                    "font-size": "3.6em",
                    "font-weight": "600",
                    "letter-spacing": "-2px",
                    "line-height": "1.2em",
                    "text-align": "center",
                    "marginLeft":"auto",
                    "marginRight": "auto"
            }}>
            <div style={{"padding":"0px 0px 75px 0px"}}>
            <button className="fm-button" style={{...demoButtonStyle, "float" : "left"}} 
                onClick={function() {
                    // turn on confirmation dialog upon navigation away
                    window.onbeforeunload = function() {
                            return true;
                    };
                    window.store.dispatch({type : "NEW_ASSIGNMENT"});
                    window.store.dispatch({type : ADD_DEMO_PROBLEM});
                }}
            >
                <h3 style={{color:"#eeeeee", "font-size": "1.5em"}}>Demo Student Experience</h3>
            </button>
            <button className="fm-button" style={{...demoButtonStyle, "float" : "left"}} 
                onClick={function() {
                    window.store.dispatch(demoGradingAction);
                }}
            >
                <h3 style={{color:"#eeeeee", "font-size": "1.5em"}}>Demo Teacher Grading</h3> 
            </button>
            </div>
            </div>
            </div>
            <UserActions />
            <div style={{padding:"0px 0px 0px 0px", width: "100%", "display":"inline-block"}}>
                <br />
                <div style={{"padding":"0px 0px 0px 30px"}}>
                    <div style={{"float": "left", "width": "40vw", "padding":"8vw 0px 0px 0px"}}>
                        <h2>Students Show Step-by-Step Work</h2>
                        <p>They create their assignments directly from problems
                            in your existing materials, no setup required.</p>
                    </div>
                    <div style={{"float": "right",
                                  "width": "50vw",
                                  "box-shadow": "rgb(176, 177, 178) 0px 10px 50px",
                                "-webkit-box-align": "center",
                                    "align-items": "center",
                                    "text-align": "center",
                                    "marginTop":"auto",
                                    "marginButtom": "auto"
                    }}>
                    <video alt="student.webm" autoPlay muted playsinline loop width="100%"><track kind="captions" />
                        <source src="free_math_assignment.mp4" type="video/mp4" /></video>
                    </div>
                </div>
                <div style={{"padding":"300px 0px 0px 0px", "display":"inline-block"}}>
                    <div style={{"float": "left", "display": "flex",
                                  "width": "50vw",
                                  "box-shadow": "rgb(176, 177, 178) 0px 10px 50px",
                                "-webkit-box-align": "center",
                                    "align-items": "center",
                                    "text-align": "center",
                                    "marginTop":"auto",
                                    "marginButtom": "auto"
                    }}>
                        <video alt="student.webm" autoPlay muted playsinline loop width="100%">
                            <track kind="captions" />
                            <source src="free_math_grading.mp4" type="video/mp4" /></video>
                    </div>
                    <div style={{"float": "right", "width": "35vw", "padding":"8vw 0px 0px 80px"}}>
                        <h2>Simultaneously Review All Assignments</h2>
                        <p>Complete solutions are shown, grouped by similar final answer.</p>
                    </div>
                </div>
                <div style={{"padding":"300px 0px 0px 0px", "align-items": "center", "text-align": "center"}}>
                    <h2>Analytics Show Where Students Struggled</h2>
                    <p>Give feedback on the most impactful problems first, <br />
                        everything else gets completion points.</p>
                    <img style={{"width":"100%",
                                  "box-shadow": "rgb(176, 177, 178) 0px 10px 50px",
                               }}
                         alt="grading_analytics_graph"
                         src="images/teacher_grading_analytics.png"/>
                </div>
                <div style={{"padding":"300px 0px 0px 0px", "align-items": "center", "text-align": "center"}}>
                    <h2>Integrates with Your Favorite LMS<br /><br /></h2>
                    <img style={{margin : "20px"}}
                         alt="google classroom logo"
                         src="images/google_classroom.png"/>
                    <img style={{margin : "20px"}}
                         alt="canvas logo"
                         src="images/canvas.png"/>
                    <img style={{margin : "20px"}}
                         alt="moodle logo"
                         src="images/moodle.png"/>
                    <img style={{margin : "20px"}}
                         alt="moodle logo"
                         src="images/blackboard.png"/>
                </div> 
                <div style={{"width" : "100%", "margin":"200px 0px 0px 0px",
                             "padding":"50px 0px 50px 0px",
                             "background": "linear-gradient(180deg, rgba(10,0,30,1) 0%, rgba(41,0,70,1) 65%)"
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
                            <p style={{color: "#eee"}}>
                                Join our e-mail list to find out first about new features and updates to the site.
                            </p>
                            <input type="email" name="EMAIL" className="email" size="25" 
                                   id="mce-EMAIL" placeholder="  email address"
                                   style={{"border": "0px"}}
                                   value={this.state.emailString}
                                   onChange={function(evt) {
                                            this.setState({emailString : evt.target.value});
                                   }.bind(this)}/>
                        <input style={{margin:"10px"}} type="submit"
                           value="Subscribe" name="subscribe" id="mc-embedded-subscribe"
                           className="fm-button-light"/>
	            </div>
	            </div>
		    </form>
		    </div>
		</div>
                <div style={{"padding":"200px 0px 0px 0px", "align-items": "center", "text-align": "center"}}>
                <h2>Great for Many Areas of Math</h2>
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
                </div>
            </div>
            </div>
            </div>
        );
    }
});


export default DefaultHomepageActions;
