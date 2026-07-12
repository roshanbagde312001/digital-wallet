const express = require("express");
const controller = require("../controllers/transaction.controller")
const authMiddleware = require("../middleware/auth.middleware")
const router = express.Router();

router.get("/",authMiddleware,controller.getHistory);

module.exports = router