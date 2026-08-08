// =========================================
// LABCHAT
// COMPLETE APPLICATION SCRIPT
// =========================================

import {
    auth,
    db,
    realtimeDb
} from "./firebase.js";


import {
    signInAnonymously,
    onAuthStateChanged
} from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp
} from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


import {
    ref,
    set,
    onValue,
    onDisconnect,
    serverTimestamp as realtimeServerTimestamp
} from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";


import {
    BACKGROUNDS,
    EMOJIS,
    loadSettings,
    saveSettings,
    getSavedName,
    saveDisplayName
} from "./settings.js";


// =========================================
// APPLICATION STATE
// =========================================

let currentUser = null;

let displayName = "";

let messagesUnsubscribe = null;

let presenceUnsubscribe = null;

let currentSettings = loadSettings();

let selectedBackground =
    currentSettings.background ||
    "midnight";


// =========================================
// DOM ELEMENTS
// =========================================

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
    document.getElementById(
        "messagesContainer"
    );

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
    document.getElementById(
        "closeEmojiButton"
    );

const emojiGrid =
    document.getElementById("emojiGrid");

const onlineCount =
    document.getElementById("onlineCount");

const settingsButton =
    document.getElementById(
        "settingsButton"
    );

const settingsOverlay =
    document.getElementById(
        "settingsOverlay"
    );

const closeSettingsButton =
    document.getElementById(
        "closeSettingsButton"
    );

const changeNameInput =
    document.getElementById(
        "changeNameInput"
    );

const saveNameButton =
    document.getElementById(
        "saveNameButton"
    );

const currentName =
    document.getElementById(
        "currentName"
    );

const backgroundGrid =
    document.getElementById(
        "backgroundGrid"
    );

const customBackgroundInput =
    document.getElementById(
        "customBackgroundInput"
    );

const applyBackgroundButton =
    document.getElementById(
        "applyBackgroundButton"
    );

const toast =
    document.getElementById("toast");

const toastMessage =
    document.getElementById(
        "toastMessage"
    );


// =========================================
// INITIALIZATION
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    initialize
);


async function initialize() {

    createEmojiPicker();

    createBackgroundPicker();

    applySavedBackground();

    setupEventListeners();

    const savedName =
        getSavedName();

    if (savedName) {

        nameInput.value =
            savedName;

    }

    try {

        await signInAnonymously(auth);

    } catch (error) {

        console.error(
            "Firebase authentication error:",
            error
        );

        showNameError(
            "Unable to connect to the chat server."
        );

    }

}


// =========================================
// AUTHENTICATION
// =========================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            return;

        }

        currentUser = user;

    }
);


// =========================================
// EVENT LISTENERS
// =========================================

function setupEventListeners() {

    joinButton.addEventListener(
        "click",
        joinChat
    );


    nameInput.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter"
            ) {

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
        toggleEmojiPicker
    );


    closeEmojiButton.addEventListener(
        "click",
        closeEmojiPicker
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

            if (
                event.key === "Enter"
            ) {

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

            const insideEmoji =
                emojiPicker.contains(event.target);

            const emojiButtonClicked =
                emojiButton.contains(event.target);

            if (
                !insideEmoji &&
                !emojiButtonClicked
            ) {

                closeEmojiPicker();

            }

        }
    );

}


// =========================================
// JOIN CHAT
// =========================================

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

    saveDisplayName(
        displayName
    );


    currentSettings.displayName =
        displayName;

    saveSettings(
        currentSettings
    );


    currentName.textContent =
        displayName;

    changeNameInput.value =
        displayName;


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


// =========================================
// START CHAT
// =========================================

function startChat() {

    listenForMessages();

    setupPresence();

    scrollMessagesToBottom();

}


// =========================================
// FIRESTORE MESSAGE LISTENER
// =========================================

