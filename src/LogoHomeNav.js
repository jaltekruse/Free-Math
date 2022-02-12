import React from 'react';
import { checkAllSaved } from './DefaultHomepageActions.js';
import './App.css';

class LogoHomeNav extends React.Component {
    render() {
        var dest = this.props.dest ? this.props.dest : "launch.html";
          return (
              <div className="freemath-logo" style={{display:"inline-block", lineHeight : 1}}>
                    <a style={{textDecoration: "none", color: "#eee"}} href={dest}>
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
