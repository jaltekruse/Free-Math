/*
    This file is part of OpenNotebook-Web

    OpenNotebook-Web is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    OpenNotebook-Web is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with OpenNotebook-Web.  If not, see <http://www.gnu.org/licenses/>. 
*/
MathQuill.interfaceVersion(1);

var problems = Array();

var mathQuillOpts = {
    // for intuitive navigation of fractions
    leftRightIntoCmdGoes: 'up',
    autoCommands: 'pi theta sqrt sum',
    autoSubscriptNumerals: true,
};

// assumes the assignment-container div is empty, adds the html for giving
// the assignment a name
function newAssignment(assignmentName) {
    if (assignmentName == undefined || assignmentName == null || assignmentName == '') {
        assignmentName = 'Untitled Assignment';
    }
    var assignmentNameHTML = 
'<p>Open Notebook allows you to complete your math homework on your computer. The first problem has been created for you, ' +
'use the box below to write an equation. When you want to modify it to solve your math problem click ' +
'the "next step" button to copy your expression or equation and edit it on the next line to show your work. ' +
'This tool is designed to take care of some of the busywork of math, which makes it easier to record all ' +
'of your thinking without a bunch of manual copying.</p>' +

//<!-- p> Undo and redo buttons can be used to edit your work.</p -->
//<!-- p> For faster usage, note the keyboard shortcuts given on each button </p -->
'<p> For example, try typing to following expression and simplifying it, even if you can do ' +
'parts of it in your head, use the tool to make sure you show your work. ' +
'<span class="mathquill-static-math" >4-9\\left(\\frac{2}{3}\\right)^2+\\frac{4}{5-3\\cdot 4}</span></p>' +

'Assignment Name <input type="text" id="assignment-name-text" name="assignment name" value="' + assignmentName + '"/>' + 
'<input type="submit" id="save-assignment" name="save assignment" value="save assignment"/> </br>';

    $('#assignment-container').append(assignmentNameHTML);
    $('#save-assignment').click(function() {
        saveAssignment();
    });
        var result = MathQuill.StaticMath($('.mathquill-static-math')[0]);
}

function collectAnswerKey() {
    // read current assignment content and use as answer key for now
    // will want a custom experience for teachers later
    return serializeAssignment();
}

function applyGradeToStudentWork(studentWork, answer, score, possiblePoints) {
    var currentAnswer = MathQuill($(studentWork).find('.solution-step').last()[0]).latex();
    // copare answers with the khan algebra system KAS
    var expr1 = KAS.parse(currentAnswer).expr;
    var expr2 = KAS.parse(answer).expr;
    if (KAS.compare(expr1, expr2).equal) {
        var work = $(studentWork);
        work.removeClass('answer-correct').removeClass('answer-incorrect').removeClass('answer-partially-correct');
        if (parseFloat(score) >= parseFloat(possiblePoints)) {
            work.addClass('answer-correct');
        } else if (score > 0) {
            work.addClass('answer-partially-correct');
        } else {
            work.addClass('answer-incorrect');
        }
        $(studentWork).find('.problem-grade-input').last().val(score).change();
    }
}

/**
 * Requires the dom element of the text input for setting the score to be passed
 */
function setStudentGrade(textInput) {
    var score = textInput.value;
    var possiblePoints = $(textInput).closest('.problem-summary-container').find('.possible-points-input').last().val();
    if (isNaN(score) || score < 0) {
        alert('Please enter a numeric value for points');
        return;
    }
    var currentStudentWork = $(textInput).closest('.student-work');
    // get the final answer entered for this problem, used to check against other student work
    console.log(currentStudentWork.find('.solution-step').last());
    // TODO - possibly file a Mathquill github issue, why do I need [0] when I've called last()?
    var answer = MathQuill(currentStudentWork.find('.solution-step').last()[0]).latex();
    var preventPropogateScore = currentStudentWork.find('.dont-apply-score-to-similar').last().is(':checked');
    if (preventPropogateScore) {
        applyGradeToStudentWork(currentStudentWork, answer, score, possiblePoints);
        return;
    }
    $(textInput).closest('.similar-student-answers').find('.student-work').each(function(index, studentWork) {
        applyGradeToStudentWork(studentWork, answer, score, possiblePoints);
    });
}

