var passwordGenerator = {

    characterDelay: 20,
    characterGroups: {
        alpha:     "abcdefghijklmnopqrstuvwxyz",
        vowel:     "aeiou",
        consonant: "bcdfghjklmnpqrstvwxyz",
        digits:    "1234567890",
        left:      /[^abcdefgqrstvwxz123456\`\~\!\@\#\$\%\^]/gi,
        right:     /[^hijklmnopuy7890&*()\-\_\=\+\{\}\|\[\]\:\"\;\'\<\>\?\,\.\/]/gi
    },

    getPrefs: function() {
        if(!this._prefs) {
            this._prefs = Components.classes["@mozilla.org/preferences-service;1"]
                .getService(Components.interfaces.nsIPrefService).getBranch("extensions.passwordgenerator.");
        }
        return this._prefs;
    },

    loadPrefs: function() {
        var prefs = this.getPrefs();
        document.getElementById("hidePassword").checked = prefs.getBoolPref("hidePassword");
        document.getElementById("password").type = prefs.getBoolPref("hidePassword") ? "password" : "";
        document.getElementById("passwordLength").value = prefs.getIntPref("length");
        document.getElementById("hands").value = prefs.getIntPref("hands");

        document.getElementById("useDigits").checked = prefs.getBoolPref("characters.digits");
        document.getElementById("minDigitsCount").value = prefs.getIntPref("characters.digits.minCount");

        document.getElementById("useAlpha").checked = prefs.getBoolPref("characters.alpha");
        document.getElementById("alphaCase").value = prefs.getIntPref("characters.alpha.case");
        document.getElementById("minAlphaCount").value = prefs.getIntPref("characters.alpha.minCount");

        document.getElementById("useOther").checked = prefs.getBoolPref("characters.other");
        document.getElementById("otherChars").value = prefs.getCharPref("characters.other.chars");
        document.getElementById("minOtherCount").value = prefs.getIntPref("characters.other.minCount");

        document.getElementById("exclude").checked = prefs.getBoolPref("characters.exclude");
        document.getElementById("excludeChars").value = prefs.getCharPref("characters.exclude.chars");
    },

    savePrefs: function() {
        var prefs = this.getPrefs();
        prefs.setBoolPref("hidePassword", document.getElementById("hidePassword").checked);
        prefs.setIntPref("length", document.getElementById("passwordLength").value);
        prefs.setIntPref("hands", document.getElementById("hands").value);

        prefs.setBoolPref("characters.digits", document.getElementById("useDigits").checked);
        prefs.setIntPref("characters.digits.minCount", document.getElementById("minDigitsCount").value);

        prefs.setBoolPref("characters.alpha", document.getElementById("useAlpha").checked);
        prefs.setIntPref("characters.alpha.case", document.getElementById("alphaCase").value);
        prefs.setIntPref("characters.alpha.minCount", document.getElementById("minAlphaCount").value);

        prefs.setBoolPref("characters.other", document.getElementById("useOther").checked);
        prefs.setCharPref("characters.other.chars", document.getElementById("otherChars").value);
        prefs.setIntPref("characters.other.minCount", document.getElementById("minOtherCount").value);

        prefs.setBoolPref("characters.exclude", document.getElementById("exclude").checked);
        prefs.setCharPref("characters.exclude.chars", document.getElementById("excludeChars").value);
    },

    dialogInit: function(event) {
        this.loadPrefs();

        var params;
        if(typeof(window.arguments) !== "undefined") params = window.arguments[0];
        if(!params) params = {};
        this.params = params;
        if(params.input) {
            document.documentElement.getButton("cancel").hidden = false;
        } else {
            document.documentElement.getButton("cancel").hidden = true;
        }

        this.passwordField = document.getElementById("password");

        if(params.lastPassword) this.passwordField.value = params.lastPassword;
    },

    dialogAccept: function(event) {
        this.savePrefs();

        if(this.params.input) {
            this.params.input.value = this.passwordField.value;
        }
        this.params.lastPassword = this.passwordField.value;

        if(opener != null) opener.focus();
        return true;
    },

    dialogCancel: function(event) {
        if(opener != null) opener.focus();
        return true;
    },

    setHidePassword: function(event) {
        this.passwordField.type = event.target.checked ? "password" : "";
    },

    copyToClipBoard: function(event) {
        try {
	    var clipboard = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
                .getService(Components.interfaces.nsIClipboardHelper);
	    clipboard.copyString(this.passwordField.value);
	} catch(err) {
	    alert("Couldn't copy to clipboard: \n" + err);
	}
    },

    createPassword: function(event) {
        this.savePrefs();
        var prefs = this.getPrefs();

        var validHandChars;
	switch(prefs.getIntPref("hands")) {
	case 0:
	    break;
	case 1:
	    validHandChars = this.characterGroups["left"];
	    break;
	case 2:
	    validHandChars = this.characterGroups["right"];
	    break;
	}

        var excludeChars;
        if(prefs.getBoolPref("characters.exclude")) {
            excludeChars = prefs.getCharPref("characters.exclude.chars");
            if(excludeChars) {
                var excludeRegexp = "["
                    + excludeChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + "]";
                excludeChars = new RegExp(excludeRegexp, "gi");
            }
        }

        function validChars(chars) {
            if(validHandChars) chars = chars.replace(validHandChars, "");
            if(excludeChars) chars = chars.replace(excludeChars, "");
            return chars;
        }

        var allValidChars = "";
        var validDigits = "";
        var validAlpha = "";
        var validOther = "";

        if(prefs.getBoolPref("characters.digits")) {
            var chars = validChars(this.characterGroups.digits);
            if(chars) {
                allValidChars += chars;
                validDigits = chars;
            }
        }

        if(prefs.getBoolPref("characters.alpha")) {
            var chars = this.characterGroups.alpha;
            switch(prefs.getIntPref("characters.alpha.case")) {
	    case 0:
	        break;
	    case 1:
	        chars = chars.toUpperCase();
	        break;
	    case 2:
	        chars = chars + chars.toUpperCase();
	        break;
	    }
            chars = validChars(chars);
            if(chars) {
                allValidChars += chars;
                validAlpha = chars;
            }
        }

        if(prefs.getBoolPref("characters.other")) {
            var chars = validChars(prefs.getCharPref("characters.other.chars"));
            if(chars) {
                allValidChars += chars;
                validOther = chars;
            }
        }

        function shuffle(string) {
            var array = string.split("");
            for(var i = (array.length - 1); i >= 1; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var tmp = array[i];
                array[i] = array[j];
                array[j] = tmp;
            }
            return array.join("");
        }

        //shuffle all charcters
        allValidChars = shuffle(allValidChars);
        validDigits = shuffle(validDigits);
        validAlpha = shuffle(validAlpha);
        validOther = shuffle(validOther);

        var minDigits = prefs.getIntPref("characters.digits.minCount");
        var minAlpha = prefs.getIntPref("characters.alpha.minCount");
        var minOther = prefs.getIntPref("characters.other.minCount");
        var digitsCount = 0;
        var alphaCount = 0;
        var otherCount = 0;

        var passwordField = this.passwordField;
        var passwordLength = prefs.getIntPref("length");
        var password = "";

        var delay = this.characterDelay;

        (function nextChar() {
             var chars;
             //Order of filling min number requirement: digits, other, alpha
             if(digitsCount < minDigits) {
                 chars = validDigits;
                 digitsCount++;
             }
             else if(otherCount < minOther) {
                 chars = validOther;
                 otherCount++;
             }
             else if(alphaCount < minAlpha) {
                 chars = validAlpha;
                 alphaCount++;
             }
             else {
                 chars = allValidChars;
             }

             var newChar = chars[Math.floor(Math.random() * chars.length)];
             passwordField.value = password + newChar;
             password += newChar;
             if(password.length >= passwordLength) {
                 window.setTimeout(function() {
                                       //shuffle result
                                       passwordField.value = shuffle(password);
                                   }, delay * 4);
             } else {
                 window.setTimeout(nextChar, delay);
             }
        })();
    }
};
