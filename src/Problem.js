import React from 'react';
import './App.css';
import MathInput from './MathInput.js';
import TeX from './TeX.js';
import { default as Button, LightButton, HtmlButton, CloseButton } from './Button.js';
import FreeMathModal from './Modal.js';
import BigModal from 'react-modal';
import { genID, base64ToBlob, getCompositeState } from './FreeMath.js';
import Resizer from 'react-image-file-resizer';
import Webcam from "react-webcam";
import ImageEditor from '@toast-ui/react-image-editor'
import { whiteTheme } from './white-theme.js';
import { waitForConditionThenDo } from './Util.js';
import { gridImage } from './gridBase64.js';
import { blankImgBase64 } from './blankImgBase64.js';
import TextareaAutosize from 'react-textarea-autosize';
import {useCallback} from 'react'
import {useDropzone} from 'react-dropzone'

import Cropper from 'react-cropper';
// If you choose not to use import, you need to assign Cropper to default
// var Cropper = require('react-cropper').default

// to implement undo/redo and index for the last step
// to show is tracked and moved up and down
// when this is not at the end of the list and a new
// step is added it moves to the end of the list as
// the redo history in this case will be lost

// index in list
var STEP_KEY = 'STEP_KEY';
// long random identifier for a step, used as key for react list of steps
var STEP_ID = 'STEP_ID';

var SET_IMAGE_BEING_EDITED = 'SET_IMAGE_BEING_EDITED';
var IMAGE_BEING_EDITED = 'IMAGE_BEING_EDITED';

var PROBLEMS = 'PROBLEMS';
// student assignment actions
var ADD_PROBLEM = 'ADD_PROBLEM';
var ADD_DEMO_PROBLEM = 'ADD_DEMO_PROBLEM';

// remove problem expects an "index" property
// specifying which problem to remove
var REMOVE_PROBLEM = 'REMOVE_PROBLEM';
var CLONE_PROBLEM = 'CLONE_PROBLEM';

var PROBLEM_INDEX  = 'PROBLEM_INDEX';

// this action expects:
// PROBLEM_INDEX - for which problem to change
// NEW_PROBLEM_NUMBER - string with problem number, not a numberic
//                    type because the problem might be 1.a, etc.
var NEW_PROBLEM_NUMBER = 'NEW_PROBLEM_NUMBER';
var SET_PROBLEM_NUMBER = 'SET_PROBLEM_NUMBER';
var CONTENT = "CONTENT";

// refers to passing complete step info in an action
//oldStep = {CONTENT : "", FORMAT: "MATH", HIGHTLIGHT: "SUCCESS"};
// current format MATH isn't used, no format implies math
var STEP_DATA = "STEP_DATA";

var SUCCESS = 'SUCCESS';
var ERROR = 'ERROR';
var HIGHLIGHT = 'HIGHLIGHT';
var STEPS = 'STEPS';
var SCORE = "SCORE";
var FEEDBACK = "FEEDBACK";
var SHOW_TUTORIAL = "SHOW_TUTORIAL";
var SHOW_IMAGE_TUTORIAL = "SHOW_IMAGE_TUTORIAL";
var SHOW_DRAWING_TUTORIAL = 'SHOW_DRAWING_TUTORIAL';

var FORMAT = "FORMAT";
var MATH = "MATH";
var TEXT = "TEXT";
var IMG = "IMG";

var INSERT_STEP_ABOVE = 'INSERT_STEP_ABOVE';
var NEW_STEP = 'NEW_STEP';
var NEW_BLANK_STEP = 'NEW_BLANK_STEP';
// this action expects an index for which problem to change
var UNDO = 'UNDO';
// this action expects an index for which problem to change
var REDO = 'REDO';
var DELETE_STEP = 'DELETE_STEP';
// array of problem editing actions
// TODO - these actions usually have data to specify which problem
// they apply to, but I'm planning on having an undo stack per problem
// I won't be adding these values in the actions as I only expect them
// to be consumed by ths sub-reducers, but this may have an impact
// if I switch to more type-safe action constructors in the future
var UNDO_STACK = 'UNDO_STACK';
var REDO_STACK = 'REDO_STACK';
var INVERSE_ACTION = 'INVERSE_ACTION';
// properties for implementing intuitive undo/redo for mathquill editors, so they act (mostly) like
// the regular text boxes in raw HTML
var ADD = 'ADD';
var DELETE = 'DELETE';
var EDIT_TYPE = 'EDIT_TYPE';
var POS = 'POS';

// this action expects:
// PROBLEM_INDEX - for which problem to change
// STEP_KEY - index into the work steps for the given problem
// NEW_STEP_CONTENT - string for the new expression to write in this step
var EDIT_STEP = 'EDIT_STEP';
var NEW_STEP_CONTENT = 'NEW_STEP_CONTENT';
var POSSIBLE_POINTS = "POSSIBLE_POINTS";
var PROBLEM_NUMBER = 'PROBLEM_NUMBER';
var FABRIC_SRC = 'FABRIC_SRC';
var NEW_FABRIC_SRC = 'NEW_FABRIC_SRC';

// CSS constants
var SOFT_RED = '#FFDEDE';
var GREEN = '#D0FFC9';

class ScoreBox extends React.Component {
    render() {
        var scoreClass = undefined;
        var score = this.props.value[SCORE];
        var onClick = this.props.onClick;
        var possiblePoints = this.props.value[POSSIBLE_POINTS];
        var feedback = this.props.value[FEEDBACK] ||
            this.props.value[STEPS].filter(
                step => step[HIGHLIGHT] || (step[FEEDBACK] && step[FEEDBACK].trim() !== '')
            ).length > 0;

        var scoreNum = Number(score);
        var possiblePointsNum = Number(possiblePoints);
        if (score === '') {
            scoreClass = 'show-complete-div';
        } else if (scoreNum >= possiblePointsNum) {
            scoreClass = 'show-correct-div';
        } else if (scoreNum === 0) {
            scoreClass = 'show-incorrect-div';
        } else {
            scoreClass = 'show-partially-correct-div';
        }

        var gradingNotice = '';
        if (score === '') {
            gradingNotice = 'Full Credit';
        } else if (score && score > possiblePoints) {
            gradingNotice = 'Extra Credit';
        }
        var scoreMessage = null;
        if (score === '')
            scoreMessage = '\\text{Complete}';
        else if (score !== undefined)
            scoreMessage =  '\\frac{' + score + '}{' + possiblePoints + '}';
        return (
            <div onClick={onClick}>
                {
                    score !== undefined
                        ? (<div>
                            <div style={{visibility: (gradingNotice !== '') ? "visible" : "hidden"}}>
                                <small><span style={{color:"#545454"}}>{gradingNotice}</span><br /></small>
                            </div>
                            <div className={scoreClass}>
                                <div style={{padding:"3px 0px 1px 0px", display:"inline-block"
                                            /* alignment because of border on teacher feedback indicator*/ }}>
                                    <TeX>{scoreMessage}</TeX>
                                </div>
                                { feedback
                                    ? (<div title="Teacher feedback or highlights"
                                            className="answer-partially-correct"
                                            style={{display:"inline-block", margin:"0px 5px",
                                                    borderRadius: "15px",
                                                    backgroundColor: "#ffd743",
                                                    padding:"2px 11px 0px 10px"}}>
                                         <b>!</b>
                                       </div>) : null }
                            </div>
                            </div>)
                        : null
                }
            </div>
        );
    }
}

class ImageUploader extends React.Component {
    render() {
        const problemIndex = this.props.problemIndex;
        const steps = this.props.value[STEPS];
        const lastStep = steps[steps.length - 1];
        const lastStepIndex = steps.length - 1;
		return (
            <div style={{display:"inline-block"}}>
                <WebcamCapture
                       handlePicUploadCallback={function(evt) {
                            addNewImageFiles(evt, steps, lastStepIndex, problemIndex,
                                function(imgFile, stepIndex, problemIndex, steps) {
                                    addImageToEnd(imgFile, problemIndex, steps);
                                }
                            );
                       }}
                        handlePicCallback={function(imageSrc) {
                              // strip off the mime type info
                              // https://stackoverflow.com/questions/24289182/how-to-strip-type-from-javascript-filereader-base64-string
                              var imgFile = base64ToBlob(imageSrc.split(',')[1]);

                              Resizer.imageFileResizer(
                                  imgFile, 1200, 1200, 'JPEG', 80, 0,
                                  imgFile => {
                                    addImageToEnd(imgFile, problemIndex, steps);
                                  },
                                  'blob'
                              );
                        }}
                />
		    </div>);
	}
}

