const characterGroups = {
    alpha:     "abcdefghijklmnopqrstuvwxyz",
    vowel:     "aeiou",
    consonant: "bcdfghjklmnpqrstvwxyz",
    digits:    "1234567890",
    left:      /[^abcdefgqrstvwxz123456\`\~\!\@\#\$\%\^]/gi,
    right:     /[^hijklmnopuy7890&*()\-\_\=\+\{\}\|\[\]\:\"\;\'\<\>\?\,\.\/]/gi
};

const BOTH_CASES = "both";
const UPPER_CASE = "upper";
const LOWER_CASE = "lower";
const BOTH_HANDS = "both";
const LEFT_HAND = "left";
const RIGHT_HAND = "right";

const defaultSettings = {
    hide: false,
    length: 10,
    digits: true,
    digitsMinCount: 2,
    alpha: true,
    alphaCase: BOTH_CASES,
    alphaMinCount: 2,
    other: true,
    otherChars: "$!@_%^*&()",
    otherMinCount: 2,
    exclude: true,
    excludeChars: "o0",
    hands: BOTH_HANDS
};

function getValidHandCharsRegex(settings) {
    let validCharsRegex;
    switch (settings.hands) {
    case BOTH_HANDS:
	break;
    case LEFT_HAND:
	validCharsRegex = characterGroups.left;
	break;
    case RIGHT_HAND:
	validCharsRegex = characterGroups.right;
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
    return settings.digits ? characterGroups.digits : "";
}

function getAlpha(settings) {
    if (settings.alpha) {
        let chars = characterGroups.alpha;
        switch (settings.alphaCase) {
	case LOWER_CASE:
	    break;
	case UPPER_CASE:
	    chars = chars.toUpperCase();
	    break;
	case BOTH_CASES:
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

function shuffle(string) {
    var array = string.split("");
    for (var i = (array.length - 1); i >= 1; i--) {
        var j = Math.floor(Math.random() * (i + 1));
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

        let newChar = chars[Math.floor(Math.random() * chars.length)];

	if (typeof(newChar) === "undefined") {
	    break;
	}

        password += newChar;
    }
    password = shuffle(password);

    return password;
}


const GENERATE_PASSWORD_MENU = "generate-password";
const INSERT_PREVIOUS_PASSWORD_MENU = "insert-previous-password";

const GENERATE_PASSWORD_MESSAGE = "generate-password";
const GET_STATE_MESSAGE = "get-state";
const SET_STATE_MESSAGE = "set-state";

browser.contextMenus.create({
    id: GENERATE_PASSWORD_MENU,
    title: browser.i18n.getMessage("menuLabelGenerate"),
    contexts: ["password"]
});

browser.contextMenus.create({
    id: INSERT_PREVIOUS_PASSWORD_MENU,
    title: browser.i18n.getMessage("menuLabelInsertPrevious"),
    contexts: ["password"]
});

var password = "";
var settings = JSON.parse(JSON.stringify(defaultSettings));

browser.contextMenus.onClicked.addListener(function(info, tab) {
    switch (info.menuItemId) {
    case GENERATE_PASSWORD_MENU:
	password = createPassword(settings);
    case INSERT_PREVIOUS_PASSWORD_MENU:
        browser.tabs.executeScript({
            code: "document.activeElement.value = " + JSON.stringify(password)
        }).catch(function(error) {
            console.error("Failed to set password: " + error);
	});
	break;
    }
});

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.message) {
    case GENERATE_PASSWORD_MESSAGE:
	password = createPassword(settings);
	sendResponse({
	    password: password
	});
    case GET_STATE_MESSAGE:
	sendResponse({
	    password: password,
	    settings: settings
	});
	break;
    case SET_STATE_MESSAGE:
	settings = message.settings;
	password = message.password;
	break;
    }
});
