import { PRODUCT_FIELD_LIMITS, validateProductField } from "../utils/productValidation";

function ProductFormModal({
    showForm,
    setShowForm,
    productForm,
    setProductForm,
    errors,
    setErrors,
    onSubmit
}) {
    if (!showForm) return null;

    const handleFieldChange = (field, value) => {
        const fieldError = validateProductField(field, value);

        setProductForm((previousForm) => ({
            ...previousForm,
            [field]: value
        }));
        setErrors((previousErrors) => ({
            ...previousErrors,
            [field]: fieldError,
            general: ""
        }));
    };

    return (
        <form className="add-product-form" 
            onSubmit={onSubmit} noValidate>
            <h3>Add New Product</h3>

            {errors.general && (
                <div className="form-error-banner" role="alert">
                    ⚠️ {errors.general}
                </div>
            )}

            <div className="form-grid">
                <div className="form-group">
                    <label>Product Name</label>
                    <input
                        type="text"
                        placeholder="e.g. Wireless Noise-Cancelling Headphones"
                        value={productForm.name}
                        onChange={(e) => handleFieldChange("name", e.target.value)}
                        className={errors.name ? "input-error" : ""}
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby="add-product-name-count add-product-name-error"
                        required
                    />
                    <small id="add-product-name-count" className={`field-character-count ${productForm.name.length > PRODUCT_FIELD_LIMITS.name.max ? "over-limit" : ""}`}>
                        {productForm.name.length}/{PRODUCT_FIELD_LIMITS.name.max} characters
                    </small>
                    {errors.name && (
                        <p id="add-product-name-error" className="error-message" role="alert">
                            {errors.name}
                        </p>
                    )}
                </div>

                <div className="form-group">
                    <label>Price (₹)</label>
                    <input
                        type="number"
                        placeholder="e.g. 1499"
                        value={productForm.price}
                        onChange={(e) => handleFieldChange("price", e.target.value)}
                        className={errors.price ? "input-error" : ""}
                        aria-invalid={Boolean(errors.price)}
                        aria-describedby="add-product-price-error"
                        required
                    />
                    {errors.price && (
                        <p id="add-product-price-error" className="error-message" role="alert">
                            {errors.price}
                        </p>
                    )}
                </div>

                <div className="form-group">
                    <label>Category</label>
                    <input
                        type="text"
                        placeholder="e.g. Electronics, Fashion, Home Decor"
                        value={productForm.category}
                        onChange={(e) => handleFieldChange("category", e.target.value)}
                        className={errors.category ? "input-error" : ""}
                        aria-invalid={Boolean(errors.category)}
                        aria-describedby="add-product-category-count add-product-category-error"
                        required
                    />
                    <small id="add-product-category-count" className={`field-character-count ${productForm.category.length > PRODUCT_FIELD_LIMITS.category.max ? "over-limit" : ""}`}>
                        {productForm.category.length}/{PRODUCT_FIELD_LIMITS.category.max} characters
                    </small>
                    {errors.category && (
                        <p id="add-product-category-error" className="error-message" role="alert">
                            {errors.category}
                        </p>
                    )}
                </div>

                <div className="form-group">
                    <label>Image Filename / URL</label>
                    <input
                        type="text"
                        placeholder="e.g. product1.jpg or image.png"
                        value={productForm.image}
                        onChange={(e) => handleFieldChange("image", e.target.value)}
                        className={errors.image ? "input-error" : ""}
                        aria-invalid={Boolean(errors.image)}
                        aria-describedby="add-product-image-count add-product-image-error"
                        required
                    />
                    <small id="add-product-image-count" className={`field-character-count ${productForm.image.length > PRODUCT_FIELD_LIMITS.image.max ? "over-limit" : ""}`}>
                        {productForm.image.length}/{PRODUCT_FIELD_LIMITS.image.max} characters
                    </small>
                    {errors.image && (
                        <p id="add-product-image-error" className="error-message" role="alert">
                            {errors.image}
                        </p>
                    )}
                </div>

                    <div className="form-group">
                        <label>Stock Quantity</label>
                        <input 
                        id="add-product-stock"
                        name="stock"
                        type="number"
                        placeholder="e.g. 10"
                        min="0"
                        value={productForm.stock}
                        onChange={(e) => handleFieldChange("stock", e.target.value)}
                        className={errors.stock ? "input-error" : ""}
                        aria-invalid={Boolean(errors.stock)}
                        aria-describedby="add-product-stock-error"
                        required
                    />
                            {errors.stock && (
                                <p id="add-product-stock-error" className="error-message" role="alert">
                                    {errors.stock}
                                </p>
                            )}
                        
                    </div>


                <div className="form-group full-width">
                    <label className="type-select-label">
                        📌 Target Destination / Catalog Section:
                    </label>
                    <select
                        className="target-select"
                        value={productForm.targetType}
                        onChange={(e) => setProductForm({ ...productForm, targetType: e.target.value })}
                    >
                        <option value="allproducts">📦 All Products (Main Marketplace Catalog)</option>
                        <option value="newarrivals">✨ New Arrivals (Featured on Home Page)</option>
                        <option value="both">⭐ Both (Catalog & New Arrivals simultaneously)</option>
                    </select>
                    <small className="help-text">
                        {productForm.targetType === "allproducts" && "This product will be saved to the allproducts table (visible on the /products marketplace page)."}
                        {productForm.targetType === "newarrivals" && "This product will be saved to the newarrivals table (visible on the Home page showcase)."}
                        {productForm.targetType === "both" && "This product will be saved to BOTH allproducts and newarrivals tables simultaneously."}
                    </small>
                </div>
            </div>

            <div className="form-buttons">
                <button type="submit" className="save-product-btn">
                    Save Product to Catalog
                </button>
                <button type="button" className="cancel-product-btn" onClick={() => setShowForm(false)}>
                    Cancel
                </button>
            </div>
        </form>
    );
}

export default ProductFormModal;