function handleImg(imgFile, stepIndex, problemIndex, steps) {
    handleImgUrl(window.URL.createObjectURL(imgFile), stepIndex, problemIndex, steps);
}

// fabricSrc is the Json serialization of the edited image to allow further moving places objecsts/drawings
function handleImgUrl(objUrl, stepIndex, problemIndex, steps, fabricSrc = undefined) {
    window.store.dispatch(
        { type : EDIT_STEP, PROBLEM_INDEX : problemIndex, STEP_KEY: stepIndex,
            FORMAT: IMG, NEW_STEP_CONTENT: objUrl, NEW_FABRIC_SRC : fabricSrc } );
    addNewLastStepIfNeeded(steps, stepIndex, problemIndex);
}

function addNewLastStepIfNeeded(steps, stepIndex, problemIndex) {
    // if this is the last step, add a blank step below
    if (stepIndex === steps.length - 1) {
        window.store.dispatch(
            { type : "NEW_BLANK_STEP", "PROBLEM_INDEX" : problemIndex });
    }
}

function addNewImage(evt, steps, stepIndex, problemIndex, addImg = handleImg) {
    let files = evt.target.files;
    addNewImageFiles(files, steps, stepIndex, problemIndex, addImg);
}

function addNewImageFiles(files, steps, stepIndex, problemIndex, addImg = handleImg) {
    files.forEach(function(file) {
        addNewImageFile(file, steps, stepIndex, problemIndex, addImg);
    });
}

// TODO - handle multiple images
function addNewImageFile(file, steps, stepIndex, problemIndex, addImg = handleImg) {
    var imgFile = file;
    if(typeof imgFile === "undefined" || !imgFile.type.match(/image.*/)){
            alert("The file is not an image - " + (imgFile ? imgFile.type : ''));
            return;
    }
    if (imgFile.type.includes("gif")) {
        // disable for now, they take up lots of space and rotate/crop don't work
        alert("Gifs are not supported");
        return;
        /*
        if (imgFile.size > 1024 * 1024) {
            alert("Beyond max size allowed for gifs (1 MB)");
            return;
        }
        addImg(imgFile, stepIndex, problemIndex, steps);
        */
    } else if (imgFile.size < 512 * 1024) {
        // if image is under 0.5 MB add it without compressing
        addImg(imgFile, stepIndex, problemIndex, steps);
        return;
    } else {
        imgFile = Resizer.imageFileResizer(
            imgFile, 1200, 1200, 'JPEG', 80, 0,
            imgFile => {
                addImg(imgFile, stepIndex, problemIndex, steps);
            },
            'blob'
        );
    }
}

function addImageToEnd(imgFile, problemIndex, steps) {
    const lastStep = steps[steps.length - 1];
    const lastStepIndex = steps.length - 1;
    var objUrl = window.URL.createObjectURL(imgFile);
    if (( typeof lastStep[FORMAT] === 'undefined'
          || lastStep[FORMAT] === "MATH"
        )
        && lastStep[CONTENT] === '') {
        window.store.dispatch(
            { type : "INSERT_STEP_ABOVE",
              "PROBLEM_INDEX" : problemIndex,
              STEP_KEY: lastStepIndex,
              FORMAT: "IMG", CONTENT: objUrl} );
    } else {
        window.store.dispatch(
            { type : "NEW_STEP", "PROBLEM_INDEX" : problemIndex,
              STEP_DATA : {FORMAT: "IMG", CONTENT : objUrl} });
        window.store.dispatch(
            { type : "NEW_BLANK_STEP", "PROBLEM_INDEX" : problemIndex });
    }
}

function getMimetype(signature) {
    switch (signature) {
        case '89504E47':
            return 'image/png'
        case '47494638':
            return 'image/gif'
        case '25504446':
            return 'application/pdf'
        case 'FFD8FFDB':
        case 'FFD8FFE0':
            return 'image/jpeg'
        case '504B0304':
            return 'application/zip'
        default:
            return 'Unknown filetype'
    }
}

const videoConstraints = { };
/*
  width: 1280,
  height: 720,
  facingMode: "user"
};
*/

class WebcamCapture extends React.Component {
    state = {
        cropping : false,
        takingPicture : false,
        facingMode : 'environment'
    };

    render() {
        // function that handles an image captured from webcam as a base64 encoded string
        const handlePicCallback = this.props.handlePicCallback;
        // function to handle image uploaded as a file
        const handlePicUploadCallback = this.props.handlePicUploadCallback;
        return (
            <span>
              { this.state.takingPicture
                  ?
                  <FreeMathModal
                    showModal={this.state.takingPicture}
                    closeModal={() => this.setState({takingPicture : false})}
                    content={(
                  <span>
                  <br />
                  <ul>
                      <li>Hold your notebook up to the camera to take a picture of written work.</li>
                      <li>You can crop or rotate it afterwards if needed.</li>
                      <li>We respect your privacy, all interaction with the webcam is completely local to the browser
                      and never sent to a server.</li>
                  </ul>
                  <br />
                  <div style={{"float":"left","display":"flex", flexDirection: "row", width: "98%", alignItems: "center"}}>
                      <div style={{float: "left"}}>
                          <Button text="Take Picture" className="fm-button-green fm-button"
                            onClick={function() {
                                const imageSrc = this.webcamRef.getScreenshot();
                                try {
                                    handlePicCallback(imageSrc);
                                } catch (e) {
                                    alert('Failed to capture image.');
                                }
                                this.setState({takingPicture: false});
                            }.bind(this)}
                          />
                          <br />
                          <Button text="Switch Camera"
                            onClick={function() {
                                this.setState({facingMode : this.state.facingMode === 'environment' ? 'user' : 'environment'});
                          }.bind(this)} />
                          <br />
                          <Button text="Cancel"
                            onClick={function() {
                                this.setState({takingPicture : false});
                          }.bind(this)} />
                      </div>
                      <Webcam
                        audio={false}
                        height={"auto"}
                        ref={elem => {this.webcamRef = elem;}}
                        screenshotFormat="image/png"
                        className="webcam-capture"
                        minScreenshotWidth={800}
                        screenshotQuality={0.99}
                        //forceScreenshotSourceSize={true}
                        imageSmoothing={true}
                        videoConstraints={{...videoConstraints, facingMode: this.state.facingMode}}
                      />
                  </div>
                  <br />
                  </span>
                    )}
                  />
                  : null }
                  <div style={{display:"inline-block"}}>
                    <div className="homepage-disappear-mobile">
                        <HtmlButton title='Snap an image from a webcam or device camera'
                            content={(
                                <div className="fm-button-with-icon">
                                    <img src="images/noun_Camera_757299_white_clipped.svg"
                                         className="fm-button-icon"
                                         alt="Snap or upload an Image"/>
                                    <br />
                                   Snap
                                </div>
                            )}
                            onClick={function() {
                                this.setState({takingPicture : true});
                            }.bind(this)} />
                        <HtmlButton title='Paste Image'
                            content={(
                                <div className="fm-button-with-icon">
                                    <img src="images/noun_Picture_800093_and_clipboard_332274_closer.svg"
                                         className="fm-button-icon"
                                         alt="paste an image"/>
                                    <br />
                                    Paste
                                </div>
                            )}
                            onClick={function() {
                                alert("Paste an image using the keyboard shortcut Ctrl-v");
                            }.bind(this)} />
                    </div>
                    <ImgDropzone handlePicUploadCallback={handlePicUploadCallback} />
                    </div>
            </span>
          );
    }
};

function ImgDropzone(props) {

  // function to handle image uploaded as a file
  const handlePicUploadCallback = props.handlePicUploadCallback;

  const onDrop = useCallback(acceptedFiles => {
    // Do something with the files
    handlePicUploadCallback(acceptedFiles)
  }, [handlePicUploadCallback])
  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})

  return (
    <div {...getRootProps()}>
        <div className="homepage-disappear-mobile"
          style={{verticalAlign: "top",
                  padding: "10px", border: "2px dashed", marginTop: "15px", minHeight: "80px"}}>
          <input {...getInputProps()} />
          {
            isDragActive ?
              <span><small>Drop the files here ...</small></span> :
              <span><small>Drop some image files here, or click to select files</small></span>
          }
      </div>
      <div className="homepage-only-on-mobile">
        <HtmlButton title='Snap or upload an image'
            content={(
                <div className="fm-button-with-icon">
                    <img src="images/noun_Camera_757299_white_clipped.svg"
                         className="fm-button-icon"
                         alt="Add Image"/>
                    <br />
                    Image
                </div>
            )}
            onClick={() => {}} />
      </div>
    </div>
  )
}