function addSingleStudentsWork(studentWork, allStudentsWorkForCurrentAnswer, defaultPointsPerProblem) {
    var newProblemHtml = 
    // TODO - update this class of answer-correct vs answer-incorrect after teacher gives a manual grade
    // add a status for partial credit, color the div yellow in this case
    // TODO - sanitize filenames to remove spaces, need to make sure same logic is applied when I go to look up these classes
    '<div class="student-work ' + 'answer-' + studentWork.autoGradeStatus + " student-filename-" + studentWork.studentFile + '" style="float:left"> <!-- container for nav an equation list -->' +
        '<div style="float:left" class="equation-list"></div>' + 
    '</div>';
    var studentWorkDiv = $(newProblemHtml);
    allStudentsWorkForCurrentAnswer.append(studentWorkDiv);
    studentWork.steps.forEach(function(studentWorkStep, index, array) {
        setTimeout(function() {
            var newSpan = $('<span class="solution-step">' + studentWorkStep + '</span><br>');
            studentWorkDiv.append(newSpan);
            var steps = studentWorkDiv.find('.solution-step');
            var mq = MathQuill.StaticMath(steps[steps.length - 1], mathQuillOpts);
        }, 50);
    });
    var autoGradeScore
    if (studentWork.autoGradeStatus == "correct") {
       autoGradeScore = defaultPointsPerProblem;
    } else {
       autoGradeScore = 0;
    }
    var scoreInput = '<p>Score <input type="text" class="problem-grade-input" value="' + autoGradeScore + '"/>' + 
        ' out of <span class="total-problem-points">' + defaultPointsPerProblem + '</span></p>';
    studentWorkDiv.append('<p class="student-name-label">' + removeExtension(studentWork.studentFile) + '</p>');
    studentWorkDiv.append(scoreInput);
    studentWorkDiv.append('<label>&nbsp;<input type="checkbox" class="dont-apply-score-to-similar">Don\'t apply score to similar student work</label><br>');
    
    studentWorkDiv.append('<input type="submit" class="highlight-student-errors" name="highlight errors" value="highlight errors"/>');
    studentWorkDiv.append('<input type="submit" class="highlight-student-successes" name="highlight successes" value="highlight successes"/>');
    studentWorkDiv.append('<input type="submit" class="clear-highlights" name="clear highlights" value="clear hightlights"/>');
    studentWorkDiv.append('<p>Feedback</p><div><textarea width="30" height="8"></textarea></div>');
}

