import React from 'react';
import createReactClass from 'create-react-class';
import './App.css';
import TeX from './TeX.js';
import Button from './Button.js';

var STUDENT_FILE = 'STUDENT_FILE';

var SCORE = "SCORE";
var FEEDBACK = "FEEDBACK";

// teacher grade page model properties
var CONTENT = "CONTENT";

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
    return Math.round(
        ( Number(score) / Number(oldPossiblePoints) )* Number(newPossiblePoints));
}

const StudentWork = createReactClass({
    render: function() {
        var data = this.props.solutionGradeInfo;
        var problemNumber = this.props.problemNumber
        var solutionClassIndex = this.props.solutionClassIndex;
        var studentSolutionIndex = this.props.id;
        return (
            <div style={{float:"left"}} className="equation-list">
                <br/>
                {
                    data[STEPS].map(function(step, stepIndex) {
                    var stepStyle = {};
                    if (step[HIGHLIGHT] === ERROR) stepStyle = {backgroundColor : RED}
                    else if (step[HIGHLIGHT] === SUCCESS) stepStyle = {backgroundColor : GREEN}

                    return (
                        <div style={{marginTop:"10px"}} key={stepIndex + ' ' + step[HIGHLIGHT]}>
                            <div className="student-step-grader" style={{display: "inline-block"}}>
                            <TeX style={stepStyle} onClick={function() {
                                window.store.dispatch({ type : HIGHLIGHT_STEP, PROBLEM_NUMBER : problemNumber,
                                                SOLUTION_CLASS_INDEX : solutionClassIndex,
                                                SOLUTION_INDEX : studentSolutionIndex,
                                                STEP_KEY : stepIndex});
                                }}>
                                {typeof(step[CONTENT]) === 'string'
                                    ? step[CONTENT]
                                    : "\\text{corruption occured}"}
                                </TeX>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }
});

const SolutionGrader = createReactClass({
    setScore: function(evt) {
        var problemNumber = this.props.problemNumber
        var solutionClassIndex = this.props.solutionClassIndex;
        var studentSolutionIndex = this.props.id;
        window.store.dispatch({ type : GRADE_SINGLE_SOLUTION, PROBLEM_NUMBER : problemNumber,
                         SOLUTION_CLASS_INDEX : solutionClassIndex, SCORE : evt.target.value,
                         SOLUTION_INDEX : studentSolutionIndex});
    },
    fullPoints: function(evt) {
        var problemNumber = this.props.problemNumber
        var solutionClassIndex = this.props.solutionClassIndex;
        var studentSolutionIndex = this.props.id;
        window.store.dispatch({ type : GRADE_SINGLE_SOLUTION, PROBLEM_NUMBER : problemNumber,
                         SOLUTION_CLASS_INDEX : solutionClassIndex,
                         SCORE : this.props.possiblePoints, SOLUTION_INDEX : studentSolutionIndex});
    },
    applyScoreToAll: function(evt) {
        var data = this.props.solutionGradeInfo;
        var problemNumber = this.props.problemNumber;
        var solutionClassIndex = this.props.solutionClassIndex;

        var globalState = window.store.getState();
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
    },
    applyScoreToUngraded: function(evt) {
        var data = this.props.solutionGradeInfo;
        var problemNumber = this.props.problemNumber;
        var solutionClassIndex = this.props.solutionClassIndex;
        window.store.dispatch({ type : GRADE_CLASS_OF_SOLUTIONS, MODE : JUST_UNGRADED,
                         PROBLEM_NUMBER : problemNumber, SOLUTION_CLASS_INDEX : solutionClassIndex,
                         SCORE : data[SCORE], FEEDBACK : data[FEEDBACK]
                        });
    },
    setFeedback: function(evt) {
        var problemNumber = this.props.problemNumber
        var solutionClassIndex = this.props.solutionClassIndex;
        var studentSolutionIndex = this.props.id;
        window.store.dispatch({ type : SET_PROBLEM_FEEDBACK, PROBLEM_NUMBER : problemNumber,
                         SOLUTION_CLASS_INDEX : solutionClassIndex, FEEDBACK : evt.target.value,
                         SOLUTION_INDEX : studentSolutionIndex});
    },
    setQuickFeedback: function(text) {
        var problemNumber = this.props.problemNumber
        var solutionClassIndex = this.props.solutionClassIndex;
        var studentSolutionIndex = this.props.id;
        window.store.dispatch({ type : SET_PROBLEM_FEEDBACK, PROBLEM_NUMBER : problemNumber,
                         SOLUTION_CLASS_INDEX : solutionClassIndex, FEEDBACK : text,
                         SOLUTION_INDEX : studentSolutionIndex});
    },
    render: function() {
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
                        ? (<div> {showStudentName ? data[STUDENT_FILE] : "" }</div>)
                        : ( /* Hide grading actions if viewing similar work group */
                    <div>
                    <div style={{visibility: (gradingNotice != '') ? "visible" : "hidden"}}>
                        <small><span style={{color:"#545454"}}>{gradingNotice}</span><br /></small>
                    </div>
                    <span> {showStudentName ? data[STUDENT_FILE] : "" }</span>
                    {/* TODO - I need teachers to be able to edit the score, including deleting down to
                               empty string, so they can write a new score. If I add validation when setting
                               the value in the reducer the field won't be editable. Look up react best pratices
                               for this, right now I'll assume I should attach another event here to ensure
                               that the field contains a number when focus is lost
                    */}
                    <p>Score <input type="text" size="4" className="problem-grade-input"
                                    value={data[SCORE]} onChange={this.setScore}
                              /> out of {possiblePoints} &nbsp;
                            <Button type="submit" text="Full Points" onClick={this.fullPoints}/>
                            <br />
                            <Button text="Apply to Ungraded"
                                    title={"Apply this score and feedback text to all responses in this " +
                                        "group that don't have a grade yet."}
                                    onClick={this.applyScoreToUngraded}
                                    style={{backgroundColor: "#008000"}}/>
                            <Button text="Apply to All"
                                    title={"Apply this score and feedback text to all responses in this group, " +
                                          "will overwrite already entered values."}
                                    onClick={this.applyScoreToAll}
                                    style={{backgroundColor: "#008000"}}/>
                    </p>
                    <p>Feedback &nbsp; &nbsp;
                    <br />
                    {feedbackButton("Show Work", "Show your complete work.")}
                    {feedbackButton("Simple Mistake", "Review your work for a simple mistake.")}
                    <br />
                    {feedbackButton("Let's Talk", "Let's chat about this next class.")}
                    {feedbackButton("Not Simplified", "Be sure to simplify completely.")}
                    {feedbackButton("Sig Figs", "Incorrect significant figures.")}
                    </p>

                    <div><textarea placeholder="Click a button for quick feedback or type custom feedback here."
                                   cols="30" rows="4" onChange={this.setFeedback} value={feedback}></textarea>
                    </div>
                    </div>
                )}
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
});

export { SolutionGrader as default, scaleScore, singleSolutionReducer};