function openDrawing(fabricSrc, getEditorInstanceCallback, onFailure) {
    waitForConditionThenDo(5,
        function() {
            try {
                const editorInstance = getEditorInstanceCallback();
                const canvas = editorInstance._graphics._canvas;
                return canvas.backgroundImage;
            } catch (e) {
                console.log(e);
                return false;
            }
        },
        function() {
            const editorInstance = getEditorInstanceCallback();
            const canvas = editorInstance._graphics._canvas;
            window.fabric.Object.prototype.cornerColor = 'green';
            window.fabric.Object.prototype.cornerSize = 15;
            window.fabric.Object.prototype.borderColor = 'red';
            window.fabric.Object.prototype.transparentCorners = false;

            editorInstance._graphics.setSelectionStyle({
              cornerSize: 10,
              cornerColor: 'green',
            });
            canvas.loadFromJSON(fabricSrc, function() {});
        },
        function() {
            onFailure();
        }
    );
};

function rotateBlobImg(degrees, imgBlob, imgCallback) {
    // https://medium.com/the-everyday-developer/
    // detect-file-mime-type-using-magic-numbers-and-javascript-16bc513d4e1e
    const uint = new Uint8Array(imgBlob.slice(0, 4))
    let bytes = []
    uint.forEach((byte) => {
        bytes.push(byte.toString(16))
    })
    const hex = bytes.join('').toUpperCase()
    var type = getMimetype(hex);

    if (type.includes("gif")) {
        // TODO - check size, as this isn't as easy to scale down, good to set a max of\
        // something like 0.5-1MB
        alert("Cannot rotate gifs");
    } else {
        Resizer.imageFileResizer(
            imgBlob, 1200, 1200, 'JPEG', 80, degrees,
            imgFile => {
                imgCallback(imgFile);
            },
            'blob'
        );
    }
}

function rotate(degrees, imgUri, imgCallback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', imgUri, true);
    xhr.responseType = 'blob';
    xhr.onload = function(e) {
      if (this.status === 200) {
        var imgBlob = this.response;
        // imgBlob is now the blob that the object URL pointed to.
        var fr = new FileReader();
        fr.addEventListener('load', function() {
            var imgFile = new Blob([this.result]);
            rotateBlobImg(degrees, imgFile, imgCallback);
        });
        return fr.readAsArrayBuffer(imgBlob);
      }
    };
    xhr.send();
}

class ImageStep extends React.Component {
    editorRef = React.createRef();
    state = {
        cropping : false,
    };

    render() {
        const problemIndex = this.props.id;
        const steps = this.props.value[STEPS];
        const step = this.props.step;
        const stepIndex = this.props.stepIndex;
        const editingImage = this.props.editingImage;

        const openDrawingStudent = function() {
            openDrawing(
                step[FABRIC_SRC],
                function() {
                    return this.editorRef.current.getInstance();
                }.bind(this),
                function() {
                    alert("Failed to load image editor");
                    window.ephemeralStore.dispatch({
                        type : SET_IMAGE_BEING_EDITED,
                        PROBLEM_INDEX: problemIndex,
                        STEP_KEY: stepIndex
                    });
                }.bind(this),
            );
        }.bind(this);

        const saveDrawing = function() {
            window.ga('send', 'event', 'Actions', 'save', 'Marked image feedback');
            const editorInstance = this.editorRef.current.getInstance();
            const fabricSrc = editorInstance._graphics._canvas.toJSON();
            //console.log(fabricSrc);
            //console.log(editorInstance);
            handleImgUrl(editorInstance.toDataURL({format: 'jpeg'}), stepIndex, problemIndex, steps,
                         fabricSrc);
            window.ephemeralStore.dispatch({
                type : SET_IMAGE_BEING_EDITED,
                PROBLEM_INDEX: null,
                STEP_KEY: null
            });
        }.bind(this);

        const cancelEditingImage = () => {
            if (!window.confirm("Are you sure you want to stop drawing? Your work will not be saved.")) { return; }
            window.ephemeralStore.dispatch({
                type : SET_IMAGE_BEING_EDITED,
                PROBLEM_INDEX: null,
                STEP_KEY: null
            });
        };


        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        console.log(windowWidth, windowHeight);
        console.log(windowWidth, windowHeight * 1.2);
        const onVerticalScreen = windowHeight > windowWidth * .75;
        var imageEditorWidth, imageEditorHeight;
        var canvasWidth, canvasHeight;
        var imageEditorMenuPos;
        if (onVerticalScreen) {
            console.log("phone or tablet");
            imageEditorWidth = windowWidth - 40;
            imageEditorHeight = windowHeight - 70;
            canvasWidth = windowWidth - 70;
            canvasHeight = windowHeight - 300;
            console.log(imageEditorWidth, imageEditorHeight, canvasWidth, canvasHeight, imageEditorMenuPos);
            imageEditorMenuPos = 'top';
        } else {
            console.log("desktop");
            imageEditorWidth = windowWidth - 70;
            imageEditorHeight = windowHeight - 70;
            canvasWidth = windowWidth - 400;
            canvasHeight = windowHeight - 100;
            console.log(imageEditorWidth, imageEditorHeight, canvasWidth, canvasHeight, imageEditorMenuPos);
            imageEditorMenuPos = 'left';
        }
        console.log(whiteTheme);

        return (
            <div className="mathStepEditor" style={{marginTop: "20px"}}>
                {step[CONTENT] === ''
                ?
                    <WebcamCapture
                        handlePicCallback={function(imageSrc) {
                              // strip off the mime type info
                              // https://stackoverflow.com/questions/24289182/how-to-strip-type-from-javascript-filereader-base64-string

                              Resizer.imageFileResizer(
                                  base64ToBlob(imageSrc.split(',')[1]), 1200, 1200, 'JPEG', 80, 0,
                                  imgFile => {
                                      handleImg(imgFile,
                                          stepIndex,
                                          problemIndex,
                                          steps);
                                  },
                                  'blob'
                              );
                        }}
                        handlePicUploadCallback={function(evt)  {
                            addNewImageFiles(evt, steps, stepIndex, problemIndex);
                        }}
                    />
                :
                    <span>
                        { !this.state.cropping ?
                            <HtmlButton title='Draw on Image' className="fm-button-green fm-button"
                                content={(
                                    <img src="images/noun_Draw_3104195_white.svg"
                                        style={{marginTop:"3px", height:"30px"}} alt="new drawing"/>
                                )}
                                onClick={() => {
                                    if (editingImage) {
                                        saveDrawing();
                                    } else {
                                        window.ephemeralStore.dispatch({
                                            type : SET_IMAGE_BEING_EDITED,
                                            PROBLEM_INDEX: problemIndex,
                                            STEP_KEY: stepIndex
                                        });
                                        openDrawingStudent();
                                    }
                                }}/>
                            : null
                        }
                        { !this.state.cropping
                            ?
                                <HtmlButton
                                    title={step[FABRIC_SRC] ? "Cannot crop after drawing on an image" : "Crop"}
                                    content={(
                                        <img src="images/noun_cropping_4070068_white.svg"
                                             style={{marginTop:"3px", height:"30px"}} alt="Crop"/>
                                    )}
                                    disabled={step[FABRIC_SRC]}
                                    onClick={() => { this.setState({cropping : true});}}
                                />
                            : null }
                        { this.state.cropping
                            ?
                            <span>
                                <Button className="extra-long-problem-action-button fm-button"
                                    text="Finished Cropping"
                                    title={step[FABRIC_SRC] ? "Cannot crop after drawing on an image" :
                                            "Finished Cropping"}
                                        disabled={step[FABRIC_SRC]}
                                        onClick={function() {
                                            if (this.state.cropping) {
                                                handleImgUrl(this.cropper.cropper.getCroppedCanvas().toDataURL(),
                                                             stepIndex, problemIndex, steps);
                                                this.setState({cropping : false});
                                            } else {
                                            }
                                        }.bind(this)}
                                />
                                <Button className="long-problem-action-button fm-button"
                                    text="Cancel"
                                    title="Cancel Cropping"
                                    onClick={function() {
                                        this.setState({cropping : false});
                                    }.bind(this)} />
                                <Cropper
                                    ref={elem => {this.cropper = elem;}}
                                    src={step[CONTENT]}
                                    style={{height: 400, width: '100%'}}
                                    // Cropper.js options
                                    guides={true}
                                    crop={function(){}} />
                            </span>
                           :
                           editingImage ?
                            <BigModal
                                onRequestClose={cancelEditingImage}
                                isOpen={editingImage}
                                shouldCloseOnOverlayClick={true}
                                appElement={document.getElementById('root')}
                                style={{
                                    overlay: {
                                        position: 'fixed', top: 0, left: 0,right: 0, bottom: 0,
                                        backgroundColor: 'rgba(100, 100, 100, 0.6)',
                                        zIndex: 1040,
                                    },
                                    content: {
                                        padding: '5px',
                                        inset: "10px",
                                    }
                                }}
                            >
                                        <div>
                                            <Button className="extra-long-problem-action-button fm-button"
                                                    text={editingImage ?
                                                        "Save Drawing" : "Draw on Image" }
                                                    title={editingImage ?
                                                        "Save Drawing" : "Draw on Image" }
                                                    onClick={function() {
                                                        if (editingImage) {
                                                            saveDrawing();
                                                        } else {
                                                            openDrawingStudent();
                                                        }
                                                    }.bind(this)}
                                            />
                                            <Button className="extra-long-problem-action-button fm-button"
                                                text="Cancel"
                                                onClick={cancelEditingImage} />
                                            <ImageEditor
                                                ref={this.editorRef}
                                                includeUI={{
                                                  loadImage: {
                                                    path: step[CONTENT],
                                                    name: 'SampleImage'
                                                  },
                                                  menu: ['select', 'draw', 'shape', 'text'],
                                                  initMenu: 'draw',
                                                  uiSize: {
                                                    width: imageEditorWidth + 'px',
                                                    height: imageEditorHeight + 'px'
                                                  },
                                                  menuBarPosition: imageEditorMenuPos,
                                                  theme: whiteTheme
                                                }}
                                                cssMaxWidth={canvasWidth}
                                                cssMaxHeight={canvasHeight}
                                                selectionStyle={{
                                                  cornerSize: 15,
                                                  cornerColor: 'green',
                                                  rotatingPointOffset: 70
                                                }}
                                                usageStatistics={false}
                                                defaultColor={'#000000'}
                                              />
                                            </div>

                                </BigModal>
                            :
                            <span>
                                <HtmlButton
                                    title={step[FABRIC_SRC] ? "Cannot rotate after drawing on an image" : "Rotate image left"}
                                    content={(
                                        <img src="images/noun_rotate left_3894741_white.svg"
                                             style={{marginTop:"3px", height:"30px"}} alt="rotate image left"/>
                                    )}
                                    disabled={step[FABRIC_SRC]}

                                    onClick={function() {
                                        rotate(270, step[CONTENT],
                                               (imgFile) => {handleImg(imgFile, stepIndex, problemIndex, steps)});
                                    }}
                                />
                                <HtmlButton
                                    title={step[FABRIC_SRC] ? "Cannot rotate after drawing on an image" : "Rotate image right"}
                                    content={(
                                        <img src="images/noun_rotate right_3894741_white.svg"
                                             style={{marginTop:"3px", height:"30px"}} alt="rotate image right"/>
                                    )}
                                    disabled={step[FABRIC_SRC]}
                                        onClick={function() {
                                            rotate(90, step[CONTENT],
                                                   (imgFile) => {handleImg(imgFile, stepIndex, problemIndex, steps)});
                                        }}
                                />
                                <br />
                                {step[FABRIC_SRC] ?
                                    <span className="homepage-only-on-mobile">
                                        <small>Cannot rotate or crop after drawing on an image</small>
                                    </span>
                                    : null
                                }
                                <img src={step[CONTENT]} alt="Uploaded student work"
                                     style={{margin : "10px", maxHeight: "700px", maxWidth:"98%", border: "solid"}}
                                     onMouseDown={(e) => {
                                            // only use left click
                                            if (e.button !== 0) return;

                                            window.ephemeralStore.dispatch({
                                                type : SET_IMAGE_BEING_EDITED,
                                                PROBLEM_INDEX: problemIndex,
                                                STEP_KEY: stepIndex
                                            });
                                            openDrawingStudent();
                                     }}/>
                                { step[CONTENT] !== ''
                                    ?
                                        <div style={{maxWidth: "95%"}}>
                                        If your final answer is a number, word or expression, type it in the final box below.
                                        </div>
                                    : null }
                            </span>
                        }
                        <br />
                    </span>
                }
            </div>
        );
    }
}

