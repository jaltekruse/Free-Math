import React from 'react';
import './App.css';
import TeX from './TeX.js';
import Button from './Button.js';
import { getPersistentState } from './FreeMath.js';
import ImageEditor from '@toast-ui/react-image-editor'

// when grading google classroom docs, show student name instead of filename
var STUDENT_NAME = 'STUDENT_NAME';
var STUDENT_FILE = 'STUDENT_FILE';

var SCORE = "SCORE";
var FEEDBACK = "FEEDBACK";

// teacher grade page model properties
var CONTENT = "CONTENT";
var FORMAT = "FORMAT";
var IMG = "IMG";
// var MATH = "MATH";
var TEXT = "TEXT";

// action properties
// PROBLEM_NUMBER, SOLUTION_CLASS_INDEX, SCORE, SOLUTION_INDEX
var GRADE_SINGLE_SOLUTION = "GRADE_SINGLE_SOLUTION";
// action properties
// PROBLEM_NUMBER, SOLUTION_CLASS_INDEX, SCORE
var GRADE_CLASS_OF_SOLUTIONS = "GRADE_CLASS_OF_SOLUTIONS";
// action properties: MODE (JUST_UNGRADED | ALL)
var JUST_UNGRADED = "JUST_UNGRADED"
var ALL = "ALL";

var HIGHLIGHT_STEP = 'HIGHLIGHT_STEP';

var SET_PROBLEM_FEEDBACK = "SET_PROBLEM_FEEDBACK";
var STEPS = 'STEPS';
var STEP_KEY = 'STEP_KEY';
var SUCCESS = 'SUCCESS';
var ERROR = 'ERROR';
var HIGHLIGHT = 'HIGHLIGHT';

// CSS constants
var RED = '#FF99CC';
var GREEN = '#2cff72';

var SET_PROBLEM_POSSIBLE_POINTS = "SET_PROBLEM_POSSIBLE_POINTS";
var POSSIBLE_POINTS = "POSSIBLE_POINTS";

var OLD_POSSIBLE_POINTS = "OLD_POSSIBLE_POINTS";

// only added here to navigate down the global state to count number of solutions a bulk apply
// will impact
var UNIQUE_ANSWERS = 'UNIQUE_ANSWERS';
var PROBLEMS = 'PROBLEMS';
var STUDENT_WORK = "STUDENT_WORK";

// refers to passing complete step info in an action
//oldStep = {CONTENT : "", FORMAT: "MATH", HIGHTLIGHT: "SUCCESS"};
// current format MATH isn't used, no format implies math
var STEP_DATA = "STEP_DATA";
var EDIT_STUDENT_STEP = 'EDIT_STUDENT_STEP';
// allow revert of teacher edits
var ORIG_STUDENT_STEP = 'ORIG_STUDENT_STEP';

function singleSolutionReducer(state, action) {
    if (action.type === GRADE_SINGLE_SOLUTION) {
        // currently no validation here
        // Apply to all has been modified not to just apply the score, but also
        // the feedback, so also include the feedback in this update
        // TODO - add validation to prevent overrriding custom feedback on a single
        // problem with a bulk action
        let ret = { ...state,
                    SCORE : action[SCORE]};
        if (action[FEEDBACK] !== undefined) {
            ret[FEEDBACK] = action[FEEDBACK];
        }
        return ret;
    } else if (action.type === EDIT_STUDENT_STEP ) {
        var origStudentStep = state[STEPS][action[STEP_KEY]][ORIG_STUDENT_STEP];
        if (typeof origStudentStep === 'undefined') {
            origStudentStep = state[STEPS][action[STEP_KEY]];
        }
        return { ...state,
            STEPS : [
                ...state[STEPS].slice(0, action[STEP_KEY]),
                { ...state[STEPS][action[STEP_KEY]],
                  ...action[STEP_DATA],
                  ORIG_STUDENT_STEP: origStudentStep },
                ...state[STEPS].slice(action[STEP_KEY] + 1)
            ]
        };
    } else if (action.type === HIGHLIGHT_STEP) {
        var oldHighlight = state[STEPS][action[STEP_KEY]][HIGHLIGHT];
        var newHighlight;
        if (oldHighlight === undefined)
            newHighlight = ERROR;
        else if (oldHighlight === ERROR)
            newHighlight = SUCCESS;
        else if (oldHighlight === SUCCESS)
            newHighlight = undefined;

        var newState = { ...state,
            STEPS : [
                ...state[STEPS].slice(0, action[STEP_KEY]),
                { ...state[STEPS][action[STEP_KEY]], HIGHLIGHT : newHighlight},
                ...state[STEPS].slice(action[STEP_KEY] + 1)
            ]
        };
        return newState;
    } else if (action.type === SET_PROBLEM_FEEDBACK) {
        return { ...state,
                 FEEDBACK : action[FEEDBACK] };
    } else if (action.type === SET_PROBLEM_POSSIBLE_POINTS) {
        if (Number(state[SCORE]) > 0) {
            var newScore = scaleScore(state[SCORE], action[OLD_POSSIBLE_POINTS], action[POSSIBLE_POINTS]);
            return { ...state,
                     SCORE : newScore };
        } else {
            return state;
        }
    } else {
        return state;
    }
}

