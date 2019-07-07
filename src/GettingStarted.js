
const DefaultHomepageActions = createReactClass({
    componentDidMount: function() {
        // React 15 doesn't support custom attributes in JSX
        // TODO - this doesn't appear to be working, still can't make
        // the youtube video full screen
        var element = ReactDOM.findDOMNode(this.refs.youtubeEmbed);
        element.setAttribute("fs", "1");
        element.setAttribute("allowfullscreen", "allowfullscreen");
        element.setAttribute("mozallowfullscreen", "mozallowfullscreen");
        element.setAttribute("msallowfullscreen", "msallowfullscreen");
        element.setAttribute("oallowfullscreen", "oallowfullscreen");
        element.setAttribute("webkitallowfullscreen", "webkitallowfullscreen");
    },
    render: function() {
        return (
                <br />
                <span id="gettingStarted" />
                <div style={{paddingTop: "80px", marginTop: "-100px"}} />
                <br />
                <h2>Getting Started</h2>
                    <p>Free Math is easy to set up, all you need is a standard LMS that can
                       collect files.</p>
                <ol>
                    <li>Assign problems from your textbook or a worksheet.</li>
                    <li>Students complete digital work, save it as a file and submit it through your LMS.</li>
                    <li>You download the files in bulk from your LMS as a zip file.</li>
                    <li>Load the zip file into Free Math for grading, the app will show you
                        where students struggled the most.
                        Anything you don’t have time to grade gets completion points.</li>
                    <li>Save the grading feedback, which generates a zip file filled with
                        individual graded documents for each student.</li>
                    <li>Upload the zip file full of documents into your LMS, it will provide the
                        individual graded documents to each student.</li>
                    <li>Record the overall grades into your grade book.</li></ol>
                <span id="officeHours" />
                <div style={{paddingTop: "80px", marginTop: "-100px"}} />
        <br />
                <h2>Office Hours</h2>
                <p>
                    Have questions about how to get started with Free Math? <br />
                    Want to talk with the development team about a feature suggestion? <br />
                    Interested in meeting other teachers improving their classrooms with Free Math? <br />
                    <br />
                    Come to office hours on Google Hangouts, held weekdays 8:30-9:30am CST <br />
                    <br />
                    <a href="https://hangouts.google.com/call/zI50_reQkvH6k_ruzkOKAEEE">Join the conversation!</a>
                </p>
                <span id="contact" />
                <div style={{paddingTop: "80px", marginTop: "-100px"}} />
        <br />
                <h2>Contact the Developer</h2>
                <p>If you would like to discuss how you could use Free Math in your classroom,
                   send a message to this address. <br />
                   Bug reports, questions and press inquiries can be directed here as well.</p>
                <p>developers@freemathapp.org</p>
                <div>Follow the project &nbsp;&nbsp;
            <a href="https://www.facebook.com/freemathapp">
                        <img alt="facebook" src="/images/facebook.png" style={{height:"35px"}}></img></a>&nbsp;
                    <a href="https://twitter.com/freemathapp">
                        <img alt="twitter" src="/images/twitter.png" style={{height:"35px"}}></img></a>&nbsp;
            <a href="https://www.reddit.com/r/freemath">
                        <img alt="facebook" src="/images/snoo.png" style={{height:"35px"}}></img></a>&nbsp;&nbsp;
                <br />
                <a href="https://github.com/jaltekruse/Free-Math/issues">Report Bug or Request Feature</a>
                </div>
            <br />
                <span id="lms" />
                <div style={{paddingTop: "80px", marginTop: "-100px"}} />
                <br />
                <h2>Instructions for Specific LMS Tools</h2>
                <p> LMS products come with features for collecting documents
                    from students and managing them in bulk. These features
                    are often used for grading files like papers or presentations.
                    These types of files must be examined individually for
                    grading. One great advantage of Free Math is that all
                    documents are graded together, with optimized actions for
                    grading similar work.</p>
                    <p> Here are some links to help for managing student files
                        in specific LMS products. As Free Math natively opens
                        and saves zip files, you can often avoid steps related
                        to unzipping downloaded documents and manually creating
                        a new zip of the graded documents when re-uploading.
                        Keep this in mind as you follow these instructions.
                    </p>
                    <a href="https://www.umass.edu/it/support/moodle/grade-assignments-moodle"
                       target="_blank" rel="noopener noreferrer">Moodle</a>
                       &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    <a href="https://imgur.com/a/0rskc"
                       target="_blank" rel="noopener noreferrer">Google Classroom</a>
                       &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    Canvas (
                        <a href="https://community.canvaslms.com/docs/DOC-12813"
                           target="_blank" rel="noopener noreferrer">Download</a>&nbsp;&nbsp;
                        <a href="https://community.canvaslms.com/docs/DOC-10003-415275096"
                           target="_blank" rel="noopener noreferrer">Upload</a>
                    )&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    <a href={"https://telhelp.shu.ac.uk/batch-upload-feedback-file" +
                             "-attachments-grade-centre-assignments-submitted-online"}
                       target="_blank" rel="noopener noreferrer">Blackboard</a>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    D2L (
                    <a href={"https://oit.colorado.edu/tutorial/" +
                             "d2l-download-all-dropbox-folder-submissions"}
                       target="_blank" rel="noopener noreferrer">Download</a>&nbsp;&nbsp;
                        <a href="https://oit.colorado.edu/tutorial/d2l-upload-feedback-files"
                           target="_blank" rel="noopener noreferrer">Upload</a>
                    )&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    <a href={"https://support.schoology.com/hc/en-us/" +
                             "articles/201001503-How-do-teachers-use-Assignment-Submissions-"}
                       target="_blank" rel="noopener noreferrer">Schoology</a>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;

        <div ref="youtubeEmbed" title="Youtube Getting Started" style={{position:"relative",height:"0",paddingTop:"30px", "paddingBottom":"56.25%"}}><iframe title="Free Math Demo" src="https://www.youtube.com/embed/vB7KCDeBYpI?ecver=2" width="640" height="360" frameBorder="0" gesture="media" style={{position:"absolute",width:"100%",height:"100%",left:0}}></iframe></div>

        <br />
        <br />
                <span id="faq" />
                <div style={{paddingTop: "80px", marginTop: "-100px"}} />
                <br />
                <h2>FAQ</h2>
                <p><b>Does Free Math solve math problems?</b></p>
                <p>No, Free Math allows students to record their work, but does not solve problems automatically.</p>
                <p><b>Where are the problems for Free Math?</b></p>
                <p>Free Math is designed to work with any existing exercises from a book, worksheet or digital problem bank. Students copy problems into Free Math just as they would with a paper notebook.</p>
                <p><b>Where is the answer key for grading?</b></p>
                <p>There is no need to provide Free Math with an answer key. The grading page finds similar student answers on each problem, you only need to grade each final answer once and confirm that work was provided by each student to justify reaching their answer.</p>
                <p><b>If students submit files for their assignments, how does the system prevent cheating?</b></p>
                <p>In addition to comparing individual answers, Free Math also compares students' overall documents for similarity. If two or more documents share a lot of work, they will be flagged for you to review side by side.</p>
                <p><b>Isn't the point of digital homework to avoid doing the grading yourself?</b></p>
                <p>Computers are great for automating away repetitive tasks. Fully automated grading tools do not provide the same detailed feedback as teacher, and most have no ability to determine if an answer is partially correct. Free Math is taking a different approach, recognizing that grading is a creative task with repetitive elements. The software allows bulk actions for similar work, but gives you the flexibility to provide partial credit and detailed feedback in a way algorithmic grading cannot today. Feedback provided from a teacher is a great learning tool, but grading everything produced by your students just isn't feasible. Free Math helps sort through student work to show what needs feedback most urgently.</p>
                <h2>Supported Platforms</h2>
                <p>
                Modern browsers on Chromebooks, Windows, Mac and Linux. <br />
                Android and iOS are currently unsupported, but some devices may work.
                </p>
                <span id="license" />
                <div style={{paddingTop: "80px", marginTop: "-100px"}} />
                <br />
                <h3>Legal</h3>
                <small>
                Free Math is free software: you can redistribute it and/or modify
                it under the terms of the GNU General Public License as published by
                the Free Software Foundation, either version 3 of the License, or
                (at your option) any later version.

                Free Math is distributed in the hope that it will be useful,
                but WITHOUT ANY WARRANTY; without even the implied warranty of
                MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
                GNU General Public License for more details.

                You should have received a copy of the GNU General Public License
                along with Free Math.  If not, see &lt;http://www.gnu.org/licenses/&gt;.
                </small>
            </div>
        );

    }
