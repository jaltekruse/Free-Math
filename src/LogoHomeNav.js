import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import logo from './logo.svg';
import './App.css';

const LogoHomeNav = React.createClass({
  render: function() {
        return (
            <div style={{float:"left","margin":"0px 15px 0px 15px"}} onClick= {
                function(evt) {
                    if (!window.confirm("Are you sure you want to leave your current work?")) {
                        return;
                    }
                    window.store.dispatch({type : "GO_TO_MODE_CHOOSER"});

                    // temporarily disable data loss warning
                    setTimeout(function() { window.onbeforeunload = null;}, 500);
                }}
            >
            <h2 style={{"display":"inline","fontFamily":"serif"}}>
                <b>Free Math</b>
            </h2>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <h3 style={{"color" : "#3abfc7","display":"inline","fontFamily":"serif"}}>
                <b>Beta</b>
            </h3>
            <br />
            <span style={{"fontSize": 11}}>Free your mind, learn and discover faster.</span>
            </div>
            );
  }
});

export default LogoHomeNav;
