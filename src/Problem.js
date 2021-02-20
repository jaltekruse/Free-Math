import React from 'react';
import './App.css';
import MathInput from './MathInput.js';
import Button from './Button.js';
import FreeMathModal from './Modal.js';
import { HtmlButton, CloseButton } from './Button.js';
import { genID, base64ToBlob } from './FreeMath.js';
import Resizer from 'react-image-file-resizer';
import Webcam from "react-webcam";
import ImageEditor from '@toast-ui/react-image-editor'
import { whiteTheme } from './white-theme.js';
import { waitForConditionThenDo } from './Util.js';

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
            scoreMessage = 'Complete';
        else if (score !== undefined)
            scoreMessage = 'Score ' + score + ' / ' + possiblePoints;
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
                                    <b>{scoreMessage}</b>
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
                <span>Type math below&nbsp;</span>
                <WebcamCapture
                       handlePicUploadCallback={function(evt) {
                            addNewImage(evt, steps, lastStepIndex, problemIndex,
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
            FORMAT: IMG, NEW_STEP_CONTENT: objUrl, FABRIC_SRC : fabricSrc } );
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
    var imgFile = evt.target.files[0];
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
                  <span>
                  <br />
                  <ul>
                      <li>Hold your notebook up to the camera to take a picture of written work.</li>
                      <li>You can crop or rotate it afterwards if needed.</li>
                      <li>We respect your privacy, all interaction with the webcam is completely local to the browser
                      and never sent to a server.</li>
                  </ul>
                  <br />
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
                  <br />
                  <Button text="Take Picture"
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
                  <Button text="Switch Camera"
                    onClick={function() {
                        this.setState({facingMode : this.state.facingMode === 'environment' ? 'user' : 'environment'});
                  }.bind(this)} />
                  <Button text="Cancel"
                    onClick={function() {
                        this.setState({takingPicture : false});
                  }.bind(this)} />
                  </span>
                  :
                  (<span>
                    <Button text="Snap a Picture"
                        onClick={function() {
                            this.setState({takingPicture : true});
                      }.bind(this)} />&nbsp;
                    Paste an image from the clipboard with ctrl+v,&nbsp;
                    <div style={{display: 'inline-block'}}>
                        or upload one&nbsp;
                        <input type="file" accept="*" onChange={
                            function(evt) {handlePicUploadCallback(evt)}}/>
                      </div>
                    </span>)
              }
            </span>
          );
    }
};

class ImageStep extends React.Component {
    editorRef = React.createRef();
    state = {
        cropping : false,
        imageMarkup : false
    };

