import React from 'react';
import createReactClass from 'create-react-class';
import './App.css';
import TeX from './TeX.js';

const LogoHomeNav = createReactClass({
  render: function() {
        return (
            <div style={{float:"left"}} onClick= {
                function(evt) {
                    if (!window.confirm("Are you sure you want to leave your current work?")) {
                        return;
                    }
                    window.store.dispatch({type : "GO_TO_MODE_CHOOSER"});

                    // temporarily disable data loss warning
                    setTimeout(function() { window.onbeforeunload = null;}, 500);
                }}
            >
            <h3 style={{"display":"inline"}}>
                <TeX>{"\\text{Free Math}"}</TeX>
            </h3>
            </div>
            );
  }
});

export default LogoHomeNav;
