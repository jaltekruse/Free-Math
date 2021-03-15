import React from 'react';

const symbolGroups = {
    BASIC : [
        {toType:"+", tex:"+"},
        {toType:"-", tex:"-"},
        {toType:"* (asterisk)", tex:"\\cdot"},
        {toType:"\\times [Enter]", tex:"\\times"},
        {toType:"\\div [Enter]", tex:"\\div"},
        {toType:"/ (slash)", tex:"\\frac{a}{b}", description:"fraction", editorCommands: input => {
            input.typedText("/");
        }},
        {toType:"=", tex:"="},
        {toType:"\\neq [Enter]", tex:"\\neq"},
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
        {toType:"\\vert [Enter]", tex:"\\vert"},
        {toType:"| (shift backslash)", tex:"\\left|x\\right|", editorCommands: input => {
                input.typedText("|");
        }},
        /* () => [<TeX key="abs" style={symbStyle}>\left|x\right|</TeX>, "\\left|x\\right|"], */
        {toType:">", tex:">"},
        {toType:">=", tex:"\\ge"},
        {toType:"<", tex:"<"},
        {toType:"<=", tex:"\\le"},
        {toType:"\\approx [Enter]", tex:"\\approx"},
        {toType:"_ (underscore)", tex:"A_b", description: "subscript", editorCommands: input => {
                input.typedText("_");
        }},
        {toType:"up arrow or ^ (caret)", tex:"a^b", description:"power", editorCommands: input => {
                input.typedText("^");
        }},
        {toType:"\\pm [Enter]", tex:"\\pm"},
        {toType:"\\circ [Enter]", description: "function composition", tex:"\\circ"},
        {toType:"(", tex:"(", editorCommands: input => {
            input.typedText("(");
        }},
        {toType:")", tex:")", editorCommands: input => {
            input.typedText(")");
        }},
        {toType:"[", tex:"[", editorCommands: input => {
            input.typedText("[");
        }},
        {toType:"]", tex:"]", editorCommands: input => {
            input.typedText("]");
        }},
        {toType:"\\langle [Enter]", tex:"\\langle"},
        {toType:"\\rangle [Enter]", tex:"\\rangle"},
        {toType:"\\{", tex:"\\{", editorCommands: input => {
            input.typedText("{");
        }},
        {toType:"\\}", tex:"\\}", editorCommands: input => {
            input.typedText("}");
        }},
    ],
    SET_THEORY : [
        {toType:"forall", tex:"\\forall"},
        {toType:"therefore", tex:"\\therefore"},
        {toType:"\\because [Enter]", tex:"\\because"},
        {toType:"\\in [Enter]", tex:"\\in"},
        {toType:"\\notin [Enter]", tex:"\\notin"},
        {toType:"\\nexists", tex:"\\nexists"},
        {toType:"\\exists", tex:"\\exists"},
        {toType:"\\neg", tex:"\\neg"},
        {toType:"\\lor", tex:"\\lor"},
        {toType:"\\land", tex:"\\land"},
        {toType:"\\to [Enter]", tex:"\\to"},
        {toType:"\\gets [Enter]", tex:"\\gets"},
        {toType:"\\choose [Enter]", tex:"\\binom{n}{m}", editorCommands: input => {
            input.cmd("\\choose");
        }},
        {toType:"union", tex:"\\cup"},
        {toType:"\\intersect [Enter]", tex:"\\cap"},
        {toType:"subset", tex:"\\subset"},
        {toType:"\\subseteq [Enter]", tex:"\\subseteq"},
        {toType:"\\superset [Enter]", tex:"\\supset"},
        {toType:"\\superseteq [Enter]", tex:"\\supseteq"},
        {toType:"\\C [Enter]", tex:"\\mathbb{C}", editorCommands: input => {
            input.cmd("\\C");
        }},
        {toType:"\\H [Enter]", tex:"\\mathbb{H}", editorCommands: input => {
            input.cmd("\\H");
        }},
        {toType:"\\N [Enter]", tex:"\\mathbb{N}", editorCommands: input => {
            input.cmd("\\N");
        }},
        {toType:"\\P [Enter]", tex:"\\mathbb{P}",  editorCommands: input => {
            input.cmd("\\P");
        }},
        {toType:"\\Q [Enter]", tex:"\\mathbb{Q}",  editorCommands: input => {
            input.cmd("\\Q");
        }},
        {toType:"\\R [Enter]", tex:"\\mathbb{R}",  editorCommands: input => {
            input.cmd("\\R");
        }},
        {toType:"\\Z [Enter]", tex:"\\mathbb{Z}",  editorCommands: input => {
            input.cmd("\\Z");
        }}
    ],
    GEOMETRY : [

        {toType:"\\underline [Enter]", tex:"\\underline{AB}", editorCommands: input => {
            input.cmd("\\underline");
        }},
        {toType:"\\overline [Enter]", tex:"\\overline{AB}", editorCommands: input => {
            input.cmd("\\overline");
        }},
        {toType:"\\overleftarrow [Enter]", tex:"\\overleftarrow{AB}", editorCommands: input => {
            input.cmd("\\overleftarrow");
        }},
        {toType:"\\overrightarrow [Enter]", tex:"\\overrightarrow{AB}", editorCommands: input => {
            input.cmd("\\overrightarrow");
        }},
        {toType:"\\overleftrightarrow [Enter]", tex:"\\overleftrightarrow{AB}", editorCommands: input => {
            input.cmd("\\overleftrightarrow");
        }},
        /* not in katex */
        {toType:"\\overarc [Enter]", htmlComponent:
            (<span className="mq-math-mode">
                <span className="mq-selectable">{"\\overarc{AB}"}</span>
                <span className="mq-root-block mq-hasCursor">
                    <span className="mq-non-leaf mq-overarc">
                        <var>A</var>
                        <var>B</var>
                    </span>
                <span className="mq-cursor">​</span>
            </span></span>),
            editorCommands: input => {
                input.cmd("\\overarc");
        }},
        /* not in mathquill, there is "hat" but it feels a bit broken
        {toType:"\\widehat [Enter]", tex:"\\widehat{abc}", editorCommands: input => {
            input.cmd("\\widehat");
        }},
        */
        {toType:"\\triangle", tex:"\\triangle"},

        /* renders funny in MathQuill, almost looks like emoji?
        {toType:"\\square [Enter]", tex:"\\square"},
        */
        {toType:"\\odot [Enter]", tex:"\\odot"},
        {toType:"\\bigcirc [Enter]", tex:"\\bigcirc"},
        {toType:"\\degree [Enter]", tex:"\\degree"},
        {toType:"\\angle [Enter]", tex:"\\angle"},
        {toType:"\\measuredangle [Enter]", tex:"\\measuredangle"},
        /* not in MathQuill
        {toType:"\\sphericalangle [Enter]", tex:"\\sphericalangle"},
        */
        {toType:"\\equiv [Enter]", tex:"\\equiv"},
        {toType:"\\propto [Enter]", tex:"\\propto"},
        {toType:"\\cong [Enter]", tex:"\\cong"},
        {toType:"\\perp [Enter]", tex:"\\perp"},
        {toType:"\\parallel [Enter]", tex:"\\parallel"},
        /* not in MathQuill
        {toType:"\\approxeq [Enter]", tex:"\\approxeq"},
        */
        {toType:"\\simeq [Enter]", tex:"\\simeq"},
        {toType:"\\sim [Enter]", tex:"\\sim"},
        // TODO - wrong symbol used for this in MathQuill
        // Katex appears correct
        //{toType:"\\asymp [Enter]", tex:"\\asymp"},
    ],
    MATRIX: [
        {toType:"\\dots [Enter]", tex:"\\dots"},
        {toType:"\\cdots [Enter]", tex:"\\cdots"},
        {toType:"\\ddots [Enter]", tex:"\\ddots"},
        // not in Katex yet
        //{toType:"\\iddots [Enter]", tex:"\\iddots"},
        {toType:"\\vdots [Enter]", tex:"\\vdots"},
        {toType:"\\times [Enter]", tex:"\\times"},
    ],
    CALC : [
        {toType:"int", tex:"\\int"},
        {toType:"' (single quote)", tex:"'"},
        {toType:"\\oint [Enter]", tex:"\\oint"},
        {toType:"\\partial [Enter]", tex:"\\partial"},
        {toType:"sum", tex:"\\sum"},
        {toType:"\\prod", tex:"\\prod"},
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
