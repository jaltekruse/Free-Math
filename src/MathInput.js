import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import _ from 'underscore';
import TeX from './TeX.js';
import { symbolGroups } from './MathEditorHelpModal.js';
import { default as Button, CloseButton, LightButton } from './Button.js';
import MathQuillStatic from './MathQuillStatic.js';
var MathQuill = window.MathQuill;

// TeX button from Persus
var prettyBig = { fontSize: "150%" };
var slightlyBig = { fontSize: "120%" };
var symbStyle = { fontSize: "130%" };

var SET_KEYBOARD_BUTTON_GROUP = 'SET_KEYBOARD_BUTTON_GROUP';
var BUTTON_GROUP = 'BUTTON_GROUP';
var CALC = 'CALC';
var MATRIX = 'MATRIX';
var GEOMETRY = 'GEOMETRY';
var BASIC = 'BASIC';
var SET_THEORY = 'SET_THEORY';
var GREEK = 'GREEK';

class MatrixSizePicker extends React.Component {
    static propTypes = {
        onInsert: PropTypes.func.isRequired,
    };
    state = {
        showMenu: false,
        hoveredCell: null,
        endCaps: 'b'
    }
    closeMenu = () => {
        this.setState({showMenu: false});
    }

    // https://blog.logrocket.com/controlling-tooltips-pop-up-menus-using-compound-components-in-react-ccedc15c7526/
    componentDidMount() {
        window.addEventListener('click', this.closeMenu);
    }

    componentWillUnmount() {
        window.removeEventListener('click', this.closeMenu);
    }

    render() {
        // based on current hovered cell (if any) return a color for
        // a given cell, all of the rows and columns before the hovered
        // cell are highlighted to show the shape/size of the matrix
        // that will be created clicking on the current cell
        const cellColor = (row, column) => {
            if (this.state.hoveredCell &&
                this.state.hoveredCell[0] >= row &&
                this.state.hoveredCell[1] >= column) {
                return '#e0e0e0';
            } else {
                return '#ffffff';
            }
        }
        return (
            <div>
                <div style={{float: 'left'}}>
                Choose a Size
                <br />
                <div
                    onMouseLeave={() => {
                        this.setState({hoveredCell : null});
                    }}
                >
                {
                _.map([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], row => {
                    return (<div key={'matrix_row_' + row} style={{padding: '0px', margin: '0px', lineHeight: 0.8}}>
                        {_.map([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], column => {
                            // create a (component, thing we should send to mathquill) pair
                            return <button className="fm-close-button"
                                           key={'matrix_' + row + ' ' + column}
                                           style={{float: 'none',
                                                   height: '25px',
                                                   width: '25px',
                                                   padding: '0px',
                                                   margin: '0px',
                                                   backgroundColor: cellColor(row, column) }}
                                    onClick={() => {
                                        this.props.onInsert(input => {
                                            const oneRow = new Array(column).join('&');
                                            const latex = '\\begin{' + this.state.endCaps + 'matrix}' +
                                                // yes this is dumb, but so is javascript, could be clearer
                                                // with just polyfilling something but I don't feel like doing
                                                // that right now
                                                (row == 1 ? oneRow : new Array(row).join(oneRow + '\\\\')) +
                                                '\\end{' + this.state.endCaps + 'matrix}';
                                            input.write(latex);
                                        });
                                    }}
                                    onMouseEnter={() => {
                                        this.setState({hoveredCell : [row, column]});
                                    }}
                                    />
                        })
                        }
                    </div>);
                })
                }
                </div>
                </div>
                <div className="matrix-end-caps-and-buttons"
                        style={{width: "150px", marginLeft: '10px', marginRight: '10px', float:'left'}}>
                    End Caps
                    <br />

                     <button
                         className='fm-button-light'
                         onClick={(e) => {
                             e.nativeEvent.stopPropagation();
                             this.setState((prev) => ({
                                 showMenu: !prev.showMenu,
                             }));
                         }}
                     >
                            <div style={{display:"inline-block"}}>
                                <div style={{float: "left", fontSize: '16px', paddingTop: "4px"}}>
                                    {
                                        function() {
                                            var caps;
                                            switch(this.state.endCaps) {
                                                case 'b': caps = '[ ]'; break;
                                                case 'p': caps = '( )'; break;
                                                case '' : caps = 'None'; break;
                                                case 'B': caps = '{ }'; break;
                                                case 'v': caps = '| |'; break;
                                                case 'V': caps = '‖ ‖'; break;
                                            };
                                            return caps + " \u25BC";
                                        }.bind(this)()}
                                </div>
                            </div>
                    </button>
                    <div style={{
                            backgroundColor: '#f1f1f1', position:'absolute',
                            boxShadow: '0px 8px 16px 0px rgba(0,0,0,0.2)',
                            minWidth: '50px',
                            // TODO - fix this to keep track of used z-indexes
                            zIndex: '5',
                            display: this.state.showMenu ? 'block' : 'none' }}>
                        <LightButton text='[ ]'
                            style={{display: 'block', width: '100%', borderRadius: '0px'}}
                            onClick={() => {this.setState({endCaps: 'b'}); this.closeMenu();}}/>
                        <LightButton text='( )'
                            style={{display: 'block', width: '100%', borderRadius: '0px'}}
                            onClick={() => {this.setState({endCaps: 'p'}); this.closeMenu();}}/>
                        <LightButton text='None'
                            style={{display: 'block', width: '100%', borderRadius: '0px'}}
                            onClick={() => {this.setState({endCaps: ''}); this.closeMenu();}}/>
                        <LightButton text='{ }'
                            style={{display: 'block', width: '100%', borderRadius: '0px'}}
                            onClick={() => {this.setState({endCaps: 'B'}); this.closeMenu();}}/>
                        <LightButton text='| |'
                            style={{display: 'block', width: '100%', borderRadius: '0px'}}
                            onClick={() => {this.setState({endCaps: 'v'}); this.closeMenu();}}/>
                        <LightButton text='‖ ‖'
                            style={{display: 'block', width: '100%', borderRadius: '0px'}}
                            onClick={() => {this.setState({endCaps: 'V'}); this.closeMenu();}}/>
                    </div>
                    <br />
                    <br />
                    {this.props.buttonRows}
                </div>
            </div>
        );
    }
}

