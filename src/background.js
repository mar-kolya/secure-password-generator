import browser from 'webextension-polyfill';

import * as constants from 'constants';

function getValidHandCharsRegex(settings) {
    let validCharsRegex;
    switch (settings.hands) {
    case constants.BOTH_HANDS:
	break;
    case constants.LEFT_HAND:
	validCharsRegex = constants.CHARACTER_GROUPS.left;
	break;
    case constants.RIGHT_HAND:
	validCharsRegex = constants.CHARACTER_GROUPS.right;
	break;
    }
    return validCharsRegex;
}

function getExcludeCharsRegex(settings) {
    let excludeCharsRegex;
    if (settings.exclude) {
	let excludeChars = settings.excludeChars;
	if (excludeChars) {
	    let excludeRegexp = "[" + excludeChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + "]";
	    excludeCharsRegex = new RegExp(excludeRegexp, "gi");
	}
    }
    return excludeCharsRegex;
}

function filterValidChars(chars, validHandCharsRegex, excludeCharsRegex) {
    if (validHandCharsRegex) chars = chars.replace(validHandCharsRegex, "");
    if (excludeCharsRegex) chars = chars.replace(excludeCharsRegex, "");
    return chars;
}

function getDigits(settings) {
    return settings.digits ? constants.CHARACTER_GROUPS.digits : "";
}

function getAlpha(settings) {
    if (settings.alpha) {
	let chars = constants.CHARACTER_GROUPS.alpha;
	switch (settings.alphaCase) {
	case constants.LOWER_CASE:
	    break;
	case constants.UPPER_CASE:
	    chars = chars.toUpperCase();
	    break;
	case constants.BOTH_CASES:
	    chars = chars + chars.toUpperCase();
	    break;
	}
	return chars;
    } else {
	return "";
    }
}

function getOther(settings) {
    return settings.other ? settings.otherChars : "";
}

function randomInt(max) {
    let randomArray = new Uint16Array(1);
    crypto.getRandomValues(randomArray);
    return randomArray[0] % max;
}

function shuffle(string) {
    var array = string.split("");
    for (var i = (array.length - 1); i >= 1; i--) {
	var j = randomInt(i + 1);
	var tmp = array[i];
	array[i] = array[j];
	array[j] = tmp;
    }
    return array.join("");
}

function createPassword(settings) {
    let validHandCharsRegex = getValidHandCharsRegex(settings);
    let excludeCharsRegex = getExcludeCharsRegex(settings);

    let validDigits = filterValidChars(getDigits(settings), validHandCharsRegex, excludeCharsRegex);
    let validAlpha = filterValidChars(getAlpha(settings), validHandCharsRegex, excludeCharsRegex);
    let validOther = filterValidChars(getOther(settings), validHandCharsRegex, excludeCharsRegex);

    //shuffle all charcters
    let allValidChars = shuffle(validDigits + validAlpha + validOther);
    validDigits = shuffle(validDigits);
    validAlpha = shuffle(validAlpha);
    validOther = shuffle(validOther);

    //min should be zero if there are no chars in the group
    let minDigits = validDigits.length ? settings.digitsMinCount : 0;
    let minAlpha = validAlpha.length ? settings.alphaMinCount : 0;
    let minOther = validOther.length ? settings.otherMinCount : 0;
    let digitsCount = 0;
    let alphaCount = 0;
    let otherCount = 0;

    let passwordLength = settings.length;
    let password = "";

    while (password.length < settings.length) {
	let chars;
	//Order of filling min number requirement: digits, other, alpha
	if (digitsCount < minDigits) {
	    chars = validDigits;
	    digitsCount++;
	}
	else if (otherCount < minOther) {
	    chars = validOther;
	    otherCount++;
	}
	else if (alphaCount < minAlpha) {
	    chars = validAlpha;
	    alphaCount++;
	}
	else {
	    chars = allValidChars;
	}

	let newChar = chars[randomInt(chars.length)];

	if (typeof(newChar) === "undefined") {
	    break;
	}

	password += newChar;
    }
    password = shuffle(password);

    return password;
}

const MENU_CONTEXTS = "PASSWORD" in browser.contextMenus.ContextType
      ? [browser.contextMenus.ContextType.PASSWORD, browser.contextMenus.ContextType.EDITABLE] : [browser.contextMenus.ContextType.EDITABLE];

var password = "";
var settings = JSON.parse(JSON.stringify(constants.DEFAULT_SETTINGS));

const SESSION_STATE_KEY = "state";

function createContextMenus() {
    browser.contextMenus.removeAll().then(() => {
	browser.contextMenus.create({
	    id: constants.GENERATE_PASSWORD_MENU,
	    title: browser.i18n.getMessage("menuLabelGenerate"),
	    contexts: MENU_CONTEXTS
	});

	browser.contextMenus.create({
	    id: constants.INSERT_PREVIOUS_PASSWORD_MENU,
	    title: browser.i18n.getMessage("menuLabelInsertPrevious"),
	    contexts: MENU_CONTEXTS
	});

	browser.contextMenus.create({
	    id: constants.OPEN_POPUP_MENU,
	    title: browser.i18n.getMessage("menuLabelOpenPopup"),
	    contexts: MENU_CONTEXTS
	});
    }).catch(error => {
	console.error("Cannot install context menu items: ", error);
    });
}

