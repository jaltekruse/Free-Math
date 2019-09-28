import React from 'react';
import createReactClass from 'create-react-class';
import ReactDOM from 'react-dom';
import { Chart } from 'chart.js';
import _ from 'underscore';
import JSZip from 'jszip';
import { diffJson } from 'diff';
import './App.css';
import ProblemGrader, { problemGraderReducer } from './ProblemGrader.js';
import { cloneDeep, genID } from './FreeMath.js';
import Button from './Button.js';
import { removeExtension } from './AssignmentEditorMenubar.js';

var KAS = window.KAS;

var SET_PROBLEM_POSSIBLE_POINTS = "SET_PROBLEM_POSSIBLE_POINTS";
var EDIT_POSSIBLE_POINTS = "EDIT_POSSIBLE_POINTS";
var POSSIBLE_POINTS = "POSSIBLE_POINTS";
// as the points already assigned for all work on a problem need to be scaled
// wen the possible points changes, and the old a new values need to be
// known at the time of the recalculation, user input is stored in this field
// until the field is submitted (with a button, pressing enter key or focus loss)
var POSSIBLE_POINTS_EDITED = "POSSIBLE_POINTS_EDITED";
var UNIQUE_ANSWERS = 'UNIQUE_ANSWERS';

var SET_PROBLEM_FEEDBACK = "SET_PROBLEM_FEEDBACK";
var GRADE_ASSIGNMENTS = 'GRADE_ASSIGNMENTS';
// when grading, open the view where overall student grades are show
var SET_TO_VIEW_GRADES = 'SET_TO_VIEW_GRADES';
var SET_TO_SIMILAR_DOC_CHECK = 'SET_TO_SIMILAR_DOC_CHECK';
var SIMILAR_DOC_CHECK = 'SIMILAR_DOC_CHECK';

var SET_ASSIGNMENTS_TO_GRADE = 'SET_ASSIGNMENTS_TO_GRADE';

var LAST_SHOWN_STEP = 'LAST_SHOWN_STEP';
var PROBLEMS = 'PROBLEMS';

var SIMILAR_ASSIGNMENT_GROUP_INDEX = "SIMILAR_ASSIGNMENT_GROUP_INDEX";
var SIMILAR_ASSIGNMENT_SETS = "SIMILAR_ASSIGNMENT_SETS";
// teacher grading actions
var VIEW_SIMILAR_ASSIGNMENTS = "VIEW_SIMILAR_ASSIGNMENTS";
// Problem properties
var PROBLEM_NUMBER = 'PROBLEM_NUMBER';
var STEPS = 'STEPS';
var UNDO_STACK = 'UNDO_STACK';
var REDO_STACK = 'REDO_STACK';
var STEP_ID = 'STEP_ID';

var VIEW_GRADES = 'VIEW_GRADES';
var NAV_BACK_TO_GRADING = 'NAV_BACK_TO_GRADING';

// Object model for teacher grading experience, see return value in the aggreateStudentWork() method
var STUDENT_FILE = 'STUDENT_FILE';
var ASSIGNMENT = 'ASSIGNMENT';
var AUTOMATICALLY_ASSIGNED_SCORE = 'AUTOMATICALLY_ASSIGNED_SCORE';
var HIGHLIGHT = 'HIGHLIGHT';

// View grades component
var GRADE_INFO = 'GRADE_INFO';
var STUDENT_GRADES = 'STUDENT_GRADES';

// answer key properties
var GRADE_STRATEGY = "GRADE_STRATEGY";
var ONE_ANSWER_REQUIRED = "ONE_ANSWER_REQUIRED";
var ANSWER_CLASSES = "ANSWER_CLASSES";
var ANSWERS = "ANSWERS";
var SCORE = "SCORE";
var FEEDBACK = "FEEDBACK";

// teacher grade page model properties
var STUDENT_WORK = "STUDENT_WORK";
var ANSWER = "ANSWER";
var CONTENT = "CONTENT";

var SHOW_ALL = "SHOW_ALL";

// action properties
// PROBLEM_NUMBER, SOLUTION_CLASS_INDEX, SCORE, SOLUTION_INDEX
var GRADE_SINGLE_SOLUTION = "GRADE_SINGLE_SOLUTION";
// action properties
// PROBLEM_NUMBER, SOLUTION_CLASS_INDEX, SCORE
var GRADE_CLASS_OF_SOLUTIONS = "GRADE_CLASS_OF_SOLUTIONS";
// action properties: MODE (JUST_UNGRADED | ALL)

var HIGHLIGHT_STEP = 'HIGHLIGHT_STEP';

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

    var handleSingleSolution =
        function(singleSolution, index, arr) {
            var studentAssignmentName = singleSolution[STUDENT_FILE];
            var runningScore = overallGrades[studentAssignmentName];
            runningScore = (typeof runningScore !== 'undefined') ? runningScore : 0;
            // empty string is considered ungraded, which defaults to "complete" and full credit
            if (singleSolution[SCORE] === "") {
                runningScore += possiblePoints;
            } else {
                runningScore += Number(singleSolution[SCORE]);
            }
            overallGrades[studentAssignmentName] = runningScore;
        };

    var handleSingleUnqiueAnswer =
        function(allWorkWithForSingleSolution, index, arr) {
            allWorkWithForSingleSolution[STUDENT_WORK].forEach(
                    handleSingleSolution)
        };

    for (var problemNumber in allProblems) {
        if (allProblems.hasOwnProperty(problemNumber)) {
            var possiblePoints = allProblems[problemNumber][POSSIBLE_POINTS];
            totalPossiblePoints += possiblePoints;
            var uniqueAnswers = allProblems[problemNumber][UNIQUE_ANSWERS];
            uniqueAnswers.forEach(handleSingleUnqiueAnswer);
        }
    }
    return {
        STUDENT_GRADES : overallGrades,
        POSSIBLE_POINTS : totalPossiblePoints
    };
}

