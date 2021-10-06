import { waitForConditionThenDo } from './Util.js';

var MODIFY_GLOBAL_WAITING_MSG = 'MODIFY_GLOBAL_WAITING_MSG';

/**
 *  On load, called to load the auth2 library and API client library.
 */
export function handleGoogleClientLoad() {
  gapi = window.gapi;
  gapi.load('client:auth2', initClient);
  gapi.load('picker', initGoogleForPicker);
  gapi.load('drive');
}

function initGoogleForPicker() {
  google = window.google;
}

var google = window.google;
var gapi = window.gapi;

var DEFAULT_MIME = 'text\/plain; charset=utf8';
var JSON_MIME = 'application/json';

// --- prod ----
var PROJECT_NUMBER = '412119895810';
// Client ID and API key from the Developer Console
var CLIENT_ID = '412119895810-tji5c4tj6so2jmde8k3t1l3kaui5g4ca.apps.googleusercontent.com';

// --- dev ----
//var PROJECT_NUMBER = '726134963224';
//var CLIENT_ID = '726134963224-rcc5nqsnsvr61cdjrin5tgeloidssfcf.apps.googleusercontent.com';

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = 'https://www.googleapis.com/auth/drive.file ' +
               'https://www.googleapis.com/auth/drive.install ' +
               'https://www.googleapis.com/auth/classroom.courses.readonly ' +
               'https://www.googleapis.com/auth/classroom.coursework.me ' +
               'https://www.googleapis.com/auth/classroom.coursework.me.readonly ' +
               'https://www.googleapis.com/auth/classroom.coursework.students.readonly ' +
               'https://www.googleapis.com/auth/classroom.coursework.students ' +
               'https://www.googleapis.com/auth/classroom.rosters.readonly';

