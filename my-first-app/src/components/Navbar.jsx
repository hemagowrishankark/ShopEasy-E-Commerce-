import { NavLink, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import "./Navbar.css";

function Navbar() {
    const navigate = useNavigate();

    const ADMIN_EMAILS = ["shopeasy@gmail.com", "admin@gmail.com"];

    const [isAdmin, setIsAdmin] = useState(
        ADMIN_EMAILS.includes(localStorage.getItem("userEmail")?.toLowerCase())
    );

// cart count function..
    const [cartCount, setCartCount] = useState(0);

    const checkAuthAndCart = async () => {
        const email = localStorage.getItem("userEmail")?.toLowerCase();
        setIsAdmin(ADMIN_EMAILS.includes(email));

        const token = localStorage.getItem("token");

        if (!token) {
            setCartCount(0);
            return;
        }

        try {
            const response = await fetch(
                "http://localhost:5001/api/cart",
                {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                setCartCount(0);
                return;
            }

            const cart = await response.json();

            const count = cart.reduce(
                (total, item) => total + item.quantity,
                0
            );
            setCartCount(count);

        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        checkAuthAndCart();

        window.addEventListener("cartUpdated", checkAuthAndCart);
        window.addEventListener("authChanged", checkAuthAndCart);

        return () => {
            window.removeEventListener("cartUpdated", checkAuthAndCart);
            window.removeEventListener("authChanged", checkAuthAndCart);
        };
    }, []);

    return (
        <nav className="navbar">
            <h2 className="brd-name" onClick={() => navigate("/")}>ShopEasy</h2>

            <div className="nav-links">
                <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
                    Home
                </NavLink>
                <NavLink to="/about" className={({ isActive }) => (isActive ? "active" : "")}>
                    About
                </NavLink>
                <NavLink to="/products" className={({ isActive }) => (isActive ? "active" : "")}>
                    Products
                </NavLink>
                <NavLink to="/contact" className={({ isActive }) => (isActive ? "active" : "")}>
                    Contact Us
                </NavLink>
            </div>

            <div className="nav-icons">
                <button className="icon-btn cart-btn">
                    <Link to="/cart" className="cart-link">
                        🛒
                        {cartCount > 0 && (
                            <span className="cart-count">
                                {cartCount}
                            </span>
                        )}
                    </Link>
                </button>

                <button
                    className="icon-btn"
                    title={localStorage.getItem("token") ? "My Profile" : "Login"}
                    onClick={() => navigate(localStorage.getItem("token") ? "/profile" : "/login")}
                >
                    👤
                </button>
            </div>
        </nav>
    );
}

export default Navbar;