// CURRENT_FILTERS : { SIMILAR_ASSIGNMENT_GROUP_INDEX : 1, ANONYMOUS : true/false }
// SIMILAR_ASSIGNMENT_SETS : [ [ "jason", "emma", "matt"], ["jim", "tim"] ],
// PROBLEMS : { "1.a" : {
//      "POSSIBLE_POINTS : 3,
//      "UNIQUE_ANSWERS" : [ { ANSWER : "x=7", FILTER : "SHOW_ALL"/"SHOW_NONE", STUDENT_WORK : [ {STUDENT_FILE : "jason", AUTOMATICALLY_ASSIGNED_SCORE : 3,
//                             STEPS : [ { CONTENT : "2x=14"},{ CONTENT : "x=7", HIGHLIGHT : SUCCESS ]} ] } } ]}
// reducer for teacher grading page
function gradingReducer(state, action) {
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
    } else if (action.type === VIEW_SIMILAR_ASSIGNMENTS) {
        return {
            ...state,
            SIMILAR_ASSIGNMENT_GROUP_INDEX : action[SIMILAR_ASSIGNMENT_GROUP_INDEX]
        }
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
    } else if (action.type === SET_TO_SIMILAR_DOC_CHECK) {
        return {
            ...state,
            APP_MODE : SIMILAR_DOC_CHECK
        };
    } else if (action.type === NAV_BACK_TO_GRADING ) {
        return {
            ...state,
            // Only needed navigating away from similar assignment view.
            // This action is also used to move away from grading, but this won't
            // hurt anything happening in both cases.
            SIMILAR_ASSIGNMENT_GROUP_INDEX : undefined,
            APP_MODE : GRADE_ASSIGNMENTS,
        };
    } else if (action.type === "SET_CURENT_PROBLEM") {
        return {
            ...state,
            "CURRENT_PROBLEM" : action[PROBLEM_NUMBER]
        };
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
        const problemState = state[PROBLEMS][action[PROBLEM_NUMBER]];
        return {
            ...state,
            PROBLEMS : {
                ...state[PROBLEMS],
                [action[PROBLEM_NUMBER]] : problemGraderReducer(problemState, action)
            }
        };
    } else {
        return state;
    }
}

function buildKey(string1, string2) {
    if (string1 < string2) {
        return JSON.stringify([string1, string2]);
    } else {
        return JSON.stringify([string2, string1]);
    }
}

function splitKey(compositeKey) {
    return JSON.parse(compositeKey);
}

