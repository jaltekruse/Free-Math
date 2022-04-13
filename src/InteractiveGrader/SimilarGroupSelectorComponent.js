import CustomGroupMakerComponent from './CustomGroupMakerComponent.js';
import Button from '../Button.js';

const SIMILAR_ASSIGNMENT_SETS = "SIMILAR_ASSIGNMENT_SETS";
const SIMILAR_ASSIGNMENT_GROUP_INDEX = "SIMILAR_ASSIGNMENT_GROUP_INDEX";
const VIEW_SIMILAR_ASSIGNMENTS = "VIEW_SIMILAR_ASSIGNMENTS";
const ALL_STUDENTS = "ALL_STUDENTS";

function SimilarGroupSelectorComponent({state}) {
	var similarAssignments = state[SIMILAR_ASSIGNMENT_SETS];
    var allStudents = state[ALL_STUDENTS];
    var currentSimilarityGroupIndex = state[SIMILAR_ASSIGNMENT_GROUP_INDEX];

    return(
        <div className="similar-assignment-filters">
        { (similarAssignments && similarAssignments.length > 0) ? (
            <div>
              <h3>Some students may have copied each others work</h3>
            {/* Not really needed anymore now that similar doc check is on separate page
                TODO - remove this completely, including actions
            {   (typeof(currentSimilarityGroupIndex) !== "undefined" &&
                 currentSimilarityGroupIndex !== null) ?
                    (<p> Currently viewing a group of similar
                        assignments, back to grading full class
                        <Button text="View All" onClick={
                         function(evt) {
                            window.store.dispatch(
                                { type : VIEW_SIMILAR_ASSIGNMENTS,
                                  SIMILAR_ASSIGNMENT_GROUP_INDEX : undefined
                            });
                        }
                    }/></p>)
                : null
            }
            */}
            {
                function() {
                    var similarityGroups = [];
                    similarAssignments.forEach(
                        function(similarityGroup, index, array) {
                            similarityGroups.push(
                            (
                                <p key={index}>
                                { (index === currentSimilarityGroupIndex) ?
                                    (<b>A group of  {similarityGroup.length} students
                                        submitted similar assignments &nbsp;</b>)
                                   : (<span>A group of  {similarityGroup.length} students
                                       submitted similar assignments &nbsp;</span>)
                                }
                                <Button text="View" onClick={
                                    function(evt) {
                                        window.store.dispatch(
                                            { type : VIEW_SIMILAR_ASSIGNMENTS,
                                              SIMILAR_ASSIGNMENT_GROUP_INDEX : index
                                        });
                                    }
                                }/>
                                </p>
                            )
                        );
                    });
                    return similarityGroups;
                }()
            }
            </div>
            )
           : <div>
                <h3>No similar documents were found automatically</h3>

                <p>If you are worried any of your students might have shared work, you can view them together using the menu below.</p>
            </div>

        }
        <br /><br />
        <h3>Custom Group</h3>


        <p>See one or more students' full assignments side by side.</p>
        <CustomGroupMakerComponent students={allStudents}/>
        </div>
    );
}

export default SimilarGroupSelectorComponent;