// Transforms a list of student assignments into a structure where all work for one problem
// is stored together, separated by different final answers reached by groups of students.
//
// Params:
// allStudentWork:
// [ {filename : "jake r.", problems: [{"steps" : }]]
//
// Returns:
// TODO - this will need to be something other than an array to allow for complex problem numbers
// [ {
//      "problemNumber" : "1.a",
//      "totalIncorrect" : 5, 
//      "totalMissing" : 0,
//      "uniqueAnswers" : { "x=7" : [ {studentFile : "jason", autoGradeStatus: "correct|incorrect", steps : ["2x=14","x=7" ]} ] } ]
function aggregateStudentWork(allStudentWork, correctAnswers) {
    var aggregatedWork = [];
    // used to simplify filling in a flag for missing work if a student does not do a problem
    // structure: { "1.1" : { "jason" :true, "taylor" : true }
    var studentWorkFound = {};
    console.log(correctAnswers);
    allStudentWork.forEach(function(assignInfo, index, array) {
        assignInfo.assignment.problems.forEach(function(problem, index, array) {
            console.log(problem);
            var studentAnswer = problem.steps[problem.steps.length - 1];
            var autoGrade = "incorrect";
            var correct = false;
            // TODO - fixme, correctAnswers is not an array, it is currently a map, as the keys can be
            // non integers like 1.1 or 5.b
            if (!$.isEmptyObject(correctAnswers)) {
                // this problem did not appear in the answer key
                if (!correctAnswers[problem.problemNumber]) {
                    autoGrade = "incorrect";
                } else {
                    $.each(correctAnswers[problem.problemNumber], function(index, answer) {
                        console.log(answer);
                        console.log(studentAnswer);
                        var expr1 = KAS.parse(answer).expr;
                        var expr2 = KAS.parse(studentAnswer).expr;
                        if (KAS.compare(expr1, expr2).equal) {
                            autoGrade = "correct";
                            return false; // early terminate loop
                        }
                    });
                }
            }

            // write into the abreviated list of problems completed, used below to fill in placeholder for
            // completely absent work
            allStudentsWhoDidThisProblem = studentWorkFound[problem.problemNumber];
            allStudentsWhoDidThisProblem = (typeof allStudentsWhoDidThisProblem != 'undefined') ? allStudentsWhoDidThisProblem : {};
            allStudentsWhoDidThisProblem[assignInfo.filename] = true;
            studentWorkFound[problem.problemNumber] = allStudentsWhoDidThisProblem;
            
            // TODO - move this mostly to the notes.txt doc
            // once I am doing better grading based on parsing the math, I won't be able
            // to use the answers as keys into this map
            // TODO - look up making custom map keys in JS (I know it ins't supported natively)
            // to make a hashmap I would need to define hashing that would consider
            // sufficiently similar expressions equivelent in hash value, while also customizing
            // what is allowed to be different between the expressions
            // - similar problem with treemap, would need to define ordering that would put
            //   similar expressions near one another
            //    - might be easiest to just do a nested loop when that comes up, this would just
            //      require an approximate equals method, not even a compareTo() implementation 
            var problemSummary = aggregatedWork[problem.problemNumber];
            problemSummary = (typeof problemSummary != 'undefined') ? problemSummary : {};

            var uniqueAnswers = problemSummary['uniqueAnswers'];
            uniqueAnswers = ( typeof uniqueAnswers != 'undefined') ? 
                    uniqueAnswers : {};
            var workList = uniqueAnswers[studentAnswer];
            workList = ( typeof workList != 'undefined' && workList instanceof Array ) ? workList : [];
            var totalIncorrect = problemSummary['totalIncorrect'];
            totalIncorrect = ( typeof totalIncorrect != 'undefined') ? totalIncorrect : 0;
            if (autoGrade == "incorrect") {
                totalIncorrect++;
            }
            workList.push({studentFile : assignInfo.filename, autoGradeStatus: autoGrade, steps : problem.steps});
            uniqueAnswers[studentAnswer] = workList;
            problemSummary['uniqueAnswers'] = uniqueAnswers;
            // this is currently redundant, but the next step to order all of the problems based
            // on which ones most students go wrong with rewrite the keys to numeric ones
            problemSummary['problemNumber'] = problem.problemNumber;
            problemSummary['totalIncorrect'] = totalIncorrect;
            // this is necessary because this might be the first time this problem number was seen so we just created the list
            // if this wasn't the case, this wouldn't be necessary because objects including arrays are always passed by reference
            aggregatedWork[problem.problemNumber] = problemSummary;
        });
    });
    // add blank answers for any students missing problems
    $.each(allStudentWork, function(index, assignInfo) {
        $.each(studentWorkFound, function(problemNumber, studentsFound) {
            if (!studentsFound[assignInfo.filename]) {
                missingWork = aggregatedWork[problemNumber]['uniqueAnswers']['unanswered'];
                missingWork = (typeof missingWork != 'undefined') ? missingWork : [];
                missingWork.push(
                        {studentFile : assignInfo.filename, autoGradeStatus: 'incorrect', steps : ['unanswered']});
                aggregatedWork[problemNumber]['uniqueAnswers']['unanswered'] = missingWork;
            }
        });
    });
    return aggregatedWork;
}

