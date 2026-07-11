const walletService = require("../services/wallet.service");
const { validateDeposit } = require("../validations/wallet.validation");


exports.getWallet = async (req, res) => {

    try {
        const wallet = await walletService.getWalletbyUserId(req.user.id);

        return res.status(200).json({
            success: true,
            data: {
                id: wallet.id,
                balance: wallet.balance,
                currency: wallet.currency,
                status: wallet.status
            }
        })
    } catch (error) {
        return res.status(404).json({
            success: false,
            message: error
        })
    };
}


exports.deposit = async (req, res) => {
    try {
        validateDeposit(req.body);

        const result = await walletService.deposit(
            req.user.id,
            req.body.amount
        );



        return res.status(200).json({
            success: true,
            message: "Funds added successfully",
            data: result
        });
    } catch (error) {
            return res.status(400).json({
            success:false,
            message:error.message
        });
    }
}