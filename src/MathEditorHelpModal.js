import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Modal } from 'react-overlays';
import TeX from './TeX.js';

var MathQuill = window.MathQuill;

var MathEditorHelpModal = React.createClass({
	getInitialState () {
		return { showModal: false };
	},

    closeModal() {
        this.setState({ showModal: false });
    },

    openModal() {
        this.setState({ showModal: true });
    },

    render() {
		const modalStyle = {
			position: 'fixed',
			zIndex: 1040,
			top: 0, bottom: 0, left: 0, right: 0
		};

		const backdropStyle = {
			...modalStyle,
			zIndex: 'auto',
			backgroundColor: '#000',
			opacity: 0.5
		};

		const dialogStyle = function() {
		  let top = 50;
		  let left = 50;

		  return {
			position: 'absolute',
			width: 1000,
			maxHeight:"90%",
			overflow:"scroll",
			top: top + '%', left: left + '%',
			transform: `translate(-${top}%, -${left}%)`,
			border: '1px solid #e5e5e5',
			backgroundColor: 'white',
			boxShadow: '0 5px 15px rgba(0,0,0,.5)',
			padding: 20
		  };
		};
        /* TODO - mathquill not parsing these correctly, but it can put them in the editor and
         *        produce latex for them
				<tr><td>\N [enter]</td><td><span ref="exampleStaticMath8">\N</span></td></tr>
				<tr><td>\Z [enter]</td><td><span ref="exampleStaticMath9">\Z</span></td></tr>
				<tr><td>\Q [enter]</td><td><span ref="exampleStaticMath10">\Q</span></td></tr>
        */

        return (
                <span>
        <button onClick={this.openModal}>Open available symbol list</button>
        <Modal
          aria-labelledby='modal-label'
          show={this.state.showModal}
          onHide={this.closeModal}
          style={modalStyle}
          backdropStyle={backdropStyle}
        >
          <div style={dialogStyle()} >
			<div style={{display:"inline-block"}}>
			<div style={{float:"left"}}>
			<table>
				<thead>
				<tr><th style={{textAlign:"left"}}>Type this...</th><th style={{textAlign:"left"}}>For Symbol&nbsp;&nbsp;&nbsp;</th></tr>
				</thead>
				<tbody>
				<tr><td>/ (slash)</td><td><span ref="exampleStaticMath3">{"\\frac{a}{b}"}</span> (fraction)</td></tr>
				<tr><td>pi</td><td><TeX>{"\\pi"}</TeX></td></tr>
				<tr><td>sqrt</td><td><span ref="exampleStaticMath6">{"\\sqrt{x}"}</span></td></tr>
				<tr><td>\nthroot [enter]</td><td><span ref="exampleStaticMath5">{"\\sqrt[y]{x}"}</span></td></tr>
				<tr><td>| (shift backslash)</td><td><span ref="exampleStaticMath7">{"|x|"}</span></td></tr>
				<tr><td>&gt;=</td><td><TeX>\ge</TeX></td></tr>
				<tr><td>&lt;=</td><td><TeX>\le</TeX></td></tr>
				<tr><td>_ (underscore)</td><td><span ref="exampleStaticMath">a_b</span>  (subscript)</td></tr>
				<tr><td>^</td><td><span ref="exampleStaticMath2">a^b</span> (superscript / power)</td></tr>
				<tr><td>\pm + [enter]</td><td><TeX>\pm</TeX></td></tr>
				<tr><td>\degree + [enter]</td><td><TeX>\degree</TeX></td></tr>
				<tr><td>\angle + [enter]</td><td><TeX>\angle</TeX></td></tr>
				<tr><td>int</td><td><TeX>\int</TeX></td></tr>
				<tr><td>\oint [enter]</td><td><TeX>\oint</TeX></td></tr>
				<tr><td>\partial [enter]</td><td><TeX>\partial</TeX></td></tr>
				<tr><td>sum</td><td><TeX>{"\\sum_{ }^{ }"}</TeX></td></tr>
				<tr><td>\infinity [enter]</td><td><TeX>\infty</TeX></td></tr>
				</tbody>
			</table>
			</div>
			<div style={{float:"left"}}>
			<table>
				<thead>
				<tr><th style={{textAlign:"left"}}>Type this...</th><th style={{textAlign:"left"}}>For Symbol&nbsp;&nbsp;&nbsp;</th></tr>
				</thead>
				<tbody>
				<tr><td>forall</td><td><TeX>\forall</TeX></td></tr>
				<tr><td>therefore</td><td><TeX>\therefore</TeX></td></tr>
				<tr><td>exists</td><td><TeX>\exists</TeX></td></tr>
				<tr><td>\in [enter]</td><td><TeX>\in</TeX></td></tr>
				<tr><td>\to [enter]</td><td><TeX>\to</TeX></td></tr>
				<tr><td>\gets [enter]</td><td><TeX>\gets</TeX></td></tr>
				<tr><td>union</td><td><TeX>\cup</TeX></td></tr>
				<tr><td>\intersect [enter]</td><td><TeX>\cap</TeX></td></tr>
				<tr><td>subset</td><td><TeX>\subset</TeX></td></tr>
				<tr><td>\subseteq [enter]</td><td><TeX>\subseteq</TeX></td></tr>
				<tr><td>\superset [enter]</td><td><TeX>\supset</TeX></td></tr>
				<tr><td>\superseteq [enter]</td><td><TeX>\supseteq</TeX></td></tr>
				</tbody>
			</table>
			</div>
			<div style={{float:"left"}}>
			<table>
				<thead>
				<tr><th style={{textAlign:"left"}}>Type this...</th><th style={{textAlign:"left"}}>For Symbol&nbsp;&nbsp;&nbsp;</th></tr>
				</thead>
				<tbody>
				<tr><td>alpha</td><td><TeX>\alpha</TeX></td></tr>
				<tr><td>beta</td><td><TeX>\beta</TeX></td></tr>
				<tr><td>gamma</td><td><TeX>\gamma</TeX></td></tr>
				<tr><td>\Gamma [enter]</td><td><TeX>\Gamma</TeX></td></tr>
				<tr><td>delta</td><td><TeX>\delta</TeX></td></tr>
				<tr><td>\Delta [enter]</td><td><TeX>\Delta</TeX></td></tr>
				<tr><td>epsilon</td><td><TeX>\epsilon</TeX></td></tr>
				<tr><td>digamma</td><td><TeX>\digamma</TeX></td></tr>
				<tr><td>zeta</td><td><TeX>\zeta</TeX></td></tr>
				<tr><td>eta</td><td><TeX>\eta</TeX></td></tr>
				<tr><td>theta</td><td><TeX>\theta</TeX></td></tr>
				<tr><td>\Theta [enter]</td><td><TeX>\Theta</TeX></td></tr>
				<tr><td>iota</td><td><TeX>\iota</TeX></td></tr>
				<tr><td>kappa</td><td><TeX>\kappa</TeX></td></tr>
				<tr><td>lambda</td><td><TeX>\lambda</TeX></td></tr>
				<tr><td>\Lambda [enter]</td><td><TeX>\Lambda</TeX></td></tr>
				<tr><td>\mu [enter]</td><td><TeX>\mu</TeX></td></tr>
				<tr><td>\nu [enter]</td><td><TeX>\nu</TeX></td></tr>
				</tbody>
			</table>
			</div>
			<div style={{float:"left"}}>
			<table>
				<thead>
				<tr><th style={{textAlign:"left"}}>Type this...</th><th style={{textAlign:"left"}}>For Symbol&nbsp;&nbsp;&nbsp;</th></tr>
				</thead>
				<tbody>
                <tr><td>xi</td><td><TeX>\xi</TeX></td></tr>
                <tr><td>\Xi [enter]</td><td><TeX>\Xi</TeX></td></tr>
                <tr><td>\pi</td><td><TeX>\pi</TeX></td></tr>
                <tr><td>\Pi [enter]</td><td><TeX>\Pi</TeX></td></tr>
				<tr><td>rho</td><td><span ref="exampleStaticMath4">\rho</span></td></tr>
                <tr><td>\varrho [enter]</td><td><TeX>\varrho</TeX></td></tr>
                <tr><td>sigma</td><td><TeX>\sigma</TeX></td></tr>
                <tr><td>\Sigma [enter]</td><td><TeX>\Sigma</TeX></td></tr>
                <tr><td>tau</td><td><TeX>\tau</TeX></td></tr>
                <tr><td>upsilon</td><td><TeX>\upsilon</TeX></td></tr>
                <tr><td>\Upsilon [enter]</td><td><TeX>\Upsilon</TeX></td></tr>
                <tr><td>\phi [enter]</td><td><TeX>\phi</TeX></td></tr>
                <tr><td>\Phi [enter]</td><td><TeX>\Phi</TeX></td></tr>
                <tr><td>\chi [enter]</td><td><TeX>\chi</TeX></td></tr>
                <tr><td>\psi [enter]</td><td><TeX>\psi</TeX></td></tr>
                <tr><td>\Psi [enter]</td><td><TeX>\Psi</TeX></td></tr>
                <tr><td>omega</td><td><TeX>\omega</TeX></td></tr>
                <tr><td>\Omega [enter]</td><td><TeX>\Omega</TeX></td></tr>
				</tbody>
			</table>
			</div>
			</div>
            <br/>
            Many other symbols from Latex are available as well with a backslash prefix, see here for more symbol codes: <a href="https://oeis.org/wiki/List_of_LaTeX_mathematical_symbols" target="_blank">Latex symbols</a>
			</div>
		</Modal>
        </span>
        );
    },
    componentDidUpdate: function() {
        MathQuill.StaticMath(ReactDOM.findDOMNode(this.refs.exampleStaticMath));
        MathQuill.StaticMath(ReactDOM.findDOMNode(this.refs.exampleStaticMath2));
        MathQuill.StaticMath(ReactDOM.findDOMNode(this.refs.exampleStaticMath3));
        MathQuill.StaticMath(ReactDOM.findDOMNode(this.refs.exampleStaticMath4));
        MathQuill.StaticMath(ReactDOM.findDOMNode(this.refs.exampleStaticMath5));
        MathQuill.StaticMath(ReactDOM.findDOMNode(this.refs.exampleStaticMath6));
        MathQuill.StaticMath(ReactDOM.findDOMNode(this.refs.exampleStaticMath7));
        MathQuill.StaticMath(ReactDOM.findDOMNode(this.refs.exampleStaticMath8));
        MathQuill.StaticMath(ReactDOM.findDOMNode(this.refs.exampleStaticMath9));
        MathQuill.StaticMath(ReactDOM.findDOMNode(this.refs.exampleStaticMath10));
    }
});

export default MathEditorHelpModal;
