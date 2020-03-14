import React from 'react';
import createReactClass from 'create-react-class';
import './App.css';
import SolutionClassGrader, { solutionClassReducer } from './SolutionClassGrader.js';
import Button from './Button.js';

var SOLUTION_CLASS_INDEX = "SOLUTION_CLASS_INDEX";

var SET_PROBLEM_POSSIBLE_POINTS = "SET_PROBLEM_POSSIBLE_POINTS";
var EDIT_POSSIBLE_POINTS = "EDIT_POSSIBLE_POINTS";
var POSSIBLE_POINTS = "POSSIBLE_POINTS";
// as the points already assigned for all work on a problem need to be scaled
// wen the possible points changes, and the old a new values need to be
// known at the time of the recalculation, user input is stored in this field
// until the field is submitted (with a button, pressing enter key or focus loss)
var POSSIBLE_POINTS_EDITED = "POSSIBLE_POINTS_EDITED";
var UNIQUE_ANSWERS = 'UNIQUE_ANSWERS';

// action properties
// PROBLEM_NUMBER, SOLUTION_CLASS_INDEX, SCORE, SOLUTION_INDEX
var GRADE_SINGLE_SOLUTION = "GRADE_SINGLE_SOLUTION";
// action properties
// PROBLEM_NUMBER, SOLUTION_CLASS_INDEX, SCORE
var GRADE_CLASS_OF_SOLUTIONS = "GRADE_CLASS_OF_SOLUTIONS";

var HIGHLIGHT_STEP = 'HIGHLIGHT_STEP';
var OLD_POSSIBLE_POINTS = "OLD_POSSIBLE_POINTS";
var SET_PROBLEM_FEEDBACK = "SET_PROBLEM_FEEDBACK";

function problemGraderReducer(state, action) {
    if (action.type === GRADE_CLASS_OF_SOLUTIONS ||
        action.type === GRADE_SINGLE_SOLUTION ||
        action.type === HIGHLIGHT_STEP ||
        action.type === SET_PROBLEM_FEEDBACK ) {
        return {
            ...state,
            UNIQUE_ANSWERS : [
                ...state[UNIQUE_ANSWERS].slice(0, action[SOLUTION_CLASS_INDEX]),
                solutionClassReducer(state[UNIQUE_ANSWERS][action[SOLUTION_CLASS_INDEX]], action),
                ...state[UNIQUE_ANSWERS].slice(action[SOLUTION_CLASS_INDEX] + 1),
            ]
        };
    } else if (action.type === EDIT_POSSIBLE_POINTS) {
        // TODO - add parsing/validation of new value here?
        return { ...state, POSSIBLE_POINTS_EDITED : action[POSSIBLE_POINTS]};
    } else if (action.type === SET_PROBLEM_POSSIBLE_POINTS) {
        // as the point values are stored at this level, must pass it down to
        // recalculate points based on new value for total possible points
        if (action.type === SET_PROBLEM_POSSIBLE_POINTS) {
            action[OLD_POSSIBLE_POINTS] = state[POSSIBLE_POINTS];
            action[POSSIBLE_POINTS] = state[POSSIBLE_POINTS_EDITED];
        }
        var solutionClasses = [ ...state[UNIQUE_ANSWERS] ];
        solutionClasses.forEach(function(singleSolutionClass, index, arr) {
            solutionClasses[index] = solutionClassReducer(singleSolutionClass, action);
        });
        var ret = {
            ...state,
            UNIQUE_ANSWERS : solutionClasses
        };
        if (action.type === SET_PROBLEM_POSSIBLE_POINTS) {
            ret[POSSIBLE_POINTS] = action[POSSIBLE_POINTS];
        }
        return ret;
    } else {
        return state;
    }
}

// A problem grader encompasses all of the student work in response
// to a single problem. The work is grouped by similar final answer,
// the groups are called "answer classes".
var ProblemGrader = createReactClass({
    render: function() {
        var problemNumber = this.props.problemNumber;
        var studentsToView = this.props.studentsToView;
        var problemInfo = this.props.problemInfo;
        var possiblePoints =
            problemInfo[POSSIBLE_POINTS_EDITED] !== undefined ?
                problemInfo[POSSIBLE_POINTS_EDITED]
                : problemInfo[POSSIBLE_POINTS];
        var oldPossiblePoints = problemInfo[POSSIBLE_POINTS];
        return (
            <div className="problem-summary-container" style={{float:"none",overflow:"hidden"}}>
                <h3>Problem {problemNumber}</h3>
                {/*<p>Total incorrect answers {totalIncorrect}</p>*/}
                <p>Possible points &nbsp;
                    <input type="text" size="4" value={possiblePoints}
                           onChange={function(evt) {
                               window.store.dispatch(
                                   { type : EDIT_POSSIBLE_POINTS, PROBLEM_NUMBER : problemNumber,
                                      POSSIBLE_POINTS : evt.target.value})
                           }}/>
                    <Button text="Apply"
                           onClick={function() {
                                if (Number(this.props[POSSIBLE_POINTS_EDITED]) < 0) {
                                    alert("Possible points must be a number");
                                } else {
                                    window.ga('send', 'event', 'Actions', 'edit', 'Edit possible points');
                                    window.store.dispatch(
                                        { type : SET_PROBLEM_POSSIBLE_POINTS,
                                          PROBLEM_NUMBER : problemNumber});
                                }
                            }.bind(this)
                        }/> <br/>
                </p>
                { problemInfo[UNIQUE_ANSWERS].map(
                    function(solutionClassInfo, solutionClassIndex) {
                        return (
                        <SolutionClassGrader solutionClassInfo={solutionClassInfo}
                                             key={solutionClassIndex}
                                             solutionClassIndex={solutionClassIndex}
                                             problemNumber={problemNumber}
                                             possiblePoints={oldPossiblePoints}
                                             studentsToView={studentsToView}/>
                        );
                    })
                }
        </div>);
    }
});

export { ProblemGrader as default, problemGraderReducer };
