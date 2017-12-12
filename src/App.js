import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import logo from './logo.svg';
import './App.css';
import MathInput from './MathInput.js';
import TeX from './TeX.js';
import FreeMath from './FreeMath.js';
import LogoHomeNav from './LogoHomeNav.js';
import SolutionGrader from './SolutionGrader.js';
import convertToCurrentFormat from './TeacherInteractiveGrader.js';
// TODO - move tests out of this file and remove these next 2 imports
import aggregateStudentWork from './TeacherInteractiveGrader.js';
import separateIndividualStudentAssignments from './GradingMenuBar.js';
import gradeSingleProblem from './TeacherInteractiveGrader.js';
import calculateGradingOverview from './TeacherInteractiveGrader.js';

var MathQuill = window.MathQuill;
var Khan = window.Khan;
var MathJax = window.MathJax;
var katex = window.katex;
var _ = window._;
var katexA11y = window.katexA11y;

var JSZip = window.JSZip ;
var $ = window.$;
var KAS = window.KAS;
var JsDiff = window.JsDiff;
var Chart = window.Chart;

// TODO - THIS IS NOT THE RIGHT WAY TO DO THIS, INSTEAD FIND A VERSION OF LODASH COMPATIBLE WITH KAS

_.cloneDeep = function(oldObject) { return JSON.parse(JSON.stringify(oldObject)); };

// copied from here, didn't seem worth adding a dependency, I'm sure the JS people will cure me of that eventually...
// https://github.com/substack/deep-freeze/blob/master/index.js
function deepFreeze (o) {
  Object.freeze(o);

  Object.getOwnPropertyNames(o).forEach(function (prop) {
    if (o.hasOwnProperty(prop)
    && o[prop] !== null
    && (typeof o[prop] === "object" || typeof o[prop] === "function")
    && !Object.isFrozen(o[prop])) {
      deepFreeze(o[prop]);
    }
  });

  return o;
};

const UNTITLED_ASSINGMENT = 'Untitled Assignment';

// Application state properties
// TODO - use these as the actual keys in object literals in the reducer
// when I have ES6 and Babel

// Redux things
var type = 'type';

// Application modes
var APP_MODE = 'APP_MODE';
var EDIT_ASSIGNMENT = 'EDIT_ASSIGNMENT';
var GRADE_ASSIGNMENTS = 'GRADE_ASSIGNMENTS';
var MODE_CHOOSER = 'MODE_CHOOSER';

// Actions to change modes
var GO_TO_MODE_CHOOSER = 'GO_TO_MODE_CHOOSER';
var SET_ASSIGNMENTS_TO_GRADE = 'SET_ASSIGNMENTS_TO_GRADE';
// action properties
var NEW_STATE = 'NEW_STATE';
// when grading, open the view where overall student grades are show
var SET_TO_VIEW_GRADES = 'SET_TO_VIEW_GRADES';
// the state resulting from above ttanstion action
var VIEW_GRADES = 'VIEW_GRADES';
var NAV_BACK_TO_GRADING = 'NAV_BACK_TO_GRADING';

// properties of the state when showing grade view
// just a wrapper for the grades and total possible points for now
var GRADE_INFO = 'GRADE_INFO';
var STUDENT_GRADES = 'STUDENT_GRADES';
// Also uses POSSIBLE_POINTS from below

// Object model for teacher grading experience, see return value in the aggreateStudentWork() method
var STUDENT_FILE = 'STUDENT_FILE';
var ASSIGNMENT = 'ASSIGNMENT';
var UNIQUE_ANSWERS = 'UNIQUE_ANSWERS';
var AUTOMATICALLY_ASSIGNED_SCORE = 'AUTOMATICALLY_ASSIGNED_SCORE';
var PROBLEM_SCORE = 'PROBLEM_SCORE';
var SUCCESS = 'SUCCESS';
var ERROR = 'ERROR';
var HIGHLIGHT = 'HIGHLIGHT';

// answer key properties
var GRADE_STRATEGY = "GRADE_STRATEGY";
var ALL_ANSWERS_REQUIRED = "ALL_ANSWERS_REQUIRED";
var ONE_ANSWER_REQUIRED = "ONE_ANSWER_REQUIRED";
var SUBSET_OF_ANSWERS_REQUIRED = "SUBSET_OF_ANSWERS_REQUIRED";
var NUMBER_OF_MATCHING_ANSWERS_REQUIRED = "NUMBER_OF_MATCHING_ANSWERS_REQUIRED";
var POSSIBLE_POINTS = "POSSIBLE_POINTS";
// as the points already assigned for all work on a problem need to be scaled
// wen the possible points changes, and the old a new values need to be
// known at the time of the recalculation, user input is stored in this field
// until the field is submitted (with a button, pressing enter key or focus loss)
var POSSIBLE_POINTS_EDITED = "POSSIBLE_POINTS_EDITED";
var ANSWER_CLASSES = "ANSWER_CLASSES";
var ANSWERS = "ANSWERS";
var SCORE = "SCORE";
var FEEDBACK = "FEEDBACK";
var SIMILAR_ASSIGNMENT_GROUP_INDEX = "SIMILAR_ASSIGNMENT_GROUP_INDEX";
var SIMILAR_ASSIGNMENT_SETS = "SIMILAR_ASSIGNMENT_SETS";

// teacher grade page model properties
var SHOW_ALL = "SHOW_ALL";
var SHOW_NONE = "SHOW_NONE";
var STUDENT_WORK = "STUDENT_WORK";
var ANSWER = "ANSWER";
var CONTENT = "CONTENT";

// teacher grading actions
var VIEW_SIMILAR_ASSIGNMENTS = "VIEW_SIMILAR_ASSIGNMENTS";
// action property declared above: SIMILAR_ASSIGNMENT_GROUP_INDEX

// action properties
// PROBLEM_NUMBER, SOLUTION_CLASS_INDEX, SCORE, SOLUTION_INDEX
var GRADE_SINGLE_SOLUTION = "GRADE_SINGLE_SOLUTION";
// action properties
// PROBLEM_NUMBER, SOLUTION_CLASS_INDEX, SCORE
var GRADE_CLASS_OF_SOLUTIONS = "GRADE_CLASS_OF_SOLUTIONS";
// action properties: MODE (JUST_UNGRADED | ALL)
var MODE = "MODE";
var JUST_UNGRADED = "JUST_UNGRADED"
var ALL = "ALL";

