import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import logo from './logo.svg';
import './App.css';
import TeX from './TeX.js';
import SolutionClassGrader from './SolutionClassGrader.js';

var SET_PROBLEM_POSSIBLE_POINTS = "SET_PROBLEM_POSSIBLE_POINTS";
var EDIT_POSSIBLE_POINTS = "EDIT_POSSIBLE_POINTS";
var OLD_POSSIBLE_POINTS = "OLD_POSSIBLE_POINTS";
var POSSIBLE_POINTS = "POSSIBLE_POINTS";
// as the points already assigned for all work on a problem need to be scaled
// wen the possible points changes, and the old a new values need to be
// known at the time of the recalculation, user input is stored in this field
// until the field is submitted (with a button, pressing enter key or focus loss)
var POSSIBLE_POINTS_EDITED = "POSSIBLE_POINTS_EDITED";
var UNIQUE_ANSWERS = 'UNIQUE_ANSWERS';

// A problem grader encompasses all of the student work in response
// to a single problem. The work is grouped by similar final answer,
// the groups are called "answer classes".
var ProblemGrader = React.createClass({
    render: function() {
        var problemNumber = this.props.problemNumber;
        var studentsToView = this.props.studentsToView;
        var problemInfo = this.props.problemInfo;
        var possiblePoints = problemInfo[POSSIBLE_POINTS];
        var totalIncorrect = "TODO";
        var possiblePoints = problemInfo[POSSIBLE_POINTS_EDITED] != undefined ? problemInfo[POSSIBLE_POINTS_EDITED] : problemInfo[POSSIBLE_POINTS];
        var oldPossiblePoints = problemInfo[POSSIBLE_POINTS];
        return (
            <div className="problem-summary-container" style={{float:"none",overflow:"hidden"}}>
                <h3>Problem number {problemNumber}</h3>
                {/*<p>Total incorrect answers {totalIncorrect}</p>*/}
                <p>Possible points &nbsp;<input type="text" className="possible-points-input" width="4" value={possiblePoints} onChange={
                                function(evt) { window.store.dispatch({
                                    type : EDIT_POSSIBLE_POINTS, PROBLEM_NUMBER : problemNumber,
                                    POSSIBLE_POINTS : evt.target.value
                                    }) }}
                                />
                    <input type="submit" name="apply new possible score" value="Apply" onClick={
                        function() { window.store.dispatch({ type : SET_PROBLEM_POSSIBLE_POINTS, PROBLEM_NUMBER : problemNumber}) }}/> <br/>
                            </p>
                {
                    problemInfo[UNIQUE_ANSWERS].map(function(solutionClassInfo, solutionClassIndex) {
                        return (
                            <SolutionClassGrader solutionClassInfo={solutionClassInfo} key={solutionClassIndex}
                                                 solutionClassIndex={solutionClassIndex} problemNumber={problemNumber}
                                                 possiblePoints={oldPossiblePoints} studentsToView={studentsToView}/>

                        );
                    })
                }
            </div>);
    }
});

export default ProblemGrader;
