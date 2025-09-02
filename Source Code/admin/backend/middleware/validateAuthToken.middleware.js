const admin = require("firebase-admin");

const privateKey = settingJSON?.privateKey;

const isFirebaseConfigured =
  privateKey &&
  typeof privateKey.project_id === "string" &&
  typeof privateKey.private_key === "string" &&
  typeof privateKey.client_email === "string";

const validateAuthToken = async (req, res, next) => {
  console.log("🟢 [AUTH] Incoming request received.");

  const authHeader =
    req.headers["authorization"] || req.headers["Authorization"];
  console.log("🔹 [AUTH] Authorization Header:", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("⚠️ [AUTH] Authorization token missing or malformed.");
    return res
      .status(401)
      .json({ status: false, message: "Authorization token required" });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    if (!isFirebaseConfigured || admin.apps.length === 0) {
      console.warn("⚠️ [AUTH] Firebase not configured. Rejecting request.");
      return res
        .status(503)
        .json({
          status: false,
          message: "Auth service unavailable. Contact admin.",
        });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log("✅ [AUTH] Token successfully verified.", decodedToken);

    if (!decodedToken) {
      console.warn("⚠️ [AUTH] Invalid token. Authorization failed.");
      return res
        .status(401)
        .json({
          status: false,
          message: "Invalid token. Authorization failed.",
        });
    }

    req.user = {
      uid: decodedToken.uid,
      provider: decodedToken.firebase?.sign_in_provider || "unknown",
    };

    next();
  } catch (error) {
    console.error(`❌ [AUTH] Token verification failed: ${error.message}`);

    return res.status(401).json({
      status: false,
      message:
        error.code === "auth/id-token-expired"
          ? "Token expired. Please reauthenticate."
          : "Invalid token. Authorization failed.",
    });
  }
};

module.exports = validateAuthToken;
