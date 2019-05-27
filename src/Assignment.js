import React from 'react';
import createReactClass from 'create-react-class';
import ReactDOM from 'react-dom';
import './App.css';
import Problem from './Problem.js';
import { problemListReducer } from './Problem.js';
import { MathEditorHelp } from './MathEditorHelpModal.js';
import Button from './Button.js';

var MathQuill = window.MathQuill;

// editing assignmnt mode actions
const UNTITLED_ASSINGMENT = 'Untitled Assignment';

var PROBLEMS = 'PROBLEMS';
// student assignment actions
var ADD_PROBLEM = 'ADD_PROBLEM';
var ADD_DEMO_PROBLEM = 'ADD_DEMO_PROBLEM';

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

var Assignment = createReactClass({
    getInitialState () {
            return { showModal: false };
    },

    toggleModal() {
        this.setState({ showModal: !this.state.showModal});
    },
    render: function() {
        var defaultEqtn = "4-9\\left(\\frac{2}{3}\\right)^2+\\frac{4}{5-3\\cdot 4}";
        return (
        <div style={{backgroundColor:"#f9f9f9", padding:"30px 30px 30px 30px"}}>
            <div>
            {this.props.value[PROBLEMS].map(function(problem, problemIndex) {
                return (
                  <Problem value={problem} key={problemIndex} id={problemIndex}/>
                );
            })}
            </div>
            <Button text="Add Problem" onClick={function() { window.store.dispatch({ type : ADD_PROBLEM}); }} />
            <br />
            <br />
            <br />
            <Button onClick={this.toggleModal} text={this.state.showModal ? "Hide symbol list" : "Show available symbol list" } />
            {this.state.showModal ? <MathEditorHelp /> : null }
        </div>
      )
    },
    componentDidMount: function() {
        MathQuill.StaticMath(ReactDOM.findDOMNode(this.exampleStaticMath));
    }
});

export { Assignment as default, assignmentReducer };