function scaleScore(score, oldPossiblePoints, newPossiblePoints) {
    const isNaN = function(input) {
        return typeof input === 'number' && input !== input;
    }
    if (Number(newPossiblePoints) === 0) {
        return 0;
    } else if (isNaN(Number(newPossiblePoints))) {
        return 0;
    }
    // round to 2 decimal places
    const ret = Math.round(
        100 * ( Number(score) / Number(oldPossiblePoints) ) * Number(newPossiblePoints)) / 100.0;
    if (ret === Infinity) {
        return Number(newPossiblePoints);
    }
    return ret;
}


class ImageStep extends React.Component {
    editorRef = React.createRef();
    state = {
        imageMarkup : false
    };
    render = () => {
        var step = this.props.step;
        var problemNumber = this.props.problemNumber
        var solutionClassIndex = this.props.solutionClassIndex;
        var studentSolutionIndex = this.props.studentSolutionIndex ;
        var stepIndex = this.props.stepIndex;
        return (
            <span>
            <Button className="extra-long-problem-action-button fm-button"
                    text={this.state.imageMarkup ?
                        "Save Feedback" : "Mark Image Feedback" }
                    title={this.state.imageMarkup ?
                        "Save Feedback" : "Mark Image Feedback" }
                    onClick={function() {
                        if (this.state.imageMarkup) {
                            window.ga('send', 'event', 'Actions', 'save', 'Marked image feedback');
                            const editorInstance = this.editorRef.current.getInstance();
                            console.log(editorInstance);
                            window.store.dispatch({
                                type : EDIT_STUDENT_STEP,
                                PROBLEM_NUMBER : problemNumber,
                                SOLUTION_CLASS_INDEX : solutionClassIndex,
                                SOLUTION_INDEX : studentSolutionIndex,
                                STEP_KEY : stepIndex,
                                STEP_DATA :
                                    {...step,
                                     CONTENT: editorInstance.toDataURL()}});
                            this.setState({imageMarkup: false});
                        } else {
                            this.setState({imageMarkup: true});
                        }
                    }.bind(this)}
            />
            {this.state.imageMarkup
                ?
                    <Button className="extra-long-problem-action-button fm-button"
                        text="Cancel"
                        onClick={function() {
                            const editorInstance = this.editorRef.current.getInstance();
                            console.log(editorInstance);
                            //this.setState({imageMarkup: false});
                        }.bind(this)} />
                :
                    (step[ORIG_STUDENT_STEP] ?
                    <Button className="extra-long-problem-action-button fm-button"
                        text="Revert Image Feedback"
                        title="Revert Image Feedback"
                        onClick={function() {
                            // TODO - save modified image
                            window.store.dispatch({
                                type : EDIT_STUDENT_STEP,
                                PROBLEM_NUMBER : problemNumber,
                                SOLUTION_CLASS_INDEX : solutionClassIndex,
                                SOLUTION_INDEX : studentSolutionIndex,
                                STEP_KEY : stepIndex,
                                STEP_DATA : step[ORIG_STUDENT_STEP]
                            });
                        }}
                    />
                    : null)
            }
            <br />
            { this.state.imageMarkup ?
                <div style={{display:"inline-block"}}>
                <ImageEditor
                    ref={this.editorRef}
                    includeUI={{
                      loadImage: {
                        path: step[CONTENT],
                        name: 'SampleImage'
                      },
                      menu: ['draw', 'shape', 'text'],
                      initMenu: 'draw',
                      uiSize: {
                        width: '500px',
                        height: '700px'
                      },
                      menuBarPosition: 'top'
                    }}
                    cssMaxWidth={500}
                    cssMaxHeight={450}
                    selectionStyle={{
                      cornerSize: 20,
                      rotatingPointOffset: 70
                    }}
                    usageStatistics={false}
                  />
                  </div>
                :
                <img src={step[CONTENT]} alt="Uploaded student work"
                     style={{margin : "10px", maxWidth: "500px"}}/>
            }
            </span>
        )
    }
}

