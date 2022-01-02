import React from 'react';
import { Modal } from 'react-overlays';

// attempted to transition this to a generic modal component
// its a work in progress, at least figured out how to pass a sub-component in
// and then render it in a common wrapper like this, the styles were a bit messed
// up when trying to make this more generic (like moving the size of the modal content outside
// of this component.
// For current usage:
// <MathEditorHelpModal content={(<MathEditorHelp />)}/>
class FreeMathModal extends React.Component {
    state = { showModal: false };

    closeModal = () => {
        this.setState({ showModal: false });
    };

    openModal = () => {
        this.setState({ showModal: true });
    };

    render() {

        let showModal = this.props.showModal;
        const modalStyle = {
        };

        const backdropStyle = {
            ...modalStyle,
            position: 'fixed',
            top: 0, bottom: 0, left: 0, right: 0,
            zIndex: 1041,
            backgroundColor: '#000',
            opacity: 0.5
        };

        const dialogStyle = function() {
          let top = 50;
          let left = 50;

          return {
            position: 'absolute',
            maxHeight:"90%",
            top: top + '%', left: left + '%',
            transform: `translate(-${top}%, -${left}%)`,
            border: '1px solid #e5e5e5',
            backgroundColor: 'white',
            boxShadow: '0 5px 15px rgba(0,0,0,.5)',
            padding: 20,
            zIndex: 1042
          };
        };
        const contentComponent = this.props.content;
        const closeModal = this.props.closeModal ? this.props.closeModal : function() {};
        return (
                <Modal
                  aria-labelledby='modal-label'
                  show={showModal}
                  onHide={closeModal}
                  style={modalStyle}
                  renderBackdrop={(props) => <div {...props} style={backdropStyle} onClick={closeModal}/>}
                >
                  <div style={dialogStyle()} >
                    {contentComponent}
                  </div>
                </Modal>
        );
    }
}

export {
    FreeMathModal as default
};
