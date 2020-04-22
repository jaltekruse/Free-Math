import React, { Component } from 'react';
import MathInput from './MathInput.js';

var KAS = window.KAS;

var ExprComparisonTests = React.createClass({
    getInitialState () {
        return { leftExpr: "", rightExpr : "", equals : false, matches : false};
    },

    compareExprs: function() {
        console.log("left: " + this.state.leftExpr);
        console.log("right: " + this.state.rigthExpr);
        var leftParsed = KAS.parse(this.state.leftExpr).expr;
        var rightParsed = KAS.parse(this.state.rightExpr).expr;
        // TODO - also use this to test for transitivity and commutativity of these
        // comparison algorithms
        var matches = (KAS.compare(leftParsed, rightParsed).equal
                       && leftParsed.sameForm(rightParsed));
        this.setState({ ...this.state,
            equals: (this.state.leftExpr == this.state.rightExpr),
            matches: matches});
    },

    setLeftExpr: function (expr) {
        this.setState({ ...this.state, leftExpr: expr});
    },

    setRightExpr: function(expr) {
        this.setState({ ...this.state, rightExpr: expr});
    },
    render () {
        return (
        <div>
        equals: {this.state.equals + ""} &nbsp;&nbsp; matches: {this.state.matches + ""}
        <button onClick={function() {this.compareExprs()}.bind(this)}>Compare</button>
        <MathInput
                   buttonsVisible='focused'
                   buttonSets={['trig', 'prealgebra', 'logarithms', 'calculus']}
                   value={this.state.leftExpr}
                   onChange={function(value) {
                       this.setLeftExpr(value);
                   }.bind(this)}
                   />
        <MathInput
                   buttonsVisible='focused'
                   buttonSets={['trig', 'prealgebra', 'logarithms', 'calculus']}
                   value={this.state.rightExpr}
                   onChange={function(value) {
                       this.setRightExpr(value);
                   }.bind(this)}
                   />
        </div>
        );
    }
});

export default ExprComparisonTests;
