import React, { Component } from 'react';
import MathInput from './MathInput.js';
import ReactDOM from 'react-dom';

var ImageUploader = React.createClass({
	getInitialState () {
		return { image : null};
	},
	render : function() {

		return (<div>
                        <p>
                        Upload picture of written work <input type="file" ref="chooseFile" id="open-file-input" />
                        </p>
                        <br />
			<canvas style={{float :"inline-block"}} ref="canvas"></canvas>
		</div>);
	},

    	componentDidMount: function() {
            var MAX_HEIGHT = 300;
            var render = function(src){
                    var img = new Image();
                    img.onload = function(){
                            if(img.height > MAX_HEIGHT) {
                                    img.width *= MAX_HEIGHT / img.height;
                                    img.height = MAX_HEIGHT;
                            }
                            var imgDiv = ReactDOM.findDOMNode(this.refs.canvas);
                            var ctx = this.refs.canvas.getContext("2d");
                            ctx.clearRect(0, 0, this.refs.canvas.width, this.refs.canvas.height);
                            this.refs.canvas.width = img.width;
                            this.refs.canvas.height = img.height;
                            ctx.drawImage(img, 0, 0, img.width, img.height);
                    }.bind(this);
                    img.src = src;
            }.bind(this);

            var chooseFile = ReactDOM.findDOMNode(this.refs.chooseFile);
            chooseFile.addEventListener("change", 
                function(evt) {
                    var imgFile = evt.target.files[0];
                    if(!imgFile.type.match(/image.*/)){
                            alert("The dropped file is not an image: " + imgFile.type);
                            return;
                    }

                    var reader = new FileReader();
                    reader.onload = function(e){
                            render(e.target.result);
                    };
                    reader.readAsDataURL(imgFile);
                });
	}
});

export default ImageUploader; 