class Step extends React.Component {
    parentDivRef = React.createRef();
    state = {
        showMenu: false,
        holdingBackspace: false
    }

    closeMenu = () => {
        this.setState({showMenu: false});
    }

    onBackspace = (evt) => {
        if (evt.key === 'Backspace' && !this.state.holdingBackspace) {
            if (this.props.step[CONTENT] === '') {
                window.store.dispatch(
                    { type : DELETE_STEP, PROBLEM_INDEX : this.props.problemIndex,
                      STEP_KEY : this.props.stepIndex});
                this.props.focusStep(Math.max(this.props.stepIndex - 1, 0));
            }
            this.setState({holdingBackspace: true});
        }
    }
    onKeyup = (evt) => {
        if (evt.key === 'Backspace') {
            this.setState({holdingBackspace: false});
        }
    }

    // https://blog.logrocket.com/controlling-tooltips-pop-up-menus-using-compound-components-in-react-ccedc15c7526/
    componentDidUpdate() {
      setTimeout(() => {
        if(this.state.showMenu){
          window.addEventListener('click', this.closeMenu);
        }
        else{
          window.removeEventListener('click', this.closeMenu);
        }
      }, 0);
      if (this.parentDivRef && this.parentDivRef.current) {
        this.parentDivRef.current.removeEventListener('keydown', this.onBackspace);
        this.parentDivRef.current.addEventListener('keydown', this.onBackspace, true);
        this.parentDivRef.current.removeEventListener('keyup', this.onKeyup);
        this.parentDivRef.current.addEventListener('keyup', this.onKeyup, true);
      }
    }

    componentDidMount() {
      if (this.parentDivRef && this.parentDivRef.current) {
        this.parentDivRef.current.removeEventListener('keydown', this.onBackspace);
        this.parentDivRef.current.addEventListener('keydown', this.onBackspace, true);
        this.parentDivRef.current.removeEventListener('keyup', this.onKeyup);
        this.parentDivRef.current.addEventListener('keyup', this.onKeyup, true);
      }
    }

    focus() {
        // currently this should only not be set for image steps
        if (this.stepRef) this.stepRef.focus();
    }

