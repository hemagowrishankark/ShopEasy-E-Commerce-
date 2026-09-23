import { useEffect, useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import ProductFormModal from "../components/ProductFormModal";
import ProductEditModal from "../components/ProductEditModal";
import { validateProductForm } from "../utils/productValidation";
import "../styles/admin.css";

function AdminDashboard(props) {
    const outletCtx = useOutletContext() || {};
    const activeTab = props.activeTab || outletCtx.activeTab || "categories";
    const setActiveTab = props.setActiveTab || outletCtx.setActiveTab || (() => {});
    const showForm = props.showForm !== undefined ? props.showForm : (outletCtx.showForm !== undefined ? outletCtx.showForm : false);
    const setShowForm = props.setShowForm || outletCtx.setShowForm || (() => {});
    const onCountsUpdate = props.onCountsUpdate || outletCtx.onCountsUpdate;
    const [categories, setCategories] = useState([]);
    const [allproducts, setAllProducts] = useState([]);
    const [newarrivals, setNewArrivals] = useState([]);
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [customerSearchQuery, setCustomerSearchQuery] = useState("");
    const [expandedCustomerIds, setExpandedCustomerIds] = useState(new Set());
    const [orderStatusFilter, setOrderStatusFilter] = useState("all");

    const [editingProduct, setEditingProduct] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showCategoryProducts, setShowCategoryProducts] = useState(false);
    const [categorySearchQuery, setCategorySearchQuery] = useState("");

    const [productForm, setProductForm] = useState({
        name: "",
        price: "",
        category: "",
        image: "",
        stock:"",
        targetType: "allproducts"
    });

    const [errors,setErrors] = useState({});
    const [editErrors, setEditErrors] = useState({});

    const getAuthHeaders = () => {
        
        const token = localStorage.getItem("token");
        return {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
        };
    };
    const handleApiResponse = async ( res, defaultError = "Request failed" ) => {

    const contentType = res.headers.get("content-type");

    let data = null;

    if (contentType && contentType.includes("application/json")) {
        data = await res.json();

        if (!res.ok) {
            const apiError = new Error(
                data.message || data.error || defaultError
            );

            apiError.fieldErrors = data.errors || {};

            throw apiError;
        }

        return data;
    }

    const rawText = await res.text();

    if (!res.ok) {
        const match = rawText.match(/<pre>(.*?)<\/pre>/i);

        const cleanMsg = match
            ? `${match[1]} - (Please restart backend: node server.js)`
            : `Server error (${res.status}): Server not responding properly.`;

        throw new Error(cleanMsg);
    }

    return { message: rawText };
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch("http://localhost:5001/api/categories", {
                headers: getAuthHeaders()
            });
            const data = await handleApiResponse(res);
            if (Array.isArray(data)) setCategories(data);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }   
    };

    const fetchAllProducts = async () => {
        try {
            const res = await fetch("http://localhost:5001/api/allproducts", {
                headers: getAuthHeaders()
            });
            const data = await handleApiResponse(res);
            if (Array.isArray(data)) setAllProducts(data);
        } catch (error) {
            console.error("Error fetching allproducts:", error);
        }
    };

    const fetchNewArrivals = async () => {
        try {
            const res = await fetch("http://localhost:5001/api/newarrivals", {
                headers: getAuthHeaders()
            });
            const data = await handleApiResponse(res);
            if (Array.isArray(data)) setNewArrivals(data);
        } catch (error) {
            console.error("Error fetching newarrivals:", error);
        }
    };

