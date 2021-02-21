import JSZip from 'jszip';
import { cloneDeep, merge } from './FreeMath.js';
import { deepFreeze, compareOverallEditorState } from './testUtils.js';
import { assignmentReducer } from './Assignment.js';
import { convertToCurrentFormat, aggregateStudentWork,
         separateIndividualStudentAssignments, gradeSingleProblem,
         calculateGradingOverview, gradingReducer, singleSolutionReducer } from './TeacherInteractiveGrader.js';

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

var NEW_BLANK_STEP = 'NEW_BLANK_STEP';

var PROBLEMS = 'PROBLEMS';
var UNIQUE_ANSWERS = 'UNIQUE_ANSWERS';
var STUDENT_WORK = 'STUDENT_WORK';

/*
 - start with a student doc
 - make teacher model out of it (aggerateStudentWork)
     - perform teacher action
     - extract back out individual student doc
 - with copy of same starting student doc, call student modification action
 - then take the two docs and pass into new merge function
     - doesn't need to be general purpose merge of arbitrary edits, just one teacher and one student editor
     - does the person who will view the result of the merge impact the result?
         - probably shouldn't as this is intended to support concurrent updates
         - so teacher loses, which should only happen when student deletes stuff
         - don't bring back student problems/steps just because there was a taecher comment on them
 */
/*
it('test merging student and teacher edits', () => {

    // copied from test add blank step in Problem-spec
    var initialAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        PROBLEMS : [ { PROBLEM_NUMBER : "1",
                       STEPS : [{CONTENT : "1+2"}, {CONTENT : "3"}], UNDO_STACK : [], REDO_STACK : []},
                     { PROBLEM_NUMBER : "2",
                       STEPS : [{CONTENT : "4-2"}, {CONTENT : "2"}], UNDO_STACK : [], REDO_STACK : []}
        ]
    }
    var expectedAssignment = {
        APP_MODE : EDIT_ASSIGNMENT,
        ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
        CURRENT_PROBLEM: 0,
        PROBLEMS : [ { PROBLEM_NUMBER : "1",
                       STEPS : [{CONTENT : "1+2"}, {CONTENT : "3"}], UNDO_STACK : [], REDO_STACK : [] },
                     { PROBLEM_NUMBER : "2",
                         STEPS : [{CONTENT : "4-2"}, {CONTENT : "2"}, {CONTENT : "", FORMAT : "MATH"}],
                       UNDO_STACK : [
                                {"INVERSE_ACTION": {"PROBLEM_INDEX": 1, "STEP_KEY": 1, "type": "NEW_BLANK_STEP"},
                                 "STEP_KEY": 2, "type": "DELETE_STEP"}
                       ],
                       REDO_STACK : [] }
        ]
    }
    deepFreeze(initialAssignment);
    compareOverallEditorState(
        assignmentReducer(convertToCurrentFormat(initialAssignment), { type : NEW_BLANK_STEP, PROBLEM_INDEX : 1}),
        expectedAssignment
    );

    const filename = "test student name";
    var allStudentWork = [
        { STUDENT_FILE : filename,
          ASSIGNMENT: initialAssignment[PROBLEMS]
        }
    ];
    // TODO - figure out how to include depedencies like KAS in webpack so I can test them, currently included
    // in the app using global script tags in index.html
    var aggregated = aggregateStudentWork(allStudentWork, {}, function(expr1, expr2) {return expr1 === expr2;});

    var action = { type : HIGHLIGHT_STEP,
                    PROBLEM_NUMBER : "1",
                    SOLUTION_CLASS_INDEX : 0,
                    SOLUTION_INDEX : 0,
                    STEP_KEY : 1};
    deepFreeze(aggregated);
    var expectedTeacherState = cloneDeep(aggregated);
    expectedTeacherState[PROBLEMS]["1"][UNIQUE_ANSWERS][0][STUDENT_WORK][0][STEPS][1][HIGHLIGHT] = 'ERROR';
    var observedTeacherState = gradingReducer(aggregated, action);

    expect(observedTeacherState).toEqual(expectedTeacherState);

    var convertedBackToStudentModel =
        separateIndividualStudentAssignments(observedTeacherState)[filename];

    var expectedMergedState = cloneDeep(expectedAssignment);

    expectedMergedState[PROBLEMS][0][STEPS][1][HIGHLIGHT] = 'ERROR';
    expectedMergedState[PROBLEMS][0][FEEDBACK] = '';
    expectedMergedState[PROBLEMS][1][FEEDBACK] = '';

    var observedMergedState = merge(expectedAssignment, convertedBackToStudentModel);
    expect(observedMergedState).toEqual(expectedMergedState);
});
*/

