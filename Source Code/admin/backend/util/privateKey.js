const admin = require("firebase-admin");
const initializeSettings = require("../util/initializeSettings");

const initFirebase = async () => {
  try {
    await initializeSettings;

    const key = settingJSON?.privateKey;
    const isNonEmptyString = (v) => typeof v === "string" && v.trim() !== "";
    const hasRequiredFields =
      key &&
      typeof key === "object" &&
      isNonEmptyString(key.project_id) &&
      isNonEmptyString(key.private_key) &&
      isNonEmptyString(key.client_email);

    if (!hasRequiredFields) {
      console.warn(
        "Firebase private key missing or incomplete in settings. Skipping Firebase initialization."
      );
      return null;
    }

    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(key),
      });
      console.log("Firebase Admin SDK initialized successfully");
    }

    return admin;
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
    return null;
  }
};

module.exports = initFirebase();
