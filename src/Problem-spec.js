import _ from 'underscore';
import { deepFreeze, compareOverallEditorState } from './utils.js';
import { assignmentReducer } from './Assignment.js';
import { convertToCurrentFormat } from './TeacherInteractiveGrader.js';
import { problemReducer } from './Problem.js';
import { rootReducer} from './FreeMath.js';

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
var ADD_DEMO_PROBLEM = 'ADD_DEMO_PROBLEM';
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

// TODO - need to finish this test
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

it('test demo creation, undo/redo bug', () => {
    const newAssignment = rootReducer({}, { type : "NEW_ASSIGNMENT" });

    const expected = {
        "APP_MODE": "EDIT_ASSIGNMENT", "ASSIGNMENT_NAME": "Untitled Assignment",
        "PROBLEMS": [
            {"PROBLEM_NUMBER": "", "REDO_STACK": [], "STEPS": [{"CONTENT": "", FORMAT: "MATH"}], "UNDO_STACK": []}
        ],
        "CURRENT_PROBLEM": 0
    };

    compareOverallEditorState(
        newAssignment,
        expected,
    );

    const withDemoProb = rootReducer(newAssignment, {type : ADD_DEMO_PROBLEM});

    const expectedDemo = {"APP_MODE": "EDIT_ASSIGNMENT", "ASSIGNMENT_NAME": "Untitled Assignment",
                          "CURRENT_PROBLEM": 0,
                          "DOC_ID": 105916232, "PROBLEMS": [{"PROBLEM_NUMBER": "Demo", "REDO_STACK": [],
                          "SHOW_TUTORIAL": true, "STEPS": [
                              {"CONTENT": "4+2-3\\left(1+2\\right)", "STEP_ID": 111111}
                          ], "UNDO_STACK": []}, {
                                  "PROBLEM_NUMBER": "Image Demo",
                                  "REDO_STACK": [],
                                  "SHOW_IMAGE_TUTORIAL": true,
                                  "STEPS": [
                                    {
                                      "CONTENT": "",
                                      "STEP_ID": 190393296,
                                    },
                                  ],
                                  "UNDO_STACK": [],
                                },]};

    compareOverallEditorState(
        withDemoProb,
        expectedDemo,
    );

    const afterNextStep = rootReducer(expectedDemo, {type : NEW_STEP, PROBLEM_INDEX : 0});

    const expectedState = {"APP_MODE": "EDIT_ASSIGNMENT", "ASSIGNMENT_NAME": "Untitled Assignment",
                          "CURRENT_PROBLEM": 0,
                          "DOC_ID": 105916232, "PROBLEMS": [{"PROBLEM_NUMBER": "Demo", "REDO_STACK": [],
                          "SHOW_TUTORIAL": true,
                          "STEPS": [
                              {"CONTENT": "4+2-3\\left(1+2\\right)", "STEP_ID": 111111},
                              {"CONTENT": "4+2-3\\left(1+2\\right)", "STEP_ID": 222222}
                          ],
                          "UNDO_STACK": [
                              { "INVERSE_ACTION": {"PROBLEM_INDEX": 0, "STEP_KEY": 0, "type": "NEW_STEP"},
                                "STEP_KEY": 1, "type": "DELETE_STEP"}]},
                          {
                                  "PROBLEM_NUMBER": "Image Demo",
                                  "REDO_STACK": [],
                                  "SHOW_IMAGE_TUTORIAL": true,
                                  "STEPS": [
                                    {
                                      "CONTENT": "",
                                      "STEP_ID": 190393296,
                                    },
                                  ],
                                  "UNDO_STACK": [],
                                }
                          ]};

    compareOverallEditorState(
        afterNextStep,
        expectedState,
    );

    const afterFirstUndo = rootReducer(afterNextStep, {type : "UNDO", PROBLEM_INDEX : 0});

    const expectedUndoState = {"APP_MODE": "EDIT_ASSIGNMENT", "ASSIGNMENT_NAME": "Untitled Assignment",
                               "DOC_ID": 105916232, "CURRENT_PROBLEM": 0,
                               "PROBLEMS": [
                                   { "PROBLEM_NUMBER": "Demo",
                                     "REDO_STACK": [
                                       { "INVERSE_ACTION": {
                                            "INVERSE_ACTION": undefined, "STEP_KEY": 1, "type": "DELETE_STEP"
                                         },
                                         "PROBLEM_INDEX": 0, "STEP_KEY": 0, "type": "NEW_STEP"
                                       }
                                     ],
                                     "SHOW_TUTORIAL": true,
                                     "STEPS": [
                                        {"CONTENT": "4+2-3\\left(1+2\\right)", "STEP_ID": 111111},
                                     ], "UNDO_STACK": []},
                                {
                                  "PROBLEM_NUMBER": "Image Demo",
                                  "REDO_STACK": [],
                                  "SHOW_IMAGE_TUTORIAL": true,
                                  "STEPS": [
                                    {
                                      "CONTENT": "",
                                      "STEP_ID": 190393296,
                                    },
                                  ],
                                  "UNDO_STACK": [],
                                }]};

    compareOverallEditorState(
        afterFirstUndo,
        expectedUndoState,
    );

    const afterSecondUndo = rootReducer(afterFirstUndo, {type : "UNDO", PROBLEM_INDEX : 0});

    const expectedUndoState2 = {"APP_MODE": "EDIT_ASSIGNMENT", "ASSIGNMENT_NAME": "Untitled Assignment",
                               "DOC_ID": 105916232, "CURRENT_PROBLEM": 0,
                               "PROBLEMS": [
                                   { "PROBLEM_NUMBER": "Demo",
                                     "REDO_STACK": [
                                       { "INVERSE_ACTION": {
                                            "INVERSE_ACTION": undefined, "STEP_KEY": 1, "type": "DELETE_STEP"
                                         },
                                         "PROBLEM_INDEX": 0, "STEP_KEY": 0, "type": "NEW_STEP"
                                       }
                                     ],
                                     "SHOW_TUTORIAL": true,
                                     "STEPS": [
                                        {"CONTENT": "4+2-3\\left(1+2\\right)", "STEP_ID": 111111},
                                     ], "UNDO_STACK": []},
                                {
                                  "PROBLEM_NUMBER": "Image Demo",
                                  "REDO_STACK": [],
                                  "SHOW_IMAGE_TUTORIAL": true,
                                  "STEPS": [
                                    {
                                      "CONTENT": "",
                                      "STEP_ID": 190393296,
                                    },
                                  ],
                                  "UNDO_STACK": [],
                                }]};

    compareOverallEditorState(
        afterSecondUndo,
        expectedUndoState2,
    );

    const afterThirdUndo = rootReducer(afterSecondUndo, {type : "UNDO", PROBLEM_INDEX : 0});

    const expectedUndoState3 =
        {"APP_MODE": "EDIT_ASSIGNMENT", "ASSIGNMENT_NAME": "Untitled Assignment",
                               "DOC_ID": 105916232, "CURRENT_PROBLEM": 0,
                               "PROBLEMS": [
                                   { "PROBLEM_NUMBER": "Demo",
                                     "REDO_STACK": [
                                       {"INVERSE_ACTION": {"INVERSE_ACTION": undefined,
                                                            "STEP_KEY": 1, "type": "DELETE_STEP"},
                                           "PROBLEM_INDEX": 0, "STEP_KEY": 0, "type": "NEW_STEP"}
                                     ],
                                     "SHOW_TUTORIAL": true,
                                     "STEPS": [
                                        {"CONTENT": "4+2-3\\left(1+2\\right)", "STEP_ID": 111111},
                                     ], "UNDO_STACK": []},
                                {
                                  "PROBLEM_NUMBER": "Image Demo",
                                  "REDO_STACK": [],
                                  "SHOW_IMAGE_TUTORIAL": true,
                                  "STEPS": [
                                    {
                                      "CONTENT": "",
                                      "STEP_ID": 190393296,
                                    },
                                  ],
                                  "UNDO_STACK": [],
                                }]};

    compareOverallEditorState(
        afterThirdUndo,
        expectedUndoState3,
    );
});

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
        "CURRENT_PROBLEM": 2,
        "PROBLEMS": [
            {"PROBLEM_NUMBER": "1", "REDO_STACK": [], "UNDO_STACK": [],
                "STEPS": [{"CONTENT": "1+2"}, {"CONTENT": "3"}]},
            {"PROBLEM_NUMBER": "2", "REDO_STACK": [], "UNDO_STACK": [],
                "STEPS": [{"CONTENT": "4-2"}, {"CONTENT": "2"}]},
            {"PROBLEM_NUMBER": "", "REDO_STACK": [],
                "STEPS": [{"CONTENT": "", FORMAT: "MATH", "STEP_ID": 137783185}], "UNDO_STACK": []}]
    };
    deepFreeze(initialAssignment);

    compareOverallEditorState(
        expectedAssignment,
        assignmentReducer(convertToCurrentFormat(initialAssignment), { type : ADD_PROBLEM })
    );
});

