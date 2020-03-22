import React from 'react';
import createReactClass from 'create-react-class';
import './App.css';
import MathInput from './MathInput.js';
import Button from './Button.js';
import { HtmlButton, CloseButton } from './Button.js';
import { genID } from './FreeMath.js';

// to implement undo/redo and index for the last step
// to show is tracked and moved up and down
// when this is not at the end of the list and a new
// step is added it moves to the end of the list as
// the redo history in this case will be lost

// index in list
var STEP_KEY = 'STEP_KEY';
// long random identifier for a step, used as key for react list of steps
var STEP_ID = 'STEP_ID';

// student assignment actions
var ADD_PROBLEM = 'ADD_PROBLEM';
var ADD_DEMO_PROBLEM = 'ADD_DEMO_PROBLEM';

// remove problem expects an "index" property
// specifying which problem to remove
var REMOVE_PROBLEM = 'REMOVE_PROBLEM';
var CLONE_PROBLEM = 'CLONE_PROBLEM';

var PROBLEM_INDEX  = 'PROBLEM_INDEX';

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
var SCORE = "SCORE";
var FEEDBACK = "FEEDBACK";
var SHOW_TUTORIAL = "SHOW_TUTORIAL";

var INSERT_STEP_ABOVE = 'INSERT_STEP_ABOVE';
var NEW_STEP = 'NEW_STEP';
var NEW_BLANK_STEP = 'NEW_BLANK_STEP';
// this action expects an index for which problem to change
var UNDO = 'UNDO';
// this action expects an index for which problem to change
var REDO = 'REDO';
var DELETE_STEP = 'DELETE_STEP';
// array of problem editing actions
// TODO - these actions usually have data to specify which problem
// they apply to, but I'm planning on having an undo stack per problem
// I won't be adding these values in the actions as I only expect them
// to be consumed by ths sub-reducers, but this may have an impact
// if I switch to more type-safe action constructors in the future
var UNDO_STACK = 'UNDO_STACK';
var REDO_STACK = 'REDO_STACK';
var INVERSE_ACTION = 'INVERSE_ACTION';
// properties for implementing intuitive undo/redo for mathquill editors, so they act (mostly) like
// the regular text boxes in raw HTML
var ADD = 'ADD';
var DELETE = 'DELETE';
var EDIT_TYPE = 'EDIT_TYPE';
var POS = 'POS';

// this action expects:
// PROBLEM_INDEX - for which problem to change
// STEP_KEY - index into the work steps for the given problem
// NEW_STEP_CONTENT - string for the new expression to write in this step
var EDIT_STEP = 'EDIT_STEP';
var NEW_STEP_CONTENT = 'NEW_STEP_CONTENT';
var POSSIBLE_POINTS = "POSSIBLE_POINTS";
var PROBLEM_NUMBER = 'PROBLEM_NUMBER';

// CSS constants
var SOFT_RED = '#FFDEDE';
var GREEN = '#2cff72';

var ScoreBox = createReactClass({
    render: function() {
        var scoreClass = undefined;
        var score = this.props.value[SCORE];
        var possiblePoints = this.props.value[POSSIBLE_POINTS];
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
            scoreMessage = 'Score ' + score + ' / ' + possiblePoints;
        return (
            <div>
                {  
                    score !== undefined
                        ? (<div className={scoreClass}><b>{scoreMessage}</b></div>)
                        : null
                }
            </div>
        );
    }
});