class TexButtons extends React.Component {
    static propTypes = {
        onInsert: PropTypes.func.isRequired,
        buttonGroup: PropTypes.string.isRequired
    };


    render() {
        //MathQuill = MathQuill.getInterface(1);

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

        var singleCharButton = (character) => {
            return (<button onClick={() => { this.props.onInsert(character)}}
                                       className="tex-button"
                                       key={character}
                                       tabIndex={-1}
                                       type="button">
                            <TeX>{character + ''}</TeX>
                    </button>);
        };

        var textButton = () => {
            return (
                    <button title={"\\text [Enter]"} className="tex-button"
                        style={{display: "inline-block", float: "none", width: "50px"}}
                              onClick={() => {
                            this.props.onInsert(input => {
                                input.cmd("\\text");
                            });
                        }}>
                        <TeX>{"\\text{Text}"}</TeX>
                    </button>
            );
        }

        var backspaceButton = () => {
            return (
                    <button className="tex-button wide-tex-button" style={{display: "inline-block", float: "none"}}
                              onClick={() => {
                            this.props.onInsert(input => {
                                input.keystroke("Backspace");
                            });
                        }}>
                        <TeX>{"\\text{Backspace}"}</TeX>
                    </button>
            );

        };

        var arrowKeys = () => {
            return (
                <table style={{borderCollapse:"collapse"}}>
                <tbody>
                <tr>
                <td></td>
                <td>
                    <button className="tex-button" style={{display: "inline-block", float: "none"}}
                            onClick={() => {
                            this.props.onInsert(input => {
                                input.keystroke("Up");
                            });
                        }}>
                        <TeX>{"\\uparrow"}</TeX>
                    </button>
                </td>
                <td></td>
                </tr>
                <tr>
                <td>
                    <button className="tex-button" style={{display: "inline-block", float: "none"}}
                            onClick={() => {
                            this.props.onInsert(input => {
                                input.keystroke("Left");
                            });
                        }}>
                        <TeX>{"\\leftarrow"}</TeX>
                    </button>
                </td>
                <td>
                    <button className="tex-button" style={{display: "inline-block", float: "none"}}
                              onClick={() => {
                            this.props.onInsert(input => {
                                input.keystroke("Down");
                            });
                        }}>
                        <TeX>{"\\downarrow"}</TeX>
                    </button>
                </td>
                <td>
                    <button className="tex-button" style={{display: "inline-block", float: "none"}}
                            onClick={() => {
                            this.props.onInsert(input => {
                                input.keystroke("Right");
                            });
                        }}>
                        <TeX>{"\\rightarrow"}</TeX>
                    </button>
                </td>
                </tr>
                </tbody>
                </table>
            );
        }

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
                                window.ephemeralStore.dispatch(
                                    { type : SET_KEYBOARD_BUTTON_GROUP, [BUTTON_GROUP] : BASIC });}}/>
                <Button text="Geometry"
                        style={this.props.buttonGroup === GEOMETRY ?
                                    { backgroundColor: "#052d66"} : {}}
                    onClick={function() {
                                window.ephemeralStore.dispatch(
                                    { type : SET_KEYBOARD_BUTTON_GROUP, [BUTTON_GROUP] : GEOMETRY});}}/>
                <Button text="Set Theory and Logic"
                        style={this.props.buttonGroup === SET_THEORY ?
                                    { backgroundColor: "#052d66"} : {}}
                    onClick={function() {
                                window.ephemeralStore.dispatch(
                                    { type : SET_KEYBOARD_BUTTON_GROUP, [BUTTON_GROUP] : SET_THEORY });}}/>
                <Button text="Matrix"
                        style={this.props.buttonGroup === MATRIX ?
                                    { backgroundColor: "#052d66"} : {}}
                    onClick={function() {
                                window.ephemeralStore.dispatch(
                                    { type : SET_KEYBOARD_BUTTON_GROUP, [BUTTON_GROUP] : MATRIX});}}/>
                <Button text="Calculus"
                        style={this.props.buttonGroup === CALC ?
                                    { backgroundColor: "#052d66"} : {}}
                    onClick={function() {
                                window.ephemeralStore.dispatch(
                                    { type : SET_KEYBOARD_BUTTON_GROUP, [BUTTON_GROUP] : CALC });}}/>
                <Button text="Greek"
                        style={this.props.buttonGroup === GREEK ?
                                    { backgroundColor: "#052d66"} : {}}
                    onClick={function() {
                                window.ephemeralStore.dispatch(
                                    { type : SET_KEYBOARD_BUTTON_GROUP, [BUTTON_GROUP] : GREEK });}}/>
            </div>

            <div>
            <div className="homepage-disappear-mobile" style={{display: "inline-block", verticalAlign:"top"}}>
                <div>
                    {_.map([1,2,3,4,5,6,7,8,9,0,'.','-'], number => {
                        // create a (component, thing we should send to mathquill) pair
                        return singleCharButton(number);
                    })}
                </div>
            </div>
            </div>
            <div>
            <div className="math-buttons-current-panel">
                {this.props.buttonGroup === MATRIX ?
                        <MatrixSizePicker onInsert={this.props.onInsert} buttonRows={buttonRows}/>
                        : <span>{buttonRows} </span>
                }

            </div>
            <div style={{float: 'left', marginTop: '10px'}}>
                {textButton()}
                {backspaceButton()}
                <div style={{display: 'block'}}>
                    {_.map(['a','b','c'], letter => {
                        // create a (component, thing we should send to mathquill) pair
                        return singleCharButton(letter);
                    })}
                </div>
                <div style={{display: 'inline-block'}}>
                    {_.map(['x','y','z'], letter => {
                        // create a (component, thing we should send to mathquill) pair
                        return singleCharButton(letter);
                    })}
                </div>
                {arrowKeys()}
            </div>
            </div>
        </div>;
    }
}

