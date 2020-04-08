import React, { Component } from 'react';
import MathInput from './MathInput.js';
import ReactDOM from 'react-dom';

var CONTENT = "CONTENT";
var STEPS = 'STEPS';
var FORMAT = "FORMAT";

var ImageUploader = React.createClass({
	getInitialState () {
		return { image : null};
	},
	render : function() {
                console.log(this.props.value["IMG"]);
                console.log(this.props.value);
		return (<span>
                        upload a picture of written work <input type="file" ref="chooseFile" id="open-file-input" />
                        <br />
                    { /* <canvas style={{float :"inline-block"}} ref="canvas"></canvas> */}
		</span>);
	},
    	componentDidMount: function() {

            var chooseFile = ReactDOM.findDOMNode(this.refs.chooseFile);
            chooseFile.addEventListener("change", 
                function(evt) {
                    var imgFile = evt.target.files[0];
                    if(typeof imgFile === "undefined" || !imgFile.type.match(/image.*/)){
                            alert("The file is not an image " + imgFile.type);
                            return;
                    }
                    var objUrl = window.URL.createObjectURL(imgFile);
                    var probNumber = this.props.value["PROBLEM_NUMBER"];
                    var lastStepIndex = this.props.value[STEPS].length - 1;
                    var lastStep = this.props.value[STEPS][lastStepIndex];
                    window.store.dispatch(
                        { type : "NEW_STEP", "PROBLEM_INDEX" : this.props.problemIndex,
                            STEP_DATA : {FORMAT: "IMG", CONTENT : objUrl} });
                    window.store.dispatch(
                        { type : "NEW_BLANK_STEP", "PROBLEM_INDEX" : this.props.problemIndex });

                    // if the previously last step was blank, just remove it to avoid blank boxes in the list
                    if (typeof lastStep[FORMAT] === 'undefined' && lastStep[CONTENT] === '') {
                        window.store.dispatch(
                            { type : "DELETE_STEP", "PROBLEM_INDEX" : this.props.problemIndex, STEP_KEY : lastStepIndex});
                    }
                    //window.store.dispatch(
                    //    { type : "SET_PROBLEM_IMG", "PROBLEM_INDEX" : this.props.problemIndex,
                    //      "NEW_IMG" : objUrl})
                }.bind(this));
	}
});

export default ImageUploader; 
