import TeX from '../TeX.js';
import { HtmlButton } from '../Button.js';
import ScrollContainer from 'react-indiana-drag-scroll'

const PROBLEM_NUMBER = 'PROBLEM_NUMBER';
const PROBLEMS = 'PROBLEMS';
const SET_CURRENT_PROBLEM = 'SET_CURRENT_PROBLEM';
const UNIQUE_ANSWERS = 'UNIQUE_ANSWERS';
const ANSWER = "ANSWER";

function GraderTabsComponent({gradingOverview, problems, currentProblem}) {
	return(
		<div>
			<div className={"fm-tabs-wrapper"}>
				<ScrollContainer className={"fm-tabs"}>
					{ gradingOverview.map((problem, problemIndex) => {
			                const probNum = problem[PROBLEM_NUMBER];
			                let label = "";
			                if (probNum.trim() !== '') {
			                    if (gradingOverview.length < 8) {
			                        label = "Problem " + probNum;
			                    } else  if (gradingOverview.length < 12) {
			                        label = "Prob " + probNum;
			                    } else {
			                        label = "P" + probNum;
			                    }
			                } else {
			                    label = "[Need to Set a Problem Number]";
			                }
			                const topAnswer = problems[probNum][UNIQUE_ANSWERS][0][ANSWER];
			                return (
			                        <HtmlButton text={label} title={"View " + label} key={problemIndex} id={problemIndex}
			                            className={"fm-button-right fm-button-left fm-button fm-tab " + ((probNum === currentProblem) ? "fm-tab-selected" : "")}
			                            style={{marginBottom: "0px", borderRadius: "15px 15px 0px 0px"}}
			                            onClick={function() {
			                                window.ephemeralStore.dispatch(
			                                    {type: SET_CURRENT_PROBLEM, CURRENT_PROBLEM: probNum})}}
			                            content={
			                                (<div>
			                                    <h3>{label}</h3>
			                                    Top Answer: (
			                                    {problem["LARGEST_ANSWER_GROUP_SIZE"]}
			                                    &nbsp;{'of'}&nbsp;
			                                    {Math.round(problem["NUMBER_UNIQUE_ANSWERS"]
			                                                  * problem["AVG_ANSWER_GROUP_SIZE"])})
			                                        {<TeX>{typeof(topAnswer) === 'string'
			                                            ? topAnswer
			                                            : "\\text{}"}</TeX>
			                                        }
			                                </div>)}
			                        />
			                );
			        })}
		        </ScrollContainer>
	        </div>
        </div>
	);
}

export default GraderTabsComponent;
