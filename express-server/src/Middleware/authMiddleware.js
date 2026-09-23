const jwt = require("jsonwebtoken");

const ADMIN_EMAILS = ["shopeasy@gmail.com", "admin@gmail.com"];

const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || req.headers.Authorization || req.header("Authorization");

        if (!authHeader) {
            return res.status(401).json({
                message: "Please login first"
            });
        }

        let token = authHeader.toString().trim();
        if (token.toLowerCase().startsWith("bearer ")) {
            token = token.slice(7).trim();
        }

        // Remove accidental surrounding quotes
        token = token.replace(/^["']|["']$/g, "").trim();

        if (!token) {
            return res.status(401).json({
                message: "Token not found. Please login first."
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token. Please login again."
        });
    }
};

const verifyAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            message: "Please login first"
        });
    }

    const email = req.user.email?.toLowerCase();
    const role = req.user.role?.toLowerCase();


    if (
         ADMIN_EMAILS.includes(email) ||
         role === "admin" || 
         role === "superadmin") {
        return next();
    }

    return res.status(403).json({
        message: "Access Denied: Admin privileges required."
    });
};

module.exports = {
    verifyToken,
    verifyAdmin
};