var HIGHLIGHT_STEP = 'HIGHLIGHT_STEP';
var HIGHLIGHT_TYPE = 'HIGHLIGHT_TYPE';
// HIGHLIGHT_TYPE : (ERROR | SUCCESS)

var SOLUTION_CLASS_INDEX = "SOLUTION_CLASS_INDEX";
var SET_PROBLEM_FEEDBACK = "SET_PROBLEM_FEEDBACK";
var HIDE_CLASS_OF_SOLUTIONS = "HIDE_CLASS_OF_SOLUTIONS";
var TOGGLE_GRADING_ANONYMOUSLY = "TOGGLE_GRADING_ANONYMOUSLY";
var SET_PROBLEM_POSSIBLE_POINTS = "SET_PROBLEM_POSSIBLE_POINTS";
var EDIT_POSSIBLE_POINTS = "EDIT_POSSIBLE_POINTS";
var OLD_POSSIBLE_POINTS = "OLD_POSSIBLE_POINTS";

var SOLUTION_INDEX = "SOLUTION_INDEX";

// Assignment properties
var ASSIGNMENT_NAME = 'ASSIGNMENT_NAME';
var PROBLEMS = 'PROBLEMS';

// Problem properties
var PROBLEM_NUMBER = 'PROBLEM_NUMBER';
var STEPS = 'STEPS';
// to implement undo/redo and index for the last step
// to show is tracked and moved up and down
// when this is not at the end of the list and a new
// step is added it moves to the end of the list as
// the redo history in this case will be lost
var LAST_SHOWN_STEP = 'LAST_SHOWN_STEP';

// editing assignmnt mode actions
var SET_ASSIGNMENT_NAME = 'SET_ASSIGNMENT_NAME';
// used to swap out the entire content of the document, for opening
// a document from a file
var SET_ASSIGNMENT_CONTENT = 'SET_ASSIGNMENT_CONTENT';

// student assignment actions
var ADD_PROBLEM = 'ADD_PROBLEM';
// remove problem expects an "index" property
// specifying which problem to remove
var REMOVE_PROBLEM = 'REMOVE_PROBLEM';
var CLONE_PROBLEM = 'CLONE_PROBLEM';

// this action expects:
// PROBLEM_INDEX - for which problem to change
// NEW_PROBLEM_NUMBER - string with problem number, not a numberic
//                    type because the problem might be 1.a, etc.
var PROBLEM_INDEX = 'PROBLEM_INDEX';
var NEW_PROBLEM_NUMBER = 'NEW_PROBLEM_NUMBER';
var SET_PROBLEM_NUMBER = 'SET_PROBLEM_NUMBER';

// key used to refer to one step in a series of student work
var STEP_KEY = 'STEP_KEY';
// key used to refer to data to place at a given step
// currently will just be a string with latex, but may change
// type if other metadata needs to be stored with each step
// such as a flag the student could set to indicate more than
// 1 final answer
var NEW_STEP_CONTENT = 'NEW_STEP_CONTENT';

// this action expects:
// PROBLEM_INDEX - for which problem to change
// STEP_KEY - index into the work steps for the given problem
// NEW_STEP_CONTENT - string for the new expression to write in this step
var EDIT_STEP = 'EDIT_STEP';
// TODO - decide if I want to add a feature to splice in
// a new step partway through a current problem
// this action expects an index for which problem to change
var NEW_STEP = 'NEW_STEP';
// this action expects an index for which problem to change
var UNDO_STEP = 'UNDO_STEP';
// this action expects an index for which problem to change
var REDO_STEP = 'REDO_STEP';

// CSS constants
var SOFT_RED = '#FFDEDE';
var RED = '#FF99CC';
var GREEN = '#2cff72';
var YELLOW = '#FFFDBF';

//      [ { "PROBLEM_NUMBER" : "1", POSSIBLE_POINTS : 3, "ANSWER_CLASSES" : [ { SCORE : 1, ANSWERS : ["x=5", "5=x"]}, { "SCORE" : 0.5, ANSWERS : ["x=-5","-5=x"] ],
//          "GRADE_STRATEGY" : "ALL_ANSWERS_REQUIRED" | "ONE_ANSWER_REQUIRED" | "SUBSET_OF_ANSWERS_REQUIRED", "NUMBER_OF_MATCHING_ANSWERS_REQUIRED" : 2 } ]
function testGradeProblem() {
    var answerKey = { "1" : { POSSIBLE_POINTS : 3,
                        ANSWER_CLASSES : [  { SCORE : 1, ANSWERS : ["x=5", "5=x"], GRADE_STRATEGY : ONE_ANSWER_REQUIRED },
                                            { SCORE : 0.5, ANSWERS : ["x=-5", "-5=x"], GRADE_STRATEGY : ONE_ANSWER_REQUIRED }] } };
    var studentAnswer1 = { PROBLEM_NUMBER : 1, STEPS : [ {CONTENT : "2x=10"}, {CONTENT : "x=5"}]};
    var studentAnswer2 = { PROBLEM_NUMBER : 1, STEPS : [ {CONTENT : "2x=10"}, {CONTENT : "x=-5"}]};
    expect(gradeSingleProblem(studentAnswer1, answerKey)).toEqual(3);
    expect(gradeSingleProblem(studentAnswer2, answerKey)).toEqual(1.5);
}

