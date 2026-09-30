import { useState, useRef } from "react";
import { PRODUCT_FIELD_LIMITS, validateProductField } from "../utils/productValidation";

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

function ProductEditModal({
    editingProduct,
    setEditingProduct,
    errors,
    setErrors,
    onSaveEdit
}) {
    if (!editingProduct) return null;

    // Safe field access helpers — prevents crash on null/undefined
    const safeStr = (val) => String(val ?? "");
    const safeNum = (val) => (val !== null && val !== undefined ? val : "");

    const fileInputRef = useRef(null);
    const [uploadingEdit, setUploadingEdit] = useState(false);
    const [uploadEditError, setUploadEditError] = useState("");

    const handleFieldChange = (field, value) => {
        const fieldError = validateProductField(field, value);
        setEditingProduct((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: fieldError }));
    };

    // Parse existing images into array
    const currentImages = editingProduct.images
        ? editingProduct.images.split(",").map((s) => s.trim()).filter(Boolean)
        : editingProduct.image
        ? [editingProduct.image]
        : [];

    // Toggle size
    const toggleSize = (size) => {
        const current = editingProduct.sizes
            ? editingProduct.sizes.split(",").map((s) => s.trim()).filter(Boolean)
            : [];
        const updated = current.includes(size)
            ? current.filter((s) => s !== size)
            : [...current, size];
        setEditingProduct((prev) => ({ ...prev, sizes: updated.join(",") }));
    };

    const selectedSizes = editingProduct.sizes
        ? editingProduct.sizes.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

    // Upload additional images
    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        if (files.length + currentImages.length > 5) {
            setUploadEditError("Maximum 5 images allowed");
            return;
        }
        setUploadingEdit(true);
        setUploadEditError("");
        try {
            const token = localStorage.getItem("token");
            const formData = new FormData();
            files.forEach((f) => formData.append("images", f));
            const res = await fetch("http://localhost:5001/api/upload", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            const all = [...currentImages, ...data.filenames];
            setEditingProduct((prev) => ({
                ...prev,
                image: all[0] || prev.image,
                images: all.join(",")
            }));
        } catch (err) {
            setUploadEditError(err.message || "Upload failed");
        } finally {
            setUploadingEdit(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const removeImage = (filename) => {
        const updated = currentImages.filter((f) => f !== filename);
        setEditingProduct((prev) => ({
            ...prev,
            image: updated[0] || "",
            images: updated.join(",")
        }));
    };

    return (
        <div
            className="edit-modal-backdrop"
            onClick={() => setEditingProduct(null)}
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

                {/* Product Name */}
                <div className="form-group">
                    <label>Product Name</label>
                    <input
                        type="text"
                        value={safeStr(editingProduct.name)}
                        onChange={(e) => handleFieldChange("name", e.target.value)}
                        className={errors.name ? "input-error" : ""}
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby="edit-product-name-count edit-product-name-error"
                        required
                    />
                    <small id="edit-product-name-count" className={`field-character-count ${safeStr(editingProduct.name).length > PRODUCT_FIELD_LIMITS.name.max ? "over-limit" : ""}`}>
                        {safeStr(editingProduct.name).length}/{PRODUCT_FIELD_LIMITS.name.max} characters
                    </small>
                    {errors.name && <p id="edit-product-name-error" className="error-message" role="alert">{errors.name}</p>}
                </div>

                {/* Price */}
                <div className="form-group">
                    <label>Price (₹)</label>
                    <input
                        type="number"
                        value={safeNum(editingProduct.price)}
                        onChange={(e) => handleFieldChange("price", e.target.value)}
                        className={errors.price ? "input-error" : ""}
                        aria-invalid={Boolean(errors.price)}
                        aria-describedby="edit-product-price-error"
                        required
                    />
                    {errors.price && <p id="edit-product-price-error" className="error-message" role="alert">{errors.price}</p>}
                </div>

                {/* Category */}
                <div className="form-group">
                    <label>Category</label>
                    <input
                        type="text"
                        value={safeStr(editingProduct.category)}
                        onChange={(e) => handleFieldChange("category", e.target.value)}
                        className={errors.category ? "input-error" : ""}
                        aria-invalid={Boolean(errors.category)}
                        aria-describedby="edit-product-category-count edit-product-category-error"
                        required
                    />
                    <small id="edit-product-category-count" className={`field-character-count ${safeStr(editingProduct.category).length > PRODUCT_FIELD_LIMITS.category.max ? "over-limit" : ""}`}>
                        {safeStr(editingProduct.category).length}/{PRODUCT_FIELD_LIMITS.category.max} characters
                    </small>
                    {errors.category && <p id="edit-product-category-error" className="error-message" role="alert">{errors.category}</p>}
                </div>

                {/* Stock */}
                <div className="form-group">
                    <label>Stock Quantity</label>
                    <input
                        id="edit-product-stock"
                        name="stock"
                        type="number"
                        min="0"
                        value={safeNum(editingProduct.stock)}
                        onChange={(e) => handleFieldChange("stock", e.target.value)}
                        className={errors.stock ? "input-error" : ""}
                        aria-invalid={Boolean(errors.stock)}
                        aria-describedby="edit-product-stock-error"
                        required
                    />
                    {errors.stock && <p id="edit-product-stock-error" className="error-message" role="alert">{errors.stock}</p>}
                </div>

                {/* Description */}
                <div className="form-group">
                    <label>Product Description <span className="label-optional">(optional)</span></label>
                    <textarea
                        value={safeStr(editingProduct.description)}
                        onChange={(e) => setEditingProduct((prev) => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        maxLength={2000}
                        className="form-textarea"
                        placeholder="Describe the product…"
                    />
                    <small className="field-character-count">
                        {safeStr(editingProduct.description).length}/2000 characters
                    </small>
                </div>

                {/* Size Variants */}
                <div className="form-group">
                    <label>Size Variants <span className="label-optional">(for clothing/dress)</span></label>
                    <div className="size-selector-grid">
                        {ALL_SIZES.map((size) => (
                            <button
                                key={size}
                                type="button"
                                className={`size-chip ${selectedSizes.includes(size) ? "size-chip-active" : ""}`}
                                onClick={() => toggleSize(size)}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                    {selectedSizes.length > 0 && (
                        <small className="selected-sizes-preview">
                            ✅ Selected: {selectedSizes.join(", ")}
                        </small>
                    )}
                </div>

                {/* Image Management */}
                <div className="form-group">
                    <label>Product Images</label>

                    {/* Current images preview */}
                    {currentImages.length > 0 && (
                        <div className="uploaded-images-preview">
                            {currentImages.map((filename, i) => (
                                <div key={filename} className="uploaded-img-item">
                                    <img
                                        src={`http://localhost:5001/assets/${filename}`}
                                        alt={`Image ${i + 1}`}
                                        onError={(e) => { e.target.style.display = "none"; }}
                                    />
                                    {i === 0 && <span className="primary-badge">Primary</span>}
                                    <button
                                        type="button"
                                        className="remove-img-btn"
                                        onClick={() => removeImage(filename)}
                                        title="Remove"
                                    >✕</button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Upload more images */}
                    {currentImages.length < 5 && (
                        <div className="image-upload-area" onClick={() => fileInputRef.current?.click()} style={{ marginTop: "10px" }}>
                            <span className="upload-icon">📤</span>
                            <span>{uploadingEdit ? "Uploading…" : "Upload more images"}</span>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={handleFileUpload}
                                style={{ display: "none" }}
                            />
                        </div>
                    )}

                    {uploadEditError && <p className="error-message">{uploadEditError}</p>}

                    {/* Primary image filename (editable) */}
                    <label style={{ marginTop: "10px", fontSize: "13px", color: "#6b7280" }}>
                        Primary Image Filename
                    </label>
                    <input
                        type="text"
                        value={safeStr(editingProduct.image)}
                        onChange={(e) => handleFieldChange("image", e.target.value)}
                        className={errors.image ? "input-error" : ""}
                        aria-invalid={Boolean(errors.image)}
                        aria-describedby="edit-product-image-count edit-product-image-error"
                        placeholder="e.g. product1.jpg"
                        required
                    />
                    <small id="edit-product-image-count" className={`field-character-count ${safeStr(editingProduct.image).length > PRODUCT_FIELD_LIMITS.image.max ? "over-limit" : ""}`}>
                        {safeStr(editingProduct.image).length}/{PRODUCT_FIELD_LIMITS.image.max} characters
                    </small>
                    {errors.image && <p id="edit-product-image-error" className="error-message" role="alert">{errors.image}</p>}
                </div>

                {/* SEO Fields */}
                <div className="form-group">
                    <label>SEO Title <span className="label-optional">(max 70 chars)</span></label>
                    <input
                        type="text"
                        value={safeStr(editingProduct.meta_title)}
                        onChange={(e) => setEditingProduct((prev) => ({ ...prev, meta_title: e.target.value }))}
                        maxLength={70}
                        placeholder={`${safeStr(editingProduct.name)} – ShopEasy`}
                    />
                    <small className="field-character-count">{safeStr(editingProduct.meta_title).length}/70</small>
                </div>

                <div className="form-group">
                    <label>SEO Meta Description <span className="label-optional">(max 160 chars)</span></label>
                    <textarea
                        value={safeStr(editingProduct.meta_description)}
                        onChange={(e) => setEditingProduct((prev) => ({ ...prev, meta_description: e.target.value }))}
                        rows={2}
                        maxLength={160}
                        className="form-textarea"
                        placeholder="Brief description for search engines…"
                    />
                    <small className="field-character-count">{safeStr(editingProduct.meta_description).length}/160</small>
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