// Find similar assignments, do generic JSON diff between all assignments, then
// combine pairs of sufficiently similar documents into larger groups that are
// all within the threshold of similarity
//
// First compute diff between all assignments, store in hashmap/object
// with keys of [ "student_doc_1", "student_doc_2" ] with the names sorted alphabetically
// in each pair, for consistent access later.
//
// Loop through all pairs below a threshold of uniqueness, relationship of similarity
// is not transitive. One document could be 20% different from 2 others, but in different
// ways, making the other two up to 40% different. For a document to join a group, it must
// be sufficiently similar to all docs already in that group.
//
function findSimilarStudentAssignments(allStudentWork) {

    if (allStudentWork.length > 100) {
        alert("Too many assignments to perform overall document similarity check.\n" + 
            "To use this feature you can open up documents in groups of 100 students or less at a time.");
        return [];
    }
    // Similarity check does a generic diff on JSON docs, for re-opened docs this
    // will include data intermixed for the grading marks.
    // Loop through the structure to remove all grading marks from the versions
    // that will be used to compare the students.
    // TODO - try to remove this deep clone of all docs, don't know if it is safe
    // today to mutate the incoming data.
    allStudentWork = cloneDeep(allStudentWork);
    allStudentWork.forEach(function(assignInfo, index, array) {
        assignInfo[ASSIGNMENT].forEach(function(problem, index, array) {
            problem[FEEDBACK] = "";
            problem[SCORE] = "";
            problem[POSSIBLE_POINTS] = "";
            problem["LAST_SHOWN_STEP"] = "";
            problem[UNDO_STACK] = [];
            problem[REDO_STACK] = [];
            problem[STEPS].forEach(function(step, index, array) {
                if (step[HIGHLIGHT])
                    delete step[HIGHLIGHT];
                step[STEP_ID] = "";
            });
        });
    });
    // with keys of student_doc_1__student_doc_2 with the names sorted alphabetically
    // values are numbers for percentage of unique work from 0 to 1.0
    let similarityScores = {};

    // 2d array of student names whose docs were similar
    var allSimilarityGroups = [];

    // calculate average length of answer accross all docs
    var totalWork = 0
    var totalProblemsCompleted = 0;
    var totalProblemsAttempted = 0;
    var maxProblemsAttempted = 0;
    allStudentWork.forEach(function(assignment, index, array) {
        if (assignment[ASSIGNMENT].length > maxProblemsAttempted) {
            maxProblemsAttempted = assignment[ASSIGNMENT].length;
        }
        totalProblemsAttempted += assignment[ASSIGNMENT].length;
        assignment[ASSIGNMENT].forEach(function(problem, index, array) {
            totalWork += problem[STEPS].length;
            totalProblemsCompleted++;
        });
    });
    var averageAnswerLength = totalWork / totalProblemsCompleted;
    var averageNumberOfQuestions = totalProblemsAttempted / allStudentWork.length;

    // map from student doc names to list of docs that one student is similar to
    var similarDocsToEach = {}

    allStudentWork.forEach(function(assignment1, index, array) {
        allStudentWork.forEach(function(assignment2, index, array) {
            if (assignment1[STUDENT_FILE] === assignment2[STUDENT_FILE]) return;
            var result = diffJson(assignment1, assignment2);
            // currently a rough threshold of 30% unique work, will improve later
            // the -2 is to adjust for the filename difference in the structures
            let similarity = ((result.length - 2) / 2.0)
                / ( averageNumberOfQuestions * averageAnswerLength);

            if (similarity < 0.3) {
                let key = buildKey(assignment1[STUDENT_FILE], assignment2[STUDENT_FILE]);
                similarityScores[key] = similarity;
                // create list if one not already existing at this key
                similarDocsToEach[assignment1[STUDENT_FILE]] =
                    ( typeof similarDocsToEach[assignment1[STUDENT_FILE]] !== 'undefined')
                    ? similarDocsToEach[assignment1[STUDENT_FILE]]
                    : [];

                // add if not in list
                similarDocsToEach[assignment1[STUDENT_FILE]].indexOf(assignment2[STUDENT_FILE]) === -1
                    ? similarDocsToEach[assignment1[STUDENT_FILE]].push(assignment2[STUDENT_FILE])
                    : 0;
            }
        });
    });
    // too many pairs to do the complete reduction of redundant groups in reasonable time
    if (Object.keys(similarityScores).length > 100) {
        for (var similarGroup in similarDocsToEach) {
            if (similarDocsToEach.hasOwnProperty(similarGroup)) {
                let newGroup = similarDocsToEach[similarGroup];
                // add the student that the list was keyed by, it is similar to all those in this list
                newGroup.push(similarGroup);
                // check if new group already present (if exact groups of students all match, there will
                // be duplicate lists)
                // but if student a matches b,c and d
                // but two of those are different from one antother, say c and d, the groups shown to the user
                // will be [a,b,c,d], [a,b,c] and [a,b,d]
                let alreadyPresent = allSimilarityGroups.some(function(group) {
                    return _.isEqual(group.sort(), newGroup.sort())
                });
                if (! alreadyPresent) {
                    allSimilarityGroups.push(newGroup);
                }
            }
        }
        return allSimilarityGroups;
    }
    for (var similarPair in similarityScores) {
        if (similarityScores.hasOwnProperty(similarPair)) {
            let pair = splitKey(similarPair);
            var addedToOneGroup = false;
            allSimilarityGroups.forEach(function(group, index, array) {
                var matchesAll = true;
                // are both members of this pair already in this group, then skip comparing with
                // everyone else
                if (group.indexOf(pair[0]) !== -1 && group.indexOf(pair[1]) !== -1) {
                    addedToOneGroup = true;
                    return true;
                }
                for (let groupMember of group) {
                    if ( (groupMember !== pair[0]
                           && similarityScores[buildKey(groupMember, pair[0])] === undefined) ||
                          (groupMember !== pair[1]
                           && similarityScores[buildKey(groupMember, pair[1])] === undefined) ) {
                        matchesAll = false;
                        break;
                    }
                }
                if (matchesAll) {
                    // add if not in list
                    group.indexOf(pair[0]) === -1 ? group.push(pair[0]) : 0;
                    group.indexOf(pair[1]) === -1 ? group.push(pair[1]) : 0;
                    addedToOneGroup = true;
                }
            });
            if (!addedToOneGroup) {
                allSimilarityGroups.push(pair);
            }
        }
    }

    return allSimilarityGroups;
}

function calculateGradingOverview(allProblems) {
    /*
        Structure:
        {
            PROBLEMS : [
            { PROBLEM_NUMBER : "1.1", NUMBER_UNIQUE_ANSWERS : 5,
              LARGEST_ANSWER_GROUP_SIZE : 10,
              AVG_ANSWER_GROUP_SIZE : 5.6, POSSIBLE_POINTS : 3
            ]
        }
    */
    var gradeOverview = {};
    gradeOverview["PROBLEMS"] = [];

    var handleSingleSolution =
        function(allWorkWithForSingleSolution, index, arr) {
            if (allWorkWithForSingleSolution[STUDENT_WORK].length > largestAnswerGroupSize) {
                largestAnswerGroupSize = allWorkWithForSingleSolution[STUDENT_WORK].length;
            }
            totalAnswersSubmitted += allWorkWithForSingleSolution[STUDENT_WORK].length;
            //allWorkWithForSingleSolution[STUDENT_WORK].forEach(
                //function(singleSolution, index, arr) {
                // TODO - don't think I want to do anythings for
                // individual solutions, but think about this
            //});
    };

    for (var problemNumber in allProblems) {
        if (allProblems.hasOwnProperty(problemNumber)) {
            var possiblePoints = allProblems[problemNumber][POSSIBLE_POINTS];
            var uniqueAnswers = allProblems[problemNumber][UNIQUE_ANSWERS];
            var currentProblemOverview = { "PROBLEM_NUMBER" : problemNumber, "POSSIBLE_POINTS" : possiblePoints,
                                           "NUMBER_UNIQUE_ANSWERS" : uniqueAnswers.length};
            var largestAnswerGroupSize = 0;
            var totalAnswersSubmitted = 0;
            uniqueAnswers.forEach(handleSingleSolution);
            currentProblemOverview["LARGEST_ANSWER_GROUP_SIZE"] = largestAnswerGroupSize;
            currentProblemOverview["AVG_ANSWER_GROUP_SIZE"] = totalAnswersSubmitted / uniqueAnswers.length;
            gradeOverview["PROBLEMS"].push(currentProblemOverview);
        }
    }
    gradeOverview[PROBLEMS] = gradeOverview[PROBLEMS].sort(
        function(a,b) { return a["LARGEST_ANSWER_GROUP_SIZE"] - b["LARGEST_ANSWER_GROUP_SIZE"];});
    return gradeOverview;
}

