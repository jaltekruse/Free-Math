import React from 'react';
import { saveAs } from 'file-saver';
import './App.css';
import LogoHomeNav from './LogoHomeNav.js';
import { makeBackwardsCompatible, convertToCurrentFormat } from './TeacherInteractiveGrader.js';
import { LightButton } from './Button.js';
import { cloneDeep, genID } from './FreeMath.js';
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

function isProblemNumberMissing(allProblems) {
    var atLeastOneProblemNumberNotSet = false;
    allProblems.forEach(function(problem, index, array) {
        if (problem[PROBLEM_NUMBER].trim() === "") {
            atLeastOneProblemNumberNotSet = true;
        }
    });
    return atLeastOneProblemNumberNotSet;
}

function checkDuplicateProblemNumbers(allProblems) {
    var foundDuplicate = false;
    var allNumbers = {};
    allProblems.forEach(function(problem, index, array) {
        if (allNumbers[problem[PROBLEM_NUMBER].trim()]) {
            foundDuplicate = true;
        }
        allNumbers[problem[PROBLEM_NUMBER].trim()] = true;
    });
    return foundDuplicate;
}


function saveAssignmentValidatingProblemNumbers(studentDoc, handleFinalBlobCallback) {
    window.ga('send', 'event', 'Actions', 'edit', 'Save Assignment');
    var allProblems = studentDoc[PROBLEMS];
    if (isProblemNumberMissing(allProblems)) {
        window.ga('send', 'event', 'Actions', 'edit', 'Attempted save with missing problem numbers');
        window.alert("Cannot save, a problem number is mising.");
        return;
    }
    if (checkDuplicateProblemNumbers(allProblems)) {
        window.ga('send', 'event', 'Actions', 'edit', 'Attempted save with duplicated problem numbers');
        window.alert("Cannot save, two or more problems have the same number.");
        return;
    }
    return saveAssignment(studentDoc, handleFinalBlobCallback);
}

function saveAssignment(studentDoc, handleFinalBlobCallback) {
    var allProblems = studentDoc[PROBLEMS];
    var zip = new JSZip();
    var imagesBeingAddedToZip = 0;
    allProblems = allProblems.map(function(problem, probIndex, array) {
        // make a new object, as this mutates the state, including changing the blob URLs
        // into filenames that will be in the zip file for images, these changes
        // should not be made to the in-memory version
        // BE CAREFUL NOT TO CHANGE THIS, the bug only shows up after a save and then
        // a further edit of the doc without navigating away
        problem = { ...problem };
        // trim the numbers to avoid extra groups while grading
        problem[PROBLEM_NUMBER] = problem[PROBLEM_NUMBER].trim();
        problem[STEPS] = problem[STEPS].map(function(step, stepIndex, steps) {
            if (step[FORMAT] === IMG) {
                // change image to refer to filename that will be generated, will be converted by to objectURL
                // when being read back in
                // simpler solution available in ES5
                var xhr = new XMLHttpRequest();
                xhr.open('GET', step[CONTENT], true);
                var filename = probIndex + "_" + stepIndex + "_img"
                var newStep = {...step};
                newStep[CONTENT] = filename;
                xhr.responseType = 'blob';
                imagesBeingAddedToZip++;
                xhr.onload = function(e) {
                  if (this.status == 200) {
                    var imgBlob = this.response;
                    // imgBlob is now the blob that the object URL pointed to.
                    var fr = new FileReader();
                    fr.addEventListener('load', function() {
                        var data = this.result;
                        zip.file(filename, data);
                        imagesBeingAddedToZip--;
                    });
                    return fr.readAsArrayBuffer(imgBlob);
                  }
                };
                xhr.send();
                return newStep;
            } else {
                return step;
            }
        });
        return problem;
    });
    studentDoc = { ...studentDoc,
                   [PROBLEMS]: allProblems};

    var blob =
        new Blob([
            JSON.stringify({
            ...studentDoc,
            PROBLEMS : removeUndoRedoHistory(
                        makeBackwardsCompatible(
                          studentDoc
                        )
                    )[PROBLEMS]
            })],
        //{type: "application/octet-stream"});
        {type: "text/plain;charset=utf-8"});

    var checkImagesLoaded = function() {
        if (imagesBeingAddedToZip === 0) {

            var fr = new FileReader();
            fr.addEventListener('load', function () {
                var data = this.result;
                zip.file("mainDoc", data);
                var finalBlob = zip.generate({type: 'blob'});
                handleFinalBlobCallback(finalBlob);
                // TODO FIXME - ACTUALLY WAIT FOR ALL IMAGES TO BE LOADED!!!
                //success(this.result);
            }, false);
            fr.readAsArrayBuffer(blob);
        } else {
            // if not all of the images are loaded, check again in 50 milliseconds
            setTimeout(checkImagesLoaded, 50);
        }
    }
    checkImagesLoaded();
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

// can throws exception if thw wrong file type is opened
// successfully opens both the current zip-based format that allows
// saving images as well as the old format that was just json in a text file
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
        // this can throw an exception if it is the wrong file type (like a user opened a PDF)
        var newDoc = openAssignmentOld(
            ab2str(content),
            filename, discardDataWarning);
        return newDoc;
    }
}

function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
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
    newDoc = convertToCurrentFormat(newDoc);
    newDoc[ASSIGNMENT_NAME] = removeExtension(filename);
    return newDoc;
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
                    window.store.dispatch({type : SET_ASSIGNMENT_CONTENT,
                        ASSIGNMENT_NAME : removeExtension(f.name), PROBLEMS : newDoc[PROBLEMS]});
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

class AssignmentEditorMenubar extends React.Component {
    render() {
          var browserIsIOS = false; ///iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
          return (
              <div className="menuBar">
                  <div style={{maxWidth:1024,marginLeft:"auto", marginRight:"auto"}} className="nav">
                      <LogoHomeNav /> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;

                      {!browserIsIOS ?
                      (<div className="navBarElms" style={{float: "right", verticalAlign:"top", lineHeight : 1}}>
                          Filename &nbsp;&nbsp;
                          <input type="text" id="assignment-name-text" size="20"
                                 name="assignment name" value={this.props.value[ASSIGNMENT_NAME]}
                                 onChange={
                                      function(evt) {
                                          window.store.dispatch({type : SET_ASSIGNMENT_NAME, ASSIGNMENT_NAME : evt.target.value});
                                      }}
                          />&nbsp;&nbsp;

                          <LightButton text="Save" onClick={
                              function() { saveAssignmentValidatingProblemNumbers(window.store.getState(), function(finalBlob) {
                                  saveAs(finalBlob, window.store.getState()[ASSIGNMENT_NAME] + '.math');
                              }) }} /> &nbsp;&nbsp;&nbsp;
                      </div>) : null}
                  </div>
              </div>
          );
    }
}

export {AssignmentEditorMenubar as default, removeExtension, saveAssignment, openAssignment};
