import Select from "react-select";

const STUDENT_NAME = "STUDENT_NAME";
const STUDENT_FILE = "STUDENT_FILE";
const VIEW_SIMILAR_ASSIGNMENTS = "VIEW_SIMILAR_ASSIGNMENTS";

function CustomGroupMakerComponent({students}) {
    const handleChange = (selected) => {
        const selectedStudents =
            !selected ? null : selected.map(function(selection) {
                return selection['value'];
        });
        window.store.dispatch(
            { type : VIEW_SIMILAR_ASSIGNMENTS,
                CUSTOM_GROUP : selectedStudents
        });
    };

    // todo - pull out common prefix if present
    //      - like when opening a zip file with a directory
    students = students.map(function(student, index, array) {
        return { value: student[STUDENT_FILE], label: (student[STUDENT_NAME] ? student[STUDENT_NAME] : student[STUDENT_FILE])};
    });
    return (
        <div className="App">
            <Select
                isMulti={true}
                onChange={handleChange}
                options={students}
            />
        </div>
  );
}

export default CustomGroupMakerComponent;