// PROBLEMS : { "1.a" : {
//      "POSSIBLE_POINTS : 3,
//      "UNIQUE_ANSWERS" : [ { ANSWER : "x=7", FILTER : "SHOW_ALL"/"SHOW_NONE", STUDENT_WORK : [ {STUDENT_FILE : "jason", AUTOMATICALLY_ASSIGNED_SCORE : 3,
//                             STEPS : [ { CONTENT : "2x=14"},{ CONTENT : "x=7", HIGHLIGHT : SUCCESS ]} ] } } ]}
function separateIndividualStudentAssignments(aggregatedAndGradedWork) {
    // TODO - when reading in student files above make sure to uniquify
    // names that overlap and give a warning
    // map indexed by student assignment filename
    var assignments = {};
    var allProblems = aggregatedAndGradedWork[PROBLEMS];

    const handleSingleSolution =
        function(singleSolution, index, arr) {
            var studentAssignment = assignments[singleSolution[STUDENT_FILE]];

            studentAssignment = (typeof studentAssignment !== 'undefined')
                ? studentAssignment
                : {PROBLEMS : []};

            var singleSolutionCloned = {
                ...singleSolution,
                PROBLEM_NUMBER : problemNumber,
                POSSIBLE_POINTS :possiblePoints
            }
            delete singleSolutionCloned[STUDENT_FILE];
            delete singleSolutionCloned[AUTOMATICALLY_ASSIGNED_SCORE];
            // TODO - should it assert here that a score has been given?
            // The app fills in a score of 0 for everything right now when
            // student assignments are opened
            studentAssignment[PROBLEMS].push(singleSolutionCloned);
            assignments[singleSolution[STUDENT_FILE]] = studentAssignment;
    };

    const handleAllWorkForSingleSolution =
        function(allWorkWithForSingleSolution, index, arr) {
                        allWorkWithForSingleSolution[STUDENT_WORK].forEach(handleSingleSolution);
        };

    for (var problemNumber in allProblems) {
        if (allProblems.hasOwnProperty(problemNumber)) {
            var possiblePoints = allProblems[problemNumber][POSSIBLE_POINTS];
            var uniqueAnswers = allProblems[problemNumber][UNIQUE_ANSWERS];
            uniqueAnswers.forEach(handleAllWorkForSingleSolution);
        }
    }
    return assignments;
}

function saveGradedStudentWork(gradedWork) {
    if (gradedWork === undefined) {
        console.log("no graded assignments to save");
    }
    // temporarily disable data loss warning
    window.onbeforeunload = null;

    var separatedAssignments = separateIndividualStudentAssignments(gradedWork);
    var filename;
    for (filename in separatedAssignments) {
        if (separatedAssignments.hasOwnProperty(filename)) {
            separatedAssignments[filename] = makeBackwardsCompatible(separatedAssignments[filename]);
        }
    }
    var zip = new JSZip();
    for (filename in separatedAssignments) {
        if (separatedAssignments.hasOwnProperty(filename)) {
            zip.file(filename, JSON.stringify(separatedAssignments[filename]));
        }
    }
    var content = zip.generate();

    window.location.href="data:application/zip;download:testing;base64," + content;
    setTimeout(function() { window.onbeforeunload = function() { return true; }}, 500);
}

// returns score out of total possible points that are specified in the answer key
function gradeSingleProblem(problem, answerKey) {
    var automaticallyAssignedGrade;
    var problemKey = answerKey[problem[PROBLEM_NUMBER]];
    problemKey[ANSWER_CLASSES].forEach(function(answerClass, answerClassIndex, array) {
        var exitEarly = false;
        if (answerClass[GRADE_STRATEGY] === ONE_ANSWER_REQUIRED) {
            answerClass[ANSWERS].forEach(function(answer, answerIndex, answerArray) {
            var studentAnswer = _.last(problem[STEPS])[CONTENT];
            // TODO - better expression comparison
            // var expr1 = KAS.parse(answer).expr;
            // var expr2 = KAS.parse(studentAnswer).expr;
            // if (KAS.compare(expr1, expr2).equal) {
            if (answer === studentAnswer) {
                // TODO - good rounding
                const possiblePoints = answerKey[problem[PROBLEM_NUMBER]][POSSIBLE_POINTS];
                automaticallyAssignedGrade = possiblePoints * answerClass[SCORE];
                exitEarly = true;
                return false; // early terminate loops
            }
            });
        } else {
        alert("This grading strategy has not been implemented - " + answerClass[GRADE_STRATEGY]);
        }
        if (exitEarly) return false;
    });
    return automaticallyAssignedGrade;
}

// TODO(issues/33) - test associativity and commutativity of KAS comparison
function areExpressionsSimilar(expression1, expression2) {
    var matches = false;
    // first try simple string comparison of Latex
    if (expression1 === expression2) {
        matches = true;
    }
    // if this comparison fails, try to parse the expressions and compare
    // them mathematically using KAS
    if (!matches) {
        try {
            var groupAnswer = KAS.parse(expression2).expr;
            var parsedStudentAnswer = KAS.parse(expression1).expr;
            matches = ( KAS.compare(groupAnswer, parsedStudentAnswer).equal
                        && groupAnswer.sameForm(parsedStudentAnswer));
        } catch (e) {
            // if parsing or comparison fails, do nothing, assume they are not similar
            // "matches" is already set to false above
            console.log("failed to compare 2 expressions");
            console.log(expression1);
            console.log(expression2);
            console.log(e);
        }
    }
    return matches;
}

