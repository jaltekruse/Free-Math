import React from 'react';
import createReactClass from 'create-react-class';
import ReactDOM from 'react-dom';
import TeX from './TeX.js';
import MathQuillStatic from './MathQuillStatic.js';

var MathQuill = window.MathQuill;

const symbolGroups = {
    BASIC : [
        {toType:"+", tex:"+"},
        {toType:"-", tex:"-"},
        {toType:"* (asterisk)", tex:"\\cdot"},
        {toType:"/ (slash)", tex:"\\frac{a}{b}", description:"fraction", editorCommands: input => {
            input.typedText("/");
        }},
        {toType:"\\div [Enter]", tex:"\\div"},
        {toType:"pi", tex:"\\pi"},
        {toType:"sqrt", tex:"\\sqrt{x}", editorCommands: input => {
            input.cmd("\\sqrt");
        }},
        {toType:"\\nthroot [Enter]", tex:"\\sqrt[y]{x}", editorCommands: input => {
            input.cmd("\\nthroot").focus();
        }},
        {toType:"log", tex:"\\log"},
        {toType:"ln", tex:"\\ln"},
        {toType:"log_b", tex:"\\log_b", editorCommands: input => {
                input.typedText("log_");
                input.keystroke("Right");
                input.typedText("(");
                input.keystroke("Left");
                input.keystroke("Left");
        }},
        {toType:"| (shift backslash)", tex:"\\left|x\\right|", editorCommands: input => {
                input.typedText("|");
        }},
        /* () => [<TeX key="abs" style={symbStyle}>\left|x\right|</TeX>, "\\left|x\\right|"], */
        {toType:">", tex:">"},
        {toType:">=", tex:"\\ge"},
        {toType:"<", tex:"<"},
        {toType:"<=", tex:"\\le"},
        {toType:"\\approx [Enter]", tex:"\\approx"},
        {toType:"_ (underscore)", tex:"A_b", description: "subscript"},
        {toType:"up arrow or ^ (caret)", tex:"a^b", description:"power"},
        {toType:"\\pm [Enter]", tex:"\\pm"},
        {toType:"\\degree [Enter]", tex:"\\degree"},
        {toType:"\\angle [Enter]", tex:"\\angle"},
    ],
    SET_THEORY : [
        {toType:"forall", tex:"\\forall"},
        {toType:"therefore", tex:"\\therefore"},
        {toType:"\\in [Enter]", tex:"\\in"},
        {toType:"\\notin [Enter]", tex:"\\notin"},
        {toType:"\\nexists", tex:"\\nexists"},
        {toType:"\\exists", tex:"\\exists"},
        {toType:"\\neg", tex:"\\neg"},
        {toType:"\\lor", tex:"\\lor"},
        {toType:"\\land", tex:"\\land"},
        {toType:"\\to [Enter]", tex:"\\to"},
        {toType:"\\gets [Enter]", tex:"\\gets"},
        {toType:"union", tex:"\\cup"},
        {toType:"\\intersect [Enter]", tex:"\\cap"},
        {toType:"subset", tex:"\\subset"},
        {toType:"\\subseteq [Enter]", tex:"\\subseteq"},
        {toType:"\\superset [Enter]", tex:"\\supset"},
        {toType:"\\superseteq [Enter]", tex:"\\supseteq"},
    ],
    CALC : [
        {toType:"int", tex:"\\int"},
        {toType:"' (single quote)", tex:"'"},
        {toType:"\\oint [Enter]", tex:"\\oint"},
        {toType:"\\partial [Enter]", tex:"\\partial"},
        {toType:"sum", tex:"\\sum"},
        {toType:"\\infinity [Enter]", tex:"\\infty"},
    ],
    GREEK : [
        {toType:"alpha", tex:"\\alpha"},
        {toType:"beta", tex:"\\beta"},
        {toType:"gamma", tex:"\\gamma"},
        {toType:"\\Gamma [Enter]", tex:"\\Gamma"},
        {toType:"delta", tex:"\\delta"},
        {toType:"\\Delta [Enter]", tex:"\\Delta"},
        {toType:"epsilon", tex:"\\epsilon"},
        {toType:"digamma", tex:"\\digamma"},
        {toType:"zeta", tex:"\\zeta"},
        {toType:"eta", tex:"\\eta"},
        {toType:"theta", tex:"\\theta"},
        {toType:"\\Theta [Enter]", tex:"\\Theta"},
        {toType:"iota", tex:"\\iota"},
        {toType:"kappa", tex:"\\kappa"},
        {toType:"lambda", tex:"\\lambda"},
        {toType:"\\Lambda [Enter]", tex:"\\Lambda"},
        {toType:"\\mu [Enter]", tex:"\\mu"},
        {toType:"\\nu [Enter]", tex:"\\nu"},
        {toType:"xi", tex:"\\xi"},
        {toType:"\\Xi [Enter]", tex:"\\Xi"},
        {toType:"pi", tex:"\\pi"},
        {toType:"\\Pi [Enter]", tex:"\\Pi"},
        {toType:"rho", tex:"\\rho"},
        {toType:"\\varrho [Enter]", tex:"\\varrho"},
        {toType:"sigma", tex:"\\sigma"},
        {toType:"\\Sigma [Enter]", tex:"\\Sigma"},
        {toType:"tau", tex:"\\tau"},
        {toType:"upsilon", tex:"\\upsilon"},
        {toType:"\\Upsilon [Enter]", tex:"\\Upsilon"},
        {toType:"\\phi [Enter]", tex:"\\phi"},
        {toType:"\\Phi [Enter]", tex:"\\Phi"},
        {toType:"\\chi [Enter]", tex:"\\chi"},
        {toType:"\\psi [Enter]", tex:"\\psi"},
        {toType:"\\Psi [Enter]", tex:"\\Psi"},
        {toType:"omega", tex:"\\omega"},
        {toType:"\\Omega [Enter]", tex:"\\Omega"},
    ]
};

export {
    symbolGroups
};
