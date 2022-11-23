import React from 'react';
import { aggregateStudentWork, calculateGradingOverview } from './TeacherInteractiveGrader.js';
import { StudentWork } from './SolutionGrader.js';

const ASSIGNMENT_NAME = 'ASSIGNMENT_NAME';
const PROBLEMS = 'PROBLEMS';
const PROBLEM_NUMBER = 'PROBLEM_NUMBER';

export default class PrinterFriendlyAssignmentView extends React.Component {

    render() {
        const assignment = this.props.assignment;

        return (
          <div style={{ padding:"30px 15px 100px 15px" }}>
              <div className="answer-partially-correct noprint" style={{display:"inline-block", padding:"5px", margin: "5px"}}>
                  <span>Only submit a PDF to your instructor if requested, the regular save feature for Free Math that produces a .math file should be preferred in most cases.</span>
              </div>
              <h2>{assignment[ASSIGNMENT_NAME]}</h2>
              <p>Created using Free Math (<a href="freemathapp.org">freemathapp.org</a>)</p>
              <div>
              { assignment[PROBLEMS].map(
                  (problem => {
                      return (
                          <div key={problem[PROBLEM_NUMBER]} style={{ breakInside: "avoid" }}>
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
