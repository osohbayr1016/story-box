const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");
const DevController = require("../../controllers/admin/dev.controller");

// Dev-only: create admin without purchase code
route.post(
  "/createAdminWithoutPurchase",
  checkAccessWithSecretKey(),
  DevController.createAdminWithoutPurchase
);

module.exports = route;
