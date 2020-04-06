import React, { Component } from 'react';
import MathInput from './MathInput.js';
import ReactDOM from 'react-dom';

var ImageUploader = React.createClass({
	getInitialState () {
		return { image : null};
	},
	render : function() {
                console.log(this.props.value["IMG"]);
                console.log(this.props.value);
		return (<span>
                        upload picture of written work <input type="file" ref="chooseFile" id="open-file-input" />
                        <br />
                    { /* <canvas style={{float :"inline-block"}} ref="canvas"></canvas> */}
                    { this.props.value["IMG"] ?
                            (<div><img src={this.props.value["IMG"]} />
                                  <br /> Type your final answer below </div>) : null }
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
                    window.store.dispatch(
                        { type : "SET_PROBLEM_IMG", "PROBLEM_INDEX" : this.props.problemIndex,
                          "NEW_IMG" : objUrl})
                }.bind(this));
	}
});

export default ImageUploader; 
