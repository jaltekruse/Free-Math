import _ from 'underscore';
import { deepFreeze, compareOverallEditorState } from './testUtils.js';
import { assignmentReducer } from './Assignment.js';
import { convertToCurrentFormat } from './TeacherInteractiveGrader.js';
import { problemReducer } from './Problem.js';
import { cloneDeep, rootReducer} from './FreeMath.js';

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
var UNDO = 'UNDO';
// this action expects an index for which problem to change
var REDO = 'REDO';
var UNDO_STACK = 'UNDO_STACK';
var REDO_STACK = 'REDO_STACK';
var INVERSE_ACTION = 'INVERSE_ACTION';

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

/*
it('test demo creation, undo/redo bug', () => {
    const newAssignment = rootReducer({}, { type : "NEW_ASSIGNMENT" });

    const expected = {
        "APP_MODE": "EDIT_ASSIGNMENT", "ASSIGNMENT_NAME": "Untitled Assignment",
        "GOOGLE_DRIVE_STATE": "ALL_SAVED",
        "PROBLEMS": [
            {"PROBLEM_NUMBER": "", "REDO_STACK": [], "STEPS": [{"CONTENT": "", FORMAT: "MATH"}], "UNDO_STACK": []}
        ],
        "BUTTON_GROUP": "BASIC",
        "CURRENT_PROBLEM": 0
    };

    compareOverallEditorState(
        expected,
        newAssignment
    );

    const withDemoProb = rootReducer(newAssignment, {type : ADD_DEMO_PROBLEM});

    const expectedDemo = {"APP_MODE": "EDIT_ASSIGNMENT", "ASSIGNMENT_NAME": "Untitled Assignment",
                          "BUTTON_GROUP": "BASIC",
                          "CURRENT_PROBLEM": 0,
                          "GOOGLE_DRIVE_STATE": "ALL_SAVED",
                          "DOC_ID": 105916232, "PROBLEMS": [{"PROBLEM_NUMBER": "Demo", "REDO_STACK": [],
                          "SHOW_TUTORIAL": true, "STEPS": [
                              {"CONTENT": "4+2-3\\left(1+2\\right)", "STEP_ID": 111111}
                          ], "UNDO_STACK": []}]};

    compareOverallEditorState(
        expectedDemo,
        withDemoProb
    );

    const afterNextStep = rootReducer(expectedDemo, {type : NEW_STEP, PROBLEM_INDEX : 0});

    const expectedState = {"APP_MODE": "EDIT_ASSIGNMENT", "ASSIGNMENT_NAME": "Untitled Assignment",
                          "BUTTON_GROUP": "BASIC",
                          "CURRENT_PROBLEM": 0,
                          "GOOGLE_DRIVE_STATE": "ALL_SAVED",
                          "DOC_ID": 105916232, "PROBLEMS": [{"PROBLEM_NUMBER": "Demo", "REDO_STACK": [],
                          "SHOW_TUTORIAL": true,
                          "STEPS": [
                              {"CONTENT": "4+2-3\\left(1+2\\right)", "STEP_ID": 111111},
                              {"CONTENT": "4+2-3\\left(1+2\\right)", "STEP_ID": 222222}
                          ],
                          "UNDO_STACK": [
                              { "INVERSE_ACTION": {"PROBLEM_INDEX": 0, "STEP_KEY": 0, "type": "NEW_STEP"},
                                "STEP_KEY": 1, "type": "DELETE_STEP"}]}]};

    compareOverallEditorState(
        expectedState,
        afterNextStep
    );

    const afterFirstUndo = rootReducer(afterNextStep, {type : "UNDO", PROBLEM_INDEX : 0});

    const expectedUndoState = {"APP_MODE": "EDIT_ASSIGNMENT", "ASSIGNMENT_NAME": "Untitled Assignment",
                               "DOC_ID": 105916232, "BUTTON_GROUP": "BASIC", "CURRENT_PROBLEM": 0,
                                "GOOGLE_DRIVE_STATE": "ALL_SAVED",
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
                                     ], "UNDO_STACK": []}]};

    compareOverallEditorState(
        expectedUndoState,
        afterFirstUndo
    );

    const afterSecondUndo = rootReducer(afterFirstUndo, {type : "UNDO", PROBLEM_INDEX : 0});

    const expectedUndoState2 = {"APP_MODE": "EDIT_ASSIGNMENT", "ASSIGNMENT_NAME": "Untitled Assignment",
                               "DOC_ID": 105916232, "BUTTON_GROUP": "BASIC", "CURRENT_PROBLEM": 0,
                                "GOOGLE_DRIVE_STATE": "ALL_SAVED",
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
                                     ], "UNDO_STACK": []}]};

    compareOverallEditorState(
        expectedUndoState2,
        afterSecondUndo
    );

    const afterThirdUndo = rootReducer(afterSecondUndo, {type : "UNDO", PROBLEM_INDEX : 0});

    const expectedUndoState3 =
        {"APP_MODE": "EDIT_ASSIGNMENT", "ASSIGNMENT_NAME": "Untitled Assignment",
                               "DOC_ID": 105916232, "BUTTON_GROUP": "BASIC", "CURRENT_PROBLEM": 0,
                                "GOOGLE_DRIVE_STATE": "ALL_SAVED",
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
                                     ], "UNDO_STACK": []}]};

    compareOverallEditorState(
        expectedUndoState3,
        afterThirdUndo
    );
});
*/

