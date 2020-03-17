import React from 'react';
import createReactClass from 'create-react-class';
import ReactDOM from 'react-dom';
import './App.css';
import Problem from './Problem.js';
import { ScoreBox } from './Problem.js';
import { problemListReducer } from './Problem.js';
import Button from './Button.js';
import { CloseButton } from './Button.js';

var MathQuill = window.MathQuill;

// editing assignmnt mode actions
const UNTITLED_ASSINGMENT = 'Untitled Assignment';

var PROBLEMS = 'PROBLEMS';
// student assignment actions
var ADD_PROBLEM = 'ADD_PROBLEM';

var BUTTON_GROUP = 'BUTTON_GROUP';
var STEPS = 'STEPS';
var PROBLEM_NUMBER = 'PROBLEM_NUMBER';
var PROBLEM_INDEX  = 'PROBLEM_INDEX';
var SET_CURRENT_PROBLEM = 'SET_CURRENT_PROBLEM';
var CURRENT_PROBLEM = 'CURRENT_PROBLEM';
var REMOVE_PROBLEM = 'REMOVE_PROBLEM';

var SHOW_TUTORIAL = "SHOW_TUTORIAL";

// reducer for an overall assignment
function assignmentReducer(state, action) {
    if (state === undefined) {
        return {
            ASSIGNMENT_NAME : UNTITLED_ASSINGMENT,
            CURRENT_PROBLEM: 0,
            PROBLEMS : problemListReducer(undefined, action)
        };
    } else if (action.type === SET_CURRENT_PROBLEM) {
        return { ...state,
                 CURRENT_PROBLEM: action[PROBLEM_INDEX]
        };
    } else if (action.type === REMOVE_PROBLEM) {
        return { ...state,
                 PROBLEMS : problemListReducer(state[PROBLEMS], action),
                 CURRENT_PROBLEM: Math.max(0, state[CURRENT_PROBLEM] - 1)
        };
    } else if (action.type === ADD_PROBLEM) {
        return { ...state,
                 PROBLEMS : problemListReducer(state[PROBLEMS], action),
                 CURRENT_PROBLEM: state[PROBLEMS].length
        };

    } else {
        return { ...state,
                 PROBLEMS : problemListReducer(state[PROBLEMS], action)
        };
    }
}

var Assignment = createReactClass({
    render: function() {
        var addProblem = function() {
            var probs = this.props.value[PROBLEMS];
            var lastProb = probs[probs.length - 1];
            window.ga('send', 'event', 'Actions', 'edit', 
                'Add Problem - last problem steps = ', lastProb[STEPS].length);
            window.store.dispatch({ type : ADD_PROBLEM});
        }.bind(this);
        return (
        <div style={{backgroundColor:"#f9f9f9", padding:"30px 30px 30px 30px"}}>
            <div>
            Problem List&nbsp;&nbsp;
            {this.props.value[PROBLEMS].map(function(problem, problemIndex) {
                var probNum = problem[PROBLEM_NUMBER];
                var label;
                if (probNum.trim() !== '') {
                    label = "Problem " + probNum;
                } else {
                    label = "[Need to Set a Problem Number]";
                }
                return (
                    <div style={{display: "inline-block", marginRight: "15px"}}>
                    <ScoreBox value={problem} />
                    <Button text={label} key={problemIndex} id={problemIndex} onClick={
                        function() {
                            window.store.dispatch(
                                {type: SET_CURRENT_PROBLEM, PROBLEM_INDEX: problemIndex})}.bind(this)} />

                    <CloseButton type="submit" text="&#10005;" title="Delete problem" onClick={
                    function() {
                        if (this.props.value[PROBLEMS].length === 1) {
                            alert("Cannot delete the only problem in a document.");
                            return;
                        }
                        if (!window.confirm("Delete problem?")) { return; }
                        window.store.dispatch(
                            { type : REMOVE_PROBLEM, PROBLEM_INDEX : problemIndex}) 
                    }.bind(this)}/>
                    </div>
                );
            }.bind(this))}
            <Button text="Add Problem" style={{backgroundColor: "#008000"}} onClick={function() { 
                addProblem();
            }}/>
            {this.props.value[PROBLEMS][this.props.value[CURRENT_PROBLEM]][SHOW_TUTORIAL] ? 
                (<div className="answer-partially-correct"
                     style={{float: "right", display:"inline-block", padding:"5px", margin: "5px"}}>
                    <span>Work saves to the Downloads folder on your device.</span>
                </div>) :
                null
            }

            <Problem value={this.props.value[PROBLEMS][this.props.value[CURRENT_PROBLEM]]}
                     id={this.props.value[CURRENT_PROBLEM]}
                     buttonGroup={this.props.value[BUTTON_GROUP]}
                     probList={this.props.value[PROBLEMS]}
            />
            </div>
            <div className="answer-incorrect homepage-only-on-mobile" style={{"float":"left", padding:"10px", margin: "10px"}}>
                Note: Limited demo experience available on mobile, visit on your computer for the full experience.
            </div>
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
