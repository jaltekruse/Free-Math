import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import ReactDOM from 'react-dom';
import _ from 'underscore';
import TeX from './TeX.js';
import { symbolGroups } from './MathEditorHelpModal.js';
import Button from './Button.js';
import MathQuillStatic from './MathQuillStatic.js';
var MathQuill = window.MathQuill;

// TeX button from Persus
var prettyBig = { fontSize: "150%" };
var slightlyBig = { fontSize: "120%" };
var symbStyle = { fontSize: "130%" };

var SET_KEYBOARD_BUTTON_GROUP = 'SET_KEYBOARD_BUTTON_GROUP';
var BUTTON_GROUP = 'BUTTON_GROUP';
var CALC = 'CALC';
var GEOMETRY = 'GEOMETRY';
var BASIC = 'BASIC';
var SET_THEORY = 'SET_THEORY';
var GREEK = 'GREEK';


// These are functions because we want to generate a new component for each use
// on the page rather than reusing an instance (which will cause an error).
// Also, it's useful for things which might look different depending on the
// props.

var basic = [
    () => [<span key="plus" style={slightlyBig}>+</span>, "+"],
    () => [<span key="minus" style={prettyBig}>-</span>, "-"],

    // TODO(joel) - display as \cdot when appropriate
    props => {
        if (props.convertDotToTimes) {
            return [
                <TeX key="times" style={prettyBig}>\times</TeX>,
                "\\times"
            ];
        } else {
            return [<TeX key="times" style={prettyBig}>\cdot</TeX>, "\\cdot"];
        }
    },
    () => [
        <TeX key="frac" style={prettyBig}>{"\\frac{□}{□}"}</TeX>,

        // If there's something in the input that can become part of a
        // fraction, typing "/" puts it in the numerator. If not, typing
        // "/" does nothing. In that case, enter a \frac.
        input => {
            var contents = input.latex();
            input.typedText("/");
            if (input.latex() === contents) {
                input.cmd("\\frac");
            }
        }
    ]
];

var buttonSets = {
    basic,

    "basic+div": basic.concat([
        () => [<TeX key="div">\div</TeX>, "\\div"]
    ]),

    trig: [
        //() => [<TeX key="sin">\sin</TeX>, "\\sin"],
        //() => [<TeX key="cos">\cos</TeX>, "\\cos"],
        //() => [<TeX key="tan">\tan</TeX>, "\\tan"],
        //() => [<TeX key="theta" style={symbStyle}>\theta</TeX>, "\\theta"],
        //() => [<TeX key="pi" style={symbStyle}>\phi</TeX>, "\\phi"]
    ],

    prealgebra: [
        () => [<TeX key="sqrt">{"\\sqrt{x}"}</TeX>, "\\sqrt"],
        // TODO(joel) - how does desmos do this?
        /*
        () => [
            <TeX key="nthroot">{"\\sqrt[3]{x}"}</TeX>,
            input => {
                input.typedText("nthroot3");
                input.keystroke("Right");
            }],
        */
        /*() => [
            <TeX key="pow" style={slightlyBig}>□^a</TeX>,
            input => {
                var contents = input.latex();
                input.typedText("^");

                // If the input hasn't changed (for example, if we're
                // attempting to add an exponent on an empty input or an empty
                // denominator), insert our own "a^b"
                if (input.latex() === contents) {
                    input.typedText("a^b");
                }
            }
        ],
        () => [<TeX key="pi" style={slightlyBig}>\pi</TeX>, "\\pi"], */
    ],

    logarithms: [
        () => [<TeX key="log">\log</TeX>, "\\log"],
        () => [<TeX key="ln">\ln</TeX>, "\\ln"],
        () => [
            <TeX key="log_b">\log_b</TeX>,
            input => {
                input.typedText("log_");
                input.keystroke("Right");
                input.typedText("(");
                input.keystroke("Left");
                input.keystroke("Left");
            }],
    ],

    "basic relations": [
        () => [<TeX key="eq">{"="}</TeX>, "="],
        () => [<TeX key="lt">\lt</TeX>, "\\lt"],
        () => [<TeX key="gt">\gt</TeX>, "\\gt"],
    ],

    "advanced relations": [
        () => [<TeX key="neq">\neq</TeX>, "\\neq"],
        () => [<TeX key="leq">\leq</TeX>, "\\leq"],
        () => [<TeX key="geq">\geq</TeX>, "\\geq"],
    ],
    "calculus": [
        () => [<TeX key="sum">{"\\sum"}</TeX>, "\\sum"],
        () => [<TeX key="integral">{"\\int"}</TeX>, "\\int"],
        /* TODO - had trouble getting these buttons to produce expressions with mutliple parts, it just inserted the latex text into the box */
        /*() => [<TeX key="dy/dx">{"\\frac{dy}{dx}"}</TeX>, "\\frac {dy}"], */
        /* () => [<TeX key="prime">'</TeX>, "'"], */
        () => [<TeX key="pi" style={symbStyle}>\pi</TeX>, "\\pi"],
        () => [<TeX key="theta" style={symbStyle}>\theta</TeX>, "\\theta"],
        () => [<TeX key="plusminux" style={symbStyle}>\pm</TeX>, "\\pm"],
        /* () => [<TeX key="abs" style={symbStyle}>\left|x\right|</TeX>, "\\left|x\\right|"], */
        () => [<TeX key="inf" style={symbStyle}>\infty</TeX>, "\\infty"],
        () => [<TeX key="rightarrow" style={symbStyle}>\rightarrow</TeX>, "\\rightarrow"],
        () => [<TeX key="neq" style={symbStyle}>\neq</TeX>, "\\neq"],
        () => [<TeX key="degree" style={symbStyle}>\degree</TeX>, "\\degree"],
        () => [<TeX key="angle" style={symbStyle}>\angle</TeX>, "\\angle"],
    ],
};

