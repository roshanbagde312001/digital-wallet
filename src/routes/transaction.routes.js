const express = require("express");
const controller = require("../controllers/transaction.controller")
const authMiddleware = require("../middleware/auth.middleware")
const {
    userMinuteRateLimiter,
    userHourRateLimiter
} = require("../middleware/rate-limit.middleware");
const router = express.Router();

router.get("/", authMiddleware, userMinuteRateLimiter, userHourRateLimiter, controller.getHistory);

module.exports = router
