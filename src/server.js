require("dotenv").config();
const app = require("./app");
const sequelize = require("./config/database");

const PORT = process.env.PORT || 9000;

app.listen(PORT, async() => {
    console.log(`Server running on port ${PORT}`);
    try{
        await sequelize.authenticate();
        console.log("Database conected")
        await sequelize.sync({ alter: true });
    }
     catch(error){

        console.log("Database connection failed");
        console.log(error.message);

    }
});