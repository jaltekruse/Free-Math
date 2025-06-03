import React from 'react';
import './App.css';
import Problem from './Problem.js';
import { ScoreBox } from './Problem.js';
import { problemListReducer } from './Problem.js';
import Button from './Button.js';
import { CloseButton, HtmlButton } from './Button.js';
import FreeMathModal from './Modal.js';

// editing assignmnt mode actions
const UNTITLED_ASSINGMENT = 'Untitled Assignment';

const EDIT_ASSIGNMENT = 'EDIT_ASSIGNMENT';

var PROBLEMS = 'PROBLEMS';
// student assignment actions
var ADD_PROBLEM = 'ADD_PROBLEM';

var BUTTON_GROUP = 'BUTTON_GROUP';
var STEPS = 'STEPS';
var PROBLEM_NUMBER = 'PROBLEM_NUMBER';
var PROBLEM_INDEX  = 'PROBLEM_INDEX';
var SET_CURRENT_PROBLEM = 'SET_CURRENT_PROBLEM';
var CURRENT_PROBLEM = 'CURRENT_PROBLEM';
var REMOVE_PROBLEM = 'REMOVE_PROBLEM';
var CLONE_PROBLEM = 'CLONE_PROBLEM';
var SHIFT_PROBLEM_LEFT = 'SHIFT_PROBLEM_LEFT';
var SHIFT_PROBLEM_RIGHT = 'SHIFT_PROBLEM_RIGHT';

var SHOW_TUTORIAL = "SHOW_TUTORIAL";
var SHOW_IMAGE_TUTORIAL = "SHOW_IMAGE_TUTORIAL";
var SHOW_DRAWING_TUTORIAL = 'SHOW_DRAWING_TUTORIAL';

var SCORE = "SCORE";

var IMAGE_BEING_EDITED = 'IMAGE_BEING_EDITED';

const SET_TO_STUDENT_PRINTER_VIEW = 'SET_TO_STUDENT_PRINTER_VIEW';
const STUDENT_PRINTER_VIEW = 'STUDENT_PRINTER_VIEW';
const NAV_BACK_TO_EDIT_ASSIGNMENT = 'NAV_BACK_TO_EDIT_ASSIGNMENT';

// reducer for an overall assignment
function assignmentReducer(state, action) {
    if (state === undefined) {
        return {
            ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
            CURRENT_PROBLEM: 0,
            PROBLEMS : problemListReducer(undefined, action)
        };
    } else if (action.type === SET_TO_STUDENT_PRINTER_VIEW ) {
        return {
            ...state,
            APP_MODE : STUDENT_PRINTER_VIEW
        };
    } else if (action.type === NAV_BACK_TO_EDIT_ASSIGNMENT) {
        return {
            ...state,
            APP_MODE : EDIT_ASSIGNMENT
        };
    } else if (action.type === REMOVE_PROBLEM) {
        return { ...state,
                 PROBLEMS : problemListReducer(state[PROBLEMS], action)
        };
    } else if (action.type === ADD_PROBLEM) {
        return { ...state,
                 PROBLEMS : problemListReducer(state[PROBLEMS], action)
        };
    } else if (action.type === CLONE_PROBLEM || action.type === SHIFT_PROBLEM_LEFT || action.type === SHIFT_PROBLEM_RIGHT) {
        return { ...state,
                 PROBLEMS : problemListReducer(state[PROBLEMS], action)
        };

    } else {
        return { ...state,
                 PROBLEMS : problemListReducer(state[PROBLEMS], action)
        };
    }
}

// ProblemKebabMenu component for problem operations
class ProblemKebabMenu extends React.Component {
    state = { showMenu: false };

    toggleMenu = () => {
        this.setState({ showMenu: !this.state.showMenu });
    }

    closeMenu = () => {
        this.setState({ showMenu: false });
    }

    handleDuplicate = () => {
        window.store.dispatch({ 
            type: CLONE_PROBLEM, 
            PROBLEM_INDEX: this.props.problemIndex 
        });
        this.closeMenu();
    }

