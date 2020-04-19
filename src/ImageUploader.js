import React, { Component } from 'react';
import MathInput from './MathInput.js';
import ReactDOM from 'react-dom';
import { addNewImage } from './Problem.js';
import Resizer from 'react-image-file-resizer';

var CONTENT = "CONTENT";
var STEPS = 'STEPS';
var FORMAT = "FORMAT";

var ImageUploader = React.createClass({
	render : function() {
        const problemIndex = this.props.problemIndex;
        const steps = this.props.value[STEPS];
		return (<span>
                    upload a picture&nbsp;
                    <input type="file"
                           onChange={function(evt) {
                                var lastStepIndex = steps.length - 1;
                                addNewImage(evt, steps, lastStepIndex, problemIndex)
                           }}/>
		</span>);
	}
});

export default ImageUploader;
