const User = require("./User");
const AuditLog = require("./AuditLog");
const Wallet = require("./Wallet");
const Transaction= require("./Transaction")
User.hasMany(
    AuditLog,
    {
        foreignKey:"userId"
    }
);


AuditLog.belongsTo(
    User,
    {
        foreignKey:"userId"
    }
);


User.hasOne(
    Wallet,
    {
        foreignKey:"userId",
        as:"wallet"
    }
);



Wallet.belongsTo(
    User,
    {
        foreignKey:"userId",
        as:"user"
    }
);

Wallet.hasMany(Transaction,{
    foreignKey:"senderWalletId",
    as:"sentTransactions"
});


Wallet.hasMany(Transaction,{
    foreignKey:"receiverWalletId",
    as:"receivedTransactions"
});


Transaction.belongsTo(Wallet,{
    foreignKey:"senderWalletId",
    as:"senderWallet"
});


Transaction.belongsTo(Wallet,{
    foreignKey:"receiverWalletId",
    as:"receiverWallet"
});



module.exports = {
    User,
    AuditLog,
    Wallet,
    Transaction
};


