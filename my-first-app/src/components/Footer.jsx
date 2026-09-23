import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
    return (
        <footer className="footer">

            <div className="footer-container">

                <div className="footer-section">
                    <h2>ShopEasy</h2>
                    <p>
                        Shop smart and discover quality products
                        at the best prices.
                    </p>
                </div>

                <div className="footer-section">
                    <h3>Quick Links</h3>

                    <Link to="/">Home</Link>
                    <Link to="/products">Products</Link>
                    <Link to="/about">About</Link>
                    <Link to="/contact">Contact</Link>
                </div>

                <div className="footer-section">
                    <h3>Customer Service</h3>

                    <a href="#">Help Center</a>
                    <a href="#">Shipping</a>
                    <a href="#">Returns</a>
                    <a href="#">Privacy Policy</a>
                </div>

                <div className="footer-section">
                    <h3>Contact Us</h3>

                    <p>Email: support@shopeasy.com</p>
                    <p>Phone: +91 98765 43210</p>
                    <p>India</p>
                </div>

            </div>

            <div className="footer-bottom">
                <p>© 2026 ShopEasy. All rights reserved.</p>
            </div>

        </footer>
    );
}

export default Footer;