function hasSessionStorage() {
    return typeof chrome !== "undefined" && chrome.storage && chrome.storage.session;
}

function getSessionState() {
    if (!hasSessionStorage()) {
	return Promise.resolve({});
    }

    return new Promise((resolve, reject) => {
	chrome.storage.session.get({ [SESSION_STATE_KEY]: {} }, value => {
	    let error = chrome.runtime.lastError;
	    if (error) {
		reject(error);
	    } else {
		resolve(value[SESSION_STATE_KEY]);
	    }
	});
    });
}

function setSessionState() {
    if (!hasSessionStorage()) {
	return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
	chrome.storage.session.set({
	    [SESSION_STATE_KEY]: {
		password: password,
		settings: settings
	    }
	}, () => {
	    let error = chrome.runtime.lastError;
	    if (error) {
		reject(error);
	    } else {
		resolve();
	    }
	});
    });
}

let initState = browser.storage.local
    .get({ [constants.SETTINGS_KEY]: settings })
    .then(value => {
	settings = value[constants.SETTINGS_KEY];
	return getSessionState();
    })
    .then(value => {
	password = value.password || password;
	settings = value.settings || settings;
    })
    .catch(error => {
	console.error("Cannot read saved state: ", error);
    });

browser.runtime.onInstalled.addListener(createContextMenus);

function getActiveTab() {
    return browser.tabs.query({
	active: true,
	currentWindow: true
    }).then(tabs => tabs[0]);
}

function getTargetTabId(tab) {
    if (tab && tab.id) {
	return Promise.resolve(tab.id);
    }

    return getActiveTab().then(activeTab => activeTab && activeTab.id);
}

function insertPassword(tab) {
    return getTargetTabId(tab).then(tabId => {
	if (!tabId) {
	    return Promise.reject(new Error("Cannot find active tab"));
	}

	return new Promise((resolve, reject) => {
	    chrome.scripting.executeScript({
		target: {
		    tabId: tabId
		},
		func: value => {
		    let element = document.activeElement;
		    if (element && "value" in element) {
			element.value = value;
			element.dispatchEvent(new Event("input", { bubbles: true }));
			element.dispatchEvent(new Event("change", { bubbles: true }));
		    }
		},
		args: [password]
	    }, () => {
		let error = chrome.runtime.lastError;
		if (error) {
		    reject(error);
		} else {
		    resolve();
		}
	    });
	});
    });
}

function openPopup() {
    if (chrome.action && chrome.action.openPopup) {
	return new Promise((resolve, reject) => {
	    chrome.action.openPopup(() => {
		let error = chrome.runtime.lastError;
		if (error) {
		    reject(error);
		} else {
		    resolve();
		}
	    });
	});
    }

    return Promise.resolve();
}

function performAction(action, tab) {
    return initState.then(() => {
	let result = Promise.resolve();

    switch (action) {
    case constants.GENERATE_PASSWORD_MENU:
	password = createPassword(settings);
	result = setSessionState();
	/* falls through */
    case constants.INSERT_PREVIOUS_PASSWORD_MENU:
	result = result.then(() => insertPassword(tab));
	break;
    case constants.OPEN_POPUP_MENU:
	result = openPopup();
	break;
    }

	return result.catch((error) => {
	    console.error("Failed to perform action: ", error);
	});
    });
}

browser.contextMenus.onClicked.addListener((info, tab) => {
    performAction(info.menuItemId, tab);
});

browser.commands.onCommand.addListener(function(command) {
    performAction(command);
});

browser.runtime.onMessage.addListener((message, sender) => {
    let response = undefined;
    switch (message.message) {
    case constants.GENERATE_PASSWORD_MESSAGE:
	response = initState.then(() => {
	    password = createPassword(settings);
	    return setSessionState();
	}).then(() => {
	    return {
		password: password
	    };
	});
	break;
    case constants.INSERT_PASSWORD_MESSAGE:
	response = performAction(constants.INSERT_PREVIOUS_PASSWORD_MENU);
	break;
    case constants.GET_STATE_MESSAGE:
	response = initState.then(() => {
	    return {
		password: password,
		settings: settings
	    };
	});
	break;
    case constants.SET_STATE_MESSAGE:
	settings = message.settings;
	password = message.password;
	response = setSessionState();
	break;
    case constants.SAVE_SETTINGS_MESSAGE:
	settings = message.settings;
	response = browser.storage.local
			  .set({ [constants.SETTINGS_KEY]: settings })
			  .then(setSessionState);
	break;
    }
    return response;
});
