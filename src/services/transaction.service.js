const { Op } = require("sequelize");
const { Transaction, Wallet, User } = require("../models");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const parsePositiveInteger = (value, fallback, fieldName) => {
    if (value === undefined) {
        return fallback;
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
        throw new Error(`${fieldName} must be a positive integer`);
    }

    return parsed;
};

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

    const page = parsePositiveInteger(filters.page, DEFAULT_PAGE, "page");
    const requestedLimit = parsePositiveInteger(
        filters.limit,
        DEFAULT_LIMIT,
        "limit"
    );
    const limit = Math.min(requestedLimit, MAX_LIMIT);
    const offset = (page - 1) * limit;

    const { count, rows } =
        await Transaction.findAndCountAll({
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
            ],
            limit,
            offset,
            distinct: true
        });
    const totalPages = Math.ceil(count / limit);

    return {
        transactions: rows,
        pagination: {
            page,
            limit,
            totalItems: count,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
        }
    };

};