var Problem = createReactClass({

    handleStepChange: function(event) {
      this.setState({value: event.target.value});
    },
    render: function() {
        var probNumber = this.props.value[PROBLEM_NUMBER];
        var probList = this.props.probList;
        var problemIndex = this.props.id;
        var showTutorial = this.props.value[SHOW_TUTORIAL];
        var buttonGroup = this.props.buttonGroup;
        var score = this.props.value[SCORE];
        return (
            <div>
            <div className="problem-container" style={{display:"inline-block", width:"95%", float:'none'}}>
                <div style={{width:"200", height:"100%",float:"left"}}> 
                    {   score !== undefined ? (<ScoreBox value={this.props.value} />)
                                           : null
                    }
                    {   this.props.value[FEEDBACK] !== undefined
                            ? (<div>
                                    <b>{this.props.value[FEEDBACK] === "" ? 'No' : ''} Teacher Feedback</b><br />
                                    {this.props.value[FEEDBACK]}
                               </div>) : null
                    }
                </div>
                <div>
                    <div className="problem-editor-buttons"
                         style={{float:'left', height: "100%", marginRight:"10px"}}>
                        <div style={{display:"block", marginLeft:"10px"}}>
                            <small>Problem Number</small><br />
                            <input type="text" size="3"
                                   value={probNumber} className="problem-number"
                                   onChange={
                                        function(evt) {
                                            window.store.dispatch({ type : SET_PROBLEM_NUMBER, PROBLEM_INDEX : problemIndex,
                                                    NEW_PROBLEM_NUMBER : evt.target.value}) }}
                            /> <br />
                        </div>
                        <Button text="Next Step (Enter)" style={{width: "125px"}} onClick={
                            function() { window.store.dispatch({ type : NEW_STEP, PROBLEM_INDEX : problemIndex}) }}/>
                        <Button text="New Blank Step" style={{width: "125px"}} onClick={
                            function() {
                                window.store.dispatch(
                                    { type : NEW_BLANK_STEP, PROBLEM_INDEX : problemIndex})
                            }}/>
                        <Button text="Undo" style={{width: "55px"}} onClick={
                            function() {
                                window.store.dispatch(
                                    { type : UNDO, PROBLEM_INDEX : problemIndex})
                            }}/>
                        <Button text="Redo" style={{width: "55px"}} onClick={
                            function() {
                                window.store.dispatch(
                                    { type : REDO, PROBLEM_INDEX : problemIndex})
                            }}/>
                        <Button type="submit" style={{width: "125px"}} text="Clone Problem"
                                title="Make a copy of this work, useful if you need to reference it while trying another solution path."
                                onClick={function() { 
                                    window.store.dispatch({ type : CLONE_PROBLEM, PROBLEM_INDEX : problemIndex}) }}
                        />
                    </div>
                        <div style={{float:'left', maxWidth:"85%"}} className="equation-list">
                        Type math here<br />
                        {
                            this.props.value[STEPS].map(function(step, stepIndex) {
                            var styles = {};
                            if (step[HIGHLIGHT] === SUCCESS) {
                                styles = {backgroundColor : GREEN };
                            } else if (step[HIGHLIGHT] === ERROR) {
                                styles = {backgroundColor : SOFT_RED};
                            }
                            return (
                            <div key={step[STEP_ID]}>
                                {showTutorial && stepIndex === 0 ? 
                                (<div style={{overflow:"hidden"}}>
                                    <div className="answer-partially-correct"
                                         style={{display:"inline-block", "float":"left", padding:"5px", margin: "5px"}}>
                                        <span>Click this expression, then press enter.</span>
                                    </div>
                                </div>) : null}
                                {showTutorial && stepIndex === 1 ? 
                                (<div style={{overflow:"hidden"}}>
                                    <div className="answer-partially-correct"
                                         style={{display:"inline-block", "float":"left", padding:"5px", margin: "5px"}}>
                                        <span>Edit this line to show part of the work for 
                                              simplifying this expression, then press enter again.</span>
                                    </div>
                                </div>) : null}
                                {showTutorial && stepIndex === 2 ? 
                                (<div style={{overflow:"hidden"}}>
                                    <div className="answer-partially-correct"
                                         style={{display:"inline-block", "float":"left", padding:"5px", margin: "5px"}}>
                                        <span>Repeat until you have reached your solution on
                                              the last line you edit.</span></div></div>) : null}
                                <div style={{display:"block"}}>
                                <div style={{"float":"left","display":"inline-block"}}>
                                <HtmlButton title='Insert step above'
                                    content={(
                                        <img src="images/add_above.png" alt="x"/>
                                    )}
                                    onClick={function(value) {
                                        window.store.dispatch(
                                            { type : INSERT_STEP_ABOVE, PROBLEM_INDEX : problemIndex,
                                              STEP_KEY : stepIndex});
                                }}/>
                                <MathInput 
                                    key={stepIndex} buttonsVisible='focused' className="mathStepEditor"
                                    styles={{...styles, overflow: 'auto'}}
                                    buttonSets={['trig', 'prealgebra',
                                                 'logarithms', 'calculus']}
                                    buttonGroup={buttonGroup}
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
                                <CloseButton text="&#10005;" title='Delete step' onClick={
                                    function(value) {
                                        window.store.dispatch(
                                            { type : DELETE_STEP, PROBLEM_INDEX : problemIndex,
                                              STEP_KEY : stepIndex});
                                    }}/>
                                </div>
                                </div>
                                <div style={{"clear":"both"}} />
                            </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            {showTutorial ?
                (<div>
                    <div className="answer-partially-correct"
                      style={{display:"inline-block", padding:"5px", margin: "5px"}}>
                    <span>Scroll to the top of the page and another problem to your document. Copy a problem
                          out of your assignment on the first line, and solve it as you did above.</span>
                    </div>
                </div>
                ) : null}
            </div>
        );
    }
});

/*
 * Designing more complex undo/redo, now that individual steps can be deleted or added in the middle
 * Probably want to get rid of "last shown step" property entirely
 * create serializable commands that can mutate in either direction
 * (can I use the existing redux actions?)
 *
 * Some workflows:
 * edit the first blank line
 *     - add an undo event that sets the field blank
 *
 * add new step
 *     - add undo event for delete step
 *
 * user clicks undo button
 *  - pop off the delete step action
 *  - save a new undo even that will add a step and set it's contents
 *  - perform popped delete action
 *
 * new step button again, then edits the new 2nd step shorter
 *  - put on an undo event that will return the contents to it's original form copied from step 1
 *  - part of me thinks this should happen as soon as a step is copied, but that would make
 *    an undo event do nothing
 *    or unneccessarily add another step
 *      - this should immediately add a "delete step" action as noted above, maybe knowing
 *        what to put on the stack requires inspecting what is currently at the top, if it's
 *        related to the same step it may combine two undo events
 *
 * user inserts step above
 *     - add event to delete the step to undo stack
 *
 * user edits a random step in the middle of the series
 *     - add event to change it back to the original contents
 *     - if they edit the same step again, don't add a new event
 *     - previously when doing this excercise I had played around with a basic text field
 *       and the undo/redo there
 *         - trying this again
 *         - typing into box, ctrl-z -> box goes back to blank
 *         - type into box, stop, type again, -> still clears full box
 *         - type, click elsewhere in box, no edit at new cursor position, click back to end
 *           and edit again
 *             - first undo goes back to what was typed originally, second clears the rest of
 *               the way
 *         - type, delete some text
 *             - first undo restores longest text
 *             - second clears
 *         - more complex
 *             - type aaaaaaaaaaaaaaaaaa
 *             - delete to aaaaaa
 *             - add b's   aaaaaabbbbbbbbb
 *             - delete b's back to aaaaaaa
 *             - add c's    aaaaaaacccccccc
 *             - undo then does:
 *             - aaaaaabbbbbbb
 *             - aaaaaaaaaaaaa
 *             - blank
 *             - analysis, appears recording a past deletion isn't considered important
 *                 - it never re-produced the shorter version, assumes useful things to cover
 *                   longer typed this, not truncation
 *                 - something to keep in mind, some of the keywords are likely longer right
 *                   before they are converted into symbols
 *
 */
// reducer for an individual problem
function problemReducer(problem, action) {
    if (problem === undefined) {
        // TODO - need to convert old docs to add undo stack
        return { PROBLEM_NUMBER : "",
                 STEPS : [{STEP_ID : genID(), CONTENT : ""}],
                 UNDO_STACK : [], REDO_STACK : []};
    } else if (action.type === SET_PROBLEM_NUMBER) {
        return {
            ...problem,
            PROBLEM_NUMBER : action[NEW_PROBLEM_NUMBER]
        };
    } else if (action.type === EDIT_STEP) {
        // if the last action was an edit of this step, don't add an undo
        // event for each character typed, collapse them together. Only create
        // a new undo event if the edit made the text shorter.
        var latestUndo = problem[UNDO_STACK].length > 0 ? problem[UNDO_STACK][0] : false;
        const currContent = problem[STEPS][action[STEP_KEY]][CONTENT];
        const newContent = action[NEW_STEP_CONTENT];

        // "ADD" or "DELETE"
        var editType;
        // position of the add or delete
        var pos;
        var updateLastUndoAction = false;
        // when users type into a textbox, they expect an undo/redo function to remove/add series of characters that were typed/deleted
        // not an individual undo/redo action for each 1 character edit. This functionality is implemented by looking at the
        // type of edit is currently being done, and checking if it should be combined with the last undo event on the stack.
        //
        // Check if this is a single character edit. If it is find its location, and detemine if it is an insertion or deletion
        if (Math.abs(currContent.length - newContent.length) === 1) {
            // find the first mismatching character
            var i = 0;
            for (; i < currContent.length && i < newContent.length; i++) {
                if (newContent.charAt(i) === currContent.charAt(i)) continue;
                else break;
            }

            // inspect the rest of the inputs to determine if this was a single chracter add or delete
            //
            // tricky case to check, highlight multiple characters and paste in the number of chracters that was highlighted
            // this might cause some weird behavior if the strings overlap, but if data is replaced by mostly the same
            // values there really isn't info lost if it acts somewhat like typing the text out in series

            if (newContent.length > currContent.length) {
                // one character addition
                if (i === newContent.length - 1
                        || newContent.substring(i+1) === currContent.substring(i)) {
                    pos = i;
                    editType = ADD;
                    if (latestUndo && latestUndo[INVERSE_ACTION][EDIT_TYPE] === editType
                            && latestUndo[INVERSE_ACTION][POS] === pos - 1) {
                        updateLastUndoAction = true;
                    }
                }
            } else {
                // one character deletion
                if (i === currContent.length - 1
                        || currContent.substring(i+1) === newContent.substring(i)) {
                    pos = i;
                    editType = DELETE;
                    if (latestUndo && latestUndo[INVERSE_ACTION][EDIT_TYPE] === editType
                            && latestUndo[INVERSE_ACTION][POS] === pos + 1) {
                        updateLastUndoAction = true;
                    }
                }
            }
        } else {
            updateLastUndoAction = false;
        }

        let inverseAction = {
            ...action,
            INVERSE_ACTION : {
                type : EDIT_STEP, STEP_KEY: action[STEP_KEY],
                INVERSE_ACTION : {
                    ...action,
                    EDIT_TYPE : editType,
                    POS : pos,
                }
            }
        };
        var newUndoStack;
        if (updateLastUndoAction) {
            inverseAction[INVERSE_ACTION][NEW_STEP_CONTENT] = latestUndo[NEW_STEP_CONTENT];
            let undoAction = {...inverseAction[INVERSE_ACTION]};
            newUndoStack = [
                undoAction,
                ...problem[UNDO_STACK].slice(1)
            ];
        } else {
            inverseAction[INVERSE_ACTION][NEW_STEP_CONTENT] = problem[STEPS][action[STEP_KEY]][CONTENT];
            let undoAction = {...inverseAction[INVERSE_ACTION]};
            newUndoStack = [
                undoAction,
                ...problem[UNDO_STACK]
            ];
        }
        return {
            ...problem,
            UNDO_STACK : newUndoStack,
            REDO_STACK : [],
            STEPS : [
                ...problem[STEPS].slice(0, action[STEP_KEY]),
                // copy properties of the old step, to get the STEP_ID, then override the content
                { ...problem[STEPS][action[STEP_KEY]], CONTENT : action[NEW_STEP_CONTENT] },
                ...problem[STEPS].slice(action[STEP_KEY] + 1)
            ]
        }
    } else if (action.type === DELETE_STEP) {
        if (problem[STEPS].length === 1) {
            return problem;
        }
        let inverseAction = {
            ...action,
            INVERSE_ACTION : {
                type : INSERT_STEP_ABOVE, STEP_KEY: action[STEP_KEY],
                CONTENT : problem[STEPS][action[STEP_KEY]][CONTENT],
                INVERSE_ACTION : {...action}
            }
        };
        let undoAction = {...inverseAction[INVERSE_ACTION]};
        return {
            ...problem,
            STEPS : [
                ...problem[STEPS].slice(0, action[STEP_KEY]),
                ...problem[STEPS].slice(action[STEP_KEY] + 1)
            ],
            UNDO_STACK : [
                undoAction,
                ...problem[UNDO_STACK]
            ],
            REDO_STACK : []
        }
    } else if (action.type === INSERT_STEP_ABOVE) {
        var newContent;
        // non-blank inserations in the middle of work currently only used for undo/redo
        if (CONTENT in action) {
           newContent = action[CONTENT]
        } else {
            // this is the default produced by the button on the UI
            newContent = ""
        }
        let inverseAction = {
            ...action,
            INVERSE_ACTION : {
                type : DELETE_STEP, STEP_KEY: action[STEP_KEY],
                INVERSE_ACTION : {...action}
            }
        };
        let undoAction = {...inverseAction[INVERSE_ACTION]};
        return {
            ...problem,
            STEPS : [
                ...problem[STEPS].slice(0, action[STEP_KEY]),
                { CONTENT : newContent, STEP_ID : genID()},
                ...problem[STEPS].slice(action[STEP_KEY])
            ],
            UNDO_STACK : [
                undoAction,
                ...problem[UNDO_STACK]
            ],
            REDO_STACK : []
        }
    } else if(action.type === NEW_STEP || action.type === NEW_BLANK_STEP) {
        var oldLastStep;
        if (action.type === NEW_STEP) {
                oldLastStep = problem[STEPS][problem[STEPS].length - 1];
        } else { // new blank step
                oldLastStep = {CONTENT : ""};
        }
        let inverseAction = {
            ...action,
            INVERSE_ACTION : {
                type : DELETE_STEP, STEP_KEY: problem[STEPS].length,
                INVERSE_ACTION : {...action}
            }
        };
        let undoAction = {...inverseAction[INVERSE_ACTION]};
        return {
            ...problem,
            STEPS : [ ...problem[STEPS],
                      {...oldLastStep, STEP_ID : genID()}
            ],
            UNDO_STACK : [
                undoAction,
                ...problem[UNDO_STACK]
            ],
            REDO_STACK : []
        };
    } else if (action.type === UNDO) {
        if (problem[UNDO_STACK].length === 0) return problem;
        let undoAction = problem[UNDO_STACK][0];
        let inverseAction = {...undoAction[INVERSE_ACTION],
                             INVERSE_ACTION : {...undoAction, INVERSE_ACTION : undefined}};
        let ret = problemReducer(problem, undoAction)
        return {...ret,
                UNDO_STACK : problem[UNDO_STACK].slice(1, problem[UNDO_STACK].length),
                REDO_STACK : [
                    inverseAction,
                    ...problem[REDO_STACK]
                ],
        }
    } else if (action.type === REDO) {
        if (problem[REDO_STACK].length === 0) return problem;
        let redoAction = problem[REDO_STACK][0];
        // this ret has its redo-actions set incorrectly now, because the actions are re-used
        // in a normal mutation any edit should clear the redo stack (because you are back
        // in history and making a new edit, you need to start tracking this branch in time)
        // For redo actions, the stack should be maintained, this is restored below.
        let ret = problemReducer(problem, redoAction)
        let inverseAction = {...redoAction[INVERSE_ACTION], INVERSE_ACTION : redoAction};
        return {...ret,
                REDO_STACK : problem[REDO_STACK].slice(1, problem[REDO_STACK].length),
                UNDO_STACK : [
                    inverseAction,
                    ...problem[UNDO_STACK]
                ],
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
        if (probList.length === 1 && probList[0][STEPS][0][CONTENT] === "") {

            return [{ PROBLEM_NUMBER : "Demo",
                 STEPS : [{
                     STEP_ID : genID(), CONTENT : "4+2-3\\left(1+2\\right)"}],
                 UNDO_STACK : [], REDO_STACK : [],
                 SHOW_TUTORIAL : true
                 }];
        } else {
            return probList;
        }
    } else if (action.type === ADD_PROBLEM) {
        return [
            ...probList,
            problemReducer(undefined, action)
        ];
    } else if (action.type === REMOVE_PROBLEM) {
        if (probList.length == 1) return probList;
        return [
            ...probList.slice(0, action[PROBLEM_INDEX]),
            ...probList.slice(action[PROBLEM_INDEX] + 1)
        ];
    } else if (action.type === CLONE_PROBLEM) {
        var newProb = {
            ...probList[action[PROBLEM_INDEX]],
            PROBLEM_NUMBER : probList[action[PROBLEM_INDEX]][PROBLEM_NUMBER] + ' - copy'
        };
        return [
            ...probList.slice(0, action[PROBLEM_INDEX] + 1),
            newProb,
            ...probList.slice(action[PROBLEM_INDEX] + 1)
        ];
    } else if (action.type === SET_PROBLEM_NUMBER ||
               action.type === EDIT_STEP ||
               action.type === UNDO ||
               action.type === REDO ||
               action.type === DELETE_STEP ||
               action.type === NEW_BLANK_STEP ||
               action.type === INSERT_STEP_ABOVE ||
               action.type === NEW_STEP) {
        return [
            ...probList.slice(0, action[PROBLEM_INDEX]),
            problemReducer(probList[action[PROBLEM_INDEX]], action),
            ...probList.slice(action[PROBLEM_INDEX] + 1)
        ];
    } else {
        return probList;
    }
}

export { Problem as default, ScoreBox, problemReducer, problemListReducer };
