import _ from 'underscore';
import { deepFreeze } from './utils.js';
import { assignmentReducer } from './Assignment.js';
import { convertToCurrentFormat } from './TeacherInteractiveGrader.js';
import { problemReducer } from './Problem.js';

const UNTITLED_ASSINGMENT = 'Untitled Assignment';
var EDIT_ASSIGNMENT = 'EDIT_ASSIGNMENT';

// to implement undo/redo and index for the last step
// to show is tracked and moved up and down
// when this is not at the end of the list and a new
// step is added it moves to the end of the list as
// the redo history in this case will be lost
var LAST_SHOWN_STEP = 'LAST_SHOWN_STEP';

var STEP_KEY = 'STEP_KEY';

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
var CONTENT = "CONTENT";
var PROBLEMS = 'PROBLEMS';

var SUCCESS = 'SUCCESS';
var ERROR = 'ERROR';
var HIGHLIGHT = 'HIGHLIGHT';
var STEPS = 'STEPS';
var SCORE = "SCORE";
var FEEDBACK = "FEEDBACK";

var NEW_STEP = 'NEW_STEP';
var NEW_BLANK_STEP = 'NEW_BLANK_STEP';
// this action expects an index for which problem to change
var UNDO_= 'UNDO';
// this action expects an index for which problem to change
var REDO = 'REDO';

// this action expects:
// PROBLEM_INDEX - for which problem to change
// STEP_KEY - index into the work steps for the given problem
// NEW_STEP_CONTENT - string for the new expression to write in this step
var EDIT_STEP = 'EDIT_STEP';
var POSSIBLE_POINTS = "POSSIBLE_POINTS";
var PROBLEM_NUMBER = 'PROBLEM_NUMBER';

// test converting old problem format to new one
it('test problem format conversion', () => {
    var initialAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        PROBLEMS : [ { PROBLEM_NUMBER : "1",
                       STEPS : [{CONTENT : "1+2"}, {CONTENT : "3"}], LAST_SHOWN_STEP : 0 },
                     { PROBLEM_NUMBER : "2",
                       STEPS : [{CONTENT : "4-2"}, {CONTENT : "2"}], LAST_SHOWN_STEP : 0 }
        ]
    }
})

it('test adding a problem', () => {
    var initialAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        PROBLEMS : [ { PROBLEM_NUMBER : "1",
                       STEPS : [{CONTENT : "1+2"}, {CONTENT : "3"}], LAST_SHOWN_STEP : 1 },
                     { PROBLEM_NUMBER : "2",
                       STEPS : [{CONTENT : "4-2"}, {CONTENT : "2"}], LAST_SHOWN_STEP : 1 }
        ]
    }
    var expectedAssignment = {
        "APP_MODE": "EDIT_ASSIGNMENT",
        "ASSIGNMENT_NAME": "Untitled Assignment", 
        "PROBLEMS": [
            {"PROBLEM_NUMBER": "1", "REDO_STACK": [], "UNDO_STACK": [],
                "STEPS": [{"CONTENT": "1+2"}, {"CONTENT": "3"}]},
            {"PROBLEM_NUMBER": "2", "REDO_STACK": [], "UNDO_STACK": [],
                "STEPS": [{"CONTENT": "4-2"}, {"CONTENT": "2"}]},
            {"PROBLEM_NUMBER": "", "REDO_STACK": [], 
                "STEPS": [{"CONTENT": "", "STEP_ID": 137783185}], "UNDO_STACK": []}]
    };
    deepFreeze(initialAssignment);

    compareOverallEditorState(
        expectedAssignment,
        assignmentReducer(convertToCurrentFormat(initialAssignment), { type : ADD_PROBLEM })
    );
});

// Comparision function that ignores randomly generated IDs
// Still checks that the IDs are set and non-zero, because the fact that
// they are present is important, there values just aren't deterministic.
function compareOverallEditorState(expected, actual) {
    try {
    expect({...expected, PROBLEMS : null}).toEqual({...actual, PROBLEMS : null});
    expected[PROBLEMS].forEach(function (problem, index, arr) {
        compareSingleProblem(problem, actual[PROBLEMS][index]);
    });
    } catch(ex) {
        console.log(ex);
        // Note: diff view is more useful than the low level comparion error for debugging:
        expect(actual).toEqual(expected);
    }
}