    render() {
        const step = this.props.step;
        const stepIndex = this.props.stepIndex;
        // TODO - should be cleaner and not pass down the whole global state...
        const value = this.props.value;
        const steps = this.props.value[STEPS];
        const probNumber = this.props.value[PROBLEM_NUMBER];
        const problemIndex = this.props.problemIndex;
        const showTutorial = this.props.value[SHOW_TUTORIAL];
        const showImgTutorial = this.props.value[SHOW_IMAGE_TUTORIAL];
        const showDrawingTutorial = this.props.value[SHOW_DRAWING_TUTORIAL];
        const buttonGroup = this.props.buttonGroup;
        const editingImage = this.props.editingImage;
        // callback passed in to allow requesting focus of another step in the problem
        const focusStepCallback = this.props.focusStep;

        var styles = {};
        if (step[HIGHLIGHT] === SUCCESS) {
            styles = {backgroundColor : GREEN };
        } else if (step[HIGHLIGHT] === ERROR) {
            styles = {backgroundColor : SOFT_RED};
        }
        return (
        <div key={step[STEP_ID]} style={{width:"95%"}}>
            {showImgTutorial && stepIndex === 0 ?
            (<div style={{overflow:"hidden"}}>
                <div className="answer-partially-correct"
                     style={{display:"inline-block", "float":"left", padding:"5px", margin: "5px"}}>
                    <span>Grab your notebook or worksheet. Click the button in the left menu with a camera on it
                          to take a picture of some math work on the sheet of paper using your webcam
                          or device camera.</span>
                </div>
            </div>) : null}
            {showDrawingTutorial && stepIndex === 0 ?
            (<div style={{overflow:"hidden"}}>
                <div className="answer-partially-correct"
                     style={{display:"inline-block", "float":"left", padding:"5px", margin: "5px"}}>
                    <span>Click on the either the button with the pencil or the grid on it in the left
                          menu to add a blank drawing canvas or a graph. Then click on the image to open the drawing widget.
                    </span>
                </div>
            </div>) : null}
            {showTutorial && stepIndex === 0 ?
            (<div style={{overflow:"hidden"}}>
                <div className="answer-partially-correct"
                     style={{display:"inline-block", "float":"left", padding:"5px", margin: "5px"}}>
                    <span>Click this expression, then press enter.</span>
                </div>
            </div>) : null}
            {showTutorial && stepIndex === 1 ?
            (<div style={{overflow:"hidden"}}>
                <div className="answer-partially-correct"
                     style={{display:"inline-block", "float":"left", padding:"5px", margin: "5px"}}>
                    <span>Edit this line to show part of the work for
                          simplifying this expression, then press enter again.</span>
                </div>
            </div>) : null}
            {showTutorial && stepIndex === 2 ?
            (<div style={{overflow:"hidden"}}>
                <div className="answer-partially-correct"
                     style={{display:"inline-block", "float":"left", padding:"5px", margin: "5px"}}>
                    <span>Repeat until you have reached your solution on
                          the last line you edit.</span></div></div>) : null}
            <div style={{display:"block"}}>
        <div style={{"float":"left","display":"flex", flexDirection: "row", width: "98%", alignItems: "center"}}>
            <div className="step-actions">
              <div style={{
                  position: 'relative',
                  display: 'inline-block'
              }}>
                 <button
                    className='fm-button-light'
                    onClick={
                      function() {
                          this.setState({showMenu: !this.state.showMenu});
                      }.bind(this)}
                    >
                        <div style={{display:"inline-block"}}>
                            <div style={{float: "left", fontSize: '16px', paddingTop: "4px"}}>{"\u22EE"}</div>
                        </div>
                </button>
                    <div style={{
                            backgroundColor: '#f1f1f1', position:'absolute',
                            boxShadow: '0px 8px 16px 0px rgba(0,0,0,0.2)',
                            minWidth: '400px',
                            // TODO - fix this to keep track of used z-indexes
                            zIndex: '5',
                            display: this.state.showMenu ? 'block' : 'none' }}>
                        <LightButton text='Add Step Above'
                            style={{display: 'block', width: '100%', borderRadius: '0px'}}
                            onClick={() => {
                                window.store.dispatch(
                                    { type : INSERT_STEP_ABOVE, PROBLEM_INDEX : problemIndex,
                                      STEP_KEY : stepIndex});
                                this.setState({showMenu: !this.state.showMenu});
                                focusStepCallback(stepIndex);
                            }}/>
                        <LightButton text='Change Between Expression Mode and Text (Ctrl e)'
                            style={{display: 'block', width: '100%', borderRadius: '0px'}}
                            onClick={(evt) => {
                                const newStepType = step[FORMAT] === MATH ? TEXT : MATH;
                                const newContent = ((newStepType === IMG || step[FORMAT] === IMG) ? '' : step[CONTENT]).replace('\n','')
                                window.store.dispatch({
                                    type : EDIT_STEP, PROBLEM_INDEX : problemIndex, FORMAT : newStepType, STEP_KEY : stepIndex,
                                    NEW_STEP_CONTENT : newContent
                                });
                                this.setState({showMenu: !this.state.showMenu});
                        }}/>
                        <LightButton text='Change to Image Step'
                            style={{display: 'block', width: '100%', borderRadius: '0px'}}
                            onClick={() => {
                                const newStepType = 'IMG';
                                window.store.dispatch({
                                    type : EDIT_STEP, PROBLEM_INDEX : problemIndex, FORMAT : newStepType, STEP_KEY : stepIndex,
                                    NEW_STEP_CONTENT : (newStepType === IMG || step[FORMAT] === IMG) ? '' : step[CONTENT]
                                });
                                this.setState({showMenu: !this.state.showMenu});
                        }}/>

                    </div>
                </div>
            </div>&nbsp;
            { step[FORMAT] === IMG
                ?
                    <ImageStep value={value} id={problemIndex} stepIndex={stepIndex} step={step}
                               editingImage={editingImage} />
                :
                step[FORMAT] === TEXT ?
                    (
                        <span>
                        <TextareaAutosize value={step[CONTENT]}
                            style={{...styles, fontSize: "15px", margin: "10px 10px 0px 10px"}}
                            className="text-step-input"
                            minRows="2"
                            ref={(ref) => this.stepRef = ref }
                            onChange={
                                function(evt) {
                                    window.store.dispatch({
                                        type : EDIT_STEP, PROBLEM_INDEX : problemIndex, STEP_KEY : stepIndex,
                                        FORMAT : TEXT,
                                        NEW_STEP_CONTENT : evt.target.value});
                                }}
                            onKeyDown={function(evt) {
                                    if (evt.shiftKey && evt.key === 'Enter') {
                                        window.store.dispatch(
                                            { type : NEW_STEP,
                                              STEP_KEY : stepIndex,
                                              PROBLEM_INDEX : problemIndex});
                                        evt.preventDefault();
                                        focusStepCallback(stepIndex + 1);

                                    } else if ((evt.ctrlKey || evt.metaKey) && evt.key === 'e') {
                                        const newStepType = 'MATH';
                                        const newContent = ((newStepType === IMG || step[FORMAT] === IMG) ? '' : step[CONTENT]).replace('\n','');
                                        window.store.dispatch({
                                            type : EDIT_STEP, PROBLEM_INDEX : problemIndex,
                                            FORMAT : newStepType, STEP_KEY : stepIndex,
                                            NEW_STEP_CONTENT : newContent
                                        });
                                        evt.preventDefault();
                                        evt.stopPropagation();
                                        focusStepCallback(stepIndex);
                                    } else if (evt.key === 'Backspace' && !this.state.holdingBackspace) {
                                        if (this.props.step[CONTENT] === '') {
                                            window.store.dispatch(
                                                { type : DELETE_STEP, PROBLEM_INDEX : this.props.problemIndex,
                                                  STEP_KEY : this.props.stepIndex});
                                            this.props.focusStep(Math.max(this.props.stepIndex - 1, 0));
                                        }
                                        this.setState({holdingBackspace: true});
                                    } else if (evt.key === 'ArrowUp') {
                                        if (this.stepRef.selectionStart === 0) {
                                            focusStepCallback(stepIndex - 1);
                                        }
                                    } else if (evt.key === 'ArrowDown') {
                                        if (this.stepRef.selectionStart === this.stepRef.value.length) {
                                            focusStepCallback(stepIndex + 1);
                                        }
                                    }
                                }.bind(this)
                            }
                            onKeyUp={(evt) => {
                                if (evt.key === 'Backspace') {
                                    this.setState({holdingBackspace: false});
                                }
                            }}
                        />
                        <div style={{display:"block", marginLeft: "15px", color: "grey"}}>
                            <small>Use Shift+Enter to add a new step after a text box.</small>
                        </div>
                        </span>
                    )
                :
                <div
                    ref={this.parentDivRef}
                    style={{...styles}}
                    onKeyDown={function(evt) {
                            if (evt.shiftKey && evt.key === 'Enter') {
                                window.store.dispatch(
                                    { type : NEW_BLANK_STEP,
                                      STEP_KEY : stepIndex,
                                      PROBLEM_INDEX : problemIndex});
                                evt.preventDefault();
                                focusStepCallback(stepIndex + 1);
                            }
                            if ((evt.ctrlKey || evt.metaKey) && evt.key === 'e') {
                                const newStepType = 'TEXT';
                                window.store.dispatch({
                                    type : EDIT_STEP, PROBLEM_INDEX : problemIndex,
                                    FORMAT : newStepType, STEP_KEY : stepIndex,
                                    NEW_STEP_CONTENT :
                                        (newStepType === IMG || step[FORMAT] === IMG) ? '' : step[CONTENT]
                                });
                                evt.preventDefault();
                                evt.stopPropagation();
                                // TODO - this probably belongs in ComponentDidMount or somthing
                                focusStepCallback(stepIndex);
                            }
                        }.bind(this)
                    }
                >
                    <MathInput
                        key={stepIndex} buttonsVisible='focused'
                        className="mathStepEditor"
                        style={{overflow: 'auto', marginTop: '8px'}}
                        buttonSets={['trig', 'prealgebra',
                                     'logarithms', 'calculus']}
                        buttonGroup={buttonGroup}
                        stepIndex={stepIndex}
                        ref={ (ref) => this.stepRef = ref }
                        upOutOf={ () => focusStepCallback(stepIndex - 1)}
                        downOutOf={ () => focusStepCallback(stepIndex + 1)}
                        problemIndex={problemIndex} value={step[CONTENT]}
                        onChange={
                            function(value) {
                                window.store.dispatch({
                                type : EDIT_STEP,
                                PROBLEM_INDEX : problemIndex,
                                STEP_KEY : stepIndex,
                                FORMAT : MATH,
                                NEW_STEP_CONTENT : value});
                        }.bind(this)}
                        onSubmit={function() {
                            window.store.dispatch(
                                { type : NEW_STEP,
                                  STEP_KEY : stepIndex,
                                  PROBLEM_INDEX : problemIndex});
                            focusStepCallback(stepIndex + 1);
                        }}
                    />
                </div>
            }
            <CloseButton text="&#10005;" title='Delete step'
                style={{marginLeft: "10px"}}
                onClick={function(value) {
                    window.store.dispatch(
                        { type : DELETE_STEP, PROBLEM_INDEX : problemIndex,
                          STEP_KEY : stepIndex});
                    focusStepCallback(stepIndex);
                }}/>
            </div>
            </div>
            <div style={{"clear":"both"}} />
        </div>
        );
    }
}

