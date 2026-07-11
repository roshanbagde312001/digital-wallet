const express = require("express");
const controller = require("../controllers/user.controller")

const router = express.Router();

router.post("/register",controller.register);


module.exports = router