var passwordGenerator = {
    onBrowserLoad: function() {
        document.getElementById("contentAreaContextMenu")
            .addEventListener("popupshowing", function (event) {
                                  passwordGenerator.showFirefoxContextMenu(event);
                              }, false);
    },

    onGeneratePasswordCommand: function(event) {
        window.openDialog('chrome://passwordgenerator/content/passwordGenerator.xul',
                          'passwordGenerator', 'centerscreen, chrome').focus();
    },

    onGeneratePasswordContextCommand: function(event) {
        var input = document.popupNode;
        var htmlDocument = input.ownerDocument;
        if(!htmlDocument.passwordGenerator) htmlDocument.passwordGenerator = {};
        var params = htmlDocument.passwordGenerator;
        params.input = input;
        window.openDialog('chrome://passwordgenerator/content/passwordGenerator.xul',
                          'passwordGenerator', 'centerscreen, chrome', params).focus();
    },

    onInsertLastPasswordCommand: function(event) {
        var input = document.popupNode;
        var htmlDocument = input.ownerDocument;
        var params = htmlDocument.passwordGenerator;
        if(params && params.lastPassword) input.value = params.lastPassword;
    },

    /*onToolbarButtonCommand: function(event) {
        passwordgenerator.onMenuItemCommand(event);
    },*/

    showFirefoxContextMenu: function(event) {
        var triggerNode = event.target.triggerNode;
        // show or hide the menuitem based on what the context menu is on
        var hidden = (triggerNode.type !== "password");
        document.getElementById("passwordGenerator-context-generate").hidden = hidden;
        document.getElementById("passwordGenerator-context-separator").hidden = hidden;
        if(hidden) {
            document.getElementById("passwordGenerator-context-insertLast").hidden = hidden;
        } else {
            var params = triggerNode.ownerDocument.passwordGenerator;
            document.getElementById("passwordGenerator-context-insertLast").hidden
                = !(params && params.lastPassword);
        }
    }
};

window.addEventListener("load", function () { passwordGenerator.onBrowserLoad(); }, false);
