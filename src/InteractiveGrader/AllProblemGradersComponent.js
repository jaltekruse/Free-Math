import ProblemGrader, { problemGraderReducer } from '../ProblemGrader.js';

const PROBLEM_NUMBER = 'PROBLEM_NUMBER';
const PROBLEMS = 'PROBLEMS';
const SIMILAR_ASSIGNMENT_GROUP_INDEX = "SIMILAR_ASSIGNMENT_GROUP_INDEX";
const SIMILAR_ASSIGNMENT_SETS = "SIMILAR_ASSIGNMENT_SETS";
const GRADING_OVERVIEW = 'GRADING_OVERVIEW';
const CUSTOM_GROUP = 'CUSTOM_GROUP';

function AllProblemGradersComponent({value}) {
    var problems = value[PROBLEMS];
    var similarAssignments = value[SIMILAR_ASSIGNMENT_SETS];
    var currentSimilarityGroupIndex = value[SIMILAR_ASSIGNMENT_GROUP_INDEX];
    // either set to a list fo students to filter to, or if undefined/false show all
    // can be set by an index into the automatically identified similarity groups
    // or a custom group created by a teacher

    const studentsToView = value[CUSTOM_GROUP] ?? similarAssignments[currentSimilarityGroupIndex];

    var currentProblem = value["CURRENT_PROBLEM"];
    // clean up defensively, this same property is used for the teacher view or student view
    // but here it represents a string typed as a problem number, but for students it is an
    // integer index into the list of problems
    if (typeof currentProblem !== 'string' || typeof problems[currentProblem] === 'undefined') {
        currentProblem = value[GRADING_OVERVIEW][PROBLEMS][0][PROBLEM_NUMBER];
    }

    return (
        <div>
        {
            function() {
                var problemGraders = [];
                var problemArray = [];
                for (var problem in problems) {
                    if (problems.hasOwnProperty(problem)) {
                        // when viewing similar assignments show all problems, otherwise only show
                        // one problem at a time
                        if (problem === currentProblem
                                || studentsToView) {
                            // problem number is stored as keys in the map, add to each object
                            // so the list can be sorted by problem number
                            problems[problem][PROBLEM_NUMBER] = problem;
                            problemArray.push(problems[problem]);
                        }
                    }
                }
                problemArray = problemArray.sort(
                    function(a,b) { return a[PROBLEM_NUMBER] - b[PROBLEM_NUMBER];});
                problemArray.forEach(function(problem, index, array) {
                    problemGraders.push(
                        (<ProblemGrader problemInfo={problem}
                                        key={problem[PROBLEM_NUMBER]}
                                        problemNumber={problem[PROBLEM_NUMBER]}
                            studentsToView={studentsToView}/> ));
                });
                return problemGraders;
            }()
        }
        </div>
    );
}

export default AllProblemGradersComponent;