class Problem extends React.Component {
    handleStepChange = (event) => {
      this.setState({value: event.target.value});
    };

    render() {
        const value = this.props.value;
        const probNumber = this.props.value[PROBLEM_NUMBER];
        const problemIndex = this.props.id;
        const showTutorial = this.props.value[SHOW_TUTORIAL];
        const showImgTutorial = this.props.value[SHOW_IMAGE_TUTORIAL];
        const showDrawingTutorial= this.props.value[SHOW_DRAWING_TUTORIAL];
        const buttonGroup = this.props.buttonGroup;
        const steps = this.props.value[STEPS];
        const imageBeingEdited = this.props.imageBeingEdited;

        if (!this.stepRefs) {
            this.stepRefs = [];
        }
        return (
            <div>
            <div className="problem-container" style={{display:"inline-block", width:"95%", float:'none'}}>
                <div className="problem-editor-buttons"
                  style={{display:"inline-block", marginRight:"10px", float:'left'}}>
                        {/*   score !== undefined ? (<ScoreBox value={this.props.value} />)
                                               : null
                        */}

                        <div style={{display:'inline-block'}}>
                        <HtmlButton title='Next Step (Enter)'
                            content={(
                                <div className="fm-button-with-icon">
                                    <img src="images/noun_new_1887016_white.svg"
                                         className="fm-button-icon"
                                         style={{height:"27px"}}
                                         alt="Next Step"/>
                                    <br />
                                    <small style={{fontSize:"9px"}}>Copy Step</small>
                                </div>
                            )}
                            onClick={function() {
                                window.store.dispatch(
                                    { type : NEW_STEP, PROBLEM_INDEX : problemIndex})
                            }}/>
                        <HtmlButton title='New Blank Step (Shift+Enter)'
                            content={(
                                <div className="fm-button-with-icon">
                                    <img src="images/noun_new_1887016_white_empty.svg"
                                         className="fm-button-icon"
                                         style={{height:"27px"}}
                                         alt="New Blank Step"/>
                                    <br />
                                    <small style={{fontSize:"9px"}}>New Step</small>
                                </div>
                            )}
                            onClick={function() {
                                window.store.dispatch(
                                    { type : NEW_BLANK_STEP, PROBLEM_INDEX : problemIndex});
                            }}/>
                        </div>
                        <div style={{display:'inline-block'}}>

                        <HtmlButton title='Undo Ctrl-z'
                            content={(
                                <div className="fm-button-with-icon">
                                    <img src="images/noun_Undo_3920132_white.svg"
                                         className="fm-button-icon"
                                         style={{height:"27px"}} alt="undo"/>
                                    <br />
                                    Undo
                                </div>
                            )}
                            onClick={
                            function() {
                                window.store.dispatch(
                                    { type : UNDO, PROBLEM_INDEX : problemIndex})
                            }}/>
                        <HtmlButton title='Redo Ctrl-y'
                            content={(
                                <div className="fm-button-with-icon">
                                    <img src="images/noun_Redo_3920132_white.svg"
                                         className="fm-button-icon"
                                         style={{height:"27px"}}
                                         alt="redo"/>
                                    <br />
                                    Redo
                                </div>
                            )}
                            onClick={
                            function() {
                                window.store.dispatch(
                                    { type : REDO, PROBLEM_INDEX : problemIndex})
                            }}/>
                        </div>
                        <div style={{display:'inline-block'}}>
                        <HtmlButton title='New Drawing'
                            content={(
                                <div className="fm-button-with-icon">
                                    <img src="images/noun_Draw_3104195_white.svg"
                                         className="fm-button-icon"
                                         alt="new drawing"/>
                                    <br />
                                    Draw
                                </div>
                            )}
                            onClick={
                                function() {
                                    const windowWidth = window.innerWidth;
                                    const windowHeight = window.innerHeight;

                                    const onVerticalScreen = windowHeight > windowWidth * .75;
                                    let img = blankImgBase64;
                                    if (onVerticalScreen) {
                                        rotateBlobImg(90, base64ToBlob(blankImgBase64), (img) => {
                                            addImageToEnd(img, problemIndex, steps);
                                        });
                                    } else {
                                        addImageToEnd(base64ToBlob(blankImgBase64), problemIndex, steps);
                                    }
                            }}/>
                        <HtmlButton title='New Grid Drawing'
                            content={(
                                <div className="fm-button-with-icon">
                                    <img src="images/noun_grid_4065750_white.svg"
                                         className="fm-button-icon"
                                         alt="new grid drawing"/>
                                    <br />
                                    Grid
                                </div>
                            )}
                            onClick={
                                function() {
                                    const windowWidth = window.innerWidth;
                                    const windowHeight = window.innerHeight;

                                    const onVerticalScreen = windowHeight > windowWidth * .75;
                                    let img = blankImgBase64;
                                    if (onVerticalScreen) {
                                        rotateBlobImg(90, base64ToBlob(gridImage), (img) => {
                                            addImageToEnd(img, problemIndex, steps);
                                        });
                                    } else {
                                        addImageToEnd(base64ToBlob(gridImage), problemIndex, steps);
                                    }
                            }}/>
                        </div>
                        {/*<Button type="submit" className="long-problem-action-button fm-button" text="Clone Problem"
                                title="Make a copy of this work, useful if you need to reference it while trying another solution path."
                                onClick={function() {
                                    window.store.dispatch({ type : CLONE_PROBLEM, PROBLEM_INDEX : problemIndex}) }}
                        />*/}
                        {<ImageUploader problemIndex={problemIndex} value={this.props.value}/>}
                    </div>
                    <div>
                        <div className="equation-list" style={{marginTop: "10px", paddingBottom:"350px"}}>
                            <small style={{marginRight: "10px"}}>Problem Number</small>
                            <input type="text" style={{width: "95px"}}
                                   value={probNumber} className="problem-number"
                                   onChange={
                                        function(evt) {
                                            window.store.dispatch({ type : SET_PROBLEM_NUMBER, PROBLEM_INDEX : problemIndex,
                                                    NEW_PROBLEM_NUMBER : evt.target.value}) }}
                            /> <br />

                        <br />
                        {   this.props.value[FEEDBACK] !== undefined
                                ? (<div className="answer-partially-correct"
                                        style={{width:"500px"}}>
                                        <b>{this.props.value[FEEDBACK] === "" ? 'No Written ' : ''}
                                            Teacher Feedback</b><br />
                                        {this.props.value[FEEDBACK]}
                                   </div>) : null
                        }
                        {steps.map(function(step, stepIndex) {
                            return (<Step key={problemIndex + ' ' + stepIndex} step={step} stepIndex={stepIndex} value={value}
                                        ref={(ref) => this.stepRefs[stepIndex] = ref }
                                        focusStep={(stepIndex) => {
                                            setTimeout(() => {
                                                const steps = getCompositeState()[PROBLEMS][problemIndex][STEPS];
                                                if (stepIndex > steps.length - 1) stepIndex = steps.length - 1;
                                                if (stepIndex < 0) stepIndex = 0;
                                                this.stepRefs[stepIndex].focus()
                                            }, 50);
                                        }}
                                        buttonGroup={buttonGroup} problemIndex={problemIndex}
                                        editingImage={
                                            imageBeingEdited &&
                                            imageBeingEdited[PROBLEM_INDEX] === problemIndex &&
                                            imageBeingEdited[STEP_KEY] === stepIndex
                                        }
                                        />)
                        }.bind(this))}
                    </div>
                </div>
            </div>
            {showTutorial ?
                (<div>
                    <div className="answer-partially-correct"
                      style={{display:"inline-block", padding:"5px", margin: "5px"}}>
                    <span>Scroll to the top of the page and click on the button labeled "Problem Image Demo", to learn about
                          adding images to your documents.</span>
                    </div>
                </div>
                ) : null}
            {showImgTutorial ?
                (<div>
                    <div className="answer-partially-correct"
                      style={{display:"inline-block", padding:"5px", margin: "5px"}}>
                    <span>Scroll to the top of the page and click on the button labeled "Problem Drawing Demo", to learn about
                          adding digital drawings and graphs to your documents.</span>
                    </div>
                </div>
                ) : null}
            {showDrawingTutorial ?
                (<div>
                    <div className="answer-partially-correct"
                      style={{display:"inline-block", padding:"5px", margin: "5px"}}>
                    <span>Scroll to the top of the page and add another problem to your document. Using a combination of images
                          and typed math, show your work solving each problem in your assignment. Delete the demo problems before saving your document.
                    </span>
                    </div>
                </div>
                ) : null}
            </div>
        );
    }
}

