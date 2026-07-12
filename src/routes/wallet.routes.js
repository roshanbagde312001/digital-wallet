const express = require("express");
const controller = require("../controllers/wallet.controller")
const authMiddleware = require("../middleware/auth.middleware")
const {
    userMinuteRateLimiter,
    userHourRateLimiter,
    transactionRateLimiter
} = require("../middleware/rate-limit.middleware");
const router = express.Router();

router.use(authMiddleware, userMinuteRateLimiter, userHourRateLimiter);

router.get("/", controller.getWallet);
router.post("/deposit", transactionRateLimiter, controller.deposit);
router.post("/withdraw", transactionRateLimiter, controller.widDraw);
router.post("/transfer", transactionRateLimiter, controller.transfer)

module.exports = router;
