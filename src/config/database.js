const { Sequelize } = require("sequelize");

const useSsl = process.env.DB_SSL === "true";

const sequelize = new Sequelize(

    process.env.DB_NAME,

    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {

        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect:"mysql",

        logging:false,
        dialectOptions: useSsl
            ? {
                ssl: {
                    require: true,
                    rejectUnauthorized: false
                }
            }
            : undefined
    }
);


module.exports = sequelize;
