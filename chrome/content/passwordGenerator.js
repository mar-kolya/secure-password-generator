var passwordGenerator = {
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
        document.getElementById("mnemonic").checked = prefs.getBoolPref("mnemonic");

        document.getElementById("useDigits").checked = prefs.getBoolPref("characters.digits");
        document.getElementById("digitsWeight").setAttribute("curpos",
                                                              prefs.getIntPref("characters.digits.weight"));

        document.getElementById("useAlpha").checked = prefs.getBoolPref("characters.alpha");
        document.getElementById("alphaCase").value = prefs.getIntPref("characters.alpha.case");
        document.getElementById("alphaWeight").setAttribute("curpos",
                                                            prefs.getIntPref("characters.alpha.weight"));

        document.getElementById("useOther").checked = prefs.getBoolPref("characters.other");
        document.getElementById("otherChars").value = prefs.getCharPref("characters.other.chars");
        document.getElementById("otherWeight").setAttribute("curpos",
                                                            prefs.getIntPref("characters.other.weight"));

        document.getElementById("exclude").checked = prefs.getBoolPref("characters.exclude");
        document.getElementById("excludeChars").value = prefs.getCharPref("characters.exclude.chars");
    },

    savePrefs: function() {
        var prefs = this.getPrefs();
        prefs.setBoolPref("hidePassword", document.getElementById("hidePassword").checked);
        prefs.setIntPref("length", document.getElementById("passwordLength").value);
        prefs.setIntPref("hands", document.getElementById("hands").value);
        prefs.setBoolPref("mnemonic", document.getElementById("mnemonic").checked);

        prefs.setBoolPref("characters.digits", document.getElementById("useDigits").checked);
        prefs.setIntPref("characters.digits.weight", document.getElementById("digitsWeight").getAttribute("curpos"));

        prefs.setBoolPref("characters.alpha", document.getElementById("useAlpha").checked);
        prefs.setIntPref("characters.alpha.case", document.getElementById("alphaCase").value);
        prefs.setIntPref("characters.alpha.weight", document.getElementById("alphaWeight").getAttribute("curpos"));

        prefs.setBoolPref("characters.other", document.getElementById("useOther").checked);
        prefs.setCharPref("characters.other.chars", document.getElementById("otherChars").value);
        prefs.setIntPref("characters.other.weight", document.getElementById("otherWeight").getAttribute("curpos"));

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
        var delay = 20;
        var maxSkippedFactor = 5;
        var character_groups = {
            alpha:     "abcdefghijklmnopqrstuvwxyz",
            vowel:     "aeiou",
            consonant: "bcdfghjklmnpqrstvwxyz",
            digits:    "1234567890",
            left:      /[^abcdefgqrstvwxz123456\`\~\!\@\#\$\%\^]/gi,
            right:     /[^hijklmnopuy7890&*()\-\_\=\+\{\}\|\[\]\:\"\;\'\<\>\?\,\.\/]/gi
        };

        this.savePrefs();
        var prefs = this.getPrefs();

        var mnemonic = prefs.getBoolPref("mnemonic");

        var valid_hand_chars;
	switch(prefs.getIntPref("hands")) {
	case 0:
	    break;
	case 1:
	    valid_hand_chars = character_groups["left"];
	    break;
	case 2:
	    valid_hand_chars = character_groups["right"];
	    break;
	}

        var exclude_chars;
        if(prefs.getBoolPref("characters.exclude")) {
            exclude_chars = prefs.getCharPref("characters.exclude.chars");
            if(exclude_chars) {
                var exclude_regexp = "["
                    + exclude_chars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + "]";
                exclude_chars = new RegExp(exclude_regexp, "gi");
            }
        }

        var valid_chars = [];
        function push_valid_chars(chars, count) {
            if(valid_hand_chars) chars = chars.replace(valid_hand_chars, "");
            if(exclude_chars) chars = chars.replace(exclude_chars, "");
            for(var i = 0; i < count; i ++) {
                valid_chars.push(chars);
            }
        }

        if(!mnemonic && prefs.getBoolPref("characters.digits")) {
            push_valid_chars(character_groups.digits,
                             prefs.getIntPref("characters.digits.weight") + 1);
        }

        if(mnemonic || prefs.getBoolPref("characters.alpha")) {
            var chars = character_groups.alpha;
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
            push_valid_chars(chars, prefs.getIntPref("characters.alpha.weight") + 1);
        }

        if(!mnemonic && prefs.getBoolPref("characters.other")) {
            push_valid_chars(prefs.getCharPref("characters.other.chars"),
                             prefs.getIntPref("characters.other.weight") + 1);
        }

        function randomSort(a, b) {
            var temp = Math.round(Math.random()*10);
            return (temp % 2) * (temp > 5 ? 1 : -1);
        }

//        valid_chars = valid_chars.join('');
//        valid_chars = valid_chars.split('').sort(randomSort).join('');
        valid_chars = valid_chars.sort(randomSort);

        var passwordField = this.passwordField;
        var passwordLength = prefs.getIntPref("length");
        var password = "";
        var skipped  = 0;

        (function nextChar() {
             var line = valid_chars[Math.round(Math.random() * (valid_chars.length - 1))];
             var newChar = line[Math.round(Math.random() * (line.length - 1))];
//             var newChar = valid_chars[Math.round(Math.random() * (valid_chars.length - 1))];

             passwordField.value = password + newChar;

             var skipping = false;
             if(mnemonic) {
                 var lowerCaseNewChar = newChar.toLowerCase();
                 var lowerCasePrevChar = password.length
                     ? password[password.length - 1].toLowerCase()
                     : null;
                 var lowerCasePrevPrevChar = password.length > 1
                     ? password[password.length - 2].toLowerCase()
                     : null;
                 if(lowerCasePrevChar && lowerCasePrevPrevChar) {
                     //make sure that there is one vowel every 2 consonants
                     if(character_groups.vowel.indexOf(lowerCaseNewChar) < 0
                        && character_groups.vowel.indexOf(lowerCasePrevChar) < 0
                        && character_groups.vowel.indexOf(lowerCasePrevPrevChar) < 0) {
                         skipping = true;
                     }
                     //make sure that there is no more than 2 vowels together
                     if(character_groups.consonant.indexOf(lowerCaseNewChar) > -1
                        && character_groups.consonant.indexOf(lowerCasePrevChar) > -1
                        && character_groups.consonant.indexOf(lowerCasePrevPrevChar) > -1) {
                         skipping = true;
                     }
                 }
             }

             if(skipping && skipped <= maxSkippedFactor * passwordLength) {
                 skipped++;
                 window.setTimeout(nextChar, delay);
             } else {
                 password += newChar;
                 if(password.length >= passwordLength) {
                     passwordField.value = password;
                 } else {
                     window.setTimeout(nextChar, delay);
                 }
             }
        })();
    }
};
