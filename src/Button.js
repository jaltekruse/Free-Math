import React from 'react';
import createReactClass from 'create-react-class';

var Button = createReactClass({

    render: function() {
        const onClick = this.props.onClick;
        return (
            <div className="fm-button"
                 onClick={function() {
                     onClick();
                 }}>
            {this.props.text}
            </div>
        );
  }
});

var LightButton = createReactClass({

    render: function() {
        const onClick = this.props.onClick;
        return (
            <div className="fm-button-light"
                 onClick={function() {
                     onClick();
                 }}>
            {this.props.text}
            </div>
        );
  }
});

var CloseButton = createReactClass({

    render: function() {
        const onClick = this.props.onClick;
        return (
            <div className="fm-close-button"
                 onClick={function() {
                     onClick();
                 }}>
            {this.props.text}
            </div>
        );
  }
});

export {Button as default, CloseButton, LightButton};
