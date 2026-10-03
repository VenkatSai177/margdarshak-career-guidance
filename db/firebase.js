const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = path.join(__dirname, '../firebase-key.json');
let app;

if (!fs.existsSync(serviceAccountPath)) {
  console.warn("WARNING: firebase-key.json not found! Firebase will not initialize.");
} else {
  const serviceAccount = require(serviceAccountPath);
  if (getApps().length === 0) {
    app = initializeApp({
      credential: cert(serviceAccount)
    });
  } else {
    app = getApps()[0];
  }
}

const db = app ? getFirestore() : null;
const auth = app ? getAuth() : null;

module.exports = { app, db, auth };
