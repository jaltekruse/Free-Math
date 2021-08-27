import React from 'react';
import ReactDOM from 'react-dom';
import { saveAs } from 'file-saver';
import './App.css';
import LogoHomeNav from './LogoHomeNav.js';
import { makeBackwardsCompatible, convertToCurrentFormat } from './TeacherInteractiveGrader.js';
import Button from './Button.js';
import { LightButton, HtmlButton } from './Button.js';
import FreeMathModal from './Modal.js';
import { CloseButton } from './Button.js';
import { cloneDeep, getPersistentState, getEphemeralState, saveToLocalStorageOrDrive } from './FreeMath.js';
import { listGoogleClassroomAssignments,
         listGoogleClassroomSubmissions,
         listGoogleClassroomCourses,
         createFileWithBinaryContent,
         modifyGoogeClassroomSubmission,
         turnInToClassroom,
         doOnceGoogleAuthLoads } from './GoogleApi.js';
import JSZip from 'jszip';

var STEPS = 'STEPS';
var CONTENT = "CONTENT";
var IMG = "IMG";
var FORMAT = "FORMAT";
var FABRIC_SRC = 'FABRIC_SRC';
var backgroundImage = 'backgroundImage';
var src = 'src';

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

var SET_GOOGLE_CLASS_LIST = 'SET_GOOGLE_CLASS_LIST';
var GOOGLE_CLASS_LIST = 'GOOGLE_CLASS_LIST';
var GOOGLE_SELECTED_CLASS = 'GOOGLE_SELECTED_CLASS';
var GOOGLE_ASSIGNMENT_LIST = 'GOOGLE_ASSIGNMENT_LIST';
var GOOGLE_SELECTED_ASSIGNMENT = 'GOOGLE_SELECTED_ASSIGNMENT';
var GOOGLE_SELECTED_CLASS_NAME = 'GOOGLE_SELECTED_CLASS_NAME';
var GOOGLE_SELECTED_ASSIGNMENT_NAME = 'GOOGLE_SELECTED_ASSIGNMENT_NAME';
var GOOGLE_SUBMISSION_ID = 'GOOGLE_SUBMISSION_ID';

var GOOGLE_ID = 'GOOGLE_ID';
var SET_GOOGLE_ID = 'SET_GOOGLE_ID';
// state for google drive auto-save
// action
var SET_GOOGLE_DRIVE_STATE = 'SET_GOOGLE_DRIVE_STATE';
// Property name and possible values
var GOOGLE_DRIVE_STATE = 'GOOGLE_DRIVE_STATE';
var SAVING = 'SAVING';
var ALL_SAVED = 'ALL_SAVED';
var DIRTY_WORKING_COPY = 'DIRTY_WORKING_COPY';
var ERROR_DOC_TOO_BIG = 'ERROR_DOC_TOO_BIG';

var PENDING_SAVES = 'PENDING_SAVES';

var CANNOT_EDIT_SUBMITTED_ERR_MSG = "You cannot edit assignments that are submitted, " +
                                      "you need to unsubmit over in Google Classroom first.";

var MODIFY_GLOBAL_WAITING_MSG = 'MODIFY_GLOBAL_WAITING_MSG';
var GLOBAL_WAITING_MSG = 'GLOBAL_WAITING_MSG';

var INSTRUCTIONS_HIDDEN_IN_ZIP_FILE = "You need to open .math files using freemathapp.org";

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

function checkForDemoProblems(allProblems) {
    var atLeastOneDemoProblem = false;
    allProblems.forEach(function(problem, index, array) {
        if (problem[PROBLEM_NUMBER].toLowerCase().indexOf("demo") !== -1) {
            atLeastOneDemoProblem = true;
        }
    });
    return atLeastOneDemoProblem;
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
    if (checkForDemoProblems(allProblems)) {
        window.ga('send', 'event', 'Actions', 'edit', 'Attempted save with demo problems');
        window.alert("Your document contains problems with the word demo in their name, " +
                     "you need to rename or remove them before saving.");
        return;
    }
    return saveAssignment(studentDoc, handleFinalBlobCallback);
}

