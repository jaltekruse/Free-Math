// Import caccl
import initCACCL from 'caccl/client/cached';

// Import React
import React, { Component } from 'react';

// Import resources
import logo from './logo.svg';
import './App.css';

// Initialize caccl
const { api, getStatus } = initCACCL();

class App extends Component {
  /**
   * Initialize App component
   */
  constructor(props) {
    super(props);

    // Set up state
    this.state = {
      message: 'Loading! Just a moment...',
    };
  }

  /**
   * Called when the component mounted, pulls state and user profile from server
   */
  async componentDidMount() {
    // Load status
    try {
      // Get status from server
      const status = await getStatus();

      // > App wasn't launched via Canvas
      if (!status.launched) {
        return this.setState({
          message: 'Please launch this app from Canvas.',
        });
      }

      // > App is not authorized
      if (!status.authorized) {
        return this.setState({
          message: 'We don\'t have access to Canvas. Please re-launch the app.',
        });
      }
    } catch (err) {
      return this.setState({
        message: `Error while requesting state from server: ${err.message}`,
      });
    }

    // Load profile information
    try {
      // Get profile from Canvas via api
      const profile = await api.user.self.getProfile();

      // Update state
      return this.setState({
        message: `Hi ${profile.name}! Your CACCL app is ready!`,
      });
    } catch (err) {
      return this.setState({
        message: `Error while requesting user profile: ${err.message}`,
      });
    }
  }

  /**
   * Render the App
   */
  render() {
    // Deconstruct the state
    const { message } = this.state;

    // Render the component
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            <strong>{message}</strong>
          </p>
          <p>
            Edit <code>client/src/App.js</code> and save to recompile.
          </p>

          Resources:
          <a
            className="App-link"
            href="https://harvard-edtech.github.io/caccl/"
            target="_blank"
            rel="noopener noreferrer"
          >
            CACCL Docs
          </a>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    );
  }
}

export default App;
