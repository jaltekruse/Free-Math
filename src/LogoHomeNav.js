import React from 'react';
import { checkAllSaved } from './DefaultHomepageActions.js';
import './App.css';

class LogoHomeNav extends React.Component {
    render() {
          return (
              <div className="freemath-logo" style={{float:"left", lineHeight : 1}}>
                    <a style={{"text-decoration": "none", "color": "#eee"}} href="launch.html">
                    <h3 className="freemath-logo-text" style={{display:"inline", color: "#eee"}}>
                        <div style={{padding: "3px"}}>
                        <span className="katex"><span className="katex-mathml">
                                <math><semantics><mrow><mtext>Free&nbsp;Math</mtext></mrow>
                                <annotation encoding="application/x-tex">{"\\text{Free Math}"}</annotation>
                                </semantics></math>
                                </span><span className="katex-html" aria-hidden="true">
                                    <span className="strut bottom" style={{height: "0.69444em", verticalAlign: "0em"}}>
                                    </span><span className="base"><span className="mord text">
                                    <span className="mord">Free&nbsp;Math</span>
                                    </span></span></span></span>
                        </div>
                    </h3>
                    </a>
              </div>
          );
    }
}

export default LogoHomeNav;
