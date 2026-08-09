// ============================================================
// LABCHAT
// REALTIME DATABASE CHAT
// SHARED BACKGROUND VERSION
// ============================================================

import {
    auth,
    realtimeDb
} from "./firebase.js";

import {
    signInAnonymously,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    ref,
    push,
    set,
    onValue,
    onDisconnect,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";


// ============================================================
// SETTINGS
// ============================================================

const EMOJIS = [
    "😀", "😃", "😄", "😁", "😆", "😅",
    "😂", "🤣", "😊", "😇", "🙂", "🙃",
    "😉", "😌", "😍", "🥰", "😘", "😎",
    "🤩", "🥳", "😏", "😭", "😡", "😱",
    "🤔", "🙄", "😴", "🤯",
    "❤️", "🧡", "💛", "💚", "💙", "💜",
    "🖤", "🤍", "💔", "✨", "🔥", "⭐",
    "🎉", "🎊", "👍", "👎", "👏", "🙏",
    "💯", "😈", "👀", "💀", "🤝",
    "🚀", "🎮", "⚡", "🌟", "🍕", "☕"
];


const BACKGROUNDS = [
    {
        id: "default",
        name: "Default",
        css: "linear-gradient(135deg, #111827, #1e293b, #0f172a)"
    },
    {
        id: "midnight",
        name: "Midnight",
        css: "linear-gradient(135deg, #020617, #0f172a, #172554)"
    },
    {
        id: "purple",
        name: "Purple",
        css: "linear-gradient(135deg, #312e81, #581c87, #701a75)"
    },
    {
        id: "ocean",
        name: "Ocean",
        css: "linear-gradient(135deg, #082f49, #075985, #164e63)"
    },
    {
        id: "sunset",
        name: "Sunset",
        css: "linear-gradient(135deg, #431407, #7c2d12, #4c0519)"
    },
    {
        id: "forest",
        name: "Forest",
        css: "linear-gradient(135deg, #052e16, #14532d, #064e3b)"
    },
    {
        id: "darkblue",
        name: "Dark Blue",
        css: "linear-gradient(135deg, #020617, #172554, #1e3a8a)"
    },
    {
        id: "pink",
        name: "Pink",
        css: "linear-gradient(135deg, #500724, #831843, #701a75)"
    }
];


// ============================================================
// STATE
// ============================================================

let currentUser = null;
let displayName = "";

let messagesListenerStarted = false;
let presenceListenerStarted = false;
let backgroundListenerStarted = false;


// ============================================================
// LOCAL NAME
// ============================================================

const savedName =
    localStorage.getItem("labchat_display_name");

if (savedName) {
    displayName = savedName;
}


// ============================================================
// DOM
// ============================================================

const nameScreen =
    document.getElementById("nameScreen");

const chatApp =
    document.getElementById("chatApp");

const nameInput =
    document.getElementById("nameInput");

const joinButton =
    document.getElementById("joinButton");

const nameError =
    document.getElementById("nameError");

const messagesContainer =
    document.getElementById("messagesContainer");

const messages =
    document.getElementById("messages");

const messageInput =
    document.getElementById("messageInput");

const sendButton =
    document.getElementById("sendButton");

const emojiButton =
    document.getElementById("emojiButton");

const emojiPicker =
    document.getElementById("emojiPicker");

const closeEmojiButton =
    document.getElementById("closeEmojiButton");

const emojiGrid =
    document.getElementById("emojiGrid");

const onlineCount =
    document.getElementById("onlineCount");

const settingsButton =
    document.getElementById("settingsButton");

const settingsOverlay =
    document.getElementById("settingsOverlay");

const closeSettingsButton =
    document.getElementById("closeSettingsButton");

const changeNameInput =
    document.getElementById("changeNameInput");

const saveNameButton =
    document.getElementById("saveNameButton");

const currentName =
    document.getElementById("currentName");

const backgroundGrid =
    document.getElementById("backgroundGrid");

const customBackgroundInput =
    document.getElementById("customBackgroundInput");

const applyBackgroundButton =
    document.getElementById("applyBackgroundButton");

const toast =
    document.getElementById("toast");

const toastMessage =
    document.getElementById("toastMessage");


// ============================================================
// STARTUP
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    initialize
);


function initialize() {

    createEmojiPicker();

    createBackgroundPicker();

    setupEventListeners();

    if (nameInput && displayName) {
        nameInput.value = displayName;
    }

    signInAnonymously(auth)
        .catch((error) => {

            console.error(
                "Firebase authentication error:",
                error
            );

            showNameError(
                "Unable to connect to the chat server."
            );

        });

}


// ============================================================
// AUTH
// ============================================================

