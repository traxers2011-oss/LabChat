// ============================================================
// LABCHAT - FIREBASE CONFIGURATION
// ============================================================

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import { getAuth } from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import { getDatabase } from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";


// ============================================================
// FIREBASE CONFIG
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyD3R1sj9agUMt0fwmEhJ-8Hug9s_VK08zA",
    authDomain: "labchat-3613b.firebaseapp.com",
    databaseURL: "https://labchat-3613b-default-rtdb.firebaseio.com",
    projectId: "labchat-3613b",
    storageBucket: "labchat-3613b.firebasestorage.app",
    messagingSenderId: "545101084154",
    appId: "1:545101084154:web:1c3373f37ec38d60f7e043"
};


// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const app = initializeApp(firebaseConfig);


// ============================================================
// AUTHENTICATION
// ============================================================

const auth = getAuth(app);


// ============================================================
// REALTIME DATABASE
// ============================================================

const realtimeDb = getDatabase(app);


// ============================================================
// EXPORT
// ============================================================

export {
    app,
    auth,
    realtimeDb
};