// end TeX buttons from Perseus

// Math editor copied from Khan Perseus project

// A WYSIWYG math input that calls `onChange(LaTeX-string)`
class MathInput extends React.Component {
    static propTypes = {
        value: PropTypes.string,
        convertDotToTimes: PropTypes.bool,
        buttonsVisible: PropTypes.oneOf(['always', 'never', 'focused']),
        labelText: PropTypes.string,
        onFocus: PropTypes.func,
        onBlur: PropTypes.func,
        onChange: PropTypes.func,
        onSubmit: PropTypes.func,
        styles: PropTypes.object,
        buttonGroup: PropTypes.string,
        upOutOf: PropTypes.func,
        downOutOf: PropTypes.func
    };

    static defaultProps = {
        value: "",
        convertDotToTimes: false,
        buttonsVisible: 'focused'
    };

    state = { focused: false };

    render() {
        // mathquill usually adds these itself but react removes them when
        // updating the component.
        var className = "perseus-math-input mq-editable-field mq-math-mode";

        if (this.props.className) {
            className = className + " " + this.props.className;
        }

        var buttons = null;
        if (this._shouldShowButtons()) {
            buttons = <TexButtons
                className="math-input-buttons absolute"
                convertDotToTimes={this.props.convertDotToTimes}
                onInsert={this.insert}
                buttonGroup={this.props.buttonGroup} />;
        }

        return <div style={{display: 'inline-block'}}>
            <div style={{...this.props.styles, display: 'inline-block'}}>
                <span className={className}
                      ref="mathinput"
                      style={{minWidth:'200px', padding:'5px', margin: '2px'}}
                      aria-label={this.props.labelText}
                      onFocus={this.handleFocus}
                      onBlur={this.handleBlur} />
            </div>
            <div style={{position: "relative"}}>
                {buttons}
            </div>
        </div>;
    }