// Add global options for teacher summary page.
//
// - Toggle for automatically applying grades to similar student answers
// - Checkboxes for showing correct, incorrect and partially correct work
//
function addteacherSummaryPageOptions(assignmentDiv) {

    // TODO - finish impelmenting this
    /*
    assignmentDiv.append('<input type="checkbox" id="apply-same-grade-to-others" checked="checked">' +
            'Apply manual grades to all students with matching answers ' +
            '<span title="Default to applying a score you give to one student to all others who got the' + 
            ' the same answer. You can override the score after looking at each individual student\'s work">' +
            ' - Hover for Info</span><br><br>');
    */        
    assignmentDiv.append(
    '<div class="assignment-filters">' + 
        '<div style="width:100%;overflow:hidden">' +
            '<div style="float:left">Show Student Work that is:</div>' + 
            '<div class="show-incorrect-div"><label><input type="checkbox" id="show-incorrect" checked="checked">incorrect</label></div>' + 
            // this is unchecked programmatically to hide all of the correct work by default
            // there was a weird bug where parens weren't showing up with other attempts to hide
            // it programatically
            '<div class="show-partially-correct-div"><label><input type="checkbox" id="show-partially-correct" checked="checked">partially correct</label></div>' + 
            '<div class="show-correct-div"><label><input type="checkbox" id="show-correct" checked="checked">correct</label></div>' +
        '</div>' +
        '<div><label>&nbsp;<input type="checkbox" id="show-student-names" checked="checked">Show student names (or grade anonymously)</label></div>' + 
    '</div>');

    //apply-same-grade-to-others
    $('#show-correct').change(function() {
        if (! this.checked) {
            $('.answer-correct').fadeOut();
        } else {
            $('.answer-correct').show();
        }
    });
    $('#show-student-names').change(function() {
        if (! this.checked) {
            $('.student-name-label').fadeOut();
        } else {
            $('.student-name-label').show();
        }
    });
    $('#show-incorrect').change(function() {
        if (! this.checked) {
            $('.answer-incorrect').fadeOut();
        } else {
            $('.answer-incorrect').show();
        }
    });
    $('#show-partially-correct').change(function() {
        if (! this.checked) { 
            $('.answer-partially-correct').fadeOut();
        } else {
            $('.answer-partially-correct').show();
        }
    });
}

function generateSimilarStudentWorkHeader(allStudentsWorkLeadingToOneAnswer, studentFinalAnswer) {
    var studentCount = allStudentsWorkLeadingToOneAnswer.length;
    if (allStudentsWorkLeadingToOneAnswer.length > 1) {
        studentCount = studentCount + ' students ';
    } else {
        studentCount = studentCount + ' student ';
    }
    var message = 'with work leading to answer ';
    if (studentFinalAnswer === 'unanswered') {
       message = 'with the question '; 
    }
    return '<div class="similar-student-answers" style="float:none;overflow: hidden" >' +
            '<input type="submit" class="show-all-common-answers" name="show all" value="show all"/>' + 
            '<input type="submit" class="hide-all-common-answers" name="hide all" value="hide all"/>' + 
            '<p>' + studentCount + message +
            '<span class="common-student-answer">' + studentFinalAnswer + '</span></p></div>';
}

