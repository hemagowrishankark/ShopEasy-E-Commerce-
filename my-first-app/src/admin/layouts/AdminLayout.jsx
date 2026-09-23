import { useState, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import AdminTopbar from "../components/AdminTopbar";
import "../styles/admin.css";

function AdminLayout({ children }) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("categories");
    const [showForm, setShowForm] = useState(false);
    
    const [counts, setCounts] = useState({
        total: 0,
        all: 0,
        newArr: 0,
        orders: 0,
        cats: 0,
        customers: 0
    });

    const navigate = useNavigate();
    const location = useLocation();

    const handleCountsUpdate = useCallback((updates) => {
        setCounts((prev) => ({
            ...prev,
            ...updates
        }));
    }, []);

    const handleTabSelect = (tab) => {
        setActiveTab(tab);
        setMobileSidebarOpen(false);
        if (location.pathname !== "/admin" && location.pathname !== "/admin/dashboard") {
            navigate("/admin");
        }
    };

    const handleQuickAdd = () => {
        setShowForm(true);
        setMobileSidebarOpen(false);
        if (location.pathname !== "/admin" && location.pathname !== "/admin/dashboard") {
            navigate("/admin");
        }
        setTimeout(() => {
            document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    return (
        <div className="admin-page">
            {/* Backdrop for tablet & mobile off-canvas drawer */}
            {mobileSidebarOpen && (
                <div 
                    className="admin-sidebar-backdrop active" 
                    onClick={() => setMobileSidebarOpen(false)}
                    title="Close sidebar"
                />
            )}

            {/* Dedicated Admin Sidebar */}
            <AdminSidebar 
                collapsed={sidebarCollapsed}
                setCollapsed={setSidebarCollapsed}
                mobileOpen={mobileSidebarOpen}
                setMobileOpen={setMobileSidebarOpen}
                totalProductsCount={counts.total}
                allProductsCount={counts.all}
                newArrivalsCount={counts.newArr}
                categoriesCount={counts.cats}
                ordersCount={counts.orders}
                customersCount={counts.customers}
                activeTab={activeTab}
                onTabSelect={handleTabSelect}
                onQuickAddProduct={handleQuickAdd}
            />

            {/* Main Admin Scrollable Canvas */}
            <main className="admin-content">
                {/* Dedicated Standalone Admin Top Command Bar */}
                <AdminTopbar 
                    onOpenAddProduct={handleQuickAdd}
                    onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                    mobileSidebarOpen={mobileSidebarOpen}
                />

                {/* Render Child Pages (Dashboard or Profile Settings) */}
                {children ? (
                    children
                ) : (
                    <Outlet context={{
                        activeTab,
                        setActiveTab,
                        showForm,
                        setShowForm,
                        onCountsUpdate: handleCountsUpdate
                    }} />
                )}
            </main>
        </div>
    );
}

export default AdminLayout;
