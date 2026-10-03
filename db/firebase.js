const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = path.join(__dirname, '../firebase-key.json');
let app;

if (getApps().length === 0) {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    app = initializeApp({
      credential: cert(serviceAccount)
    });
    console.log("Firebase Admin initialized via local key file.");
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    });
    console.log("Firebase Admin initialized via environment variables.");
  } else {
    console.warn("WARNING: Firebase credentials not found! Firebase Admin will not initialize.");
  }
} else {
  app = getApps()[0];
}

const db = app ? getFirestore() : null;
const auth = app ? getAuth() : null;

module.exports = { app, db, auth };