//      [ { "PROBLEM_NUMBER" : "1", POSSIBLE_POINTS : 3, "ANSWER_CLASSES" : [ { SCORE : 1, ANSWERS : ["x=5", "5=x"]}, { "SCORE" : 0.5, ANSWERS : ["x=-5","-5=x"] ],
//          "GRADE_STRATEGY" : "ALL_ANSWERS_REQUIRED" | "ONE_ANSWER_REQUIRED" | "SUBSET_OF_ANSWERS_REQUIRED", "NUMBER_OF_MATCHING_ANSWERS_REQUIRED" : 2 } ]
it('test grading a problem', () => {
    var answerKey = {
        "1" : { POSSIBLE_POINTS : 3,
                ANSWER_CLASSES : [
                    { SCORE : 1,
                      ANSWERS : ["x=5", "5=x"],
                      GRADE_STRATEGY : ONE_ANSWER_REQUIRED },
                    { SCORE : 0.5,
                      ANSWERS : ["x=-5", "-5=x"],
                      GRADE_STRATEGY : ONE_ANSWER_REQUIRED }] } };
    deepFreeze(answerKey);
    var studentAnswer1 = { PROBLEM_NUMBER : 1, STEPS : [ {CONTENT : "2x=10"}, {CONTENT : "x=5"}]};
    var studentAnswer2 = { PROBLEM_NUMBER : 1, STEPS : [ {CONTENT : "2x=10"}, {CONTENT : "x=-5"}]};
    deepFreeze(studentAnswer1);
    deepFreeze(studentAnswer2);
    expect(gradeSingleProblem(studentAnswer1, answerKey)).toEqual(3);
    expect(gradeSingleProblem(studentAnswer2, answerKey)).toEqual(1.5);
});

it('test aggregate student work', () => {
    var allStudentWork = [
        { STUDENT_FILE : "jake r.",
          ASSIGNMENT: [
            { PROBLEM_NUMBER : 1, LAST_SHOWN_STEP : 1,
              STEPS : [
            { CONTENT : "5x=10"},
            { CONTENT : "x=2"}]}]},
        { STUDENT_FILE : "jon m.",
            ASSIGNMENT: [
                { PROBLEM_NUMBER : 1, LAST_SHOWN_STEP : 1,
                  STEPS : [
                        { CONTENT : "5x=10"},
                        { CONTENT : "x=-2"}
                  ]
                }
            ]
        }
    ];
    deepFreeze(allStudentWork);
    var answerKey = { "1" : {
            POSSIBLE_POINTS : 3,
            ANSWER_CLASSES : [
                { SCORE : 1, ANSWERS : ["x=2", "2=x"], GRADE_STRATEGY : ONE_ANSWER_REQUIRED},
                { SCORE : 0.5, ANSWERS : ["x=-2","-2=x"], GRADE_STRATEGY : ONE_ANSWER_REQUIRED } ],
            } };
    deepFreeze(answerKey);
    var expectedOutput = {
        CURRENT_FILTERS : { SIMILAR_ASSIGNMENT_GROUP_INDEX : null, ANONYMOUS : true },
        SIMILAR_ASSIGNMENT_SETS : [ ],
        PROBLEMS : {
            "1" : {
                POSSIBLE_POINTS : 6,
                POSSIBLE_POINTS_EDITED : 6,
                UNIQUE_ANSWERS : [
                    { ANSWER : "x=2", FILTER : SHOW_ALL,
                      STUDENT_WORK : [
                        { STUDENT_FILE : "jake r.", AUTOMATICALLY_ASSIGNED_SCORE : 3,
                          SCORE : NaN, FEEDBACK : "",
                          POSSIBLE_POINTS : 6,
                          LAST_SHOWN_STEP : 1,
                          PROBLEM_NUMBER : 1,
                          STEPS : [
                            { CONTENT : "5x=10"},
                            { CONTENT : "x=2"}
                          ]
                        }
                      ]
                    },
                    { ANSWER : "x=-2", FILTER : SHOW_ALL,
                      STUDENT_WORK : [
                        { STUDENT_FILE : "jon m.", AUTOMATICALLY_ASSIGNED_SCORE : 1.5,
                          SCORE : NaN,FEEDBACK : "",
                          POSSIBLE_POINTS : 6,
                          LAST_SHOWN_STEP: 1,
                          PROBLEM_NUMBER : 1,
                          STEPS : [
                            { CONTENT : "5x=10"},
                            { CONTENT : "x=-2"}
                          ]
                        }
                      ]
                    }
                ]
            }
        }
    };
    // TODO - figure out how to include depedencies like KAS in webpack so I can test them, currently included
    // in the app using global script tags in index.html
    var output = aggregateStudentWork(allStudentWork, answerKey, function(expr1, expr2) {return expr1 === expr2;});
    expect(output).toEqual(expectedOutput);
});

