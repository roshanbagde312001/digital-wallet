const sequelize = require("../config/database");
const { Wallet, Transaction } = require("../models")
const { createAudit } = require("../utils/audit")
const exchangeService = require("./exchange.service")
exports.creatWallet = async (user, options) => {
    console.log("rosns", user.dataValues.id)
    const wallet = await Wallet.findOne({
        where: {
            userId: user.id
        }
    });

    if (wallet) {
        return wallet;
    }

    const newWallet = await Wallet.create({
        userId: user.id,
        balance: 0.0,
        currency: user.defaultCurrency || "USD"
    }, options)

    return newWallet;
}

exports.getWalletbyUserId = async (userId) => {

    const wallet = await Wallet.findOne({
        where: {
            userId: userId
        }
    });

    if (!wallet) {
        throw new Error("Wallet not found");
    }

    return wallet;
}


exports.deposit = async (userId, amount) => {
    const t = await sequelize.transaction();

    try {
        const wallet = await Wallet.findOne({
            where: {
                userId
            },
            transaction: t,
            lock: 'UPDATE'
        });

        console.log(wallet)


        if (!wallet) {
            throw new Error("Wallet not found");
        }



        if (wallet.status != "ACTIVE") {
            throw new Error("Wallet is not active");
        }
        const oldBalance = Number(wallet.balance);
        const depositAmount = Number(amount)
        const newBalance = oldBalance + depositAmount;

        await Wallet.update({
            balance: newBalance
        }, { where: { id: wallet.id }, transaction: t })


        const tranction = await Transaction.create({
            senderWalletId: null,
            receiverWalletId: wallet.id,
            transactionType: "DEPOSIT",
            senderAmount: null,
            senderCurrency: null,
            receiverAmount: depositAmount,
            receiverCurrency: wallet.currency,
            exchangeRate: 1,
            status: "SUCCESS",
            description: "Wallet deposit"
        }, { transaction: t })
        await t.commit();


        await createAudit(
            {
                userId: userId,
                action: "DEPOSIT",
                entity: "TRANSACTION",
                entityId: tranction.id,
                oldValue: {
                    balance: oldBalance
                },
                newValue: {
                    balance: newBalance,
                    amount: depositAmount,
                    currency: wallet.currency
                }

            });
        wallet.balance = newBalance;
        return {
            wallet,
            tranction
        };
    } catch (error) {
        (await t).rollback();
        throw error;
    }
}


exports.withDraw = async (userId, amount) => {

    const t = await sequelize.transaction();

    try {

        const wallet = await Wallet.findOne({
            where: {
                userId: userId
            },
            transaction: t,
            lock: 'UPDATE'
        })

        if (!wallet) {
            throw new Error("Wallet not found")
        }

        if (wallet.status !== "ACTIVE") {
            throw new Error("Wallet is not active");
        }

        const withdrawmount = Number(amount);
        const oldBalance = Number(wallet.balance);

        if (oldBalance < withdrawmount) {
            throw new Error("Insufficient wallet balance")
        }

        const newBalance = oldBalance - withdrawmount;
        await Wallet.update({
            balance: newBalance
        }, { where: { id: wallet.id }, transaction: t })


        const transaction =
            await Transaction.create({
                senderWalletId: wallet.id,
                receiverWalletId: null,
                transactionType: "WITHDRAW",
                senderAmount: withdrawmount,
                senderCurrency: wallet.currency,
                receiverAmount: null,
                receiverCurrency: null,
                exchangeRate: 1,
                status: "SUCCESS",
                description: "Wallet withdrawal"

            }, {
                transaction: t
            });

        await t.commit();
        await createAudit({
            userId: userId,
            action: "WITHDRAW",
            entity: "TRANSACTION",
            entityId: transaction.id,
            oldValue: {
                balance: oldBalance
            },
            newValue: {
                balance: newBalance,
                amount: withdrawmount,
                currency: wallet.currency
            }
        });

        wallet.balance = newBalance;
        return {
            wallet,
            transaction
        };
    } catch (error) {
        await t.rollback();

        throw error;
    }
}



exports.transfer = async (senderUserId, data) => {

    const t = await sequelize.transaction();
    try {
        const senderWallet =
            await Wallet.findOne({
                where: {
                    userId: senderUserId
                },
                transaction: t,
                lock: "UPDATE"
            });

        if (!senderWallet) {
            throw new Error("Sender wallet not found");
        }

        const receiverWallet = await Wallet.findOne({
            where: {
                userId: data.receiverUserId
            },
            transaction: t,
            lock: "UPDATE"
        });

        if (!receiverWallet) {
            throw new Error("Receiver wallet not found");
        }

        const amount = Number(data.amount);

        const senderBalance = Number(senderWallet.balance);


        if (senderBalance < amount) {
            throw new Error("Insufficient balance");
        }


        const exchangeRate = await exchangeService.getExchangeRate(
            senderWallet.currency,
            receiverWallet.currency
        );


        const receiverAmount = amount * exchangeRate;
        const senderNewBalance = senderBalance - amount;
        const receiverNewBalance = Number(receiverWallet.balance) + receiverAmount;
        await senderWallet.update({ balance: senderNewBalance },
            {
                transaction: t
            });


        await receiverWallet.update({ balance: receiverNewBalance },
            {
                transaction: t
            });

        const transaction =
            await Transaction.create({
                senderWalletId: senderWallet.id,
                receiverWalletId: receiverWallet.id,
                transactionType: "TRANSFER",
                senderAmount: amount,
                senderCurrency: senderWallet.currency,
                receiverAmount: receiverAmount,
                receiverCurrency: receiverWallet.currency,
                exchangeRate,
                status: "SUCCESS",
                description: "Wallet transfer"
            }, {
                transaction: t
            });

        await createAudit({
            userId: senderUserId,
            action: "TRANSFER",
            entity: "TRANSACTION",
            entityId: transaction.id,
            oldValue: {
                balance: senderBalance
            },
            newValue: {
                balance: senderNewBalance
            },
            transaction: t
        });
        await t.commit();
        return {
            transaction,
            senderWallet,
            receiverWallet
        };
    }
    catch (error) {
        await t.rollback();
        throw error;
    }
};
