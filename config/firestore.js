const admin = require('firebase-admin');
const fs = require('fs');
require('dotenv').config();

let db = null;

try {
  const saRaw = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();
  const saPath = (process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '').trim();

  if (saRaw) {
    // Attempt to parse service account JSON string from env
    const serviceAccount = JSON.parse(saRaw);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    console.log('Successfully initialized Firestore client using inline service account.');
  } else if (saPath && fs.existsSync(saPath)) {
    // Attempt to load service account file from path
    const serviceAccount = require(fs.realpathSync(saPath));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    console.log('Successfully initialized Firestore client using file path.');
  } else {
    console.warn('[Firestore Log Info] No Firestore service account credentials provided. Database event logging is disabled.');
  }
} catch (error) {
  console.warn('--- FIRESTORE INACTIVE ---');
  console.warn(`Reason: ${error.message}`);
  console.warn('Logging will be bypassed gracefully.');
  console.warn('-------------------------');
  db = null;
}

module.exports = {
  db
};
