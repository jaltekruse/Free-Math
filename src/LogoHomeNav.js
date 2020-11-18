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
                        <span className="katex">
                            <span className="mord homepage-disappear-mobile">Free&nbsp;Math</span>
                            <span className="mord homepage-only-on-mobile">FM</span>
                        </span>
                        </div>
                    </h3>
                    </a>
              </div>
          );
    }
}

export default LogoHomeNav;
