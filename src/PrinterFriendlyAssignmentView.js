import React from 'react';
import _ from 'underscore';
import { aggregateStudentWork, calculateGradingOverview } from './TeacherInteractiveGrader.js';
import { StudentWork } from './SolutionGrader.js';

const PROBLEMS = 'PROBLEMS';
const PROBLEM_NUMBER = 'PROBLEM_NUMBER';

export default class PrinterFriendlyAssignmentView extends React.Component {

    render() {
        const assignment = this.props.assignment;

        return (
            <div style={{minHeight: "100vh", padding:"30px 15px 100px 15px"}}>
            <span style={{fontSize: "0.5px", color:"#f1f1f1", lineHeight: "0.1"}}>
            {JSON.stringify(assignment)}
            </span>
            { assignment[PROBLEMS].map(
                (problem => {
                    return (
                        <div>
                        <h3 style={{display:"block", clear: "left"}}>Problem {problem[PROBLEM_NUMBER]}</h3>
                            <StudentWork solutionGradeInfo={problem} viewingSimilarGroup={true}/>
                            <div style={{display:"block", clear: "left"}}>
                                <br />
                                <br />
                            </div>
                        </div>
                    )
                })
            )}
            </div>
        );
    }
}