function findSimilarStudentAssignments(allStudentWork) {
    // 2d array of student names whose docs were similar
    var allSimilarityGroups = [];
    // map form student names to hash lookup table (object) with group id's
    var groupMemberships = {};
    allStudentWork.forEach(function(assignment1, index, array) {
        allStudentWork.forEach(function(assignment2, index, array) {
            if (assignment1.filename == assignment2.filename) return;
            var result = JsDiff.diffJson(assignment1, assignment2);
            //console.log(result.length);
            // TODO - better threshold
            //      - need to make sure size of diffs is taken into acount
            //      - students should match 95% of their assignments exactly and then
            //        have unique work on 1 or two problem (this currently shows up as
            //        a bunch of small diffs, and I'm only lookin at number of diffs here)
            if (result.length < 5) {
                // is the first assignment matched with at least one similarity group
                var matchingGroup = groupMemberships[assignment1.filename];
                console.log(groupMemberships);
                if (matchingGroup >= 0) {
                    if (groupMemberships[assignment2.filename] >= 0) return;
                    allSimilarityGroups[matchingGroup].push(assignment2.filename);
                    groupMemberships[assignment2.filename] = matchingGroup;
                } else {
                    groupMemberships[assignment1.filename] = allSimilarityGroups.length;
                    groupMemberships[assignment2.filename] = allSimilarityGroups.length;
                    allSimilarityGroups.push([assignment1.filename, assignment2.filename]);
                }
            }
            //console.log(result);
        });
    });
    return allSimilarityGroups;
}

