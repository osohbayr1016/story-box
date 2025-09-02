// Seed an initial admin user directly in the database
// Usage:
// ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=admin123 PURCHASE_CODE= node scripts/seedAdmin.js

require("dotenv").config({ path: ".env" });

// Initialize mongoose connection (uses fallback URI if env not set)
require("../util/connection");

const Admin = require("../models/admin.model");
const Login = require("../models/login.model");
const Cryptr = require("cryptr");
const cryptr = new Cryptr("myTotallySecretKey");

async function seedAdmin() {
  try {
    const email = (process.env.ADMIN_EMAIL || "admin@example.com").trim();
    const rawPassword = process.env.ADMIN_PASSWORD || "admin123";
    const purchaseCode = process.env.PURCHASE_CODE || "";

    if (!email || !rawPassword) {
      console.error("ADMIN_EMAIL and ADMIN_PASSWORD are required.");
      process.exit(1);
    }

    let admin = await Admin.findOne({ email }).lean();
    if (admin) {
      console.log(`Admin already exists for email: ${email}`);
    } else {
      const password = cryptr.encrypt(String(rawPassword));
      admin = await new Admin({ email, password, purchaseCode }).save();
      console.log(`Admin created successfully for email: ${email}`);
    }

    // Ensure login flag is true (mirrors controller behavior)
    let login = await Login.findOne();
    if (!login) {
      await new Login({ login: true }).save();
    } else {
      login.login = true;
      await login.save();
    }

    process.exit(0);
  } catch (err) {
    console.error("Failed to seed admin:", err?.message || err);
    process.exit(1);
  }
}

seedAdmin();
