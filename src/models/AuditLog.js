const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");


const AuditLog = sequelize.define(
    "AuditLog",
    {

        id:{
            type:DataTypes.INTEGER,
            autoIncrement:true,
            primaryKey:true
        },

        userId:{
            type:DataTypes.INTEGER,
            allowNull:true
        },

        action:{
            type:DataTypes.STRING,
            allowNull:false
        },

        entity:{
            type:DataTypes.STRING,
            allowNull:false
        },

        entityId:{
            type:DataTypes.INTEGER,
            allowNull:true
        },

        oldValue:{
            type:DataTypes.JSON,
            allowNull:true
        },

        newValue:{
            type:DataTypes.JSON,
            allowNull:true
        },

        ipAddress:{
            type:DataTypes.STRING,
            allowNull:true
        }

    },
    {
        tableName:"audit_logs",
        timestamps:true
    }
);


module.exports = AuditLog;