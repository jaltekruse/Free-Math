import React from 'react';
import createReactClass from 'create-react-class';
import ReactDOM from 'react-dom';
import './App.css';
import Problem from './Problem.js';
import { problemListReducer } from './Problem.js';
import Button from './Button.js';

var MathQuill = window.MathQuill;

// editing assignmnt mode actions
const UNTITLED_ASSINGMENT = 'Untitled Assignment';

var PROBLEMS = 'PROBLEMS';
// student assignment actions
var ADD_PROBLEM = 'ADD_PROBLEM';

var BUTTON_GROUP = 'BUTTON_GROUP';
var STEPS = 'STEPS';

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
    render: function() {

        return (
        <div style={{backgroundColor:"#f9f9f9", padding:"30px 30px 30px 30px"}}>
            <div>
            {this.props.value[PROBLEMS].map(function(problem, problemIndex) {
                return (
                  <Problem value={problem} key={problemIndex}
                    id={problemIndex} buttonGroup={this.props.value[BUTTON_GROUP]}
                    />
                );
            }.bind(this))}
            </div>
            <Button text="Add Problem" onClick={function() { 
                var probs = this.props.value[PROBLEMS];
                var lastProb = probs[probs.length - 1];
                window.ga('send', 'event', 'Actions', 'edit', 
                    'Add Problem - last problem steps = ', lastProb[STEPS].length);
                window.store.dispatch({ type : ADD_PROBLEM}); }.bind(this)} />
            <br />
            <br />
            <br />
            {/* Replaced by better onscreen math keyboard with shortcuts in
                the title text of the buttons
            <Button onClick={this.toggleModal} text={this.state.showModal ? "Hide Symbol List" : "Show Available Symbol List" } />
                this.state.showModal ? <MathEditorHelp /> : null */}
        </div>
      )
    },
    componentDidMount: function() {
        MathQuill.StaticMath(ReactDOM.findDOMNode(this.exampleStaticMath));
    }
});

export { Assignment as default, assignmentReducer };
