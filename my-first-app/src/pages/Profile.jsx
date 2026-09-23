import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Settings.css";

function Profile() {
    const navigate = useNavigate();

// User data state
    const [profile, setProfile] = useState({
        fullName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        pincode: ""
    });

    const [activeTab, setActiveTab] = useState("profile");
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [alertType, setAlertType] = useState("");

// Password change state

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

// Preferences state
    const [preferences, setPreferences] = useState({
        orderUpdates: true,
        promotions: false,
        smsAlerts: true
    });

// Fetch user profile on load
    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        fetch("http://localhost:5001/api/profile", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then((response) => {
            if (response.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("userEmail");
                localStorage.removeItem("userName");
                window.dispatchEvent(new Event("authChanged"));
                navigate("/login");
                throw new Error("Session expired. Please login again.");
            }
            if (!response.ok) {
                throw new Error("Failed to fetch profile");
            }
            return response.json();
        })
        .then((data) => {
            if (data.user) {
                setProfile({
                    fullName: data.user.fullName || "",
                    email: data.user.email || "",
                    phone: data.user.phone || "",
                    address: data.user.address || "",
                    city: data.user.city || "",
                    pincode: data.user.pincode || ""
                });
            }
            setLoading(false);
        })
        .catch((error) => {
            console.log(error);
            setLoading(false);
        });
    }, [navigate]);

// Handle profile field change
    const handleProfileChange = (field, value) => {
        setProfile((prev) => ({ ...prev, [field]: value }));
    };

// Handle password field change
    const handlePasswordChange = (field, value) => {
        setPasswordData((prev) => ({ ...prev, [field]: value }));
    };

// Save profile updates
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setAlertMessage("");
        setIsSaving(true);

        const token = localStorage.getItem("token");

        try {
            const response = await fetch("http://localhost:5001/api/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(profile)
            });

            const data = await response.json();

            if (!response.ok) {
                setAlertMessage(data.message || "Failed to update profile");
                setAlertType("error");
                setIsSaving(false);
                return;
            }

            setAlertMessage(data.message || "Profile updated successfully!");
            setAlertType("success");
            setIsSaving(false);

// Hide alert after 3 seconds
            setTimeout(() => setAlertMessage(""), 3500);

        } catch (error) {
            console.log(error);
            setAlertMessage("Unable to connect to server");
            setAlertType("error");
            setIsSaving(false);
        }
    };

// Save password change
    const handleSavePassword = async (e) => {
        e.preventDefault();
        setAlertMessage("");

        if (passwordData.newPassword.length < 6) {
            setAlertMessage("New password must be at least 6 characters");
            setAlertType("error");
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setAlertMessage("New passwords do not match");
            setAlertType("error");
            return;
        }

        setIsSaving(true);
        const token = localStorage.getItem("token");

        try {
            const response = await fetch("http://localhost:5001/api/profile/password", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(passwordData)
            });

            const data = await response.json();

            if (!response.ok) {
                setAlertMessage(data.message || "Failed to change password");
                setAlertType("error");
                setIsSaving(false);
                return;
            }

            setAlertMessage("Password changed successfully!");
            setAlertType("success");
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setIsSaving(false);

            setTimeout(() => setAlertMessage(""), 3500);

        } catch (error) {
            console.log(error);
            setAlertMessage("Unable to connect to server");
            setAlertType("error");
            setIsSaving(false);
        }
    };

// Handle user logout
    const handleLogout = () => {
        const confirmLogout = window.confirm("Are you sure you want to Sign out of ShopEasy?");
        if (!confirmLogout) return;

        localStorage.removeItem("token");
        window.dispatchEvent(new Event("authChanged"));
        window.dispatchEvent(new Event("cartUpdated"));
        navigate("/login");
    };

