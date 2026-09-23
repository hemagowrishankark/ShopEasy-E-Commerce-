import { Link, useNavigate } from "react-router-dom";

function AdminTopbar({ onOpenAddProduct, onToggleMobileSidebar, mobileSidebarOpen }) {
    const navigate = useNavigate();

    const userEmail = localStorage.getItem("userEmail") || "admin@shopeasy.com";
    const userName = localStorage.getItem("userName") || userEmail.split("@")[0] || "Admin";

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userName");
        window.dispatchEvent(new Event("authChanged"));
        navigate("/login");
    };

    return (
        <div className="admin-topbar">
            {/* Left: Hamburger & Portal Identification */}
            <div className="admin-topbar-left">
                <button 
                    type="button" 
                    className={`admin-hamburger-btn ${mobileSidebarOpen ? "active" : ""}`}
                    onClick={onToggleMobileSidebar}
                    title="Toggle admin navigation menu"
                    aria-label="Toggle navigation menu"
                >
                    <span className="hamburger-bar"></span>
                    <span className="hamburger-bar"></span>
                    <span className="hamburger-bar"></span>
                </button>

                <div className="admin-portal-badge">
                    <span className="portal-icon">⚡</span>
                    <span className="portal-name">ShopEasy Admin & Marketplace</span>
                </div>
                <div className="store-live-status" title="Multi-Vendor Central Marketplace is Online and Active">
                    <span className="live-status-dot"></span>
                    <span className="live-status-text">Marketplace Online</span>
                </div>
            </div>

            {/* Right: Quick Actions & Profile Pill */}
            <div className="admin-topbar-right">
                <a 
                    href="/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="topbar-store-btn"
                    title="Open customer storefront in a new tab without leaving admin"
                >
                    <span>🌐</span>
                    <span className="topbar-btn-text">Live Store</span>
                    <span className="external-link-arrow">↗</span>
                </a>

                <button 
                    type="button" 
                    className="topbar-add-btn" 
                    onClick={onOpenAddProduct}
                    title="Add a new product to marketplace catalog"
                >
                    <span>➕</span>
                    <span className="topbar-btn-text">Add Product</span>
                </button>

                {/* Admin Profile Pill -> Navigates to /admin/settings */}
                <Link 
                    to="/admin/settings" 
                    className="topbar-user-pill" 
                    title="View Admin Profile & Marketplace Settings"
                >
                    <div className="topbar-avatar">
                        {userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="topbar-user-text">
                        <span className="topbar-user-name">{userName}</span>
                        <span className="topbar-user-badge">Super Admin</span>
                    </div>
                    <button 
                        type="button" 
                        className="topbar-logout-btn" 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleLogout();
                        }}
                        title="Sign out of Admin"
                    >
                        🚪
                    </button>
                </Link>
            </div>
        </div>
    );
}

export default AdminTopbar;
