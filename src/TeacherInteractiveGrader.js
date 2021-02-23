import React from 'react';
import _ from 'underscore';
import JSZip from 'jszip';
import { diffJson } from 'diff';
import './App.css';
import ProblemGrader, { problemGraderReducer } from './ProblemGrader.js';
import { scaleScore } from './SolutionGrader.js';
import { cloneDeep, genID, getPersistentState,
         getEphemeralState, saveStudentDocToDriveResolvingConflicts } from './FreeMath.js';
import Button from './Button.js';
import { CloseButton } from './Button.js';
import FreeMathModal from './Modal.js';
import { saveAssignment, removeExtension, openAssignment } from './AssignmentEditorMenubar.js';
import { saveAs } from 'file-saver';
import { Chart, Bar } from 'react-chartjs-2';
import { defaults } from 'react-chartjs-2';
import { updateFileWithBinaryContent, updateGrades } from './GoogleApi.js';
import Select from "react-select";

var KAS = window.KAS;

var APP_MODE = 'APP_MODE';

var SHOW_TUTORIAL = "SHOW_TUTORIAL";

var SET_PROBLEM_POSSIBLE_POINTS = "SET_PROBLEM_POSSIBLE_POINTS";
var SET_POSSIBLE_POINTS_FOR_ALL = "SET_POSSIBLE_POINTS_FOR_ALL";
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

// Note: this is a little different for student view
// for students problems can safely be addressed by position in the list
// this allows new problems to be spawned with blank nubmers and fixed later
// here CURRENT_PROBLEM will refer to the string typed in by users
var SET_CURRENT_PROBLEM = 'SET_CURRENT_PROBLEM';
var CURRENT_PROBLEM = 'CURRENT_PROBLEM';

var SIMILAR_ASSIGNMENT_GROUP_INDEX = "SIMILAR_ASSIGNMENT_GROUP_INDEX";
var SIMILAR_ASSIGNMENT_SETS = "SIMILAR_ASSIGNMENT_SETS";
// teacher grading actions
var VIEW_SIMILAR_ASSIGNMENTS = "VIEW_SIMILAR_ASSIGNMENTS";

// related to creating a custom group of assignments to see side-by-side
// mostly for doing a manual similarity check if the automated one fails
// to notice irregularities
const ALL_STUDENTS = 'ALL_STUDENTS';
const CUSTOM_GROUP = 'CUSTOM_GROUP';

// Problem properties
var PROBLEM_NUMBER = 'PROBLEM_NUMBER';
var STEPS = 'STEPS';
var UNDO_STACK = 'UNDO_STACK';
var REDO_STACK = 'REDO_STACK';
var STEP_ID = 'STEP_ID';

var GRADING_OVERVIEW = 'GRADING_OVERVIEW';
var ALL_PROBLEMS = 'ALL_PROBLEMS';
var PROBLEM_SCORES_GRID = 'PROBLEM_SCORES_GRID';

var VIEW_GRADES = 'VIEW_GRADES';
var NAV_BACK_TO_GRADING = 'NAV_BACK_TO_GRADING';

// when grading google classroom docs, show student name instead of filename
var STUDENT_NAME = 'STUDENT_NAME';
// needed to update the student grade while saving to classroom
var STUDENT_SUBMISSION_ID = 'STUDENT_SUBMISSION_ID';

var COURSE_ID = 'COURSE_ID';
var COURSEWORK_ID = 'COURSEWORK_ID';

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
var ASSIGNMENT_NAME = 'ASSIGNMENT_NAME';

var FORMAT = "FORMAT";
var MATH = "MATH";
var TEXT = "TEXT";
var IMG = "IMG";

var SHOW_ALL = "SHOW_ALL";

// action properties
// PROBLEM_NUMBER, SOLUTION_CLASS_INDEX, SCORE, SOLUTION_INDEX
var GRADE_SINGLE_SOLUTION = "GRADE_SINGLE_SOLUTION";
// action properties
// PROBLEM_NUMBER, SOLUTION_CLASS_INDEX, SCORE
var GRADE_CLASS_OF_SOLUTIONS = "GRADE_CLASS_OF_SOLUTIONS";
// action properties: MODE (JUST_UNGRADED | ALL)

var HIGHLIGHT_STEP = 'HIGHLIGHT_STEP';
var EDIT_STUDENT_STEP = 'EDIT_STUDENT_STEP';
// allows reverting to the original image submitted by students
// note this functionality is only preserved within one grading session
// to save space the original student images are completely replaced by
// the ones with the teacher annotations in the saved zip file
var ORIG_STUDENT_STEP = 'ORIG_STUDENT_STEP';

var DOC_ID = 'DOC_ID';
var GOOGLE_ID = 'GOOGLE_ID';
var SET_GOOGLE_ID = 'SET_GOOGLE_ID';

var SET_GOOGLE_DRIVE_STATE = 'SET_GOOGLE_DRIVE_STATE';
var GOOGLE_DRIVE_STATE = 'GOOGLE_DRIVE_STATE';
var ALL_SAVED = 'ALL_SAVED';

const MODIFY_CLASSROOM_SAVING_COUNT = 'MODIFY_CLASSROOM_SAVING_COUNT';
const CLASSROOM_SAVING_COUNT = 'CLASSROOM_SAVING_COUNT';
const MODIFY_CLASSROOM_TOTAL_TO_SAVE = 'MODIFY_CLASSROOM_TOTAL_TO_SAVE';
const CLASSROOM_TOTAL_TO_SAVE = 'CLASSROOM_TOTAL_TO_SAVE';
const DELTA = 'DELTA';
const RESET_CLASSROOM_SAVING_COUNT = 'RESET_CLASSROOM_SAVING_COUNT';

var SHOW_GOOGLE_VIDEO = 'SHOW_GOOGLE_VIDEO';

/*
 * Compute a table to show the overall grades for each student
 *
 * parameters:
 * allProblems - the structure used in the redux store during grading, with
 *                     student work grouped by problem number and similar student answers
 * returns:
 *    {
 *       STUDENT_GRADES : { "student_name_from_filename" : 6, "other_student_name" : 8 },
 *       GOOGLE_STUDENT_GRADES : { "student_submission_id" : 6, "student_submission_id" : 8 },
 *       ALL_PROBLEMS : [ { PROBLEM_NUMBER : "1", POSSIBLE_POINTS : "4"}, ...]
 *       PROBLEM_SCORES_GRID : { "student_name" : { "1": "4", "3": "2" }  }
 *       POSSIBLE_POINTS : 10,
 *    }
 *    TODO - sort the problem numbers when they aren't simple numbers
 */
