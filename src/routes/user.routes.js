const express = require("express");
const controller = require("../controllers/user.controller")
const authMiddleware = require("../middleware/auth.middleware")
const router = express.Router();

router.post("/register",controller.register);
router.post("/login",controller.login);


router.put("/:id",authMiddleware,controller.updateUser);
router.get("/profile/:id",authMiddleware,controller.getProfile);
router.get("/alluser",authMiddleware,controller.getAllUser);
module.exports = router