function listenForMessages() {

    if (messagesUnsubscribe) {

        messagesUnsubscribe();

    }


    const messagesRef =
        collection(
            db,
            "messages"
        );


    const messagesQuery =
        query(
            messagesRef,
            orderBy(
                "createdAt",
                "asc"
            ),
            limit(300)
        );


    messagesUnsubscribe =
        onSnapshot(
            messagesQuery,
            (snapshot) => {

                messages.innerHTML = "";


                if (
                    snapshot.empty
                ) {

                    showEmptyChat();

                    return;

                }


                snapshot.forEach(
                    (documentSnapshot) => {

                        const data =
                            documentSnapshot.data();

                        renderMessage(
                            data,
                            documentSnapshot.id
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

                showToast(
                    "Unable to load messages."
                );

            }
        );

}


// =========================================
// SEND MESSAGE
// =========================================

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

        await addDoc(
            collection(
                db,
                "messages"
            ),
            {

                text: text,

                senderName:
                    displayName,

                senderId:
                    currentUser.uid,

                createdAt:
                    serverTimestamp()

            }
        );


        messageInput.value = "";

        autoResizeMessageInput();

        closeEmojiPicker();

        messageInput.focus();


    } catch (error) {

        console.error(
            "Send message error:",
            error
        );

        showToast(
            "Message could not be sent."
        );

    } finally {

        sendButton.disabled = false;

    }

}


// =========================================
// RENDER MESSAGE
// =========================================

function renderMessage(
    data,
    messageId
) {

    const wrapper =
        document.createElement(
            "div"
        );


    const own =
        currentUser &&
        data.senderId ===
        currentUser.uid;


    wrapper.className =
        own
            ? "message own"
            : "message";


    const content =
        document.createElement(
            "div"
        );

    content.className =
        "message-content";


    const author =
        document.createElement(
            "div"
        );

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
        document.createElement(
            "div"
        );

    text.className =
        "message-text";

    text.textContent =
        data.text || "";


    const time =
        document.createElement(
            "span"
        );

    time.className =
        "message-time";

    time.textContent =
        formatMessageTime(
            data.createdAt
        );


    content.appendChild(
        author
    );

    content.appendChild(
        text
    );

    content.appendChild(
        time
    );

    wrapper.appendChild(
        content
    );

    messages.appendChild(
        wrapper
    );

}


// =========================================
// EMPTY CHAT
// =========================================

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


// =========================================
// FORMAT TIME
// =========================================

function formatMessageTime(
    timestamp
) {

    if (!timestamp) {

        return "Sending...";

    }


    let date;


    if (
        typeof timestamp.toDate ===
        "function"
    ) {

        date =
            timestamp.toDate();

    } else {

        date =
            new Date();

    }


    return date.toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// =========================================
// ONLINE PRESENCE
// =========================================

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


    if (presenceUnsubscribe) {

        presenceUnsubscribe();

    }


    presenceUnsubscribe =
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

                        name:
                            displayName,

                        online:
                            true,

                        lastSeen:
                            realtimeServerTimestamp()

                    }
                );

            }
        );


    listenForOnlineUsers();

}


// =========================================
// ONLINE USERS LISTENER
// =========================================

function listenForOnlineUsers() {

    const presenceListRef =
        ref(
            realtimeDb,
            "presence"
        );


    onValue(
        presenceListRef,
        (snapshot) => {

            const data =
                snapshot.val();


            if (!data) {

                onlineCount.textContent =
                    "0";

                return;

            }


            const users =
                Object.values(
                    data
                ).filter(
                    user =>
                        user &&
                        user.online === true
                );


            onlineCount.textContent =
                String(
                    users.length
                );

        },
        (error) => {

            console.error(
                "Presence error:",
                error
            );

        }
    );

}


// =========================================
// EMOJI PICKER
// =========================================

