import React from 'react';
import createReactClass from 'create-react-class';
import { saveAs } from 'file-saver';
import './App.css';
import LogoHomeNav from './LogoHomeNav.js';
import { makeBackwardsCompatible, convertToCurrentFormat } from './TeacherInteractiveGrader.js';
import { LightButton } from './Button.js';
import JSZip from 'jszip';

var STEPS = 'STEPS';
var CONTENT = "CONTENT";
var IMG = "IMG";
var FORMAT = "FORMAT";

// Assignment properties
var ASSIGNMENT_NAME = 'ASSIGNMENT_NAME';
var PROBLEMS = 'PROBLEMS';
var PROBLEM_NUMBER = 'PROBLEM_NUMBER';

// editing assignmnt mode actions
var SET_ASSIGNMENT_NAME = 'SET_ASSIGNMENT_NAME';
// used to swap out the entire content of the document, for opening
// a document from a file
var SET_ASSIGNMENT_CONTENT = 'SET_ASSIGNMENT_CONTENT';
var UNDO_STACK = 'UNDO_STACK';
var REDO_STACK = 'REDO_STACK';

function validateProblemNumbers(allProblems) {
    var atLeastOneProblemNumberNotSet = false;
    var allNumbers = {};
    allProblems.forEach(function(problem, index, array) {
        if (allNumbers[problem[PROBLEM_NUMBER].trim()]) {
            atLeastOneProblemNumberNotSet = true;
        }
        allNumbers[problem[PROBLEM_NUMBER].trim()] = true;
        if (problem[PROBLEM_NUMBER].trim() === "") {
            atLeastOneProblemNumberNotSet = true;
        }
    });
    return atLeastOneProblemNumberNotSet;
}

/*
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
    var blob = zip.generate({type: 'blob'});
    saveAs(blob, window.store.getState()[ASSIGNMENT_NAME] + '.zip');
}
*/

function saveAssignment() {
    window.ga('send', 'event', 'Actions', 'edit', 'Save Assignment');
    var atLeastOneProblemNumberNotSet = validateProblemNumbers(window.store.getState()[PROBLEMS]);
    if (atLeastOneProblemNumberNotSet) {
        window.ga('send', 'event', 'Actions', 'edit', 'Attempted save with missing problem numbers');
        window.alert("Cannot save, a problem number is mising or two or more " +
                     "problems have the same number.");
        return;
    }
    var allProblems = window.store.getState()[PROBLEMS];
    var zip = new JSZip();
    allProblems = allProblems.map(function(problem, probIndex, array) {
        // trim the numbers to avoid extra groups while grading
        problem[PROBLEM_NUMBER] = problem[PROBLEM_NUMBER].trim();
        problem[STEPS] = problem[STEPS].map(function(step, stepIndex, steps) {
            if (step[FORMAT] === IMG) {
                // change image to refer to filename that will be generated, will be converted by to objectURL
                // when being read back in
                console.log("add image");
                // simpler solution available in ES5
                var xhr = new XMLHttpRequest();
                xhr.open('GET', step[CONTENT], true);
                var filename = probIndex + "_" + stepIndex + "_img"
                step[CONTENT] = filename;
                xhr.responseType = 'blob';
                xhr.onload = function(e) {
                  if (this.status == 200) {
                    var imgBlob = this.response;
                    // imgBlob is now the blob that the object URL pointed to.
                    var fr = new FileReader();
                    fr.addEventListener('load', function() {
                        var data = this.result;
                        zip.file(filename, data);
                    });
                    return fr.readAsArrayBuffer(imgBlob);
                  }
                };
                xhr.send();
                return step;
            } else {
                return step;
            }
        });
        console.log("modified problem:");
        console.log(problem);
        return problem;
    });
    var overallState = window.store.getState();
    overallState[PROBLEMS] = allProblems;
    var blob =
        new Blob([
            JSON.stringify({
            PROBLEMS : removeUndoRedoHistory(
                        makeBackwardsCompatible(
                           overallState 
                        )
                    )[PROBLEMS]
            })],
        //{type: "application/octet-stream"});
        {type: "text/plain;charset=utf-8"});

        var fr = new FileReader();
        fr.addEventListener('load', function () {
            var data = this.result;
            zip.file("mainDoc", data);
            console.log("set timeout");
            setTimeout(function() { 
                var finalBlob = zip.generate({type: 'blob'});
                saveAs(finalBlob, window.store.getState()[ASSIGNMENT_NAME] + '.math');
            }, 2000);
            // TODO FIXME - ACTUALLY WAIT FOR ALL IMAGES TO BE LOADED!!!
            //success(this.result);
        }, false);
        return fr.readAsArrayBuffer(blob);
}

