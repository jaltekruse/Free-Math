import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import logo from './logo.svg';
import './App.css';
import MathInput from './MathInput.js';
import TeX from './TeX.js';
import Problem from './Problem.js';
import { problemReducer } from './Problem.js';

var MathQuill = window.MathQuill;
var Khan = window.Khan;
var MathJax = window.MathJax;
var katex = window.katex;
var _ = window._;
var katexA11y = window.katexA11y;

var JSZip = window.JSZip ;
var $ = window.$;
var KAS = window.KAS;
var JsDiff = window.JsDiff;
var Chart = window.Chart;
var saveAs = window.saveAs;

var PROBLEMS = 'PROBLEMS';
// student assignment actions
var ADD_PROBLEM = 'ADD_PROBLEM';

var Assignment = React.createClass({
    render: function() {
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

        <h3>Math editor help</h3>
        <table>
            <thead>
            <tr><th>Type this&nbsp;&nbsp;&nbsp;</th><th>Symbol</th></tr>
            </thead>
            <tbody>
            <tr><td>pi</td><td><TeX>{"\\pi"}</TeX></td></tr>
            <tr><td>sqrt</td><td><TeX>{"\\sqrt{x}"}</TeX></td></tr>
            <tr><td>int</td><td><TeX>\int</TeX></td></tr>
            <tr><td>union</td><td><TeX>\cup</TeX></td></tr>
            <tr><td>sum</td><td><TeX>{"\\sum_{ }^{ }"}</TeX></td></tr>
            <tr><td>/ (slash)</td><td><TeX>{"\\frac{a}{b}"}</TeX></td></tr>
            <tr><td>&gt;=</td><td><TeX>\ge</TeX></td></tr>
            <tr><td>&lt;=</td><td><TeX>\le</TeX></td></tr>
            <tr><td>_ (underscore)</td><td><span ref="exampleStaticMath">a_1</span>  (subscript)</td></tr>
            <tr><td>^</td><td><span ref="exampleStaticMath2">a^b</span> (superscript / power)</td></tr>
            <tr><td>\pm + [enter]</td><td><TeX>\pm</TeX></td></tr>
            </tbody>
        </table>

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

    componentDidMount: function() {
        MathQuill.StaticMath(ReactDOM.findDOMNode(this.refs.exampleStaticMath));
        MathQuill.StaticMath(ReactDOM.findDOMNode(this.refs.exampleStaticMath2));
    }
    ,
});

export { Assignment as default };
