const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");


const Wallet = sequelize.define(
    "Wallet",
    {

        id:{
            type:DataTypes.INTEGER,
            autoIncrement:true,
            primaryKey:true
        },

        userId:{
            type:DataTypes.INTEGER,
            allowNull:false,
            unique:true
        },

        balance:{
            type:DataTypes.DECIMAL(15,2),
            allowNull:false,
            defaultValue:0.00
        },

        currency:{
            type:DataTypes.STRING(10),
            allowNull:false,
            defaultValue:"USD"
        },

        status:{
            type:DataTypes.ENUM(
                "ACTIVE",
                "BLOCKED"
            ),
            defaultValue:"ACTIVE"
        }
    },
    {
        tableName:"wallets",
        timestamps:true
    }
);


module.exports = Wallet;