const transactionService = require("../services/transaction.service");

exports.getHistory = async (req, res) => {
    try {
        const transactions = await transactionService.getTransactions(
            req.user.id,
            req.query
        );


        return res.status(200).json({
            success: true,
            data: transactions
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
