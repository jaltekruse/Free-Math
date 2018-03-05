import React from 'react';
import createReactClass from 'create-react-class';
import _ from 'underscore';
import './App.css';
import TeX from './TeX.js';
import SolutionGrader from './SolutionGrader.js';

// teacher grade page model properties
var STUDENT_WORK = "STUDENT_WORK";
var STUDENT_FILE = 'STUDENT_FILE';
var ANSWER = "ANSWER";

var SolutionClassGrader = createReactClass({
    render: function() {
        // TODO - finish
        var data = this.props.solutionClassInfo;
        var studentsToView = this.props.studentsToView;
        // TODO - finish
        var solutionClassIndex = this.props.solutionClassIndex;
        var problemNumber = this.props.problemNumber;
        var possiblePoints = this.props.possiblePoints;
        var studentFinalAnswer = data[ANSWER];
        var studentCount = _.size(data[STUDENT_WORK]);
        if (studentCount > 1) {
            studentCount = studentCount + ' students ';
        } else {
            studentCount = studentCount + ' student ';
        }
        var message = 'with work leading to answer ';
        if (studentFinalAnswer === 'unanswered') {
           message = 'with the question ';
        }
        // due to filtering there may be no answers showing in this group, in this case render nothing
        // not even the header
        var anyAnswersShowing = false;
        data[STUDENT_WORK].forEach(function(studentSolution, studentSolutionIndex, array) {
            if (studentsToView === undefined || !studentsToView || studentsToView.includes(studentSolution[STUDENT_FILE])) {
                anyAnswersShowing = true;
            }
        });
        return (
            <div>
            { !anyAnswersShowing ? null :
            (<div className="similar-student-answers" style={{float:"none",overflow:"hidden"}} >
                {/*<input type="submit" className="show-all-common-answers" name="show all" value="show all"/>*/}
                {/*<input type="submit" className="hide-all-common-answers" name="hide all" value="hide all"/>*/}
                <p> {studentCount}{message}</p>
                <TeX>{typeof(studentFinalAnswer) === 'string' ? studentFinalAnswer : "\\text{corruption occured}"}</TeX>
                {
                    data[STUDENT_WORK].map(function(studentSolution, studentSolutionIndex) {
                        if (studentsToView === undefined || !studentsToView || studentsToView.includes(studentSolution[STUDENT_FILE])) {
                            return (<SolutionGrader solutionGradeInfo={studentSolution} problemNumber={problemNumber} possiblePoints={possiblePoints}
                                                key={studentSolutionIndex} id={studentSolutionIndex} solutionClassIndex={solutionClassIndex}/>)
                        } else {
                            return null;
                        }
                    })
                }
            </div>)
            }
            </div>
        );
    }
});

export default SolutionClassGrader;
