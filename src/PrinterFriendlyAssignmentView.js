import React from 'react';
import { aggregateStudentWork, calculateGradingOverview } from './TeacherInteractiveGrader.js';
import { StudentWork } from './SolutionGrader.js';

const PROBLEMS = 'PROBLEMS';
const PROBLEM_NUMBER = 'PROBLEM_NUMBER';

export default class PrinterFriendlyAssignmentView extends React.Component {

    render() {
        const assignment = this.props.assignment;

        const aggregatedSingleDoc = aggregateStudentWork([{STUDENT_FILE : "a", ASSIGNMENT : assignment[PROBLEMS]}]);
        const gradingViewModel = {
            ...aggregatedSingleDoc,
            GRADING_OVERVIEW : calculateGradingOverview(aggregatedSingleDoc[PROBLEMS]),
            SIMILAR_ASSIGNMENT_GROUP_INDEX: null,
            CUSTOM_GROUP : ["a"]
        };
        console.log(gradingViewModel);
        /*
        window.store.dispatch(
            { type : SET_ASSIGNMENTS_TO_GRADE,
              DOC_ID : docId,
              NEW_STATE :
                {...aggregatedWork, ASSIGNMENT_NAME: removeExtension(filename)}});
        onSuccess();
    } else if (action.type === SET_ASSIGNMENTS_TO_GRADE) {
        // TODO - consolidate the defaults for filters
        // TODO - get similar assignment list from comparing the assignments
        // overview comes sorted by LARGEST_ANSWER_GROUPS_SIZE ascending (least number of common answers first)
        var overview = calculateGradingOverview(action[NEW_STATE][PROBLEMS]);
        return {
            ...action[NEW_STATE],
            "DOC_ID" : action["DOC_ID"] ? action["DOC_ID"] : genID(),
            GRADING_OVERVIEW : overview,
            // if already in one of the grading states, leave the mode alone
            // while changing the content, if not in of these states go into the
            // default view for grading
            APP_MODE : ( state[APP_MODE] === GRADE_ASSIGNMENTS
                  || state[APP_MODE] === SIMILAR_DOC_CHECK
                  || state[APP_MODE] === VIEW_GRADES ) ? state[APP_MODE] : GRADE_ASSIGNMENTS
        }
        */
        return (
            <div style={{minHeight: "100vh", padding:"30px 15px 100px 15px"}}>
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