function saveAssignmentOld() {
    window.ga('send', 'event', 'Actions', 'edit', 'Save Assignment');
    var atLeastOneProblemNumberNotSet = validateProblemNumbers(window.store.getState()[PROBLEMS]);
    if (atLeastOneProblemNumberNotSet) {
        window.ga('send', 'event', 'Actions', 'edit', 'Attempted save with missing problem numbers');
        window.alert("Cannot save, a problem number is mising or two or more " +
                     "problems have the same number.");
        return;
    }
    var allProblems = window.store.getState()[PROBLEMS];
    allProblems.forEach(function(problem, index, array) {
        // trim the numbers to avoid extra groups while grading
        problem[PROBLEM_NUMBER] = problem[PROBLEM_NUMBER].trim();
    });
    var overallState = window.store.getState();
    overallState[PROBLEMS] = allProblems;
    var blob =
        new Blob([
            JSON.stringify({
            PROBLEMS : removeUndoRedoHistory(
                        makeBackwardsCompatible(
                           overallState 
                        )
                    )[PROBLEMS]
            })],
        {type: "application/octet-stream"});
        //{type: "text/plain;charset=utf-8"});
    saveAs(blob, window.store.getState()[ASSIGNMENT_NAME] + '.math');
}

function removeUndoRedoHistory(globalState) {
    globalState[PROBLEMS].forEach(function (problem) {
        problem[UNDO_STACK] = [];
        problem[REDO_STACK] = [];
    });
    return globalState;
}

function removeExtension(filename) {
    // remove preceding directory (for when filename comes out of the ZIP directory)
    // inside of character class slash is not a special character,
    // this is highlighted incorrectly in some editors, but the escaping this slash
    // fires the no-useless-escape es-lint rule
    filename = filename.replace(/[^/]*\//, "");
    // actually remove extension
    filename = filename.replace(/\.[^/.]+$/, "");
    return filename;
}

/*
// open zip file full of student assignments for grading
function studentSubmissionsZip(evt, onFailure = function() {}) {
    // reset scroll location from previous view of student docs
    window.location.hash = '';
    var f = evt.target.files[0];

    if (f) {
        var r = new FileReader();
        r.onload = function(e) {
            var content = e.target.result;
            loadStudentDocsFromZip(content, f.name, onFailure);
        }
        r.readAsArrayBuffer(f);
    } else {
        window.ga('send', 'exception', { 'exDescription' : 'error opening docs to grade' } );
        alert("Failed to load file");
        onFailure();
    }
}
*/

//function loadStudentDocsFromZip(content, filename, onFailure = function() {}, googleId = false) {
function openAssignment(content, filename, discardDataWarning) {
    var new_zip = new JSZip();
    try {
        new_zip.load(content);

        var allStudentWork = [];

        var failureCount = 0;
        var badFiles = [];
        var images = {};
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
                //if (file.indexOf(".math", file.length - ".math".length) === -1) continue;
                // filter out directories which are part of this list
                if (new_zip.file(file) === null) continue;
                try {
                    if (file === "mainDoc") {
                        var fileContents = new_zip.file(file).asText();
                        var newDoc = JSON.parse(fileContents);
                        // compatibility for old files, need to convert the old proerty names as
                        // well as add the LAST_SHOWN_STEP
                        newDoc = convertToCurrentFormat(newDoc);
                    } else {
                        // should be an image
                        var fileContents = new_zip.file(file).asArrayBuffer();
                        images[file] = window.URL.createObjectURL(new Blob([fileContents]));
                    }
                } catch (e) {
                    console.log("failed to parse file: " + file);
                    console.log(e);
                }
            }
        }

        newDoc[PROBLEMS] = newDoc[PROBLEMS].map(function(problem, probIndex, array) {
            problem[STEPS] = problem[STEPS].map(function(step, stepIndex, steps) {
                if (step[FORMAT] === IMG) {
                    step[CONTENT] = images[probIndex + "_" + stepIndex + "_img"];
                }
                return step;
            });
            return problem;
        });

        newDoc[ASSIGNMENT_NAME] = removeExtension(filename);
        return newDoc;

    } catch (e) {
        // TODO - try to open a single student doc
        console.log(e);
        alert("Error opening file, you should be opening a zip file full of Free Math documents.");
        window.ga('send', 'exception', { 'exDescription' : 'error opening zip full of docs to grade' } );
        //onFailure();
        return;
    }
}