    handleShiftLeft = () => {
        if (this.props.problemIndex > 0) {
            window.store.dispatch({ 
                type: SHIFT_PROBLEM_LEFT, 
                PROBLEM_INDEX: this.props.problemIndex 
            });
            window.ephemeralStore.dispatch({
                type: SET_CURRENT_PROBLEM, 
                CURRENT_PROBLEM: this.props.problemIndex - 1
            });
        }
        this.closeMenu();
    }

    handleShiftRight = () => {
        if (this.props.problemIndex < this.props.probList.length - 1) {
            window.store.dispatch({ 
                type: SHIFT_PROBLEM_RIGHT, 
                PROBLEM_INDEX: this.props.problemIndex 
            });
            window.ephemeralStore.dispatch({
                type: SET_CURRENT_PROBLEM, 
                CURRENT_PROBLEM: this.props.problemIndex + 1
            });
        }
        this.closeMenu();
    }

    render() {
        const { problemIndex, probList, isSelected } = this.props;
        const canShiftLeft = problemIndex > 0;
        const canShiftRight = problemIndex < probList.length - 1;

        return (
            <div style={{ position: 'relative', display: 'inline-block' }}>
                <button
                    title="Problem options"
                    className={"fm-button fm-tab " + (isSelected ? "fm-tab-selected" : "")}
                    style={{
                        marginBottom: "0px",
                        borderRadius: "0px",
                        padding: "8px 6px",
                        fontSize: "16px",
                        border: "1px solid #ccc",
                        backgroundColor: isSelected ? "#fff" : "#f9f9f9"
                    }}
                    onClick={this.toggleMenu}
                >
                    ⋮
                </button>
                {this.state.showMenu && (
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: '0',
                        backgroundColor: '#fff',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        zIndex: 1000,
                        minWidth: '150px'
                    }}>
                        <button
                            style={{
                                display: 'block',
                                width: '100%',
                                padding: '8px 12px',
                                border: 'none',
                                backgroundColor: 'transparent',
                                textAlign: 'left',
                                cursor: 'pointer'
                            }}
                            onClick={this.handleDuplicate}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                            Duplicate Problem
                        </button>
                        <button
                            style={{
                                display: 'block',
                                width: '100%',
                                padding: '8px 12px',
                                border: 'none',
                                backgroundColor: 'transparent',
                                textAlign: 'left',
                                cursor: canShiftLeft ? 'pointer' : 'not-allowed',
                                opacity: canShiftLeft ? 1 : 0.5
                            }}
                            onClick={canShiftLeft ? this.handleShiftLeft : undefined}
                            onMouseEnter={(e) => canShiftLeft && (e.target.style.backgroundColor = '#f0f0f0')}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                            disabled={!canShiftLeft}
                        >
                            ← Shift Left
                        </button>
                        <button
                            style={{
                                display: 'block',
                                width: '100%',
                                padding: '8px 12px',
                                border: 'none',
                                backgroundColor: 'transparent',
                                textAlign: 'left',
                                cursor: canShiftRight ? 'pointer' : 'not-allowed',
                                opacity: canShiftRight ? 1 : 0.5
                            }}
                            onClick={canShiftRight ? this.handleShiftRight : undefined}
                            onMouseEnter={(e) => canShiftRight && (e.target.style.backgroundColor = '#f0f0f0')}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                            disabled={!canShiftRight}
                        >
                            Shift Right →
                        </button>
                    </div>
                )}
                {this.state.showMenu && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 999
                        }}
                        onClick={this.closeMenu}
                    />
                )}
            </div>
        );
    }
}

class Assignment extends React.Component {
    state = { showModal: true };