var buttonSetsType = PropTypes.arrayOf(
        PropTypes.oneOf(_.keys(buttonSets))
    );

class TexButtons extends React.Component {
    propTypes: {
        sets: buttonSetsType.isRequired,
        onInsert: PropTypes.func.isRequired,
        buttonGroup: PropTypes.string.isRequired
    },

    render () {
        //MathQuill = MathQuill.getInterface(1);
        // Always show buttonSets in the same order. Note: Technically it's ok
        // for _.keys() to return the keys in an arbitrary order, but in
        // practice, they will be ordered as listed above.
        /*
        var sortedButtonSets = _.sortBy(this.props.sets,
            (setName) => _.keys(buttonSets).indexOf(setName));

        var buttons = _.map(sortedButtonSets, setName => buttonSets[setName]);
        */


        var buttonRows = _.map(symbolGroups[this.props.buttonGroup], symbol => {
            // create a (component, thing we should send to mathquill) pair
            return <button onClick={() => {
                            var toInsert = symbol.tex;
                            if (_(symbol.editorCommands).isFunction()) {
                                toInsert = symbol.editorCommands;
                            } else if (toInsert === undefined) {
                                toInsert = symbol.mqStatic;
                            }
                            this.props.onInsert(toInsert)
                           }}
                           className="tex-button"
                           key={symbol.tex ? symbol.tex : symbol.mqStatic}
                           tabIndex={-1}
                           title={"keyboard shortcut: " + symbol.toType }
                           type="button">
                {/* MathQuillStatic compoent currenty doesn't work, closes keyboard, for now, just
                    copying out the html from rendered mathquill as workaround*/}
                {symbol.mqStatic ?
                    <MathQuillStatic tex={symbol.mqStatic} />
                    : (symbol.htmlComponent ?
                        (symbol.htmlComponent)
                        : <TeX>{symbol.tex}</TeX> )
                    }
            </button>;
        });

        return <div className={`${this.props.className} preview-measure`}>
            {/* TODO - come back to this, wanted to take up less space on mobile
                but it looks like this fights with the click handling on this
                overlay, probably related to keeping the mathquill box focused
                even when clicking the buttons
            <div className="math-button-categories-dropdown">
                Symbols&nbsp;
                <select
                    value={this.props.buttonGroup}
                    onChange={function(evt) {
                        window.store.dispatch(
                            { type : SET_KEYBOARD_BUTTON_GROUP, [BUTTON_GROUP] : evt.target.value});}}
                >
                    <option value="BASIC">Basic</option>
                    <option value="GEOMETRY">Geometry</option>
                    <option value="SET_THEORY">Set Theory and Logic</option>
                    <option value="CALC">Calc</option>
                    <option value="GREEK">Greek</option>
                </select>
            </div>
            */}
            <div className="math-button-categories">
                <Button text="Basic"
                        style={this.props.buttonGroup === BASIC ?
                                    { backgroundColor: "#052d66"} : {}}
                    onClick={function() {
                                window.store.dispatch(
                                    { type : SET_KEYBOARD_BUTTON_GROUP, [BUTTON_GROUP] : BASIC });}}/>
                <Button text="Geometry"
                        style={this.props.buttonGroup === GEOMETRY ?
                                    { backgroundColor: "#052d66"} : {}}
                    onClick={function() {
                                window.store.dispatch(
                                    { type : SET_KEYBOARD_BUTTON_GROUP, [BUTTON_GROUP] : GEOMETRY});}}/>
                <Button text="Set Theory and Logic"
                        style={this.props.buttonGroup === SET_THEORY ?
                                    { backgroundColor: "#052d66"} : {}}
                    onClick={function() {
                                window.store.dispatch(
                                    { type : SET_KEYBOARD_BUTTON_GROUP, [BUTTON_GROUP] : SET_THEORY });}}/>
                <Button text="Calculus"
                        style={this.props.buttonGroup === CALC ?
                                    { backgroundColor: "#052d66"} : {}}
                    onClick={function() {
                                window.store.dispatch(
                                    { type : SET_KEYBOARD_BUTTON_GROUP, [BUTTON_GROUP] : CALC });}}/>
                <Button text="Greek"
                        style={this.props.buttonGroup === GREEK ?
                                    { backgroundColor: "#052d66"} : {}}
                    onClick={function() {
                                window.store.dispatch(
                                    { type : SET_KEYBOARD_BUTTON_GROUP, [BUTTON_GROUP] : GREEK });}}/>
            </div>

            <div>Move Cursor
                <div style={{display: "inline-block"}}>
                    <button className="tex-button" style={{display: "inline-block", float: "none"}}
                            onClick={() => {
                            this.props.onInsert(input => {
                                input.keystroke("Left");
                            });
                        }}>
                        <TeX>{"\\leftarrow"}</TeX>
                    </button>
                    <button className="tex-button" style={{display: "inline-block", float: "none"}}
                            onClick={() => {
                            this.props.onInsert(input => {
                                input.keystroke("Right");
                            });
                        }}>
                        <TeX>{"\\rightarrow"}</TeX>
                    </button>
                    <button className="tex-button" style={{display: "inline-block", float: "none"}}
                            onClick={() => {
                            this.props.onInsert(input => {
                                input.keystroke("Up");
                            });
                        }}>
                        <TeX>{"\\uparrow"}</TeX>
                    </button>
                    <button className="tex-button" style={{display: "inline-block", float: "none"}}
                              onClick={() => {
                            this.props.onInsert(input => {
                                input.keystroke("Down");
                            });
                        }}>
                        <TeX>{"\\downarrow"}</TeX>
                    </button>
                    <button className="tex-button wide-tex-button" style={{display: "inline-block", float: "none"}}
                              onClick={() => {
                            this.props.onInsert(input => {
                                input.keystroke("Backspace");
                            });
                        }}>
                        <TeX>{"\\text{Backspace}"}</TeX>
                    </button>
                </div>
            </div>
            {buttonRows}
        </div>;
    },
    statics: {
        buttonSets,
        buttonSetsType
    }
});
// end TeX buttons from Perseus

