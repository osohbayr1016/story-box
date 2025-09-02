const Admin = require("../../models/admin.model");
const Login = require("../../models/login.model");
const Cryptr = require("cryptr");
const cryptr = new Cryptr("myTotallySecretKey");

// Dev-only: create admin without purchase code (guarded by secret key middleware)
exports.createAdminWithoutPurchase = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res
        .status(200)
        .json({ status: false, message: "Oops ! Invalid details!" });
    }

    const existing = await Admin.findOne({ email: String(email).trim() });
    if (existing) {
      return res.status(200).json({
        status: false,
        message: "Admin already exists with that email.",
      });
    }

    const admin = new Admin({
      email: String(email).trim(),
      password: cryptr.encrypt(String(password)),
      purchaseCode: "",
    });
    await admin.save();

    let login = await Login.findOne();
    if (!login) {
      await new Login({ login: true }).save();
    } else {
      login.login = true;
      await login.save();
    }

    return res
      .status(200)
      .json({ status: true, message: "Admin Created Successfully!", admin });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error?.message || "Internal Server Error",
    });
  }
};
