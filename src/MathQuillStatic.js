import React from 'react';
import createReactClass from 'create-react-class';
import ReactDOM from 'react-dom';
var MathQuill = window.MathQuill;

class MathQuillStatic extends React.Component {

    render: function() {
        const tex = this.props.tex;
        return (
            <span ref="staticMath">{tex}</span>
        );
    },
    componentDidMount: function() {
        MathQuill.StaticMath(ReactDOM.findDOMNode(this.refs.staticMath));
    }
});

export {MathQuillStatic as default};
