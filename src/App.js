import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import logo from './logo.svg';
import './App.css';

var MathQuill = window.MathQuill;
var Khan = window.Khan;
var MathJax = window.MathJax;
var katex = window.katex;
var _ = window._;
var store = window.store;
var katexA11y = window.katexA11y;

var SOFT_RED = '#FFDEDE';
var RED = '#FF99CC';
var GREEN = '#2cff72';
var YELLOW = '#FFFDBF';

var EDIT_STEP = 'EDIT_STEP';
// TODO - decide if I want to add a feature to splice in
// a new step partway through a current problem
// this action expects an index for which problem to change
var NEW_STEP = 'NEW_STEP';

// Copied from Khan's Perseus project
let pendingScripts = [];
let pendingCallbacks = [];
let needsProcess = false;

const process = (script, callback) => {
    pendingScripts.push(script);
    pendingCallbacks.push(callback);
    if (!needsProcess) {
        needsProcess = true;
        setTimeout(doProcess, 0);
    }
};

const loadMathJax = (callback) => {
    if (typeof MathJax !== "undefined") {
        callback();
    } else if (typeof Khan !== "undefined" && Khan.mathJaxLoaded) {
        Khan.mathJaxLoaded.then(callback);
    } else {
        throw new Error(
            "MathJax wasn't loaded before it was needed by <TeX/>");
    }
};

const doProcess = () => {
    loadMathJax(() => {
        MathJax.Hub.Queue(function() {
            const oldElementScripts = MathJax.Hub.elementScripts;
            MathJax.Hub.elementScripts = (element) => pendingScripts;

            try {
                return MathJax.Hub.Process(null, () => {
                    // Trigger all of the pending callbacks before clearing them
                    // out.
                    for (const callback of pendingCallbacks) {
                        callback();
                    }

                    pendingScripts = [];
                    pendingCallbacks = [];
                    needsProcess = false;
                });
            } catch (e) {
                // IE8 requires `catch` in order to use `finally`
                throw e;
            } finally {
                MathJax.Hub.elementScripts = oldElementScripts;
            }
        });
    });
};

// Make content only visible to screen readers.
// Both collegeboard.org and Bootstrap 3 use this exact implementation.
const srOnly = {
    border: 0,
    clip: "rect(0,0,0,0)",
    height: "1px",
    margin: "-1px",
    overflow: "hidden",
    padding: 0,
    position: "absolute",
    width: "1px",
};

const TeX = React.createClass({
    propTypes: {
        children: React.PropTypes.node,
        onClick: React.PropTypes.func,
        onRender: React.PropTypes.func,
        style: React.PropTypes.any,
    },

    /* TODO - get re-enabled for perf boost */
    /* mixins: [PureRenderMixin], */

    shouldComponentUpdate: function(oldProps, newProps) {
        return oldProps.children !== this.props.children;
    },

    getDefaultProps: function() {
        return {
            // Called after math is rendered or re-rendered
            onRender: function() {},
            onClick: null,
        };
    },

    componentDidMount: function() {
        this._root = ReactDOM.findDOMNode(this);

        if (this.refs.katex.childElementCount > 0) {
            // If we already rendered katex in the render function, we don't
            // need to render anything here.
            this.props.onRender(this._root);
            return;
        }

        const text = this.props.children;

        this.setScriptText(text);
        process(this.script, () => this.props.onRender(this._root));
    },

    componentDidUpdate: function(prevProps, prevState) {
        // If we already rendered katex in the render function, we don't
        // need to render anything here.
        if (this.refs.katex.childElementCount > 0) {
            if (this.script) {
                // If we successfully rendered KaTeX, check if there's
                // lingering MathJax from the last render, and if so remove it.
                loadMathJax(() => {
                    const jax = MathJax.Hub.getJaxFor(this.script);
                    if (jax) {
                        jax.Remove();
                    }
                });
            }

            this.props.onRender();
            return;
        }

        const newText = this.props.children;

        if (this.script) {
            loadMathJax(() => {
                MathJax.Hub.Queue(() => {
                    const jax = MathJax.Hub.getJaxFor(this.script);
                    if (jax) {
                        return jax.Text(newText, this.props.onRender);
                    } else {
                        this.setScriptText(newText);
                        process(this.script, this.props.onRender);
                    }
                });
            });
        } else {
            this.setScriptText(newText);
            process(this.script, this.props.onRender);
        }
    },

    componentWillUnmount: function() {
        if (this.script) {
            loadMathJax(() => {
                const jax = MathJax.Hub.getJaxFor(this.script);
                if (jax) {
                    jax.Remove();
                }
            });
        }
    },

    setScriptText: function(text) {
        if (!this.script) {
            this.script = document.createElement("script");
            this.script.type = "math/tex";
            ReactDOM.findDOMNode(this.refs.mathjax).appendChild(this.script);
        }
        if ("text" in this.script) {
            // IE8, etc
            this.script.text = text;
        } else {
            this.script.textContent = text;
        }
    },

    render: function() {
        let katexHtml = null;
        try {
            katexHtml = {
                __html: katex.renderToString(this.props.children),
            };
        } catch (e) {
            /* jshint -W103 */
            if (e.__proto__ !== katex.ParseError.prototype) {
            /* jshint +W103 */
                throw e;
            }
        }

        let katexA11yHtml = null;
        if (katexHtml) {
            try {
                katexA11yHtml = {
                    __html: katexA11y.renderString(this.props.children),
                };
            } catch (e) {
                // Nothing
            }
        }

        return <div onClick={this.props.onClick}>
            <div style={{...this.props.style, display : "inline-block",padding: "3px 3px 3px 3px"}}>
            <span ref="mathjax" />
            <span
                ref="katex"
                dangerouslySetInnerHTML={katexHtml}
                aria-hidden={!!katexHtml && !!katexA11yHtml}
            />
            <span
                dangerouslySetInnerHTML={katexA11yHtml}
                style={srOnly}
            />
            </div>
        </div>;
    },
});