function createEmojiPicker() {

    emojiGrid.innerHTML = "";


    EMOJIS.forEach(
        (emoji) => {

            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.className =
                "emoji-item";

            button.textContent =
                emoji;

            button.addEventListener(
                "click",
                () => {

                    insertEmoji(
                        emoji
                    );

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


    const newPosition =
        start +
        emoji.length;


    messageInput.focus();


    messageInput.selectionStart =
        newPosition;

    messageInput.selectionEnd =
        newPosition;


    autoResizeMessageInput();

}


// =========================================
// EMOJI CONTROLS
// =========================================

function toggleEmojiPicker() {

    emojiPicker.classList.toggle(
        "hidden"
    );

}


function closeEmojiPicker() {

    emojiPicker.classList.add(
        "hidden"
    );

}


// =========================================
// BACKGROUND PICKER
// =========================================

function createBackgroundPicker() {

    backgroundGrid.innerHTML = "";


    BACKGROUNDS.forEach(
        (background) => {

            const option =
                document.createElement(
                    "button"
                );

            option.type =
                "button";

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


            option.appendChild(
                label
            );


            option.addEventListener(
                "click",
                () => {

                    applyPresetBackground(
                        background
                    );

                }
            );


            backgroundGrid.appendChild(
                option
            );

        }
    );


    updateSelectedBackground();

}


// =========================================
// APPLY PRESET BACKGROUND
// =========================================

function applyPresetBackground(
    background
) {

    selectedBackground =
        background.id;


    currentSettings.background =
        background.id;

    currentSettings.customBackground =
        "";


    saveSettings(
        currentSettings
    );


    document.documentElement
        .style
        .setProperty(
            "--chat-background",
            background.css
        );


    updateSelectedBackground();

    customBackgroundInput.value = "";

    showToast(
        "Background changed."
    );

}


// =========================================
// CUSTOM BACKGROUND
// =========================================

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


    currentSettings.customBackground =
        url;

    currentSettings.background =
        "custom";


    saveSettings(
        currentSettings
    );


    document.documentElement
        .style
        .setProperty(
            "--chat-background",
            `url("${url}")`
        );


    updateSelectedBackground();

    showToast(
        "Custom background applied."
    );

}


// =========================================
// APPLY SAVED BACKGROUND
// =========================================

function applySavedBackground() {

    if (
        currentSettings.customBackground
    ) {

        document.documentElement
            .style
            .setProperty(
                "--chat-background",
                `url("${currentSettings.customBackground}")`
            );

        selectedBackground =
            "custom";

        return;

    }


    const background =
        BACKGROUNDS.find(
            item =>
                item.id ===
                selectedBackground
        );


    if (!background) {

        selectedBackground =
            "midnight";

        document.documentElement
            .style
            .setProperty(
                "--chat-background",
                BACKGROUNDS[0].css
            );

        return;

    }


    document.documentElement
        .style
        .setProperty(
            "--chat-background",
            background.css
        );

}


// =========================================
// SELECTED BACKGROUND UI
// =========================================

function updateSelectedBackground() {

    const options =
        document.querySelectorAll(
            ".background-option"
        );


    options.forEach(
        option => {

            if (
                option.dataset.background ===
                selectedBackground
            ) {

                option.classList.add(
                    "selected"
                );

            } else {

                option.classList.remove(
                    "selected"
                );

            }

        }
    );

}


// =========================================
// SETTINGS
// =========================================

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


// =========================================
// CHANGE DISPLAY NAME
// =========================================

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


    saveDisplayName(
        displayName
    );


    currentSettings.displayName =
        displayName;

    saveSettings(
        currentSettings
    );


    currentName.textContent =
        displayName;


    changeNameInput.value =
        displayName;


    updatePresenceName();


    showToast(
        "Display name changed."
    );

}


// =========================================
// UPDATE PRESENCE NAME
// =========================================

async function updatePresenceName() {

    if (!currentUser) {

        return;

    }


    try {

        const presenceRef =
            ref(
                realtimeDb,
                "presence/" +
                currentUser.uid
            );


        await set(
            presenceRef,
            {

                name:
                    displayName,

                online:
                    true,

                lastSeen:
                    realtimeServerTimestamp()

            }
        );

    } catch (error) {

        console.error(
            "Could not update presence:",
            error
        );

    }

}


// =========================================
// AUTO RESIZE TEXTAREA
// =========================================

function autoResizeMessageInput() {

    messageInput.style.height =
        "auto";


    const height =
        Math.min(
            messageInput.scrollHeight,
            130
        );


    messageInput.style.height =
        `${height}px`;

}


// =========================================
// SCROLL
// =========================================

function scrollMessagesToBottom() {

    requestAnimationFrame(
        () => {

            messagesContainer.scrollTop =
                messagesContainer.scrollHeight;

        }
    );

}


// =========================================
// ERROR
// =========================================

function showNameError(
    message
) {

    nameError.textContent =
        message;

}


// =========================================
// TOAST
// =========================================

let toastTimer = null;


function showToast(
    message
) {

    toastMessage.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2500
        );

}


// =========================================
// TAB / PAGE VISIBILITY
// =========================================

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            !currentUser
        ) {

            return;

        }


        if (
            document.visibilityState ===
            "visible"
        ) {

            updatePresenceName();

        }

    }
);


// =========================================
// BEFORE PAGE LEAVE
// =========================================

window.addEventListener(
    "beforeunload",
    () => {

        if (!currentUser) {

            return;

        }


        // onDisconnect() in Firebase
        // handles the actual presence removal.

    }
);