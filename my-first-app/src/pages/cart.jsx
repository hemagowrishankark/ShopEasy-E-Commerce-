import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./cart.css";

function Cart() {
    const [cart, setCart] = useState([]);
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState("cart"); // "cart" | "orders"
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [loadingCart, setLoadingCart] = useState(false);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [placingOrder, setPlacingOrder] = useState(false);
    const navigate = useNavigate();

    const fetchCart = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setCart([]);
            return;
        }

        try {
            setLoadingCart(true);
            const response = await fetch("http://localhost:5001/api/cart", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (!response.ok) {
                console.log(data.message);
                return;
            }

            setCart(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("fetchCart error:", error);
        } finally {
            setLoadingCart(false);
        }
    }, []);

    const fetchOrders = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setOrders([]);
            return;
        }

        try {
            setLoadingOrders(true);
            const response = await fetch("http://localhost:5001/api/my-orders", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (response.ok && data.orders) {
                setOrders(data.orders);
            }
        } catch (error) {
            console.error("fetchOrders error:", error);
        } finally {
            setLoadingOrders(false);
        }
    }, []);

    useEffect(() => {
        fetchCart();
        fetchOrders();

        window.addEventListener("cartUpdated", fetchCart);
        return () => {
            window.removeEventListener("cartUpdated", fetchCart);
        };
    }, [fetchCart, fetchOrders]);

    // Remove item from cart
    const handleRemove = async (cartId) => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        try {
            const response = await fetch(`http://localhost:5001/api/cart/${cartId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (!response.ok) {
                setMessage(data.message || "Failed to remove item");
                setMessageType("error");
                fetchCart();
                return;
            }

            setCart((prevItems) => prevItems.filter((item) => item.id !== cartId));
            window.dispatchEvent(new Event("cartUpdated"));
            setMessage("Item removed from cart");
            setMessageType("success");
            setTimeout(() => setMessage(""), 3000);
        } catch (error) {
            console.error(error);
            setMessage("Unable to remove item");
            setMessageType("error");
        }
    };

    // Place order
    const handleOrder = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        if (cart.length === 0) {
            setMessage("Your cart is empty. Add products before placing an order.");
            setMessageType("error");
            return;
        }

        try {
            setPlacingOrder(true);
            const response = await fetch("http://localhost:5001/api/orders", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message || "Unable to place order");
                setMessageType("error");
                return;
            }

            setMessage(`🎉 Order placed successfully! Order ID: ${data.orderId}. Your items are being processed.`);
            setMessageType("success");
            setCart([]);
            window.dispatchEvent(new Event("cartUpdated"));
            
            // Re-fetch customer orders and switch to orders view to track status immediately
            await fetchOrders();
            setActiveTab("orders");
        } catch (error) {
            console.error("Order error:", error);
            setMessage("Unable to place order. Please try again.");
            setMessageType("error");
        } finally {
            setPlacingOrder(false);
        }
    };

    const handleOrdersViewToggle = () => {
        if (activeTab === "orders") {
            setActiveTab("cart");
            return;
        }

        fetchOrders();
        setActiveTab("orders");
    };

    const total = cart.reduce(
        (sum, item) => sum + Number(item.price || 0) * (item.quantity || 1),
        0
    );

    const pendingOrdersCount = orders.filter((o) => o.status === "Pending").length;
    const confirmedOrdersCount = orders.filter((o) => o.status?.toLowerCase().includes("confirm")).length;
    const cancelledOrdersCount = orders.filter((o) => o.status === "Cancelled").length;

    return (
        <div className="cart-page">
            {/* Page Header */}
            <div className="cart-page-header">
                <div className="cart-title-wrap">
                    <h1>Shopping Bag & Orders</h1>
                    <p className="cart-subtitle">Review your bag items, place orders, and track fulfillment in real time.</p>
                </div>

                {/* View Switcher Pills */}
                <div className="cart-nav-tabs">
                    <button
                        type="button"
                        className={`cart-tab-btn ${activeTab === "cart" ? "active" : ""}`}
                        onClick={() => setActiveTab("cart")}
                    >
                        🛒 Cart ({cart.length})
                    </button>
                    <button
                        type="button"
                        className={`cart-tab-btn ${activeTab === "orders" ? "active" : ""}`}
                        onClick={() => {
                            fetchOrders();
                            setActiveTab("orders");
                        }}
                    >
                        📦 My Orders ({orders.length})
                        {pendingOrdersCount > 0 && (
                            <span className="pending-badge-pill">{pendingOrdersCount} pending</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Notification Alert Banner */}
            {message && (
                <div className={`cart-alert-banner ${messageType}`}>
                    <span>{message}</span>
                    <button type="button" className="alert-close-btn" onClick={() => setMessage("")}>✕</button>
                </div>
            )}

            {/* REQUIREMENT 3 & 5: DASHBOARD-STYLE "MY ORDERS" SUMMARY CARD */}
            <div 
                className={`cart-orders-summary-card ${activeTab === "orders" ? "is-active-tab" : ""}`}
            >
                <div className="orders-card-left">
                    <div className="orders-card-icon-wrap">
                        📦
                    </div>
                    <div className="orders-card-info">
                        <div className="orders-card-title-row">
                            <h3>My Placed Orders</h3>
                            <span className="orders-count-badge">
                                {orders.length} {orders.length === 1 ? "Order" : "Orders"} Placed
                            </span>
                        </div>
                        <p className="orders-card-desc">
                            Track real-time delivery status, items, prices, and confirmations from the seller.
                        </p>
                    </div>
                </div>

                <div className="orders-card-right">
                    <div className="orders-breakdown-tags">
                        <span className="order-chip pending">
                            ⏳ {pendingOrdersCount} Pending
                        </span>
                        <span className="order-chip confirmed">
                            ✓ {confirmedOrdersCount} Confirmed
                        </span>
                        {cancelledOrdersCount > 0 && (
                            <span className="order-chip cancelled">
                                ✕ {cancelledOrdersCount} Cancelled
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        className="orders-card-action-btn"
                        onClick={handleOrdersViewToggle}
                    >
                        {activeTab === "orders" ? "← View Cart Bag" : "View My Orders ➔"}
                    </button>
                </div>
            </div>

            {/* TAB CONTENT: SHOPPING CART */}
            {activeTab === "cart" && (
                <div className="cart-content-view">
                    {cart.length === 0 ? (
                        <div className="empty-cart-state">
                            <div className="empty-cart-icon">🛒</div>
                            <h2>Your Shopping Cart is Empty</h2>
                            <p>You haven't added any products to your bag yet. Explore our curated catalog and new arrivals!</p>
                            <div className="empty-cart-actions">
                                <Link to="/" className="continue-shopping-btn">
                                    Browse Storefront ➔
                                </Link>
                                {orders.length > 0 && (
                                    <button
                                        type="button"
                                        className="view-past-orders-btn"
                                        onClick={() => setActiveTab("orders")}
                                    >
                                        View Your Placed Orders ({orders.length})
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="cart-layout-grid">
                            {/* Left: Cart Items List */}
                            <div className="cart-items-column">
                                <div className="cart-items-header">
                                    <h3>Cart Items ({cart.length})</h3>
                                    <span className="items-count-tag">{cart.length} unique products</span>
                                </div>

                                <div className="cart-items-list">
                                    {cart.map((item) => (
                                        <div className="cart-item-card" key={item.id}>
                                            <div className="item-thumbnail-wrap">
                                                <img
                                                    src={`http://localhost:5001/assets/${item.image}`}
                                                    alt={item.name}
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = "https://placehold.co/100x100?text=Product";
                                                    }}
                                                />
                                            </div>

                                            <div className="item-details-wrap">
                                                <div className="item-main-info">
                                                    <h4 className="item-name">
                                                        {item.slug ? (
                                                            <Link to={`/product/${item.slug}`} className="cart-item-title-link">
                                                                {item.name}
                                                            </Link>
                                                        ) : (
                                                            item.name
                                                        )}
                                                    </h4>
                                                    <div className="item-tags-row">
                                                        {item.category && (
                                                            <span className="item-category-tag">🏷️ {item.category}</span>
                                                        )}
                                                        {item.selected_variant && (
                                                            <span className="item-variant-tag">
                                                                ✨ {item.selected_variant}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="item-pricing-row">
                                                    <span className="item-unit-price">₹{Number(item.price).toFixed(2)} each</span>
                                                    <span className="item-quantity-pill">Qty: <strong>{item.quantity}</strong></span>
                                                    <span className="item-subtotal-price">
                                                        Subtotal: <strong>₹{(Number(item.price) * item.quantity).toFixed(2)}</strong>
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="item-action-wrap">
                                                <button
                                                    type="button"
                                                    className="cart-cancel-item-btn"
                                                    onClick={() => handleRemove(item.id)}
                                                    title="Remove product from cart"
                                                >
                                                    🗑️ Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right: Order Summary Card */}
                            <div className="cart-summary-column">
                                <div className="cart-summary-card">
                                    <h3>Order Summary</h3>
                                    <div className="summary-divider"></div>

                                    <div className="summary-row">
                                        <span>Total Items:</span>
                                        <strong>{cart.reduce((s, it) => s + (it.quantity || 1), 0)} pcs</strong>
                                    </div>

                                    <div className="summary-row">
                                        <span>Delivery Fee:</span>
                                        <strong className="free-tag">FREE</strong>
                                    </div>

                                    <div className="summary-row total-row">
                                        <span>Total Amount:</span>
                                        <span className="total-amount-val">₹{total.toFixed(2)}</span>
                                    </div>

                                    <button
                                        type="button"
                                        className="cart-order-now-btn"
                                        onClick={handleOrder}
                                        disabled={placingOrder}
                                    >
                                        {placingOrder ? "Processing Order..." : "⚡ Order Now"}
                                    </button>

                                    <p className="order-security-note">
                                        🔒 Safe & Secure Checkout with instant seller notification
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: MY PLACED ORDERS & REAL-TIME STATUS TRACKER */}
            {activeTab === "orders" && (
                <div className="cart-orders-view">
                    <div className="orders-view-header">
                        <div className="orders-header-title">
                            <h3>📦 Order History & Fulfillment Status</h3>
                            <p>Track the confirmation and dispatch status for all orders you have placed.</p>
                        </div>
                        <button
                            type="button"
                            className="refresh-orders-btn"
                            onClick={fetchOrders}
                            disabled={loadingOrders}
                        >
                            🔄 {loadingOrders ? "Refreshing..." : "Refresh Status"}
                        </button>
                    </div>

                    {orders.length === 0 ? (
                        <div className="empty-orders-state">
                            <div className="empty-orders-icon">📦</div>
                            <h3>No Orders Placed Yet</h3>
                            <p>You haven't placed any orders yet. Place your first order from your cart to track its progress!</p>
                            <button
                                type="button"
                                className="continue-shopping-btn"
                                onClick={() => setActiveTab("cart")}
                            >
                                ← Go Back to Cart
                            </button>
                        </div>
                    ) : (
                        <div className="customer-orders-grid">
                            {orders.map((ord) => {
                                const isConfirmed = ord.status?.toLowerCase().includes("confirm");
                                const isCancelled = ord.status === "Cancelled";
                                const isPending = ord.status === "Pending";
                                const orderItems = ord.items || [];

                                return (
                                    <div className={`customer-order-card ${ord.status?.toLowerCase()}`} key={ord.id}>
                                        {/* Order Card Top Bar */}
                                        <div className="cust-order-topbar">
                                            <div className="order-id-group">
                                                <span className="cust-order-id-badge">Order {ord.id}</span>
                                                <span className="cust-order-date">
                                                    {ord.created_at
                                                        ? new Date(ord.created_at).toLocaleString("en-IN", {
                                                              dateStyle: "medium",
                                                              timeStyle: "short"
                                                          })
                                                        : "Recently Placed"}
                                                </span>
                                            </div>

                                            <div className="order-status-group">
                                                {isConfirmed ? (
                                                    <span className="order-status-badge confirmed">✓ Confirmed by Admin</span>
                                                ) : isCancelled ? (
                                                    <span className="order-status-badge cancelled">✕ Cancelled</span>
                                                ) : (
                                                    <span className="order-status-badge pending">⏳ Pending Verification</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* 3-Step Visual Progress Tracker */}
                                        <div className="order-progress-tracker">
                                            <div className="progress-step completed">
                                                <div className="step-circle">1</div>
                                                <span className="step-label">Order Placed</span>
                                            </div>

                                            <div className={`progress-line ${isConfirmed ? "completed" : isCancelled ? "cancelled" : "active"}`}></div>

                                            <div className={`progress-step ${isConfirmed ? "completed" : isCancelled ? "cancelled" : "active"}`}>
                                                <div className="step-circle">{isConfirmed ? "✓" : isCancelled ? "✕" : "2"}</div>
                                                <span className="step-label">
                                                    {isConfirmed ? "Confirmed" : isCancelled ? "Cancelled" : "Awaiting Confirmation"}
                                                </span>
                                            </div>

                                            <div className={`progress-line ${isConfirmed ? "completed" : ""}`}></div>

                                            <div className={`progress-step ${isConfirmed ? "completed" : ""}`}>
                                                <div className="step-circle">{isConfirmed ? "✓" : "3"}</div>
                                                <span className="step-label">Ready for Dispatch</span>
                                            </div>
                                        </div>

                                        {/* Items Ordered List */}
                                        <div className="order-items-preview-box">
                                            <h4>Ordered Products ({orderItems.length})</h4>
                                            <div className="order-items-table">
                                                {orderItems.map((item, idx) => (
                                                    <div className="order-item-row" key={idx}>
                                                        <div className="order-item-thumb">
                                                            <img
                                                                src={`http://localhost:5001/assets/${item.image}`}
                                                                alt={item.product_name}
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = "https://placehold.co/50x50?text=Item";
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="order-item-info">
                                                            <span className="order-item-title">{item.product_name}</span>
                                                            {item.selected_variant && (
                                                                <span className="order-item-variant-tag">✨ {item.selected_variant}</span>
                                                            )}
                                                            <span className="order-item-qty">Quantity: {item.quantity}</span>
                                                        </div>
                                                        <div className="order-item-amount">
                                                            ₹{(Number(item.price) * item.quantity).toFixed(2)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Order Card Bottom Total */}
                                        <div className="cust-order-footer">
                                            <div className="order-total-block">
                                                <span className="total-lbl">Total Paid / Payable:</span>
                                                <strong className="total-val">₹{Number(ord.total_amount).toFixed(2)}</strong>
                                            </div>

                                            <div className="order-footer-status-msg">
                                                {isConfirmed && (
                                                    <span className="status-success-msg">
                                                        🚚 Your order has been confirmed! Preparing for shipment.
                                                    </span>
                                                )}
                                                {isPending && (
                                                    <span className="status-pending-msg">
                                                        ⏳ Order placed successfully. Waiting for seller approval.
                                                    </span>
                                                )}
                                                {isCancelled && (
                                                    <span className="status-cancelled-msg">
                                                        ❌ This order was cancelled.
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default Cart;
