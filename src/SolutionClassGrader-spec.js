import { deepFreeze } from './utils.js';
import TeacherInteractiveGrader from './TeacherInteractiveGrader.js';
import { gradingReducer } from './TeacherInteractiveGrader.js';

var STUDENT_WORK = "STUDENT_WORK";
var STUDENT_FILE = 'STUDENT_FILE';

var SCORE = "SCORE";
var FEEDBACK = "FEEDBACK";
var SIMILAR_ASSIGNMENT_GROUP_INDEX = "SIMILAR_ASSIGNMENT_GROUP_INDEX";
var SIMILAR_ASSIGNMENT_SETS = "SIMILAR_ASSIGNMENT_SETS";

// teacher grade page model properties
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

var SET_PROBLEM_FEEDBACK = "SET_PROBLEM_FEEDBACK";
var STEPS = 'STEPS';
var SUCCESS = 'SUCCESS';
var ERROR = 'ERROR';
var HIGHLIGHT = 'HIGHLIGHT';

var SHOW_ALL = 'SHOW_ALL';

window.ga = function() {};

// in the teacher grading experince, student work is grouped by similar final answer
// these groups are called solution classes
it('test Grade Solution Class', () => {
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
});

it('test Grade Single Solution', () => {
    var input = {
        CURRENT_FILTERS : { SIMILAR_ASSIGNMENT_GROUP_INDEX : null, ANONYMOUS : true },
        SIMILAR_ASSIGNMENT_SETS : [ ],
        PROBLEMS : { "1" : {
            POSSIBLE_POINTS : 6,
            UNIQUE_ANSWERS : [
            { ANSWER : "x=2", STUDENT_WORK : [
                { STUDENT_FILE : "jake r.", AUTOMATICALLY_ASSIGNED_SCORE : 0,
                  SCORE : 0, FEEDBACK : "",
                  STEPS : [ { CONTENT : "5x=10"},{ CONTENT : "x=2"} ] },
                { STUDENT_FILE : "alica m.", AUTOMATICALLY_ASSIGNED_SCORE : 0,
                  SCORE : 0, FEEDBACK : "",
                  STEPS : [ { CONTENT : "5x=10"},{ CONTENT : "5x=10"},{ CONTENT : "x=2"} ] }] },
            { ANSWER : "x=-2", STUDENT_WORK : [
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
                { ANSWER : "x=2", STUDENT_WORK : [
                    {STUDENT_FILE : "jake r.", AUTOMATICALLY_ASSIGNED_SCORE : 0, SCORE : 3, FEEDBACK : "", STEPS : [ { CONTENT : "5x=10"},{ CONTENT : "x=2"} ] },
                    {STUDENT_FILE : "alica m.", AUTOMATICALLY_ASSIGNED_SCORE : 0, SCORE : 0, FEEDBACK : "", STEPS : [
                        { CONTENT : "5x=10"},{ CONTENT : "5x=10"},{ CONTENT : "x=2"}
                        ] }
                ] },
                { ANSWER : "x=-2", STUDENT_WORK : [ {STUDENT_FILE : "jon m.", AUTOMATICALLY_ASSIGNED_SCORE : 0, SCORE : 0, FEEDBACK : "",
                    STEPS : [ { CONTENT : "5x=10"},{ CONTENT : "x=-2"} ] } ] } ]
        } }
    };
    deepFreeze(input);
    var output = gradingReducer(input, { type : GRADE_SINGLE_SOLUTION, PROBLEM_NUMBER : "1", SOLUTION_CLASS_INDEX : 0, SCORE : 3, SOLUTION_INDEX : 0} );
    expect(output).toEqual(expectedOutput);
});