// similar to above function for overall editor state, but just for a single problem
function compareSingleProblem(expected, actual) {
    expect({...actual, STEPS : null}).toEqual({...expected, STEPS : null});
    expected[STEPS].forEach(function (step, index, arr) {
        expect({...actual[STEPS][index], STEP_ID : null}).toEqual({...step, STEP_ID: null});
    });
}

it('test removing a problem', () => {
    var initialAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        PROBLEMS : [ { PROBLEM_NUMBER : "1",
                       STEPS : [{CONTNENT : "1+2"},{CONTENT : "3"}], LAST_SHOWN_STEP : 1},
                     { PROBLEM_NUMBER : "2",
                       STEPS : [{CONTENT : "4-2"}, {CONTENT : "2"}], LAST_SHOWN_STEP : 1}
        ]
    }
    var expectedAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        PROBLEMS : [ { PROBLEM_NUMBER : "1",
                       STEPS : [{CONTNENT : "1+2"},{CONTENT : "3"}], UNDO_STACK : [], REDO_STACK : []} ]
    }
    deepFreeze(initialAssignment);
    compareOverallEditorState(
        assignmentReducer(convertToCurrentFormat(initialAssignment), { type : REMOVE_PROBLEM, PROBLEM_INDEX : 1 }),
        (expectedAssignment)
    );
});

it('test cloning a problem', () => {
    var initialAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        PROBLEMS : [ { PROBLEM_NUMBER : "1",
                       STEPS : [{CONTNENT : "1+2"},{CONTENT : "3"}], LAST_SHOWN_STEP : 1},
                     { PROBLEM_NUMBER : "2",
                       STEPS : [{CONTENT : "4-2"}, {CONTENT : "2"}], LAST_SHOWN_STEP : 1}
        ]
    }
    var expectedAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        PROBLEMS : [ { PROBLEM_NUMBER : "1",
                       STEPS : [{CONTNENT : "1+2"},{CONTENT : "3"}], UNDO_STACK : [], REDO_STACK : []},
                     { PROBLEM_NUMBER : "1 - copy",
                       STEPS : [{CONTNENT : "1+2"},{CONTENT : "3"}], UNDO_STACK : [], REDO_STACK : []},
                     { PROBLEM_NUMBER : "2",
                       STEPS : [{CONTENT : "4-2"}, {CONTENT : "2"}], UNDO_STACK : [], REDO_STACK : []}
        ]
    };
    deepFreeze(initialAssignment);
    compareOverallEditorState(
        assignmentReducer(convertToCurrentFormat(initialAssignment), { type : CLONE_PROBLEM, PROBLEM_INDEX : 0 }),
        expectedAssignment
    );
});

it('test renaming a problem', () => {
    var initialAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        PROBLEMS : [ { PROBLEM_NUMBER : "1",
                       STEPS : [{CONTNENT : "1+2"},{CONTENT : "3"}], LAST_SHOWN_STEP : 1},
                     { PROBLEM_NUMBER : "2",
                       STEPS : [{CONTENT : "4-2"}, {CONTENT : "2"}], LAST_SHOWN_STEP : 1}
        ]
    }
    var expectedAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        PROBLEMS : [ { PROBLEM_NUMBER : "1",
                       STEPS : [{CONTNENT : "1+2"},{CONTENT : "3"}], UNDO_STACK : [], REDO_STACK : []},
                     { PROBLEM_NUMBER : "1.a",
                       STEPS : [{CONTENT : "4-2"}, {CONTENT : "2"}], UNDO_STACK : [], REDO_STACK : []}
        ]
    }
    deepFreeze(initialAssignment);
    compareOverallEditorState(
        assignmentReducer(convertToCurrentFormat(initialAssignment),
		{ type : SET_PROBLEM_NUMBER, PROBLEM_INDEX : 1, NEW_PROBLEM_NUMBER : "1.a"}),
        expectedAssignment
    );
});