var APP_ID = 'quickstart-1561689319732';

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {

  // Array of API discovery doc URLs for APIs used by the quickstart
  var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

  gapi.client.init({
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function () {
    // Listen for sign-in state changes.
    console.log("stuff");
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
  }, function(error) {
      /* TODO FIX - don't want this to come up until a user clicks on a drive button,
       * but this runs when the page loads
      if (error.details.includes("Cookies are not enabled in current environment")) {
          alert("Your browser may have 3rd party cookies disabled, " +
                  "you need to enable them to use the google integration.\n\n" +
                  "On Chrome, look for an eye with a line through it in the address bar.\n\n" +
                  "While Free Math doesn't have ads, some ad blockers also have this behavior and " +
                  "may need to be disabled.");
      }
      */
      console.log(error);
      console.log("Error connecting to google.");
  });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
      console.log("signed in");
  } else {
      console.log("not signed in");
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}

export function doOnceGoogleAuthLoads(seconds, actionCallback) {
    // wait up to 10 seconds for google auth library to load
    waitForConditionThenDo(seconds,
        function() { return gapi && gapi.auth2;},
        actionCallback,
        function() {
            // TODO - add visual indicator in UI if auth library fails to load
            console.log("Error loading google auth library");
            window.ga('send', 'exception', { 'exDescription' : 'timed out after ' + seconds + ' seconds timeout waiting for google auth'} );
    });
}

export function doOnceGoogleUserLoggedIn(seconds, actionCallback) {
    // wait up to 10 seconds for google auth library to load
    waitForConditionThenDo(seconds, checkLoginNoPopup, actionCallback, function() {
        alert("Error connecting to Google");
        window.ephemeralStore.dispatch(
            { type : MODIFY_GLOBAL_WAITING_MSG,
              GLOBAL_WAITING_MSG: false});
    });
}

export function checkLoginNoPopup() {
    if (!gapi || !gapi.auth2) return false;
    return gapi.auth2.getAuthInstance().isSignedIn.get();
}

function checkLogin() {
    // TODO FIX - this is the wrong check
    return true;
    if (! gapi.auth2.getAuthInstance().isSignedIn.get()) {
        alert('Need to authorize access to Google Services.');
        handleAuthClick();
    }
}

// expected to call checkLogin before calling this (maybe they should be combined?)
function getToken() {
    return gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
}

export function listGoogleClassroomCourses(callback, errorCallback = function(){}) {
    let url = 'https://classroom.googleapis.com/v1/courses';
    googleGet(true, url, callback, errorCallback);
}

export function listGoogleClassroomAssignments(courseId, callback, errorCallback = function(){}) {
    let url = 'https://classroom.googleapis.com/v1/courses/' + courseId + '/courseWork';
    // filter out list to just type ASSIGNMENT
    googleGet(true, url, function(response) {
        console.log(response);
        response.courseWork = response.courseWork.filter(function(x) { return x.workType === 'ASSIGNMENT'} );
        console.log(response);
        callback(response);
    }, errorCallback);
}

export function listClassroomStudents(courseId, callback, errorCallback = function(){}) {
    let url = 'https://classroom.googleapis.com/v1/courses/' + courseId + '/students';
    googleGet(true, url, callback, errorCallback);
}

export function listGoogleClassroomSubmissionsNoFailureAlert(courseId, courseWorkId, callback, errorCallback = function(){}) {
    let url = 'https://classroom.googleapis.com/v1/courses/' + courseId + '/courseWork/' +
                courseWorkId + '/studentSubmissions';
    googleGet(false, url, callback, errorCallback);
}

export function listGoogleClassroomSubmissions(courseId, courseWorkId, callback, errorCallback = function(){}) {
    let url = 'https://classroom.googleapis.com/v1/courses/' + courseId + '/courseWork/' +
                courseWorkId + '/studentSubmissions';
    googleGet(true, url, callback, errorCallback);
}

export function listRecentFilesOnGoogle(callback, errorCallback = function(){}) {
    let url = 'https://www.googleapis.com/drive/v3/files';
    googleGet(true, url, callback, errorCallback);
}

export function listFilesInFolder(folderId, callback, errorCallback = function(){}) {
    let url = 'https://www.googleapis.com/drive/v2/files/' + folderId + '/children';
    googleGet(true, url, callback, errorCallback);
}

export function turnInToClassroom(courseId, courseWorkId, submissionId,
                                        callback, errorCallback = function(){}) {
    let url = 'https://classroom.googleapis.com/v1/courses/' + courseId + '/courseWork/' +
                courseWorkId + '/studentSubmissions/' + submissionId + ':turnIn';
    // THE PAYLOAD MUST BE EMPTY
    let payload = false;
    googleRequestJsonResponse(false, url, 'post', payload, DEFAULT_MIME, callback, errorCallback);
}

export function reclaimFromClassroom(courseId, courseWorkId, submissionId,
                                        callback, errorCallback = function(){}) {
    let url = 'https://classroom.googleapis.com/v1/courses/' + courseId + '/courseWork/' +
                courseWorkId + '/studentSubmissions/' + submissionId + ':reclaim';
    // THE PAYLOAD MUST BE EMPTY
    let payload = false;
    googleRequestJsonResponse(false, url, 'post', payload, DEFAULT_MIME, callback, errorCallback);
}

// TODO - most of the time users will want to overwrite their previous work, but this currently
// just adds a new file to their submission each time
// it would be best to push users towards opening their previous submission, as soon as we know
// one is associated with their assignment they are trying to work on
export function modifyGoogeClassroomSubmission(courseId, courseWorkId, submissionId, driveFileId,
                                        callback, errorCallback = function(){}) {
    let url = 'https://classroom.googleapis.com/v1/courses/' + courseId + '/courseWork/' +
                courseWorkId + '/studentSubmissions/' + submissionId + ':modifyAttachments';
    let payload = { "addAttachments": [ { "driveFile": { "id" : driveFileId } } ] };
    // special hanlding for alerts is at callers, can give more specific message about unsubmitting
    // not just generic permissions message
    googlePostJson(false, url, payload, callback, errorCallback);
}

export function createGoogeClassroomAssignment(courseId, title, description, callback, errorCallback = function(){}) {

    let url = 'https://classroom.googleapis.com/v1/courses/' + courseId + '/courseWork';
    // TODO - add due date
    let payload = { title: "[Free Math] " + title, description: description,
                    workType : "ASSIGNMENT", state : "DRAFT", maxPoints: 100,
                    materials: [ { link: {  "url": "https://freemathapp.org",
                                   title: "Free Math Homepage" } } ]};
    googlePostJson(true, url, payload, callback, errorCallback);
}

export function downloadFileNoFailureAlert(fileId, isBinary, callback, errorCallback) {
    downloadFileInternal(false, fileId, isBinary, callback, errorCallback);
}

export function downloadFile(fileId, isBinary, callback, errorCallback) {
    downloadFileInternal(true, fileId, isBinary, callback, errorCallback);
}

export function downloadFileInternal(alertOnFailure, fileId, isBinary, callback, errorCallback) {
    // TODO - test what happens when selecting google docs elements instead of binary files with this change

    let url = 'https://www.googleapis.com/drive/v2/files/' + fileId + '?alt=media&source=downloadUrl';
    // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
    let mime = isBinary ? 'text\/plain; charset=x-user-defined' : DEFAULT_MIME;
    googleRequestBinaryResponse(alertOnFailure, url, 'get', false, mime, callback, errorCallback);
}

export function downloadFileMetadata(fileId, callback, errorCallback = function() {}) {
    let url = 'https://www.googleapis.com/drive/v2/files/' + fileId;
    googleGet(true, url, callback, errorCallback);
}

export function updateGrades(courseId, courseWorkId, grades /* map from submissionId to grade */,
                      callback, errorCallback = function() {}) {
    checkLogin();
    var accessToken = getToken();
    let url = 'https://classroom.googleapis.com/batch';

    var payload = new FormData();
    var i = 0;
    grades = grades['GOOGLE_STUDENT_GRADES'];
    for (var submissionId in grades) {
        if ( grades.hasOwnProperty(submissionId)) {
            let innerPayload = new FormData();
            let grade = Number(grades[submissionId]);
            console.log(grade);
            payload.append('grade_' + i, new Blob(
                [
                    'PATCH https://classroom.googleapis.com/v1/courses/' + courseId + '/courseWork/' +
                            courseWorkId + '/studentSubmissions/' + submissionId + '?updateMask=draftGrade' + "\n" +
                    'Content-Type: ' + JSON_MIME + '; charset=UTF-8' + "\n" +
                    'Authorization: Bearer ' + accessToken + "\n\n" +
                    JSON.stringify({draftGrade: grade})
                ], {type: 'application/http'})
            );
            i++;
        }
    }
    console.log(payload);
    googleRequestBinaryResponse(false, url, 'post', payload, 'multipart/mixed', callback, errorCallback);
}

// yes this is defaulting always to no alert on failure, all of the callers currently do their own
// handling, many are checking for 403s to give better error messages
export function updateFileWithBinaryContent(name, content, googleId,
                                     fileType='application/zip', callback, errorCallback = function(){}) {

    let url = 'https://www.googleapis.com/upload/drive/v2/files/' + googleId + '?uploadType=multipart';
    // NOTE: in v2 api title is used instead of name, changed in v3
    var meta = {mimeType: fileType};
    // don't update the name if null is passed
    if (name !== null) {
        meta.title = name;
    }
    var payload = new FormData();
    payload.append('metadata', new Blob([JSON.stringify(meta)], {type: JSON_MIME}));
    payload.append('file', content);
    googleRequestJsonResponse(false, url, 'put', payload, DEFAULT_MIME, callback, errorCallback);
}

export function createFileWithBinaryContent(name, content, fileType='application/zip', callback,
                                     errorCallback = function(){}) {
    let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    // NOTE: in v2 api title is used instead of name
    let meta = {name: name, mimeType: fileType};
    let payload = new FormData();
    payload.append('metadata', new Blob([JSON.stringify(meta)], {type: JSON_MIME}));
    payload.append('file', content);
    googleRequestJsonResponse(true, url, 'post', payload, DEFAULT_MIME, callback, errorCallback);
}

function googleGet(alertOnFailure, url, callback, errorCallback = function(){}) {
    googleRequestJsonResponse(alertOnFailure, url, 'get', false, DEFAULT_MIME, callback, errorCallback);
}

/**
  * Note: expected a javascript object as payload, this handles stringifying it.
  */
function googlePostJson(alertOnFailure, url, payload, callback, errorCallback) {
    googleRequestJsonResponse(alertOnFailure, url, 'post', JSON.stringify(payload), JSON_MIME, callback, errorCallback);
}

// callback takes 2 parameters filename and content
export function openDriveFile(isBinary, multiSelect, folder, callback){
    checkLogin();
    var accessToken = getToken();
      var docsView = new google.picker.DocsView();
      if (folder) {
          docsView.setParent(folder);
      }
      var pickerBuilder = new google.picker.PickerBuilder();
      pickerBuilder
          // yes despite the different labels this is the right thing to pass here
          .setAppId(PROJECT_NUMBER)
          .addView(docsView)
          .addView(new google.picker.DocsUploadView())
          .setOAuthToken(accessToken)
          .setCallback(function(data) {
              var url = 'nothing';
              if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
                var docs = data[google.picker.Response.DOCUMENTS];
                console.log(docs);
                if (docs.length == 1 && docs[0].type !== "file") {
                    alert("Cannot open Google Docs, Slides or Sheets, you must select a file created by Free Math");
                    return;
                }
                callback(docs);
              }
          });

      if (multiSelect) {
        pickerBuilder.enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
      }

      var picker = pickerBuilder.build();
      picker.setVisible(true);
}

