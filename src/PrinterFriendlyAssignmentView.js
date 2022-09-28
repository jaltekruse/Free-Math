import React from 'react';
import { aggregateStudentWork, calculateGradingOverview } from './TeacherInteractiveGrader.js';
import { StudentWork } from './SolutionGrader.js';

const PROBLEMS = 'PROBLEMS';
const PROBLEM_NUMBER = 'PROBLEM_NUMBER';

export default class PrinterFriendlyAssignmentView extends React.Component {

    render() {
        const assignment = this.props.assignment;

        return (
            <div style={{minHeight: "100vh", padding:"30px 15px 100px 15px"}}>
            <div className="answer-partially-correct"
              style={{display:"inline-block", padding:"5px", margin: "5px"}}>
                <span>Only submit a PDF to your instructor if requested, the regular save feature for Free Math that produces a .math file should be preferred in most cases.</span>
            </div>
            <div>
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
            </div>
        );
    }
}