// Transforms a list of student assignments into a structure where all work for one problem
// is stored together, separated by different final answers reached by groups of students.
//
// In the answer key, scores on individual answers are given as a float value from [0,1).
// The grading strategy for individual problems (how to handle partial credit, fractional points
// and allowing users to scale some problems to be worth more points, is still being decided).
// Can't just use floating point for fractional points because users will expecting them to add up
// cleanly. Even if I decide on some fractional system, floating point partial credit scores would
// be safe enough to import with rounding. The again might just be over-thinking it and floats even
// after aggregation would be fine for "snapping" to common fractional values, just need to store
// all raw input so it can be shown back to users as what they entered.
//
// Params:
// allStudentWork:
//      [ {STUDENT_FILE : "jake r.", ASSIGNMENT: [{PROBLEM_NUMBER : 1, "STEPS" : []}]]
// answerKey: - list of problem numbers with answers, given as a map with the problem numbers as keys
//              non-numeric keys are considered valid to allow 1.a, iii, 5.11, etc./
//              NUMBER_OF_MATCHING_ANSWERS_REQUIRED is only valid to set if SUBSET_OF_ANSWERS_REQUIRED is specified.
//              Each answer class has its own GRADE_STRATEGY because for a question with multiple answers, the partial
//              credit options will likely be defined as SUBSET_OF_ANSWERS_REQUIRED
//      { "1" : { POSSIBLE_POINTS : 3, "ANSWER_CLASSES" : [
//                { SCORE : 1, ANSWERS : ["x=5", "5=x"], "GRADE_STRATEGY" : "ALL_ANSWERS_REQUIRED" },
//                { "SCORE" : 0.5, ANSWERS : ["x=-5","-5=x"] ],
//                      "GRADE_STRATEGY" : "ALL_ANSWERS_REQUIRED" | "ONE_ANSWER_REQUIRED" |
//                      "SUBSET_OF_ANSWERS_REQUIRED", "NUMBER_OF_MATCHING_ANSWERS_REQUIRED" : 2 } ]
//
// Returns:
// CURRENT_FILTERS : { SIMILAR_ASSIGNMENT_GROUP_INDEX : 1, ANONYMOUS : true/false }
// SIMILAR_ASSIGNMENT_SETS : [ [ "jason", "emma", "matt"], ["jim", "tim"] ],
// PROBLEMS : { "1.a" : {
//      "POSSIBLE_POINTS : 3,
//      "UNIQUE_ANSWERS" : [ { ANSWER : "x=7", FILTER : "SHOW_ALL"/"SHOW_NONE", STUDENT_WORK : [ {STUDENT_FILE : "jason", AUTOMATICALLY_ASSIGNED_SCORE : 3,
//                             STEPS : [ { CONTENT : "2x=14"},{ CONTENT : "x=7", HIGHLIGHT : SUCCESS ]} ] } } ]}
function aggregateStudentWork(allStudentWork, answerKey = {}, expressionComparator = areExpressionsSimilar) {
    var aggregatedWork = {};
    // used to simplify filling in a flag for missing work if a student does not do a problem
    // structure: { "1.1" : { "jason" :true, "taylor" : true }
    var studentWorkFound = {};
    allStudentWork.forEach(function(assignInfo, index, array) {
        assignInfo[ASSIGNMENT].forEach(function(problem, index, array) {
            var studentAnswer = _.last(problem[STEPS])[CONTENT];
            // TODO - consider if empty string is the best way to indicate "not yet graded"/complete
            var automaticallyAssignedGrade = "";
            if (!_.isEmpty(answerKey)) {
                // this problem did not appear in the answer key
                if (!answerKey[problem[PROBLEM_NUMBER]]) {
                    // TODO - consider if empty string is the best way to indicate "not yet graded"/complete
                    automaticallyAssignedGrade = "";
                } else {
                    automaticallyAssignedGrade = gradeSingleProblem(problem, answerKey);
                }
            }

            // write into the abreviated list of problems completed, used below to fill in placeholder for
            // completely absent work
            var allStudentsWhoDidThisProblem = studentWorkFound[problem[PROBLEM_NUMBER]];
            allStudentsWhoDidThisProblem =
                (typeof allStudentsWhoDidThisProblem !== 'undefined') ?
                allStudentsWhoDidThisProblem : {};
            allStudentsWhoDidThisProblem[assignInfo[STUDENT_FILE]] = true;
            studentWorkFound[problem[PROBLEM_NUMBER]] = allStudentsWhoDidThisProblem;

            var problemSummary = aggregatedWork[problem[PROBLEM_NUMBER]];
            problemSummary = (typeof problemSummary !== 'undefined') ? problemSummary : {};

            var uniqueAnswers = problemSummary[UNIQUE_ANSWERS];
            uniqueAnswers = ( typeof uniqueAnswers !== 'undefined') ? uniqueAnswers : [];

            // see notes for comment about how to organize problems once final answers are compared in
            // a fuzzy fashion
            var workList;
            var indexInUniqueAnswersList;
            uniqueAnswers.forEach(function(aggregatedWorkForOneAnswer, index, arr) {
                var matches = expressionComparator(
                        studentAnswer, aggregatedWorkForOneAnswer[ANSWER]);
                if (matches) {
                    workList = aggregatedWorkForOneAnswer;
                    indexInUniqueAnswersList = index;
                    return false;
                }
            });
            if (typeof workList === 'undefined' || !(workList instanceof Object) ) {
                workList = { ANSWER : studentAnswer, FILTER : SHOW_ALL, STUDENT_WORK : []};
                indexInUniqueAnswersList = uniqueAnswers.length;
            }
            var feedback = '';
            // reopening previously graded assignments
            if (problem[SCORE] !== undefined) {
                automaticallyAssignedGrade = problem[SCORE];
                feedback = problem[FEEDBACK];
            }
            workList[STUDENT_WORK].push(
                {
                  ...problem,
                  STUDENT_FILE : assignInfo[STUDENT_FILE],
                  AUTOMATICALLY_ASSIGNED_SCORE : automaticallyAssignedGrade,
                  SCORE : automaticallyAssignedGrade,
                  FEEDBACK : feedback,
                }
            );
            uniqueAnswers[indexInUniqueAnswersList] = workList;
            problemSummary[UNIQUE_ANSWERS] = uniqueAnswers;
            // this is currently redundant, but the next step to order all of the problems based
            // on which ones most students go wrong with rewrite the keys to numeric ones
            if (!_.isEmpty(answerKey)) {
                problemSummary[POSSIBLE_POINTS] = answerKey[problem[PROBLEM_NUMBER]][POSSIBLE_POINTS];
            } else {
                problemSummary[POSSIBLE_POINTS] = 6;
                problemSummary[POSSIBLE_POINTS_EDITED] = 6;
             }
            // this is necessary because this might be the first time this problem
            // number was seen so we just created the list if this wasn't the case,
            // this wouldn't be necessary because objects including arrays are always
            // passed by reference
            aggregatedWork[problem[PROBLEM_NUMBER]] = problemSummary;
        });
    });
    var problemNumber;
    // sort list of answer groups, largest to smallest
    for (problemNumber in aggregatedWork) {
        if (aggregatedWork.hasOwnProperty(problemNumber)) {
            aggregatedWork[problemNumber][UNIQUE_ANSWERS].sort(function(a,b) {
                return b[STUDENT_WORK].length - a[STUDENT_WORK].length;
            });
        }
    }

    // sort students responses within an answer group by least work first
    for (problemNumber in aggregatedWork) {
        if (aggregatedWork.hasOwnProperty(problemNumber)) {
            var uniqueAnswers = aggregatedWork[problemNumber][UNIQUE_ANSWERS];
            uniqueAnswers.forEach(function(uniqueAnswer, index, arr) {
                uniqueAnswer[STUDENT_WORK].sort(function(a,b) { return a[STEPS].length - b[STEPS].length; });
            });
        }
    }
    // TODO - need to add this back
    // TODO - need to think about how this handles outliers that do a wrong problem
    //        should probably only add these for questions where a majority of students answered a question
    //        need to give a clear experience for teachers, currently this will throw off score calculation
    /*
    // add blank answers for any students missing problems
    $.each(allStudentWork, function(index, assignInfo) {
        $.each(studentWorkFound, function(problemNumber, studentsFound) {
            if (!studentsFound[assignInfo.filename]) {
                var missingWork = aggregatedWork[problemNumber]['uniqueAnswers']['unanswered'];
                missingWork = (typeof missingWork !== 'undefined') ? missingWork : [];
                missingWork.push(
                        {studentFile : assignInfo.filename, autoGradeStatus: 'incorrect', steps : ['unanswered']});
                aggregatedWork[problemNumber]['uniqueAnswers']['unanswered'] = missingWork;
            }
        });
    });
    */

    var similarAssignments = findSimilarStudentAssignments(allStudentWork);
    return { CURRENT_FILTERS : { SIMILAR_ASSIGNMENT_GROUP_INDEX : null, ANONYMOUS : true },
    SIMILAR_ASSIGNMENT_SETS : similarAssignments, PROBLEMS : aggregatedWork }
}

