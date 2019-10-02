import React from 'react';
import createReactClass from 'create-react-class';

// Make the text on the button not selectable
// I think this is no longer needed now that I'm using a real button
// instead of a div
const unselectable = {
    "-webkit-touch-callout": "none",
    "-webkit-user-select": "none",
    "-khtml-user-select": "none",
    "-moz-user-select": "none",
    "-ms-user-select": "none",
    "user-select": "none"
}

var HtmlButton = createReactClass({

    render: function() {
        const contentComponent = this.props.content;
        const onClick = this.props.onClick;
        const title = this.props.title;
        const style =  this.props.style;
        const className =  this.props.className;
        return (
            <button
                className={className}
                style={{...unselectable, ...style}}
                onClick={function() {
                     onClick();
                 }}
                title={title}
            >
                {contentComponent}
            </button>
        );
  }
});

var Button = createReactClass({

    render: function() {
        const onClick = this.props.onClick;
        const title = this.props.title;
        const style =  this.props.style;
        return (
            <button
                className="fm-button"
                style={{...unselectable, ...style}}
                onClick={function() {
                     onClick();
                 }}
                title={title}
            >
            <div style={{display: "inline-block"}}>{this.props.text}</div>
            </button>
        );
  }
});

var LightButton = createReactClass({

    render: function() {
        const onClick = this.props.onClick;
        const title = this.props.title;
        return (
            <button
                className="fm-button-light"
                onClick={function() {
                    onClick();
                }}
                title={title}
            >
                <div style={{display:"inline-block"}}>
                <div style={{float: "left", paddingTop: "4px"}}>{this.props.text}</div>
                 <img style={{paddingTop: "2px"}}
                    src="images/small_vertical_image.png"
                    alt="empty spacer" />
                </div>
            </button>
        );
  }
});

var CloseButton = createReactClass({

    render: function() {
        const onClick = this.props.onClick;
        const style = this.props.style;
        const title = this.props.title;
        return (
            <button
                className="fm-close-button"
                style={{...style}}
                onClick={function() {
                    onClick();
                }}
                title={title}
            >
            {this.props.text}
            </button>
        );
  }
});

export {Button as default, HtmlButton, CloseButton, LightButton};