function testAggregateStudentWork() {
    var allStudentWork = [ {STUDENT_FILE : "jake r.", ASSIGNMENT: [{PROBLEM_NUMBER : 1, LAST_SHOWN_STEP : 1, STEPS : [
                                { CONTENT : "5x=10"}, { CONTENT : "x=2"}]}]},
                           {STUDENT_FILE : "jon m.", ASSIGNMENT: [{PROBLEM_NUMBER : 1, LAST_SHOWN_STEP : 1, STEPS : [
                                { CONTENT : "5x=10"}, { CONTENT : "x=-2"}]}]} ];
    var answerKey = { "1" : {
            POSSIBLE_POINTS : 3,
            ANSWER_CLASSES : [ { SCORE : 1, ANSWERS : ["x=2", "2=x"], GRADE_STRATEGY : ONE_ANSWER_REQUIRED},
                                { SCORE : 0.5, ANSWERS : ["x=-2","-2=x"], GRADE_STRATEGY : ONE_ANSWER_REQUIRED } ],
            } };
    var expectedOutput = {
        CURRENT_FILTERS : { SIMILAR_ASSIGNMENT_GROUP_INDEX : null, ANONYMOUS : true },
        SIMILAR_ASSIGNMENT_SETS : [ ],
        PROBLEMS : { "1" : {
            POSSIBLE_POINTS : 3,
            UNIQUE_ANSWERS : [
                { ANSWER : "x=2", FILTER : SHOW_ALL, STUDENT_WORK : [ {STUDENT_FILE : "jake r.", AUTOMATICALLY_ASSIGNED_SCORE : 3, SCORE : 3, FEEDBACK : "",
                    LAST_SHOWN_STEP : 1, STEPS : [ { CONTENT : "5x=10"},{ CONTENT : "x=2"} ] } ] },
                    { ANSWER : "x=-2", FILTER : SHOW_ALL, STUDENT_WORK : [ {STUDENT_FILE : "jon m.", AUTOMATICALLY_ASSIGNED_SCORE : 1.5,  SCORE : 1.5,FEEDBACK : "",
                    LAST_SHOWN_STEP: 1, STEPS : [ { CONTENT : "5x=10"},{ CONTENT : "x=-2"} ] } ] } ]
        } }
    };
    var output = aggregateStudentWork(allStudentWork, answerKey);
    expect(output).toEqual(expectedOutput);
}

function testSeparateAssignments() {
    var input = {
        CURRENT_FILTERS : { SIMILAR_ASSIGNMENT_GROUP_INDEX : null, ANONYMOUS : true },
        SIMILAR_ASSIGNMENT_SETS : [ ],
        PROBLEMS : { "1" : {
            POSSIBLE_POINTS : 3,
            UNIQUE_ANSWERS : [
                { ANSWER : "x=2", FILTER : SHOW_ALL, STUDENT_WORK : [ {STUDENT_FILE : "jake r.", AUTOMATICALLY_ASSIGNED_SCORE : 3, SCORE : 3, FEEDBACK : "",
                    STEPS : [ { CONTENT : "5x=10"},{ CONTENT : "x=2"} ] } ] },
                    { ANSWER : "x=-2", FILTER : SHOW_ALL, STUDENT_WORK : [ {STUDENT_FILE : "jon m.", FEEDBACK : "Watch your signs", AUTOMATICALLY_ASSIGNED_SCORE : 1.5,  SCORE : 1.5,
                    STEPS : [ { CONTENT : "5x=10"},{ CONTENT : "x=-2", HIGHLIGHT : ERROR} ] } ] } ]
        } }
    };

    // test separating the student work back out into individual assignments
    var separatedAssignments = separateIndividualStudentAssignments(input);

    var expectedOutput =
    {
        "jake r.": {
            "PROBLEMS": [{
                "SCORE": 3,
                "FEEDBACK": "",
                "STEPS": [{
                    "CONTENT": "5x=10"
                }, {
                    "CONTENT": "x=2"
                }],
                "PROBLEM_NUMBER": "1",
                "POSSIBLE_POINTS": 3
            }]
        },
        "jon m.": {
            "PROBLEMS": [{
                "FEEDBACK": "Watch your signs",
                "SCORE": 1.5,
                "STEPS": [{
                    "CONTENT": "5x=10"
                }, {
                    "CONTENT": "x=-2",
                    "HIGHLIGHT": "ERROR"
                }],
                "PROBLEM_NUMBER": "1",
                "POSSIBLE_POINTS": 3
            }]
        }
    };
    expect(separatedAssignments).toEqual(expectedOutput);

    var zip = new JSZip();
    for (var filename in separatedAssignments) {
        if (separatedAssignments.hasOwnProperty(filename)) {
            zip.file(filename, JSON.stringify(separatedAssignments[filename]));
        }
    }
    var content = zip.generate();
    //location.href="data:application/zip;base64," + content;
}

function testAggregateStudentWorkNoAnswerKey() {
    var allStudentWork = [ {STUDENT_FILE : "jake r.", ASSIGNMENT: [{PROBLEM_NUMBER : 1, LAST_SHOWN_STEP : 1, STEPS : [
                                { CONTENT : "5x=10"}, { CONTENT : "x=2"}]}]},
                           {STUDENT_FILE : "jon m.", ASSIGNMENT: [{PROBLEM_NUMBER : 1, LAST_SHOWN_STEP : 1, STEPS : [
                                { CONTENT : "5x=10"}, { CONTENT : "x=-2"}]}]} ];
    var expectedOutput = {
        CURRENT_FILTERS : { SIMILAR_ASSIGNMENT_GROUP_INDEX : null, ANONYMOUS : true },
        SIMILAR_ASSIGNMENT_SETS : [ ],
        PROBLEMS : { "1" : {
            POSSIBLE_POINTS : 6,
            UNIQUE_ANSWERS : [
                { ANSWER : "x=2", FILTER : SHOW_ALL, STUDENT_WORK : [ {STUDENT_FILE : "jake r.", AUTOMATICALLY_ASSIGNED_SCORE : 0, SCORE : 0, FEEDBACK : "",
                    LAST_SHOWN_STEP: 1, STEPS : [ { CONTENT : "5x=10"},{ CONTENT : "x=2"} ] } ] },
                { ANSWER : "x=-2", FILTER : SHOW_ALL, STUDENT_WORK : [ {STUDENT_FILE : "jon m.", AUTOMATICALLY_ASSIGNED_SCORE : 0, SCORE : 0, FEEDBACK : "",
                    LAST_SHOWN_STEP: 1, STEPS : [ { CONTENT : "5x=10"},{ CONTENT : "x=-2"} ] } ] } ]
        } }
    };
    expect(aggregateStudentWork(allStudentWork)).toEqual(expectedOutput);
}

/*
 * Compute a table to show the overall grades for each student
 *
 * parameters:
 * allProblems - the structure used in the redux store during grading, with
 *                     student work grouped by problem number and similar student answers
 * returns:
 *    {
 *       STUDENT_GRADES : { "student_name_from_filename" : 6, "other_student_name" : 8 },
 *       POSSIBLE_POINTS : 10,
 *    }
 */