// Math editor copied from Khan Perseus project

// A WYSIWYG math input that calls `onChange(LaTeX-string)`
class MathInput extends React.Component {
    propTypes: {
        value: PropTypes.string,
        convertDotToTimes: PropTypes.bool,
        buttonsVisible: PropTypes.oneOf(['always', 'never', 'focused']),
        labelText: PropTypes.string,
        onFocus: PropTypes.func,
        onBlur: PropTypes.func,
        onChange: PropTypes.func,
        onSubmit: PropTypes.func,
        styles: PropTypes.object,
        buttonGroup: PropTypes.string
    },

    render () {
        // mathquill usually adds these itself but react removes them when
        // updating the component.
        var className = "perseus-math-input mq-editable-field mq-math-mode";

        if (this.props.className) {
            className = className + " " + this.props.className;
        }

        var buttons = null;
        if (this._shouldShowButtons()) {
            buttons = <TexButtons
                sets={this.props.buttonSets}
                className="math-input-buttons absolute"
                convertDotToTimes={this.props.convertDotToTimes}
                onInsert={this.insert}
                buttonGroup={this.props.buttonGroup} />;
        }

        return <div style={{display: 'inline-block'}}>
            <div style={{...this.props.styles, display: 'inline-block'}}>
                <span className={className}
                      ref="mathinput"
                      style={{minWidth:'200px', padding:'5px', margin: '10px'}}
                      aria-label={this.props.labelText}
                      onFocus={this.handleFocus}
                      onBlur={this.handleBlur} />
            </div>
            <div style={{position: "relative"}}>
                {buttons}
            </div>
        </div>;
    },

