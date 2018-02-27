import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Modal } from 'react-overlays';
import logo from './logo.svg';
import './App.css';
import MathInput from './MathInput.js';
import TeX from './TeX.js';
import Problem from './Problem.js';
import { problemReducer } from './Problem.js';
import { problemListReducer } from './Problem.js';
import { MathEditorHelp } from './MathEditorHelpModal.js';

var MathQuill = window.MathQuill;
var Khan = window.Khan;
var MathJax = window.MathJax;
var katex = window.katex;
var katexA11y = window.katexA11y;

var JSZip = window.JSZip ;
var $ = window.$;
var KAS = window.KAS;
var JsDiff = window.JsDiff;
var Chart = window.Chart;
var saveAs = window.saveAs;

// editing assignmnt mode actions
var SET_ASSIGNMENT_NAME = 'SET_ASSIGNMENT_NAME';
const UNTITLED_ASSINGMENT = 'Untitled Assignment';

var PROBLEMS = 'PROBLEMS';
// student assignment actions
var ADD_PROBLEM = 'ADD_PROBLEM';

// reducer for an overall assignment
function assignmentReducer(state, action) {
    if (state === undefined) {
        return {
            ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
            PROBLEMS : problemListReducer(undefined, action)
        };
    } else {
        return { ...state,
                 PROBLEMS : problemListReducer(state[PROBLEMS], action)
        };
    }
}

var Assignment = React.createClass({
	getInitialState () {
		return { showModal: false };
	},

    toggleModal() {
        this.setState({ showModal: !this.state.showModal});
    },
    render: function() {

		var defaultEqtn = "4-9\\left(\\frac{2}{3}\\right)^2+\\frac{4}{5-3\\cdot 4}";
		return (
        <div style={{backgroundColor:"white", padding:"30px 30px 30px 30px"}}>
        <p>Free Math allows you to complete your math homework on your computer. The first problem has been created for you,
           use the box below to write an equation. When you want to modify it to solve your math problem click
           the "next step" button to copy your expression or equation and edit it on the next line to show your work.
           This tool is designed to take care of some of the busywork of math, which makes it easier to record all
           of your thinking without a bunch of manual copying.</p>

        <p> For example, try typing to following expression and simplifying it, even if you can do
        parts of it in your head, use the tool to make sure you show your work.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        </p>
		<span ref={(input) => { this.exampleStaticMath = input; }}>{defaultEqtn}</span>
        <button onClick={this.toggleModal}>{this.state.showModal ? "Hide symbol list" : "Show available symbol list below" }</button>

        <div>
        {this.props.value[PROBLEMS].map(function(problem, problemIndex) {
            return (
              <Problem value={problem} key={problemIndex} id={problemIndex}/>
            );
        })}
        </div>
        <button onClick={function() { window.store.dispatch({ type : ADD_PROBLEM}); }}>Add Problem</button>
        <br />
        <br />
        <br />
        <button onClick={this.toggleModal}>{this.state.showModal ? "Hide symbol list" : "Show available symbol list" }</button>
        {this.state.showModal ? <MathEditorHelp /> : null }
        </div>
      )
    },
    componentDidMount: function() {
        MathQuill.StaticMath(ReactDOM.findDOMNode(this.exampleStaticMath));
    }
});

export { Assignment as default, assignmentReducer };
