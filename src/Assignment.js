import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import _ from 'underscore';
import { Modal } from 'react-overlays';
import logo from './logo.svg';
import './App.css';
import MathInput from './MathInput.js';
import TeX from './TeX.js';
import Problem from './Problem.js';
import { problemReducer } from './Problem.js';
import { problemListReducer } from './Problem.js';

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
    } else if (action.type === SET_ASSIGNMENT_NAME) {
        return { ...state,
                  ASSIGNMENT_NAME : action.ASSIGNMENT_NAME
        }
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

    closeModal() {
        this.setState({ showModal: false });
    },

    openModal() {
        this.setState({ showModal: true });
    },

    render: function() {
		const modalStyle = {
			position: 'fixed',
			zIndex: 1040,
			top: 0, bottom: 0, left: 0, right: 0
		};

		const backdropStyle = {
			...modalStyle,
			zIndex: 'auto',
			backgroundColor: '#000',
			opacity: 0.5
		};

		const dialogStyle = function() {
		  let top = 50;
		  let left = 50;

		  return {
			position: 'absolute',
			width: 800,
			top: top + '%', left: left + '%',
			transform: `translate(-${top}%, -${left}%)`,
			border: '1px solid #e5e5e5',
			backgroundColor: 'white',
			boxShadow: '0 5px 15px rgba(0,0,0,.5)',
			padding: 20
		  };
		};
		console.log(this);
		console.log(this.state);

		var defaultEqtn = "4-9\\left({2}\\over{3}\\right)^2+\\frac{4}{5-3\\cdot 4}";
		return (
        <div id="assignment-container">
        <p>Free Math allows you to complete your math homework on your computer. The first problem has been created for you,
           use the box below to write an equation. When you want to modify it to solve your math problem click
           the "next step" button to copy your expression or equation and edit it on the next line to show your work.
           This tool is designed to take care of some of the busywork of math, which makes it easier to record all
           of your thinking without a bunch of manual copying.</p>

        <p> For example, try typing to following expression and simplifying it, even if you can do
        parts of it in your head, use the tool to make sure you show your work.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        </p>
        <TeX>{defaultEqtn}</TeX>

        <h3>Math editor help &nbsp;&nbsp;<button onClick={this.openModal}>Open</button></h3>
        <Modal
          aria-labelledby='modal-label'
          show={this.state.showModal}
          onHide={this.closeModal}
          style={modalStyle}
          backdropStyle={backdropStyle}
        >
          <div style={dialogStyle()} >
			<div style={{display:"inline-block"}}>
			<div style={{float:"left"}}>
			<table>
				<thead>
				<tr><th>Type this&nbsp;&nbsp;&nbsp;</th><th>Symbol</th></tr>
				</thead>
				<tbody>
				<tr><td>/ (slash)</td><td><TeX>{"\\frac{a}{b}"}</TeX></td></tr>
				<tr><td>pi</td><td><TeX>{"\\pi"}</TeX></td></tr>
				<tr><td>sqrt</td><td><TeX>{"\\sqrt{x}"}</TeX></td></tr>
				<tr><td>&gt;=</td><td><TeX>\ge</TeX></td></tr>
				<tr><td>&lt;=</td><td><TeX>\le</TeX></td></tr>
				<tr><td>_ (underscore)</td><td><span ref="exampleStaticMath">a_b</span>  (subscript)</td></tr>
				<tr><td>^</td><td><span ref="exampleStaticMath2">a^b</span> (superscript / power)</td></tr>
				<tr><td>\pm + [enter]</td><td><TeX>\pm</TeX></td></tr>
				<tr><td>int</td><td><TeX>\int</TeX></td></tr>
				<tr><td>union</td><td><TeX>\cup</TeX></td></tr>
				<tr><td>\intersect + [enter]</td><td><TeX>\cap</TeX></td></tr>
				<tr><td>subset</td><td><TeX>\subset</TeX></td></tr>
				<tr><td>superset</td><td><TeX>\supset</TeX></td></tr>
				<tr><td>sum</td><td><TeX>{"\\sum_{ }^{ }"}</TeX></td></tr>
				</tbody>
			</table>
			</div>
			<div style={{float:"left"}}>
			<table>
				<thead>
				<tr><th>Type this&nbsp;&nbsp;&nbsp;</th><th>Symbol</th></tr>
				</thead>
				<tbody>
				<tr><td>forall</td><td><TeX>\forall</TeX></td></tr>
				<tr><td>therefore</td><td><TeX>\therefore</TeX></td></tr>
				<tr><td>exists</td><td><TeX>\exists</TeX></td></tr>
				<tr><td>\in [enter]</td><td><TeX>\in</TeX></td></tr>
				<tr><td>alpha</td><td><TeX>\alpha</TeX></td></tr>
				<tr><td>beta</td><td><TeX>\beta</TeX></td></tr>
				<tr><td>gamma</td><td><TeX>\gamma</TeX></td></tr>
				<tr><td>\Gamma [enter]</td><td><TeX>\Gamma</TeX></td></tr>
				<tr><td>delta</td><td><TeX>\delta</TeX></td></tr>
				<tr><td>\Delta [enter]</td><td><TeX>\Delta</TeX></td></tr>
				<tr><td>epsilon</td><td><TeX>\epsilon</TeX></td></tr>
				<tr><td>digamma</td><td><TeX>\digamma</TeX></td></tr>
				<tr><td>zeta</td><td><TeX>\zeta</TeX></td></tr>
				<tr><td>eta</td><td><TeX>\eta</TeX></td></tr>
				<tr><td>theta</td><td><TeX>\theta</TeX></td></tr>
				<tr><td>\Theta [enter]</td><td><TeX>\Theta</TeX></td></tr>
				</tbody>
			</table>
			</div>
			</div>
				{/* subset superset union intersect forall therefore implies exists alpha beta gamma delta epsilon digamma zeta eta theta iota kappa lambda xikappa lambda mu nu omicron pi rho sigma tau upsilon phi chi omega sqrt sum int*/}
			</div>
		</Modal>

        <div>
        {this.props.value[PROBLEMS].map(function(problem, problemIndex) {
            return (
              <Problem value={problem} key={problemIndex} id={problemIndex}/>
            );
        })}
        </div>
        <button onClick={function() { window.store.dispatch({ type : ADD_PROBLEM}); }}>Add Problem</button>
        </div>
      )
    },

    componentDidUpdate: function() {
        MathQuill.StaticMath(ReactDOM.findDOMNode(this.refs.exampleStaticMath));
        MathQuill.StaticMath(ReactDOM.findDOMNode(this.refs.exampleStaticMath2));
    }
    ,
});

export { Assignment as default, assignmentReducer };