// PROBLEMS : { "1.a" : {
//      "POSSIBLE_POINTS : 3,
//      "UNIQUE_ANSWERS" : [ { ANSWER : "x=7", FILTER : "SHOW_ALL"/"SHOW_NONE", STUDENT_WORK : [ {STUDENT_FILE : "jason", AUTOMATICALLY_ASSIGNED_SCORE : 3,
//                             STEPS : [ { CONTENT : "2x=14"},{ CONTENT : "x=7", HIGHLIGHT : SUCCESS ]} ] } } ]}
function calculateGrades(allProblems) {
    var totalPossiblePoints = 0;
    var overallGrades = {};

    for (var problemNumber in allProblems) {
        if (allProblems.hasOwnProperty(problemNumber)) {
            var possiblePoints = allProblems[problemNumber][POSSIBLE_POINTS];
            totalPossiblePoints += possiblePoints;
            var uniqueAnswers = allProblems[problemNumber][UNIQUE_ANSWERS];
            uniqueAnswers.forEach(function(allWorkWithForSingleSolution, index, arr) {
                allWorkWithForSingleSolution[STUDENT_WORK].forEach(function(singleSolution, index, arr) {
                    var studentAssignmentName = singleSolution[STUDENT_FILE];
                    var runningScore = overallGrades[studentAssignmentName];
                    runningScore = (typeof runningScore != 'undefined') ? runningScore : 0;
                    // empty string is considered ungraded, which defaults to "complete" and full credit
                    if (singleSolution[SCORE] == "") {
                        runningScore += possiblePoints;
                    } else {
                        runningScore += Number(singleSolution[SCORE]);
                    }
                    overallGrades[studentAssignmentName] = runningScore;
                });
            });
        }
    }
    return {
        STUDENT_GRADES : overallGrades,
        POSSIBLE_POINTS : totalPossiblePoints
    };
}

// reducer for an individual problem
function problem(problem, action) {
    if (problem === undefined) {
        return { PROBLEM_NUMBER : "", STEPS : [{CONTENT : ""}], LAST_SHOWN_STEP : 0};
        /*
        return { PROBLEM_NUMBER : "1.1", SCORE : 3, POSSIBLE_POINTS : 3, FEEDBACK : "Nice work!", STEPS :
                [{CONTENT : "5x-2x+5-3"}, {CONTENT : "3x+5-3", HIGHLIGHT : SUCCESS}, {CONTENT : "3x+8", HIGHLIGHT : ERROR}],
                LAST_SHOWN_STEP : 2};
        */
    } else if (action.type === SET_PROBLEM_NUMBER) {
        var newNamedProb = _.clone(problem)
        newNamedProb[PROBLEM_NUMBER] = action[NEW_PROBLEM_NUMBER];
        return newNamedProb;
    } else if (action.type === EDIT_STEP) {
        return {
            ...problem,
            STEPS : [
                ...problem[STEPS].slice(0, action[STEP_KEY]),
                { CONTENT : action.NEW_STEP_CONTENT },
                ...problem[STEPS].slice(action[STEP_KEY] + 1)
            ]
        }
    } else if (action.type === NEW_STEP) {
        var editedProb = _.cloneDeep(problem);
        var oldLastStep = editedProb[STEPS][problem[LAST_SHOWN_STEP]];
        editedProb[STEPS] = editedProb[STEPS].slice(0, problem[LAST_SHOWN_STEP] + 1);
        // TODO - had a bug with edit step because this was previously just
        // adding another entry to the list with a reference to the same object
        // is it considered good practice in Redux to defensively prevent bugs
        // like this, or is it better to defer new object creation and be more thorough
        // to make sure that incorect mutations never take place?
        editedProb[STEPS].push({...oldLastStep});
        editedProb[LAST_SHOWN_STEP]++;
        return editedProb;
    } else if (action.type === UNDO_STEP) {
        if (problem[LAST_SHOWN_STEP] == 0) return problem;
        else {
            var editedProb = _.cloneDeep(problem);
            editedProb[LAST_SHOWN_STEP]--;
            return editedProb;
        }
    } else if (action.type === REDO_STEP) {
        if (problem[LAST_SHOWN_STEP] == problem[STEPS].length - 1) return problem;
        else {
            var editedProb = _.cloneDeep(problem);
            editedProb[LAST_SHOWN_STEP]++;
            return editedProb;
        }
    } else {
        return problem;
    }
}

// reducer for the list of problems in an assignment
function problems(probList, action) {
    if (probList === undefined) {
        return [ problem(undefined, action) ];
    }

    if (action.type === ADD_PROBLEM) {
        return _.clone(probList).concat(problem(undefined, action));
    } else if (action.type === REMOVE_PROBLEM) {
        return [
            ...probList.slice(0, action.PROBLEM_INDEX),
            ...probList.slice(action.PROBLEM_INDEX + 1)
        ];
    } else if (action.type === CLONE_PROBLEM) {
        var newProb = _.cloneDeep(probList[action.PROBLEM_INDEX]);
        newProb[PROBLEM_NUMBER] += ' - copy';
        return [
            ...probList.slice(0, action.PROBLEM_INDEX + 1),
            newProb,
            ...probList.slice(action.PROBLEM_INDEX + 1)
        ];
    } else if (action.type === SET_PROBLEM_NUMBER ||
               action.type === EDIT_STEP ||
               action.type === UNDO_STEP ||
               action.type === REDO_STEP ||
               action.type === NEW_STEP) {
        return [
            ...probList.slice(0, action.PROBLEM_INDEX),
            problem(probList[action.PROBLEM_INDEX], action),
            ...probList.slice(action.PROBLEM_INDEX + 1)
        ];
    } else {
        return probList;
    }
}

// reducer for an overall assignment
function assignment(state, action) {
    if (state === undefined) {
        return {
            ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
            PROBLEMS : problems(undefined, action)
            };
    } else if (action.type === SET_ASSIGNMENT_NAME) {
        state = _.cloneDeep(state);
        state.ASSIGNMENT_NAME = action.ASSIGNMENT_NAME;
        return state;
    } else {
        var new_state = _.clone(state);
        new_state[PROBLEMS] = problems(new_state[PROBLEMS], action);
        return new_state;
    }
}

