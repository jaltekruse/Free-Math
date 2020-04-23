import React from 'react';
import createReactClass from 'create-react-class';
import { checkAllSaved } from './DefaultHomepageActions.js';
import './App.css';

const LogoHomeNav = createReactClass({
  render: function() {
        return (
            <div style={{float:"left", lineHeight : 1}} onClick= {
                function(evt) {
                    if (checkAllSaved()) {
                        if (!window.confirm("Are you sure you want to leave your current work?")) {
                            return;
                        }
                    }

                    window.store.dispatch({type : "GO_TO_MODE_CHOOSER"});

                    // temporarily disable data loss warning
                    setTimeout(function() { window.onbeforeunload = null;}, 500);
                }}
            >
            <div style={{padding: "3px"}}>
            <h3 className="freemath-logo" 
                style={{"display":"inline", color: "#eee", "fontFamily":"serif"}}>
                <span className="katex"><span className="katex-mathml">
                        <math><semantics><mrow><mtext>Free&nbsp;Math</mtext></mrow>
                        {/*<annotation encoding="application/x-tex">{'\\text{Free Math}'}</annotation> */}
                        <annotation>{'\\text{Free Math}'}</annotation>
                        </semantics></math>
                        </span><span className="katex-html" aria-hidden="true">
                            <span className="strut" style={{height: "0.69444em"}}>{' '}</span>
                            <span className="strut bottom" style={{height: "0.69444em", verticalAlign: "0em"}}>
                            </span><span className="base"><span className="mord text">
                            <span className="mord">Free&nbsp;Math</span>
                            </span></span></span></span>
            </h3>
            </div>
            </div>
        );
  }
});

export default LogoHomeNav;
