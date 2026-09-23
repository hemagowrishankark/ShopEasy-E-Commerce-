const db = require("../db");
const bcrypt = require("bcrypt");

// get profile
const getProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const [users] = await db.query(
            `SELECT id, fullName, email,
                    COALESCE(phone, '') AS phone,
                    COALESCE(address, '') AS address,
                    COALESCE(city, '') AS city,
                    COALESCE(pincode, '') AS pincode
             FROM users 
             WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            user: users[0]
        });

    } catch (error) {
       
// fallback user
        try {
            const userId = req.user.id;
            const [fallbackUsers] = await db.query(
                `SELECT id, fullName, email FROM users WHERE id = ?`,
                [userId]
            );
            if (fallbackUsers.length > 0) {
                return res.status(200).json({ user: fallbackUsers[0] });
            }
        } catch (fbErr) {
            console.log(fbErr);
        }

        console.log(error);
        res.status(500).json({
            message: "Failed to fetch profile",
            error: error.message
        });
    }
};

// user profile update
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { fullName, phone, address, city, pincode } = req.body;

        if (!fullName || fullName.trim().length < 3) {
            return res.status(400).json({
                message: "Full name must be at least 3 characters"
            });
        }

// update profile on extra details
        try {
            await db.query(
                `UPDATE users 
                 SET fullName = ?, phone = ?, address = ?, city = ?, pincode = ? 
                 WHERE id = ?`,
                [fullName.trim(), phone || "", address || "", city || "", pincode || "", userId]
            );
        } catch (dbErr) {
//  update fullName
            await db.query(
                `UPDATE users SET fullName = ? WHERE id = ?`,
                [fullName.trim(), userId]
            );
        }

        res.status(200).json({
            message: "Profile updated successfully",
            user: { id: userId, fullName: fullName.trim(), phone, address, city, pincode }
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Failed to update profile",
            error: error.message
        });
    }
};

// password change
const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "Current password and new password are required"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: "New password must be at least 6 characters"
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: "New passwords do not match"
            });
        }

        const [users] = await db.query(
            "SELECT password FROM users WHERE id = ?",
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(currentPassword, users[0].password);
        if (!isMatch) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query(
            "UPDATE users SET password = ? WHERE id = ?",
            [hashedPassword, userId]
        );

        res.status(200).json({
            message: "Password changed successfully"
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Failed to change password",
            error: error.message
        });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword
};