// TODO - delete this, highlights now shown in student experience for viewing
// feedback on a graded assignment.
// 
// Still used in the legacy document upgrade code below.
//
// This was from a very old version of the software, likely safe to
// delete but I'll keep it in.
//
// currently in the student model, the steps associated with a problem
// are a simple array of strings with Latex in them. In the teacher
// gradng model, each step is wrapped in an object to allow for storing
// metadata with each step. Current usage is to show a highlight of an
// error or success identified by the teacher on that step.
function wrapSteps(studentSteps) {
    var wrappedSteps = [];
    studentSteps.forEach(function(step, index, arr) {
        wrappedSteps.push({CONTENT : step});
    });
    return wrappedSteps;
}

function convertToCurrentFormat(possiblyOldDoc) {
    return convertToCurrentFormat2(convertToCurrentFormatFromAlpha(possiblyOldDoc));
}

function convertToCurrentFormatFromAlpha(possiblyOldDoc) {
    if (!possiblyOldDoc.hasOwnProperty('problems')) {
        return possiblyOldDoc;
    }
    possiblyOldDoc = cloneDeep(possiblyOldDoc);

    possiblyOldDoc.problems.forEach(function (problem) {
        if (problem.problemNumber !== undefined) {
            problem[STEPS] = wrapSteps(problem.steps);
            problem[LAST_SHOWN_STEP] = problem[STEPS].length - 1;
            problem[PROBLEM_NUMBER] = problem.problemNumber;
            delete problem.steps;
            delete problem.problemNumber;
        }
    });
    possiblyOldDoc[PROBLEMS] = possiblyOldDoc.problems;
    delete possiblyOldDoc.problems;
    return possiblyOldDoc;
}

// Covert old problem format to new one
// TODO: add versioning number to make upgrades easier and more reliable in the future
function convertToCurrentFormat2(possiblyOldDoc) {
    if (possiblyOldDoc.hasOwnProperty(PROBLEMS)
        && possiblyOldDoc[PROBLEMS].length > 0
        && possiblyOldDoc[PROBLEMS][0].hasOwnProperty(LAST_SHOWN_STEP)) {
        console.log("needs upgrade");
        // TODO - consider getting rid of this deep clone, but not much object creation
        // to avoid if I want to keep this function pure
        possiblyOldDoc = cloneDeep(possiblyOldDoc);
        possiblyOldDoc[PROBLEMS].forEach(function (problem) {
            problem[STEPS] = problem[STEPS].slice(0, problem[LAST_SHOWN_STEP] + 1);
            problem[STEPS].forEach(function(step, index, arr) {
                step[STEP_ID] = genID();
            });
            delete problem.LAST_SHOWN_STEP;
            problem[UNDO_STACK] = [];
            problem[REDO_STACK] = [];
        });
        return possiblyOldDoc;
    } else {
        return possiblyOldDoc;
    }
}

