import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

function AdminSidebar({
    collapsed,
    setCollapsed,
    mobileOpen,
    setMobileOpen,
    totalProductsCount = 0,
    allProductsCount = 0,
    newArrivalsCount = 0,
    categoriesCount = 0,
    ordersCount = 0,
    customersCount = 0,
    activeTab = "categories",
    onTabSelect,
    onQuickAddProduct
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const [productsMenuOpen, setProductsMenuOpen] = useState(true);

    const userEmail = localStorage.getItem("userEmail") || "admin@shopeasy.com";
    const userName = localStorage.getItem("userName") || userEmail.split("@")[0] || "Admin";

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userName");
        window.dispatchEvent(new Event("authChanged"));
        navigate("/login");
    };

    const isDashboardPage = location.pathname === "/admin" || location.pathname === "/admin/dashboard";
    const isSettingsPage = location.pathname === "/admin/settings" || location.pathname === "/admin/profile";

    const handleItemClick = (tabName) => {
        if (setMobileOpen) setMobileOpen(false);
        if (onTabSelect && tabName) {
            onTabSelect(tabName);
        }
    };

    return (
        <aside className={`admin-sidebar shopeasy-sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
            {/* Top Store Header */}
            <div className="shopeasy-store-header">
                {!collapsed && (
                    <div className="shopeasy-store-card">
                        <div className="store-avatar">🛒</div>
                        <div className="store-details">
                            <div className="store-title-row">
                                <span className="store-name">ShopEasy</span>
                                <span className="store-status-dot" title="Central Marketplace Online"></span>
                            </div>
                            <span className="store-plan">Marketplace Hub</span>
                        </div>
                    </div>
                )}
                
                <div className="header-button-group">
                    {/* Desktop Collapse Button */}
                    <button 
                        type="button"
                        className="sidebar-collapse-toggle-btn"
                        onClick={() => setCollapsed(!collapsed)}
                        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {collapsed ? "▶" : "◀"}
                    </button>

                    {/* Mobile/Tablet Close Button */}
                    <button 
                        type="button"
                        className="mobile-sidebar-close-btn"
                        onClick={() => setMobileOpen && setMobileOpen(false)}
                        title="Close sidebar menu"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Quick action: View Live Storefront */}
            {!collapsed && (
                <div className="shopeasy-quick-actions">
                    <Link to="/" target="_blank" rel="noopener noreferrer" className="shopeasy-view-store-link">
                        <span>🌐 View Live Marketplace</span>
                        <span className="store-open-icon">↗</span>
                    </Link>
                </div>
            )}

            {/* Navigation Menu */}
            <nav className="shopeasy-nav">
                <div className="shopeasy-nav-group">
                    {/* Dashboard */}
                    <NavLink 
                        to="/admin" 
                        end
                        className={({ isActive }) => `shopeasy-nav-item ${isActive && isDashboardPage && activeTab !== "orders" && activeTab !== "customers" ? "active" : ""}`}
                        onClick={() => {
                            handleItemClick("allproducts");
                        }}
                        title="Dashboard"
                    >
                        <div className="nav-item-left">
                            <span className="nav-icon">📊</span>
                            {!collapsed && <span className="nav-label">Dashboard</span>}
                        </div>
                    </NavLink>

                    {/* Orders */}
                    <button 
                        type="button"
                        className={`shopeasy-nav-item ${activeTab === "orders" ? "active" : ""}`}
                        onClick={() => {
                            if (!isDashboardPage) {
                                navigate("/admin");
                            }
                            handleItemClick("orders");
                        }}
                        title="Customer Orders Management"
                    >
                        <div className="nav-item-left">
                            <span className="nav-icon">📋</span>
                            {!collapsed && (
                                <span className="nav-label">Orders</span>
                            )}
                        </div>
                        {!collapsed && (
                            <span className="nav-badge-pill"> 
                                {ordersCount} 
                            </span>
                        )}
                    </button>

                    {/* Customers Directory & Orders */}
                    <button 
                        type="button"
                        className={`shopeasy-nav-item ${activeTab === "customers" ? "active" : ""}`}
                        onClick={() => {
                            if (!isDashboardPage) {
                                navigate("/admin");
                            }
                            handleItemClick("customers");
                        }}
                        title="Customer Directory & Order Histories"
                    >
                        <div className="nav-item-left">
                            <span className="nav-icon">👥</span>
                            {!collapsed && <span className="nav-label">Customers</span>}
                        </div>
                        {!collapsed && (
                            <span className="nav-badge-pill customers"> 
                                {customersCount} 
                            </span>
                        )}
                    </button>

                    {/* Products / Catalog Accordion */}
                    <div className={`shopeasy-accordion-item ${productsMenuOpen ? "open" : ""}`}>
                        <button 
                            type="button"
                            className="shopeasy-nav-item shopeasy-nav-parent"
                            onClick={() => {
                                if (collapsed) setCollapsed(false);
                                setProductsMenuOpen(!productsMenuOpen);
                            }}
                            title="Catalog & Inventory"
                        >
                            <div className="nav-item-left">
                                <span className="nav-icon">📦</span>
                                {!collapsed && <span className="nav-label">Products</span>}
                            </div>
                            {!collapsed && (
                                <div className="nav-item-right">
                                    <span className="nav-badge-count">{totalProductsCount}</span>
                                    <span className={`accordion-caret ${productsMenuOpen ? "rotated" : ""}`}>▾</span>
                                </div>
                            )}
                        </button>

                        {/* Submenu Tree */}
                        {(!collapsed && productsMenuOpen) && (
                            <div className="shopeasy-submenu">
                                <button 
                                    type="button"
                                    className="shopeasy-submenu-item"
                                    onClick={() => {
                                        if (!isDashboardPage) navigate("/admin");
                                        handleItemClick("allproducts");
                                    }}
                                >
                                    <span className="submenu-bullet">•</span>
                                    <span className="submenu-label">All Products</span>
                                    <span className="submenu-count">{allProductsCount}</span>
                                </button>

                                <button 
                                    type="button"
                                    className="shopeasy-submenu-item"
                                    onClick={() => {
                                        if (!isDashboardPage) navigate("/admin");
                                        handleItemClick("newarrivals");
                                    }}
                                >
                                    <span className="submenu-bullet">•</span>
                                    <span className="submenu-label">New Arrivals</span>
                                    <span className="submenu-count">{newArrivalsCount}</span>
                                </button>

                                <button 
                                    type="button"
                                    className="shopeasy-submenu-item"
                                    onClick={() => {
                                        if (!isDashboardPage) navigate("/admin");
                                        handleItemClick("categories");
                                    }}
                                >
                                    <span className="submenu-bullet">•</span>
                                    <span className="submenu-label">Categories</span>
                                    <span className="submenu-count">{categoriesCount}</span>
                                </button>

                                <button 
                                    type="button"
                                    className="shopeasy-submenu-action"
                                    onClick={() => {
                                        if (!isDashboardPage) navigate("/admin");
                                        if (setMobileOpen) setMobileOpen(false);
                                        onQuickAddProduct && onQuickAddProduct();
                                    }}
                                >
                                    <span className="action-icon">➕</span>
                                    <span>Add Product</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Analytics */}
                    <a 
                        href="#analytics"
                        className="shopeasy-nav-item"
                        onClick={(e) => {
                            if (setMobileOpen) setMobileOpen(false);
                            if (!isDashboardPage) {
                                navigate("/admin#dashboard");
                            } else {
                                e.preventDefault();
                                document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth" });
                            }
                        }}
                        title="Analytics"
                    >
                        <div className="nav-item-left">
                            <span className="nav-icon">📈</span>
                            {!collapsed && <span className="nav-label">Analytics</span>}
                        </div>
                    </a>
                </div>

                {/* Sales Channels */}
                <div className="shopeasy-nav-group">
                    {!collapsed && (
                        <div className="shopeasy-group-header">
                            <span className="shopeasy-group-title">SALES CHANNELS</span>
                        </div>
                    )}
                    <div className="shopeasy-channel-item">
                        <Link 
                            to="/" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="shopeasy-nav-item channel-nav-item" 
                            title="Customer Marketplace"
                            onClick={() => setMobileOpen && setMobileOpen(false)}
                        >
                            <div className="nav-item-left">
                                <span className="nav-icon">🌐</span>
                                {!collapsed && <span className="nav-label">Online Store</span>}
                            </div>
                        </Link>
                        {!collapsed && (
                            <Link to="/" target="_blank" rel="noopener noreferrer" className="channel-eye-btn" title="View live marketplace in new tab">
                                👁️
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* Admin Footer Dock: Settings & Admin Profile */}
            <div className="shopeasy-sidebar-footer">
                <NavLink 
                    to="/admin/settings" 
                    className={({ isActive }) => `shopeasy-footer-item ${isActive || isSettingsPage ? "active" : ""}`}
                    title="Admin Profile & Marketplace Settings"
                    onClick={() => setMobileOpen && setMobileOpen(false)}
                >
                    <span className="footer-icon">⚙️</span>
                    {!collapsed && <span className="footer-label">Settings</span>}
                </NavLink>

                <div className="shopeasy-user-profile">
                    <div className="user-avatar-circle" title={userEmail}>
                        {userName.charAt(0).toUpperCase()}
                    </div>
                    {!collapsed && (
                        <div className="user-info-wrap">
                            <span className="user-name-text" title={userName}>{userName}</span>
                            <span className="user-role-badge">Super Admin</span>
                        </div>
                    )}
                    {!collapsed && (
                        <button 
                            type="button"
                            className="shopeasy-logout-btn" 
                            onClick={handleLogout}
                            title="Sign out of Admin Panel"
                        >
                            🚪
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
}

export default AdminSidebar;