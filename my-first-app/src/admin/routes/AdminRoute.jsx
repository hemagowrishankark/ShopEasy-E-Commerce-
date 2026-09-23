import { Navigate } from "react-router-dom";

// Centralized Allowed Admin emails list
const ADMIN_EMAILS = ["shopeasy@gmail.com", "admin@gmail.com"];

function AdminRoute({ children }) {
    const token = localStorage.getItem("token");
    const userEmail = localStorage.getItem("userEmail")?.toLowerCase();

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
        alert("Access Denied: Only Admin can access the Admin and Marketplace management panel.");
        return <Navigate to="/" replace />;
    }

    return children;
}

export default AdminRoute;