    // handlers:
    // keep track of two related bits of state:
    // * this.state.focused - whether the buttons are currently shown
    // * this.mouseDown - whether a mouse click is active that started in the
    //   buttons div

    handleFocus: function() {
        this.setState({ focused: true });
        // TODO(joel) fix properly - we should probably allow onFocus handlers
        // to this property, but we need to work correctly with them.
        // if (this.props.onFocus) {
        //     this.props.onFocus();
        // }
    },

    handleMouseDown: function(event) {
        var focused = ReactDOM.findDOMNode(this).contains(event.target);
        this.mouseDown = focused;
        if (!focused) {
            this.setState({ focused: false });
        }
    },

    handleMouseUp: function() {
        // this mouse click started in the buttons div so we should focus the
        // input
        if (this.mouseDown) {
            this.focus();
        }
        this.mouseDown = false;
    },

    handleBlur: function() {
        if (!this.mouseDown) {
            this.setState({ focused: false });
        }
    },

    _shouldShowButtons: function() {
        if (this.props.buttonsVisible === 'always') {
            return true;
        } else if (this.props.buttonsVisible === 'never') {
            return false;
        } else {
            return this.state.focused;
        }
    },

    getDefaultProps: function() {
        return {
            value: "",
            convertDotToTimes: false,
            buttonsVisible: 'focused'
        };
    },

    getInitialState: function() {
        return { focused: false };
    },

    insert: function(value) {
        var input = this.mathField();
        if (_(value).isFunction()) {
            value(input);
        } else if (value[0] === '\\') {
            input.cmd(value).focus();
        } else {
            input.write(value).focus();
        }
        input.focus();
    },

    mathField: function(options) {
        MathQuill = window.MathQuill
        // MathQuill.MathField takes a DOM node, MathQuill-ifies it if it's
        // seeing that node for the first time, then returns the associated
        // MathQuill object for that node. It is stable - will always return
        // the same object when called on the same DOM node.
        return MathQuill.MathField(ReactDOM.findDOMNode(this.refs.mathinput), options);
    },

    componentWillUnmount: function() {
        window.removeEventListener("mousedown", this.handleMouseDown);
        window.removeEventListener("mouseup", this.handleMouseUp);
    },