onAuthStateChanged(
    auth,
    (user) => {

        if (!user) {
            return;
        }

        currentUser = user;

        // Listen for the shared room background
        startBackgroundListener();

    }
);


// ============================================================
// EVENTS
// ============================================================

function setupEventListeners() {

    joinButton.addEventListener(
        "click",
        joinChat
    );


    nameInput.addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Enter") {

                event.preventDefault();

                joinChat();

            }

        }
    );


    sendButton.addEventListener(
        "click",
        sendMessage
    );


    messageInput.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();

            }

        }
    );


    messageInput.addEventListener(
        "input",
        autoResizeMessageInput
    );


    emojiButton.addEventListener(
        "click",
        () => {

            emojiPicker.classList.toggle(
                "hidden"
            );

        }
    );


    closeEmojiButton.addEventListener(
        "click",
        () => {

            emojiPicker.classList.add(
                "hidden"
            );

        }
    );


    settingsButton.addEventListener(
        "click",
        openSettings
    );


    closeSettingsButton.addEventListener(
        "click",
        closeSettings
    );


    settingsOverlay.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                settingsOverlay
            ) {

                closeSettings();

            }

        }
    );


    saveNameButton.addEventListener(
        "click",
        changeDisplayName
    );


    changeNameInput.addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Enter") {

                event.preventDefault();

                changeDisplayName();

            }

        }
    );


    applyBackgroundButton.addEventListener(
        "click",
        applyCustomBackground
    );


    document.addEventListener(
        "click",
        (event) => {

            if (
                !emojiPicker.contains(event.target) &&
                !emojiButton.contains(event.target)
            ) {

                emojiPicker.classList.add(
                    "hidden"
                );

            }

        }
    );

}


// ============================================================
// JOIN CHAT
// ============================================================

async function joinChat() {

    const name =
        nameInput.value.trim();


    if (!name) {

        showNameError(
            "Please enter a display name."
        );

        return;

    }


    if (name.length < 2) {

        showNameError(
            "Your name must be at least 2 characters."
        );

        return;

    }


    if (name.length > 30) {

        showNameError(
            "Your name is too long."
        );

        return;

    }


    if (!currentUser) {

        showNameError(
            "Connecting to the chat server..."
        );

        return;

    }


    displayName = name;

    localStorage.setItem(
        "labchat_display_name",
        displayName
    );


    if (currentName) {
        currentName.textContent = displayName;
    }


    if (changeNameInput) {
        changeNameInput.value = displayName;
    }


    nameScreen.classList.remove(
        "active"
    );

    chatApp.classList.add(
        "active"
    );


    nameError.textContent = "";


    startChat();

    messageInput.focus();

}


// ============================================================
// START CHAT
// ============================================================

function startChat() {

    if (!messagesListenerStarted) {

        messagesListenerStarted = true;

        listenForMessages();

    }


    if (!presenceListenerStarted) {

        presenceListenerStarted = true;

        setupPresence();

    }

}


// ============================================================
// MESSAGES
// ============================================================

function listenForMessages() {

    const messagesRef =
        ref(
            realtimeDb,
            "messages"
        );


    onValue(
        messagesRef,
        (snapshot) => {

            messages.innerHTML = "";


            const data =
                snapshot.val();


            if (!data) {

                showEmptyChat();

                return;

            }


            const messageList =
                Object.entries(data)
                    .map(
                        ([id, message]) => ({
                            id,
                            ...message
                        })
                    )
                    .sort(
                        (a, b) =>
                            (a.createdAt || 0) -
                            (b.createdAt || 0)
                    )
                    .slice(-300);


            if (
                messageList.length === 0
            ) {

                showEmptyChat();

                return;

            }


            messageList.forEach(
                (message) => {

                    renderMessage(
                        message
                    );

                }
            );


            scrollMessagesToBottom();

        },
        (error) => {

            console.error(
                "Message listener error:",
                error
            );

        }
    );

}


// ============================================================
// SEND MESSAGE
// ============================================================

async function sendMessage() {

    const text =
        messageInput.value.trim();


    if (!text) {
        return;
    }


    if (!currentUser) {

        showToast(
            "Not connected to the server."
        );

        return;

    }


    if (!displayName) {

        showToast(
            "Please enter your display name."
        );

        return;

    }


    if (text.length > 1000) {

        showToast(
            "Message is too long."
        );

        return;

    }


    sendButton.disabled = true;


    try {

        const messagesRef =
            ref(
                realtimeDb,
                "messages"
            );


        const newMessage =
            push(messagesRef);


        await set(
            newMessage,
            {
                text: text,
                senderName: displayName,
                senderId: currentUser.uid,
                createdAt: Date.now()
            }
        );


        messageInput.value = "";

        autoResizeMessageInput();

        messageInput.focus();

    }
    catch (error) {

        console.error(
            "Send message error:",
            error
        );

        showToast(
            "Message could not be sent."
        );

    }
    finally {

        sendButton.disabled = false;

    }

}