    render() {
        const problemIndex = this.props.id;
        const steps = this.props.value[STEPS];
        const step = this.props.step;
        const stepIndex = this.props.stepIndex;

        const rotate = function(degrees) {

            var xhr = new XMLHttpRequest();
            xhr.open('GET', step[CONTENT], true);
            xhr.responseType = 'blob';
            xhr.onload = function(e) {
              if (this.status === 200) {
                var imgBlob = this.response;
                // imgBlob is now the blob that the object URL pointed to.
                var fr = new FileReader();
                fr.addEventListener('load', function() {
                    var imgFile = new Blob([this.result]);
                    // https://medium.com/the-everyday-developer/
                    // detect-file-mime-type-using-magic-numbers-and-javascript-16bc513d4e1e
                    const uint = new Uint8Array(this.result.slice(0, 4))
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
                            imgFile, 1200, 1200, 'JPEG', 80, degrees,
                            imgFile => {
                                handleImg(imgFile, stepIndex, problemIndex, steps);
                            },
                            'blob'
                        );
                    }
                });
                return fr.readAsArrayBuffer(imgBlob);
              }
            };
            xhr.send();
        };

        const saveDrawing = function() {
            window.ga('send', 'event', 'Actions', 'save', 'Marked image feedback');
            const editorInstance = this.editorRef.current.getInstance();
            const fabricSrc = editorInstance._graphics._canvas.toJSON();
            console.log(fabricSrc);
            console.log(editorInstance);
            handleImgUrl(editorInstance.toDataURL({format: 'jpeg'}), stepIndex, problemIndex, steps,
                         fabricSrc);
            this.setState({imageMarkup: false});
        }.bind(this);

        const openDrawing = function() {
            this.setState({imageMarkup: true});
            waitForConditionThenDo(5,
                function() {
                    try {
                        const editorInstance = this.editorRef.current.getInstance();
                        const canvas = editorInstance._graphics._canvas;
                        return canvas;
                    } catch (e) {
                        console.log(e);
                        return false;
                    }
                }.bind(this),
                function() {
                    const editorInstance = this.editorRef.current.getInstance();
                    const canvas = editorInstance._graphics._canvas;
                    console.log(canvas);
                    window.fabric.Object.prototype.cornerColor = 'green';
                    window.fabric.Object.prototype.cornerSize = 15;
                    window.fabric.Object.prototype.borderColor = 'red';
                    window.fabric.Object.prototype.transparentCorners = false;

                    editorInstance._graphics.setSelectionStyle({
                      cornerSize: 10,
                      cornerColor: 'green',
                    });
                    canvas.loadFromJSON(step[FABRIC_SRC], function() {}.bind(this));
                }.bind(this),
                function() {
                    alert("Failed to load image editor");
                    this.setState({imageMarkup: false});
                }.bind(this)
            );
        }.bind(this);

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        console.log(whiteTheme);

        return (
            <div className="mathStepEditor">
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
                            addNewImage(evt, steps, stepIndex, problemIndex);
                        }}
                    />
                :
                    <span>
                        { !this.state.cropping ?
                            <Button className="extra-long-problem-action-button fm-button"
                                    text={this.state.imageMarkup ?
                                        "Save Drawing" : "Draw on Image" }
                                    title={this.state.imageMarkup ?
                                        "Save Drawing" : "Draw on Image" }
                                    onClick={function() {
                                        if (this.state.imageMarkup) {
                                            saveDrawing();
                                        } else {
                                            openDrawing();
                                        }
                                    }.bind(this)}
                            />
                            : null
                        }

                        <Button className={(this.state.cropping ? "extra-long-problem-action-button" : "long-problem-action-button") + " fm-button"}
                                text={this.state.cropping ? "Finished Cropping" : "Crop Image" }
                                title={step[FABRIC_SRC] ? "Cannot crop after drawing on an image" :
                                    (this.state.cropping ? "Finished Cropping" : "Crop Image")}
                                disabled={step[FABRIC_SRC]}
                                onClick={function() {
                                    if (this.state.cropping) {
                                        handleImgUrl(this.cropper.getCroppedCanvas().toDataURL(), stepIndex, problemIndex, steps);
                                        this.setState({cropping : false});
                                    } else {
                                        this.setState({cropping : true});
                                    }
                                }.bind(this)}
                        />
                        { this.state.cropping
                            ?
                            <span>
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
                           this.state.imageMarkup ?
                            <FreeMathModal
                                closeModal={function() {
                                            this.setState({imageMarkup: false});
                                        }.bind(this)}
                                showModal={this.state.imageMarkup}
                                content={(
                                        <div style={{display:"inline-block"}}>
                                            <Button className="extra-long-problem-action-button fm-button"
                                                    text={this.state.imageMarkup ?
                                                        "Save Drawing" : "Draw on Image" }
                                                    title={this.state.imageMarkup ?
                                                        "Save Drawing" : "Draw on Image" }
                                                    onClick={function() {
                                                        if (this.state.imageMarkup) {
                                                            saveDrawing();
                                                        } else {
                                                            openDrawing();
                                                        }
                                                    }.bind(this)}
                                            />
                                            <Button className="extra-long-problem-action-button fm-button"
                                                text="Cancel"
                                                onClick={function() {
                                                    this.setState({imageMarkup: false});
                                                }.bind(this)} />
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
                                                    width: (windowWidth - 200) + 'px',
                                                    height: (windowHeight - 100) + 'px'
                                                  },
                                                  menuBarPosition: 'top',
                                                  theme:whiteTheme
                                                }}
                                                cssMaxWidth={(windowWidth - 250)}
                                                cssMaxHeight={(windowHeight - 350)}
                                                selectionStyle={{
                                                  cornerSize: 15,
                                                  cornerColor: 'green',
                                                  rotatingPointOffset: 70
                                                }}
                                                usageStatistics={false}
                                                defaultColor={'#000000'}
                                              />
                                            </div>
                                    )
                                } />
                            :
                            <span>
                                <Button className="long-problem-action-button fm-button"
                                        text="Rotate Left"
                                        title={step[FABRIC_SRC] ? "Cannot rotate after drawing on an image" : "Rotate image left"}
                                        disabled={step[FABRIC_SRC]}
                                        onClick={function() { rotate(270);}}
                                />
                                <Button className="long-problem-action-button fm-button"
                                        text="Rotate Right"
                                        title={step[FABRIC_SRC] ? "Cannot rotate after drawing on an image" : "Rotate image left"}
                                        disabled={step[FABRIC_SRC]}
                                        onClick={function() { rotate(90);}}
                                />
                                <br />
                                <img src={step[CONTENT]} alt="Uploaded student work"
                                     style={{margin : "10px", minWidth: "380px", maxWidth:"98%"}}/>
                                { step[CONTENT] !== ''
                                    ?
                                        <div style={{maxWidth: "95%"}}>
                                        If your final answer is a number or expression, type it in the final box below.<br />
                                        Otherwise you can just move to the next problem.
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
        const buttonGroup = this.props.buttonGroup;
        const steps = this.props.value[STEPS];
        return (
            <div>
            <div className="problem-container" style={{display:"inline-block", width:"95%", float:'none'}}>
                <div>
                    <div className="problem-editor-buttons"
                         style={{float:'left', marginRight:"10px", marginBottom: "30px"}}>

                        {/*   score !== undefined ? (<ScoreBox value={this.props.value} />)
                                               : null
                        */}
                        {   this.props.value[FEEDBACK] !== undefined
                                ? (<div className="answer-partially-correct">
                                        <b>{this.props.value[FEEDBACK] === "" ? 'No' : ''} Teacher Feedback</b><br />
                                        {this.props.value[FEEDBACK]}
                                   </div>) : null
                        }

                        <div style={{display:"block", marginLeft:"10px"}}>
                            <small style={{marginRight: "10px"}}>Problem Number</small>
                            <input type="text" style={{width: "95px"}}
                                   value={probNumber} className="problem-number"
                                   onChange={
                                        function(evt) {
                                            window.store.dispatch({ type : SET_PROBLEM_NUMBER, PROBLEM_INDEX : problemIndex,
                                                    NEW_PROBLEM_NUMBER : evt.target.value}) }}
                            /> <br />
                        </div>
                        <br />
                        <Button text="Next Step (Enter)" className="long-problem-action-button fm-button" onClick={
                            function() {
                                window.store.dispatch(
                                    { type : NEW_STEP, PROBLEM_INDEX : problemIndex})
                            }}/>
                        <Button text="New Blank Step" className="long-problem-action-button fm-button" onClick={
                            function() {
                                window.store.dispatch(
                                    { type : NEW_BLANK_STEP, PROBLEM_INDEX : problemIndex});
                            }}/>
                        <div style={{display:'inline-block'}}>
                        <Button text="Undo" className="short-problem-action-button fm-button" onClick={
                            function() {
                                window.store.dispatch(
                                    { type : UNDO, PROBLEM_INDEX : problemIndex})
                            }}/>
                        <Button text="Redo" className="short-problem-action-button fm-button" onClick={
                            function() {
                                window.store.dispatch(
                                    { type : REDO, PROBLEM_INDEX : problemIndex})
                            }}/>
                        </div>
                        <Button type="submit" className="long-problem-action-button fm-button" text="Clone Problem"
                                title="Make a copy of this work, useful if you need to reference it while trying another solution path."
                                onClick={function() {
                                    window.store.dispatch({ type : CLONE_PROBLEM, PROBLEM_INDEX : problemIndex}) }}
                        />
                    </div>
                        <div className="equation-list" style={{paddingBottom:"150px"}}>
                        {<ImageUploader problemIndex={problemIndex} value={this.props.value}/>}
                        <br />

                        {steps.map(function(step, stepIndex) {
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
                                        <span>Grab your notebook or worksheet. Click the button above that says "Snap a Picture"
                                              to take a picture of some math work on the sheet of paper using your webcam
                                              or device camera.</span>
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
                                    {<select
                                        value={step[FORMAT]}
                                        onChange={function(evt) {
                                            window.store.dispatch({
                                                type : EDIT_STEP,
                                                PROBLEM_INDEX : problemIndex,
                                                FORMAT : evt.target.value,
                                                STEP_KEY : stepIndex,
                                                NEW_STEP_CONTENT : (evt.target.value === IMG || step[FORMAT] === IMG) ? '' : step[CONTENT]
                                            });
                                        }}>
                                        <option value="MATH">Math</option>
                                        <option value="TEXT">Text</option>
                                        <option value="IMG">Image</option>
                                    </select>}
                                    <HtmlButton title='Insert step above'
                                        content={(
                                            <img src="images/add_above.png" alt="x"/>
                                        )}
                                        onClick={function(value) {
                                            window.store.dispatch(
                                                { type : INSERT_STEP_ABOVE, PROBLEM_INDEX : problemIndex,
                                                  STEP_KEY : stepIndex});
                                    }}/>
                                </div>&nbsp;
                                { step[FORMAT] === IMG
                                    ?
                                        <ImageStep value={value} id={problemIndex} stepIndex={stepIndex} step={step} />
                                    :
                                    step[FORMAT] === TEXT ?
                                        (
                                            <textarea value={step[CONTENT]}
                                                style={{...styles, margin : "10px"}}
                                                className="text-step-input"
                                                rows="4"
                                                onChange={
                                                    function(evt) {
                                                        window.store.dispatch({
                                                            type : EDIT_STEP,
                                                            PROBLEM_INDEX : problemIndex,
                                                            STEP_KEY : stepIndex,
                                                            FORMAT : TEXT,
                                                            NEW_STEP_CONTENT : evt.target.value});
                                                    }}
                                                onKeyDown={function(evt) {
                                                        if(evt.key === 'Enter') {
                                                            window.store.dispatch(
                                                                { type : NEW_BLANK_STEP,
                                                                  STEP_KEY : stepIndex,
                                                                  PROBLEM_INDEX : problemIndex
                                                                });
                                                            evt.preventDefault();
                                                        }
                                                    }
                                                }
                                            />
                                        )
                                    :
                                    <MathInput
                                        key={stepIndex} buttonsVisible='focused'
                                        className="mathStepEditor"
                                        styles={{...styles, overflow: 'auto'}}
                                        buttonSets={['trig', 'prealgebra',
                                                     'logarithms', 'calculus']}
                                        buttonGroup={buttonGroup}
                                        stepIndex={stepIndex}
                                        problemIndex={problemIndex} value={step[CONTENT]} onChange={
                                            function(value) {
                                                window.store.dispatch({
                                                type : EDIT_STEP,
                                                PROBLEM_INDEX : problemIndex,
                                                STEP_KEY : stepIndex,
                                                FORMAT : MATH,
                                                NEW_STEP_CONTENT : value});
                                        }}
                                        onSubmit={function() {
                                            window.store.dispatch(
                                                { type : NEW_STEP,
                                                  STEP_KEY : stepIndex,
                                                  PROBLEM_INDEX : problemIndex});
                                        }}
                                    />
                                }
                                <CloseButton text="&#10005;" title='Delete step'
                                    onClick={function(value) {
                                        window.store.dispatch(
                                            { type : DELETE_STEP, PROBLEM_INDEX : problemIndex,
                                              STEP_KEY : stepIndex});
                                    }}/>
                                </div>
                                </div>
                                <div style={{"clear":"both"}} />
                            </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            {showTutorial ?
                (<div>
                    <div className="answer-partially-correct"
                      style={{display:"inline-block", padding:"5px", margin: "5px"}}>
                    <span>Scroll to the top of the page and click on the blue button labelled "Problem Image Demo", to learn about
                          adding images to your documents.</span>
                    </div>
                </div>
                ) : null}
            {showImgTutorial ?
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
                type : EDIT_STEP, STEP_KEY: action[STEP_KEY],
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
                     FABRIC_SRC : action[FABRIC_SRC],
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
                type : INSERT_STEP_ABOVE, STEP_KEY: action[STEP_KEY],
                CONTENT : problem[STEPS][action[STEP_KEY]][CONTENT],
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
        var newFormat = undefined;
        // non-blank inserations in the middle of work currently only used for undo/redo
        if (CONTENT in action) {
            newContent = action[CONTENT]
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
                { CONTENT : newContent, FORMAT: newFormat, STEP_ID : genID()},
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
        return {...ret,
                UNDO_STACK : problem[UNDO_STACK].slice(1, problem[UNDO_STACK].length),
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

export { Problem as default, ScoreBox, problemReducer, problemListReducer, addNewImage, addImageToEnd };
