import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "./ProductDetail.css";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

function ProductDetail() {
    const { slug } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [cartMsg, setCartMsg] = useState(null);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        setLoading(true);
        setNotFound(false);
        fetch(`http://localhost:5001/api/product/${slug}`)
            .then((res) => {
                if (res.status === 404) { setNotFound(true); return null; }
                return res.json();
            })
            .then((data) => {
                if (data) {
                    setProduct(data);
                    // SEO: update document title and meta tags
                    document.title = data.meta_title || `${data.name} – ShopEasy`;
                    let metaDesc = document.querySelector("meta[name='description']");
                    if (!metaDesc) {
                        metaDesc = document.createElement("meta");
                        metaDesc.name = "description";
                        document.head.appendChild(metaDesc);
                    }
                    metaDesc.content = data.meta_description || `Buy ${data.name} at the best price on ShopEasy.`;

                    // Open Graph tags
                    const og = (prop, val) => {
                        let el = document.querySelector(`meta[property='${prop}']`);
                        if (!el) { el = document.createElement("meta"); el.setAttribute("property", prop); document.head.appendChild(el); }
                        el.content = val;
                    };
                    og("og:title", data.meta_title || data.name);
                    og("og:description", data.meta_description || `Buy ${data.name} on ShopEasy`);
                    og("og:type", "product");
                    og("og:url", window.location.href);
                    if (data.imageList && data.imageList[0]) {
                        og("og:image", `http://localhost:5001/assets/${data.imageList[0]}`);
                    }
                }
                setLoading(false);
            })
            .catch(() => { setNotFound(true); setLoading(false); });
    }, [slug]);

    const imageList = product?.imageList?.length
        ? product.imageList
        : product?.image
        ? [product.image]
        : [];

    const sizeList = product?.sizeList?.length
        ? product.sizeList
        : product?.sizes
        ? product.sizes.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

    const isDressCategory = /dress|clothing|fashion|wear|shirt|kurta|saree/i.test(
        product?.category || ""
    );

    const handleAddToCart = async () => {
        const token = localStorage.getItem("token");
        if (!token) { navigate("/login"); return; }
        if (isDressCategory && sizeList.length > 0 && !selectedSize) {
            setCartMsg({ type: "error", text: "Please select a size before adding to cart" });
            return;
        }
        if (product.stock < 1) {
            setCartMsg({ type: "error", text: "This product is out of stock" });
            return;
        }
        setAdding(true);
        try {
            const res = await fetch("http://localhost:5001/api/cart", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    productId: product.id,
                    productType: product.sourceType === "newarrivals" ? "newarrival" : "allproduct",
                    quantity,
                    size: selectedSize || null
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setCartMsg({ type: "success", text: "Added to cart! 🛒" });
            window.dispatchEvent(new Event("cartUpdated"));
            setTimeout(() => setCartMsg(null), 3000);
        } catch (err) {
            setCartMsg({ type: "error", text: err.message || "Failed to add to cart" });
        } finally {
            setAdding(false);
        }
    };

    if (loading) return (
        <main className="pd-page">
            <div className="pd-skeleton">
                <div className="pd-skeleton-img skeleton-pulse"></div>
                <div className="pd-skeleton-content">
                    <div className="skeleton-line skeleton-pulse" style={{ width: "60%" }}></div>
                    <div className="skeleton-line skeleton-pulse" style={{ width: "40%" }}></div>
                    <div className="skeleton-line skeleton-pulse" style={{ width: "80%" }}></div>
                </div>
            </div>
        </main>
    );

    if (notFound) return (
        <main className="pd-page">
            <div className="pd-not-found">
                <div className="pd-not-found-icon">🔍</div>
                <h1>Product Not Found</h1>
                <p>The product you're looking for doesn't exist or may have been removed.</p>
                <Link to="/products" className="pd-back-btn">← Back to Products</Link>
            </div>
        </main>
    );

    const stockStatus = product.stock > 10
        ? { cls: "in-stock", label: `In Stock (${product.stock})` }
        : product.stock > 0
        ? { cls: "low-stock", label: `Only ${product.stock} left!` }
        : { cls: "out-of-stock", label: "Out of Stock" };

    return (
        <main className="pd-page">
            {/* Breadcrumb */}
            <nav className="pd-breadcrumb" aria-label="breadcrumb">
                <Link to="/">Home</Link>
                <span>›</span>
                <Link to="/products">Products</Link>
                <span>›</span>
                <span className="pd-breadcrumb-current">{product.name}</span>
            </nav>

            {/* Schema.org structured data for SEO */}
            <script type="application/ld+json">{JSON.stringify({
                "@context": "https://schema.org/",
                "@type": "Product",
                "name": product.name,
                "description": product.description || "",
                "image": imageList.map(img => `http://localhost:5001/assets/${img}`),
                "sku": product.product_code || `PROD-${product.id}`,
                "brand": { "@type": "Brand", "name": "ShopEasy" },
                "offers": {
                    "@type": "Offer",
                    "url": window.location.href,
                    "priceCurrency": "INR",
                    "price": product.price,
                    "availability": product.stock > 0
                        ? "https://schema.org/InStock"
                        : "https://schema.org/OutOfStock"
                }
            })}</script>

            <div className="pd-container">
                {/* LEFT: Image Gallery */}
                <section className="pd-gallery">
                    {/* Thumbnail strip */}
                    {imageList.length > 1 && (
                        <div className="pd-thumbnails">
                            {imageList.map((img, i) => (
                                <button
                                    key={i}
                                    className={`pd-thumb ${selectedImage === i ? "pd-thumb-active" : ""}`}
                                    onClick={() => setSelectedImage(i)}
                                    title={`Image ${i + 1}`}
                                >
                                    <img src={`http://localhost:5001/assets/${img}`} alt={`${product.name} view ${i + 1}`} />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Main image */}
                    <div className="pd-main-image">
                        {imageList[selectedImage] ? (
                            <img
                                src={`http://localhost:5001/assets/${imageList[selectedImage]}`}
                                alt={product.name}
                            />
                        ) : (
                            <div className="pd-no-image">📦 No Image</div>
                        )}
                        <span className="pd-category-badge">{product.category}</span>
                    </div>
                </section>

                {/* RIGHT: Product Info */}
                <section className="pd-info">
                    <span className="pd-sku">SKU: {product.product_code || `PROD-${product.id}`}</span>
                    <h1 className="pd-name">{product.name}</h1>

                    <div className="pd-price-row">
                        <span className="pd-price">₹{Number(product.price).toLocaleString("en-IN")}</span>
                        <span className={`pd-stock-badge ${stockStatus.cls}`}>{stockStatus.label}</span>
                    </div>

                    {/* Description */}
                    {product.description && (
                        <div className="pd-description">
                            <h2>About this product</h2>
                            <p>{product.description}</p>
                        </div>
                    )}

                    {/* Size Variants (for dress/clothing categories) */}
                    {(isDressCategory || sizeList.length > 0) && sizeList.length > 0 && (
                        <div className="pd-variants">
                            <h3 className="pd-variant-label">
                                Select Size
                                {selectedSize && <span className="pd-selected-size"> — {selectedSize}</span>}
                            </h3>
                            <div className="pd-size-grid">
                                {SIZES.filter(s => sizeList.includes(s)).map((size) => (
                                    <button
                                        key={size}
                                        className={`pd-size-btn ${selectedSize === size ? "pd-size-active" : ""}`}
                                        onClick={() => setSelectedSize(size === selectedSize ? null : size)}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                            {isDressCategory && sizeList.length > 0 && !selectedSize && (
                                <p className="pd-size-required">* Please select a size</p>
                            )}
                        </div>
                    )}

                    {/* Quantity */}
                    <div className="pd-quantity">
                        <h3>Quantity</h3>
                        <div className="pd-qty-control">
                            <button
                                className="pd-qty-btn"
                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                disabled={quantity <= 1}
                            >−</button>
                            <span className="pd-qty-display">{quantity}</span>
                            <button
                                className="pd-qty-btn"
                                onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                                disabled={quantity >= product.stock}
                            >+</button>
                        </div>
                    </div>

                    {/* Cart message */}
                    {cartMsg && (
                        <div className={`pd-cart-msg ${cartMsg.type}`} role="alert">
                            {cartMsg.text}
                        </div>
                    )}

                    {/* Add to Cart */}
                    <button
                        className="pd-add-to-cart-btn"
                        onClick={handleAddToCart}
                        disabled={adding || product.stock < 1}
                    >
                        {adding ? "Adding…" : product.stock < 1 ? "Out of Stock" : "🛒 Add to Cart"}
                    </button>

                    {/* Perks */}
                    <div className="pd-perks">
                        <div className="pd-perk"><span>🚚</span> Free delivery on orders over ₹499</div>
                        <div className="pd-perk"><span>🔄</span> Easy 7-day returns</div>
                        <div className="pd-perk"><span>🔒</span> Secure checkout</div>
                    </div>
                </section>
            </div>
        </main>
    );
}

export default ProductDetail;