function makeBackwardsCompatible(newDoc) {
    newDoc[PROBLEMS].forEach(function (problem) {
        problem[LAST_SHOWN_STEP] = problem[STEPS].length - 1;
    });
    return newDoc;
}

// open zip file full of student assignments for grading
function studentSubmissionsZip(evt) {
    // reset scroll location from previous view of student docs
    window.location.hash = '';
    var f = evt.target.files[0];

    if (f) {
        var r = new FileReader();
        r.onload = function(e) {
            var content = e.target.result;

            var new_zip = new JSZip();
            // more files !
            new_zip.load(content);

            var allStudentWork = [];

            // you now have every files contained in the loaded zip
            for (var file in new_zip.files) {
                // don't get properties from prototype
                if (new_zip.files.hasOwnProperty(file)) {
                    // extra directory added when zipping files on mac
                    // TODO - check for other things to filter out from zip
                    // files created on other platforms
                    if (file.indexOf("__MACOSX") > -1 || file.indexOf(".DS_Store") > -1) continue;
                    // check the extension is .math
                    // hack for "endsWith" function, this is in ES6 consider using Ployfill instead
                    if (file.indexOf(".math", file.length - ".math".length) === -1) continue;
                    // filter out directories which are part of this list
                    if (new_zip.file(file) === null) continue;
                    try {
                        var fileContents = new_zip.file(file).asText();
                        // how is this behaviring differrntly than JSOn.parse()?!?!
                        //var assignmentData = window.$.parseJSON(fileContents);
                        fileContents = fileContents.trim();
                        var assignmentData = JSON.parse(fileContents);
                        assignmentData = convertToCurrentFormat(assignmentData);
                        allStudentWork.push({STUDENT_FILE : file, ASSIGNMENT : assignmentData[PROBLEMS]});
                    } catch (e) {
                        console.log("failed to parse file: " + file);
                        console.log(e);
                    }
                }
            }
            // TODO - add back answer key
            var aggregatedWork = aggregateStudentWork(allStudentWork);
            console.log("@@@@@@ opened docs");
            console.log(aggregatedWork);
            window.store.dispatch(
                { type : SET_ASSIGNMENTS_TO_GRADE,
                  NEW_STATE :
                    {...aggregatedWork, ASSIGNMENT_NAME: removeExtension(f.name)}});
        }
        r.readAsArrayBuffer(f);
    } else {
        alert("Failed to load file");
    }
}

const SimilarDocChecker = createReactClass({
    render: function() {
        return (
            <div>
                <SimilarGroupSelector />
                <AllProblemGraders />
            </div>
        );
    }
});

const SimilarGroupSelector = createReactClass({

    render: function() {
        var state = window.store.getState();
        var similarAssignments = state[SIMILAR_ASSIGNMENT_SETS];
        var currentSimilarityGroupIndex = state[SIMILAR_ASSIGNMENT_GROUP_INDEX];
        return(
            <div>
            { (similarAssignments && similarAssignments.length > 0) ? (
                <div className="similar-assignment-filters">
                  <h3>Some students may have copied each others work</h3>
                {/* Not really needed anymore now that similar doc check is on separate page
                    TODO - remove this completely, including actions
                {   (typeof(currentSimilarityGroupIndex) !== "undefined" &&
                     currentSimilarityGroupIndex !== null) ?
                        (<p> Currently viewing a group of similar
                            assignments, back to grading full class
                            <Button text="View All" onClick={
                             function(evt) {
                                window.store.dispatch(
                                    { type : VIEW_SIMILAR_ASSIGNMENTS,
                                      SIMILAR_ASSIGNMENT_GROUP_INDEX : undefined
                                });
                            }
                        }/></p>)
                    : null
                }
                */}
                {
                    function() {
                        var similarityGroups = [];
                        similarAssignments.forEach(
                            function(similarityGroup, index, array) {
                                similarityGroups.push(
                                (
                                    <p key={index}>
                                    { (index === currentSimilarityGroupIndex) ?
                                        (<b>A group of  {similarityGroup.length} students
                                            submitted similar assignments &nbsp;</b>)
                                       : (<span>A group of  {similarityGroup.length} students
                                           submitted similar assignments &nbsp;</span>)
                                    }
                                    <Button text="View" onClick={
                                        function(evt) {
                                            window.store.dispatch(
                                                { type : VIEW_SIMILAR_ASSIGNMENTS,
                                                  SIMILAR_ASSIGNMENT_GROUP_INDEX : index
                                            });
                                        }
                                    }/>
                                    </p>
                                )
                            );
                        });
                        return similarityGroups;
                    }()
                }
                </div>
                )
               : null
            }
            </div>
        );
    }
});

const GradesView = createReactClass({
    render: function() {
        var props = this.props;
        return (
            <div style={{margin:"60px 30px 30px 30px"}}>
                <table>
                    <thead>
                    <tr><th>Student File</th><th>Score</th></tr>
                    </thead>
                    <tbody>
                    {
                        function() {
                            var tableRows = [];
                            var grades = props.value[GRADE_INFO][STUDENT_GRADES];
                            for (var studentFileName in grades) {
                                if (grades.hasOwnProperty(studentFileName)) {
                                    tableRows.push(
                                    (<tr>
                                        <td>{studentFileName}</td>
                                        <td>{grades[studentFileName]}</td>
                                    </tr> ));
                                }
                            }
                            return tableRows;
                        }()
                    }
                    </tbody>
                </table>
            </div>
        );
    }
});

