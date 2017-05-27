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
    window.crypto.getRandomValues(randomArray);
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

const MENU_CONTEXT = "PASSWORD" in browser.contextMenus.ContextType ? browser.contextMenus.ContextType.PASSWORD : browser.contextMenus.ContextType.EDITABLE;

browser.contextMenus.create({
    id: constants.GENERATE_PASSWORD_MENU,
    title: browser.i18n.getMessage("menuLabelGenerate"),
    contexts: [MENU_CONTEXT]
});

browser.contextMenus.create({
    id: constants.INSERT_PREVIOUS_PASSWORD_MENU,
    title: browser.i18n.getMessage("menuLabelInsertPrevious"),
    contexts: [MENU_CONTEXT]
});

var password = "";
var settings = JSON.parse(JSON.stringify(constants.DEFAULT_SETTINGS));

browser.contextMenus.onClicked.addListener(function(info, tab) {
    switch (info.menuItemId) {
    case constants.GENERATE_PASSWORD_MENU:
	password = createPassword(settings);
    case constants.INSERT_PREVIOUS_PASSWORD_MENU:
	browser.tabs.executeScript({
	    code: "document.activeElement.value = " + JSON.stringify(password)
	}).catch(function(error) {
	    console.error("Failed to set password: " + error);
	});
	break;
    }
});

browser.runtime.onMessage.addListener((message, sender) => {
    let response = undefined;
    switch (message.message) {
    case constants.GENERATE_PASSWORD_MESSAGE:
	password = createPassword(settings);
	response = {
	    password: password
	};
	break;
    case constants.GET_STATE_MESSAGE:
	response = {
	    password: password,
	    settings: settings
	};
	break;
    case constants.SET_STATE_MESSAGE:
	settings = message.settings;
	password = message.password;
	break;
    }
    return response === undefined ? response : Promise.resolve(response);
});
