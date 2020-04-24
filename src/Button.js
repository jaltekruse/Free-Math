import React from 'react';

// Make the text on the button not selectable
// I think this is no longer needed now that I'm using a real button
// instead of a div
const unselectable = {
    WebkitTouchCallout: "none",
    WebkitUserSelect: "none",
    KhtmlUserSelect: "none",
    MozUserSelect: "none",
    msUserSelect: "none",
    userSelect: "none"
}

class HtmlButton extends React.Component {
    render() {
        const contentComponent = this.props.content;
        const onClick = this.props.onClick;
        const title = this.props.title;
        const style =  this.props.style;
        var className = this.props.className ? this.props.className : "fm-button";
        className = className + ' html-button';
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
}

class Button extends React.Component {
    render() {
        const onClick = this.props.onClick;
        const title = this.props.title;
        const style =  this.props.style;
        const className = this.props.className ? this.props.className : "fm-button";
        return (
            <button
                className={className}
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
}

class LightButton extends React.Component {
    render() {
        const onClick = this.props.onClick;
        const title = this.props.title;
        const className = this.props.className ? this.props.className : "fm-button-light";
        return (
            <button
                className={className}
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
}

class CloseButton extends React.Component {
    render() {
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
            <img src="images/close_dark.png" alt="x"/>
            </button>
        );
  }
}

export {Button as default, HtmlButton, CloseButton, LightButton};
