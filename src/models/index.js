const User = require("./User");
const AuditLog = require("./AuditLog");
const Wallet = require("./Wallet");

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
        foreignKey:"userId"
    }
);


module.exports = {
    User,
    AuditLog,
    Wallet
};