// End static math render copied from Perseus

// TeX button from Persus
var prettyBig = { fontSize: "150%" };
var slightlyBig = { fontSize: "120%" };
var symbStyle = { fontSize: "130%" };

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
        () => [<TeX key="abs" style={symbStyle}>\left|x\right|</TeX>, "\\left|x\\right|"],
        () => [<TeX key="inf" style={symbStyle}>\infty</TeX>, "\\infty"],
        () => [<TeX key="rightarrow" style={symbStyle}>\rightarrow</TeX>, "\\rightarrow"],
        () => [<TeX key="neq" style={symbStyle}>\neq</TeX>, "\\neq"],
    ],
};

var buttonSetsType = React.PropTypes.arrayOf(
        React.PropTypes.oneOf(_.keys(buttonSets))
    );

var TexButtons = React.createClass({
    propTypes: {
        sets: buttonSetsType.isRequired,
        onInsert: React.PropTypes.func.isRequired
    },

    render: function() {
        // Always show buttonSets in the same order. Note: Technically it's ok
        // for _.keys() to return the keys in an arbitrary order, but in
        // practice, they will be ordered as listed above.
        var sortedButtonSets = _.sortBy(this.props.sets,
            (setName) => _.keys(buttonSets).indexOf(setName));

        var buttons = _.map(sortedButtonSets, setName => buttonSets[setName]);

        var buttonRows = _.map(buttons, row => row.map(symbGen => {
            // create a (component, thing we should send to mathquill) pair
            var symbol = symbGen(this.props);
            return <button onClick={() => this.props.onInsert(symbol[1])}
                           className="tex-button"
                           key={symbol[0].key}
                           tabIndex={-1}
                           type="button">
                {symbol[0]}
            </button>;
        }));

        var buttonPopup = _.map(buttonRows, (row, i) => {
            return <div className="clearfix tex-button-row"
                        key={this.props.sets[i]}>
                {row}
            </div>;
        });

        return <div className={`${this.props.className} preview-measure`}>
            {buttonPopup}
        </div>;
    },

    statics: {
        buttonSets,
        buttonSetsType
    }
});
// end TeX buttons from Perseus

// Math editor copied from Khan Perseus project

var PT = React.PropTypes;

// A WYSIWYG math input that calls `onChange(LaTeX-string)`
var MathInput = React.createClass({
    propTypes: {
        value: PT.string,
        convertDotToTimes: PT.bool,
        buttonsVisible: PT.oneOf(['always', 'never', 'focused']),
        labelText: React.PropTypes.string,
        onFocus: PT.func,
        onBlur: PT.func,
        highlight: PT.oneOf(['red', 'green']),
    },

    render: function() {
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
                onInsert={this.insert} />;
        }

        var colorCss = {};
        if (this.props.highlight === 'red') {
            colorCss = {backgroundColor : SOFT_RED};
        } else if (this.props.highlight === 'green') {
            colorCss = {backgroundColor : GREEN };
        }
        return <div>
            <div style={{...colorCss, display: 'inline-block'}}>
                <span className={className}
                      ref="mathinput"
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

    componentDidMount: function() {
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
        console.log(this)

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
            spaceBehavesLikeTab: true,

            // for intuitive navigation of fractions
            leftRightIntoCmdGoes: 'up',

            // TODO - make xi accessible in, prevents typing "x in"
            // TODO - "in" as auto-symbol prevents typing int
            autoCommands: 'subset superset union intersect forall therefore exists alpha beta gamma delta epsilon digamma zeta eta theta iota kappa lambda xikappa lambda mu nu omicron pi rho sigma tau upsilon phi chi omega sqrt sum int',
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
                        //this.props.onChange(value);
                        store.dispatch({ type : EDIT_STEP, PROBLEM_INDEX : this.props.problemIndex,
                                         STEP_KEY : this.props.stepIndex, NEW_STEP_CONTENT : value});
                    }
                },
                enter: () => {
                    // This handler is called when the user presses the enter
                    // key. Since this isn't an actual <input> element, we have
                    // to manually trigger the usually automatic form submit.

                    // Using enter for go to next step
                    store.dispatch({ type : NEW_STEP, PROBLEM_INDEX : this.props.problemIndex});

                    //$(ReactDOM.findDOMNode(this.refs.mathinput)).submit();
                },
                upOutOf: (mathField) => {
                    // This handler is called when the user presses the up
                    // arrow key, but there is nowhere in the expression to go
                    // up to (no numerator or exponent). For ease of use,
                    // interpret this as an attempt to create an exponent.
                    console.log("Up");
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

    componentDidUpdate: function() {
        if (!_.isEqual(this.mathField().latex(), this.props.value)) {
            console.log(this.props);
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

// End of Khan Math Editor

class App extends Component {
  render() {
    return (
      <div className="App">
        <TeX>{"\\frac{5+1}{4}"}</TeX>
      </div>
    );
  }
}

export default App;
