import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import TeX from 'TeX.js';

class App extends Component {
  render() {
    return (
      <div className="App">
        <TeX>\frac{5+1}{4}</TeX>
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
      </div>
    );
  }
}

export default App;