// orders fetch
    const fetchOrders = async () => {
    try {
        const token = localStorage.getItem("token");


        const res = await fetch("http://localhost:5001/api/orders", {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });


        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Failed to fetch orders");
        }

        setOrders(data.orders);

        onCountsUpdate({
            orders:data.orders.length
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
    }
};

    // customers fetch
    const fetchCustomers = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5001/api/admin/customers", {
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                }
            });

            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                // Strictly exclude admin accounts (admin is not a customer)
                const realCustomers = data.filter(c => {
                    const role = c.role?.toLowerCase() || "";
                    const email = c.email?.toLowerCase() || "";
                    return role !== "admin" && role !== "superadmin" && !email.includes("admin");
                });
                setCustomers(realCustomers);
                if (onCountsUpdate) {
                    onCountsUpdate({ customers: realCustomers.length });
                }
            }
        } catch (error) {
            console.error("Error fetching customers:", error);
        }
    };

    const toggleCustomerExpand = (userId) => {
        setExpandedCustomerIds((prev) => {
            const next = new Set(prev);
            if (next.has(userId)) {
                next.delete(userId);
            } else {
                next.add(userId);
            }
            return next;
        });
    };

    useEffect(() => {
        fetchCategories();
        fetchAllProducts();
        fetchNewArrivals();
        fetchOrders();
        fetchCustomers();

        const interval = setInterval(() => {
            fetchOrders();
            fetchCustomers();
        }, 5000);
        
        return () => {
            clearInterval(interval);
        };
    }, []);

    // Group 
    const categoryStats = useMemo(() => {
        const categoryMap = new Map();
        
        categories.forEach((cat) => {
            if (cat && cat.name) {
                const key = cat.name.trim().toLowerCase();
                categoryMap.set(key, {
                    id: cat.id,
                    name: cat.name.trim(),
                    image: cat.image || "",
                    productMap: new Map()
                });
            }
        });

        const getCategoryEntry = (catName) => {
            const key = catName.trim().toLowerCase();
            if (!categoryMap.has(key)) {
                categoryMap.set(key, {
                    id: `cat-${key}`,
                    name: catName.trim(),
                    image: "",
                    productMap: new Map()
                });
            }
            return categoryMap.get(key);
        };

        // 2. Add products from allproducts
        allproducts.forEach((prod) => {
            if (prod && prod.name && prod.category) {
                const catObj = getCategoryEntry(prod.category);
                const prodKey = prod.name.trim().toLowerCase();

                catObj.productMap.set(prodKey, {
                    id: prod.id,
                    allProductId: prod.id,
                    newArrivalId: null,
                    name: prod.name.trim(),
                    price: prod.price,
                    category: prod.category.trim(),
                    image: prod.image,
                    product_code: prod.product_code || "",
                    inAllProducts: true,
                    inNewArrivals: false,
                    sourceType: "allproducts",
                    sourceLabel: "All Products"
                });
            }
        });

        // 3. Compare with newarrivals, match existing by name, and deduplicate
        newarrivals.forEach((prod) => {
            if (prod && prod.name && prod.category) {
                const catObj = getCategoryEntry(prod.category);
                const prodKey = prod.name.trim().toLowerCase();

                if (catObj.productMap.has(prodKey)) {
                    const existing = catObj.productMap.get(prodKey);
                    existing.newArrivalId = prod.id;
                    existing.inNewArrivals = true;
                    existing.product_code = existing.product_code || prod.product_code || "";
                    existing.sourceType = "both";
                    existing.sourceLabel = "Both (All Products & New Arrivals)";
                } else {
                    catObj.productMap.set(prodKey, {
                        id: prod.id,
                        allProductId: null,
                        newArrivalId: prod.id,
                        name: prod.name.trim(),
                        price: prod.price,
                        category: prod.category.trim(),
                        image: prod.image,
                        product_code: prod.product_code || "",
                        inAllProducts: false,
                        inNewArrivals: true,
                        sourceType: "newarrivals",
                        sourceLabel: "New Arrivals"
                    });
                }
            }
        });

        // 4. Calculate accurate unique counts per category
        return Array.from(categoryMap.values()).map((cat) => {
            const uniqueProducts = Array.from(cat.productMap.values());
            const allCount = uniqueProducts.filter((p) => p.inAllProducts).length;
            const newCount = uniqueProducts.filter((p) => p.inNewArrivals).length;
            const bothCount = uniqueProducts.filter((p) => p.sourceType === "both").length;

            return {
                id: cat.id,
                name: cat.name,
                image: cat.image,
                totalCount: uniqueProducts.length,
                allCount,
                newCount,
                bothCount,
                products: uniqueProducts
            };
        });
    }, [categories, allproducts, newarrivals]);

    const totalUniqueProductsCount = useMemo(() => {
        return categoryStats.reduce((sum, cat) => sum + cat.totalCount, 0);
    }, [categoryStats]);

    const totalBothCount = useMemo(() => {
        return categoryStats.reduce((sum, cat) => sum + cat.bothCount, 0);
    }, [categoryStats]);

    // Update parent layout counters for sidebar
    useEffect(() => {
        if (onCountsUpdate) {
            onCountsUpdate({
                total: totalUniqueProductsCount,
                all: allproducts.length,
                newArr: newarrivals.length,
                orders:orders.length,
                cats: categories.length
            });
        }
    }, [totalUniqueProductsCount,
         allproducts.length, 
         newarrivals.length, 
         categories.length, 
         onCountsUpdate]);

    const filteredCategoryStats = useMemo(() => {
        if (!categorySearchQuery.trim()) return categoryStats;
        const q = categorySearchQuery.trim().toLowerCase();
        return categoryStats.filter((cat) =>
             cat.name.toLowerCase().
                includes(q));
    }, [categoryStats, categorySearchQuery]);

    const categoryViewProducts = useMemo(() => {
        if (selectedCategory) {
            const found = categoryStats.find(
                (c) => c.name.toLowerCase() === selectedCategory.toLowerCase()
            );
            return found ? found.products : [];
        }
        return categoryStats.flatMap((c) => c.products);
    }, [selectedCategory, categoryStats]);

    const scrollToProductsSection = () => {
        const el = document.getElementById("category-products-section") || document.getElementById("products");
        if (el) {
            el.scrollIntoView({ behavior: "smooth" });
        }
    };

    const handleCardClick = (tabName, categoryName = null) => {
        setActiveTab(tabName);
        if (categoryName !== undefined) {
            setSelectedCategory(categoryName);
        }
        scrollToProductsSection();
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();

    const newErrors = validateProductForm(productForm);

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }
        try {
            const payload = {
                name: productForm.name.trim(),
                price: parseFloat(productForm.price),
                category: productForm.category.trim(),
                image: productForm.image.trim(),
                stock: parseInt(productForm.stock),
                targetType: productForm.targetType,
                isBoth: productForm.targetType === "both"
            };

            const headers = getAuthHeaders();

            if (productForm.targetType === "allproducts") {
                const res = await fetch(
                    "http://localhost:5001/api/allproducts", {
                    method: "POST",
                    headers: headers,
                    body: JSON.stringify(payload)
                }
            );

                await handleApiResponse(res, 
                    "Failed to add to all products");

            } else if (productForm.targetType === "newarrivals") {
                const res = await fetch(
                    "http://localhost:5001/api/newarrivals", {
                    method: "POST",
                    headers: headers,
                    body: JSON.stringify(payload)
                }
            );
                await handleApiResponse(res,
                     "Failed to add to new arrivals");

            } else if (productForm.targetType === "both") {

                // 1. First create in allproducts
                const res1 = await fetch(
                    "http://localhost:5001/api/allproducts",
                {
                     method: "POST",
                    headers: headers,
                    body: JSON.stringify(payload)
                }
            );

                const data1 = await handleApiResponse(
                res1,
                "Failed to add to all products"
                );


                // 2. Get product_code generated by allproducts
                const productCode = data1.productCode;


            // 3. Send same product_code to newarrivals
                    const newArrivalPayload = {
                    ...payload,
                    product_code: productCode
                };


                const res2 = await fetch(
                        "http://localhost:5001/api/newarrivals",
                    {
                        method: "POST",
                        headers: headers,
                        body: JSON.stringify(newArrivalPayload)
                    }
                );

                await handleApiResponse(
                    res2,
                            "Failed to add to new arrivals"
                );
}

            setProductForm({
                name: "",
                price: "",
                category: "",
                image: "",
                stock:"",
                targetType: "allproducts"
            });
            setShowForm(false);
            fetchAllProducts();
            fetchNewArrivals();
            fetchCategories();
            alert("Product added successfully in catalog!📦");

        } catch (error) {

            console.error("Error adding product:", error);

            const hasFieldErrors = error.fieldErrors && Object.keys(error.fieldErrors).length > 0;

            if (hasFieldErrors) {
                setErrors(error.fieldErrors);
            } else {
                const errorMsg = error.message || "Failed to add product";
                const isDuplicate = errorMsg.toLowerCase().includes("already exists");
                setErrors({
                    general: errorMsg,
                    ...(isDuplicate ? { name: errorMsg } : {})
                });
            }
        }
    };

    const handleEditClick = (product, targetTable) => {
        setEditErrors({});
        setEditingProduct({
            ...product,
            targetTable: targetTable || product.sourceType || "allproducts"
        });
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        const newErrors = validateProductForm(editingProduct);

        if (Object.keys(newErrors).length > 0) {
            setEditErrors(newErrors);
            return;
        }

        try {
            const payload = {
                name: editingProduct.name.trim(),
                price: parseFloat(editingProduct.price),
                category: editingProduct.category.trim(),
                image: editingProduct.image.trim(),
                stock:parseInt(editingProduct.stock)
            };


            const headers = getAuthHeaders();
            const table = editingProduct.targetTable || "allproducts";

            if (table === "allproducts" || editingProduct.allProductId) {

                const id = editingProduct.allProductId || editingProduct.id;

                const res = await fetch
                (`http://localhost:5001/api/allproducts/${id}`, {
                    method: "PUT",
                    headers: headers,
                    body: JSON.stringify(payload)
                });
                await handleApiResponse(res, "Failed to update product");
            }

            if (table === "newarrivals" || 
                (table === "both" && editingProduct.newArrivalId)) {

                const id = editingProduct.newArrivalId || editingProduct.id;

                const res = await fetch(`http://localhost:5001/api/newarrivals/${id}`, {
                    method: "PUT",
                    headers: headers,
                    body: JSON.stringify(payload)
                });
                await handleApiResponse(res, "Failed to update new arrival");
            }

            setEditingProduct(null);
            setEditErrors({});

            fetchAllProducts();
            fetchNewArrivals();
            fetchCategories();
            alert("Product updated successfully!");

        } catch (error) {
            console.error("Error updating product:", error);
            if (error.fieldErrors && Object.keys(error.fieldErrors).length > 0) {
                setEditErrors(error.fieldErrors);
                return;
            }
            alert("Error updating product: " + error.message);
        }
    };

    const handleDeleteProduct = async (id, targetTable) => {
        if (!window.confirm("Are you sure you want to delete this product from the store?")) return;

        try {
            const headers = getAuthHeaders();
            const endpoint = targetTable === "newarrivals" ? "newarrivals" : "allproducts";

            const res = await fetch(`http://localhost:5001/api/${endpoint}/${id}`, {
                method: "DELETE",
                headers: headers
            });
            await handleApiResponse(res, "Failed to delete product");

            if (targetTable === "newarrivals") {
                fetchNewArrivals();
            } else {
                fetchAllProducts();
            }
            fetchCategories();
            alert("Product deleted successfully!");
        } catch (error) {
            console.error("Error deleting product:", error);
            alert("Error deleting product: " + error.message);
        }
    };

    const handleDeleteCategoryProduct = async (product) => {
        if (!window.confirm(`Are you sure you want to Delete "${product.name}" from the category?`)) return;

        try {
            const headers = getAuthHeaders();

            if (product.allProductId) {
                const res1 = await fetch(`http://localhost:5001/api/allproducts/${product.allProductId}`, {
                    method: "DELETE",
                    headers: headers
                });
                await handleApiResponse(res1, "Failed to delete from all products");
            }

            if (product.newArrivalId) {
                const res2 = await fetch(`http://localhost:5001/api/newarrivals/${product.newArrivalId}`, {
                    method: "DELETE",
                    headers: headers
                });
                await handleApiResponse(res2, "Failed to delete from new arrivals");
            }

            fetchAllProducts();
            fetchNewArrivals();
            fetchCategories();
            alert(`"${product.name}" removed successfully!`);
        } catch (error) {
            console.error("Error removing product:", error);
            alert("Error removing product: " + error.message);
        }
    };