// Get user initials for avatar
    const getInitials = (name) => {
        if (!name) return "U";
        const parts = name.trim().split(" ");
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    if (loading) {
        return (
            <div className="settings-page" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                <p style={{ fontSize: "18px", color: "#64748b" }}>Loading settings...</p>
            </div>
        );
    }

    return (
        <main className="settings-page">
            <div className="settings-container">

{/* Header Profile Summary */}
                <div className="settings-header">
                    <div className="header-user-info">
                        <div className="user-avatar-circle">
                            {getInitials(profile.fullName)}
                        </div>
                        <div>
                            <h2>{profile.fullName || "User Account"}</h2>
                            <p>{profile.email}</p>
                        </div>
                    </div>

                    <button 
                        type="button" 
                        className="header-logout-btn"
                        onClick={handleLogout}
                    >
                        🚪 Logout
                    </button>
                </div>

                {/* Main Settings Body */}
                <div className="settings-layout">

                    {/* Sidebar Navigation */}
                    <aside className="settings-sidebar">
                        <button 
                            className={`sidebar-tab ${activeTab === "profile" ? "active" : ""}`}
                            onClick={() => { setActiveTab("profile"); setAlertMessage(""); }}
                        >
                            <span className="tab-icon">👤</span> Personal Info
                        </button>

                        <button 
                            className={`sidebar-tab ${activeTab === "address" ? "active" : ""}`}
                            onClick={() => { setActiveTab("address"); setAlertMessage(""); }}
                        >
                            <span className="tab-icon">📍</span> Delivery Address
                        </button>

                        <button 
                            className={`sidebar-tab ${activeTab === "security" ? "active" : ""}`}
                            onClick={() => { setActiveTab("security"); setAlertMessage(""); }}
                        >
                            <span className="tab-icon">🔒</span> Security & Password
                        </button>

                        <button 
                            className={`sidebar-tab ${activeTab === "preferences" ? "active" : ""}`}
                            onClick={() => { setActiveTab("preferences"); setAlertMessage(""); }}
                        >
                            <span className="tab-icon">🔔</span> Notification Settings
                        </button>

                        <button 
                            className="sidebar-tab logout-tab"
                            onClick={handleLogout}
                        >
                            <span className="tab-icon">🚪</span> Log Out
                        </button>
                    </aside>

                    {/* Content Panel */}
                    <section className="settings-content-card">

                        {/* Status Feedback Alert */}
                        {alertMessage && (
                            <div className={`settings-alert ${alertType}`}>
                                {alertType === "success" ? "✅" : "⚠️"} {alertMessage}
                            </div>
                        )}

                        {/* TAB 1: Personal Info */}
                        {activeTab === "profile" && (
                            <div>
                                <div className="content-header">
                                    <h3>Personal Information</h3>
                                    <p>Manage your name, contact details, and account email.</p>
                                </div>

                                <form className="settings-form" onSubmit={handleSaveProfile}>
                                    <div className="settings-group">
                                        <label>Full Name</label>
                                        <input 
                                            type="text" 
                                            value={profile.fullName} 
                                            onChange={(e) => handleProfileChange("fullName", e.target.value)}
                                            placeholder="Enter your full name"
                                            required
                                        />
                                    </div>

                                    <div className="form-grid-2">
                                        <div className="settings-group">
                                            <label>Email Address</label>
                                            <input 
                                                type="email" 
                                                value={profile.email} 
                                                disabled 
                                            />
                                            <span className="input-hint">Email address cannot be modified</span>
                                        </div>

                                        <div className="settings-group">
                                            <label>Phone Number</label>
                                            <input 
                                                type="tel" 
                                                value={profile.phone} 
                                                onChange={(e) => handleProfileChange("phone", e.target.value)}
                                                placeholder="+91 98765 43210"
                                            />
                                        </div>
                                    </div>

                                    <button 
                                        type="submit" 
                                        className="save-btn"
                                        disabled={isSaving}
                                    >
                                        {isSaving ? "Saving..." : "Save Changes"}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* TAB 2: Delivery Address */}
                        {activeTab === "address" && (
                            <div>
                                <div className="content-header">
                                    <h3>Shipping & Delivery Address</h3>
                                    <p>Default address for your orders and doorstep delivery.</p>
                                </div>

                                <form className="settings-form" onSubmit={handleSaveProfile}>
                                    <div className="settings-group">
                                        <label>Street Address / Flat No.</label>
                                        <textarea 
                                            rows="3"
                                            value={profile.address} 
                                            onChange={(e) => handleProfileChange("address", e.target.value)}
                                            placeholder="House / Flat no, Street name, Landmark"
                                        />
                                    </div>

                                    <div className="form-grid-2">
                                        <div className="settings-group">
                                            <label>City</label>
                                            <input 
                                                type="text" 
                                                value={profile.city} 
                                                onChange={(e) => handleProfileChange("city", e.target.value)}
                                                placeholder="e.g. Bangalore"
                                            />
                                        </div>

                                        <div className="settings-group">
                                            <label>Pincode / Postal Code</label>
                                            <input 
                                                type="text" 
                                                value={profile.pincode} 
                                                onChange={(e) => handleProfileChange("pincode", e.target.value)}
                                                placeholder="e.g. 560100"
                                            />
                                        </div>
                                    </div>

                                    <button 
                                        type="submit" 
                                        className="save-btn"
                                        disabled={isSaving}
                                    >
                                        {isSaving ? "Saving..." : "Save Address"}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* TAB 3: Security & Password */}
                        {activeTab === "security" && (
                            <div>
                                <div className="content-header">
                                    <h3>Password & Account Security</h3>
                                    <p>Update your password to keep your ShopEasy account secure.</p>
                                </div>

                                <form className="settings-form" onSubmit={handleSavePassword}>
                                    <div className="settings-group">
                                        <label>Current Password</label>
                                        <input 
                                            type="password" 
                                            value={passwordData.currentPassword}
                                            onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                                            placeholder="Enter current password"
                                            required
                                        />
                                    </div>

                                    <div className="form-grid-2">
                                        <div className="settings-group">
                                            <label>New Password</label>
                                            <input 
                                                type="password" 
                                                value={passwordData.newPassword}
                                                onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                                                placeholder="At least 6 characters"
                                                required
                                            />
                                        </div>

                                        <div className="settings-group">
                                            <label>Confirm New Password</label>
                                            <input 
                                                type="password" 
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                                                placeholder="Re-type new password"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button 
                                        type="submit" 
                                        className="save-btn"
                                        disabled={isSaving}
                                    >
                                        {isSaving ? "Updating..." : "Update Password"}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* TAB 4: Preferences */}
                        {activeTab === "preferences" && (
                            <div>
                                <div className="content-header">
                                    <h3>Notification Preferences</h3>
                                    <p>Customize how and when you receive order notifications from ShopEasy.</p>
                                </div>

                                <div className="settings-form">
                                    <div className="pref-item">
                                        <div className="pref-info">
                                            <h4>Order Status Updates</h4>
                                            <p>Receive email updates when your order is packed and dispatched.</p>
                                        </div>
                                        <label className="switch">
                                            <input 
                                                type="checkbox" 
                                                checked={preferences.orderUpdates}
                                                onChange={(e) => setPreferences(p => ({ ...p, orderUpdates: e.target.checked }))}
                                            />
                                            <span className="slider"></span>
                                        </label>
                                    </div>

                                    <div className="pref-item">
                                        <div className="pref-info">
                                            <h4>SMS Delivery Alerts</h4>
                                            <p>Receive SMS alerts when your package is out for delivery.</p>
                                        </div>
                                        <label className="switch">
                                            <input 
                                                type="checkbox" 
                                                checked={preferences.smsAlerts}
                                                onChange={(e) => setPreferences(p => ({ ...p, smsAlerts: e.target.checked }))}
                                            />
                                            <span className="slider"></span>
                                        </label>
                                    </div>

                                    <div className="pref-item">
                                        <div className="pref-info">
                                            <h4>Exclusive Offers & Promotions</h4>
                                            <p>Get notified about upcoming festival sales and discount coupons.</p>
                                        </div>
                                        <label className="switch">
                                            <input 
                                                type="checkbox" 
                                                checked={preferences.promotions}
                                                onChange={(e) => setPreferences(p => ({ ...p, promotions: e.target.checked }))}
                                            />
                                            <span className="slider"></span>
                                        </label>
                                    </div>

                                    <button 
                                        type="button" 
                                        className="save-btn"
                                        onClick={() => {
                                            setAlertMessage("Preferences saved successfully!");
                                            setAlertType("success");
                                            setTimeout(() => setAlertMessage(""), 3000);
                                        }}
                                    >
                                        Save Preferences
                                    </button>
                                </div>
                            </div>
                        )}

                    </section>
                </div>
            </div>
        </main>
    );
}

export default Profile;