it('test removing a problem', () => {
    var initialAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        PROBLEMS : [ { PROBLEM_NUMBER : "1",
                       STEPS : [{CONTENT : "1+2"},{CONTENT : "3"}], LAST_SHOWN_STEP : 1},
                     { PROBLEM_NUMBER : "2",
                       STEPS : [{CONTENT : "4-2"}, {CONTENT : "2"}], LAST_SHOWN_STEP : 1}
        ]
    }
    var expectedAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        CURRENT_PROBLEM: 0,
        PROBLEMS : [ { PROBLEM_NUMBER : "1",
                       STEPS : [{CONTENT : "1+2"},{CONTENT : "3"}], UNDO_STACK : [], REDO_STACK : []} ]
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
                       STEPS : [{CONTENT : "1+2"},{CONTENT : "3"}], LAST_SHOWN_STEP : 1},
                     { PROBLEM_NUMBER : "2",
                       STEPS : [{CONTENT : "4-2"}, {CONTENT : "2"}], LAST_SHOWN_STEP : 1}
        ]
    }
    var expectedAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        CURRENT_PROBLEM: 0,
        PROBLEMS : [ { PROBLEM_NUMBER : "1",
                       STEPS : [{CONTENT : "1+2"},{CONTENT : "3"}], UNDO_STACK : [], REDO_STACK : []},
                     { PROBLEM_NUMBER : "1 - copy",
                       STEPS : [{CONTENT : "1+2"},{CONTENT : "3"}], UNDO_STACK : [], REDO_STACK : []},
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
                       STEPS : [{CONTENT : "1+2"},{CONTENT : "3"}], LAST_SHOWN_STEP : 1},
                     { PROBLEM_NUMBER : "2",
                       STEPS : [{CONTENT : "4-2"}, {CONTENT : "2"}], LAST_SHOWN_STEP : 1}
        ]
    }
    var expectedAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        CURRENT_PROBLEM: 0,
        PROBLEMS : [ { PROBLEM_NUMBER : "1",
                       STEPS : [{CONTENT : "1+2"},{CONTENT : "3"}], UNDO_STACK : [], REDO_STACK : []},
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
        CURRENT_PROBLEM: 0,
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
        CURRENT_PROBLEM: 0,
        PROBLEMS : [ { PROBLEM_NUMBER : "1",
                       STEPS : [{CONTENT : "1+2"}, {CONTENT : "3"}], UNDO_STACK : [], REDO_STACK : [] },
                     { PROBLEM_NUMBER : "2",
                       STEPS : [{CONTENT : "4-2"}, {CONTENT : "2"}, {CONTENT : "2"}],
                       UNDO_STACK :
                       [
                           {"INVERSE_ACTION": {"PROBLEM_INDEX": 1, "STEP_KEY": 1, "type": "NEW_STEP"},
                               "STEP_KEY": 2, "type": "DELETE_STEP"}
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
        CURRENT_PROBLEM: 0,
        PROBLEMS : [ { PROBLEM_NUMBER : "1",
                       STEPS : [{CONTENT : "1+2"}, {CONTENT : "3"}], UNDO_STACK : [], REDO_STACK : [] },
                     { PROBLEM_NUMBER : "2",
                         STEPS : [{CONTENT : "4-2"}, {CONTENT : "2"}, {CONTENT : "", FORMAT: "MATH"}],
                       UNDO_STACK : [
                                {"INVERSE_ACTION": {"PROBLEM_INDEX": 1, "STEP_KEY": 1, "type": "NEW_BLANK_STEP"},
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
