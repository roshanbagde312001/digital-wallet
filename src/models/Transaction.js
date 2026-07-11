const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");


const Transaction = sequelize.define(
    "Transaction",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        senderWalletId: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        receiverWalletId: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        transactionType: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        senderAmount: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: true
        },
        senderCurrency: {
            type: DataTypes.STRING(10),
            allowNull: true
        },
        receiverAmount: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: true
        },
        receiverCurrency: {
            type: DataTypes.STRING(10),
            allowNull: true
        },
        exchangeRate: {
            type: DataTypes.DECIMAL(18, 6),
            allowNull: true
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        description: {
            type: DataTypes.STRING(255),
            allowNull: true
        }

    },
    {
        tableName: "transactions",
        timestamps: true
    });


module.exports = Transaction;