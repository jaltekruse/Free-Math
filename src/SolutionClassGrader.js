import React from 'react';
import createReactClass from 'create-react-class';
import _ from 'underscore';
import './App.css';
import TeX from './TeX.js';
import SolutionGrader, { singleSolutionReducer } from './SolutionGrader.js';

var SOLUTION_INDEX = "SOLUTION_INDEX";

var SET_PROBLEM_POSSIBLE_POINTS = "SET_PROBLEM_POSSIBLE_POINTS";

// action properties
// PROBLEM_NUMBER, SOLUTION_CLASS_INDEX, SCORE, SOLUTION_INDEX
var GRADE_SINGLE_SOLUTION = "GRADE_SINGLE_SOLUTION";
// action properties
// PROBLEM_NUMBER, SOLUTION_CLASS_INDEX, SCORE
var GRADE_CLASS_OF_SOLUTIONS = "GRADE_CLASS_OF_SOLUTIONS";
// action properties: MODE (JUST_UNGRADED | ALL)
var MODE = "MODE";
var JUST_UNGRADED = "JUST_UNGRADED"

// teacher grade page model properties
var STUDENT_WORK = "STUDENT_WORK";
var STUDENT_FILE = 'STUDENT_FILE';
var ANSWER = "ANSWER";

var HIGHLIGHT_STEP = 'HIGHLIGHT_STEP';
var SCORE = "SCORE";
var SET_PROBLEM_FEEDBACK = "SET_PROBLEM_FEEDBACK";

function solutionClassReducer(state, action) {
    if (action.type === GRADE_CLASS_OF_SOLUTIONS ||
        action.type === SET_PROBLEM_POSSIBLE_POINTS) {
        var workInGivenSolutionClass = [ ...state[STUDENT_WORK] ];
        if (action.type === GRADE_CLASS_OF_SOLUTIONS) {
            action.type = GRADE_SINGLE_SOLUTION;
        }
        workInGivenSolutionClass.forEach(function(singleStudentsWork, index, arr) {
            if (action[MODE] === JUST_UNGRADED && singleStudentsWork[SCORE] !== "") {
                return;
            }
            workInGivenSolutionClass[index] = singleSolutionReducer(singleStudentsWork, action);
        });
        return {
            ...state,
            STUDENT_WORK : workInGivenSolutionClass
        };
    } else if (action.type === GRADE_SINGLE_SOLUTION ||
               action.type === SET_PROBLEM_FEEDBACK ||
			   action.type === HIGHLIGHT_STEP
        ) {
        return {
            ...state,
            STUDENT_WORK : [
                ...state[STUDENT_WORK].slice(0, action[SOLUTION_INDEX]),
                singleSolutionReducer(state[STUDENT_WORK][action[SOLUTION_INDEX]], action),
                ...state[STUDENT_WORK].slice(action[SOLUTION_INDEX] + 1)
            ]
        };
    } else {
        return state;
    }
}

var SolutionClassGrader = createReactClass({
    render: function() {
        // TODO - finish
        var data = this.props.solutionClassInfo;
        var studentsToView = this.props.studentsToView;
        // TODO - finish
        var solutionClassIndex = this.props.solutionClassIndex;
        var problemNumber = this.props.problemNumber;
        var possiblePoints = this.props.possiblePoints;
        var studentFinalAnswer = data[ANSWER];
        var studentCount = _.size(data[STUDENT_WORK]);
        if (studentCount > 1) {
            studentCount = studentCount + ' students ';
        } else {
            studentCount = studentCount + ' student ';
        }
        var message = 'with work leading to answer ';
        if (studentFinalAnswer === 'unanswered') {
           message = 'with the question ';
        }
        // due to filtering there may be no answers showing in this group, in this case render nothing
        // not even the header
        var anyAnswersShowing = false;
        data[STUDENT_WORK].forEach(function(studentSolution, studentSolutionIndex, array) {
            if (studentsToView === undefined || !studentsToView || studentsToView.includes(studentSolution[STUDENT_FILE])) {
                anyAnswersShowing = true;
            }
        });
        return (
            <div>
            { !anyAnswersShowing ? null :
            (<div className="similar-student-answers" style={{float:"none",overflow:"hidden"}} >
                {/*<input type="submit" className="show-all-common-answers" name="show all" value="show all"/>*/}
                {/*<input type="submit" className="hide-all-common-answers" name="hide all" value="hide all"/>*/}
                <p> {studentCount}{message}</p>
                <TeX>{typeof(studentFinalAnswer) === 'string' ? studentFinalAnswer : "\\text{corruption occured}"}</TeX>
                {
                    data[STUDENT_WORK].map(function(studentSolution, studentSolutionIndex) {
                        if (studentsToView === undefined || !studentsToView || studentsToView.includes(studentSolution[STUDENT_FILE])) {
                            return (<SolutionGrader solutionGradeInfo={studentSolution} problemNumber={problemNumber} possiblePoints={possiblePoints}
                                                key={studentSolutionIndex} id={studentSolutionIndex} solutionClassIndex={solutionClassIndex}/>)
                        } else {
                            return null;
                        }
                    })
                }
            </div>)
            }
            </div>
        );
    }
});

export { SolutionClassGrader as default, solutionClassReducer };