/*
 * Designing more complex undo/redo, now that individual steps can be deleted or added in the middle
 * Probably want to get rid of "last shown step" property entirely
 * create serializable commands that can mutate in either direction
 * (can I use the existing redux actions?)
 *
 * Some workflows:
 * edit the first blank line
 *     - add an undo event that sets the field blank
 *
 * add new step
 *     - add undo event for delete step
 *
 * user clicks undo button
 *  - pop off the delete step action
 *  - save a new undo even that will add a step and set it's contents
 *  - perform popped delete action
 *
 * new step button again, then edits the new 2nd step shorter
 *  - put on an undo event that will return the contents to it's original form copied from step 1
 *  - part of me thinks this should happen as soon as a step is copied, but that would make
 *    an undo event do nothing
 *    or unneccessarily add another step
 *      - this should immediately add a "delete step" action as noted above, maybe knowing
 *        what to put on the stack requires inspecting what is currently at the top, if it's
 *        related to the same step it may combine two undo events
 *
 * user inserts step above
 *     - add event to delete the step to undo stack
 *
 * user edits a random step in the middle of the series
 *     - add event to change it back to the original contents
 *     - if they edit the same step again, don't add a new event
 *     - previously when doing this excercise I had played around with a basic text field
 *       and the undo/redo there
 *         - trying this again
 *         - typing into box, ctrl-z -> box goes back to blank
 *         - type into box, stop, type again, -> still clears full box
 *         - type, click elsewhere in box, no edit at new cursor position, click back to end
 *           and edit again
 *             - first undo goes back to what was typed originally, second clears the rest of
 *               the way
 *         - type, delete some text
 *             - first undo restores longest text
 *             - second clears
 *         - more complex
 *             - type aaaaaaaaaaaaaaaaaa
 *             - delete to aaaaaa
 *             - add b's   aaaaaabbbbbbbbb
 *             - delete b's back to aaaaaaa
 *             - add c's    aaaaaaacccccccc
 *             - undo then does:
 *             - aaaaaabbbbbbb
 *             - aaaaaaaaaaaaa
 *             - blank
 *             - analysis, appears recording a past deletion isn't considered important
 *                 - it never re-produced the shorter version, assumes useful things to cover
 *                   longer typed this, not truncation
 *                 - something to keep in mind, some of the keywords are likely longer right
 *                   before they are converted into symbols
 *
 */
