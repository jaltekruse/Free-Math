import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import _ from 'underscore';
import logo from './logo.svg';
import './App.css';
import MathInput from './MathInput.js';
import TeX from './TeX.js';
import FreeMath from './FreeMath.js';
import LogoHomeNav from './LogoHomeNav.js';
import SolutionGrader from './SolutionGrader.js';
import { convertToCurrentFormat } from './TeacherInteractiveGrader.js';
// TODO - move tests out of this file and remove these next 2 imports
import { aggregateStudentWork } from './TeacherInteractiveGrader.js';
import { separateIndividualStudentAssignments } from './TeacherInteractiveGrader.js';
import { gradeSingleProblem } from './TeacherInteractiveGrader.js';
import { calculateGradingOverview } from './TeacherInteractiveGrader.js';
import { problemReducer } from './Problem.js';
import { assignmentReducer } from './Assignment.js';
import { gradingReducer } from './TeacherInteractiveGrader.js';
import { deepFreeze } from './utils.js';

var MathQuill = window.MathQuill;
var Khan = window.Khan;
var MathJax = window.MathJax;
var katex = window.katex;
var katexA11y = window.katexA11y;

var JSZip = window.JSZip ;
var $ = window.$;
var KAS = window.KAS;
var JsDiff = window.JsDiff;
var Chart = window.Chart;

// TODO - THIS IS NOT THE RIGHT WAY TO DO THIS, INSTEAD FIND A VERSION OF LODASH COMPATIBLE WITH KAS

_.cloneDeep = function(oldObject) {
    return JSON.parse(JSON.stringify(oldObject));
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

export function rootReducer(state, action) {
    console.log(action);
    if (state === undefined || action.type == GO_TO_MODE_CHOOSER) {
        return {
            APP_MODE : MODE_CHOOSER
        };
    } else if (action.type === "NEW_ASSIGNMENT") {
        return {
            ...assignmentReducer(),
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
    } else if (state[APP_MODE] == EDIT_ASSIGNMENT) {
        return {
            ...assignmentReducer(state, action),
            APP_MODE : EDIT_ASSIGNMENT
        }
    } else if (state[APP_MODE] == GRADE_ASSIGNMENTS) {
       return {
            ...gradingReducer(state, action),
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
    var dateString = dt.getFullYear() + "-" + (dt.getMonth() + 1) + "-" + dt.getDate() + " " + dt.getHours() +
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
    var output = gradingReducer(input, { type : GRADE_CLASS_OF_SOLUTIONS, PROBLEM_NUMBER : "1", SOLUTION_CLASS_INDEX : 0, SCORE : 3} );
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
    var output = gradingReducer(input, { type : GRADE_SINGLE_SOLUTION, PROBLEM_NUMBER : "1", SOLUTION_CLASS_INDEX : 0, SCORE : 3, SOLUTION_INDEX : 0} );
    expect(output).toEqual(expectedOutput);
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

export { FreeMath as default, autoSave };