    render() {
        // Microsoft injected the word iPhone in IE11's userAgent in order to try and fool
        // Gmail somehow. Therefore we need to exclude it. More info about this here and here.
        // https://stackoverflow.com/questions/9038625/detect-if-device-is-ios
        var browserIsIOS = false; ///iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        var probList = this.props.value[PROBLEMS];
        var currProblem = this.props.value[CURRENT_PROBLEM];

        // clean up defensively, this same property is used for the teacher view or student view
        // but here it represents an integer index into the list of problems, but for the teacher
        // view it is a string typed as a problem number
        if (typeof probList[currProblem] === 'undefined') {
            console.log("auto fixing current problem");
            let probs = this.props.value[PROBLEMS];
            currProblem = probs.length - 1;
            window.ephemeralStore.dispatch(
                {type: SET_CURRENT_PROBLEM, CURRENT_PROBLEM: currProblem});
        }
        var addProblem = function() {
            var probs = this.props.value[PROBLEMS];
            var lastProb = probs[probs.length - 1];
            window.ga('send', 'event', 'Actions', 'edit',
                'Add Problem - last problem steps = ', lastProb[STEPS].length);
            window.store.dispatch({ type : ADD_PROBLEM});
            window.ephemeralStore.dispatch({ type : SET_CURRENT_PROBLEM, CURRENT_PROBLEM: probs.length });
        }.bind(this);
        return (
        <div style={{backgroundColor:"#f9f9f9"}}>
            <FreeMathModal
                closeModal={function() {
                            this.setState({ showModal: false});
                        }.bind(this)}
                showModal={this.state.showModal &&
                            ( probList[currProblem][SHOW_TUTORIAL]
                              || probList[currProblem][SHOW_IMAGE_TUTORIAL] )}
                content={(
                    <div>
                        <iframe title="Free Math Video"
                            src="https://www.youtube.com/embed/x6EiDUYJx_s"
                            allowFullScreen frameBorder="0"
                            className="tutorial-video"
                            ></iframe>
                    </div>
                    )
                } />
            <div style={{minHeight: "100vh", padding:"30px 15px 100px 15px"}}>
            <div className="menubar-spacer-small"> </div>
            <div style={{ marginLeft:"20px", display: "flex", flexWrap: "wrap"}}>
            <div style={{display: 'block', width: '100%'}}>
                {(probList[currProblem][SHOW_TUTORIAL] || probList[currProblem][SHOW_IMAGE_TUTORIAL]
                    || probList[currProblem][SHOW_DRAWING_TUTORIAL]
                ) && !browserIsIOS ?
                    (
                        <div className="answer-partially-correct"
                         style={{float: "right", display:"inline-block", padding:"5px", margin: "5px"}}>
                            <span>Work saves to the Downloads folder on your device, or you can save it directly to Google Drive or Google Classroom.</span>
                        </div>) :
                    null
                }
                {browserIsIOS ?
                    (
                        <div className="answer-incorrect"
                         style={{float: "right", display:"inline-block", padding:"5px", margin: "5px"}}>
                            <span>Due to a browser limitation, you currently cannot save work in iOS. This demo can
                                  be used to try out the experience, but you will need to visit the site on your Mac,
                                  Widows PC, Chromebook or Android device to actually use the site.</span>
                        </div>) :
                    null
                }
            </div>
            {probList.map(function(problem, problemIndex) {
                var probNum = problem[PROBLEM_NUMBER];
                var label;
                if (probNum.trim() !== '') {
                    if (probList.length < 8) {
                        label = "Problem " + probNum;
                    } else  if (probList.length < 12) {
                        label = "Prob " + probNum;
                    } else {
                        label = "P " + probNum;
                    }
                } else {
                    label = "[Need to Set a Problem Number]";
                }
                return (
                    <div style={{
                        float : 'left',
                        WebkitBoxAlign: 'center',
                        alignItems: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        textAlign: 'center',
                        marginRight: '0px'}}
			key={"wrapper_" + problemIndex}>

                    {/* bit of a hack for alignment */
                        probList.filter(function(problem) { return problem[SCORE] !== undefined } ).length > 0
                            ? ( problem[SCORE] !== undefined /* show the real score box, or a fake hidden one for alignment */
                                ?
                                <ScoreBox value={problem} onClick={function() {
                                    window.ephemeralStore.dispatch(
                                        {type: SET_CURRENT_PROBLEM, CURRENT_PROBLEM: problemIndex})}}/>
                                :
                                <div style={{visibility:"hidden"}}>
                                    <ScoreBox value={{SCORE: 1, POSSIBLE_POINTS: 1, STEPS: []}} />
                                </div>)
                            : null
                    }
                    <div>
                        <Button text={label} title={"View " + label} key={problemIndex} id={problemIndex}
                            className={"fm-button-left fm-button fm-tab " + ((problemIndex === currProblem) ? "fm-tab-selected" : "")}
                            style={{marginBottom: "0px", borderRadius: "15px 0px 0px 0px"}}
                            onClick={function() {
                                window.ephemeralStore.dispatch(
                                    {type: SET_CURRENT_PROBLEM, CURRENT_PROBLEM: problemIndex})}}
                        />
                        <ProblemKebabMenu 
                            problemIndex={problemIndex}
                            currProblem={currProblem}
                            probList={probList}
                            isSelected={problemIndex === currProblem}
                        />
                        <HtmlButton text="&#10005;"
                            title="Delete problem" key={problemIndex + " close"}
                            className={"fm-button-right fm-button fm-tab " + ((problemIndex === currProblem) ? "fm-tab-selected" : "")}
                            style={{marginBottom: "0px", borderRadius: "0px 15px 0px 0px"}}
                            onClick={
                                function() {
                                    if (this.props.value[PROBLEMS].length === 1) {
                                        alert("Cannot delete the only problem in a document.");
                                        return;
                                    }
                                    if (!window.confirm("Are you sure you want to delete this problem?")) { return; }
                                    window.ephemeralStore.dispatch(
                                        {type: SET_CURRENT_PROBLEM, CURRENT_PROBLEM: Math.max(0, currProblem - 1)});
                                    window.store.dispatch(
                                        { type : REMOVE_PROBLEM, PROBLEM_INDEX : problemIndex})
                            }.bind(this)}
                            content={(<img src="images/close_dark.png" alt="x"/>)}
                        />
                    </div>
                    </div>
                );
            }.bind(this))}

            <div style={{
                float : 'left',
                WebkitBoxAlign: 'center',
                alignItems: 'center',
                display: 'flex',
                flexDirection: 'column',
                textAlign: 'center',
                marginRight: '15px'}}>
                {/* bit of a hack for alignment */
                    probList.filter(function(problem) { return problem[SCORE] !== undefined } ).length > 0
                        ? (<div style={{visibility:"hidden"}}>
                            <ScoreBox value={{SCORE: 1, POSSIBLE_POINTS: 1, STEPS: []}} />
                           </div>)
                        : null
                }
                <Button text="Add Problem" className="fm-button-green fm-button"
                        style={{marginRight: "15px", marginBottom: "0px", borderRadius: "15px 15px 0px 0px"}}
                        onClick={function() {
                    addProblem();
                }}/>
            </div>
            {(probList[currProblem][SHOW_TUTORIAL] || probList[currProblem][SHOW_IMAGE_TUTORIAL]) ?
                    (<Button text="Reopen Demo Video"
                        style={{marginRight: "15px", marginBottom: "0px", borderRadius: "15px 15px 0px 0px", backgroundColor: "#dc0031"}}
                        title="Reopen Demo Video"
                        onClick={function() {
                            this.setState({showModal: true});
                    }.bind(this)}/>) : null
            }
            </div>
            <Problem value={probList[currProblem]}
                     id={currProblem}
                     buttonGroup={this.props.value[BUTTON_GROUP]}
                     imageBeingEdited={this.props.value[IMAGE_BEING_EDITED]}
            />
            </div>
            {/* Replaced by better onscreen math keyboard with shortcuts in
                the title text of the buttons
            <Button onClick={this.toggleModal} text={this.state.showModal ? "Hide Symbol List" : "Show Available Symbol List" } />
                this.state.showModal ? <MathEditorHelp /> : null */}
            <div style={{"width" : "100%", "margin":"100px 0px 0px 0px",
                             "padding":"50px 0px 70px 0px",
                             "backgroundColor": "rgba(10,0,30,1)",
                              color: "#eee"
                             }}>
            <div style={{"padding":"0px 100px 0px 100px"}}>
                    <p>
                        <a className="lightLink" target="_blank" href="privacyPolicy.html">Privacy Policy</a>
                        &nbsp;&nbsp;&nbsp;
                        <a className="lightLink" target="_blank" href="acknowledgements.html">
                            Creative Commons Media and Open Source Code Used in this Site
                        </a>
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
      )
    }
}

export { Assignment as default, assignmentReducer };
