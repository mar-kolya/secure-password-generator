import browser from 'webextension-polyfill';

import * as constants from 'constants';

import React from 'react';
import ReactDOM from 'react-dom';

class Popup extends React.Component {
    constructor(props) {
	super(props);
	this.state = {settings: {}};

	this.handleInputChange = this.handleInputChange.bind(this);
	this.hideClick = this.hideClick.bind(this);
	this.copyToClipboard = this.copyToClipboard.bind(this);
	this.generatePassword = this.generatePassword.bind(this);
    }

    setSetting(name, value) {
	this.setState((state, props) => {
	    state.settings[name] = value;
	    return state;
	});
    }

    handleInputChange(event) {
	const target = event.target;
	const value = target.type === 'checkbox' ? target.checked : target.value;
	const name = target.name;

	if (name === "password") {
	    this.setState({
		[name]: value
	    });
	} else {
	    this.setSetting(name, value);
	}
    }

    hideClick(event) {
	this.setState((state, props) => {
	    state.settings.hide = !state.settings.hide;
	    return state;
	});
    }

    copyToClipboard(event) {
	this.passwordInput.select();
	document.execCommand("Copy");
    }

    generatePassword(event) {
	browser.runtime.sendMessage({message: constants.GENERATE_PASSWORD_MESSAGE}).then((response) => {
	    this.setState({password: response.password});
	});
    }

    componentDidUpdate() {
	browser.runtime.sendMessage({
	    message: constants.SET_STATE_MESSAGE,
	    password: this.state.password,
	    settings: this.state.settings
	});
    }

    componentDidMount() {
	browser.runtime.sendMessage({message: constants.GET_STATE_MESSAGE}).then((response) => {
	    this.setState(response);
	});
    }

    render() {
	return (
	    <div>
		<div>
		    <input
			type={this.state.settings.hide ? "password" : "text"}
			id="password"
			name="password"
			value={this.state.password}
			onChange={this.handleInputChange}
			ref={(input) => { this.passwordInput = input; }} />
		    <input
			type="hidden"
			id="hide"
			name="hide"
			checked={this.state.settings.hide}
			onChange={this.handleInputChange} />
		    <img
			className="password-visibility"
			src={this.state.settings.hide ? "icons/show.png" : "icons/hide.png"}
			title={this.state.settings.hide
			     ? browser.i18n.getMessage("showPassword") : browser.i18n.getMessage("hidePassword")}
			onClick={this.hideClick} />
		    <input
			type="button"
			id="copyToClipboardButton"
			value={browser.i18n.getMessage("copyToClipboardButton")}
			onClick={this.copyToClipboard} />
		</div>

		<div className="character-settings">
		    <div className="password-length-and-hands">
			{browser.i18n.getMessage("passwordLength")} <input
									type="number"
									id="length"
									name="length"
									min="2"
									max="99"
									value={this.state.settings.length}
									onChange={this.handleInputChange} />
			<select id="hands" name="hands" value={this.state.settings.hands} onChange={this.handleInputChange}>
			    <option value={constants.BOTH_HANDS}>{browser.i18n.getMessage("bothHands")}</option>
			    <option value={constants.LEFT_HAND}>{browser.i18n.getMessage("leftHandOnly")}</option>
			    <option value={constants.RIGHT_HAND}>{browser.i18n.getMessage("rightHandOnly")}</option>
			</select>
		    </div>

		    <div className="count-header">{browser.i18n.getMessage("minCharacterCount")}</div>

		    <div className="alpha checkbox">
			<input
			    type="checkbox"
			    id="alpha"
			    name="alpha"
			    checked={this.state.settings.alpha}
			    onChange={this.handleInputChange} />
			<label htmlFor="alpha">{browser.i18n.getMessage("alpha")}</label>
		    </div>
		    <div className="alpha input">
			<select
			    id="alphaCase"
			    name="alphaCase"
			    value={this.state.settings.alphaCase}
			    onChange={this.handleInputChange}>
			    <option value={constants.LOWER_CASE}>{browser.i18n.getMessage("lowerCase")}</option>
			    <option value={constants.UPPER_CASE}>{browser.i18n.getMessage("upperCase")}</option>
			    <option value={constants.BOTH_CASES}>{browser.i18n.getMessage("mixedCase")}</option>
			</select>
		    </div>
		    <div className="alpha count">
			<input
			    type="number"
			    id="alphaMinCount"
			    name="alphaMinCount"
			    min="2"
			    max="99"
			    value={this.state.settings.alphaMinCount}
			    onChange={this.handleInputChange} />
		    </div>

		    <div className="digits checkbox">
			<input
			    type="checkbox"
			    id="digits"
			    name="digits"
			    checked={this.state.settings.digits}
			    onChange={this.handleInputChange} />
			<label htmlFor="digits">{browser.i18n.getMessage("digits")}</label>
		    </div>
		    <div className="digits count">
			<input
			    type="number"
			    id="digitsMinCount"
			    name="digitsMinCount"
			    min="2"
			    max="99"
			    value={this.state.settings.digitsMinCount}
			    onChange={this.handleInputChange} />
		    </div>

		    <div className="other checkbox">
			<input
			    type="checkbox"
			    id="other"
			    name="other"
			    checked={this.state.settings.other}
			    onChange={this.handleInputChange} />
			<label htmlFor="other">{browser.i18n.getMessage("other")}</label>
		    </div>
		    <div className="other input">
			<input
			    type="text"
			    id="otherChars"
			    name="otherChars"
			    value={this.state.settings.otherChars}
			    onChange={this.handleInputChange} />
		    </div>
		    <div className="other count">
			<input
			    type="number"
			    id="otherMinCount"
			    name="otherMinCount"
			    min="2"
			    max="99"
			    value={this.state.settings.otherMinCount}
			    onChange={this.handleInputChange} />
		    </div>

		    <div className="exclude checkbox">
			<input
			    type="checkbox"
			    id="exclude"
			    name="exclude"
			    checked={this.state.settings.exclude}
			    onChange={this.handleInputChange} />
			<label htmlFor="exclude">{browser.i18n.getMessage("exclude")}</label>
		    </div>
		    <div className="exclude input">
			<input
			    type="text"
			    id="excludeChars"
			    name="excludeChars"
			    value={this.state.settings.excludeChars}
			    onChange={this.handleInputChange} />
		    </div>
		    <div className="exclude count">{browser.i18n.getMessage("excludeDescription")}</div>
		</div>

		<div className="create-button">
		    <input type="button"
			   id="createButton"
			   value={browser.i18n.getMessage("generatePasswordButton")}
			   onClick={this.generatePassword} />
		</div>
	    </div>
	);
    }
}

ReactDOM.render(<Popup/>, document.getElementById('popup'));
