import React from 'react';
import createReactClass from 'create-react-class';

const unselectable = {
    "-webkit-touch-callout": "none",
    "-webkit-user-select": "none",
    "-khtml-user-select": "none",
    "-moz-user-select": "none",
    "-ms-user-select": "none",
    "user-select": "none"
}

var Button = createReactClass({

    render: function() {
        const onClick = this.props.onClick;
        return (
            <button className="fm-button" style={{...unselectable}}
                 onClick={function() {
                     onClick();
                 }}>
            {this.props.text}
            </button>
        );
  }
});

var LightButton = createReactClass({

    render: function() {
        const onClick = this.props.onClick;
        return (
            <button className="fm-button-light"
                 onClick={function() {
                     onClick();
                 }}>
            {this.props.text}
            </button>
        );
  }
});

var CloseButton = createReactClass({

    render: function() {
        const onClick = this.props.onClick;
        const style = this.props.style;
        return (
            <button className="fm-close-button"
                 style={{...style}}
                 onClick={function() {
                     onClick();
                 }}>
            {this.props.text}
            </button>
        );
  }
});

export {Button as default, CloseButton, LightButton};