const handleConfirmOrder = async (orderId) => {
    const confirm = window.confirm(
        `Are you sure you want to confirm Order ${orderId}?`
    );

    if (!confirm) return;

    try {
        const token = localStorage.getItem("token");

        const res = await fetch(
            `http://localhost:5001/api/orders/${orderId}/confirm`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Failed to confirm order");
        }

        alert(data.message || "Order confirmed successfully!");

        // Refresh orders
        fetchOrders();

    } catch (error) {
        console.error("Error confirming order:", error);
        alert(error.message);
    }
};

const handleCancelOrder = async (orderId) => {
    const confirm = window.confirm(
        `Are you sure you want to cancel Order ${orderId}? Product stock will be restored.`
    );

    if (!confirm) return;

    try {
        const token = localStorage.getItem("token");

        const res = await fetch(
            `http://localhost:5001/api/orders/${orderId}/cancel`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Failed to cancel order");
        }

        alert(data.message || "Order cancelled successfully!");

        // Refresh orders and inventory
        fetchOrders();
        fetchAllProducts();
        fetchNewArrivals();

    } catch (error) {
        console.error("Error cancelling order:", error);
        alert(error.message);
    }
};

    const openAddProductWithCategory = (catName) => {
        setProductForm({
            name: "",
            price: "",
            category: catName || "",
            image: "",
            stock: "",
            targetType: "allproducts"
        });
        setErrors({});
        setShowForm(true);
        setShowCategoryProducts(true);
        setTimeout(scrollToProductsSection, 80);
    };

    return (
        <>
            <header className="admin-header">
                <h1>Admin Dashboard</h1>
                <p>Manage central multi-seller catalog, global inventory, categories, new arrivals, and marketplace orders.</p>
            </header>

            {/* Dashboard Stats */}
            <section id="dashboard" className="admin-dashboard">
                <div 
                    className={`admin-card clickable-card ${activeTab === "allproducts" ? "active-card" : ""}`}
                    onClick={() => handleCardClick("allproducts")}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleCardClick("allproducts")}
                    title="Click to view and manage All Products"
                >
                    <div className="card-top-icon">📦</div>
                    <h3>All Products Catalog</h3>
                    <p>{allproducts.length}</p>
                    <span className="card-action-hint">Click to manage products →</span>
                </div>

                <div 
                    className={`admin-card clickable-card ${activeTab === "newarrivals" ? "active-card" : ""}`}
                    onClick={() => handleCardClick("newarrivals")}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleCardClick("newarrivals")}
                    title="Click to view and manage New Arrivals"
                >
                    <div className="card-top-icon">✨</div>
                    <h3>New Arrivals Showcase</h3>
                    <p>{newarrivals.length}</p>
                    <span className="card-action-hint">Click to manage arrivals →</span>
                </div>

                <div 
                    className={`admin-card clickable-card category-stat-card ${activeTab === "categories" ? "active-card" : ""}`}
                    onClick={() => handleCardClick("categories")}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleCardClick("categories")}
                    title="Click to view all categories and unique products per category"
                >
                    <div className="card-top-icon">🏷️</div>
                    <div className="card-header-badge">
                        <h3>Categories</h3>
                        <span className="card-pill">Breakdown</span>
                    </div>
                    <p>{categories.length}</p>
                    <span className="card-action-hint category-hint">
                        ⚡ See categories & unique counts ({totalUniqueProductsCount} products) →
                    </span>
                </div>
            </section>

            {/* Products Section */}
            <section id="products" className="admin-section">
                <div className="section-header">
                    <div>
                        <h2>Catalog & Marketplace Inventory Management</h2>
                        <p className="section-subtitle">
                            {activeTab === "categories" 
                                ? "Compare All Products and New Arrivals, remove duplicates, and view unique product counts per category"
                                : "Manage which products appear in All Products or New Arrivals in the central marketplace"}
                        </p>
                    </div>

                    <button
                        className="add-product-btn"
                        onClick={() => setShowForm(!showForm)}
                    >
                        {showForm ? "✕ Close Form" : "+ Add Product"}
                    </button>
                </div>

                {/* Add Product Form Modal */}
                <ProductFormModal 
                    showForm={showForm}
                    setShowForm={setShowForm}
                    productForm={productForm}
                    setProductForm={setProductForm}
                    errors={errors}
                    setErrors={setErrors}
                    onSubmit={handleAddProduct}

                />

                {/* Edit Product Modal */}
                <ProductEditModal 
                    editingProduct={editingProduct}
                    setEditingProduct={setEditingProduct}
                    errors={editErrors}
                    setErrors={setEditErrors}
                    onSaveEdit={handleSaveEdit}
                />

                {/* Navigation Tabs */}
                <div className="admin-tabs">
                     <button
                        className={`tab-btn category-tab-btn ${activeTab === "categories" ? "active" : ""}`}
                        onClick={() => setActiveTab("categories")}
                    >
                        🏷️ Categories ({categories.length} Categories)
                    </button>

                    <button
                        className={`tab-btn ${activeTab === "allproducts" ? "active" : ""}`}
                        onClick={() => setActiveTab("allproducts")}
                    >
                        📦 All Products ({allproducts.length})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === "newarrivals" ? "active" : ""}`}
                        onClick={() => setActiveTab("newarrivals")}
                    >
                        ✨ New Arrivals ({newarrivals.length})
                    </button>
                    
                    <button
                        className={`tab-btn orders-tab-btn ${activeTab === "orders" ? "active" : ""}`}
                        onClick={() => setActiveTab("orders")}
                    >
                        📋 Orders ({orders.length})
                    </button>
                    <button
                        className={`tab-btn customers-tab-btn ${activeTab === "customers" ? "active" : ""}`}
                        onClick={() => setActiveTab("customers")}
                    >
                        👥 Customers ({customers.length})
                    </button>
                </div>

                {/* TAB: ORDERS DEDICATED SCREEN */}
                {activeTab === "orders" ? (
                    <div className="admin-orders-view-wrapper">
                        <div className="orders-overview-header">
                            <div className="orders-header-title">
                                <h3>📋 Customer Orders Management</h3>
                                <p>Track, verify, confirm, or cancel customer orders across the marketplace.</p>
                            </div>
                            <div className="header-right-actions">
                                <div className="orders-stats-row">
                                    <div 
                                        className={`order-stat-chip total ${orderStatusFilter === "all" ? "selected" : ""}`}
                                        onClick={() => setOrderStatusFilter("all")}
                                        title="Show all orders"
                                    >
                                        <span className="stat-num">{orders.length}</span>
                                        <span className="stat-label">Total Orders</span>
                                    </div>
                                    <div 
                                        className={`order-stat-chip pending ${orderStatusFilter === "pending" ? "selected" : ""}`}
                                        onClick={() => setOrderStatusFilter("pending")}
                                        title="Filter by Pending"
                                    >
                                        <span className="stat-num">{orders.filter(o => o.status === "Pending").length}</span>
                                        <span className="stat-label">Pending</span>
                                    </div>
                                    <div 
                                        className={`order-stat-chip confirmed ${orderStatusFilter === "confirmed" ? "selected" : ""}`}
                                        onClick={() => setOrderStatusFilter("confirmed")}
                                        title="Filter by Confirmed"
                                    >
                                        <span className="stat-num">{orders.filter(o => o.status?.toLowerCase().includes("confirm")).length}</span>
                                        <span className="stat-label">Confirmed</span>
                                    </div>
                                    <div 
                                        className={`order-stat-chip cancelled ${orderStatusFilter === "cancelled" ? "selected" : ""}`}
                                        onClick={() => setOrderStatusFilter("cancelled")}
                                        title="Filter by Cancelled"
                                    >
                                        <span className="stat-num">{orders.filter(o => o.status === "Cancelled").length}</span>
                                        <span className="stat-label">Cancelled</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="screen-cancel-close-btn"
                                    onClick={() => setActiveTab("categories")}
                                    title="Close Orders view and return to Categories"
                                >
                                    ✕ Close
                                </button>
                            </div>
                        </div>

                        {/* Order Status Filters */}
                        <div className="orders-filter-bar">
                            <span className="filter-label">Filter:</span>
                            {["all", "pending", "confirmed", "cancelled"].map((st) => (
                                <button
                                    key={st}
                                    type="button"
                                    className={`orders-filter-btn filter-pill-btn ${orderStatusFilter === st ? "active" : ""}`}
                                    onClick={() => setOrderStatusFilter(st)}
                                >
                                    {st.charAt(0).toUpperCase() + st.slice(1)}
                                </button>
                            ))}
                            <span className="showing-count-text">
                                Showing {orders.filter(o => {
                                    if (orderStatusFilter === "all") return true;
                                    if (orderStatusFilter === "pending") return o.status === "Pending";
                                    if (orderStatusFilter === "confirmed") return o.status?.toLowerCase().includes("confirm");
                                    if (orderStatusFilter === "cancelled") return o.status === "Cancelled";
                                    return true;
                                }).length} of {orders.length} orders
                            </span>
                        </div>

                        {/* Desktop & Tablet Table View */}
                        <div className="admin-table-container orders-scroll-container">
                            <table className="admin-product-table orders-table">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Items Ordered</th>
                                        <th>Total Amount</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.filter(o => {
                                        if (orderStatusFilter === "all") return true;
                                        if (orderStatusFilter === "pending") return o.status === "Pending";
                                        if (orderStatusFilter === "confirmed") return o.status?.toLowerCase().includes("confirm");
                                        if (orderStatusFilter === "cancelled") return o.status === "Cancelled";
                                        return true;
                                    }).length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
                                                🛍️ No customer orders found in this view.
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.filter(o => {
                                            if (orderStatusFilter === "all") return true;
                                            if (orderStatusFilter === "pending") return o.status === "Pending";
                                            if (orderStatusFilter === "confirmed") return o.status?.toLowerCase().includes("confirm");
                                            if (orderStatusFilter === "cancelled") return o.status === "Cancelled";
                                            return true;
                                        }).map((order) => {
                                            const isConfirmed = order.status?.toLowerCase().includes("confirm");
                                            const isCancelled = order.status === "Cancelled";
                                            const isPending = order.status === "Pending";
                                            const itemsList = order.items || [];

                                            return (
                                                <tr key={order.id} className={`order-row ${order.status?.toLowerCase()}`}>
                                                    <td>
                                                        <span className="order-id-badge">{order.id}</span>
                                                    </td>
                                                    <td>
                                                        <div className="order-items-preview">
                                                            {itemsList.length === 0 ? (
                                                                <span className="no-items-text">Items registered</span>
                                                            ) : (
                                                                itemsList.slice(0, 3).map((it, idx) => (
                                                                    <div key={idx} className="order-item-chip">
                                                                        <span>{it.product_name}</span>
                                                                        <span className="qty-tag">×{it.quantity}</span>
                                                                    </div>
                                                                ))
                                                            )}
                                                            {itemsList.length > 3 && (
                                                                <span className="more-items-tag">+{itemsList.length - 3} more</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td style={{ fontWeight: 800, color: "#111827", fontSize: "15px" }}>
                                                        ₹{Number(order.total_amount).toFixed(2)}
                                                    </td>
                                                    <td>
                                                        {isConfirmed ? (
                                                            <span className="status-pill confirmed">
                                                                ✓ Confirmed
                                                            </span>
                                                        ) : isCancelled ? (
                                                            <span className="status-pill cancelled">
                                                                ✕ Cancelled
                                                            </span>
                                                        ) : (
                                                            <span className="status-pill pending">
                                                                ⏳ Pending
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="order-action-buttons">
                                                            {isPending && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        className="confirm-order-btn"
                                                                        onClick={() => handleConfirmOrder(order.id)}
                                                                        title="Confirm this order"
                                                                    >
                                                                        ✓ Confirm
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="cancel-order-btn"
                                                                        onClick={() => handleCancelOrder(order.id)}
                                                                        title="Cancel this order"
                                                                    >
                                                                        ✕ Cancel
                                                                    </button>
                                                                </>
                                                            )}
                                                            {isConfirmed && (
                                                                <div className="confirmed-action-group">
                                                                    <span className="status-confirmed-text">
                                                                        ✓ Confirmed
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        className="cancel-order-btn-outline"
                                                                        onClick={() => handleCancelOrder(order.id)}
                                                                        title="Cancel this order"
                                                                    >
                                                                        ✕ Cancel
                                                                    </button>
                                                                </div>
                                                            )}
                                                            {isCancelled && (
                                                                <span className="status-cancelled-text">
                                                                    ✕ Cancelled
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Responsive Order Cards View (<768px) */}
                        <div className="orders-mobile-cards-view">
                            {orders.filter(o => {
                                if (orderStatusFilter === "all") return true;
                                if (orderStatusFilter === "pending") return o.status === "Pending";
                                if (orderStatusFilter === "confirmed") return o.status?.toLowerCase().includes("confirm");
                                if (orderStatusFilter === "cancelled") return o.status === "Cancelled";
                                return true;
                            }).map((order) => {
                                const isConfirmed = order.status?.toLowerCase().includes("confirm");
                                const isCancelled = order.status === "Cancelled";
                                const isPending = order.status === "Pending";

                                return (
                                    <div key={order.id} className={`mobile-order-card ${order.status?.toLowerCase()}`}>
                                        <div className="mobile-order-header">
                                            <span className="order-id-badge">Order {order.id}</span>
                                            {isConfirmed ? (
                                                <span className="status-pill confirmed">✓ Confirmed</span>
                                            ) : isCancelled ? (
                                                <span className="status-pill cancelled">✕ Cancelled</span>
                                            ) : (
                                                <span className="status-pill pending">⏳ Pending</span>
                                            )}
                                        </div>

                                        <div className="mobile-order-body">
                                            <div className="mobile-order-field">
                                                <span className="label">Total Amount:</span>
                                                <span className="val price">₹{Number(order.total_amount).toFixed(2)}</span>
                                            </div>
                                            {(order.items || []).length > 0 && (
                                                <div className="mobile-order-items-preview">
                                                    <span className="label">Items:</span>
                                                    <div className="items-tags">
                                                        {(order.items || []).map((it, idx) => (
                                                            <span key={idx} className="item-tag">{it.product_name} (×{it.quantity})</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mobile-order-actions">
                                            {isPending && (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="confirm-order-btn full"
                                                        onClick={() => handleConfirmOrder(order.id)}
                                                    >
                                                        ✓ Confirm Order
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="cancel-order-btn full"
                                                        onClick={() => handleCancelOrder(order.id)}
                                                    >
                                                        ✕ Cancel Order
                                                    </button>
                                                </>
                                            )}
                                            {isConfirmed && (
                                                <button
                                                    type="button"
                                                    className="cancel-order-btn-outline full"
                                                    onClick={() => handleCancelOrder(order.id)}
                                                >
                                                    ✕ Cancel Order & Restore Stock
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : activeTab === "customers" ? (
                    /* TAB: CUSTOMER DIRECTORY & ORDERS VIEW */
                    <div className="admin-customers-wrapper">
                        <div className="customers-overview-header">
                            <div className="customers-header-title">
                                <h3>👥 Customer Directory & Orders History</h3>
                                <p>Database-backed registered users, total spending, and comprehensive order records.</p>
                            </div>

                            <div className="header-right-actions">
                                <div className="customers-search-box">
                                    <input
                                        type="text"
                                        placeholder="🔍 Search customers by name, email, phone, city..."
                                        value={customerSearchQuery}
                                        onChange={(e) => setCustomerSearchQuery(e.target.value)}
                                    />
                                    {customerSearchQuery && (
                                        <button 
                                            type="button" 
                                            className="clear-search-btn"
                                            onClick={() => setCustomerSearchQuery("")}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    className="screen-cancel-close-btn"
                                    onClick={() => setActiveTab("categories")}
                                    title="Close Customers view and return to Categories"
                                >
                                    ✕ Close
                                </button>
                            </div>
                        </div>

                        {/* Customer Metrics Summary */}
                        <div className="customers-stats-row">
                            <div className="customer-stat-card">
                                <span className="stat-icon">👥</span>
                                <div>
                                    <span className="stat-val">{customers.length}</span>
                                    <span className="stat-lbl">Registered Customers</span>
                                </div>
                            </div>
                            <div className="customer-stat-card">
                                <span className="stat-icon">🛍️</span>
                                <div>
                                    <span className="stat-val">{customers.filter(c => (c.total_orders || 0) > 0).length}</span>
                                    <span className="stat-lbl">Active Buyers</span>
                                </div>
                            </div>
                            <div className="customer-stat-card">
                                <span className="stat-icon">📦</span>
                                <div>
                                    <span className="stat-val">{customers.reduce((s, c) => s + (c.total_orders || 0), 0)}</span>
                                    <span className="stat-lbl">Total Orders Placed</span>
                                </div>
                            </div>
                            <div className="customer-stat-card">
                                <span className="stat-icon">💰</span>
                                <div>
                                    <span className="stat-val">₹{customers.reduce((s, c) => s + Number(c.total_spent || 0), 0).toFixed(2)}</span>
                                    <span className="stat-lbl">Total Customer Revenue</span>
                                </div>
                            </div>
                        </div>

                        {/* Customers List & Orders History */}
                        <div className="customers-directory-list">
                            {customers.filter(c => {
                                if (!customerSearchQuery.trim()) return true;
                                const q = customerSearchQuery.toLowerCase().trim();
                                return (
                                    (c.fullName && c.fullName.toLowerCase().includes(q)) ||
                                    (c.email && c.email.toLowerCase().includes(q)) ||
                                    (c.phone && c.phone.toLowerCase().includes(q)) ||
                                    (c.city && c.city.toLowerCase().includes(q)) ||
                                    String(c.id).includes(q)
                                );
                            }).length === 0 ? (
                                <div className="no-customers-found">
                                    <span>🔍 No customers match your search criteria.</span>
                                </div>
                            ) : (
                                customers.filter(c => {
                                    if (!customerSearchQuery.trim()) return true;
                                    const q = customerSearchQuery.toLowerCase().trim();
                                    return (
                                        (c.fullName && c.fullName.toLowerCase().includes(q)) ||
                                        (c.email && c.email.toLowerCase().includes(q)) ||
                                        (c.phone && c.phone.toLowerCase().includes(q)) ||
                                        (c.city && c.city.toLowerCase().includes(q)) ||
                                        String(c.id).includes(q)
                                    );
                                }).map((cust) => {
                                    const isExpanded = expandedCustomerIds.has(cust.id);
                                    const userOrders = cust.orders || [];

                                    return (
                                        <div className="customer-master-card" key={cust.id}>
                                            <div className="customer-card-header">
                                                <div className="customer-identity">
                                                    <div className="customer-avatar-badge">
                                                        {(cust.fullName || cust.email || "U").charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="customer-meta">
                                                        <div className="customer-name-row">
                                                            <h4>{cust.fullName || "Unnamed Customer"}</h4>
                                                            <span className="customer-id-tag">ID: {cust.id}</span>
                                                            <span className={`role-badge ${cust.role?.toLowerCase()}`}>
                                                                {cust.role || "Customer"}
                                                            </span>
                                                        </div>
                                                        <div className="customer-contact-row">
                                                            <span className="contact-item">✉️ {cust.email}</span>
                                                            {cust.phone && <span className="contact-item">📞 {cust.phone}</span>}
                                                            {cust.city && <span className="contact-item">📍 {cust.city}</span>}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="customer-financials">
                                                    <div className="financial-item">
                                                        <span className="fin-label">Orders</span>
                                                        <span className="fin-val">{cust.total_orders || 0}</span>
                                                    </div>
                                                    <div className="financial-item">
                                                        <span className="fin-label">Total Spent</span>
                                                        <span className="fin-val highlight">₹{Number(cust.total_spent || 0).toFixed(2)}</span>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        className={`toggle-customer-orders-btn ${isExpanded ? "open" : ""}`}
                                                        onClick={() => toggleCustomerExpand(cust.id)}
                                                    >
                                                        {isExpanded ? "Hide Orders ▲" : `View Orders (${userOrders.length}) ▼`}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Expandable Order History for this specific customer */}
                                            {isExpanded && (
                                                <div className="customer-orders-drawer">
                                                    <h5>📦 Order History for {cust.fullName || cust.email}:</h5>
                                                    {userOrders.length === 0 ? (
                                                        <p className="no-customer-orders-text">
                                                            This customer has not placed any marketplace orders yet.
                                                        </p>
                                                    ) : (
                                                        <div className="customer-orders-table-wrapper">
                                                            <table className="admin-product-table inner-orders-table">
                                                                <thead>
                                                                    <tr>
                                                                        <th>Order ID</th>
                                                                        <th>Date & Time</th>
                                                                        <th>Items</th>
                                                                        <th>Amount</th>
                                                                        <th>Status</th>
                                                                        <th>Actions</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {userOrders.map((ord) => {
                                                                        const isOrdConfirmed = ord.status?.toLowerCase().includes("confirm");
                                                                        const isOrdCancelled = ord.status === "Cancelled";
                                                                        const isOrdPending = ord.status === "Pending";

                                                                        const formattedTime = ord.created_at
                                                                            ? new Date(ord.created_at).toLocaleString("en-IN", {
                                                                                dateStyle: "short",
                                                                                timeStyle: "short"
                                                                            })
                                                                            : "Recent";

                                                                        return (
                                                                            <tr key={ord.id}>
                                                                                <td>
                                                                                    <span className="order-id-badge">{ord.id}</span>
                                                                                </td>
                                                                                <td style={{ fontSize: "13px", color: "#64748b" }}>
                                                                                    {formattedTime}
                                                                                </td>
                                                                                <td>
                                                                                    <div className="inner-items-list">
                                                                                        {(ord.items || []).map((it, i) => (
                                                                                            <span key={i} className="inner-item-chip">
                                                                                                {it.product_name} (×{it.quantity})
                                                                                            </span>
                                                                                        ))}
                                                                                    </div>
                                                                                </td>
                                                                                <td style={{ fontWeight: 700 }}>
                                                                                    ₹{Number(ord.total_amount).toFixed(2)}
                                                                                </td>
                                                                                <td>
                                                                                    {isOrdConfirmed ? (
                                                                                        <span className="status-pill confirmed">✓ Confirmed</span>
                                                                                    ) : isOrdCancelled ? (
                                                                                        <span className="status-pill cancelled">✕ Cancelled</span>
                                                                                    ) : (
                                                                                        <span className="status-pill pending">⏳ Pending</span>
                                                                                    )}
                                                                                </td>
                                                                                <td>
                                                                                    <div className="order-action-buttons">
                                                                                        {isOrdPending && (
                                                                                            <>
                                                                                                <button
                                                                                                    type="button"
                                                                                                    className="confirm-order-btn"
                                                                                                    onClick={() => handleConfirmOrder(ord.id)}
                                                                                                >
                                                                                                    ✓ Confirm
                                                                                                </button>
                                                                                                <button
                                                                                                    type="button"
                                                                                                    className="cancel-order-btn"
                                                                                                    onClick={() => handleCancelOrder(ord.id)}
                                                                                                >
                                                                                                    ✕ Cancel
                                                                                                </button>
                                                                                            </>
                                                                                        )}
                                                                                        {isOrdConfirmed && (
                                                                                            <button
                                                                                                type="button"
                                                                                                className="cancel-order-btn-outline"
                                                                                                onClick={() => handleCancelOrder(ord.id)}
                                                                                            >
                                                                                                ✕ Cancel
                                                                                            </button>
                                                                                        )}
                                                                                        {isOrdCancelled && (
                                                                                            <span className="status-cancelled-text">✕ Cancelled</span>
                                                                                        )}
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                ) : activeTab === "categories" ? (
                    <div className="categories-view-wrapper">
                        {/* Categories Overview Bar */}
                        <div className="categories-header-bar">
                            <div className="categories-header-title">
                                <h3> Categories ({categoryStats.length})</h3>
                                <p>
                                    Products deduplicated across catalog & new arrivals (Total: <strong>{totalUniqueProductsCount} unique products</strong>, <strong>{totalBothCount} present in both</strong>).
                                </p>
                            </div>

                            <div className="categories-search-box">
                                <input
                                    type="text"
                                    placeholder="🔍 Search categories..."
                                    value={categorySearchQuery}
                                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                                />
                                {categorySearchQuery && (
                                    <button 
                                        className="clear-search-btn"
                                        onClick={() => setCategorySearchQuery("")}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Categories Cards Grid */}
                        <div className="category-cards-grid">
                            {/* "All Categories" Summary Card */}
                            <div 
                                className={`category-summary-card ${selectedCategory === null && showCategoryProducts ? "selected" : ""}`}
                                onClick={() => {
                                    if (selectedCategory === null && showCategoryProducts) {
                                        setShowCategoryProducts(false);
                                    } else {
                                        setSelectedCategory(null);
                                        setShowCategoryProducts(true);
                                        setTimeout(() => {
                                            const el = document.getElementById("category-products-section");
                                            if (el) el.scrollIntoView({ behavior: "smooth" });
                                        }, 80);
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setSelectedCategory(null);
                                        setShowCategoryProducts(true);
                                    }
                                }}
                            >
                                <div className="cat-card-icon-wrap all-cat-icon">
                                    📁
                                </div>
                                <div className="cat-card-info">
                                    <h4>All Categories</h4>
                                    <div className="cat-product-count-badge">
                                        {totalUniqueProductsCount} Unique Products
                                    </div>
                                </div>
                                <div className="cat-breakdown-row">
                                    <span className="cat-tag allprod">📦 {allproducts.length} in Catalog</span>
                                    <span className="cat-tag newarr">✨ {newarrivals.length} in New</span>
                                    <span className="cat-tag both">⭐ {totalBothCount} in Both</span>
                                </div>
                                <div className="cat-card-footer">
                                    <button 
                                        type="button"
                                        className="view-cat-products-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (selectedCategory === null && showCategoryProducts) {
                                                setShowCategoryProducts(false);
                                            } else {
                                                setSelectedCategory(null);
                                                setShowCategoryProducts(true);
                                                setTimeout(() => {
                                                    const el = document.getElementById("category-products-section");
                                                    if (el) el.scrollIntoView({ behavior: "smooth" });
                                                }, 80);
                                            }
                                        }}
                                    >
                                        {selectedCategory === null && showCategoryProducts ? "Showing All Products ✓" : `View All Products (${totalUniqueProductsCount}) →`}
                                    </button>
                                </div>
                                {selectedCategory === null && showCategoryProducts && (
                                    <div className="selected-indicator-badge">✓ Active View</div>
                                )}
                            </div>

                            {/* Individual Category Cards */}
                            {filteredCategoryStats.map((cat) => {
                                const isSelected = selectedCategory?.toLowerCase() === cat.name.toLowerCase();
                                const isCardActive = isSelected && showCategoryProducts;
                                return (
                                    <div
                                        key={cat.id || cat.name}
                                        className={`category-summary-card ${isCardActive ? "selected" : ""}`}
                                        onClick={() => {
                                            if (isCardActive) {
                                                setShowCategoryProducts(false);
                                            } else {
                                                setSelectedCategory(cat.name);
                                                setShowCategoryProducts(true);
                                                setTimeout(() => {
                                                    const el = document.getElementById("category-products-section");
                                                    if (el) el.scrollIntoView({ behavior: "smooth" });
                                                }, 80);
                                            }
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                setSelectedCategory(cat.name);
                                                setShowCategoryProducts(true);
                                            }
                                        }}
                                    >
                                        <div className="cat-card-header">
                                            {cat.image ? (
                                                <img
                                                    src={`http://localhost:5001/assets/${cat.image}`}
                                                    alt={cat.name}
                                                    className="cat-thumb-img"
                                                    onError={(e) => {
                                                        e.target.style.display = "none";
                                                        e.target.nextSibling.style.display = "flex";
                                                    }}
                                                />
                                            ) : null}
                                            <div 
                                                className="cat-card-icon-wrap" 
                                                style={{ display: cat.image ? "none" : "flex" }}
                                            >
                                                🏷️
                                            </div>

                                            <span className={`status-pill ${cat.totalCount > 0 ? "has-items" : "empty"}`}>
                                                {cat.totalCount} {cat.totalCount === 1 ? "Product" : "Products"}
                                            </span>
                                        </div>

                                        <div className="cat-card-info">
                                            <h4>{cat.name}</h4>
                                        </div>

                                        <div className="cat-breakdown-row">
                                            <span className="cat-tag allprod" title="Products in All Products catalog">
                                                📦 {cat.allCount} Catalog
                                            </span>
                                            <span className="cat-tag newarr" title="Products in New Arrivals">
                                                ✨ {cat.newCount} New
                                            </span>
                                            {cat.bothCount > 0 && (
                                                <span className="cat-tag both" title="Products present in both tables simultaneously">
                                                    ⭐ {cat.bothCount} in Both
                                                </span>
                                            )}
                                        </div>

                                        <div className="cat-card-footer">
                                            <button 
                                                type="button"
                                                className="view-cat-products-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (isCardActive) {
                                                        setShowCategoryProducts(false);
                                                    } else {
                                                        setSelectedCategory(cat.name);
                                                        setShowCategoryProducts(true);
                                                        setTimeout(() => {
                                                            const el = document.getElementById("category-products-section");
                                                            if (el) el.scrollIntoView({ behavior: "smooth" });
                                                        }, 80);
                                                    }
                                                }}
                                            >
                                                {isCardActive ? "Showing Products ✓" : `View Products (${cat.totalCount}) →`}
                                            </button>
                                        </div>

                                        {isCardActive && (
                                            <div className="selected-indicator-badge">✓ Selected</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Section for Products within the selected category */}
                        {showCategoryProducts && (
                            <div className="category-products-container" id="category-products-section">
                                <div className="category-products-header">
                                    <div className="cat-title-group">
                                        <h3>
                                            {selectedCategory 
                                                ? `🏷️ Products in Category: "${selectedCategory}"` 
                                                : "📦 All Unique Products Across All Categories"}
                                        </h3>
                                        <span className="product-results-count">
                                            {categoryViewProducts.length} {categoryViewProducts.length === 1 ? "unique product" : "unique products"}
                                        </span>
                                    </div>

                                    <div className="category-header-actions">
                                        <button 
                                            type="button"
                                            className="screen-cancel-close-btn"
                                            onClick={() => {
                                                setShowCategoryProducts(false);
                                                setSelectedCategory(null);
                                            }}
                                            title="Close products section and return to categories overview"
                                        >
                                            ✕ Close
                                        </button>
                                        <button 
                                        type="button"
                                            className="quick-add-cat-btn"
                                            onClick={() => setShowCategoryForm(selectedCategory)}
                                        >
                                            + Add Product {selectedCategory ? `to ${selectedCategory}` : ""}
                                        </button>
                                    </div>
                                </div>

                                {/* Table of Category Products */}
                                <div className="admin-table-container">
                                    <table className="admin-product-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Code</th>
                                                <th>Image</th>
                                                <th>Name</th>
                                                <th>Category</th>
                                                <th>Price</th>
                                                <th>Section / Presence</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categoryViewProducts.length === 0 ? (
                                                <tr>
                                                    <td colSpan="8" className="empty-category-cell">
                                                        <div className="empty-category-state">
                                                            <div className="empty-state-icon">🏷️</div>
                                                            <h4>No products in this category yet</h4>
                                                            <p>Add a product to "{selectedCategory || 'this category'}" to see it listed here.</p>
                                                            <button
                                                                className="quick-add-cat-btn"
                                                                onClick={() => openAddProductWithCategory(selectedCategory)}
                                                            >
                                                                + Add First Product to {selectedCategory || "Category"}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                categoryViewProducts.map((product) => (
                                                    <tr key={`cat-prod-${product.allProductId || product.newArrivalId}-${product.name}`}>
                                                        <td>
                                                            {product.allProductId ? product.allProductId : product.newArrivalId}
                                                        </td>
                                                        <td>
                                                            <span className="product-code-tag">
                                                                {product.product_code || "-"}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <img
                                                                className="admin-product-image"
                                                                src={`http://localhost:5001/assets/${product.image}`}
                                                                alt={product.name}
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = "https://placehold.co/60x60?text=Item";
                                                                }}
                                                            />
                                                        </td>
                                                        <td style={{ fontWeight: 600 }}>{product.name}</td>
                                                        <td>
                                                            <span 
                                                                className="category-badge clickable-badge"
                                                                onClick={() => setSelectedCategory(product.category)}
                                                                title="Filter by this category"
                                                            >
                                                                {product.category}
                                                            </span>
                                                        </td>
                                                        <td style={{ fontWeight: 700, color: "#111827" }}>₹{product.price}</td>
                                                        <td>
                                                            <span className={`type-badge ${product.sourceType}`}>
                                                                {product.sourceType === "both" && "⭐ Both (Catalog & New)"}
                                                                {product.sourceType === "newarrivals" && "✨ New Arrival"}
                                                                {product.sourceType === "allproducts" && "📦 All Products"}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="edit-btn"
                                                                onClick={() => handleEditClick(product, product.sourceType)}
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                className="delete-btn"
                                                                onClick={() => handleDeleteCategoryProduct(product)}
                                                            >
                                                                Remove
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* TABS: ALL PRODUCTS / NEW ARRIVALS DEFAULT TABLES */
                    <div className="admin-catalog-view-wrapper">
                        <div className="catalog-overview-header">
                            <div className="catalog-header-title">
                                <h3>
                                    {activeTab === "newarrivals" ? "✨ New Arrivals Catalog" : "📦 All Products Catalog"} ({(activeTab === "newarrivals" ? newarrivals : allproducts).length})
                                </h3>
                                <p>Manage individual catalog products, pricing, stock levels, and marketplace placement.</p>
                            </div>
                            <button
                                type="button"
                                className="screen-cancel-close-btn"
                                onClick={() => setActiveTab("categories")}
                                title="Close catalog view and return to Categories"
                            >
                                ✕ Close
                            </button>
                        </div>
                        <div className="admin-table-container">
                            <table className="admin-product-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Code</th>
                                        <th>Image</th>
                                        <th>Name</th>
                                        <th>Category</th>
                                        <th>Price</th>
                                        <th>Section</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(activeTab === "newarrivals" ? newarrivals : allproducts).length === 0 ? (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: "center", padding: "35px", color: "#6b7280" }}>
                                                No products found in {activeTab === "newarrivals" ? "New Arrivals" : "All Products"}.
                                            </td>
                                        </tr>
                                    ) : (
                                        (activeTab === "newarrivals" ? newarrivals : allproducts).map((product) => (
                                            <tr key={product.id}>
                                                <td>{product.id}</td>
                                                <td>
                                                    <span className="product-code-badge">
                                                        {product.product_code || "N/A"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <img
                                                        src={`http://localhost:5001/assets/${product.image}`}
                                                        alt={product.name}
                                                        className="admin-product-image"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = "https://placehold.co/50x50?text=No+Image";
                                                        }}
                                                    />
                                                </td>
                                                <td className="product-name-cell">{product.name}</td>
                                                <td>
                                                    <span 
                                                        className="category-pill-badge clickable"
                                                        title="Click to view all products in this category"
                                                        onClick={() => {
                                                            setSelectedCategory(product.category);
                                                            setActiveTab("categories");
                                                        }}
                                                    >
                                                        🏷️ {product.category || "Uncategorized"}
                                                    </span>
                                                </td>
                                                <td className="product-price-cell">₹{product.price}</td>
                                                <td>
                                                    <span className={`type-badge ${activeTab}`}>
                                                        {activeTab === "newarrivals" ? "✨ New Arrival" : "📦 All Product"}
                                                    </span>
                                                </td>
                                                <td className="action-buttons">
                                                    <button
                                                        className="edit-btn"
                                                        onClick={() => handleEditClick(product, activeTab)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="delete-btn"
                                                        onClick={() => handleDeleteProduct(product.id, activeTab)}
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </section>
        </>
    );
}

export default AdminDashboard;
