import React from 'react';
import createReactClass from 'create-react-class';
import './App.css';
import MathInput from './MathInput.js';

// to implement undo/redo and index for the last step
// to show is tracked and moved up and down
// when this is not at the end of the list and a new
// step is added it moves to the end of the list as
// the redo history in this case will be lost

var STEP_KEY = 'STEP_KEY';

// student assignment actions
var ADD_PROBLEM = 'ADD_PROBLEM';
var ADD_DEMO_PROBLEM = 'ADD_DEMO_PROBLEM';

// remove problem expects an "index" property
// specifying which problem to remove
var REMOVE_PROBLEM = 'REMOVE_PROBLEM';
var CLONE_PROBLEM = 'CLONE_PROBLEM';

// this action expects:
// PROBLEM_INDEX - for which problem to change
// NEW_PROBLEM_NUMBER - string with problem number, not a numberic
//                    type because the problem might be 1.a, etc.
var NEW_PROBLEM_NUMBER = 'NEW_PROBLEM_NUMBER';
var SET_PROBLEM_NUMBER = 'SET_PROBLEM_NUMBER';
var CONTENT = "CONTENT";

var SUCCESS = 'SUCCESS';
var ERROR = 'ERROR';
var HIGHLIGHT = 'HIGHLIGHT';
var STEPS = 'STEPS';
var LAST_SHOWN_STEP = 'LAST_SHOWN_STEP';
var SCORE = "SCORE";
var FEEDBACK = "FEEDBACK";
var SHOW_TUTORIAL = "SHOW_TUTORIAL";

var NEW_STEP = 'NEW_STEP';
// this action expects an index for which problem to change
var UNDO_STEP = 'UNDO_STEP';
// this action expects an index for which problem to change
var REDO_STEP = 'REDO_STEP';

// this action expects:
// PROBLEM_INDEX - for which problem to change
// STEP_KEY - index into the work steps for the given problem
// NEW_STEP_CONTENT - string for the new expression to write in this step
var EDIT_STEP = 'EDIT_STEP';
var POSSIBLE_POINTS = "POSSIBLE_POINTS";
var PROBLEM_NUMBER = 'PROBLEM_NUMBER';

// CSS constants
var SOFT_RED = '#FFDEDE';
var GREEN = '#2cff72';

