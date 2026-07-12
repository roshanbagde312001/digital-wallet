require('dotenv').config();
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
    throw new Error('JWT_SECRET is not set in environment; set JWT_SECRET in .env');
}

const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email
        },
        SECRET,
        {
            expiresIn: "1d"
        }
    );

};

module.exports = { generateToken };