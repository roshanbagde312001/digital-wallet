const express = require("express");
const controller = require("../controllers/user.controller")
const authMiddleware = require("../middleware/auth.middleware")
const {
    authRateLimiter,
    userMinuteRateLimiter,
    userHourRateLimiter
} = require("../middleware/rate-limit.middleware");
const router = express.Router();

router.post("/register", authRateLimiter, controller.register);
router.post("/login", authRateLimiter, controller.login);

router.use(authMiddleware, userMinuteRateLimiter, userHourRateLimiter);

router.put("/:id", controller.updateUser);
router.get("/profile/:id", controller.getProfile);
router.get("/alluser", controller.getAllUser);
module.exports = router
