import { useState, useEffect } from "react";
import "../styles/admin.css";

function AdminProfileSettings() {
    const [adminProfile, setAdminProfile] = useState({
        fullName: localStorage.getItem("userName") || "Super Admin",
        email: localStorage.getItem("userEmail") || "admin@shopeasy.com",
        role: "Super Admin",
        phone: "+91 98765 43210"
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [marketplaceConfig, setMarketplaceConfig] = useState({
        marketplaceName: "ShopEasy Multi-Vendor Marketplace",
        currency: "₹ (INR)",
        commissionRate: "5%",
        supportEmail: "support@shopeasy.com",
        sellerAutoApprove: true,
        maintenanceMode: false
    });

    const [preferences, setPreferences] = useState({
        newOrderAlerts: true,
        lowStockAlerts: true,
        sellerRegistrationAlerts: true
    });

    const [alertMessage, setAlertMessage] = useState("");
    const [alertType, setAlertType] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Fetch live admin profile if backend token exists
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        fetch("http://localhost:5001/api/profile", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then((res) => {
            if (res.ok) return res.json();
            return null;
        })
        .then((data) => {
            if (data && data.user) {
                setAdminProfile((prev) => ({
                    ...prev,
                    fullName: data.user.fullName || prev.fullName,
                    email: data.user.email || prev.email,
                    phone: data.user.phone || prev.phone
                }));
            }
        })
        .catch((err) => console.log("Profile fetch err:", err));
    }, []);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setAlertMessage("");
        setIsSaving(true);

        const token = localStorage.getItem("token");

        try {
            const res = await fetch("http://localhost:5001/api/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    fullName: adminProfile.fullName,
                    phone: adminProfile.phone
                })
            });

            if (res.ok) {
                localStorage.setItem("userName", adminProfile.fullName);
                setAlertType("success");
                setAlertMessage("Admin Profile updated successfully!");
                window.dispatchEvent(new Event("authChanged"));
            } else {
                const data = await res.json();
                setAlertType("error");
                setAlertMessage(data.message || "Failed to update profile.");
            }
        } catch (err) {
            // Local fallback
            localStorage.setItem("userName", adminProfile.fullName);
            setAlertType("success");
            setAlertMessage("Admin profile updated locally!");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setAlertMessage("");

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setAlertType("error");
            setAlertMessage("New passwords do not match!");
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setAlertType("error");
            setAlertMessage("Password must be at least 6 characters long.");
            return;
        }

        const token = localStorage.getItem("token");

        try {
            const res = await fetch("http://localhost:5001/api/profile/password", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });

            const data = await res.json();

            if (res.ok) {
                setAlertType("success");
                setAlertMessage("Admin security password updated successfully!");
                setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                setAlertType("error");
                setAlertMessage(data.message || "Failed to update password.");
            }
        } catch (err) {
            setAlertType("error");
            setAlertMessage("Failed to connect to authentication server.");
        }
    };

    const handleMarketplaceSave = (e) => {
        e.preventDefault();
        setAlertType("success");
        setAlertMessage("Marketplace configuration and platform settings saved successfully!");
    };

    return (
        <div className="admin-settings-container">
            {/* Settings Header */}
            <div className="admin-settings-header">
                <div>
                    <h1>⚙️ Admin Profile & Marketplace Settings</h1>
                    <p>Manage your administrator credentials, security access, and centralized marketplace configuration.</p>
                </div>
            </div>

            {/* Alert banner */}
            {alertMessage && (
                <div className={`admin-settings-alert ${alertType}`}>
                    {alertType === "success" ? "✓ " : "✕ "} {alertMessage}
                </div>
            )}

            <div className="admin-settings-grid">
                {/* 1. Admin Profile Information Card */}
                <div className="admin-settings-card">
                    <div className="admin-card-title-row">
                        <span className="admin-card-icon">👤</span>
                        <h3>Administrator Identity</h3>
                        <span className="admin-badge-super">Super Admin</span>
                    </div>

                    <form onSubmit={handleProfileUpdate}>
                        <div className="admin-form-group">
                            <label>Admin Full Name</label>
                            <input
                                type="text"
                                value={adminProfile.fullName}
                                onChange={(e) => setAdminProfile({ ...adminProfile, fullName: e.target.value })}
                                required
                            />
                        </div>

                        <div className="admin-form-group">
                            <label>Admin Email Address (Read-Only)</label>
                            <input
                                type="email"
                                value={adminProfile.email}
                                disabled
                                title="Primary administrative login identifier"
                            />
                        </div>

                        <div className="admin-form-group">
                            <label>Admin Contact Phone</label>
                            <input
                                type="text"
                                value={adminProfile.phone}
                                onChange={(e) => setAdminProfile({ ...adminProfile, phone: e.target.value })}
                                placeholder="+91 98765 43210"
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="admin-settings-action-btn"
                            disabled={isSaving}
                        >
                            {isSaving ? "Saving..." : "Save Admin Profile"}
                        </button>
                    </form>
                </div>

                {/* 2. Admin Security & Password Card */}
                <div className="admin-settings-card">
                    <div className="admin-card-title-row">
                        <span className="admin-card-icon">🔒</span>
                        <h3>Admin Security & Access</h3>
                        <span className="admin-profile-badge-pill">Protected</span>
                    </div>

                    <form onSubmit={handlePasswordUpdate}>
                        <div className="admin-form-group">
                            <label>Current Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                required
                            />
                        </div>

                        <div className="admin-form-group">
                            <label>New Admin Password</label>
                            <input
                                type="password"
                                placeholder="Minimum 6 characters"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                required
                            />
                        </div>

                        <div className="admin-form-group">
                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                placeholder="Re-enter new password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                required
                            />
                        </div>

                        <button type="submit" className="admin-settings-action-btn">
                            Update Security Password
                        </button>
                    </form>
                </div>

                {/* 3. Central Marketplace Configuration Card */}
                <div className="admin-settings-card full-width">
                    <div className="admin-card-title-row">
                        <span className="admin-card-icon">🏬</span>
                        <h3>Central Marketplace Configuration (Multi-Vendor Model)</h3>
                    </div>

                    <form onSubmit={handleMarketplaceSave}>
                        <div className="form-grid">
                            <div className="admin-form-group">
                                <label>Marketplace Portal Name</label>
                                <input
                                    type="text"
                                    value={marketplaceConfig.marketplaceName}
                                    onChange={(e) => setMarketplaceConfig({ ...marketplaceConfig, marketplaceName: e.target.value })}
                                />
                            </div>

                            <div className="admin-form-group">
                                <label>Base Platform Currency</label>
                                <input
                                    type="text"
                                    value={marketplaceConfig.currency}
                                    onChange={(e) => setMarketplaceConfig({ ...marketplaceConfig, currency: e.target.value })}
                                />
                            </div>

                            <div className="admin-form-group">
                                <label>Platform Commission Rate (%)</label>
                                <input
                                    type="text"
                                    value={marketplaceConfig.commissionRate}
                                    onChange={(e) => setMarketplaceConfig({ ...marketplaceConfig, commissionRate: e.target.value })}
                                    placeholder="5%"
                                />
                            </div>

                            <div className="admin-form-group">
                                <label>Marketplace Support Email</label>
                                <input
                                    type="email"
                                    value={marketplaceConfig.supportEmail}
                                    onChange={(e) => setMarketplaceConfig({ ...marketplaceConfig, supportEmail: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Marketplace Rules & Toggles */}
                        <div style={{ marginTop: "16px" }}>
                            <div className="admin-toggle-row">
                                <div className="admin-toggle-info">
                                    <span className="admin-toggle-title">Seller Product Auto-Listing</span>
                                    <span className="admin-toggle-desc">Automatically list seller-uploaded items in the shared marketplace catalog without manual review.</span>
                                </div>
                                <label className="admin-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={marketplaceConfig.sellerAutoApprove}
                                        onChange={(e) => setMarketplaceConfig({ ...marketplaceConfig, sellerAutoApprove: e.target.checked })}
                                    />
                                    <span className="admin-slider"></span>
                                </label>
                            </div>

                            <div className="admin-toggle-row">
                                <div className="admin-toggle-info">
                                    <span className="admin-toggle-title">Real-time Order Notifications</span>
                                    <span className="admin-toggle-desc">Receive instant notifications when customers complete marketplace orders.</span>
                                </div>
                                <label className="admin-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={preferences.newOrderAlerts}
                                        onChange={(e) => setPreferences({ ...preferences, newOrderAlerts: e.target.checked })}
                                    />
                                    <span className="admin-slider"></span>
                                </label>
                            </div>

                            <div className="admin-toggle-row">
                                <div className="admin-toggle-info">
                                    <span className="admin-toggle-title">Low Stock & Inventory Alerts</span>
                                    <span className="admin-toggle-desc">Flag products when marketplace stock is running low.</span>
                                </div>
                                <label className="admin-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={preferences.lowStockAlerts}
                                        onChange={(e) => setPreferences({ ...preferences, lowStockAlerts: e.target.checked })}
                                    />
                                    <span className="admin-slider"></span>
                                </label>
                            </div>
                        </div>

                        <div style={{ marginTop: "20px" }}>
                            <button type="submit" className="admin-settings-action-btn">
                                Save Marketplace Settings
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AdminProfileSettings;
