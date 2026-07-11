const express = require("express");
const controller = require("../controllers/user.controller")

const router = express.Router();

router.post("/register",controller.register);
router.put("/:id",controller.updateUser);
router.get("/profile/:id",controller.getProfile);
router.get("/alluser",controller.getAllUser);

module.exports = router