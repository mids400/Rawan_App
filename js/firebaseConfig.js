// --- Firebase Configuration ---
// TO-DO: Replace the values below with your own Firebase project keys
// 1. Go to console.firebase.google.com
// 2. Create a new project
// 3. Add a Web App
// 4. Copy the config object here

// NOTE: We are using the "Compat" libraries, so we use the global 'firebase' object.
// Do NOT use 'import' statements here unless you are using a bundler.

const firebaseConfig = {
  apiKey: "AIzaSyB3GMpbUy_DGLCrKwieN6L_U8vzqGETPD4",
  authDomain: "rawandiet-f3fa1.firebaseapp.com",
  projectId: "rawandiet-f3fa1",
  storageBucket: "rawandiet-f3fa1.firebasestorage.app",
  messagingSenderId: "672014363470",
  appId: "1:672014363470:web:283c53b6669dba52758c1f"
};

// Initialize Firebase
try {
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  console.log("Firebase initialized");
} catch (e) {
  console.error("Firebase init error. Did you add your keys?", e);
  alert("تنبيه: لم يتم ربط قاعدة البيانات بعد. يرجى إضافة مفاتيح Firebase في ملف firebaseConfig.js");
}
