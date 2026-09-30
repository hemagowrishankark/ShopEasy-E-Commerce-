require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const db = require("./src/db");
const { verifyToken } = require("./src/Middleware/authMiddleware");
const userRouter = require("./src/Routes/userRouter");

const multer = require("multer");
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, path.join(__dirname, "src/assets")),
        filename: (req, file, cb) => {
            const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
            cb(null, unique + "-" + file.originalname.replace(/\s+/g, "-"));
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
    fileFilter: (req, file, cb) => {
        if (/image\/(jpeg|jpg|png|gif|webp)/.test(file.mimetype)) cb(null, true);
        else cb(new Error("Only image files (jpeg, png, gif, webp) are allowed"));
    }
});

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

// File upload endpoint (admin only – up to 5 images)
app.post("/api/upload", verifyToken, upload.array("images", 5), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
    }
    const filenames = req.files.map((f) => f.filename);
    res.status(200).json({ filenames, message: "Uploaded successfully" });
});

app.use((err, req, res, next) => {
    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ message: "File too large. Max 5MB per image." });
    }
    if (err.message && err.message.includes("Only image files")) {
        return res.status(415).json({ message: err.message });
    }
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
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