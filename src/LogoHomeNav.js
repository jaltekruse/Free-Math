import React from 'react';
import createReactClass from 'create-react-class';
import './App.css';
import TeX from './TeX.js';

const LogoHomeNav = createReactClass({
  render: function() {
        return (
            <div style={{float:"left", lineHeight : 1}} onClick= {
                function(evt) {
                    if (!window.confirm("Are you sure you want to leave your current work?")) {
                        return;
                    }
                    window.store.dispatch({type : "GO_TO_MODE_CHOOSER"});

                    // temporarily disable data loss warning
                    setTimeout(function() { window.onbeforeunload = null;}, 500);
                }}
            >
            <h2 style={{"display":"inline", color: "#eee", "fontFamily":"serif"}}>
                <TeX>{"\\text{Free Math}"}</TeX>
            </h2>
            </div>
        );
  }
});

export default LogoHomeNav;
