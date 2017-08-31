
export const GENERATE_PASSWORD_MESSAGE = "generate-password";
export const INSERT_PASSWORD_MESSAGE = "insert-password";
export const GET_STATE_MESSAGE = "get-state";
export const SET_STATE_MESSAGE = "set-state";
export const SAVE_SETTINGS_MESSAGE = "save-settings";

export const GENERATE_PASSWORD_MENU = "generate-password";
export const INSERT_PREVIOUS_PASSWORD_MENU = "insert-previous-password";
export const OPEN_POPUP_MENU = "open-popup";

export const BOTH_CASES = "both";
export const UPPER_CASE = "upper";
export const LOWER_CASE = "lower";
export const BOTH_HANDS = "both";
export const LEFT_HAND = "left";
export const RIGHT_HAND = "right";

export const SETTINGS_KEY = "settings";
export const DEFAULT_SETTINGS = {
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

export const CHARACTER_GROUPS = {
    alpha:     "abcdefghijklmnopqrstuvwxyz",
    vowel:     "aeiou",
    consonant: "bcdfghjklmnpqrstvwxyz",
    digits:    "1234567890",
    left:      /[^abcdefgqrstvwxz123456\`\~\!\@\#\$\%\^]/gi,
    right:     /[^hijklmnopuy7890&*()\-\_\=\+\{\}\|\[\]\:\"\;\'\<\>\?\,\.\/]/gi
};
