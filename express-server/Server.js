require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const db = require("./src/db");
const { verifyToken } = require("./src/Middleware/authMiddleware");
const userRouter = require("./src/Routes/userRouter");

const app = express();

const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.use("/assets", express.static(path.join(__dirname, "src/assets")));


const isPublicRequest = (req) => {
    const p = req.path;
    const m = req.method;


    if (p.startsWith("/assets") ||
        p === "/" ||
        p === "/api/test-db") {
        return true;
    }

    if (
        p === "/api/login" || 
        p === "/api/register" || 
        p === "/api/loginUser" || 
        p === "/api/registerUser"
    ) {
        return true;
    }

    if (m === "GET") {
        if (
            p === "/api/allproducts" ||
            p === "/api/newarrivals" ||
            p === "/api/categories" ||
            p === "/api/category-count" ||
            p.startsWith("/api/product")
        ) {
            return true;
        }
    }

    return false;
};

// Authentication Middleware
app.use((req, res, next) => {
    if (isPublicRequest(req)) {
        return next();
    }

    verifyToken(req, res, next);
});

// Main API Router
app.use("/api", userRouter);

app.get("/", (req, res) => {
    res.send("Express Server is Running");
});

app.get("/api/test-db", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT 1 AS result");
        res.json({
            message: "MySQL connected successfully",
            data: rows
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "MySQL connection failed",
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});