function singleSolutionReducer(state, action) {
    if (action.type === GRADE_SINGLE_SOLUTION) {
        // currently no validation here
        return { ...state,
        SCORE : action[SCORE] };
	} else if (action.type === HIGHLIGHT_STEP) {
		var oldHighlight = state[STEPS][action[STEP_KEY]][HIGHLIGHT];
		var newHighlight;
		if (oldHighlight == undefined)
			newHighlight = ERROR;
		else if (oldHighlight == ERROR)
			newHighlight = SUCCESS;
		else if (oldHighlight == SUCCESS)
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
        var newScore = Math.round( (Number(state[SCORE])/Number(action[OLD_POSSIBLE_POINTS])) * Number(action[POSSIBLE_POINTS]));
        if (Number(state[SCORE]) > 0) {
            return { ...state,
                     SCORE : newScore };
        } else {
            return state;
        }
    } else {
        return state;
    }
}

function solutionClassReducer(state, action) {
    if (action.type === GRADE_CLASS_OF_SOLUTIONS ||
        action.type === SET_PROBLEM_POSSIBLE_POINTS) {
        var newState = { ...state };
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
        return ret;
    } else if (action.type === EDIT_POSSIBLE_POINTS) {
        return { ...state, POSSIBLE_POINTS_EDITED : action[POSSIBLE_POINTS]};
    } else if (action.type === SET_PROBLEM_POSSIBLE_POINTS) {
        // as the point values are stored at this level, must pass it down to
        // recalculate points based on new value for total possible points
        if (action.type === SET_PROBLEM_POSSIBLE_POINTS) {
            action[OLD_POSSIBLE_POINTS] = state[POSSIBLE_POINTS];
            action[POSSIBLE_POINTS] = state[POSSIBLE_POINTS_EDITED];
        }
        var newState = { ...state };
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

// CURRENT_FILTERS : { SIMILAR_ASSIGNMENT_GROUP_INDEX : 1, ANONYMOUS : true/false }
// SIMILAR_ASSIGNMENT_SETS : [ [ "jason", "emma", "matt"], ["jim", "tim"] ],
// PROBLEMS : { "1.a" : {
//      "POSSIBLE_POINTS : 3,
//      "UNIQUE_ANSWERS" : [ { ANSWER : "x=7", FILTER : "SHOW_ALL"/"SHOW_NONE", STUDENT_WORK : [ {STUDENT_FILE : "jason", AUTOMATICALLY_ASSIGNED_SCORE : 3,
//                             STEPS : [ { CONTENT : "2x=14"},{ CONTENT : "x=7", HIGHLIGHT : SUCCESS ]} ] } } ]}
// reducer for teacher grading page
function grading(state, action) {
    if (state === undefined) {
        return {
            APP_MODE : GRADE_ASSIGNMENTS,
            CURRENT_FILTERS : { SIMILAR_ASSIGNMENT_GROUP_INDEX : null, ANONYMOUS : true },
            SIMILAR_ASSIGNMENT_SETS : [ ],
            PROBLEMS : { "1" : {
                POSSIBLE_POINTS : 6,
                UNIQUE_ANSWERS : [
                { ANSWER : "x=2", FILTER : SHOW_ALL, STUDENT_WORK : [
                    { STUDENT_FILE : "jake r.", AUTOMATICALLY_ASSIGNED_SCORE : 0,
                      SCORE : 0, FEEDBACK : "",
                      STEPS : [ { CONTENT : "5x=10"},{ CONTENT : "x=2"} ] },
                    { STUDENT_FILE : "alica m.", AUTOMATICALLY_ASSIGNED_SCORE : 0,
                      SCORE : 0, FEEDBACK : "",
                      STEPS : [ { CONTENT : "5x=10"},{ CONTENT : "5x=10"},{ CONTENT : "x=2"} ] }] },
                { ANSWER : "x=-2", FILTER : SHOW_ALL, STUDENT_WORK : [
                    { STUDENT_FILE : "jon m.", AUTOMATICALLY_ASSIGNED_SCORE : 0,
                      SCORE : 0, FEEDBACK : "",
                      STEPS : [ { CONTENT : "5x=10"},{ CONTENT : "x=-2"} ] } ] } ]
            } }
        };
        alert("Defualt state has not been defined for teacher grading experience");
    } else if (action.type == VIEW_SIMILAR_ASSIGNMENTS) {
        return {
            ...state,
            SIMILAR_ASSIGNMENT_GROUP_INDEX : action[SIMILAR_ASSIGNMENT_GROUP_INDEX]
        }
    } else if (action.type === SET_PROBLEM_POSSIBLE_POINTS ||
           action.type === EDIT_POSSIBLE_POINTS ||
           action.type === GRADE_CLASS_OF_SOLUTIONS ||
           action.type === GRADE_SINGLE_SOLUTION ||
           action.type === HIGHLIGHT_STEP ||
           action.type === SET_PROBLEM_FEEDBACK
    ) {
        // check if the value in the possible points input is a valid number
        if (action.type === SET_PROBLEM_POSSIBLE_POINTS) {
            if (isNaN(state[PROBLEMS][action[PROBLEM_NUMBER]][POSSIBLE_POINTS_EDITED])) {
                window.alert("Possible points must be a number");
                return state;
            }
        }
        return {
            ...state,
            PROBLEMS : {
                ...state[PROBLEMS],
                [action[PROBLEM_NUMBER]] : problemGraderReducer(state[PROBLEMS][action[PROBLEM_NUMBER]], action)
            }
        };
    } else {
        return state;
    }
}

export function rootReducer(state, action) {
    console.log(action);
    if (state === undefined || action.type == GO_TO_MODE_CHOOSER) {
        return {
            APP_MODE : MODE_CHOOSER
        };
    } else if (action.type === "NEW_ASSIGNMENT") {
        return {
            ...assignment(),
	        "DOC_ID" : Math.floor(Math.random() * 200000000),
            APP_MODE : EDIT_ASSIGNMENT
        };
    } else if (action.type === "SET_GLOBAL_STATE") {
        return action.newState;
    } else if (action.type === SET_ASSIGNMENTS_TO_GRADE) {
        // TODO - consolidate the defaults for filters
        // TODO - get similar assignment list from comparing the assignments
        // overview comes sorted by LARGEST_ANSWER_GROUPS_SIZE ascending (least number of common answers first)
        var overview = calculateGradingOverview(action[NEW_STATE][PROBLEMS]);
        return {
            ...action[NEW_STATE],
	        "DOC_ID" : Math.floor(Math.random() * 200000000),
            "GRADING_OVERVIEW" : overview,
            "CURRENT_PROBLEM" : overview[PROBLEMS][0][PROBLEM_NUMBER],
            APP_MODE : GRADE_ASSIGNMENTS,
        }
    } else if (action.type === SET_ASSIGNMENT_CONTENT) {
		// TODO - consider serializing DOC_ID and other future top level attributes into file
		// for now this prevents all opened docs from clobbering other suto-saves
        return {
            APP_MODE : EDIT_ASSIGNMENT,
            PROBLEMS : action.PROBLEMS,
	        "DOC_ID" : Math.floor(Math.random() * 200000000)
        };
    } else if (action.type === SET_TO_VIEW_GRADES) {
        // TODO - only allow this to be transitioned to from grading mode
        // also disable or hide the button when student is working on an assignment
        var grades = calculateGrades(state[PROBLEMS]);
        // leave existing entries in the state, so users can navigate back to grading
        return {
            ...state,
            GRADE_INFO : grades,
            APP_MODE : VIEW_GRADES
        };
    } else if (action.type === NAV_BACK_TO_GRADING ) {
        return {
            ...state,
            APP_MODE : GRADE_ASSIGNMENTS,
        };
    } else if (action.type === "SET_CURENT_PROBLEM") {
        return {
            ...state,
            "CURRENT_PROBLEM" : action[PROBLEM_NUMBER]
        };
    } else if (state[APP_MODE] == EDIT_ASSIGNMENT) {
        return {
            ...assignment(state, action),
            APP_MODE : EDIT_ASSIGNMENT
        }
    } else if (state[APP_MODE] == GRADE_ASSIGNMENTS) {
       return {
            ...grading(state, action),
            APP_MODE : GRADE_ASSIGNMENTS
        };
    }
}

function updateAutoSave(docType, docName, appState) {
    // TODO - validate this against actual saved data on startup
    // or possibly just re-derive it each time?
    var saveIndex = window.localStorage.getItem("save_index");
    if (saveIndex) {
        saveIndex = JSON.parse(saveIndex);
    }
    var oldDoc = undefined;
    if (!saveIndex) {
        saveIndex = { "TEACHERS" : {}, "STUDENTS" : {}};
    }
    if (saveIndex[docType][appState["DOC_ID"]]) {
        var toDelete = saveIndex[docType][appState["DOC_ID"]];
    }
    var doc = JSON.stringify(appState);
    // TODO - escape underscores (with double underscore?) in doc name, to allow splitting cleanly
    // and presenting a better name to users
    // nvm will just store a key with spaces
    var dt = new Date();
    var dateString = dt.getFullYear() + "-" + dt.getMonth() + "-" + dt.getDate() + " " + dt.getHours() +
                    ":" + dt.getMinutes() + ":" + dt.getSeconds() + "." + dt.getMilliseconds();
    var saveKey = "auto save " + docType.toLowerCase() + " " + docName + " " + dateString;
    window.localStorage.setItem(saveKey, doc);
    saveIndex[docType][appState["DOC_ID"]] = saveKey;
    window.localStorage.setItem("save_index", JSON.stringify(saveIndex));
    if (toDelete != undefined) {
        window.localStorage.removeItem(toDelete);
    }
}

function autoSave() {
    var appState = window.store.getState();

    if (appState[APP_MODE] == EDIT_ASSIGNMENT) {
        var problems = appState[PROBLEMS];
        // check for the initial state, do not save this
        if (problems.length == 1) {
            var steps = problems[0][STEPS];
            if (steps.length == 1 && steps[0][CONTENT] == '') {
                return;
            }
        }
        updateAutoSave("STUDENTS", appState["ASSIGNMENT_NAME"], appState);
    } else if (appState[APP_MODE] == GRADE_ASSIGNMENTS) {
        // TODO - add input for assignment name to teacher page
        updateAutoSave("TEACHERS", "", appState);
    } else {
        // current other states include mode chooser homepage and view grades "modal"
        return;
    }
}

// TODO FINISH SETTING TO GRADE ANAONYMOUSLY
var TeacherGraderFilters = React.createClass({
    render: function() {
        return (
        <div className="assignment-filters">
            <h3>Grading Settings</h3>
            <div><label><input type="checkbox" id="show-student-names" checked="checked"/>&nbsp;&nbsp;
                    Show student names (or grade anonymously)</label>
            </div>
        </div>
        );
    }
});

// in the teacher grading experince, student work is grouped by similar final answer
// these groups are called solution classes
function testGradeSolutionClass() {

    var input = {
        CURRENT_FILTERS : { SIMILAR_ASSIGNMENT_GROUP_INDEX : null, ANONYMOUS : true },
        SIMILAR_ASSIGNMENT_SETS : [ ],
        PROBLEMS : { "1" : {
            POSSIBLE_POINTS : 6,
            UNIQUE_ANSWERS : [
            { ANSWER : "x=2", FILTER : SHOW_ALL, STUDENT_WORK : [
                { STUDENT_FILE : "jake r.", AUTOMATICALLY_ASSIGNED_SCORE : 0,
                  SCORE : 0, FEEDBACK : "",
                  STEPS : [ { CONTENT : "5x=10"},{ CONTENT : "x=2"} ] },
                { STUDENT_FILE : "alica m.", AUTOMATICALLY_ASSIGNED_SCORE : 0,
                  SCORE : 0, FEEDBACK : "",
                  STEPS : [ { CONTENT : "5x=10"},{ CONTENT : "5x=10"},{ CONTENT : "x=2"} ] }] },
            { ANSWER : "x=-2", FILTER : SHOW_ALL, STUDENT_WORK : [
                { STUDENT_FILE : "jon m.", AUTOMATICALLY_ASSIGNED_SCORE : 0,
                  SCORE : 0, FEEDBACK : "",
                  STEPS : [ { CONTENT : "5x=10"},{ CONTENT : "x=-2"} ] } ] } ]
        } }
    };
    var expectedOutput = {
        CURRENT_FILTERS : { SIMILAR_ASSIGNMENT_GROUP_INDEX : null, ANONYMOUS : true },
        SIMILAR_ASSIGNMENT_SETS : [ ],
        PROBLEMS : { "1" : {
            POSSIBLE_POINTS : 6,
            UNIQUE_ANSWERS : [
                { ANSWER : "x=2", FILTER : SHOW_ALL, STUDENT_WORK : [
                    {STUDENT_FILE : "jake r.", AUTOMATICALLY_ASSIGNED_SCORE : 0, SCORE : 3, FEEDBACK : "", STEPS : [ { CONTENT : "5x=10"},{ CONTENT : "x=2"} ] },
                    {STUDENT_FILE : "alica m.", AUTOMATICALLY_ASSIGNED_SCORE : 0, SCORE : 3, FEEDBACK : "", STEPS : [
                        { CONTENT : "5x=10"},{ CONTENT : "5x=10"},{ CONTENT : "x=2"}
                        ] }
                ] },
                { ANSWER : "x=-2", FILTER : SHOW_ALL, STUDENT_WORK : [ {STUDENT_FILE : "jon m.", AUTOMATICALLY_ASSIGNED_SCORE : 0, SCORE : 0, FEEDBACK : "",
                    STEPS : [ { CONTENT : "5x=10"},{ CONTENT : "x=-2"} ] } ] } ]
        } }
    };
    deepFreeze(input);
    var output = grading(input, { type : GRADE_CLASS_OF_SOLUTIONS, PROBLEM_NUMBER : "1", SOLUTION_CLASS_INDEX : 0, SCORE : 3} );
    expect(output).toEqual(expectedOutput);
}


function testGradeSingleSolution() {
    var input = {
        CURRENT_FILTERS : { SIMILAR_ASSIGNMENT_GROUP_INDEX : null, ANONYMOUS : true },
        SIMILAR_ASSIGNMENT_SETS : [ ],
        PROBLEMS : { "1" : {
            POSSIBLE_POINTS : 6,
            UNIQUE_ANSWERS : [
            { ANSWER : "x=2", FILTER : SHOW_ALL, STUDENT_WORK : [
                { STUDENT_FILE : "jake r.", AUTOMATICALLY_ASSIGNED_SCORE : 0,
                  SCORE : 0, FEEDBACK : "",
                  STEPS : [ { CONTENT : "5x=10"},{ CONTENT : "x=2"} ] },
                { STUDENT_FILE : "alica m.", AUTOMATICALLY_ASSIGNED_SCORE : 0,
                  SCORE : 0, FEEDBACK : "",
                  STEPS : [ { CONTENT : "5x=10"},{ CONTENT : "5x=10"},{ CONTENT : "x=2"} ] }] },
            { ANSWER : "x=-2", FILTER : SHOW_ALL, STUDENT_WORK : [
                { STUDENT_FILE : "jon m.", AUTOMATICALLY_ASSIGNED_SCORE : 0,
                  SCORE : 0, FEEDBACK : "",
                  STEPS : [ { CONTENT : "5x=10"},{ CONTENT : "x=-2"} ] } ] } ]
        } }
    };
    var expectedOutput = {
        CURRENT_FILTERS : { SIMILAR_ASSIGNMENT_GROUP_INDEX : null, ANONYMOUS : true },
        SIMILAR_ASSIGNMENT_SETS : [ ],
        PROBLEMS : { "1" : {
            POSSIBLE_POINTS : 6,
            UNIQUE_ANSWERS : [
                { ANSWER : "x=2", FILTER : SHOW_ALL, STUDENT_WORK : [
                    {STUDENT_FILE : "jake r.", AUTOMATICALLY_ASSIGNED_SCORE : 0, SCORE : 3, FEEDBACK : "", STEPS : [ { CONTENT : "5x=10"},{ CONTENT : "x=2"} ] },
                    {STUDENT_FILE : "alica m.", AUTOMATICALLY_ASSIGNED_SCORE : 0, SCORE : 0, FEEDBACK : "", STEPS : [
                        { CONTENT : "5x=10"},{ CONTENT : "5x=10"},{ CONTENT : "x=2"}
                        ] }
                ] },
                { ANSWER : "x=-2", FILTER : SHOW_ALL, STUDENT_WORK : [ {STUDENT_FILE : "jon m.", AUTOMATICALLY_ASSIGNED_SCORE : 0, SCORE : 0, FEEDBACK : "",
                    STEPS : [ { CONTENT : "5x=10"},{ CONTENT : "x=-2"} ] } ] } ]
        } }
    };
    deepFreeze(input);
    var output = grading(input, { type : GRADE_SINGLE_SOLUTION, PROBLEM_NUMBER : "1", SOLUTION_CLASS_INDEX : 0, SCORE : 3, SOLUTION_INDEX : 0} );
    expect(output).toEqual(expectedOutput);
}

function testAddProblem() {
    var initialAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        PROBLEMS : [ { PROBLEM_NUMBER : "1", STEPS : [{CONTENT : "1+2"}, {CONTENT : "3"}], LAST_SHOWN_STEP : 0 },
                     { PROBLEM_NUMBER : "2", STEPS : [{CONTENT : "4-2"}, {CONTENT : "2"}], LAST_SHOWN_STEP : 0 }
        ]
    }
    var expectedAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        PROBLEMS : [ { PROBLEM_NUMBER : "1", STEPS : [{CONTENT : "1+2"}, {CONTENT : "3"}], LAST_SHOWN_STEP : 0 },
                     { PROBLEM_NUMBER : "2", STEPS : [{CONTENT : "4-2"}, {CONTENT : "2"}], LAST_SHOWN_STEP : 0 },
                     { PROBLEM_NUMBER : "", STEPS : [{CONTENT : ""}], LAST_SHOWN_STEP : 0 }
        ]

    }
    deepFreeze(initialAssignment);
    expect(
        assignment(initialAssignment, { type : ADD_PROBLEM })
    ).toEqual(expectedAssignment);
}