// ============================================================
// RENDER MESSAGE
// ============================================================

function renderMessage(data) {

    const wrapper =
        document.createElement("div");


    const own =
        currentUser &&
        data.senderId ===
        currentUser.uid;


    wrapper.className =
        own
            ? "message own"
            : "message";


    const content =
        document.createElement("div");

    content.className =
        "message-content";


    const author =
        document.createElement("div");

    author.className =
        "message-author";


    author.textContent =
        own
            ? "You"
            : (
                data.senderName ||
                "Unknown"
            );


    const text =
        document.createElement("div");

    text.className =
        "message-text";


    text.textContent =
        data.text || "";


    const time =
        document.createElement("span");

    time.className =
        "message-time";


    time.textContent =
        formatMessageTime(
            data.createdAt
        );


    content.appendChild(author);

    content.appendChild(text);

    content.appendChild(time);

    wrapper.appendChild(content);

    messages.appendChild(wrapper);

}


// ============================================================
// EMPTY CHAT
// ============================================================

function showEmptyChat() {

    messages.innerHTML = `

        <div class="empty-chat">

            <div class="empty-chat-icon">
                💬
            </div>

            <h2>No messages yet</h2>

            <p>
                Be the first person to send a message.
            </p>

        </div>

    `;

}


// ============================================================
// TIME
// ============================================================

