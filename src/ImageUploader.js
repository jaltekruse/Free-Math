import React, { Component } from 'react';
import MathInput from './MathInput.js';
import ReactDOM from 'react-dom';
import Resizer from 'react-image-file-resizer';

var CONTENT = "CONTENT";
var STEPS = 'STEPS';
var FORMAT = "FORMAT";

var ImageUploader = React.createClass({
	render : function() {
                console.log(this.props.value["IMG"]);
                console.log(this.props.value);
		return (<span>
                    upload a picture&nbsp;
                    <input type="file"
                           onChange={function(evt) {
                                var imgFile = evt.target.files[0];
                                if(typeof imgFile === "undefined" || !imgFile.type.match(/image.*/)){
                                        alert("The file is not an image " + imgFile ? imgFile.type : '');
                                        return;
                                }

                                const handleImg = function(imgFile){
                                    var objUrl = window.URL.createObjectURL(imgFile);
                                    var probNumber = this.props.value["PROBLEM_NUMBER"];
                                    var lastStepIndex = this.props.value[STEPS].length - 1;
                                    var lastStep = this.props.value[STEPS][lastStepIndex];
                                    if ((typeof lastStep[FORMAT] === 'undefined' || lastStep[FORMAT] === "MATH") && lastStep[CONTENT] === '') {
                                        window.store.dispatch(
                                            { type : "INSERT_STEP_ABOVE", "PROBLEM_INDEX" : this.props.problemIndex, STEP_KEY: lastStepIndex,
                                              FORMAT: "IMG", CONTENT: objUrl} );
                                    } else {
                                        window.store.dispatch(
                                            { type : "NEW_STEP", "PROBLEM_INDEX" : this.props.problemIndex,
                                              STEP_DATA : {FORMAT: "IMG", CONTENT : objUrl} });
                                        window.store.dispatch(
                                            { type : "NEW_BLANK_STEP", "PROBLEM_INDEX" : this.props.problemIndex });
                                    }
                                }.bind(this);

                                if (imgFile.type.includes("gif")) {
                                    // TODO - check size, as this isn't as easy to scale down, good to set a max of\
                                    // something like 0.5-1MB
                                    handleImg(imgFile);
                                } else {
                                    imgFile = Resizer.imageFileResizer(
                                        imgFile,
                                        800,
                                        800,
                                        'JPEG',
                                        90,
                                        0,
                                        imgFile => {
                                            handleImg(imgFile);
                                        },
                                        'blob'
                                    );
                                }
                            }.bind(this)}
                        />
                        <br />
		</span>);
	}
});

export default ImageUploader;
