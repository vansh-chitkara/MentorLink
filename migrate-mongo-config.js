const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  mongodb: {
    url: process.env.MONGODB_URI || "mongodb://localhost:27017/mentorlink",
    databaseName: undefined,
    options: {},
  },
  migrationsDir: "migrations",
  changelogCollectionName: "changelog",
  migrationFileExtension: ".js",
  useFileHash: false,
  moduleSystem: "commonjs",
};
