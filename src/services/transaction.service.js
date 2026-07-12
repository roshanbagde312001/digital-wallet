const {Transaction,Wallet} = require("../models");

exports.getTransactions = async (
    userId,
    filters = {}
) => {
    const wallet =
        await Wallet.findOne({
            where: {
                userId: userId
            }
        });

    if (!wallet) {
        throw new Error(
            "Wallet not found"
        );
    }


    const where = {};
    if (filters.type) {
        where.transactionType =
            filters.type;
    }

    const transactions =
        await Transaction.findAll({
            where,
            include: [
                {
                    model: Wallet,
                    as: "senderWallet",
                    where: {
                        id: wallet.id
                    },
                    required: false
                },
                {
                    model: Wallet,
                    as: "receiverWallet",
                    where: {
                        id: wallet.id
                    },
                    required: false
                }
            ],
            order: [
                [
                    "createdAt",
                    "DESC"
                ]
            ]
        });
    return transactions;

};