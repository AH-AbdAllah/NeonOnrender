const admin = require('firebase-admin');
const fs = require('fs');
require('dotenv').config();

let db;
let isMock = false;

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
    // If no configuration is provided, fall back to mock
    throw new Error('No Firestore service account credentials provided.');
  }
} catch (error) {
  console.warn('--- FIRESTORE INACTIVE ---');
  console.warn(`Reason: ${error.message}`);
  console.warn('Logging will fall back to local console mock mode.');
  console.warn('-------------------------');

  isMock = true;
  db = {
    collection: (collectionName) => ({
      add: async (documentData) => {
        const docId = `mock-doc-${Math.random().toString(36).substring(2, 11)}`;
        console.log(`[Mock Firestore Log][${collectionName}][ID: ${docId}]:`, JSON.stringify(documentData, null, 2));
        return {
          id: docId,
          get: async () => ({
            id: docId,
            exists: true,
            data: () => documentData
          })
        };
      }
    })
  };
}

module.exports = {
  db,
  isMock
};