// TODO - consider giving legacy docs an ID upon opening, allows auto-save to work properly when
// opening older docs
function openAssignmentOld(serializedDoc, filename, discardDataWarning) {
    // this is now handled at a higher level, this is mostly triggered by onChange events of "file" input elements
    // if the user selects "cancel", I want them to be able to try re-opening again. If they pick the same file I
    // won't get on onChange event without resetting the value, and here I don't have a reference to the DOM element
    // to reset its value
    //if (discardDataWarning && !window.confirm("Discard your current work and open the selected document?")) {
    //    return;
    //}

    var newDoc = JSON.parse(serializedDoc);
    // compatibility for old files, need to convert the old proerty names as
    // well as add the LAST_SHOWN_STEP
    newDoc = convertToCurrentFormat(newDoc);
    window.store.dispatch({type : SET_ASSIGNMENT_CONTENT, PROBLEMS : newDoc[PROBLEMS]});
    window.store.dispatch({type : SET_ASSIGNMENT_NAME, ASSIGNMENT_NAME : removeExtension(filename)});
}

// read a file from the local disk, pass an onChange event from a "file" input type
// http://www.htmlgoodies.com/beyond/javascript/read-text-files-using-the-javascript-filereader.html
export function readSingleFile(evt, discardDataWarning) {
    //Retrieve the first (and only!) File from the FileList object
    var f = evt.target.files[0];

    if (f) {
            var r = new FileReader();
            r.onload = function(e) {
                try {
                    var contents = e.target.result;
                    var newDoc = openAssignment(contents, f.name, discardDataWarning);
                    window.store.dispatch({type : SET_ASSIGNMENT_CONTENT, PROBLEMS : newDoc[PROBLEMS]});
                    window.store.dispatch({type : SET_ASSIGNMENT_NAME, ASSIGNMENT_NAME : newDoc[ASSIGNMENT_NAME]});
                } catch (e) {
                    console.log(e);
                    window.ga('send', 'exception', { 'exDescription' : 'error opening student file' } );
                    alert("Error reading the file, Free Math can only read files with a .math extension that it creates. If you saved this file with Free Math please send it to developers@freemathapp.org to allow us to debug the issue.");
                }
        }
        r.readAsArrayBuffer(f);
    } else {
        alert("Failed to load file");
    }
}

var AssignmentEditorMenubar = createReactClass({
  render: function() {
        var browserIsIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream; 
        return (
            <div className="menuBar">
                <div style={{maxWidth:1024,marginLeft:"auto", marginRight:"auto"}} className="nav">
                    <LogoHomeNav /> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    
                    {!browserIsIOS ? 
                    (<div className="navBarElms" style={{float: "right", verticalAlign:"top", lineHeight : 1}}>
                        Filename &nbsp;&nbsp;
                        <input type="text" id="assignment-name-text" size="25"
                               name="assignment name" value={this.props.value[ASSIGNMENT_NAME]}
                               onChange={
                                    function(evt) {
                                        window.store.dispatch({type : SET_ASSIGNMENT_NAME, ASSIGNMENT_NAME : evt.target.value});
                                    }}
                        />&nbsp;&nbsp;

                        <LightButton text="Save" onClick={
                            function() { saveAssignment() }} /> &nbsp;&nbsp;&nbsp;
                    </div>) : null}
                </div>
            </div>
        );
  }
});

export {AssignmentEditorMenubar as default, removeExtension, openAssignment, validateProblemNumbers};
