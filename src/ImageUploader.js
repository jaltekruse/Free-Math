import React, { Component } from 'react';
import MathInput from './MathInput.js';
import ReactDOM from 'react-dom';

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
                            }.bind(this)}
                        />
                        <br />
		</span>);
	}
});

export default ImageUploader;