it('test editing a step', () => {
    var initialAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        PROBLEMS : [ { PROBLEM_NUMBER : "1",
                       STEPS : [{CONTENT : "1+2"}, {CONTENT : "3"}], LAST_SHOWN_STEP : 1 },
                     { PROBLEM_NUMBER : "2",
                       STEPS : [{CONTENT : "4-2"}, {CONTENT : "2"}], LAST_SHOWN_STEP : 1 }
        ]
    }
    var expectedAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        PROBLEMS : [ { PROBLEM_NUMBER : "1",
                       STEPS : [{CONTENT : "1+2"}, {CONTENT : "3"}], UNDO_STACK : [], REDO_STACK : [] },
                     { PROBLEM_NUMBER : "2",
                       STEPS : [{CONTENT : "4-2"}, {CONTENT : "5"}],
                       "UNDO_STACK": [{"INVERSE_ACTION": {"EDIT_TYPE": undefined, 
                                       "NEW_STEP_CONTENT": "5", "POS": undefined,
                                       "PROBLEM_INDEX": 1, "STEP_KEY": 1, "type": "EDIT_STEP"},
                                       "NEW_STEP_CONTENT": "2", "STEP_KEY": 1, "type": "EDIT_STEP"}
		       ],
		       REDO_STACK : [] }
        ]
    }
    deepFreeze(initialAssignment);
    compareOverallEditorState(
        assignmentReducer(convertToCurrentFormat(initialAssignment),
		{ type : EDIT_STEP, PROBLEM_INDEX : 1, STEP_KEY : 1, NEW_STEP_CONTENT : "5"}),
        expectedAssignment
    );
});

it('test adding a step', () => {
    var initialAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        PROBLEMS : [ { PROBLEM_NUMBER : "1",
                       STEPS : [{CONTENT : "1+2"}, {CONTENT : "3"}], LAST_SHOWN_STEP : 1 },
                     { PROBLEM_NUMBER : "2",
                       STEPS : [{CONTENT : "4-2"}, {CONTENT : "2"}], LAST_SHOWN_STEP : 1 }
        ]
    }
    var expectedAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        PROBLEMS : [ { PROBLEM_NUMBER : "1",
                       STEPS : [{CONTENT : "1+2"}, {CONTENT : "3"}], UNDO_STACK : [], REDO_STACK : [] },
                     { PROBLEM_NUMBER : "2",
                       STEPS : [{CONTENT : "4-2"}, {CONTENT : "2"}, {CONTENT : "2"}],
                       UNDO_STACK : 
                       [
                           {"INVERSE_ACTION": {"PROBLEM_INDEX": 1, "type": "NEW_STEP"}, "STEP_KEY": 2, "type": "DELETE_STEP"} 
                       ],
                       REDO_STACK : [] }
        ]
    }
    deepFreeze(initialAssignment);
    compareOverallEditorState(
        assignmentReducer(convertToCurrentFormat(initialAssignment),{ type : NEW_STEP, PROBLEM_INDEX : 1}),
        expectedAssignment
    );
});

it('test adding blank step', () => {
    var initialAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        PROBLEMS : [ { PROBLEM_NUMBER : "1",
                       STEPS : [{CONTENT : "1+2"}, {CONTENT : "3"}], LAST_SHOWN_STEP : 1 },
                     { PROBLEM_NUMBER : "2",
                       STEPS : [{CONTENT : "4-2"}, {CONTENT : "2"}], LAST_SHOWN_STEP : 1 }
        ]
    }
    var expectedAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        PROBLEMS : [ { PROBLEM_NUMBER : "1",
                       STEPS : [{CONTENT : "1+2"}, {CONTENT : "3"}], UNDO_STACK : [], REDO_STACK : [] },
                     { PROBLEM_NUMBER : "2",
                       STEPS : [{CONTENT : "4-2"}, {CONTENT : "2"}, {CONTENT : ""}],
                       UNDO_STACK : [
                                {"INVERSE_ACTION": {"PROBLEM_INDEX": 1, "type": "NEW_BLANK_STEP"},
                                 "STEP_KEY": 2, "type": "DELETE_STEP"}
                       ],
                       REDO_STACK : [] }
        ]
    }
    deepFreeze(initialAssignment);
    compareOverallEditorState(
        assignmentReducer(convertToCurrentFormat(initialAssignment),{ type : NEW_BLANK_STEP, PROBLEM_INDEX : 1}),
        expectedAssignment
    );
});

// TODO - add undo/redo to each of the edit type tests
// TODO - add test for add/delete individual steps in the middle of the list
