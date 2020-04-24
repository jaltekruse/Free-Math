import React from 'react';
import ReactDOM from 'react-dom';
var MathQuill = window.MathQuill;

class MathQuillStatic extends React.Component {
    render() {
        const tex = this.props.tex;
        return (
            <span ref="staticMath">{tex}</span>
        );
    };

    componentDidMount() {
        MathQuill.StaticMath(ReactDOM.findDOMNode(this.refs.staticMath))
    };
}

export {MathQuillStatic as default};