var Problem = createReactClass({

    handleStepChange: function(event) {
      this.setState({value: event.target.value});
    },
    render: function() {
        var probNumber = this.props.value[PROBLEM_NUMBER];
        var problemIndex = this.props.id;
        var lastShownStep = this.props.value[LAST_SHOWN_STEP];
        var scoreClass = undefined;
        var score = this.props.value[SCORE];
        var possiblePoints = this.props.value[POSSIBLE_POINTS];
        var showTutorial = this.props.value[SHOW_TUTORIAL];
        if (score === '') {
            scoreClass = 'show-complete-div';
        } else if (score === possiblePoints) {
            scoreClass = 'show-correct-div';
        } else if (score === 0) {
            scoreClass = 'show-incorrect-div';
        } else {
            scoreClass = 'show-partially-correct-div';
        }

        var scoreMessage = null;
        if (score === '')
                scoreMessage = 'Complete';
        else if (score !== undefined)
                scoreMessage = 'Score: ' + score + ' / ' + possiblePoints;
        return (
            <div className="problem-container" style={{float:'none',overflow: 'scroll'}}>
                <div style={{width:"200", height:"100%",float:"left"}}>
                    {   score !== undefined ? (<div className={scoreClass}>{scoreMessage}</div>)
										   : null
                    }
                    {   this.props.value[FEEDBACK] !== undefined
                            ? (<div>
                                    Feedback:<br /> {this.props.value[FEEDBACK]}
                               </div>) : null
                    }
                </div>
                <div>
                    <div>
                        Problem number <input type="text" value={probNumber} className="problem-number" onChange={
                        function(evt) { window.store.dispatch({ type : SET_PROBLEM_NUMBER, PROBLEM_INDEX : problemIndex,
                                        NEW_PROBLEM_NUMBER : evt.target.value}) }}/> &nbsp;&nbsp;&nbsp;
                        <input type="submit" value="Clone Problem"
                                        title="Make a copy of this work, useful if you need to reference it while trying another solution path." onClick={
                        function() { window.store.dispatch({ type : CLONE_PROBLEM, PROBLEM_INDEX : problemIndex}) }}/>&nbsp;&nbsp;&nbsp;
                        <input type="submit" value="x" title="Delete problem" onClick={
                        function() { if (!window.confirm("Delete problem?")) { return; }
                                     window.store.dispatch({ type : REMOVE_PROBLEM, PROBLEM_INDEX : problemIndex}) }}/>
                    </div>
                    <div style={{float:'left'}}>
                        <p> Actions </p>
                        <input type="submit" name="next step" value="Next step (Enter)" onClick={
                            function() { window.store.dispatch({ type : NEW_STEP, PROBLEM_INDEX : problemIndex}) }}/> <br/>
                        <input type="submit" name="undo step" value="Undo step" onClick={
                            function() { window.store.dispatch({ type : UNDO_STEP, PROBLEM_INDEX : problemIndex}) }}/> <br/>
                        <input type="submit" name="redo step" value="Redo step" onClick={
                            function() { window.store.dispatch({ type : REDO_STEP, PROBLEM_INDEX : problemIndex}) }}/>
                    </div>
                        <div style={{float:'left'}} className="equation-list">
                        <p>Type math here</p>
                        {
                        this.props.value[STEPS].map(function(step, stepIndex) {
                            if (stepIndex > lastShownStep) return false;
                            var styles = {};
                            if (step[HIGHLIGHT] === SUCCESS) {
            					styles = {backgroundColor : GREEN };
                            } else if (step[HIGHLIGHT] === ERROR) {
            					styles = {backgroundColor : SOFT_RED};
                            }
                            return (
                            <div>
                                {showTutorial && stepIndex == 0 ? 
                                (<div className="answer-partially-correct"
                                    style={{display:"inline-block", padding:"10px", margin: "10px"}}>
					<span>Click this expression, then press enter.</span></div>) : null}
                                {showTutorial && stepIndex == 1 ? 
                                (<div className="answer-partially-correct"
                                    style={{display:"inline-block", padding:"10px", margin: "10px"}}>
					<span>Edit this line to show part of the work for simplifying this expression, then press enter again.</span></div>) : null}
                                {showTutorial && stepIndex == 2 ? 
                                (<div className="answer-partially-correct"
                                    style={{display:"inline-block", padding:"10px", margin: "10px"}}>
					<span>Repeat until you have reached your solution on the last line you edit.</span></div>) : null}
                                <MathInput 
                                    key={stepIndex} buttonsVisible='focused' styles={styles}
                                    buttonSets={['trig', 'prealgebra',
                                                 'logarithms', 'calculus']}
                                    stepIndex={stepIndex}
                                    problemIndex={problemIndex} value={step[CONTENT]} onChange={
                                        function(value) {
                                            window.store.dispatch({
                                            type : EDIT_STEP,
                                            PROBLEM_INDEX : problemIndex,
                                            STEP_KEY : stepIndex,
                                            NEW_STEP_CONTENT : value});
                                    }}
                                    onSubmit={function() {
                                        window.store.dispatch(
                                            { type : NEW_STEP,
                                              PROBLEM_INDEX : problemIndex});
                                    }}
                                />
                            </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }
});

// reducer for an individual problem
function problemReducer(problem, action) {
    if (problem === undefined) {
        return { PROBLEM_NUMBER : "", STEPS : [{CONTENT : ""}], LAST_SHOWN_STEP : 0};
    } else if (action.type === SET_PROBLEM_NUMBER) {
        return {
            ...problem,
            PROBLEM_NUMBER : action[NEW_PROBLEM_NUMBER]
        };
    } else if (action.type === EDIT_STEP) {
        return {
            ...problem,
            STEPS : [
                ...problem[STEPS].slice(0, action[STEP_KEY]),
                { CONTENT : action.NEW_STEP_CONTENT },
                ...problem[STEPS].slice(action[STEP_KEY] + 1)
            ]
        }
    } else if (action.type === NEW_STEP) {
        var oldLastStep = problem[STEPS][problem[LAST_SHOWN_STEP]];
        return {
            ...problem,
            STEPS : [ ...problem[STEPS].slice(0, problem[LAST_SHOWN_STEP] + 1),
                      {...oldLastStep}
            ],
            LAST_SHOWN_STEP : problem[LAST_SHOWN_STEP] + 1
        };
    } else if (action.type === UNDO_STEP) {
        if (problem[LAST_SHOWN_STEP] === 0) return problem;
        else {
            return { ...problem,
                     LAST_SHOWN_STEP : problem[LAST_SHOWN_STEP] - 1
            };
        }
    } else if (action.type === REDO_STEP) {
        if (problem[LAST_SHOWN_STEP] === problem[STEPS].length - 1) return problem;
        else {
            return { ...problem,
                     LAST_SHOWN_STEP : problem[LAST_SHOWN_STEP] + 1
            };
        }
    } else {
        return problem;
    }
}

// reducer for the list of problems in an assignment
function problemListReducer(probList, action) {
    if (probList === undefined) {
        return [ problemReducer(undefined, action) ];
    }
    if (action.type === ADD_DEMO_PROBLEM) {
        console.log(probList);
        if (probList.length === 1 && probList[0][STEPS][0][CONTENT] === "") {
            probList = [];
        }
        return [
            { ...problemReducer(undefined, action), SHOW_TUTORIAL : true,
                STEPS : [{CONTENT : "4-9\\left(\\frac{2}{3}\\right)^2+\\frac{4}{5-3\\cdot 4}"}]},
            ...probList,
        ];
    } else if (action.type === ADD_PROBLEM) {
        return [
            ...probList,
            problemReducer(undefined, action)
        ];
    } else if (action.type === REMOVE_PROBLEM) {
        return [
            ...probList.slice(0, action.PROBLEM_INDEX),
            ...probList.slice(action.PROBLEM_INDEX + 1)
        ];
    } else if (action.type === CLONE_PROBLEM) {
        var newProb = { ...probList[action.PROBLEM_INDEX],
                        PROBLEM_NUMBER : probList[action.PROBLEM_INDEX][PROBLEM_NUMBER] + ' - copy' };
        return [
            ...probList.slice(0, action.PROBLEM_INDEX + 1),
            newProb,
            ...probList.slice(action.PROBLEM_INDEX + 1)
        ];
    } else if (action.type === SET_PROBLEM_NUMBER ||
               action.type === EDIT_STEP ||
               action.type === UNDO_STEP ||
               action.type === REDO_STEP ||
               action.type === NEW_STEP) {
        return [
            ...probList.slice(0, action.PROBLEM_INDEX),
            problemReducer(probList[action.PROBLEM_INDEX], action),
            ...probList.slice(action.PROBLEM_INDEX + 1)
        ];
    } else {
        return probList;
    }
}

export { Problem as default, problemReducer, problemListReducer };