/*
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
*/

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

it('test editing an image step, then undo', () => {
    var initialAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        PROBLEMS : [ { PROBLEM_NUMBER : "1",
                       STEPS : [{CONTENT : "1+2"}], LAST_SHOWN_STEP : 0 },
        ]
    }
    var expectedAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        CURRENT_PROBLEM: 0,
        PROBLEMS: [
            { "PROBLEM_NUMBER": "1",
              "REDO_STACK": [], "STEPS": [
                  {"CONTENT": "1+2"},
                  {"CONTENT": "image_content_stand_in", "FORMAT": "IMG"}],
              "UNDO_STACK": [{"INVERSE_ACTION": {
                "PROBLEM_INDEX": 0, "STEP_DATA": {"CONTENT": "image_content_stand_in", "FORMAT": "IMG"},
                "STEP_KEY": 0, "type": "NEW_STEP"}, "STEP_KEY": 1, "type": "DELETE_STEP"}]
            }
        ]
    };

    var addImgAction = {
        type : "NEW_STEP", "PROBLEM_INDEX" : 0,
        STEP_DATA : {FORMAT: "IMG", CONTENT : "image_content_stand_in"}
    };
    deepFreeze(initialAssignment);
    compareOverallEditorState(
        expectedAssignment,
        assignmentReducer(convertToCurrentFormat(initialAssignment), addImgAction)
    );


    deepFreeze(expectedAssignment);
    var editImgAction = {
        type : "EDIT_STEP", "PROBLEM_INDEX" : 0, STEP_KEY: 1,
        NEW_STEP_CONTENT: "image_edited", NEW_FABRIC_SRC: "fabric_src_for_drawings",
        STEP_DATA : {FORMAT: "IMG", CONTENT : "image_content_stand_in"}
    };

    var expectedAfterEdit = {"APP_MODE": "EDIT_ASSIGNMENT", "ASSIGNMENT_NAME": "Untitled Assignment", "CURRENT_PROBLEM": 0, "PROBLEMS": [{"PROBLEM_NUMBER": "1", "REDO_STACK": [], "STEPS": [{"CONTENT": "1+2"}, {"CONTENT": "image_edited", "FABRIC_SRC": "fabric_src_for_drawings", "FORMAT": undefined}], "UNDO_STACK": [{"FORMAT": "IMG", "INVERSE_ACTION": {"EDIT_TYPE": undefined, "NEW_FABRIC_SRC": "fabric_src_for_drawings", "NEW_STEP_CONTENT": "image_edited", "POS": undefined, "PROBLEM_INDEX": 0, "STEP_DATA": {"CONTENT": "image_content_stand_in", "FORMAT": "IMG"}, "STEP_KEY": 1, "type": "EDIT_STEP"}, "NEW_STEP_CONTENT": "image_content_stand_in", "STEP_KEY": 1, "type": "EDIT_STEP"}, {"INVERSE_ACTION": {"PROBLEM_INDEX": 0, "STEP_DATA": {"CONTENT": "image_content_stand_in", "FORMAT": "IMG"}, "STEP_KEY": 0, "type": "NEW_STEP"}, "STEP_KEY": 1, "type": "DELETE_STEP"}]}]};


    compareOverallEditorState(
        expectedAfterEdit,
        assignmentReducer(convertToCurrentFormat(expectedAssignment), editImgAction)
    );

    deepFreeze(expectedAfterEdit);

    const expectedAfterUndo = {"APP_MODE": "EDIT_ASSIGNMENT", "ASSIGNMENT_NAME": "Untitled Assignment", "CURRENT_PROBLEM": 0, "PROBLEMS": [{"PROBLEM_NUMBER": "1", "REDO_STACK": [{"EDIT_TYPE": undefined, "INVERSE_ACTION": {"FORMAT": "IMG", "INVERSE_ACTION": undefined, "NEW_STEP_CONTENT": "image_content_stand_in", "STEP_KEY": 1, "type": "EDIT_STEP"}, NEW_FABRIC_SRC: "fabric_src_for_drawings", "NEW_STEP_CONTENT": "image_edited", "POS": undefined, "PROBLEM_INDEX": 0, "STEP_DATA": {"CONTENT": "image_content_stand_in", "FORMAT": "IMG"}, "STEP_KEY": 1, "type": "EDIT_STEP"}], "STEPS": [{"CONTENT": "1+2"}, {"CONTENT": "image_content_stand_in", "FABRIC_SRC": undefined, "FORMAT": "IMG"}], "UNDO_STACK": [{"INVERSE_ACTION": {"PROBLEM_INDEX": 0, "STEP_DATA": {"CONTENT": "image_content_stand_in", "FORMAT": "IMG"}, "STEP_KEY": 0, "type": "NEW_STEP"}, "STEP_KEY": 1, "type": "DELETE_STEP"}]}]};

    const afterUndo = rootReducer(expectedAfterEdit, {type : "UNDO", PROBLEM_INDEX : 0});
    compareOverallEditorState(
        expectedAfterUndo,
        afterUndo
    );

    deepFreeze(expectedAfterUndo);
    const afterRedo = rootReducer(expectedAfterUndo, {type : "REDO", PROBLEM_INDEX : 0});

    const expectedAfterRedo = cloneDeep(expectedAfterEdit);
    expectedAfterRedo[PROBLEMS][0][UNDO_STACK][0][INVERSE_ACTION][INVERSE_ACTION] =
                {
                  "FORMAT": "IMG",
                  "INVERSE_ACTION": undefined,
                  "NEW_STEP_CONTENT": "image_content_stand_in",
                  "STEP_KEY": 1,
                  "type": "EDIT_STEP",
                };

    compareOverallEditorState(
        expectedAfterRedo,
        afterRedo
    );

    /*

            handleImgUrl(editorInstance.toDataURL({format: 'jpeg'}), stepIndex, problemIndex, steps,
                         fabricSrc);
function handleImg(imgFile, stepIndex, problemIndex, steps) {
    handleImgUrl(window.URL.createObjectURL(imgFile), stepIndex, problemIndex, steps);
}

// fabricSrc is the Json serialization of the edited image to allow further moving places objecsts/drawings
function handleImgUrl(objUrl, stepIndex, problemIndex, steps, fabricSrc = undefined) {
    window.store.dispatch(
        { type : EDIT_STEP, PROBLEM_INDEX : problemIndex, STEP_KEY: stepIndex,
            FORMAT: IMG, NEW_STEP_CONTENT: objUrl, FABRIC_SRC : fabricSrc } );
    addNewLastStepIfNeeded(steps, stepIndex, problemIndex);
}
     */
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