it('test separate assignments', () => {
    var input = {
        CURRENT_FILTERS : { SIMILAR_ASSIGNMENT_GROUP_INDEX : null, ANONYMOUS : true },
        SIMILAR_ASSIGNMENT_SETS : [ ],
        PROBLEMS : {
            "1" : {
                POSSIBLE_POINTS : 3,
                UNIQUE_ANSWERS : [
                    { ANSWER : "x=2", FILTER : SHOW_ALL,
                      STUDENT_WORK : [
                        { STUDENT_FILE : "jake r.", AUTOMATICALLY_ASSIGNED_SCORE : 3,
                          SCORE : 3, FEEDBACK : "",
                          STEPS : [
                            { CONTENT : "5x=10"},
                            { CONTENT : "x=2"}
                          ]
                        }
                      ]
                    },
                    { ANSWER : "x=-2", FILTER : SHOW_ALL,
                      STUDENT_WORK : [
                        { STUDENT_FILE : "jon m.", FEEDBACK : "Watch your signs",
                          AUTOMATICALLY_ASSIGNED_SCORE : 1.5,  SCORE : 1.5,
                          STEPS : [
                            { CONTENT : "5x=10"},
                            { CONTENT : "x=-2", HIGHLIGHT : ERROR}
                          ]
                        }
                      ]
                    }
                ]
            }
        }
    };

    deepFreeze(input);

    // test separating the student work back out into individual assignments
    var separatedAssignments = separateIndividualStudentAssignments(input);

    var expectedOutput =
    {
        "jake r.": {
            PROBLEMS : [{
                SCORE : 3,
                FEEDBACK: "",
                STEPS: [{
                    CONTENT: "5x=10"
                }, {
                    CONTENT: "x=2"
                }],
                PROBLEM_NUMBER: "1",
                POSSIBLE_POINTS: 3
            }]
        },
        "jon m.": {
            PROBLEMS: [{
                FEEDBACK: "Watch your signs",
                SCORE: 1.5,
                STEPS: [{
                    CONTENT: "5x=10"
                }, {
                    CONTENT: "x=-2",
                    HIGHLIGHT: ERROR
                }],
                PROBLEM_NUMBER : "1",
                POSSIBLE_POINTS: 3
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
});

it('test aggregate student work no answer key', () => {
    // TODO - change this use of ASSIGNMENT to just be PROBLEMS for matching student doc format
    // then it will be simpler to use the convertToCurrentFormat() method here
    var allStudentWork = [
        { STUDENT_FILE : "jake r.",
          ASSIGNMENT: [
            { PROBLEM_NUMBER : 1, LAST_SHOWN_STEP : 1,
              STEPS : [
                { CONTENT : "5x=10"},
                { CONTENT : "x=2"}
              ]
            }
          ]
        },
        { STUDENT_FILE : "jon m.",
          ASSIGNMENT: [
            { PROBLEM_NUMBER : 1, LAST_SHOWN_STEP : 1,
              STEPS : [
                { CONTENT : "5x=10"},
                { CONTENT : "x=-2"}
              ]
            }
          ]
        }
    ];

    deepFreeze(allStudentWork);
    var expectedOutput = {
        CURRENT_FILTERS : { SIMILAR_ASSIGNMENT_GROUP_INDEX : null, ANONYMOUS : true },
        SIMILAR_ASSIGNMENT_SETS : [ ],
        PROBLEMS : {
            "1" : {
                POSSIBLE_POINTS : 6,
                POSSIBLE_POINTS_EDITED : 6,
                UNIQUE_ANSWERS : [
                    { ANSWER : "x=2", FILTER : SHOW_ALL,
                      STUDENT_WORK : [
                        { STUDENT_FILE : "jake r.",
                          AUTOMATICALLY_ASSIGNED_SCORE : "",
                          POSSIBLE_POINTS : 6,
                          SCORE : "", FEEDBACK : "", LAST_SHOWN_STEP: 1,
                          PROBLEM_NUMBER : 1,
                          STEPS : [
                            { CONTENT : "5x=10"},
                            { CONTENT : "x=2"}
                          ]
                        }
                      ]
                    },
                    { ANSWER : "x=-2", FILTER : SHOW_ALL,
                      STUDENT_WORK : [
                        { STUDENT_FILE : "jon m.",
                          AUTOMATICALLY_ASSIGNED_SCORE : "",
                          POSSIBLE_POINTS : 6,
                          SCORE : "", FEEDBACK : "", LAST_SHOWN_STEP: 1,
                          PROBLEM_NUMBER : 1,
                          STEPS : [
                            { CONTENT : "5x=10"},
                            { CONTENT : "x=-2"}
                          ]
                        }
                      ]
                    }
                ]
            }
        }
    };

    // TODO - figure out how to include depedencies like KAS in webpack so I can test them, currently included
    // in the app using global script tags in index.html
    expect(aggregateStudentWork(allStudentWork, {}, function(expr1, expr2) {return expr1 === expr2;})).toEqual(expectedOutput);
});

it('test set possible points for entire problem, all solution classes', () => {
});