function testRemoveProblem() {
    var initialAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        PROBLEMS : [ { PROBLEM_NUMBER : "1", STEPS : [{CONTNENT : "1+2"},{CONTENT : "3"}], LAST_SHOWN_STEP : 1},
                     { PROBLEM_NUMBER : "2", STEPS : [{CONTENT : "4-2"}, {CONTENT : "2"}], LAST_SHOWN_STEP : 1}
        ]
    }
    var expectedAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        PROBLEMS : [ { PROBLEM_NUMBER : "1", STEPS : [{CONTNENT : "1+2"},{CONTENT : "3"}], LAST_SHOWN_STEP : 1} ]
    }
    deepFreeze(initialAssignment);
    expect(
        assignment(initialAssignment, { type : REMOVE_PROBLEM, PROBLEM_INDEX : 1 })
    ).toEqual(expectedAssignment);
    }

function testCloneProblem() {
    var initialAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        PROBLEMS : [ { PROBLEM_NUMBER : "1", STEPS : [{CONTNENT : "1+2"},{CONTENT : "3"}], LAST_SHOWN_STEP : 1},
                     { PROBLEM_NUMBER : "2", STEPS : [{CONTENT : "4-2"}, {CONTENT : "2"}], LAST_SHOWN_STEP : 1}
        ]
    }
    var expectedAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        PROBLEMS : [ { PROBLEM_NUMBER : "1", STEPS : [{CONTNENT : "1+2"},{CONTENT : "3"}], LAST_SHOWN_STEP : 1},
                     { PROBLEM_NUMBER : "1 - copy", STEPS : [{CONTNENT : "1+2"},{CONTENT : "3"}], LAST_SHOWN_STEP : 1},
                     { PROBLEM_NUMBER : "2", STEPS : [{CONTENT : "4-2"}, {CONTENT : "2"}], LAST_SHOWN_STEP : 1}
        ]
    }
    deepFreeze(initialAssignment);
    expect(
        assignment(initialAssignment, { type : CLONE_PROBLEM, PROBLEM_INDEX : 0 })
    ).toEqual(expectedAssignment);
}