// PROBLEMS : { "1.a" : {
//      "POSSIBLE_POINTS : 3,
//      "UNIQUE_ANSWERS" : [ { ANSWER : "x=7", FILTER : "SHOW_ALL"/"SHOW_NONE", STUDENT_WORK : [ {STUDENT_FILE : "jason", AUTOMATICALLY_ASSIGNED_SCORE : 3,
//                             STEPS : [ { CONTENT : "2x=14"},{ CONTENT : "x=7", HIGHLIGHT : SUCCESS ]} ] } } ]}
function calculateGrades(allProblems) {
    var totalPossiblePoints = 0;
    var overallGrades = {};
    // map from google student work submission IDs to grades, for use in updating google classroom
    var overallGradesForGoogle = {};
    // to handle rare but possible scenario where two students have the exact same name
    // zip files will enforce unique filenames, but when grading from google the file IDs will
    // be different, but the student names could be the same
    //
    // this still means the same name will show in the list twice with no indication of which one
    // is which, but at least having this lookup and still doing the aggregation by file ID the
    // students won't be merged into a mega-student with their scores combined
    var googleFileIdsToStudentNames = {};
    var problemScoresGrid = {}
    var allProblemsSummary = []

    var handleSingleSolution =
        function(singleSolution, index, arr) {
            var studentAssignmentName = singleSolution[STUDENT_FILE];
            googleFileIdsToStudentNames[singleSolution[STUDENT_FILE]] = singleSolution[STUDENT_NAME];
            var studentSubmissionId = singleSolution[STUDENT_SUBMISSION_ID];
            var runningScore = overallGrades[studentAssignmentName];
            runningScore = (typeof runningScore !== 'undefined') ? runningScore : 0;
            var score;
            // empty string is considered ungraded, which defaults to "complete" and full credit
            if (singleSolution[SCORE] === "") {
                score = possiblePoints;
            } else {
                score = Number(singleSolution[SCORE]);
            }
            runningScore += score;

            var studentScores = problemScoresGrid[studentAssignmentName];
            var studentScores = (typeof studentScores !== 'undefined') ? studentScores : {};
            studentScores[singleSolution[PROBLEM_NUMBER]] = score;
            problemScoresGrid[studentAssignmentName] = studentScores;

            overallGrades[studentAssignmentName] = runningScore;
            overallGradesForGoogle[studentSubmissionId] = runningScore;
        };

    var handleSingleUnqiueAnswer =
        function(allWorkWithForSingleSolution, index, arr) {
            allWorkWithForSingleSolution[STUDENT_WORK].forEach(
                    handleSingleSolution)
        };

    for (var problemNumber in allProblems) {
        if (allProblems.hasOwnProperty(problemNumber)) {
            allProblemsSummary.push( { PROBLEM_NUMBER : problemNumber,
                                       POSSIBLE_POINTS : allProblems[problemNumber][POSSIBLE_POINTS] });
            var possiblePoints = Number(allProblems[problemNumber][POSSIBLE_POINTS]);
            totalPossiblePoints += possiblePoints;
            var uniqueAnswers = allProblems[problemNumber][UNIQUE_ANSWERS];
            uniqueAnswers.forEach(handleSingleUnqiueAnswer);
        }
    }
    for (var singleStudent in overallGrades) {
        if (overallGrades.hasOwnProperty(singleStudent)) {
            if (googleFileIdsToStudentNames[singleStudent]) {
                overallGrades[googleFileIdsToStudentNames[singleStudent]] = overallGrades[singleStudent];
                problemScoresGrid[googleFileIdsToStudentNames[singleStudent]] = problemScoresGrid[singleStudent];
                delete overallGrades[singleStudent];
            }
        }
    }
    // TODO - sort problems by number
    return {
        STUDENT_GRADES : overallGrades,
        GOOGLE_STUDENT_GRADES : overallGradesForGoogle,
        POSSIBLE_POINTS : totalPossiblePoints,
        PROBLEM_SCORES_GRID : problemScoresGrid,
        ALL_PROBLEMS : allProblemsSummary
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
        if (typeof action[CUSTOM_GROUP] !== 'undefined') {
            return {
                ...state,
                SIMILAR_ASSIGNMENT_GROUP_INDEX: null,
                CUSTOM_GROUP : action[CUSTOM_GROUP]
            };
        } else {
            return {
                ...state,
                CUSTOM_GROUP : null,
                SIMILAR_ASSIGNMENT_GROUP_INDEX : action[SIMILAR_ASSIGNMENT_GROUP_INDEX]
            };
        }
    } else if (action.type === SET_TO_VIEW_GRADES) {
        // TODO - only allow this to be transitioned to from grading mode
        // also disable or hide the button when student is working on an assignment
        var grades = calculateGrades(state[PROBLEMS]);
        // leave existing entries in the state, so users can navigate back to grading
        console.log(grades);
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
            CUSTOM_GROUP : undefined,
            APP_MODE : GRADE_ASSIGNMENTS,
        };
    } else if (action.type === SET_POSSIBLE_POINTS_FOR_ALL) {
        const allProblems = state[PROBLEMS];
        const allProblemsRet = cloneDeep(allProblems);
        const newPossiblePoints = allProblems[action[PROBLEM_NUMBER]][POSSIBLE_POINTS_EDITED];
        for (const probNumber in allProblems ) {
            if (allProblems.hasOwnProperty(probNumber)) {
                    // because of how this is set up, the action below relies of having the
                    // POSSIBLE_POINTS_EDITED value to be set to scale the point values based
                    // on the old vs new possible points, so need to run 2 actions
                allProblemsRet[probNumber] =
                    problemGraderReducer(allProblems[probNumber],
                        { type : EDIT_POSSIBLE_POINTS, POSSIBLE_POINTS : newPossiblePoints});
                allProblemsRet[probNumber] =
                    problemGraderReducer(allProblemsRet[probNumber],
                        { ...action, type : SET_PROBLEM_POSSIBLE_POINTS });
            }
        }
        return {
            ...state,
            PROBLEMS : allProblemsRet
        };
    } else if (action.type === SET_PROBLEM_POSSIBLE_POINTS ||
           action.type === EDIT_POSSIBLE_POINTS ||
           action.type === GRADE_CLASS_OF_SOLUTIONS ||
           action.type === GRADE_SINGLE_SOLUTION ||
           action.type === HIGHLIGHT_STEP ||
           action.type === EDIT_STUDENT_STEP ||
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

    if (allStudentWork.length > 50) {
        if (!window.confirm("You are opening a group of " + allStudentWork.length + " assignments. " +
            "With a class this large the check for overall simular documents for cheating prevention " +
            "will take a long time. We have already finished grouping similar work on each individual " +
            "problem, which we can do much faster. Would you like to wait for the cheating " +
            "prevention check to finish?\n\n" +
            "Select cancel to skip it and just open the grading page.")) {
            return [];
        }
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
            if (problem[FEEDBACK]) delete problem[FEEDBACK];
            if (problem[SCORE]) delete problem[SCORE];
            if (problem[POSSIBLE_POINTS]) delete problem[POSSIBLE_POINTS];
            if (problem[LAST_SHOWN_STEP]) delete problem[LAST_SHOWN_STEP];
            if (problem[UNDO_STACK]) delete problem[UNDO_STACK];
            if (problem[REDO_STACK]) delete problem[REDO_STACK];
            if (problem[STUDENT_NAME]) delete problem[STUDENT_NAME];
            if (problem[STUDENT_SUBMISSION_ID]) delete problem[STUDENT_SUBMISSION_ID];
            problem[STEPS].forEach(function(step, index, array) {
                if (step[HIGHLIGHT]) delete step[HIGHLIGHT];
                if (step[FORMAT]) delete step[FORMAT];
                if (step[STEP_ID]) delete step[STEP_ID];
                step[CONTENT] = step[CONTENT].replace(/\\\s/g, "");
            });
        });
    });
    // with keys of student_doc_1__student_doc_2 with the names sorted alphabetically
    // values are numbers for percentage of unique work from 0 to 1.0
    let similarityScores = {};

    // 2d array of student names whose docs were similar
    var allSimilarityGroups = [];

    // calculate average length of answer accross all docs
    var totalWork = 0;
    var totalProblemsCompleted = 0;
    var totalProblemsAttempted = 0;
    var maxProblemsAttempted = 0;
    // TODO - calculate total number of steps for each student doc
    // use that the calculate size of diff, instead of average doc size
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
            // currently a rough threshold of 60% unique work, will improve later
            // the -2 is to adjust for the filename difference in the structures
            let similarity = ((result.length - 2) / 2.0)
                / ( averageNumberOfQuestions * averageAnswerLength);

            if (similarity < 0.6) {
                let key = buildKey(assignment1[STUDENT_FILE], assignment2[STUDENT_FILE]);
                similarityScores[key] = similarity;
                // create list if one not already existing at this key
                similarDocsToEach[assignment1[STUDENT_FILE]] =
                    ( typeof similarDocsToEach[assignment1[STUDENT_FILE]] !== 'undefined')
                    ? similarDocsToEach[assignment1[STUDENT_FILE]]
                    : [];

                // add if not in list
                if (similarDocsToEach[assignment1[STUDENT_FILE]].indexOf(assignment2[STUDENT_FILE]) === -1) {
                    similarDocsToEach[assignment1[STUDENT_FILE]].push(assignment2[STUDENT_FILE]);
                }
            }
        });
    });
    // too many pairs to do the complete reduction of redundant groups in reasonable time
    // TODO - I think this might actually be logically equivelent to the code below, need to confirm
    // as this is much faster
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

    let pair;
    let addedToOneGroup;

    const addToGroupsIfNotPresent = function(group, index, array) {
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
	    if (group.indexOf(pair[0]) === -1) group.push(pair[0]);
	    if (group.indexOf(pair[1]) === -1) group.push(pair[1]);
	    addedToOneGroup = true;
	}
    };

    for (var similarPair in similarityScores) {
        if (similarityScores.hasOwnProperty(similarPair)) {
            pair = splitKey(similarPair);
            addedToOneGroup = false;
	    /*ignore jslint start*/
            allSimilarityGroups.forEach(addToGroupsIfNotPresent);
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
    for (let filename in assignments) {
        if (assignments.hasOwnProperty(filename)) {
            assignments[filename] = makeBackwardsCompatible(
                removeOriginalStudentImages(assignments[filename]));
        }
    }
    return assignments;
}

// Students in google classroom can unsubmit/reclaim their documents.
// When this happens during a grading session, the teacher is warned
// and this student needs to be taken out of view so they don't overwrite
// the new student work.
//
// TODO - there is a partial implementation of merging student and teacher
//        edits happening during concurrent sessions, but currently it will
//        not work if requests are inflight at the exact same time. When this
//        is fixed it should be safe for teachers to comment on in-progress things.
// TODO - need to enforce uniqueness of identifier
// eslint-disable-next-line no-unused-vars
function removeStudentsFromGradingView(filenamesToRemove, gradedWork) {
    var separatedAssignments = separateIndividualStudentAssignments(gradedWork);

    filenamesToRemove.forEach(function(removeMe) {
        delete separatedAssignments[removeMe];
    });

    var allStudentWork = [];
    for (let filename in separatedAssignments) {
        if (separatedAssignments.hasOwnProperty(filename)) {
            allStudentWork.push({STUDENT_FILE : filename, ASSIGNMENT : separatedAssignments[filename][PROBLEMS]});
        }
    }

    if (allStudentWork.length === 0) {
        alert('Lost permission to view all student work due to unsubmits, navigating back to homepage.');
        window.store.dispatch({type : "GO_TO_MODE_CHOOSER"});
        return;
    }

    var aggregatedWork = aggregateStudentWork(allStudentWork);

    // TODO - This probably isn't be needed anymore. The ephemeral state should still be in place
    // from before this call, but defensively re-setting ti anyway. This was previously set as part
    // of SET_ASSIGNMENTS_TO_GRADE, before the google id was moved the ephemeral state
    window.ephemeralStore.dispatch(
        {type : SET_GOOGLE_ID, GOOGLE_ID: gradedWork[GOOGLE_ID]});

    window.store.dispatch(
        { type : SET_ASSIGNMENTS_TO_GRADE,
          DOC_ID : gradedWork['DOC_ID'],
          NEW_STATE :
            {...aggregatedWork, GOOGLE_ORIGIN_SERVICE : 'CLASSROOM',
                ASSIGNMENT_NAME: gradedWork[ASSIGNMENT_NAME]}});
}

function saveBackToClassroom(gradedWork, onSuccess, onFailure) {

    // clear previous value, although this is supposed to be zero before this is called
    window.ephemeralStore.dispatch({ type: MODIFY_CLASSROOM_TOTAL_TO_SAVE,
        CLASSROOM_TOTAL_TO_SAVE: 0
    });
    window.ephemeralStore.dispatch({ type: RESET_CLASSROOM_SAVING_COUNT });

    var checkFilesLoaded = function() {
        console.log("check all saved");
        var filesBeingSaved = getEphemeralState()[CLASSROOM_SAVING_COUNT];
        if (filesBeingSaved === 0) {
            /* TODO - likely delete, teachers don't lose access on unsubmit
            if (unsubmittedStudents.length > 0) {
                alert('Could not save some feedback some students, they may have unsumitted, removing them from the page. \n'
                      + JSON.stringify(unsubmittedStudents));
            }
            */
            if (errorsSaving) {
                alert("One or more student docs failed to save, please try again after a few minutes.");
                onFailure();
            } else {
                onSuccess();
                // force a repaint so that the popup doesn't show (n-1) successful saves
                // while waiting for the user to clear the alert
                window.setTimeout(function() {
                    alert("Successfully saved grades and feedback.")
                    window.ephemeralStore.dispatch(
                        {type : SET_GOOGLE_DRIVE_STATE, GOOGLE_DRIVE_STATE : ALL_SAVED});
                }, 10);
            }
            window.ephemeralStore.dispatch({ type: MODIFY_CLASSROOM_TOTAL_TO_SAVE,
                CLASSROOM_TOTAL_TO_SAVE: 0
            });
        }
    }

    // TODO - block reporting success until this request complete as well as the file saves
    // save grades to google classroom
    var grades = calculateGrades(gradedWork[PROBLEMS]);
    window.ephemeralStore.dispatch({ type: MODIFY_CLASSROOM_SAVING_COUNT, DELTA: 1});
    updateGrades(gradedWork[COURSE_ID], gradedWork[COURSEWORK_ID], grades /* map from submissionId to grade */,
        function() {
            window.ephemeralStore.dispatch({ type: MODIFY_CLASSROOM_SAVING_COUNT, DELTA: -1});
            // TODO - decrement count here
            // thinking I can just add one more to the saving count and subtract it out
            // so it isn't siplayed to users, it can still block completion, but I think
            // users would be comfused if the count didn't match the number of students
            // and I don't think it makes sense to add text to explain it
            checkFilesLoaded();
        },
        function() {
            console.log("failed saving one student doc");
            errorsSaving++;
            // TODO - limit number of retries?
            window.ephemeralStore.dispatch({ type: MODIFY_CLASSROOM_SAVING_COUNT, DELTA: -1});
            checkFilesLoaded();
        }
    );

    let currentAppMode = gradedWork[APP_MODE];
    var separatedAssignments = separateIndividualStudentAssignments(gradedWork);

    // to include the grades request made above
    // subtracted out when displaying to users, because it will probably be confusing to
    // show them a number different than the number of students they are deailing with
    var totalToSave = 1;
    var errorsSaving = 0;
    var unsubmittedStudents = [];

    const saveStudentAssignment = function(filename, onIndividualFileSuccess, onIndividualFailure) {

        let tempSeparatedAssignments = separateIndividualStudentAssignments(
            getPersistentState());
        let doc = tempSeparatedAssignments[filename];
        saveAssignment(doc, function(finalBlob) {
            updateFileWithBinaryContent(
                null,
                // TODO - filename currently hacky and has googleId in it
                finalBlob, filename, 'application/zip',
                onIndividualFileSuccess,
                onIndividualFailure
            );
        });

    }

    const onIndividualFileSuccess = function() {
        console.log("successful save");
        window.ephemeralStore.dispatch({ type: MODIFY_CLASSROOM_SAVING_COUNT, DELTA: -1});
        if (uploadQueue.length > 0) {
            let nextFilename = uploadQueue.pop();
            saveStudentAssignment(nextFilename, onIndividualFileSuccess, onFailureWrapped(nextFilename));
        } else {
            checkFilesLoaded();
        }
    }
    const onIndividualFailure = function(filename) {
        console.log("failed saving one student doc");
        errorsSaving++;
        // TODO - limit number of retries?
        window.ephemeralStore.dispatch({ type: MODIFY_CLASSROOM_SAVING_COUNT, DELTA: -1});

        if (uploadQueue.length > 0) {
            let nextFilename = uploadQueue.pop();
            saveStudentAssignment(nextFilename, onIndividualFileSuccess, onFailureWrapped(nextFilename));
        } else {
            checkFilesLoaded();
        }
    }
    const onFailureWrapped = function(filename) {
        return function() {
            return onIndividualFailure(filename);
        }
    };

    let uploadQueue = [];
    for (let filename in separatedAssignments) {
        if (separatedAssignments.hasOwnProperty(filename)) {
            window.ephemeralStore.dispatch({ type: MODIFY_CLASSROOM_SAVING_COUNT, DELTA: 1});
            totalToSave++;
            console.log("queued save");
            uploadQueue.push(filename);
        }
    }

    let CONCURRENT_REQUESTS = 5;
    let i;
    for (i = 0; i < CONCURRENT_REQUESTS && uploadQueue.length > 0; i++) {
        let filename = uploadQueue.pop();
        saveStudentAssignment(filename, onIndividualFileSuccess, onFailureWrapped(filename));
    }

    window.ephemeralStore.dispatch({ type: MODIFY_CLASSROOM_TOTAL_TO_SAVE,
        CLASSROOM_TOTAL_TO_SAVE: totalToSave
    });
}

function saveGradedStudentWork(gradedWork) {
    saveGradedStudentWorkToBlob(gradedWork, function(finalBlob) {
        saveAs(finalBlob, getPersistentState()[ASSIGNMENT_NAME] + '.zip');
    });
}

// NOTE - currently unused, thought saving to drive would be confusing while the classroom features
// existed
// Could consider re-enabling now that the grading experience is stateful and knows when it is
// working with classroom, so could allow this for non-classroom grading sessions
function saveGradedStudentWorkToBlob(gradedWork, handleFinalBlobCallback = function() {}) {
    if (gradedWork === undefined) {
        console.log("no graded assignments to save");
    }
    // temporarily disable data loss warning
    window.onbeforeunload = null;

    var separatedAssignments = separateIndividualStudentAssignments(gradedWork);
    var zip = new JSZip();
    var filesBeingAddedToZip = 0;
    const handleBlobFunc = function(filename) {
        return function(studentAssignmentBlob) {
        // studentAssignment is itself a zip
            var fr = new FileReader();
            fr.addEventListener('load', function() {
                var data = this.result;
                zip.file(filename, data);
                filesBeingAddedToZip--;
            });
            fr.readAsArrayBuffer(studentAssignmentBlob);
        };
    };
    for (let filename in separatedAssignments) {
        if (separatedAssignments.hasOwnProperty(filename)) {
            filesBeingAddedToZip++;
            saveAssignment(separatedAssignments[filename], handleBlobFunc(filename));
        }
    }

    // TODO - this pattern doesn't work as intended
    var checkFilesLoaded = function() {
        if (filesBeingAddedToZip === 0) {
            var finalBlob = zip.generate({type: 'blob'});
            handleFinalBlobCallback(finalBlob);
        } else {
            // if not all of the images are loaded, check again in 50 milliseconds
            setTimeout(checkFilesLoaded, 50);
        }
    }
    checkFilesLoaded();
    return zip;
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
            window.ga('send', 'exception', { 'exDescription' : 'failed while comparing expressions.' } );
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
//      "UNIQUE_ANSWERS" : [
//              { ANSWER : "x=7", FILTER : "SHOW_ALL"/"SHOW_NONE",
//                STUDENT_WORK : [
//                      { STUDENT_FILE : "jason", AUTOMATICALLY_ASSIGNED_SCORE : 3,
//                             STEPS : [ { CONTENT : "2x=14"},
//                                       { CONTENT : "x=7", HIGHLIGHT : SUCCESS ]} ] } } ]}
function aggregateStudentWork(allStudentWork, answerKey = {}, expressionComparator = areExpressionsSimilar) {
    var aggregatedWork = {};
    // used to simplify filling in a flag for missing work if a student does not do a problem
    // structure: { "1.1" : { "jason" :true, "taylor" : true }
    var studentWorkFound = {};
    allStudentWork.forEach(function(assignInfo, index, array) {
        assignInfo[ASSIGNMENT].forEach(function(problem, index, array) {
            const lastStep = _.last(problem[STEPS]);
            // image as the last step is treated as blank text as the answer
            var studentAnswer;
            // TODO - encapsulate format check for math to include 'undefined', compatibility with legacy
            if (lastStep && (lastStep[FORMAT] === MATH || lastStep[FORMAT] === TEXT
                             || typeof lastStep[FORMAT] === 'undefined'
                ) && lastStep[CONTENT].trim() !== '') {
                studentAnswer = lastStep[CONTENT]
            } else if (lastStep && problem[STEPS].length >= 2 &&
                        (lastStep[FORMAT] === IMG ||
                            (lastStep[CONTENT].trim() === ''
                                && problem[STEPS][problem[STEPS].length - 2][FORMAT] === IMG))) {
                studentAnswer = 'Image';
            } else {
                studentAnswer = '';
            }

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
                  STUDENT_NAME : assignInfo[STUDENT_NAME],
                  STUDENT_SUBMISSION_ID : assignInfo[STUDENT_SUBMISSION_ID],
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

    var possiblePointsAppearing = {};
    let mostCommonPossiblePoints;
    var countPossiblePointsValues =
        function(uniqueAnswer, index, arr) {
            // sort with largest groups first
            uniqueAnswer[STUDENT_WORK].sort(function(a,b) { return a[STEPS].length - b[STEPS].length; });
            // calculate appearances of different value for possible points
            uniqueAnswer[STUDENT_WORK].forEach(function(singleStudentSolution, index, arr) {
                if (typeof singleStudentSolution[POSSIBLE_POINTS] === 'undefined') {
                    return;
                }
                var existingCountOfThisPosiblePointsValue = possiblePointsAppearing[singleStudentSolution[POSSIBLE_POINTS]];
                if (existingCountOfThisPosiblePointsValue) {
                    existingCountOfThisPosiblePointsValue++;
                } else {
                    existingCountOfThisPosiblePointsValue = 1;
                }
                possiblePointsAppearing[singleStudentSolution[POSSIBLE_POINTS]] = existingCountOfThisPosiblePointsValue;
            });
        };

    var setPossiblePointsAndScaleScore =
        function(singleStudentSolution, index, arr) {
            var newScore = singleStudentSolution[SCORE];
            // this will be false if not set or 0, but that is fine because 0 doesn't need scaling
            if (singleStudentSolution[SCORE]) {
                newScore = scaleScore(singleStudentSolution[SCORE],
                                          singleStudentSolution[POSSIBLE_POINTS],
                                          mostCommonPossiblePoints);
            }
            singleStudentSolution[SCORE] = newScore;
            singleStudentSolution[POSSIBLE_POINTS] = mostCommonPossiblePoints;
            return singleStudentSolution;
        };

    var keyWithMaxValInObj = function(objToSearch) {
        var keys = Object.keys(objToSearch);
        if (keys.length === 0) return undefined;
        return keys.reduce(function(a, b){
                return objToSearch[a] > objToSearch[b] ? a : b
        });
    }


    // sort students responses within an answer group by least work first
    // also apply possible points correctly, they should all be the same, but if a user
    // frankensteined several graded zips together, choose the most common possible points value
    for (problemNumber in aggregatedWork) {
        if (aggregatedWork.hasOwnProperty(problemNumber)) {
            var uniqueAnswers = aggregatedWork[problemNumber][UNIQUE_ANSWERS];
            possiblePointsAppearing = {};
            uniqueAnswers.forEach(countPossiblePointsValues);

            mostCommonPossiblePoints = keyWithMaxValInObj(possiblePointsAppearing);
            mostCommonPossiblePoints = typeof mostCommonPossiblePoints !== 'undefined' ? mostCommonPossiblePoints : 6;
            aggregatedWork[problemNumber][POSSIBLE_POINTS] = mostCommonPossiblePoints;
            aggregatedWork[problemNumber][POSSIBLE_POINTS_EDITED] = mostCommonPossiblePoints;

            aggregatedWork[problemNumber][UNIQUE_ANSWERS] =  uniqueAnswers.map(function(uniqueAnswer, index, arr) {
                // set a scaled score, if different graded zips were frankensteined together by a user
                // don't let the same problem have different possible points for different students
                uniqueAnswer[STUDENT_WORK].map(setPossiblePointsAndScaleScore);
                return uniqueAnswer;
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

    const allStudents = allStudentWork.map(function(assignInfo, index, array) {
        return { STUDENT_FILE: assignInfo[STUDENT_FILE], STUDENT_NAME: assignInfo[STUDENT_NAME]};
    });

    var similarAssignments = findSimilarStudentAssignments(allStudentWork);
    return { CURRENT_FILTERS : { SIMILAR_ASSIGNMENT_GROUP_INDEX : null, ANONYMOUS : true },
    SIMILAR_ASSIGNMENT_SETS : similarAssignments, ALL_STUDENTS: allStudents, CUSTOM_GROUP : null, PROBLEMS : aggregatedWork }
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
    var ret = replaceSpecialCharsWithLatex(
                convertToCurrentFormat2(
                    convertToCurrentFormatFromAlpha(possiblyOldDoc)));
    ret[CURRENT_PROBLEM] = 0;
    return ret;
}

function replaceSpecialCharsWithLatex(possiblyOldDoc) {
    if (possiblyOldDoc.hasOwnProperty(PROBLEMS)
        && possiblyOldDoc[PROBLEMS].length > 0) {
        // TODO - consider getting rid of this deep clone, but not much object creation
        // to avoid if I want to keep this function pure
        possiblyOldDoc = cloneDeep(possiblyOldDoc);
        possiblyOldDoc[PROBLEMS] = possiblyOldDoc[PROBLEMS].map(function (problem) {
            problem[STEPS] = problem[STEPS].map(function (step) {
                var orig = step[CONTENT];
                // TODO - from katex - No character metrics for '∉' in style 'Main-Regular'
                step[CONTENT] = step[CONTENT].replace(/−/g, '-');
                step[CONTENT] = step[CONTENT].replace(/⋅/g, '\\cdot');
                step[CONTENT] = step[CONTENT].replace(/÷/g, '\\div');
                // yes these are different characers... TODO actually maybe not
                //step[CONTENT] = step[CONTENT].replace(/=/g, '=');
                step[CONTENT] = step[CONTENT].replace(/π/g, '\\pi');
                step[CONTENT] = step[CONTENT].replace(/∣/g, '\\vert');
                step[CONTENT] = step[CONTENT].replace(/≥/g, '\\ge');
                step[CONTENT] = step[CONTENT].replace(/≤/g, '\\le');
                step[CONTENT] = step[CONTENT].replace(/≈/g, '\\approx');
                step[CONTENT] = step[CONTENT].replace(/∝/g, '\\propto');
                step[CONTENT] = step[CONTENT].replace(/±/g, '\\pm');
                step[CONTENT] = step[CONTENT].replace(/⟨/g, '\\left\\langle');
                step[CONTENT] = step[CONTENT].replace(/⟩/g, '\\right\\rangle');
                step[CONTENT] = step[CONTENT].replace(/△/g, '\\triangle');
                step[CONTENT] = step[CONTENT].replace(/⊙/g, '\\odot');
                step[CONTENT] = step[CONTENT].replace(/◯/g, '\\bigcirc');
                step[CONTENT] = step[CONTENT].replace(/°/g, '\\degree');
                step[CONTENT] = step[CONTENT].replace(/∠/g, '\\angle');
                step[CONTENT] = step[CONTENT].replace(/∡/g, '\\measuredangle');
                step[CONTENT] = step[CONTENT].replace(/≡/g, '\\equiv');
                step[CONTENT] = step[CONTENT].replace(/≅/g, '\\cong');
                step[CONTENT] = step[CONTENT].replace(/⊥/g, '\\perp');
                step[CONTENT] = step[CONTENT].replace(/∥/g, '\\parallel');
                step[CONTENT] = step[CONTENT].replace(/≃/g, '\\simeq');
                step[CONTENT] = step[CONTENT].replace(/∼/g, '\\sim');
                step[CONTENT] = step[CONTENT].replace(/∀/g, '\\forall');
                step[CONTENT] = step[CONTENT].replace(/∴/g, '\\therefore');
                step[CONTENT] = step[CONTENT].replace(/∵/g, '\\because');
                step[CONTENT] = step[CONTENT].replace(/∈/g, '\\in');
                step[CONTENT] = step[CONTENT].replace(/∉/g, '\\notin');
                step[CONTENT] = step[CONTENT].replace(/∄/g, '\\nexists');
                step[CONTENT] = step[CONTENT].replace(/∃/g, '\\exists');
                step[CONTENT] = step[CONTENT].replace(/¬/g, '\\neg');
                step[CONTENT] = step[CONTENT].replace(/∨/g, '\\lor');
                step[CONTENT] = step[CONTENT].replace(/∧/g, '\\land');
                step[CONTENT] = step[CONTENT].replace(/→/g, '\\to');
                step[CONTENT] = step[CONTENT].replace(/←/g, '\\gets');
                step[CONTENT] = step[CONTENT].replace(/∪/g, '\\cup');
                step[CONTENT] = step[CONTENT].replace(/∩/g, '\\cap');
                step[CONTENT] = step[CONTENT].replace(/⊂/g, '\\subset');
                step[CONTENT] = step[CONTENT].replace(/⊆/g, '\\subseteq');
                step[CONTENT] = step[CONTENT].replace(/⊃/g, '\\supset');
                step[CONTENT] = step[CONTENT].replace(/⊇/g, '\\supseteq');
                step[CONTENT] = step[CONTENT].replace(/∫/g, '\\int');
                step[CONTENT] = step[CONTENT].replace(/∮/g, '\\oint');
                step[CONTENT] = step[CONTENT].replace(/∂/g, '\\partial');
                step[CONTENT] = step[CONTENT].replace(/∑/g, '\\sum');
                step[CONTENT] = step[CONTENT].replace(/∏/g, '\\prod');
                step[CONTENT] = step[CONTENT].replace(/∞/g, '\\infty');
                step[CONTENT] = step[CONTENT].replace(/′/g, "'");

                step[CONTENT] = step[CONTENT].replace(/α/g,"\\alpha");
                step[CONTENT] = step[CONTENT].replace(/β/g,"\\beta");
                step[CONTENT] = step[CONTENT].replace(/γ/g,"\\gamma");
                step[CONTENT] = step[CONTENT].replace(/Γ/g,"\\Gamma");
                step[CONTENT] = step[CONTENT].replace(/δ/g,"\\delta");
                step[CONTENT] = step[CONTENT].replace(/Δ/g,"\\Delta");
                step[CONTENT] = step[CONTENT].replace(/ϵ/g,"\\epsilon");
                step[CONTENT] = step[CONTENT].replace(/ϝ/g,"\\digamma");
                step[CONTENT] = step[CONTENT].replace(/ζ/g,"\\zeta");
                step[CONTENT] = step[CONTENT].replace(/η/g,"\\eta");
                step[CONTENT] = step[CONTENT].replace(/θ/g,"\\theta");
                step[CONTENT] = step[CONTENT].replace(/Θ/g,"\\Theta");
                step[CONTENT] = step[CONTENT].replace(/ι/g,"\\iota");
                step[CONTENT] = step[CONTENT].replace(/κ/g,"\\kappa");
                step[CONTENT] = step[CONTENT].replace(/λ/g,"\\lambda");
                step[CONTENT] = step[CONTENT].replace(/Λ/g,"\\Lambda");
                step[CONTENT] = step[CONTENT].replace(/μ/g,"\\mu");
                step[CONTENT] = step[CONTENT].replace(/ν/g,"\\nu");
                step[CONTENT] = step[CONTENT].replace(/ξ/g,"\\xi");
                step[CONTENT] = step[CONTENT].replace(/Ξ/g,"\\Xi");
                step[CONTENT] = step[CONTENT].replace(/π/g,"\\pi");
                step[CONTENT] = step[CONTENT].replace(/Π/g,"\\Pi");
                step[CONTENT] = step[CONTENT].replace(/ρ/g,"\\rho");
                step[CONTENT] = step[CONTENT].replace(/ϱ/g,"\\varrho");
                step[CONTENT] = step[CONTENT].replace(/σ/g,"\\sigma");
                step[CONTENT] = step[CONTENT].replace(/Σ/g,"\\Sigma");
                step[CONTENT] = step[CONTENT].replace(/τ/g,"\\tau");
                step[CONTENT] = step[CONTENT].replace(/υ/g,"\\upsilon");
                step[CONTENT] = step[CONTENT].replace(/ϒ/g,"\\Upsilon");
                step[CONTENT] = step[CONTENT].replace(/ϕ/g,"\\phi");
                step[CONTENT] = step[CONTENT].replace(/Φ/g,"\\Phi");
                step[CONTENT] = step[CONTENT].replace(/χ/g,"\\chi");
                step[CONTENT] = step[CONTENT].replace(/ψ/g,"\\psi");
                step[CONTENT] = step[CONTENT].replace(/Ψ/g,"\\Psi");
                step[CONTENT] = step[CONTENT].replace(/ω/g,"\\omega");
                step[CONTENT] = step[CONTENT].replace(/Ω/g,"\\Omega");

                if (step[CONTENT] !== orig) {
                    console.log("changing special chars to latex");
                    console.log(orig);
                    console.log(step[CONTENT]);
                }
                return step;
            });
            return problem;
        });
    }
    return possiblyOldDoc;
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

// TODO - eventually I may want to preserve these, but the image with the annotations
// added by the teacher is most important to save, and their edits are expected to be
// non-destructive, just circling/underling and adding text in available whitespace
// if I saved all of the original student docs it would double the file size
// might be better to re-evaluate when I have a way to store the output of the image
// editor as a SVG or some format the describes all of the objects/shapes/text added
// over the base image, to both reduce filesize and to allow re-editing an moving
// around the images/text, today they get locked into the image when editing is done
function removeOriginalStudentImages(newDoc) {
    var newProbs = newDoc[PROBLEMS].map(function (problem) {
        var newSteps = problem[STEPS].map(function (step) {
            var newStep = cloneDeep(step);
            delete newStep[ORIG_STUDENT_STEP];
            return newStep;
        });
        return {
            ...problem,
            STEPS: newSteps
        };
    });
    return {
        ...newDoc,
        PROBLEMS: newProbs
    };
}

function makeBackwardsCompatible(newDoc) {
    /*
    newDoc[PROBLEMS].forEach(function (problem) {
        problem[LAST_SHOWN_STEP] = problem[STEPS].length - 1;
    });
    */
    return newDoc;
}

// TODO - be careful merging in the google branch, changed the signature here to include docId,
// as this codepath is now used for restoring auto-saves from html5 localStorage, not just reading from files
function loadStudentDocsFromZip(content, filename, onSuccess, onFailure, docId, googleId = false) {
    var new_zip = new JSZip();
    var allStudentWork = [];
    var failureCount = 0;
    var badFiles = [];
    // try opening file as a single student doc
    try {
        // TODO - should I set googleId? Should grading a single student doc save back as a single
        // student doc file instead of a zip containing a single file?
        var singleStudentDoc = openAssignment(content, filename);
        allStudentWork.push({STUDENT_FILE : filename, ASSIGNMENT : singleStudentDoc[PROBLEMS]});
    } catch (ex) {
        try {
            // otherwise try to open as a zip full of student docs
            new_zip.load(content);

            var docCount = 0;
            for (let file in new_zip.files) {
                if (new_zip.files.hasOwnProperty(file)) {
                    if (file.indexOf("__MACOSX") > -1 || file.indexOf(".DS_Store") > -1) continue;
                    else if (new_zip.file(file) === null) continue;
                    else docCount++;
                }
            }
            console.log("opening " + docCount + " files.");
            // you now have every files contained in the loaded zip
            for (let file in new_zip.files) {
                // don't get properties from prototype
                if (new_zip.files.hasOwnProperty(file)) {
                    // extra directory added when zipping files on mac
                    // TODO - check for other things to filter out from zip
                    // files created on other platforms
                    if (file.indexOf("__MACOSX") > -1 || file.indexOf(".DS_Store") > -1) continue;
                    // check the extension is .math
                    // hack for "endsWith" function, this is in ES6 consider using Ployfill instead
                    // TODO - disabled because mobile devices were adding .zip. at the end of the filename
                    // still opens fine, but would be good for the extensions to be consistent
                    //if (file.indexOf(".math", file.length - ".math".length) === -1) continue;
                    // filter out directories which are part of this list
                    if (new_zip.file(file) === null) continue;
                    try {
                        var fileContents = new_zip.file(file).asArrayBuffer();
                        var newDoc = openAssignment(fileContents, file);
                        //images[file] = window.URL.createObjectURL(new Blob([fileContents]));
                        allStudentWork.push({STUDENT_FILE : file, ASSIGNMENT : newDoc[PROBLEMS]});

                        console.log("opened student doc");
                    } catch (e) {
                        console.log("failed to parse file: " + file);
                        console.log(e);
                        failureCount++;
                        badFiles.push(file);
                    }
                }
            }
            if (failureCount > 0) {
                alert("Failed to open " + failureCount + " student documents.\n" + badFiles.join("\n"));
                window.ga('send', 'exception', 'error', 'teacher', 'error parsing some student docs', failureCount);
                window.ga('send', 'exception', { 'exDescription' : 'error parsing ' + failureCount + ' student docs' } );
            }
        } catch (e) {
            alert("Error opening file, you should be opening a zip file full of Free Math documents, or a single Free Math assignment.");
            window.ga('send', 'exception', { 'exDescription' : 'error opening zip full of docs to grade' } );
        }
    }

    try {
        window.ga('send', 'event', 'Actions', 'edit', 'Open docs to grade', allStudentWork.length);
        // TODO - add back answer key
        //console.log(allStudentWork);
        if (allStudentWork.length === 0) {
            alert("Zip file did not contain any valid Free Math files.");
            return;
        }
        var aggregatedWork = aggregateStudentWork(allStudentWork);
        console.log("opened docs");
        //console.log(aggregatedWork);

        // TODO - This probably isn't be needed anymore. The ephemeral state should still be in place
        // from before this call, but defensively re-setting ti anyway. This was previously set as part
        // of SET_ASSIGNMENTS_TO_GRADE, before the google id was moved the ephemeral state
        window.ephemeralStore.dispatch(
            {type : SET_GOOGLE_ID, GOOGLE_ID: googleId});

        window.store.dispatch(
            { type : SET_ASSIGNMENTS_TO_GRADE,
              DOC_ID : docId,
              NEW_STATE :
                {...aggregatedWork, ASSIGNMENT_NAME: removeExtension(filename)}});
        onSuccess();
    } catch (e) {
        // TODO - try to open a single student doc
        console.log(e);
        window.ga('send', 'exception', { 'exDescription' : 'error opening zip full of docs to grade' } );
        alert("Error opening file, you should be opening a zip file full of Free Math documents.");
        onFailure();
        return;
    }
}

// open zip file full of student assignments for grading
function studentSubmissionsZip(evt, onSuccess, onFailure) {
    // reset scroll location from previous view of student docs
    window.location.hash = '';
    var f = evt.target.files[0];

    if (f) {
        var r = new FileReader();
        r.onload = function(e) {
            var content = e.target.result;
            loadStudentDocsFromZip(content, f.name, onSuccess, onFailure);
        }
        r.readAsArrayBuffer(f);
    } else {
        window.ga('send', 'exception', { 'exDescription' : 'error opening docs to grade' } );
        alert("Failed to load file");
        onFailure();
    }
}

class SimilarDocChecker extends React.Component {
    render() {
        var state = this.props.value;
        var similarAssignments = state[SIMILAR_ASSIGNMENT_SETS];
        var currentSimilarityGroupIndex = state[SIMILAR_ASSIGNMENT_GROUP_INDEX];
        const studentsToView =
            state[CUSTOM_GROUP] ? state[CUSTOM_GROUP] : similarAssignments[currentSimilarityGroupIndex];
        return (
            <div>
                <SimilarGroupSelector value={this.props.value} />
                { (studentsToView)
                    ? <AllProblemGraders value={this.props.value}/>
                    : null }
            </div>
        );
    }
}

class SimilarGroupSelector extends React.Component {
    render() {
        var state = this.props.value;
        var similarAssignments = state[SIMILAR_ASSIGNMENT_SETS];
        var allStudents = state[ALL_STUDENTS];
        console.log(allStudents);
        var currentSimilarityGroupIndex = state[SIMILAR_ASSIGNMENT_GROUP_INDEX];
        return(
            <div className="similar-assignment-filters">
            { (similarAssignments && similarAssignments.length > 0) ? (
                <div>
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
               : <h3>No students submitted documents sharing a significant amount work.</h3>
            }
            <br /><br />
            <h3>Custom Group</h3>


            <p>See one or more students' full assignments side by side.</p>
            <CustomGroupMaker students={allStudents}/>
            </div>
        );
    }
}

class CustomGroupMaker extends React.Component {
    state = {
        selected: null,
    };
    handleChange = selected => {
        console.log(selected);
        const selectedStudents =
            !selected ? null : selected.map(function(selection) {
                return selection['value'];
        });
        window.store.dispatch(
            { type : VIEW_SIMILAR_ASSIGNMENTS,
                CUSTOM_GROUP : selectedStudents
        });
    };

    render() {
        var students = this.props.students;
        // todo - pull out common prefix if present
        //      - like when opening a zip file with a directory
        students = students.map(function(student, index, array) {
            return { value: student[STUDENT_FILE], label: (student[STUDENT_NAME] ? student[STUDENT_NAME] : student[STUDENT_FILE])};
        });
        return (
            <div className="App">
                <Select
                    isMulti={true}
                    onChange={this.handleChange}
                    options={students}
                />
            </div>
      );
    }
}

/*
 *    {
 *       STUDENT_GRADES : { "student_name_from_filename" : 6, "other_student_name" : 8 },
 *       GOOGLE_STUDENT_GRADES : { "student_submission_id" : 6, "student_submission_id" : 8 },
 *       ALL_PROBLEMS : [ { PROBLEM_NUMBER : "1", POSSIBLE_POINTS : "4"}, ...]
 *       PROBLEM_SCORES_GRID : { "student_name" : { "1": "4", "3": "2" }  }
 *       POSSIBLE_POINTS : 10,
 *    }
 */
class GradesView extends React.Component {
    render() {
        var props = this.props;
        return (
            <div style={{margin:"60px 30px 30px 30px"}}>
                <table>
                    <thead>
                    <tr><th style={{padding: "10px"}}>Student File</th><th style={{padding: "10px"}}>Overall Score</th>
                        {
                            props.value[GRADE_INFO][ALL_PROBLEMS].map(function(problem, index, array) {
                                return (
                                    <th style={{padding: "10px"}}>
                                        <b>{problem[PROBLEM_NUMBER]}</b>
                                        <br /><small>Pts. ({problem[POSSIBLE_POINTS]})</small></th>
                                )
                            })
                        }
                    </tr>
                    </thead>
                    <tbody>
                    {
                        function() {
                            var tableRows = [];
                            var grades = props.value[GRADE_INFO][STUDENT_GRADES];
                            for (var studentFileName in grades) {
                                if (grades.hasOwnProperty(studentFileName)) {
                                    tableRows.push(
                                    (<tr key={studentFileName}>
                                        <td style={{padding: "10px"}}>{studentFileName}</td>
                                        <td style={{padding: "10px"}}>{grades[studentFileName]}</td>
                                        {
                                            props.value[GRADE_INFO][ALL_PROBLEMS].map(function(problem, index, array) {
                                                var studentScores = props.value[GRADE_INFO][PROBLEM_SCORES_GRID][studentFileName];
                                                return (
                                                    <td style={{padding: "10px"}}>{studentScores[problem[PROBLEM_NUMBER]]}</td>
                                                )
                                            })
                                        }
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
}

class AllProblemGraders extends React.Component {
    render() {
        var state = this.props.value;
        var problems = state[PROBLEMS];
        var similarAssignments = state[SIMILAR_ASSIGNMENT_SETS];
        var currentSimilarityGroupIndex = state[SIMILAR_ASSIGNMENT_GROUP_INDEX];
        // either set to a list fo students to filter to, or if undefined/false show all
        // can be set by an index into the automatically identified similarity groups
        // or a custom group created by a teacher
        console.log("custom group render");
        console.log(state[CUSTOM_GROUP]);
        const studentsToView =
            state[CUSTOM_GROUP] ? state[CUSTOM_GROUP] : similarAssignments[currentSimilarityGroupIndex];

        console.log("students to view");
        console.log(studentsToView);
        var currentProblem = state["CURRENT_PROBLEM"];
        // clean up defensively, this same property is used for the teacher view or student view
        // but here it represents a string typed as a problem number, but for students it is an
        // integer index into the list of problems
        if (typeof currentProblem !== 'string' || typeof problems[currentProblem] === 'undefined') {
            currentProblem = this.props.value[GRADING_OVERVIEW][PROBLEMS][0][PROBLEM_NUMBER];
        }

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
                                    || studentsToView) {
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
                                studentsToView={studentsToView}/> ));
                    });
                    return problemGraders;
                }()
            }
            </div>
        );
    }
}

class TeacherInteractiveGrader extends React.Component {
    state = {
        showModal: true,
        SHOW_GOOGLE_VIDEO: false
    };
    constructor(props) {
        super(props);
        this.chartRef = React.createRef();
    }

    render() {

        var labels = [];
        var numberUniqueAnswersData = {
            label: "Unique Answers",
            backgroundColor: "blue",
            data: []
        };
        var largestAnswerGroups = {
            label: "Largest Group",
            backgroundColor: "green",
            data: []
        };
        var averageAnswerGroups = {
            label: "Average Group",
            backgroundColor: "purple",
            data: []
        };
        var graphData = [numberUniqueAnswersData, largestAnswerGroups, averageAnswerGroups];
        // TODO - remvoe direct access to redux store, also do the same in AllProblemGraders
        var gradingOverview = this.props.value[GRADING_OVERVIEW][PROBLEMS];
        gradingOverview.forEach(function(problemSummary, index, array) {
            labels.push("Problem " + problemSummary[PROBLEM_NUMBER]);
            numberUniqueAnswersData["data"].push(problemSummary["NUMBER_UNIQUE_ANSWERS"]);
            largestAnswerGroups["data"].push(problemSummary["LARGEST_ANSWER_GROUP_SIZE"]);
            averageAnswerGroups["data"].push(problemSummary["AVG_ANSWER_GROUP_SIZE"]);
        });
        var onClickFunc = function(evt) {
            let chart = this.chartRef.current.chartInstance
            var activePoints = chart.getElementsAtEvent(evt);
            var problemNum;
            if (!activePoints || activePoints.length === 0) {
                // TODO - this could be better, collision isn't quite right once the text labels
                // are tight enough they start displaying at an angle.
                let mousePoint = Chart.helpers.getRelativePosition(evt, chart.chart);
                let yScale = chart.scales['y-axis-0'];
                if (yScale.getValueForPixel(mousePoint.y) < 0) {
                    let mousePoint = Chart.helpers.getRelativePosition(evt, chart.chart);
                    let xScale = chart.scales['x-axis-0'];
                    problemNum = xScale.ticks[xScale.getValueForPixel(mousePoint.x)];
                } else {
                    return;
                }
            } else {
                problemNum = labels[activePoints[0]["_index"]];
            }
            problemNum = problemNum.replace("Problem ", "");
            window.ga('send', 'event', 'Actions', 'edit',
                'Change problem being graded');
            window.ephemeralStore.dispatch({ type : SET_CURRENT_PROBLEM,
                                    CURRENT_PROBLEM : problemNum});
        }.bind(this);

        const onHover = function(e) {
            let chart = this.chartRef.current.chartInstance
            var point = chart.getElementAtEvent(e);
            let mousePoint = Chart.helpers.getRelativePosition(e, chart.chart);
            let yScale = chart.scales['y-axis-0'];
            // detect if hitting an element, in this case one of the bars,
            // or if anywhere below the graph where users can click on the
            // labels to also select problems
            if (point.length ||
                  yScale.getValueForPixel(mousePoint.y) < 0) {
                e.target.style.cursor = 'pointer';
            }
            else e.target.style.cursor = 'default';
        }.bind(this);

        defaults.global.defaultFontColor = '#010101';
        defaults.global.defaultFontSize = 16;
        // todo - figure out the right way to do this
        // todo - do i want to be able to change the sort ordering, possibly to put
        //        the most important to review problem first, rather than just the
        //        problems in order?
        var browserIsIOS = false; ///iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        var showTutorial = this.props.value[SHOW_TUTORIAL];
        return (
            <div style={{padding:"0px 20px 0px 20px"}}>
                <br />
                <div className="menubar-spacer"> </div>
                <FreeMathModal
                    showModal={showTutorial && this.state.showModal}
                    closeModal={function() {
                                this.setState({showModal: false});
                            }.bind(this)}
                    content={(
                        <div width="750px">
                            <Button className="extra-long-problem-action-button fm-button"
                                    style={{fontSize: "25px", borderRadius: "30px", width: "450px", padding: "8px 16px"}}
                                    text={this.state[SHOW_GOOGLE_VIDEO] ?
                                        "Show Video for other LMS tools" : "Show Google Classroom Video" }
                                    text={this.state[SHOW_GOOGLE_VIDEO] ?
                                        "Show Video for other LMS tools" : "Show Google Classroom Video" }
                                    onClick={function() {
                                        this.setState({ SHOW_GOOGLE_VIDEO : ! this.state[SHOW_GOOGLE_VIDEO]});
                                    }.bind(this)}
                            />
                            <br />
                            <br />
                            { this.state[SHOW_GOOGLE_VIDEO] ?
                                <div>
                                <h3>Google Classroom Instructions</h3>
                                <iframe title="Google Classroom Instructions Video"
                                    src="https://www.youtube.com/embed/cR9R3tXbiug?ecver=2"
                                    allowFullScreen frameBorder="0"
                                    className="tutorial-video"
                                    ></iframe>
                                </div>
                                :
                                <div>
                                <h3>Instructions for Any LMS</h3>
                                <iframe title="Free Math Video"
                                    src="https://www.youtube.com/embed/NcsJK771YFg?ecver=2"
                                    allowFullScreen frameBorder="0"
                                    className="tutorial-video"
                                    ></iframe>
                                </div>
                            }
                        </div>
                        )
                    } />
                <FreeMathModal
                    showModal={this.props.value[CLASSROOM_TOTAL_TO_SAVE]}
                    content={(
                        <div width="600px">
                            <CloseButton onClick={function() {
                                window.ephemeralStore.dispatch({ type: MODIFY_CLASSROOM_TOTAL_TO_SAVE,
                                    CLASSROOM_TOTAL_TO_SAVE: 0
                                });
                            }.bind(this)} />

                            <div style={{width:"400px", alignItems: "center", textAlign: "center"}}>
                                <img style={{
                                    "display": "flex",
                                    "marginLeft":"auto",
                                    "marginRight": "auto"
                                     }}
                                     src="images/Ajax-loader.gif" alt="loading spinner" /><br />
                                <br />
                                Saving to Classroom...
                                <br />
                                {/* subtract one for the request to save grades, only show user count matching total students
                                    Also "undercounts" the number of successful requests, so that the dialog doesn't hang around
                                    with N / N successful while waiting for the last request to finish, hence the max with 0,
                                    otherwise the calculation would should -1 if nothing was successful yet
                                    */}
                                {Math.max(0, this.props.value[CLASSROOM_TOTAL_TO_SAVE] - 1 - (this.props.value[CLASSROOM_SAVING_COUNT]))}
                                &nbsp; / &nbsp;
                                {this.props.value[CLASSROOM_TOTAL_TO_SAVE] - 1}
                                &nbsp; saved
                            </div>
                        </div>
                        )
                    } />
                {browserIsIOS ?
                    (
                        <div className="answer-incorrect"
                         style={{float: "right", display:"inline-block", padding:"5px", margin: "5px"}}>
                            <span>Due to a browser limitation, you currently cannot save work in iOS. This demo can
                                  be used to try out the experience, but you will need to visit the site on your Mac,
                                  Widows PC, Chromebook or Android device to actually use the site.</span>
                        </div>) :
                    null
                }
                {showTutorial ?
                    (<Button text="Reopen Demo Video" style={{backgroundColor: "#dc0031"}}
                        title="Reopen Demo Video"
                        onClick={function() {
                            this.setState({showModal: true});
                        }.bind(this)}/>
                    ) : null}
                <h3>To see student responses to a question,
                    click on the corresponding bars or label in the graph.</h3>
                <Bar width="400" height="70"
                        ref={this.chartRef}
                        data={{
                            labels: labels,
                            datasets: graphData
                        }}
                        options={{
                            scales: {
                                yAxes: [{
                                    ticks: {
                                        beginAtZero:true
                                    }
                                }]
                            },
                            onClick: onClickFunc,
                            hover: {
                                onHover: onHover
                            }
                        }}
                />
                {/* TODO - finish option to grade anonymously <TeacherGraderFilters value={this.props.value}/> */}
                <span id="grade_problem" />
                <div style={{paddingTop: "100px", marginTop: "-100px"}} />
                <AllProblemGraders value={this.props.value}/>
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
}

export { TeacherInteractiveGrader as default,
    GradesView,
    SimilarDocChecker,
    loadStudentDocsFromZip,
    studentSubmissionsZip,
    saveGradedStudentWork,
    removeStudentsFromGradingView,
    saveGradedStudentWorkToBlob,
    gradeSingleProblem,
    aggregateStudentWork,
    separateIndividualStudentAssignments,
    calculateGradingOverview,
    calculateGrades,
    convertToCurrentFormat,
    gradingReducer,
    makeBackwardsCompatible,
    saveBackToClassroom
};

