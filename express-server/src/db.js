const mysql = require("mysql2/promise");

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "Shankar@2812",
    database: "shopeasy",
    port: 3306
});

module.exports = db;
