import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import ReactDOM from 'react-dom';

var Khan = window.Khan;
var MathJax = window.MathJax;
var katexA11y = window.katexA11y;
var katex = window.katex;

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

class TeX extends React.Component {
    propTypes: {
        children: PropTypes.node,
        onClick: PropTypes.func,
        onRender: PropTypes.func,
        style: PropTypes.any,
    },

    //TODO - get re-enabled for perf boost
    // mixins: [PureRenderMixin],

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

    componentDidMount () {
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

    render () {
        let katexHtml = null;
        try {
            katexHtml = {
                __html: katex.renderToString(this.props.children),
            };
        } catch (e) {
            // jshint -W103
            if (e.__proto__ !== katex.ParseError.prototype) {
            // jshint +W103
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
            <div style={{...this.props.style, display : "inline-block",padding: "3px"}}>
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
}

export default TeX;
// End static math render copied from Perseus
