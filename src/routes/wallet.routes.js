const express = require("express");
const controller = require("../controllers/wallet.controller")
const authMiddleware = require("../middleware/auth.middleware")
const router = express.Router();

router.get("/",authMiddleware,controller.getWallet);
router.post("/deposit",authMiddleware,controller.deposit);
router.post("/withdraw",authMiddleware,controller.widDraw);
router.post("/transfer",authMiddleware,controller.transfer)

module.exports = router;