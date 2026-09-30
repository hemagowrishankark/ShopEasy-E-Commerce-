import { Link } from "react-router-dom";

function ProductPageCard({
    productId,
    name,
    price,
    image,
    category,
    stock,
    slug,
    onAddToCart
}) {
    // Generate slug from name if not provided
    const productSlug = slug || name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const stockLabel = stock > 10
        ? null
        : stock > 0
        ? <span className="card-low-stock">Only {stock} left</span>
        : <span className="card-out-of-stock">Out of Stock</span>;

    return (
        <div className="product-page-card">
            {/* Clickable image → product detail */}
            <Link to={`/product/${productSlug}`} className="product-image-link">
                <div className="product-image">
                    <img src={image} alt={name} loading="lazy" />
                    {stock < 1 && <div className="product-oos-overlay">Out of Stock</div>}
                </div>
            </Link>

            <div className="product-page-info">
                <span className="product-category">{category}</span>

                {/* Clickable name → product detail */}
                <Link to={`/product/${productSlug}`} className="product-name-link">
                    <h2>{name}</h2>
                </Link>

                <p className="product-page-price">₹{Number(price).toLocaleString("en-IN")}</p>

                {stockLabel && <p className="product-page-stock">{stockLabel}</p>}

                <div className="card-actions">
                    <button
                        className="addtocart"
                        onClick={() => onAddToCart(productId)}
                        disabled={stock < 1}
                        title={stock < 1 ? "Out of stock" : "Add to cart"}
                    >
                        {stock < 1 ? "Unavailable" : "Add to Cart"}
                    </button>
                    <Link to={`/product/${productSlug}`} className="view-details-btn">
                        View Details
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default ProductPageCard;