function testRenameProblem() {
    var initialAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        PROBLEMS : [ { PROBLEM_NUMBER : "1", STEPS : [{CONTNENT : "1+2"},{CONTENT : "3"}], LAST_SHOWN_STEP : 1},
                     { PROBLEM_NUMBER : "2", STEPS : [{CONTENT : "4-2"}, {CONTENT : "2"}], LAST_SHOWN_STEP : 1}
        ]
    }
    var expectedAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        PROBLEMS : [ { PROBLEM_NUMBER : "1", STEPS : [{CONTNENT : "1+2"},{CONTENT : "3"}], LAST_SHOWN_STEP : 1},
                     { PROBLEM_NUMBER : "1.a", STEPS : [{CONTENT : "4-2"}, {CONTENT : "2"}], LAST_SHOWN_STEP : 1}
        ]
    }
    deepFreeze(initialAssignment);
    expect(
        assignment(initialAssignment, { type : SET_PROBLEM_NUMBER, PROBLEM_INDEX : 1, NEW_PROBLEM_NUMBER : "1.a"})
    ).toEqual(expectedAssignment);
}

function testEditStep() {
    var initialAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        PROBLEMS : [ { PROBLEM_NUMBER : "1", STEPS : [{CONTENT : "1+2"}, {CONTENT : "3"}], LAST_SHOWN_STEP : 1 },
                     { PROBLEM_NUMBER : "2", STEPS : [{CONTENT : "4-2"}, {CONTENT : "2"}], LAST_SHOWN_STEP : 1 }
        ]
    }
    var expectedAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        PROBLEMS : [ { PROBLEM_NUMBER : "1", STEPS : [{CONTENT : "1+2"}, {CONTENT : "3"}], LAST_SHOWN_STEP : 1 },
                     { PROBLEM_NUMBER : "2", STEPS : [{CONTENT : "4-2"}, {CONTENT : "5"}], LAST_SHOWN_STEP : 1 }
        ]
    }
    deepFreeze(initialAssignment);
    expect(
        assignment(initialAssignment, { type : EDIT_STEP, PROBLEM_INDEX : 1, STEP_KEY : 1, NEW_STEP_CONTENT : "5"})
    ).toEqual(expectedAssignment);
}

