import React, { Component } from 'react';
import MathInput from './MathInput.js';

var ImageUploader = React.createClass({
	getInitialState () {
		return { image : null};
	},
	render : function() {

		var MAX_HEIGHT = 100;
		var render = function(src){
			var img = new Image();
			img.onload = function(){
				if(img.height > MAX_HEIGHT) {
					img.width *= MAX_HEIGHT / img.height;
					img.height = MAX_HEIGHT;
				}
				var ctx = this.refs.canvas.getContext("2d");
				ctx.clearRect(0, 0, this.refs.canvas.width, this.refs.canvas.height);
				this.refs.preview.style.width = img.width + "px";
				this.refs.preview.style.height = img.height + "px";
				this.refs.canvas.width = img.width;
				this.refs.canvas.height = img.height;
				ctx.drawImage(img, 0, 0, img.width, img.height);
			};
			img.src = src;
		};

		var readImage = function(imgFile){
			if(!imgFile.type.match(/image.*/)){
				alert("The dropped file is not an image: " + imgFile.type);
				return;
			}

			var reader = new FileReader();
			reader.onload = function(e){
				render(e.target.result);
			};
			reader.readAsDataURL(imgFile);
		};
		return (<div>
			<br />
			<br />
			<div id="dropTarget" ondrop={function(e){
				alert("preventing default");
				e.preventDefault(); 
				readImage(e.dataTransfer.files[0]);
			}} dragover={function(e) {e.preventDefault();}}>
			Drop image here</div>
			<div ref="preview">
			</div>
			<canvas ref="canvas"></canvas>
		</div>);
	},

    	componentDidMount: function() {
	}
	/*
	 	require(["dojo/dom", "dojo/domReady!"], function(dom){
		var target = document.getElementById("drop-target"),
		var preview = document.getElementById("preview"),
		var canvas = document.getElementById("canvas");


		//	DOMReady setup
		target.addEventListener("dragover", function(e) {e.preventDefault();}, true);
		target.addEventListener("drop", function(e){
			e.preventDefault(); 
			readImage(e.dataTransfer.files[0]);
		}, true);
	 */

});

export default ImageUploader; 