// reducer for an individual problem
function problemReducer(problem, action) {
    if (problem === undefined) {
        // TODO - need to convert old docs to add undo stack
        return { PROBLEM_NUMBER : "",
                 STEPS : [{STEP_ID : genID(), CONTENT : "", FORMAT: MATH}],
                 UNDO_STACK : [], REDO_STACK : []};
    } else if (action.type === SET_PROBLEM_NUMBER) {
        return {
            ...problem,
            PROBLEM_NUMBER : action[NEW_PROBLEM_NUMBER]
        };
    } else if (action.type === EDIT_STEP) {
        // if the last action was an edit of this step, don't add an undo
        // event for each character typed, collapse them together. Only create
        // a new undo event if the edit made the text shorter.
        var latestUndo = problem[UNDO_STACK].length > 0 ? problem[UNDO_STACK][0] : false;
        const currStep = problem[STEPS][action[STEP_KEY]];
        const currContent = currStep[CONTENT];
        let newContent = action[NEW_STEP_CONTENT];
        let newFabficSrc = action[NEW_FABRIC_SRC];
        const currFormat = currStep[FORMAT];
        const newFormat = action[FORMAT];

        if ( currFormat === MATH && newFormat === TEXT) {
            if (currContent === newContent) {
                // make switching between math and text a little easier
                newContent = newContent.replace(/\\ /g, ' ');
            }
        } else if (currStep[FORMAT] === TEXT && newFormat === MATH) {
            if (currContent === newContent) {
                // make switching between math and text a little easier
                newContent = newContent.replace(/ /g, '\\ ');
            }
        }

        // "ADD" or "DELETE"
        var editType;
        // position of the add or delete
        var pos;
        var updateLastUndoAction = false;
        // when users type into a textbox, they expect an undo/redo function to remove/add series of characters that were typed/deleted
        // not an individual undo/redo action for each 1 character edit. This functionality is implemented by looking at the
        // type of edit is currently being done, and checking if it should be combined with the last undo event on the stack.
        //
        // Check if this is a single character edit. If it is find its location, and detemine if it is an insertion or deletion
        if (currFormat === newFormat && (currFormat === MATH || currFormat === TEXT) && Math.abs(currContent.length - newContent.length) === 1) {
            // find the first mismatching character
            var i = 0;
            for (; i < currContent.length && i < newContent.length; i++) {
                if (newContent.charAt(i) === currContent.charAt(i)) continue;
                else break;
            }

            // inspect the rest of the inputs to determine if this was a single chracter add or delete
            //
            // tricky case to check, highlight multiple characters and paste in the number of chracters that was highlighted
            // this might cause some weird behavior if the strings overlap, but if data is replaced by mostly the same
            // values there really isn't info lost if it acts somewhat like typing the text out in series

            if (newContent.length > currContent.length) {
                // one character addition
                if (i === newContent.length - 1
                        || newContent.substring(i+1) === currContent.substring(i)) {
                    pos = i;
                    editType = ADD;
                    if (latestUndo && latestUndo[INVERSE_ACTION][EDIT_TYPE] === editType
                            && latestUndo[INVERSE_ACTION][POS] === pos - 1) {
                        updateLastUndoAction = true;
                    }
                }
            } else {
                // one character deletion
                if (i === currContent.length - 1
                        || currContent.substring(i+1) === newContent.substring(i)) {
                    pos = i;
                    editType = DELETE;
                    if (latestUndo && latestUndo[INVERSE_ACTION][EDIT_TYPE] === editType
                            && latestUndo[INVERSE_ACTION][POS] === pos + 1) {
                        updateLastUndoAction = true;
                    }
                }
            }
        } else {
            updateLastUndoAction = false;
        }

        let inverseAction = {
            ...action,
            INVERSE_ACTION : {
                type : EDIT_STEP,
                STEP_KEY: action[STEP_KEY],
                FORMAT: currFormat,
                INVERSE_ACTION : {
                    ...action,
                    EDIT_TYPE : editType,
                    POS : pos,
                }
            }
        };
        var newUndoStack;
        if (updateLastUndoAction) {
            inverseAction[INVERSE_ACTION][NEW_STEP_CONTENT] = latestUndo[NEW_STEP_CONTENT];
            let undoAction = {...inverseAction[INVERSE_ACTION]};
            newUndoStack = [
                undoAction,
                ...problem[UNDO_STACK].slice(1)
            ];
        } else {
            inverseAction[INVERSE_ACTION][NEW_STEP_CONTENT] = problem[STEPS][action[STEP_KEY]][CONTENT];
            inverseAction[INVERSE_ACTION][NEW_FABRIC_SRC] = problem[STEPS][action[STEP_KEY]][FABRIC_SRC];
            let undoAction = {...inverseAction[INVERSE_ACTION]};
            newUndoStack = [
                undoAction,
                ...problem[UNDO_STACK]
            ];
        }
        return {
            ...problem,
            UNDO_STACK : newUndoStack,
            REDO_STACK : [],
            STEPS : [
                ...problem[STEPS].slice(0, action[STEP_KEY]),
                // copy properties of the old step, to get the STEP_ID, then override the content
                { ...problem[STEPS][action[STEP_KEY]],
                     CONTENT : newContent,
                     FABRIC_SRC : newFabficSrc,
                     FORMAT : action[FORMAT],
                },
                ...problem[STEPS].slice(action[STEP_KEY] + 1)
            ]
        }
    } else if (action.type === DELETE_STEP) {
        if (problem[STEPS].length === 1) {
            return problem;
        }
        let inverseAction = {
            ...action,
            INVERSE_ACTION : {
                type : INSERT_STEP_ABOVE,
                STEP_KEY: action[STEP_KEY],
                CONTENT : problem[STEPS][action[STEP_KEY]][CONTENT],
                FABRIC_SRC : problem[STEPS][action[STEP_KEY]][FABRIC_SRC],
                FORMAT : problem[STEPS][action[STEP_KEY]][FORMAT],
                INVERSE_ACTION : {...action}
            }
        };
        let undoAction = {...inverseAction[INVERSE_ACTION]};
        return {
            ...problem,
            STEPS : [
                ...problem[STEPS].slice(0, action[STEP_KEY]),
                ...problem[STEPS].slice(action[STEP_KEY] + 1)
            ],
            UNDO_STACK : [
                undoAction,
                ...problem[UNDO_STACK]
            ],
            REDO_STACK : []
        }
    } else if (action.type === INSERT_STEP_ABOVE) {
        let newContent;
        let newFabricSrc = undefined;
        var newFormat = undefined;
        // non-blank inserations in the middle of work currently only used for undo/redo
        if (CONTENT in action) {
            newContent = action[CONTENT]
            newFabricSrc = action[FABRIC_SRC]
            if (FORMAT in action) {
                newFormat = action[FORMAT]
            } else {
                // default to no FORMAT, which is math
            }
        } else {
            // this is the default produced by the button on the UI
            newContent = ""
        }
        let inverseAction = {
            ...action,
            INVERSE_ACTION : {
                type : DELETE_STEP, STEP_KEY: action[STEP_KEY],
                INVERSE_ACTION : {...action}
            }
        };
        let undoAction = {...inverseAction[INVERSE_ACTION]};
        return {
            ...problem,
            STEPS : [
                ...problem[STEPS].slice(0, action[STEP_KEY]),
                { CONTENT : newContent,
                  FABRIC_SRC: newFabricSrc,
                  FORMAT: newFormat, STEP_ID : genID()},
                ...problem[STEPS].slice(action[STEP_KEY])
            ],
            UNDO_STACK : [
                undoAction,
                ...problem[UNDO_STACK]
            ],
            REDO_STACK : []
        }
    } else if(action.type === NEW_STEP || action.type === NEW_BLANK_STEP) {
        var oldStep;
        if (typeof action[STEP_KEY] === 'undefined') {
            action[STEP_KEY] = problem[STEPS].length - 1;
        }
        if (action.type === NEW_STEP) {
            if (action[STEP_DATA]) {
                oldStep = action[STEP_DATA];
            } else if (problem[STEPS][action[STEP_KEY]][FORMAT] === TEXT) {
                // when creating a text step don't copy down previous line
                oldStep = {CONTENT : "", FORMAT: TEXT};
            } else {
                oldStep = problem[STEPS][action[STEP_KEY]];
            }
        } else { // new blank step
            oldStep = {CONTENT : "", FORMAT: MATH};
        }
        // TODO - allow tracking the cursor, which box it is in
        // for now this applies when the button is used instead of hitting enter
        // while in the box, will always add to the end
        let inverseAction = {
            ...action,
            INVERSE_ACTION : {
                type : DELETE_STEP, STEP_KEY: action[STEP_KEY] + 1,
                INVERSE_ACTION : {...action}
            }
        };
        let undoAction = {...inverseAction[INVERSE_ACTION]};
        return {
            ...problem,
            STEPS : [
                ...problem[STEPS].slice(0, action[STEP_KEY] + 1),
                {...oldStep, STEP_ID : genID()},
                ...problem[STEPS].slice(action[STEP_KEY] + 1)
            ],
            UNDO_STACK : [
                undoAction,
                ...problem[UNDO_STACK]
            ],
            REDO_STACK : []
        };
    } else if (action.type === UNDO) {
        if (problem[UNDO_STACK].length === 0) return problem;
        let undoAction = problem[UNDO_STACK][0];
        let inverseAction = {...undoAction[INVERSE_ACTION],
                             INVERSE_ACTION : {...undoAction, INVERSE_ACTION : undefined}};
        let ret = problemReducer(problem, undoAction)
        let newUndoStack = problem[UNDO_STACK].slice(1, problem[UNDO_STACK].length);
        return {...ret,
                UNDO_STACK : newUndoStack,
                REDO_STACK : [
                    inverseAction,
                    ...problem[REDO_STACK]
                ],
        }
    } else if (action.type === REDO) {
        if (problem[REDO_STACK].length === 0) return problem;
        let redoAction = problem[REDO_STACK][0];
        // this ret has its redo-actions set incorrectly now, because the actions are re-used
        // in a normal mutation any edit should clear the redo stack (because you are back
        // in history and making a new edit, you need to start tracking this branch in time)
        // For redo actions, the stack should be maintained, this is restored below.
        let ret = problemReducer(problem, redoAction)
        let inverseAction = {...redoAction[INVERSE_ACTION], INVERSE_ACTION : redoAction};
        return {...ret,
                REDO_STACK : problem[REDO_STACK].slice(1, problem[REDO_STACK].length),
                UNDO_STACK : [
                    inverseAction,
                    ...problem[UNDO_STACK]
                ],
        }
    } else {
        alert("no matching action handling");
        return problem;
    }
}

// reducer for the list of problems in an assignment
function problemListReducer(probList, action) {
    console.log(action);
    //console.log(probList);
    if (probList === undefined) {
        return [ problemReducer(undefined, action) ];
    }
    if (action.type === ADD_DEMO_PROBLEM) {
        if (probList.length === 1 && probList[0][STEPS][0][CONTENT] === "") {

            return [
                { PROBLEM_NUMBER : "Demo",
                  STEPS : [{
                     STEP_ID : genID(), CONTENT : "4+2-3\\left(1+2\\right)"}],
                  UNDO_STACK : [], REDO_STACK : [],
                  SHOW_TUTORIAL : true
                 },
                 { PROBLEM_NUMBER : "Image Demo",
                   STEPS : [{
                     STEP_ID : genID(), CONTENT : ""}],
                   UNDO_STACK : [], REDO_STACK : [],
                   SHOW_IMAGE_TUTORIAL : true
                 },
                 { PROBLEM_NUMBER : "Drawing Demo",
                   STEPS : [{
                     STEP_ID : genID(), CONTENT : ""}],
                   UNDO_STACK : [], REDO_STACK : [],
                   SHOW_DRAWING_TUTORIAL : true
                 }
            ];
        } else {
            return probList;
        }
    } else if (action.type === ADD_PROBLEM) {
        return [
            ...probList,
            problemReducer(undefined, action)
        ];
    } else if (action.type === REMOVE_PROBLEM) {
        if (probList.length === 1) return probList;
        return [
            ...probList.slice(0, action[PROBLEM_INDEX]),
            ...probList.slice(action[PROBLEM_INDEX] + 1)
        ];
    } else if (action.type === CLONE_PROBLEM) {
        var newProb = {
            ...probList[action[PROBLEM_INDEX]],
            PROBLEM_NUMBER : probList[action[PROBLEM_INDEX]][PROBLEM_NUMBER] + ' - copy'
        };
        return [
            ...probList.slice(0, action[PROBLEM_INDEX] + 1),
            newProb,
            ...probList.slice(action[PROBLEM_INDEX] + 1)
        ];
    } else if (action.type === SET_PROBLEM_NUMBER ||
               action.type === EDIT_STEP ||
               action.type === UNDO ||
               action.type === REDO ||
               action.type === DELETE_STEP ||
               action.type === NEW_BLANK_STEP ||
               action.type === INSERT_STEP_ABOVE ||
               action.type === NEW_STEP) {
        return [
            ...probList.slice(0, action[PROBLEM_INDEX]),
            problemReducer(probList[action[PROBLEM_INDEX]], action),
            ...probList.slice(action[PROBLEM_INDEX] + 1)
        ];
    } else {
        return probList;
    }
}

export { Problem as default, ScoreBox, problemReducer, problemListReducer, addNewImage, addImageToEnd, handleImg, openDrawing};