function saveAssignment(studentDoc, handleFinalBlobCallback) {

    var allProblems = studentDoc[PROBLEMS];
    allProblems = allProblems.map(function(problem, probIndex, array) {
        // make a new object, as this mutates the state
        // BE CAREFUL NOT TO CHANGE THIS, the bug only shows up after a save and then
        // a further edit of the doc without navigating away
        problem = { ...problem };
        // trim the numbers to avoid extra groups while grading
        problem[PROBLEM_NUMBER] = problem[PROBLEM_NUMBER].trim();
        return problem;
    });

    studentDoc = { ...studentDoc,
                   [PROBLEMS]: allProblems};

    // old format of saving just JSON is now completely disabled
    // for a time a doc without any images would be saved in it still
    // for compatibility between the beta site and production.
    // the zip format is better because if they open it in google drive
    // or another zip viewer it has an extra file in it now to direct
    // them to freemathapp.org to open it
    saveAssignmentWithImages(studentDoc, handleFinalBlobCallback);
}

function saveAssignmentWithImages(studentDoc, handleFinalBlobCallback) {
    var allProblems = studentDoc[PROBLEMS];
    var zip = new JSZip();
    var imagesBeingAddedToZip = 0;

    const saveImageIntoZip = function(img, filename) {
        // change image to refer to filename that will be generated, will be converted by to objectURL
        // when being read back in
        // simpler solution available in ES5
        var xhr = new XMLHttpRequest();
        xhr.open('GET', img, true);
        xhr.responseType = 'blob';
        imagesBeingAddedToZip++;
        xhr.onload = function(e) {
          if (this.status === 200) {
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
    }
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
            if (step[FORMAT] === IMG && step[CONTENT] !== '') {
                var filename = probIndex + "_" + stepIndex + "_img"
                var newStep = {...step};
                newStep[CONTENT] = filename;
                saveImageIntoZip(step[CONTENT], filename);
                var fabricSrc = newStep[FABRIC_SRC];
                if (fabricSrc && fabricSrc[backgroundImage][src]) {
                    var dataUrl = fabricSrc[backgroundImage][src];
                    var filename = probIndex + "_" + stepIndex + "_background_img";
                    saveImageIntoZip(dataUrl, filename);
                    newStep[FABRIC_SRC] = cloneDeep(fabricSrc);
                    newStep[FABRIC_SRC][backgroundImage][src] = filename;
                }
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
        {type: "application/zip"});

    var checkImagesLoaded = function() {
        if (imagesBeingAddedToZip === 0) {

            var fr = new FileReader();
            fr.addEventListener('load', function () {
                var data = this.result;
                zip.file("mainDoc", data);
                zip.file(INSTRUCTIONS_HIDDEN_IN_ZIP_FILE, "Visit the website freemathapp.org to open this file.");
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
function openAssignment(content, filename, driveFileId = false) {
    var new_zip = new JSZip();
    try {
        new_zip.load(content);

        // this will be set when we find the file in the zip called mainDoc
        let newDoc;
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
                        let fileContents = new_zip.file(file).asText();
                        newDoc = JSON.parse(fileContents);
                        // compatibility for old files, need to convert the old proerty names as
                        // well as add the LAST_SHOWN_STEP
                        newDoc = convertToCurrentFormat(newDoc);
                    } else if (file === INSTRUCTIONS_HIDDEN_IN_ZIP_FILE) {
                        // this is just used to redirect users to the site if they open with a zip viewer
                    } else {
                        // should be an image
                        let fileContents = new_zip.file(file).asArrayBuffer();
                        images[file] = window.URL.createObjectURL(new Blob([fileContents]));
                    }
                } catch (e) {
                    console.log("failed to parse file: " + file);
                    console.log(e);
                }
            }
        }

        //console.log(images);
        newDoc[PROBLEMS] = newDoc[PROBLEMS].map(function(problem, probIndex, array) {
            problem[STEPS] = problem[STEPS].map(function(step, stepIndex, steps) {
                if (step[FORMAT] === IMG) {
                    step[CONTENT] = images[probIndex + "_" + stepIndex + "_img"];
                    //console.log(step[CONTENT]);
                    // if there was no image set, set the step to the state where students can pick an image
                    if (!step[CONTENT]) step[CONTENT] = '';

                    var fabricSrc = step[FABRIC_SRC];
                    if (fabricSrc && fabricSrc[backgroundImage][src]) {
                        var filename = probIndex + "_" + stepIndex + "_background_img";
                        //console.log(filename);
                        step[FABRIC_SRC][backgroundImage][src] = images[filename];
                    }
                }
                return step;
            });
            return problem;
        });

        newDoc[ASSIGNMENT_NAME] = removeExtension(filename);
        return newDoc;

    } catch (e) {
        console.log(e);
        console.log(filename);
        // this can throw an exception if it is the wrong file type (like a user opened a PDF)
        let newDoc = openAssignmentOld(
            // opening from a local file produces an arraybuffer for legacy plain text docs
            // google drive provides these as strings immediately in the response
            typeof content === 'string' ? content : ab2str(content),
            filename, driveFileId);
        return newDoc;
    }
}

function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}


// TODO - consider giving legacy docs an ID upon opening, allows auto-save to work properly when
// opening older docs
function openAssignmentOld(serializedDoc, filename, driveFileId = false) {
    var newDoc = JSON.parse(serializedDoc);
    newDoc = convertToCurrentFormat(newDoc);
    newDoc[ASSIGNMENT_NAME] = removeExtension(filename);
    return newDoc;
}

// read a file from the local disk, pass an onChange event from a "file" input type
// http://www.htmlgoodies.com/beyond/javascript/read-text-files-using-the-javascript-filereader.html
export function readSingleFile(evt, driveFileId = false) {
    //Retrieve the first (and only!) File from the FileList object
    var f = evt.target.files[0];

    if (f) {
            var r = new FileReader();
            r.onload = function(e) {
                try {
                    var contents = e.target.result;
                    var newDoc = openAssignment(contents, f.name, driveFileId);

                    window.store.dispatch({type : SET_ASSIGNMENT_CONTENT,
                        PROBLEMS : newDoc[PROBLEMS],
                        ASSIGNMENT_NAME : removeExtension(f.name)});

                    window.ephemeralStore.dispatch(
                        {type : SET_GOOGLE_ID, GOOGLE_ID: driveFileId});
                    window.ephemeralStore.dispatch(
                        {type : SET_GOOGLE_DRIVE_STATE, GOOGLE_DRIVE_STATE : ALL_SAVED});
                } catch (e) {
                    console.log(e);
                    window.ga('send', 'exception', { 'exDescription' : 'error opening student file' } );
                    alert("Error reading the file, Free Math can only read files with a .math extension that it creates.\n\n" +
                        "Your browser might be holding on to an old version of the site, try a hard refresh with " +
                        "Ctrl-Shift-R (Windows/Chromebooks) or Command-Shift-R (Mac) to see if that fixes it.\n\n" +
                        "If that doesn't fix it, and you saved this file with Free Math please send it to " +
                        "developers@freemathapp.org to allow us to debug the issue.");
                }
        }
        r.readAsArrayBuffer(f);
    } else {
        alert("Failed to load file");
    }
}

function submitAssignment(submission, selectedClass, selectedAssignment, googleId) {
    // TODO - make this access safe, currently only showing ASSIGNMENT types in the list
    // so only submissions with a property of assignmentSubmission should get to here, but
    // could be more defensive
    let attachments = submission.assignmentSubmission.attachments;
    // TODO - is this a list if nothing is submitted yet?
    if ( typeof attachments !== 'undefined' &&
          attachments.length > 0 ) {
        if (attachments[0].driveFile && googleId === attachments[0].driveFile.id) {
            if (window.confirm('Are you done working and would like to turn in the assignment?')) {
                turnInToClassroomWithSpinner(getEphemeralState());
                // clear the class list to stop showing the modal
                // but don't clear the class/assignments selected from the state
                // these are used later to allow turning in
                window.ephemeralStore.dispatch({type : SET_GOOGLE_CLASS_LIST,
                    GOOGLE_CLASS_LIST : undefined});
            } else {
                window.ephemeralStore.dispatch({type : SET_GOOGLE_CLASS_LIST,
                     GOOGLE_CLASS_LIST : false
                    });
            }
            return;
        }
        // in the case of error also close the modal
        // and make them select a different class/assignment
        window.ephemeralStore.dispatch({type : SET_GOOGLE_CLASS_LIST,
             GOOGLE_CLASS_LIST : false
            });
        alert("You have already attached a file to this assignment, Free Math " +
              "assignments should only have a single Free Math file submitted.\n\n" +
              "You can either open the file you already attched out of Drive " +
              "using the button on the homepage, or go to Google Classroom to remove " +
              "the currently attached file to allow saving this file as the new attachment.");
        return;
    }

    if (submission.state === "TURNED_IN") {
        alert(CANNOT_EDIT_SUBMITTED_ERR_MSG);
        return;
    }

    window.ephemeralStore.dispatch(
        { type : MODIFY_GLOBAL_WAITING_MSG,
          GLOBAL_WAITING_MSG: "Submitting to Google Classroom..."});
    modifyGoogeClassroomSubmission(
        selectedClass,
        selectedAssignment,
        submission.id, googleId,
        function(response) {
            console.log(response);

            window.ephemeralStore.dispatch(
                { type : MODIFY_GLOBAL_WAITING_MSG,
                  GLOBAL_WAITING_MSG: false});
            if (window.confirm('Assignment successfully saved to Google Classroom.\n\n' +
                               'Are you done working and would like to turn it in?')) {
                turnInToClassroomWithSpinner(getEphemeralState());
                // clear the class list to stop showing the modal
                // but don't clear the class/assignments selected from the state
                // these are used later to allow turning in
                window.ephemeralStore.dispatch({type : SET_GOOGLE_CLASS_LIST,
                    GOOGLE_CLASS_LIST : undefined});
            }
        },
        function(errorXhr) {
            window.ephemeralStore.dispatch(
                { type : MODIFY_GLOBAL_WAITING_MSG,
                  GLOBAL_WAITING_MSG: false});
            if (errorXhr.status === 403) {
                alert('This assignment was not created by your teacher using Free Math, ' +
                      'and google only allows 3rd party apps like Free Math ' +
                      'to edit assignments that they create.\n\n' +
                      'Your document has been saved in your Google Drive, you will ' +
                      'need to go to Google Classroom and attach the file to the ' +
                      'assignment yourself.');
            } else {
                alert('Save Failed.');
            }

            // in the case of error also close the modal
            // and make them select a different class/assignment
            window.ephemeralStore.dispatch({type : SET_GOOGLE_CLASS_LIST,
                GOOGLE_CLASS_LIST : false});
        }
    );
}

class GoogleClassroomSubmissionSelector extends React.Component {
    componentDidMount() {
    }

    listClasses = () => {
        listGoogleClassroomCourses(function(response) {
            if ( ! response.courses || response.courses.length === 0) {
                alert("You are not enrolled in any Google Classroom courses.");
                // close the modal
                window.ephemeralStore.dispatch({type : SET_GOOGLE_CLASS_LIST,
                    GOOGLE_CLASS_LIST : false});
                return;
            }
            if (response.courses.length === 1) {
                var classList = response;
                var classInfo = response.courses[0];
                listGoogleClassroomAssignments(classInfo.id,
                    function(response) {
                        window.ephemeralStore.dispatch(
                            { type : SET_GOOGLE_CLASS_LIST,
                              GOOGLE_CLASS_LIST :
                                classList,
                              GOOGLE_SELECTED_CLASS : classInfo.id,
                              GOOGLE_SELECTED_CLASS_NAME : classInfo.name,
                              GOOGLE_ASSIGNMENT_LIST : response
                            });
                    }
                );
            } else {
                window.ephemeralStore.dispatch({type : SET_GOOGLE_CLASS_LIST,
                    GOOGLE_CLASS_LIST : response});
            }
        });
    };

    render() {
        var rootState = this.props.value;
        var selectSubmissionCallback = this.props.selectSubmissionCallback;
        var selectAssignmentCallback = this.props.selectAssignmentCallback;
        // this is an optional callback passed in to change the redux state in a way that will
        // cause the showModal to become false
        // If this is provided you also want a custom showModal to be passed
        // NOTE - this is not a callback for reacting to a close event
        var closeModal = this.props.closeModal ?
                            this.props.closeModal :
                            function() {
                                window.ephemeralStore.dispatch(
                                    { type : SET_GOOGLE_CLASS_LIST,
                                      GOOGLE_CLASS_LIST : false});
                            };

        var showModal = this.props.showModal ?
                            this.props.showModal :
                            function() {
                                return rootState[GOOGLE_CLASS_LIST];
                            };

        const courseList = function() {
            return (
                <div>
                <div>Pick a class</div>
                <div style={{overflow:"auto", maxHeight: "80vh", minHeight:"400px", minWidth:"500px"}}>
                {rootState[GOOGLE_CLASS_LIST].courses
                    .map(function(classInfo, index) {
                        return (
                            <span key={classInfo.id}>
                            <Button text={
                                    classInfo.name + " \u00A0  Section: "
                                     + (classInfo.section === undefined ? "None" : classInfo.section) +
                                     " \u00A0 Room: "
                                     + (classInfo.room === undefined ? "None" : classInfo.room)
                                    }
                                onClick={function() {
                                    listGoogleClassroomAssignments(classInfo.id,
                                        function(response) {

                                        window.ephemeralStore.dispatch(
                                            { type : SET_GOOGLE_CLASS_LIST,
                                              GOOGLE_CLASS_LIST :
                                                rootState[GOOGLE_CLASS_LIST],
                                              GOOGLE_SELECTED_CLASS : classInfo.id,
                                              GOOGLE_SELECTED_CLASS_NAME : classInfo.name,
                                              GOOGLE_ASSIGNMENT_LIST : response
                                            });
                                    });
                                    // load docs for this class id
                                    // classInfo.id
                                }} /><br /></span>
                        )
                    })
                }
                </div>
            </div>)
        };

        const listSubmissionsSubmitIfOnlyOne = function(assignment) {
            listGoogleClassroomSubmissions(
                rootState[GOOGLE_SELECTED_CLASS],
                assignment.id,
                function(response) {
                    console.log(response);
                    if (! response.studentSubmissions) {
                        alert("It looks like there are no students in this class yet.");
                        return;
                    }
                    if (response.studentSubmissions.length === 1) {
                        var submission = response.studentSubmissions[0];

                        window.ephemeralStore.dispatch(
                            { type : SET_GOOGLE_CLASS_LIST,
                              GOOGLE_CLASS_LIST :
                                rootState[GOOGLE_CLASS_LIST],
                              GOOGLE_SELECTED_CLASS : rootState[GOOGLE_SELECTED_CLASS],
                              GOOGLE_SELECTED_CLASS_NAME : rootState[GOOGLE_SELECTED_CLASS_NAME],
                              GOOGLE_SELECTED_ASSIGNMENT : assignment.id,
                              GOOGLE_SUBMISSION_ID : submission.id
                            });

                        selectSubmissionCallback(submission,
                                        rootState[GOOGLE_SELECTED_CLASS],
                                        assignment.id,
                                        rootState[GOOGLE_ID]);
                    } else {
                        alert("Multiple submissions detected, this generally means you are an " +
                              "instructor for this class and cannot submit homework.");
                        closeModal();
                    }
            });
        }

        const assignmentList = function() {
            return (
                <div>
                    <div>
                        Pick an assignment - {rootState[GOOGLE_SELECTED_CLASS_NAME]}
                    </div>
                    <div style={{overflow:"auto", maxHeight: "80vh", minHeight:"400px", minWidth:"500px"}}>
                        {rootState[GOOGLE_ASSIGNMENT_LIST].courseWork
                            .map(function(assignment, index) {
                                return (
                                    <span>
                                    <Button text={assignment.title}
                                        onClick={
                                            function() {
                                                if (selectAssignmentCallback) {
                                                    selectAssignmentCallback(assignment);
                                                } else {
                                                    listSubmissionsSubmitIfOnlyOne(assignment);
                                                }
                                            }
                                        }
                                    /><br /></span>)
                            })
                        }
                    </div>
                </div>
            )
        };

        return (
            <FreeMathModal
                showModal={showModal()}
                content={(
                    <div style={{alignItems: "center"}}>
                        <CloseButton type="submit" text="&#10005;" title="Close"
                                     onClick={
                                        function() {
                                            closeModal();
                                        }
                                     }
                        />
                        { (rootState[GOOGLE_CLASS_LIST] === undefined ||
                            rootState[GOOGLE_SELECTED_CLASS] !== undefined ||
                            rootState[GOOGLE_SELECTED_ASSIGNMENT] !== undefined) ? null :
                            courseList()
                        }
                        {(rootState[GOOGLE_SELECTED_CLASS] === undefined ||
                            rootState[GOOGLE_SELECTED_ASSIGNMENT] !== undefined)? null :
                            assignmentList()
                        }
                    </div>)}
                />
        );
    }
}

function turnInToClassroomWithSpinner(ephemeralState) {
    window.ephemeralStore.dispatch(
        { type : MODIFY_GLOBAL_WAITING_MSG,
          GLOBAL_WAITING_MSG: "Turning in assignment..."});
    turnInToClassroom(
        ephemeralState[GOOGLE_SELECTED_CLASS],
        ephemeralState[GOOGLE_SELECTED_ASSIGNMENT],
        ephemeralState[GOOGLE_SUBMISSION_ID],
        function(response) {
            alert('Successfully turned in.');
            window.ephemeralStore.dispatch(
                { type : MODIFY_GLOBAL_WAITING_MSG,
                  GLOBAL_WAITING_MSG: false});
        },
        function(errorXhr) {
            alert('Turn in request failed, you may need to turn in using Google Classroom itself.');
            window.ephemeralStore.dispatch(
                { type : MODIFY_GLOBAL_WAITING_MSG,
                  GLOBAL_WAITING_MSG: false});
        });
}

class AssignmentEditorMenubar extends React.Component {
    componentDidMount() {
        const attachClickHandlers = function() {
            // componentDidMount is called after all the child components have been mounted,
            // but before any parent components have been mounted.
            // https://stackoverflow.com/questions/49887433/dom-isnt-ready-in-time-after-componentdidmount-in-react
            // put a small delay to hopefully let the parent mount, also putting a setTimeout at all will free up
            // the main thread to allow a repaint

            setTimeout(function() {
                // TODO - problem with onSuccessCallback when canceling and re-opening dialog to submit
                // might have been manifesting a different bug leaving out a callback in functions doing
                // the actual requests to google in index.html
                const saveCallback = function(onSuccessCallback = function() {}) {
                    // because the same property is used for drive save state, or localStorage save state,
                    // this doc is currently marked "ALL_SAVED", but reports to user as all saved to browser
                    // because there is no GOOGLE_ID
                    // without this code, as soon as we get a google ID it would report as all saved to Drive
                    // before it is actually saved
                    window.ephemeralStore.dispatch(
                        {type : SET_GOOGLE_DRIVE_STATE, GOOGLE_DRIVE_STATE : SAVING});

                    var containsAnImage = false;
                    var imageCount = 0;
                    var allProblems = getPersistentState()[PROBLEMS];
                    allProblems = allProblems.forEach(function(problem, probIndex, array) {
                        problem[STEPS].forEach(function(step, stepIndex, steps) {
                            if (step[FORMAT] === IMG) {
                                containsAnImage = true;
                                imageCount++;
                            }
                        });
                    });

                    if (true || containsAnImage) {
                        window.ga('send', 'event', 'Actions', 'save',
                            'Save with images', imageCount);
                    }
                    saveAssignmentValidatingProblemNumbers(getPersistentState(), function(assignment) {

                        var googleId = this.props.value[GOOGLE_ID];
                        if (googleId) {
                            saveToLocalStorageOrDrive(0, onSuccessCallback);
                        } else {
                            createFileWithBinaryContent(
                                this.props.value[ASSIGNMENT_NAME] + '.math',
                                assignment,
                                'application/zip',
                                function(response) {
                                    window.ephemeralStore.dispatch(
                                        { type : SET_GOOGLE_DRIVE_STATE,
                                            GOOGLE_DRIVE_STATE : ALL_SAVED});
                                    window.ephemeralStore.dispatch(
                                        {type : SET_GOOGLE_ID, GOOGLE_ID: response.id});
                                    onSuccessCallback();
                                },
                                function(response) {
                                    if (response.status === 403) {
                                        alert(CANNOT_EDIT_SUBMITTED_ERR_MSG);
                                    } else {
                                        alert("Error saving to Google Drive");
                                    }
                                    window.ephemeralStore.dispatch(
                                        { type : SET_GOOGLE_DRIVE_STATE,
                                            GOOGLE_DRIVE_STATE : DIRTY_WORKING_COPY});
                                }
                            );
                        }
                    }.bind(this));
                }.bind(this);
                const saveToDrive = ReactDOM.findDOMNode(this.refs.saveToDrive)
                window.gapi.auth2.getAuthInstance().attachClickHandler(saveToDrive, {},
                    function(){
                        window.ga('send', 'event', 'Actions', 'edit', 'Explicit save to drive.');
                        saveCallback(function(){ alert("Successfully saved to drive.")});
                    },
                    function(error){
                        //alert("Error contacting google services\n\n" + JSON.stringify(error, undefined, 2));
                        if (error.error && error.error === "popup_closed_by_user") {
                            alert("If the sign-in popup window just closed itself quickly your browser may have 3rd party cookies disabled, " +
                                  "you need to enable them to use the google integration.\n\n" +
                                  "On Chrome, look for an eye with a line through it in the address bar.\n\n" +
                                  "While Free Math doesn't have ads, some ad blockers also have this behavior and " +
                                  "may need to be disabled.");
                        }
                        console.log(JSON.stringify(error, undefined, 2));
                        window.ga('send', 'exception', { 'exDescription' : 'google login failure: ' + JSON.stringify(error, undefined, 2)} );
                    });

                const submitToClassroomCallback = function() {
                    // save the file to Drive first
                    saveCallback(function() {
                        const ephemeralState = getEphemeralState();
                        if (ephemeralState[GOOGLE_SELECTED_CLASS] &&
                            ephemeralState[GOOGLE_SELECTED_ASSIGNMENT] &&
                            ephemeralState[GOOGLE_SUBMISSION_ID]) {
                                if (window.confirm('Are you done working and would like to turn in the assignment?')) {
                                    turnInToClassroomWithSpinner(ephemeralState);
                                }
                        } else {
                            this.refs.submissionSelector.listClasses();
                        }
                    }.bind(this));
                }.bind(this);

                const submitToClassroom = ReactDOM.findDOMNode(this.refs.submitToClassroom)
                window.gapi.auth2.getAuthInstance().attachClickHandler(submitToClassroom, {},
                    submitToClassroomCallback,
                    function(error){
                        //alert("Error contacting google services\n\n" + JSON.stringify(error, undefined, 2));
                        if (error.error && error.error === "popup_closed_by_user") {
                            alert("If the sign-in popup window just closed itself quickly your browser may have 3rd party cookies disabled, " +
                                  "you need to enable them to use the google integration.\n\n" +
                                  "On Chrome, look for an eye with a line through it in the address bar.\n\n" +
                                  "While Free Math doesn't have ads, some ad blockers also have this behavior and " +
                                  "may need to be disabled.");
                        }
                        console.log(JSON.stringify(error, undefined, 2));
                        window.ga('send', 'exception', { 'exDescription' : 'google login failure: ' + JSON.stringify(error, undefined, 2)} );
                    });
            }.bind(this), 250);
        }.bind(this);

        doOnceGoogleAuthLoads(10, attachClickHandlers);
    }

    render() {
        var browserIsIOS = false; ///iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        var saveStateMsg = '';
        var saveStateTitle = undefined;
        var googleId = this.props.value[GOOGLE_ID];
        var saveState = this.props.value[GOOGLE_DRIVE_STATE];
        if (googleId) {
            if (saveState === ALL_SAVED) saveStateMsg = "All changes saved in Drive";
            else if (saveState === SAVING) saveStateMsg = "Saving in Drive...";
        } else {
            if (saveState === ALL_SAVED) saveStateMsg = "Saved recovery doc in browser";
            else if (saveState === SAVING) saveStateMsg = "Saving recovery doc in browser...";
            else if (saveState === ERROR_DOC_TOO_BIG) {
                saveStateMsg = "Too big to save recovery doc";
                saveStateTitle = "Your document is too big to store inside of temporary browser storage, so be sure to click 'Save' or 'Save to Google Drive' soon."
            }

            if (!saveStateTitle) saveStateTitle = saveStateMsg;
        }
        if (this.props.value[PENDING_SAVES]) {
            //saveStateMsg += " (" + this.props.value[PENDING_SAVES] + ")";
        }
        var selectSubmissionCallback = function(submission, selectedClass, selectedAssignment, googleId) {
            window.ga('send', 'event', 'Actions', 'edit', 'Submit to Google Classroom.');
            submitAssignment(submission,
                            selectedClass,
                            selectedAssignment,
                            googleId);
        }
        return (
            <div className="menuBar">
                <GoogleClassroomSubmissionSelector
                    value={this.props.value}
                    selectSubmissionCallback={selectSubmissionCallback}
                    ref="submissionSelector"/>
                <div style={{maxWidth:1200,marginLeft:"auto", marginRight:"auto"}} className="nav">
                  <LogoHomeNav />&nbsp;&nbsp;&nbsp;&nbsp;
                  <span className="navBarElms" style={{paddingTop: "10px", lineHeight : 1}}>

                  <div className="homepage-disappear-mobile">
                    <div style={{ display:"inline-block", visibility: (saveStateMsg === '' ? 'hidden' : 'visible'),
                           color: (saveState === ERROR_DOC_TOO_BIG ? "#FFAEAE" : "inherit")
                        }}
                        className="save-state-message"
                        title={saveStateTitle === '' ? 'Remember to save often' : saveStateTitle}>
                        { /* This inline constant is just to take up some space, it is diliberately hidden
                             but is a reasonable message to for to users if it was ever accidentally shown */
                            <span>{saveStateMsg === '' ? 'Remember to save often' : saveStateMsg}</span>
                        }
                    </div>
                  </div>


                      {!browserIsIOS ?
                      (<div className="navBarItem" style={{display:"inline-block"}}>
                          Filename &nbsp;&nbsp;
                          <input type="text" id="assignment-name-text" size="15"
                                 name="assignment name" value={this.props.value[ASSIGNMENT_NAME]}
                                 onChange={
                                      function(evt) {
                                          window.store.dispatch(
                                              { type : SET_ASSIGNMENT_NAME,
                                                ASSIGNMENT_NAME : evt.target.value});
                                      }}
                          />&nbsp;&nbsp;
                      </div>) : null}
                      {!browserIsIOS ?
                      (<div className="navBarItem" style={{display:"inline-block"}}>
                          <LightButton text="Save to Device" onClick={
                              function() {
                                  var persistentState = getPersistentState();
                                  saveAssignmentValidatingProblemNumbers(persistentState, function(finalBlob) {
                                        saveAs(finalBlob, persistentState[ASSIGNMENT_NAME] + '.math');
                                  });
                              }} /> &nbsp;&nbsp;&nbsp;
                        <HtmlButton
                            className="fm-button-light"
                            ref="saveToDrive"
                            title="Save to Google Drive"
                            onClick={function() {}}
                            content={(
                                    <div style={{display: "inline-block"}}>
                                        <div style={{float: "left", paddingTop: "4px"}}>Save to Drive&nbsp;</div>
                                         <img style={{paddingTop: "2px"}}
                                                src="images/google_drive_small_logo.png"
                                                alt="google logo" />
                                    </div>
                            )} />&nbsp;&nbsp;&nbsp;
                        <HtmlButton
                            className="fm-button-light"
                            title="Submit assignment to Google Classroom"
                            onClick={function() {}}
                            ref="submitToClassroom"
                            content={(
                                    <div style={{display: "inline-block"}}>
                                        <div style={{float: "left", paddingTop: "4px"}}>
                                            Submit to Classroom&nbsp;
                                        </div>
                                         <img style={{paddingTop: "2px"}}
                                                src="images/google_classroom_small.png"
                                                alt="Google logo"
                                                height="16px"/>
                                    </div>
                            )} />&nbsp;&nbsp;&nbsp;
                         <a href="launch.html?mode=studentDemo" target="_blank">
                             <div className="fm-button-light" style={{display: "inline-block", paddingTop: "4px"}}>
                                Tutorial
                             </div>
                         </a>
                      </div>) : null}
                    </span>
                </div>
            </div>
          );
    }
}

export {AssignmentEditorMenubar as default, removeExtension, saveAssignment, openAssignment, GoogleClassroomSubmissionSelector, CANNOT_EDIT_SUBMITTED_ERR_MSG};
