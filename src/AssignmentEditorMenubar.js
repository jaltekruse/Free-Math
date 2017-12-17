import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import logo from './logo.svg';
import { saveAs } from 'file-saver';
import './App.css';
import LogoHomeNav from './LogoHomeNav.js';
import { convertToCurrentFormat } from './TeacherInteractiveGrader.js';

// Assignment properties
var ASSIGNMENT_NAME = 'ASSIGNMENT_NAME';
var PROBLEMS = 'PROBLEMS';
// to implement undo/redo and index for the last step
// to show is tracked and moved up and down
// when this is not at the end of the list and a new
// step is added it moves to the end of the list as
// the redo history in this case will be lost
var LAST_SHOWN_STEP = 'LAST_SHOWN_STEP';

// editing assignmnt mode actions
var SET_ASSIGNMENT_NAME = 'SET_ASSIGNMENT_NAME';
// used to swap out the entire content of the document, for opening
// a document from a file
var SET_ASSIGNMENT_CONTENT = 'SET_ASSIGNMENT_CONTENT';

function saveAssignment() {
    var blob = new Blob([JSON.stringify({ PROBLEMS : window.store.getState()[PROBLEMS]})], {type: "text/plain;charset=utf-8"});
    saveAs(blob, window.store.getState()[ASSIGNMENT_NAME] + '.math');
}

function removeExtension(filename) {
    // remove preceding directory (for when filename comes out of the ZIP directory)
    filename = filename.replace(/[^\/]*\//, "");
    // actually remove extension
    filename = filename.replace(/\.[^/.]+$/, "");
    return filename;
}

// TODO - consider giving legacy docs an ID upon opening, allows auto-save to work properly when
// opening older docs
export function openAssignment(serializedDoc, filename, discardDataWarning) {
    // this is now handled at a higher level, this is mostly triggered by onChange events of "file" input elements
    // if the user selects "cancel", I want them to be able to try re-opening again. If they pick the same file I
    // won't get on onChange event without resetting the value, and here I don't have a reference to the DOM element
    // to reset its value
    //if (discardDataWarning && !window.confirm("Discard your current work and open the selected document?")) {
    //    return;
    //}

    var newDoc = JSON.parse(serializedDoc);
    // compatibility for old files, need to convert the old proerty names as
    // well as add the LAST_SHOWN_STEP
    var newDoc = convertToCurrentFormat(newDoc);
    window.store.dispatch({type : SET_ASSIGNMENT_CONTENT, PROBLEMS : newDoc[PROBLEMS]});
    window.store.dispatch({type : SET_ASSIGNMENT_NAME, ASSIGNMENT_NAME : removeExtension(filename)});
}

// read a file from the local disk, pass an onChange event from a "file" input type
// http://www.htmlgoodies.com/beyond/javascript/read-text-files-using-the-javascript-filereader.html
export function readSingleFile(evt, discardDataWarning) {
    //Retrieve the first (and only!) File from the FileList object
    var f = evt.target.files[0];

    if (f) {
        var r = new FileReader();
        r.onload = function(e) {
            var contents = e.target.result;
            openAssignment(contents, f.name, discardDataWarning);
        }
        r.readAsText(f);
    } else {
        alert("Failed to load file");
    }
}

var AssignmentEditorMenubar = React.createClass({
  render: function() {
        return (
            <div className="menuBar">
                <div className="nav">
                    <LogoHomeNav /> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;

                    <div style={{"verticalAlign":"bottom"}}>
                        Assignment and Student Name &nbsp;&nbsp;&nbsp;
                        <input type="text" id="assignment-name-text" name="assignment name" value={this.props.value[ASSIGNMENT_NAME]} onChange={
                            function(evt) {
                                window.store.dispatch({type : SET_ASSIGNMENT_NAME, ASSIGNMENT_NAME : evt.target.value});
                            }}
                        />&nbsp;&nbsp;&nbsp;

                        <input type="submit" id="save-assignment" name="save assignment" value="save assignment" onClick={
                            function() { saveAssignment() }} /> &nbsp;&nbsp;&nbsp;
                            Open Assignment <input type="file"  ref={(input) => { this.fileInput = input; }} id="open-file-input" onChange={
                            function(evt) {
                                if (!window.confirm("Are you sure you want to leave your current work?")) {
                                    evt.target.value = "";
                                    return;
                                }
                                readSingleFile(evt, true /* warn about data loss */);
                                evt.target.value = "";
                            }}/>
                        <input type="submit" id="new-assignment" name="New assignment" value="New assignment" onClick={
                        function() {
                            if (!window.confirm("Are you sure you want to leave your current work and start a new document?")) {
                                return;
                            }
                            window.store.dispatch({type : "NEW_ASSIGNMENT"});
                        }}/>
                    </div>
                </div>
            </div>
        );
  }
});

export default AssignmentEditorMenubar;
