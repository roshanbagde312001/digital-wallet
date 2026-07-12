const { Op } = require("sequelize");
const { Transaction, Wallet, User } = require("../models");

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


    const where = {
        [Op.or]: [
            { senderWalletId: wallet.id },
            { receiverWalletId: wallet.id }
        ]
    };
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
                    attributes: ["id", "userId", "currency"],
                    include: [{
                        model: User,
                        as: "user",
                        attributes: ["id", "name", "email"]
                    }]
                },
                {
                    model: Wallet,
                    as: "receiverWallet",
                    attributes: ["id", "userId", "currency"],
                    include: [{
                        model: User,
                        as: "user",
                        attributes: ["id", "name", "email"]
                    }]
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