    // handlers:
    // keep track of two related bits of state:
    // * this.state.focused - whether the buttons are currently shown
    // * this.mouseDown - whether a mouse click is active that started in the
    //   buttons div

    handleFocus = () => {
        this.setState({ focused: true });
        // TODO(joel) fix properly - we should probably allow onFocus handlers
        // to this property, but we need to work correctly with them.
        // if (this.props.onFocus) {
        //     this.props.onFocus();
        // }
    };

    handleMouseDown = (event) => {
        var focused = ReactDOM.findDOMNode(this).contains(event.target);
        this.mouseDown = focused;
        if (!focused) {
            this.setState({ focused: false });
        }
    };

    handleMouseUp = () => {
        // this mouse click started in the buttons div so we should focus the
        // input
        if (this.mouseDown) {
            this.focus();
        }
        this.mouseDown = false;
    };

    handleBlur = () => {
        if (!this.mouseDown) {
            this.setState({ focused: false });
        }
    };

    _shouldShowButtons = () => {
        if (this.props.buttonsVisible === 'always') {
            return true;
        } else if (this.props.buttonsVisible === 'never') {
            return false;
        } else {
            return this.state.focused;
        }
    };

    insert = (value) => {
        var input = this.mathField();
        if (_(value).isFunction()) {
            value(input);
        } else if (value[0] === '\\') {
            input.cmd(value).focus();
        } else {
            input.write(value).focus();
        }
        input.focus();
    };

    mathField = (options) => {
        MathQuill = window.MathQuill
        // MathQuill.MathField takes a DOM node, MathQuill-ifies it if it's
        // seeing that node for the first time, then returns the associated
        // MathQuill object for that node. It is stable - will always return
        // the same object when called on the same DOM node.
        return MathQuill.MathField(ReactDOM.findDOMNode(this.refs.mathinput), options);
    };

    componentWillUnmount() {
        window.removeEventListener("mousedown", this.handleMouseDown);
        window.removeEventListener("mouseup", this.handleMouseUp);
    }

    componentDidMount() {

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
            charsThatBreakOutOfSupSub: '=<>≠≤≥',

            handlers: {
                edited: (mathField) => {
                    // This handler is guaranteed to be called on change, but
                    // unlike React it sometimes generates false positives.
                    // One of these is on initialization (with an empty string
                    // value), so we have to guard against that below.
                    var value = mathField.latex();

                    // Provide a MathQuill-compatible way to generate the
                    // not-equals sign without pasting unicode or typing TeX
                    //value = value.replace(/<>/g, "\\ne");

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
                    //mathField.typedText("^");
                    this.props.upOutOf();
                },
                downOutOf: (mathField) => {
                    // This handler is called when the user presses the up
                    // arrow key, but there is nowhere in the expression to go
                    // up to (no numerator or exponent). For ease of use,
                    // interpret this as an attempt to create an exponent.
                    //console.log("Up");
                    //mathField.typedText("^");
                    this.props.downOutOf();
                }
            }
        });

        // Ideally, we would be able to pass an initial value directly into
        // the constructor above
        this.mathField().latex(this.props.value);

        initialized = true;
    }

    /*
    shouldComponentUpdate: function(oldProps, newProps) {
        return oldProps.styles !== newProps.styles || oldProps.value !== newProps.value;
    },
    */

    componentDidUpdate() {
        // I think this check is expensive, how can I make it cheaper?
        if (!_.isEqual(this.mathField().latex(), this.props.value)) {
            //console.log(this.props);
            this.mathField().latex(this.props.value);
        }
    }

    focus = () => {
        this.mathField().focus();
        this.setState({ focused: true });
    };

    blur = () => {
        this.mathField().blur();
        this.setState({ focused: false });
    };
}

export default MathInput;

// End of Khan Math Editor