function testNewStep() {
    var initialAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        PROBLEMS : [ { PROBLEM_NUMBER : "1", STEPS : [{CONTENT : "1+2"}, {CONTENT : "3"}], LAST_SHOWN_STEP : 1 },
                     { PROBLEM_NUMBER : "2", STEPS : [{CONTENT : "4-2"}, {CONTENT : "2"}], LAST_SHOWN_STEP : 1 }
        ]
    }
    var expectedAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        PROBLEMS : [ { PROBLEM_NUMBER : "1", STEPS : [{CONTENT : "1+2"}, {CONTENT : "3"}], LAST_SHOWN_STEP : 1 },
                     { PROBLEM_NUMBER : "2", STEPS : [{CONTENT : "4-2"}, {CONTENT : "2"}, {CONTENT : "2"}], LAST_SHOWN_STEP : 2 }
        ]
    }
    deepFreeze(initialAssignment);
    expect(
        assignment(initialAssignment, { type : NEW_STEP, PROBLEM_INDEX : 1})
    ).toEqual(expectedAssignment);
}

function testUndoStep() {
    var initialProblem = { PROBLEM_NUMBER : "1", STEPS : [{CONTENT : "1+2"}, {CONTENT : "3"}], LAST_SHOWN_STEP : 1 };
    var expectedProblem = { PROBLEM_NUMBER : "1", STEPS : [{CONTENT : "1+2"}, {CONTENT : "3"}], LAST_SHOWN_STEP : 0 };
    deepFreeze(initialProblem);
    expect(
        problem(initialProblem, { type : UNDO_STEP})
    ).toEqual(expectedProblem);
}

function testRedoStep() {
    var initialProblem = { PROBLEM_NUMBER : "1", STEPS : [{CONTENT : "1+2"}, {CONTENT : "3"}], LAST_SHOWN_STEP : 0 };
    var expectedProblem = { PROBLEM_NUMBER : "1", STEPS : [{CONTENT : "1+2"}, {CONTENT : "3"}], LAST_SHOWN_STEP : 1 };
    deepFreeze(initialProblem);
    expect(
        problem(initialProblem, { type : REDO_STEP})
    ).toEqual(expectedProblem);
}

/*
// Run tests
// TODO - seperate these from app code
testAddProblem();
testRemoveProblem();
testCloneProblem();
testRenameProblem();
testEditStep();
testNewStep();
testUndoStep();
testRedoStep();
testGradeProblem();
testAggregateStudentWork();
// TODO - re-enable
//testAggregateStudentWorkNoAnswerKey();
testGradeSolutionClass();
testGradeSingleSolution();
testSeparateAssignments();
console.log("All tests complete");
*/

export default FreeMath;
