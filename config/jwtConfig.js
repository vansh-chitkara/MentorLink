const jwt = require("jsonwebtoken");

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is required. Set it in your .env file.");
    }
    return secret;
};

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, getJwtSecret(), {
        expiresIn: process.env.JWT_EXPIRE || "7d"
    });
};

const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, getJwtSecret());
        return decoded;
    } catch (error) {
        return null;
    }
};

const decodeToken = (token) => {
    return jwt.decode(token);
};

module.exports = {
    generateToken,
    verifyToken,
    decodeToken
};