function escapeRegExp(str) {
        return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function replaceAll(str, find, replace) {
      return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

// for esacping dots in string with a double backslash, necessary for
// selecting classes with query when they contain dots
function escapeDots(str) {
    return replaceAll(replaceAll(str, '.', '\\.'), '/', '\\/');
}

function addSimilarAssignmentControls(assignmentContainer, similarAssignments) {
    if (similarAssignments.length == 0) return;
    var similarAssignmentFilters = $('<div class="similar-assignment-filters"><h3>Some students may have copied each others work.</h3></div>');
    similarAssignments.forEach(function(similarityGroup, index, array) {
        var similarAssignmentGroup = $("<p>A group of " + similarityGroup.length + " assignments had similar work &nbsp;</p>");
        var viewButton = $('<input type="submit" value="View"/>');
        similarAssignmentGroup.append(viewButton);
        similarAssignmentFilters.append(similarAssignmentGroup);
        viewButton.click(0, function(evt) {
            $('.answer-correct').hide();
            $('.answer-partially-correct').hide();
            $('.answer-incorrect').hide();
            similarityGroup.forEach(function(assignment, index, array) {
                console.log('.' + escapeDots('student-filename-' + assignment));
                $('.' + escapeDots('student-filename-' + assignment)).show();
            });
        });
    });
    assignmentContainer.append(similarAssignmentFilters);
}

function generateTeacherOverview(allStudentWork) {
    var confirmMessage = "Use current document as answer key and generate assignment overview?\n"
        "Warning -  save doc now to allow reuse of answer key later";
    if (!window.confirm(confirmMessage)) { 
        return; 
    }

    var assignmentContainer = $('#assignment-container');
    assignmentContainer.empty();
    // To prevent students form just sharing their assignment files and submitting the same work
    // each assignment is checked against the others for similarity.
    // If two or more assignments are very similar (not sure how to set this threshold yet) then
    // the teacher will be given the option to just view this group of assignments together
    // so they can use their own judgment if the student's were cheating or not
    var similarAssignments = findSimilarStudentAssignments(allStudentWork)
    addSimilarAssignmentControls(assignmentContainer, similarAssignments);
    // TODO - allow teachers to set a different default value
    // with a popup at the start of the grading experience?
    // maybe the form for opening stuff to grade should be more
    // involved, with a number of configuration, filled in with
    // sensible defaults for basic users
    var defaultPointsPerProblem = 3;
    var answerKey = collectAnswerKey();
    // clear global list of problems
    problems = Array();
    addteacherSummaryPageOptions(assignmentContainer);

    var newProblemSummaryHtml = 
        '<div class="problem-summary-container" style="float:none;overflow: hidden"></div>';
    var correctAnswers = {};
    answerKey.problems.forEach(function(correctAnswer, index, array) {
        // TODO - handle multiple correct answers better
        correctAnswers[correctAnswer.problemNumber] = correctAnswer.steps;
    });
    aggregatedWork = aggregateStudentWork(allStudentWork, correctAnswers);
    // TODO - look at result to pull out problems that don't have matching problem numbers (very few
    // problems end up in one of the lists) and give teachers the opportunity to rearrange them
    aggregatedWork.sort(function(a, b) { 
        return b.totalIncorrect - a.totalIncorrect;
    });
    aggregatedWork.forEach(function(problemSummary, index, array) {
        var newProblemDiv = $(newProblemSummaryHtml);
        assignmentContainer.append(newProblemDiv);
        newProblemDiv.append('<h3>Problem number ' + problemSummary.problemNumber + 
            '</h3> Total incorrect answers ' + problemSummary.totalIncorrect + '<p>' + 
            'Possible points &nbsp;<input type="text" class="possible-points-input" width="4" value="' + defaultPointsPerProblem + '"/></p>');
        $.each(problemSummary.uniqueAnswers, function(studentFinalAnswer, allStudentsWorkLeadingToOneAnswer) {
            var similarAnswersHTML = generateSimilarStudentWorkHeader(allStudentsWorkLeadingToOneAnswer, studentFinalAnswer);
            var allStudentsWorkForCurrentAnswer = $(similarAnswersHTML);
            newProblemDiv.append(allStudentsWorkForCurrentAnswer);
            MathQuill.StaticMath(allStudentsWorkForCurrentAnswer.find('.common-student-answer')[0]);
            allStudentsWorkLeadingToOneAnswer.forEach(function(studentWork, index, array) {
                addSingleStudentsWork(studentWork, allStudentsWorkForCurrentAnswer, defaultPointsPerProblem);
            });
        });
    });
    $('.possible-points-input').keyup(0 /* ignored */, function(evt) {
        if (evt.which == 13) {
            var possiblePoints = evt.target.value;
            if (isNaN(possiblePoints) || possiblePoints < 0) {
                alert('Please enter a positive numeric value for possible points');
                return;
            }
            var possiblePoints = parseFloat(possiblePoints);
            // get the old value out of one of the child elements (that we are just about to update) may be a cleaner way to do
            // this, but it should be safe 
            var firstPossiblePointsSpan = $(evt.target).closest('.problem-summary-container').find('.total-problem-points')[0];
            var oldPossiblePointsText = $(firstPossiblePointsSpan).text();
            var oldPossiblePoints = parseFloat(oldPossiblePointsText);
            $(evt.target).closest('.problem-summary-container').find('.total-problem-points').text(possiblePoints);
            $(evt.target).closest('.problem-summary-container').find('.problem-grade-input').each(function(index, gradeInput) {
                var currentVal = parseFloat($(gradeInput).val());
                var newScore;
                if (currentVal == 0) {
                    newScore = 0; 
                } else {
                    newScore = parseFloat($(gradeInput).val()) + possiblePoints - oldPossiblePoints;
                }
                $(gradeInput).val(newScore);
            });

        } else {
            return false;
        }
    });
    $('.hide-all-common-answers').click(0, function(evt) {
        $(evt.target).closest('.similar-student-answers').find('.student-work').fadeOut();
    });
    $('.show-all-common-answers').click(0, function(evt) {
        $(evt.target).closest('.similar-student-answers').find('.student-work').show();
    });
    $('.highlight-student-errors').click(0, function(evt) {
        var errorClickHandler = function (element) { 
            $(element).addClass('error-highlight'); 
        }
        var myDomOutline = DomOutline({ onClick: errorClickHandler, filter : ".solution-step"});

        // Start outline:
        myDomOutline.start();
    });
    $('.highlight-student-successes').click(0, function(evt) {
        var successClickHandler = function (element) { 
            $(element).addClass('success-highlight'); 
        }
        var myDomOutline = DomOutline({ onClick: successClickHandler, filter : ".solution-step"});

        // Start outline:
        myDomOutline.start();
    });
    $('.clear-highlights').click(0, function(evt) {
        $(evt.target).closest('.similar-student-answers').find('.success-highlight').removeClass('success-highlight');
        $(evt.target).closest('.similar-student-answers').find('.error-highlight').removeClass('error-highlight');
    });
    $('.problem-grade-input').keydown(0 /* ignored */, function(evt) {
        if (evt.which == 13) {
            setStudentGrade(evt.target);
        }
    });
    $('.problem-grade-input').focusout(0 /* ignored */, function(evt) {
        setStudentGrade(evt.target);
    });
    setTimeout(function() {
        $('#show-correct').trigger('click');
        $('#show-partially-correct').trigger('click');
    }, 50);
}

function studentSubmissionsZip(evt) {

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
            for (file in new_zip.files) { 
                // don't get properties from prototype
                if (new_zip.files.hasOwnProperty(file)) {
                    // extra directory added when zipping files on mac
                    // TODO - check for other things to filter out from zip
                    // files created on other platforms
                    if (file.indexOf("__MACOSX") > -1 || file.indexOf(".DS_Store") > -1) continue;
                    // filter out directories which are part of this list
                    if (new_zip.file(file) == null) continue; 
                    var fileContents = new_zip.file(file).asText();
                    // how is this behaviring differrntly than JSOn.parse()?!?!
                    assignmentData = $.parseJSON(fileContents);
                    allStudentWork.push({filename : file, assignment : assignmentData});
                }
            }
            generateTeacherOverview(allStudentWork);
        }
        r.readAsArrayBuffer(f);
    } else { 
        alert("Failed to load file");
    }
}

