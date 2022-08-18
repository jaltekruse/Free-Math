import React from 'react';
import './App.css';
import FreeMathModal from './Modal.js';

const SET_CLASS_CODE = 'SET_CLASS_CODE';
const CLASS_CODE = 'CLASS_CODE';
const SET_STUDENT_NAME = 'SET_STUDENT_NAME';
const STUDENT_NAME = 'STUDENT_NAME';

function liveAssignmentReducer(state, action) {
    if (state === undefined) {
        return {
            STUDENT_NAME : ''
        };
    } else if (action.type === SET_CLASS_CODE) {
        return {
            ...state,
            CLASS_CODE: action[CLASS_CODE]
        };
    } else if (action.type === SET_STUDENT_NAME) {
        return {
            ...state,
            STUDENT_NAME: action[STUDENT_NAME]
        };
    }
}

class LiveAssignment extends React.Component {
    render() {
        var classCode = this.props.value[CLASS_CODE];
        var studentName = this.props.value[STUDENT_NAME];

        return (
        <div style={{backgroundColor:"#f9f9f9"}}>
            <FreeMathModal
                closeModal={function() {
                            // TODO - revisit, for now impossible to close
                            //this.setState({ showModal: false});
                        }.bind(this)}
                showModal={classCode != false}
                content={(
                    <div>
                        <h2>Join a Class Session</h2>
                        <br />
                        <h3>Class Code
                            &nbsp;
                            &nbsp;
                            <input type="text" style={{width: "200px"}}
                                   value={classCode}
                                   onChange={
                                        function(evt) {
                                            window.store.dispatch({ type : SET_CLASS_CODE,
                                                    CLASS_CODE : evt.target.value}) }}
                            />
                        </h3>

                        <br />
                        <br />
                        <h3>Your Name
                            &nbsp;
                            &nbsp;
                            <input type="text" style={{width: "200px"}}
                                   value={studentName}
                                   onChange={
                                        function(evt) {
                                            window.store.dispatch({ type : SET_STUDENT_NAME,
                                                    STUDENT_NAME : evt.target.value}) }}
                            />
                        </h3>
                    </div>
                    )
                } />
            </div>
        );
    }
}



export { LiveAssignment as default, liveAssignmentReducer };
