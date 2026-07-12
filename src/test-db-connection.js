require('dotenv').config();
const sequelize = require('./config/database');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Unable to connect to the database:', err.message || err);
    process.exit(1);
  }
})();