// http://www.htmlgoodies.com/beyond/javascript/read-text-files-using-the-javascript-filereader.html
function readSingleFile(evt) {
    //Retrieve the first (and only!) File from the FileList object
    var f = evt.target.files[0]; 

    if (f) {
        var r = new FileReader();
        r.onload = function(e) { 
            var contents = e.target.result;
            openAssignment(contents, f.name);  
        }
        r.readAsText(f);
    } else { 
        alert("Failed to load file");
    }
}

function removeExtension(filename) {
    // remove preceding directory (for when filename comes out of the ZIP directory)
    filename = filename.replace(/[^\/]*\//, "");
    // actually remove extension
    filename = filename.replace(/\.[^/.]+$/, "");
    return filename;
}

function openAssignment(serializedDoc, filename) {
    if (!window.confirm("Discard your current work and open the selected document?")) { 
        return; 
    }
    $('#assignment-container').empty();
    var assignment = JSON.parse(serializedDoc);
    problems = Array();
    newAssignment(removeExtension(filename));
    assignment.problems.forEach(function(problem, index, array) {
        newProblem(false);
        var newProblemWrapper = problems[problems.length - 1];
        newProblemWrapper.setProblemNumber(problem.problemNumber);
        problem.steps.forEach(function(step, stepIndex, stepArray) {
            setTimeout(function() {
                newProblemWrapper.addEquation(step);
            }, 50);
        });
    });
}

function serializeAssignment() {
    var outputProblems = [];
    problems.forEach(function(problem, index, array) {
        outputProblems.push( {
            problemNumber : problem.problemNumber(),
            steps : problem.latexForAllSteps()
        }); 
    });
    // return an object wrapping the problems list, to enable doc-wide settings
    // to be stored eventaully
    return { problems: outputProblems };
}

function saveAssignment() {
    var blob = new Blob([JSON.stringify(serializeAssignment())], {type: "text/plain;charset=utf-8"});
    saveAs(blob, $('#assignment-name-text').val() + '.math'); 
}

function createShortcutKeyHandler(problemWrapper) {
    return function(e) {
        // undo/redo, ctrl-z/ctrl-shift-z
        if ((e.which == 122 || e.which == 90) && e.ctrlKey) {
            if (e.shiftKey) {
                problemWrapper.redoStep();
            }
            else {
                problemWrapper.undoLastStep();
            }
        }

        // 101 is the keycode for he e key, 69 for capital e
        // I think some browsers send capital letters, so just
        // checking for that as well
        if ((e.which == 101 || e.which == 69) && e.ctrlKey) {
            problemWrapper.newStep();
        }
    }
}
