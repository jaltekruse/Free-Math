import JSZip from 'jszip';
import _ from 'underscore';
import { deepFreeze } from './utils.js';
import { convertToCurrentFormat } from './TeacherInteractiveGrader.js';
import { aggregateStudentWork } from './TeacherInteractiveGrader.js';
import { separateIndividualStudentAssignments } from './TeacherInteractiveGrader.js';
import { gradeSingleProblem } from './TeacherInteractiveGrader.js';
import { calculateGradingOverview } from './TeacherInteractiveGrader.js';
import { gradingReducer } from './TeacherInteractiveGrader.js';
import { singleSolutionReducer } from './SolutionGrader.js';

const UNTITLED_ASSINGMENT = 'Untitled Assignment';
var EDIT_ASSIGNMENT = 'EDIT_ASSIGNMENT';

// answer key properties
var GRADE_STRATEGY = "GRADE_STRATEGY";
var ALL_ANSWERS_REQUIRED = "ALL_ANSWERS_REQUIRED";
var ONE_ANSWER_REQUIRED = "ONE_ANSWER_REQUIRED";
var SUBSET_OF_ANSWERS_REQUIRED = "SUBSET_OF_ANSWERS_REQUIRED";
var NUMBER_OF_MATCHING_ANSWERS_REQUIRED = "NUMBER_OF_MATCHING_ANSWERS_REQUIRED";
var POSSIBLE_POINTS = "POSSIBLE_POINTS";

var SHOW_ALL = "SHOW_ALL";

var SUCCESS = 'SUCCESS';
var ERROR = 'ERROR';
var HIGHLIGHT = 'HIGHLIGHT';
var HIGHLIGHT_STEP = 'HIGHLIGHT_STEP';
var STEPS = 'STEPS';
var SET_PROBLEM_FEEDBACK = "SET_PROBLEM_FEEDBACK";
var FEEDBACK = 'FEEDBACK';

var SET_PROBLEM_POSSIBLE_POINTS = "SET_PROBLEM_POSSIBLE_POINTS";
var EDIT_POSSIBLE_POINTS = "EDIT_POSSIBLE_POINTS";
var OLD_POSSIBLE_POINTS = "OLD_POSSIBLE_POINTS";
var POSSIBLE_POINTS = "POSSIBLE_POINTS";
// as the points already assigned for all work on a problem need to be scaled
// wen the possible points changes, and the old a new values need to be
// known at the time of the recalculation, user input is stored in this field
// until the field is submitted (with a button, pressing enter key or focus loss)
var POSSIBLE_POINTS_EDITED = "POSSIBLE_POINTS_EDITED";
var SCORE = "SCORE";
it('test set highlight', () => {
    var input =
        { STUDENT_FILE : "jake r.",
          AUTOMATICALLY_ASSIGNED_SCORE : "",
          SCORE : "", FEEDBACK : "", LAST_SHOWN_STEP: 1,
          STEPS : [
            { CONTENT : "5x=10"},
            { CONTENT : "x=2"}
          ]
        };
    var action = {type : HIGHLIGHT_STEP, STEP_KEY : 1 };
    var expectedOutput =
        { STUDENT_FILE : "jake r.",
          AUTOMATICALLY_ASSIGNED_SCORE : "",
          SCORE : "", FEEDBACK : "", LAST_SHOWN_STEP: 1,
          STEPS : [
            { CONTENT : "5x=10"},
            { CONTENT : "x=2", HIGHLIGHT : ERROR }
          ]
        };

    var output = singleSolutionReducer(input, action);
    expect(output).toEqual(expectedOutput);
    expectedOutput[STEPS][1][HIGHLIGHT] = SUCCESS;
    var output2 = singleSolutionReducer(output, action);
    expect(output2).toEqual(expectedOutput);
    var output3 = singleSolutionReducer(output2, action);
    expect(output3).toEqual(input);
}


it('test set feedback', () => {
    var input =
        { STUDENT_FILE : "jake r.",
          AUTOMATICALLY_ASSIGNED_SCORE : "",
          SCORE : "", FEEDBACK : "", LAST_SHOWN_STEP: 1,
          STEPS : [
            { CONTENT : "5x=10"},
            { CONTENT : "x=2"}
          ]
        };
    var action = {type :  SET_PROBLEM_FEEDBACK , FEEDBACK : "test feedback" };
    var expectedOutput =
        { STUDENT_FILE : "jake r.",
          AUTOMATICALLY_ASSIGNED_SCORE : "",
          SCORE : "", FEEDBACK : "test feedback", LAST_SHOWN_STEP: 1,
          STEPS : [
            { CONTENT : "5x=10"},
            { CONTENT : "x=2"}
          ]
        };

    var output = singleSolutionReducer(input, action);
    expect(output).toEqual(expectedOutput);
    // test clearing feeback
    action[FEEDBACK] = "";
    expectedOutput[FEEDBACK] = "";
    var output2 = singleSolutionReducer(output, action);
    expect(output2).toEqual(expectedOutput);
}

it('test set possible points, individual solution', () => {
    var input =
        { STUDENT_FILE : "jake r.",
          AUTOMATICALLY_ASSIGNED_SCORE : "",
          SCORE : 4, FEEDBACK : "", LAST_SHOWN_STEP: 1,
          STEPS : [
            { CONTENT : "5x=10"},
            { CONTENT : "x=2"}
          ]
        };
    deepFreeze(input);
    var action = { type :  SET_PROBLEM_POSSIBLE_POINTS,
                   OLD_POSSIBLE_POINTS : 8, POSSIBLE_POINTS : "6" };
    var expectedOutput =
        { STUDENT_FILE : "jake r.",
          AUTOMATICALLY_ASSIGNED_SCORE : "",
          SCORE : 3, FEEDBACK : "", LAST_SHOWN_STEP: 1,
          STEPS : [
            { CONTENT : "5x=10"},
            { CONTENT : "x=2"}
          ]
        };

    var output = singleSolutionReducer(input, action);
    expect(output).toEqual(expectedOutput);
    // if possible points cannot be parsed, don't apply
    action[POSSIBLE_POINTS] = '';
    // not clear that unparsible new total points should make
    // the score go to zero, but I'm pretty sure this is guarded against
    // in a higher level reducer
    expectedOutput[SCORE] = 0;
    var output = singleSolutionReducer(input, action);
    expect(output).toEqual(expectedOutput);
}
