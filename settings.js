// =========================================
// LABCHAT SETTINGS
// =========================================


// =========================================
// DEFAULT SETTINGS
// =========================================

const DEFAULT_SETTINGS = {

    background: "midnight",

    customBackground: "",

    displayName: ""

};


// =========================================
// BACKGROUND PRESETS
// =========================================

const BACKGROUNDS = [

    {
        id: "midnight",
        name: "Midnight",

        css:
            "linear-gradient(135deg, #0f172a, #111827, #020617)"
    },

    {
        id: "purple",
        name: "Purple",

        css:
            "linear-gradient(135deg, #1e1b4b, #4c1d95, #312e81)"
    },

    {
        id: "ocean",
        name: "Ocean",

        css:
            "linear-gradient(135deg, #082f49, #075985, #0c4a6e)"
    },

    {
        id: "forest",
        name: "Forest",

        css:
            "linear-gradient(135deg, #052e16, #14532d, #166534)"
    },

    {
        id: "sunset",
        name: "Sunset",

        css:
            "linear-gradient(135deg, #431407, #9a3412, #7c2d12)"
    },

    {
        id: "pink",
        name: "Pink",

        css:
            "linear-gradient(135deg, #500724, #831843, #701a75)"
    },

    {
        id: "mono",
        name: "Mono",

        css:
            "linear-gradient(135deg, #18181b, #27272a, #09090b)"
    },

    {
        id: "aurora",
        name: "Aurora",

        css:
            "linear-gradient(135deg, #022c22, #164e63, #312e81)"
    }

];


// =========================================
// EMOJI LIST
// =========================================

const EMOJIS = [

    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "😂",
    "🤣",

    "😊",
    "😇",
    "🙂",
    "🙃",
    "😉",
    "😌",
    "😍",
    "🥰",

    "😘",
    "😗",
    "😙",
    "😚",
    "😋",
    "😛",
    "😝",
    "😜",

    "🤪",
    "🤨",
    "🧐",
    "🤓",
    "😎",
    "🥳",
    "🤩",
    "🥺",

    "😭",
    "😢",
    "😥",
    "😟",
    "😕",
    "🙁",
    "☹️",
    "😣",

    "😖",
    "😫",
    "😩",
    "🥲",
    "😤",
    "😡",
    "🤬",
    "😱",

    "😨",
    "😰",
    "😳",
    "🤯",
    "😴",
    "🤗",
    "🤔",
    "🫡",

    "👍",
    "👎",
    "👏",
    "🙌",
    "🤝",
    "🙏",
    "💪",
    "🔥",

    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "🤍",

    "💯",
    "✨",
    "⭐",
    "🌟",
    "🎉",
    "🎊",
    "💀",
    "👀",

    "🚀",
    "💎",
    "🏆",
    "⚡",
    "☀️",
    "🌙",
    "🌈",
    "🍕",

    "🍔",
    "🍟",
    "🍿",
    "🎮",
    "🎵",
    "🎧",
    "📱",
    "💻"

];


// =========================================
// LOCAL STORAGE HELPERS
// =========================================

function loadSettings() {

    try {

        const saved =
            localStorage.getItem("labchat_settings");

        if (!saved) {

            return {
                ...DEFAULT_SETTINGS
            };

        }

        const parsed =
            JSON.parse(saved);

        return {

            ...DEFAULT_SETTINGS,
            ...parsed

        };

    } catch (error) {

        console.error(
            "Could not load settings:",
            error
        );

        return {
            ...DEFAULT_SETTINGS
        };

    }

}


function saveSettings(settings) {

    try {

        localStorage.setItem(
            "labchat_settings",
            JSON.stringify(settings)
        );

    } catch (error) {

        console.error(
            "Could not save settings:",
            error
        );

    }

}


// =========================================
// DISPLAY NAME
// =========================================

function getSavedName() {

    return localStorage.getItem(
        "labchat_display_name"
    ) || "";

}


function saveDisplayName(name) {

    localStorage.setItem(
        "labchat_display_name",
        name
    );

}


function removeDisplayName() {

    localStorage.removeItem(
        "labchat_display_name"
    );

}


// =========================================
// EXPORT
// =========================================

export {

    DEFAULT_SETTINGS,

    BACKGROUNDS,

    EMOJIS,

    loadSettings,

    saveSettings,

    getSavedName,

    saveDisplayName,

    removeDisplayName

};