function googleRequestBinaryResponse(alertOnFailure, url, verb, payload, mime, callback, errorCallback = function(){}) {
    googleRequest(url, verb, payload, mime,
        function(responseXhr) {
            callback(responseXhr.response);
        },
        function(responseXhr) {
            try {
                var resp = JSON.parse(responseXhr.responseText);
                window.ga('send', 'exception', { 'exDescription' : url + ' ' + resp.error.message } );

                if (alertOnFailure) alert(resp.error.message);
            } catch(e) {
                console.log(e);
                window.ga('send', 'exception', { 'exDescription' : url + ' ' + 'google request failure: ' + responseXhr.responseText } );

                if (alertOnFailure) alert("Failure during request to Google.\n\n" + responseXhr.responseText);
            }
            errorCallback(responseXhr);
        });
}

function googleRequestJsonResponse(alertOnFailure, url, verb, payload, mime, callback, errorCallback = function(){}) {
    googleRequest(url, verb, payload, mime,
        function(responseXhr) {
            callback(JSON.parse(responseXhr.responseText));
        },
        function(responseXhr) {
            try {
                var resp = JSON.parse(responseXhr.responseText);
                window.ga('send', 'exception', { 'exDescription' : url + ' ' + resp.error.message } );

                if (alertOnFailure) alert(resp.error.message);
            } catch(e) {
                console.log(e);
                window.ga('send', 'exception', { 'exDescription' : url + ' ' + 'google request failure: ' + responseXhr.responseText } );

                if (alertOnFailure) alert("Failure during request to Google.\n\n" + responseXhr.responseText);
            }
            errorCallback(responseXhr);
        });
}