    componentDidMount () {

        window.addEventListener("mousedown", this.handleMouseDown);
        window.addEventListener("mouseup", this.handleMouseUp);

        // These options can currently only be set globally. (Hopefully this
        // will change at some point.) They appear safe to set multiple times.

        // LaTeX commands that, when typed, are immediately replaced by the
        // appropriate symbol. This does not include ln, log, or any of the
        // trig functions; those are always interpreted as commands.
        //MathQuill.addAutoCommands("pi theta phi sqrt nthroot");

        // Pop the cursor out of super/subscripts on arithmetic operators or
        // (in)equalities.
        // MathQuill.addCharsThatBreakOutOfSupSub("+-*/=<>≠≤≥");

        // Prevent excessive super/subscripts or fractions from being created
        // without operands, e.g. when somebody holds down a key
        //MathQuill.disableCharsWithoutOperand("^_/");

        var initialized = false;
        //console.log(this)

        // Initialize MathQuill.MathField instance
        this.mathField({
            // The name of this option is somewhat misleading, as tabbing in
            // MathQuill breaks you out of a nested context (fraction/script)
            // if you're in one, but moves focus to the next input if you're
            // not. Spaces (with this option enabled) are just ignored in the
            // latter case.
            //
            // TODO(alex): In order to allow inputting mixed numbers, we will
            // have to accept spaces in certain cases. The desired behavior is
            // still to escape nested contexts if currently in one, but to
            // insert a space if not (we don't expect mixed numbers in nested
            // contexts). We should also limit to one consecutive space.
            // TODO Jason A. - I modified this, consider if I need it back where
            // the Khan team had it
            spaceBehavesLikeTab: false,

            // for intuitive navigation of fractions
            leftRightIntoCmdGoes: 'up',

            // TODO - make xi accessible in, prevents typing "x in"
            // TODO - "in" as auto-symbol prevents typing int
            autoCommands: 'subset superset union intersect forall therefore exists alpha beta gamma Gamma delta epsilon digamma zeta eta theta iota kappa lambda xikappa lambda omicron pi rho varrho sigma Sigma tau upsilon Upsilon omega sqrt sum int',

            autoSubscriptNumerals: true,
            charsThatBreakOutOfSupSub: '+-*/=<>≠≤≥',

            handlers: {
                edited: (mathField) => {
                    // This handler is guaranteed to be called on change, but
                    // unlike React it sometimes generates false positives.
                    // One of these is on initialization (with an empty string
                    // value), so we have to guard against that below.
                    var value = mathField.latex();

                    // Provide a MathQuill-compatible way to generate the
                    // not-equals sign without pasting unicode or typing TeX
                    value = value.replace(/<>/g, "\\ne");

                    // Use the specified symbol to represent multiplication
                    // TODO(alex): Add an option to disallow variables, in
                    // which case 'x' should get converted to '\\times'
                    if (this.props.convertDotToTimes) {
                        value = value.replace(/\\cdot/g, "\\times");

                        // Preserve cursor position in the common case:
                        // typing '*' to insert a multiplication sign.
                        // We do this by modifying internal MathQuill state
                        // directly, instead of waiting for `.latex()` to be
                        // called in `componentDidUpdate()`.
                        var left = mathField.controller.cursor[MathQuill.L];
                        if (left && left.ctrlSeq === '\\cdot ') {
                            mathField.controller.backspace();
                            mathField.cmd('\\times');
                        }
                    } else {
                        value = value.replace(/\\times/g, "\\cdot");
                    }

                    if (initialized && this.props.value !== value) {
                        this.props.onChange(value);
                    }
                },
                enter: () => {
                    // This handler is called when the user presses the enter
                    // key. Since this isn't an actual <input> element, we have
                    // to manually trigger the usually automatic form submit.

                    // Using enter for go to next step
                    this.props.onSubmit();

                    //$(ReactDOM.findDOMNode(this.refs.mathinput)).submit();
                },
                upOutOf: (mathField) => {
                    // This handler is called when the user presses the up
                    // arrow key, but there is nowhere in the expression to go
                    // up to (no numerator or exponent). For ease of use,
                    // interpret this as an attempt to create an exponent.
                    //console.log("Up");
                    mathField.typedText("^");
                }
            }
        });

        // Ideally, we would be able to pass an initial value directly into
        // the constructor above
        this.mathField().latex(this.props.value);
        this.mathField().focus();
        initialized = true;
    },

    /*
    shouldComponentUpdate: function(oldProps, newProps) {
        return oldProps.styles !== newProps.styles || oldProps.value !== newProps.value;
    },
    */

    componentDidUpdate: function() {
        // I think this check is expensive, how can I make it cheaper?
        if (!_.isEqual(this.mathField().latex(), this.props.value)) {
            //console.log(this.props);
            this.mathField().latex(this.props.value);
        }
    },

    focus: function() {
        this.mathField().focus();
        this.setState({ focused: true });
    },

    blur: function() {
        this.mathField().blur();
        this.setState({ focused: false });
    }
});

export default MathInput;

// End of Khan Math Editor