function formatMessageTime(timestamp) {

    if (!timestamp) {
        return "";
    }


    const date =
        new Date(timestamp);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date.toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// ============================================================
// PRESENCE
// ============================================================

function setupPresence() {

    if (!currentUser) {
        return;
    }


    const presenceRef =
        ref(
            realtimeDb,
            "presence/" +
            currentUser.uid
        );


    const connectedRef =
        ref(
            realtimeDb,
            ".info/connected"
        );


    onValue(
        connectedRef,
        (snapshot) => {

            if (
                snapshot.val() !== true
            ) {

                return;

            }


            onDisconnect(
                presenceRef
            ).remove();


            set(
                presenceRef,
                {
                    name: displayName,
                    online: true,
                    lastSeen:
                        serverTimestamp()
                }
            );

        }
    );


    listenForOnlineUsers();

}


// ============================================================
// ONLINE COUNT
// ============================================================

function listenForOnlineUsers() {

    const presenceRef =
        ref(
            realtimeDb,
            "presence"
        );


    onValue(
        presenceRef,
        (snapshot) => {

            const data =
                snapshot.val();


            if (!data) {

                onlineCount.textContent =
                    "0";

                return;

            }


            const users =
                Object.values(data)
                    .filter(
                        user =>
                            user &&
                            user.online === true
                    );


            onlineCount.textContent =
                users.length;

        }
    );

}


// ============================================================
// EMOJIS
// ============================================================

function createEmojiPicker() {

    emojiGrid.innerHTML = "";


    EMOJIS.forEach(
        (emoji) => {

            const button =
                document.createElement(
                    "button"
                );


            button.type = "button";

            button.className =
                "emoji-item";

            button.textContent =
                emoji;


            button.addEventListener(
                "click",
                () => {

                    insertEmoji(emoji);

                }
            );


            emojiGrid.appendChild(
                button
            );

        }
    );

}


function insertEmoji(emoji) {

    const start =
        messageInput.selectionStart;

    const end =
        messageInput.selectionEnd;


    const text =
        messageInput.value;


    messageInput.value =
        text.slice(0, start) +
        emoji +
        text.slice(end);


    const position =
        start + emoji.length;


    messageInput.focus();

    messageInput.selectionStart =
        position;

    messageInput.selectionEnd =
        position;

    autoResizeMessageInput();

}


// ============================================================
// SHARED BACKGROUND
// ============================================================

function createBackgroundPicker() {

    backgroundGrid.innerHTML = "";


    BACKGROUNDS.forEach(
        (background) => {

            const option =
                document.createElement(
                    "button"
                );


            option.type = "button";

            option.className =
                "background-option";


            option.dataset.background =
                background.id;


            option.style.background =
                background.css;


            const label =
                document.createElement(
                    "span"
                );


            label.textContent =
                background.name;


            option.appendChild(label);


            option.addEventListener(
                "click",
                () => {

                    setSharedBackground(
                        background.css,
                        background.id,
                        ""
                    );

                }
            );


            backgroundGrid.appendChild(
                option
            );

        }
    );

}


// ============================================================
// LISTEN FOR SHARED BACKGROUND
// ============================================================

function startBackgroundListener() {

    if (backgroundListenerStarted) {
        return;
    }


    backgroundListenerStarted = true;


    const backgroundRef =
        ref(
            realtimeDb,
            "chatSettings/background"
        );


    onValue(
        backgroundRef,
        (snapshot) => {

            const data =
                snapshot.val();


            if (!data) {

                applyBackgroundLocally(
                    "linear-gradient(135deg, #111827, #1e293b, #0f172a)"
                );

                return;

            }


            if (
                data.type === "custom" &&
                data.value
            ) {

                applyBackgroundLocally(
                    `url("${data.value}")`
                );

            }
            else if (
                data.value
            ) {

                applyBackgroundLocally(
                    data.value
                );

            }


            updateSelectedBackground(
                data.id || ""
            );

        },
        (error) => {

            console.error(
                "Background listener error:",
                error
            );

        }
    );

}


// ============================================================
// CHANGE SHARED BACKGROUND
// ============================================================

async function setSharedBackground(
    css,
    id,
    customUrl
) {

    if (!currentUser) {

        showToast(
            "You are not connected."
        );

        return;

    }


    try {

        const backgroundRef =
            ref(
                realtimeDb,
                "chatSettings/background"
            );


        await set(
            backgroundRef,
            {
                type:
                    customUrl
                        ? "custom"
                        : "preset",

                id:
                    id,

                value:
                    customUrl || css,

                changedBy:
                    currentUser.uid,

                changedAt:
                    Date.now()
            }
        );


        showToast(
            "Background changed for everyone."
        );

    }
    catch (error) {

        console.error(
            "Background update error:",
            error
        );

        showToast(
            "Background could not be changed."
        );

    }

}


// ============================================================
// CUSTOM BACKGROUND
// ============================================================

function applyCustomBackground() {

    const url =
        customBackgroundInput.value.trim();


    if (!url) {

        showToast(
            "Enter an image URL."
        );

        return;

    }


    if (
        !/^https?:\/\//i.test(url)
    ) {

        showToast(
            "Please enter a valid image URL."
        );

        return;

    }


    setSharedBackground(
        "",
        "custom",
        url
    );

}


// ============================================================
// APPLY BACKGROUND LOCALLY
// ============================================================

function applyBackgroundLocally(css) {

    document.documentElement.style
        .setProperty(
            "--chat-background",
            css
        );


    document.documentElement.style
        .setProperty(
            "--chat-background-size",
            "cover"
        );

}


// ============================================================
// SELECTED BACKGROUND
// ============================================================

function updateSelectedBackground(id) {

    document
        .querySelectorAll(
            ".background-option"
        )
        .forEach(
            (option) => {

                option.classList.toggle(
                    "selected",
                    option.dataset.background === id
                );

            }
        );

}


// ============================================================
// NAME SETTINGS
// ============================================================

function openSettings() {

    changeNameInput.value =
        displayName;


    currentName.textContent =
        displayName;


    settingsOverlay.classList.remove(
        "hidden"
    );

}


function closeSettings() {

    settingsOverlay.classList.add(
        "hidden"
    );

}


function changeDisplayName() {

    const newName =
        changeNameInput.value.trim();


    if (!newName) {

        showToast(
            "Enter a display name."
        );

        return;

    }


    if (newName.length < 2) {

        showToast(
            "Name must be at least 2 characters."
        );

        return;

    }


    if (newName.length > 30) {

        showToast(
            "Name is too long."
        );

        return;

    }


    displayName =
        newName;


    localStorage.setItem(
        "labchat_display_name",
        displayName
    );


    nameInput.value =
        displayName;


    currentName.textContent =
        displayName;


    updatePresenceName();

    showToast(
        "Display name changed."
    );

}


function updatePresenceName() {

    if (!currentUser) {
        return;
    }


    const presenceRef =
        ref(
            realtimeDb,
            "presence/" +
            currentUser.uid
        );


    set(
        presenceRef,
        {
            name: displayName,
            online: true,
            lastSeen:
                serverTimestamp()
        }
    );

}


// ============================================================
// INPUT
// ============================================================

function autoResizeMessageInput() {

    messageInput.style.height =
        "auto";


    messageInput.style.height =
        Math.min(
            messageInput.scrollHeight,
            150
        ) + "px";

}


function scrollMessagesToBottom() {

    setTimeout(
        () => {

            messagesContainer.scrollTop =
                messagesContainer.scrollHeight;

        },
        50
    );

}


// ============================================================
// ERROR / TOAST
// ============================================================

function showNameError(message) {

    nameError.textContent =
        message;

}


function showToast(message) {

    if (!toast || !toastMessage) {
        return;
    }


    toastMessage.textContent =
        message;


    toast.classList.add(
        "show"
    );


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );

        },
        2500
    );

}