const AllProblemGraders = createReactClass({
    render: function() {
        var state = window.store.getState();
        var problems = state[PROBLEMS];
        var similarAssignments = state[SIMILAR_ASSIGNMENT_SETS];
        var currentSimilarityGroupIndex = state[SIMILAR_ASSIGNMENT_GROUP_INDEX];
        var currentProblem = state["CURRENT_PROBLEM"];

        return (
            <div>
            {
                function() {
                    var problemGraders = [];
                    var problemArray = [];
                    for (var property in problems) {
                        if (problems.hasOwnProperty(property)) {
                            // when viewing similar assignments show all problems, otherwise only show
                            // one problem at a time
                            if (property === currentProblem
                                    || (typeof(currentSimilarityGroupIndex) !== "undefined"
                                    && currentSimilarityGroupIndex !== null)) {
                                // problem number is stored as keys in the map, add to each object
                                // so the list can be sorted by problem number
                                problems[property][PROBLEM_NUMBER] = property;
                                problemArray.push(problems[property]);
                            }
                        }
                    }
                    problemArray = problemArray.sort(
                        function(a,b) { return a[PROBLEM_NUMBER] - b[PROBLEM_NUMBER];});
                    problemArray.forEach(function(problem, index, array) {
                        problemGraders.push(
                            (<ProblemGrader problemInfo={problem}
                                            key={problem[PROBLEM_NUMBER]}
                                            problemNumber={problem[PROBLEM_NUMBER]}
                                studentsToView={similarAssignments[currentSimilarityGroupIndex]}/> ));
                    });
                    return problemGraders;
                }()
            }
            </div>
        );
    }
});

const TeacherInteractiveGrader = createReactClass({
    componentDidMount() {
        var gradingOverview = window.store.getState()["GRADING_OVERVIEW"][PROBLEMS];
        var labels = [];
        var numberUniqueAnswersData = {
            label: "Number unique answers",
            backgroundColor: "blue",
            data: []
        };
        var largestAnswerGroups = {
            label: "Largest answer group size",
            backgroundColor: "green",
            data: []
        };
        var averageAnswerGroups = {
            label: "Average answer group size",
            backgroundColor: "purple",
            data: []
        };
        var graphData = [numberUniqueAnswersData, largestAnswerGroups, averageAnswerGroups];
        gradingOverview.forEach(function(problemSummary, index, array) {
            labels.push("Problem " + problemSummary[PROBLEM_NUMBER]);
            numberUniqueAnswersData["data"].push(problemSummary["NUMBER_UNIQUE_ANSWERS"]);
            largestAnswerGroups["data"].push(problemSummary["LARGEST_ANSWER_GROUP_SIZE"]);
            averageAnswerGroups["data"].push(problemSummary["AVG_ANSWER_GROUP_SIZE"]);
        });
        var chart = ReactDOM.findDOMNode(this.refs.chart);
        var onClickFunc = function(evt) {
            var activePoints = chart.getElementsAtEvent(evt);
            var problemNum;
            if (!activePoints || activePoints.length === 0) {
                // TODO - this could be better, collision isn't quite right once the text labels
                // are tight enough they start displaying at an angle.
                let mousePoint = Chart.helpers.getRelativePosition(evt, this.chart.chart);
                let yScale = this.chart.scales['y-axis-0'];
                if (yScale.getValueForPixel(mousePoint.y) < 0) {
                    let mousePoint = Chart.helpers.getRelativePosition(evt, this.chart.chart);
                    let xScale = this.chart.scales['x-axis-0'];
                    problemNum = xScale.ticks[xScale.getValueForPixel(mousePoint.x)];
                } else {
                    return;
                }
            } else {
                problemNum = labels[activePoints[0]["_index"]];
            }
            problemNum = problemNum.replace("Problem ", "");
            window.store.dispatch({ type : "SET_CURENT_PROBLEM",
                                    PROBLEM_NUMBER : problemNum});
            // TODO - not working correctly after making users grade single problem at a time
            // for now make them scroll past the graph and similar assignments themselves
            //window.location.hash = "#grade_problem";
        };
        Chart.defaults.global.defaultFontColor = '#010101';
        chart = new Chart(chart.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: graphData
            },
            options: {
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero:true
                        }
                    }]
                },
                onClick: onClickFunc
            }
        });
      },
    render: function() {
        // todo - figure out the right way to do this
        // todo - do i want to be able to change the sort ordering, possibly to put
        //        the most important to review problem first, rather than just the
        //        problems in order?

        return (
            <div style={{padding:"0px 20px 0px 20px"}}>
                <br />
                <h3>To see students responses to a question,
                    click on the corresponding bars or label in the graph.</h3>
                <canvas ref="chart" width="400" height="50"></canvas>
                {/* TODO - finish option to grade anonymously <TeacherGraderFilters value={this.props.value}/> */}
                <span id="grade_problem" />
                <div style={{paddingTop: "100px", marginTop: "-100px"}} />
                <AllProblemGraders />
                <h3>To grade other problems use the bar graph at the top of the page to select them.</h3>
                <Button text="Scroll to Top" onClick={
                            function() {
                                window.location.hash = '';
                                document.body.scrollTop = document.documentElement.scrollTop = 0;}
                }/>
                <br />
                <br />
            </div>
        );
    }
});

export { TeacherInteractiveGrader as default,
    GradesView,
    SimilarDocChecker,
    studentSubmissionsZip,
    saveGradedStudentWork,
    gradeSingleProblem,
    aggregateStudentWork,
    separateIndividualStudentAssignments,
    calculateGradingOverview,
    convertToCurrentFormat,
    gradingReducer,
    makeBackwardsCompatible
};

