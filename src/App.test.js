import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

it('renders without crashing', () => {
  const Redux = window.Redux;
  var MathQuill = window.MathQuill;
  window.MathQuill = MathQuill.getInterface(1);
  const div = document.createElement('div');
  ReactDOM.render(<App />, div);
});
