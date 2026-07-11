const User = require("./User");
const AuditLog = require("./AuditLog");


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



module.exports = {
    User,
    AuditLog
};