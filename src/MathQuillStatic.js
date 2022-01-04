import React from 'react';
import ReactDOM from 'react-dom';
var MathQuill = window.MathQuill;

class MathQuillStatic extends React.Component {
    render() {
        const tex = this.props.tex;
        console.log(this.props.style);
        return (
            <div style={{ ...this.props.style, display:"inline-block"}} onClick={this.props.onClick}>
                <span ref="staticMath">{tex}</span>
            </div>
        );
    };

    componentDidMount() {
        MathQuill.StaticMath(ReactDOM.findDOMNode(this.refs.staticMath))
    };
}

export {MathQuillStatic as default};
