import { PRODUCT_FIELD_LIMITS, validateProductField } from "../utils/productValidation";

function ProductEditModal({
    editingProduct,
    setEditingProduct,
    errors,
    setErrors,
    onSaveEdit
}) {
    if (!editingProduct) return null;

    const handleFieldChange = (field, value) => {
        const fieldError = validateProductField(field, value);

        setEditingProduct((previousProduct) => ({
            ...previousProduct,
            [field]: value
        }));
        setErrors((previousErrors) => ({
            ...previousErrors,
            [field]: fieldError
        }));
    };

    return (
        <div className="edit-modal-backdrop" 
        onClick={() => 
        setEditingProduct(null)}
        >

            <form 
                className="edit-product-form" 
                onSubmit={onSaveEdit}
                onClick={(e) => e.stopPropagation()}
                noValidate
            >
                <h3>
                    Edit Product {editingProduct.product_code ? `(${editingProduct.product_code})` : ""}
                </h3>
                {editingProduct.product_code && (
                    <p className="edit-sync-notice">
                        🔄 Synced by <strong>{editingProduct.product_code}</strong>: Updates will apply across both tables.
                    </p>
                )}

                <div className="form-group">
                    <label>Product Name</label>
                    <input
                        type="text"
                        value={editingProduct.name}
                        onChange={(e) => handleFieldChange("name", e.target.value)}
                        className={errors.name ? "input-error" : ""}
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby="edit-product-name-count edit-product-name-error"
                        required
                    />
                    <small id="edit-product-name-count" className={`field-character-count ${editingProduct.name.length > PRODUCT_FIELD_LIMITS.name.max ? "over-limit" : ""}`}>
                        {editingProduct.name.length}/{PRODUCT_FIELD_LIMITS.name.max} characters
                    </small>
                    {errors.name && <p id="edit-product-name-error" className="error-message" role="alert">{errors.name}</p>}
                </div>

                <div className="form-group">
                    <label>Price (₹)</label>
                    <input
                        type="number"
                        value={editingProduct.price}
                        onChange={(e) => handleFieldChange("price", e.target.value)}
                        className={errors.price ? "input-error" : ""}
                        aria-invalid={Boolean(errors.price)}
                        aria-describedby="edit-product-price-error"
                        required
                    />
                    {errors.price && <p id="edit-product-price-error" className="error-message" role="alert">{errors.price}</p>}
                </div>

                <div className="form-group">
                    <label>Category</label>
                    <input
                        type="text"
                        value={editingProduct.category}
                        onChange={(e) => handleFieldChange("category", e.target.value)}
                        className={errors.category ? "input-error" : ""}
                        aria-invalid={Boolean(errors.category)}
                        aria-describedby="edit-product-category-count edit-product-category-error"
                        required
                    />
                    <small id="edit-product-category-count" className={`field-character-count ${editingProduct.category.length > PRODUCT_FIELD_LIMITS.category.max ? "over-limit" : ""}`}>
                        {editingProduct.category.length}/{PRODUCT_FIELD_LIMITS.category.max} characters
                    </small>
                    {errors.category && <p id="edit-product-category-error" className="error-message" role="alert">{errors.category}</p>}
                </div>

                <div className="form-group">
                    <label>Image Filename</label>
                    <input
                        type="text"
                        value={editingProduct.image}
                        onChange={(e) => handleFieldChange("image", e.target.value)}
                        className={errors.image ? "input-error" : ""}
                        aria-invalid={Boolean(errors.image)}
                        aria-describedby="edit-product-image-count edit-product-image-error"
                        required
                    />
                    <small id="edit-product-image-count" className={`field-character-count ${editingProduct.image.length > PRODUCT_FIELD_LIMITS.image.max ? "over-limit" : ""}`}>
                        {editingProduct.image.length}/{PRODUCT_FIELD_LIMITS.image.max} characters
                    </small>
                    {errors.image && <p id="edit-product-image-error" className="error-message" role="alert">{errors.image}</p>}
                </div>
                
                <div className="form-group">
                    <label>Stock Quantity</label>
                    <input 
                    id="edit-product-stock"
                    name="stock"
                    type="number"
                    min="0"
                    value={editingProduct.stock ?? ""}
                    onChange={(e) => handleFieldChange("stock", e.target.value)}
                    className={errors.stock ? "input-error" : ""}
                    aria-invalid={Boolean(errors.stock)}
                    aria-describedby="edit-product-stock-error"
                    required
                    />
                    {errors.stock && <p id="edit-product-stock-error" className="error-message" role="alert">{errors.stock}</p>}
                </div>

                <div className="form-buttons">
                    <button type="submit" className="save-product-btn">Update Product</button>
                    <button type="button" className="cancel-product-btn" onClick={() => setEditingProduct(null)}>Cancel</button>
                </div>
            </form>
        </div>
    );
}

export default ProductEditModal;