class StudentWork extends React.Component {
    state = {
        imageMarkup : false
    };
    render = () => {
        var data = this.props.solutionGradeInfo;
        var problemNumber = this.props.problemNumber
        var solutionClassIndex = this.props.solutionClassIndex;
        var studentSolutionIndex = this.props.id;
        return (
            <div style={{float:"left", minWidth: "400px", maxWidth:"750px"}}>
                {
                data[STEPS].map(function(step, stepIndex) {
                    var stepStyle = {};
                    if (step[HIGHLIGHT] === ERROR) stepStyle = {backgroundColor : RED}
                    else if (step[HIGHLIGHT] === SUCCESS) stepStyle = {backgroundColor : GREEN}

                    return (
                        <div style={{marginTop:"10px"}} key={stepIndex + ' ' + step[HIGHLIGHT]}>

                            <div>
                            { step[FORMAT] === IMG
                                ?
                                <ImageStep step={step}
                                           problemNumber={problemNumber}
                                           solutionClassIndex={solutionClassIndex}
                                           studentSolutionIndex={studentSolutionIndex}
                                           stepIndex={stepIndex}
                                />
                                :
                                step[FORMAT] === TEXT
                                ?
                                    <div className="student-step-grader" style={{...stepStyle, margin: "5px"}}
                                        onClick={function() {
                                                window.store.dispatch({ type : HIGHLIGHT_STEP,
                                                    PROBLEM_NUMBER : problemNumber,
                                                    SOLUTION_CLASS_INDEX : solutionClassIndex,
                                                    SOLUTION_INDEX : studentSolutionIndex,
                                                    STEP_KEY : stepIndex});
                                    }}>
                                        {step[CONTENT]}
                                    </div>
                                :
                                <div className="student-step-grader">
                                    <TeX style={stepStyle} onClick={function() {
                                        window.store.dispatch({ type : HIGHLIGHT_STEP,
                                                        PROBLEM_NUMBER : problemNumber,
                                                        SOLUTION_CLASS_INDEX : solutionClassIndex,
                                                        SOLUTION_INDEX : studentSolutionIndex,
                                                        STEP_KEY : stepIndex});
                                        }}>
                                        {typeof(step[CONTENT]) === 'string'
                                            ? step[CONTENT]
                                            : "\\text{corruption occured}"}
                                    </TeX>
                                </div>
                            }
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }
}

class SolutionGrader extends React.Component {
    setScore = (evt) => {
        var problemNumber = this.props.problemNumber
        var solutionClassIndex = this.props.solutionClassIndex;
        var studentSolutionIndex = this.props.id;
        window.store.dispatch({ type : GRADE_SINGLE_SOLUTION, PROBLEM_NUMBER : problemNumber,
                         SOLUTION_CLASS_INDEX : solutionClassIndex, SCORE : evt.target.value,
                         SOLUTION_INDEX : studentSolutionIndex});
    };

    fullPoints = (evt) => {
        var problemNumber = this.props.problemNumber
        var solutionClassIndex = this.props.solutionClassIndex;
        var studentSolutionIndex = this.props.id;
        window.store.dispatch({ type : GRADE_SINGLE_SOLUTION, PROBLEM_NUMBER : problemNumber,
                         SOLUTION_CLASS_INDEX : solutionClassIndex,
                         SCORE : this.props.possiblePoints, SOLUTION_INDEX : studentSolutionIndex});
    };

    applyScoreToAll = (evt) => {
        var data = this.props.solutionGradeInfo;
        var problemNumber = this.props.problemNumber;
        var solutionClassIndex = this.props.solutionClassIndex;

        // TODO - little bit of a hack accessing global state here
        var globalState = getPersistentState();
        var groupSize = globalState[PROBLEMS][problemNumber][UNIQUE_ANSWERS][solutionClassIndex][STUDENT_WORK].length;
        window.ga('send', 'event', 'Actions', 'edit', 'Apply Score to All', groupSize);
        // TODO - check if any unique grades have been applied to student solutions other than this one in
        // this solution class
        // if not, just send the action through, otherwise prompt a warning about losing grades
        // this is to prevent loss of work if a teacher already gave specific grades to a
        // few students, it is necessary to have this feature to allow re-grading a whole group
        // which is not possible with "apply to ungraded"
        // TODO - inside of this component I shouldn't really know about all of the other solutions
        // in this group, as this is just rendering a single problems grader. Could pass down callback
        // that doesn't expose the data completely but just allows this check to be made

        window.store.dispatch({ type : GRADE_CLASS_OF_SOLUTIONS, MODE : ALL, PROBLEM_NUMBER : problemNumber,
                         SOLUTION_CLASS_INDEX : solutionClassIndex, SCORE : data[SCORE],
                         FEEDBACK : data[FEEDBACK]});
    };

    applyScoreToUngraded = (evt) => {
        var data = this.props.solutionGradeInfo;
        var problemNumber = this.props.problemNumber;
        var solutionClassIndex = this.props.solutionClassIndex;
        window.store.dispatch({ type : GRADE_CLASS_OF_SOLUTIONS, MODE : JUST_UNGRADED,
                         PROBLEM_NUMBER : problemNumber, SOLUTION_CLASS_INDEX : solutionClassIndex,
                         SCORE : data[SCORE], FEEDBACK : data[FEEDBACK]
                        });
    };

    setFeedback = (evt) => {
        var problemNumber = this.props.problemNumber
        var solutionClassIndex = this.props.solutionClassIndex;
        var studentSolutionIndex = this.props.id;
        window.store.dispatch({ type : SET_PROBLEM_FEEDBACK, PROBLEM_NUMBER : problemNumber,
                         SOLUTION_CLASS_INDEX : solutionClassIndex, FEEDBACK : evt.target.value,
                         SOLUTION_INDEX : studentSolutionIndex});
    };

    setQuickFeedback = (text) => {
        var problemNumber = this.props.problemNumber
        var solutionClassIndex = this.props.solutionClassIndex;
        var studentSolutionIndex = this.props.id;
        window.store.dispatch({ type : SET_PROBLEM_FEEDBACK, PROBLEM_NUMBER : problemNumber,
                         SOLUTION_CLASS_INDEX : solutionClassIndex, FEEDBACK : text,
                         SOLUTION_INDEX : studentSolutionIndex});
    };

    render() {
        var data = this.props.solutionGradeInfo;
        var problemNumber = this.props.problemNumber
        var possiblePoints = this.props.possiblePoints;
        var solutionClassIndex = this.props.solutionClassIndex;
        var studentSolutionIndex = this.props.id;
        var viewingSimilarGroup = this.props.viewingSimilarGroup;
        //var showStudentName = this.props.showStudentName;
        var showStudentName = true;
        var correctness;
        // TODO - look up react/redux best practices with stuff like this
        // keep possiblePoints as a string in the model to allow it to be
        // empty string while editing the text
        var score = Number(data[SCORE]);
        var feedback = data[FEEDBACK];
        // TODO - replace with classNames library - https://github.com/JedWatson/classnames
        // or computed inline styles, sharing through explicit imports/passing down
        var possiblePointsNum = Number(possiblePoints);
        // TODO - consider if empty string is the best way to convey "not yet scored"/complete
        if (data[SCORE] === "") {
            correctness = "answer-complete";
        } else if (score === 0) {
            correctness = "answer-incorrect";
        } else if (score >= possiblePointsNum) {
            correctness = "answer-correct";
        } else {
            correctness = "answer-partially-correct";
        }
        var classes = "student-work " + correctness;
        var outerThis = this;
        const feedbackButton = function(shortDescription, fullText) {
            return (
                <Button type="submit" text={shortDescription}
                        onClick={
                            function() {
                                this.setQuickFeedback(fullText);
                            }.bind(outerThis)
                        }/>
            );
        };
        // header message for complete status or extra credit notification
        var gradingNotice = '';
        if (data[SCORE] === '') {
            gradingNotice = 'Complete - Full Credit';
        } else if (score && score > possiblePoints) {
            gradingNotice = 'Extra Credit';
        }
        return (
            <div className={classes} style={{float:"left"}}> {/*<!-- container for nav an equation list --> */}
                { viewingSimilarGroup
                        ? (<div><b> {showStudentName
                                        /* When editing docs from google classroom filename set to google file ID,
                                         * show student name instead */
                                        ?  (data[STUDENT_NAME] ? data[STUDENT_NAME] : data[STUDENT_FILE])
                                        : "" }</b></div>)
                        : ( /* Hide grading actions if viewing similar work group */
                    <div>
                    <span style={{marginBottom: "10px", visibility: (gradingNotice !== '') ? "visible" : "hidden"}}>
                        <small><span style={{color:"#545454"}}>{gradingNotice}</span><br /></small>
                    </span>
                    <span><b>
                        {showStudentName
                                        /* When editing docs from google classroom filename set to google file ID,
                                         * show student name instead */
                                        ?  (data[STUDENT_NAME] ? data[STUDENT_NAME] : data[STUDENT_FILE])
                                        : "" }
                    </b></span>
                    {/* TODO - I need teachers to be able to edit the score, including deleting down to
                               empty string, so they can write a new score. If I add validation when setting
                               the value in the reducer the field won't be editable. Look up react best pratices
                               for this, right now I'll assume I should attach another event here to ensure
                               that the field contains a number when focus is lost
                    */}
                    <br />
                    Score <input type="text" size="4" className="problem-grade-input"
                                    value={data[SCORE]} onChange={this.setScore}
                              /> out of {possiblePoints} &nbsp;
                            <Button type="submit" text="Full Points" onClick={this.fullPoints}/>
                            <br />
                    <span style={{marginTop: "15px", marginBottom: "25px"}}>
                        <Button text="Apply to Ungraded" className="fm-button-green fm-button"
                                title={"Apply this score and feedback text to all responses in this " +
                                    "group that don't have a grade yet."}
                                onClick={this.applyScoreToUngraded} />
                        <Button text="Apply to All" className="fm-button-green fm-button"
                                title={"Apply this score and feedback text to all responses in this group, " +
                                      "will overwrite already entered values."}
                                onClick={this.applyScoreToAll} />
                    </span>
                    <br />
                    Feedback&nbsp;
                    <br />
                    {feedbackButton("Show Work", "Show your complete work.")}
                    {feedbackButton("Simple Mistake", "Review your work for a simple mistake.")}
                    <br />
                    {feedbackButton("Let's Talk", "Let's chat about this next class.")}
                    {feedbackButton("Not Simplified", "Be sure to simplify completely.")}
                    {feedbackButton("Sig Figs", "Incorrect significant figures.")}
                    <br />
                    <textarea placeholder="Click a button for quick feedback or type custom feedback here."
                                   cols="30" rows="4" onChange={this.setFeedback} value={feedback}></textarea>
                    </div>
                )}
                <br />
                <StudentWork
                    solutionGradeInfo={data}
                    problemNumber={problemNumber}
                    possiblePoints={possiblePoints}
                    key={studentSolutionIndex}
                    id={studentSolutionIndex}
                    solutionClassIndex={solutionClassIndex}
                />
            </div>
        );
    }
}

export { SolutionGrader as default, scaleScore, singleSolutionReducer};
