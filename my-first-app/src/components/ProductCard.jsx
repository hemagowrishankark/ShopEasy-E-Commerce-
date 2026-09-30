import { Link } from "react-router-dom";

function ProductCard({
    productId,
    name,
    price,
    image,
    stock,
    slug,
    sizes,
    variant_type,
    onAddToCart
}) {
    const productSlug = slug || name?.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "";
    const hasVariants = Boolean(sizes && sizes.trim().length > 0) || (variant_type && variant_type !== "none");

    return (
        <div className="product-Card">
            <Link to={`/product/${productSlug}`} className="product-image-link" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                <div className="product-Image">
                    <img 
                        src={image}
                        alt={name}
                        loading="lazy"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://placehold.co/300x300?text=Product";
                        }}
                    />
                </div>
            </Link>
            
            <div className="product-info">
                <Link to={`/product/${productSlug}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <h2>{name}</h2>
                </Link>

                <p className="product-price">
                    ₹{Number(price).toLocaleString("en-IN")}
                </p>
                <p className="product-stock">
                    Stock: {stock}
                </p>

                <div className="card-actions" style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                    {hasVariants ? (
                        <Link 
                            to={`/product/${productSlug}`}
                            className="addtocart"
                            style={{ textAlign: "center", textDecoration: "none", display: "inline-block", flex: 1 }}
                        >
                            Select Options
                        </Link>
                    ) : (
                        <button
                            className="addtocart"
                            onClick={() => onAddToCart(productId)}
                            disabled={stock < 1}
                            style={{ flex: 1 }}
                        >
                            {stock < 1 ? "Out of Stock" : "Add to Cart"}
                        </button>
                    )}
                    <Link
                        to={`/product/${productSlug}`}
                        className="view-details-btn"
                        style={{
                            padding: "8px 12px",
                            background: "#f1f5f9",
                            color: "#334155",
                            borderRadius: "8px",
                            textDecoration: "none",
                            fontWeight: 600,
                            fontSize: "13px",
                            display: "inline-flex",
                            alignItems: "center"
                        }}
                    >
                        Details
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default ProductCard;