function googleRequest(url, verb, payload, mime, callback, errorCallback = function(){}) {
    googleRequestRetryOnceOn401(true, url, verb, payload, mime, callback, errorCallback);
}

// firstAttempt is a boolean, on initial call it is true, if retrying after a 401 this is used recursively but then false
// is passed to prevent a retry look
function googleRequestRetryOnceOn401(firstAttempt, url, verb, payload, mime, callback, errorCallback = function(){}) {
    checkLogin();

    var accessToken = getToken();
    var xhr = new XMLHttpRequest();
    xhr.open(verb, url);
    xhr.overrideMimeType(mime);
    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
    xhr.onload = function() {
        console.log(this);
        if (this.readyState === 4) {
            if (this.status == 200) {
                try {
                    callback(this);
                } catch (e) {
                    errorCallback(this);
                    console.log(e);
                }
            } else if (this.status == 401 && firstAttempt){
                var authPromise = gapi.auth2.getAuthInstance().currentUser.get().reloadAuthResponse();
                authPromise.then(function(AuthResponse) {
                    googleRequestRetryOnceOn401(false, url, verb, payload, mime, callback, errorCallback);
                });
            } else {
                console.log(this);
                console.log(this.responseText);
                errorCallback(this);
            }
        } else {
            // ignore other events for request still in progress
        }
    };
    xhr.onerror = function(xhr) {
      console.log(this);
      console.log(xhr);
      console.log("-------------onerror called------------");
      errorCallback(this);
    };
    if (payload) {
        xhr.send(payload);
    } else {
        xhr.send();
    }
}
