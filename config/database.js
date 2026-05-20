const mongoose = require("mongoose");
const logger = require("./logger");

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is required. Set it in your .env file.");
        }

        logger.info("database.connecting");
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        logger.info({ host: conn.connection.host, name: conn.connection.name }, "database.connected");
        return conn;
    } catch (error) {
        logger.error({ message: error.message }, "database.connection_failed");
        process.exit(1);
    }
};

module.exports = connectDB;
