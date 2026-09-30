import { useState, useRef } from "react";
import { PRODUCT_FIELD_LIMITS, validateProductField } from "../utils/productValidation";

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

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

    const fileInputRef = useRef(null);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");

    const handleFieldChange = (field, value) => {
        const fieldError = validateProductField(field, value);
        setProductForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: fieldError, general: "" }));
    };

    // Toggle size selection
    const toggleSize = (size) => {
        const current = productForm.sizes
            ? productForm.sizes.split(",").map((s) => s.trim()).filter(Boolean)
            : [];
        const updated = current.includes(size)
            ? current.filter((s) => s !== size)
            : [...current, size];
        setProductForm((prev) => ({ ...prev, sizes: updated.join(",") }));
    };

    const selectedSizes = productForm.sizes
        ? productForm.sizes.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

    // Handle file upload to server
    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        if (files.length + uploadedFiles.length > 5) {
            setUploadError("Maximum 5 images allowed");
            return;
        }
        setUploading(true);
        setUploadError("");
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
            const newFiles = [...uploadedFiles, ...data.filenames];
            setUploadedFiles(newFiles);
            // Update form: set first image as primary, all as images list
            setProductForm((prev) => ({
                ...prev,
                image: newFiles[0] || prev.image,
                images: newFiles.join(",")
            }));
        } catch (err) {
            setUploadError(err.message || "Upload failed");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const removeUploadedFile = (filename) => {
        const updated = uploadedFiles.filter((f) => f !== filename);
        setUploadedFiles(updated);
        setProductForm((prev) => ({
            ...prev,
            image: updated[0] || "",
            images: updated.join(",")
        }));
    };

    return (
        <form className="add-product-form" onSubmit={onSubmit} noValidate>
            <h3>Add New Product</h3>

            {errors.general && (
                <div className="form-error-banner" role="alert">
                    ⚠️ {errors.general}
                </div>
            )}

            <div className="form-grid">
                {/* Product Name */}
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
                    {errors.name && <p id="add-product-name-error" className="error-message" role="alert">{errors.name}</p>}
                </div>

                {/* Price */}
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
                    {errors.price && <p id="add-product-price-error" className="error-message" role="alert">{errors.price}</p>}
                </div>

                {/* Category */}
                <div className="form-group">
                    <label>Category</label>
                    <input
                        type="text"
                        placeholder="e.g. Electronics, Fashion, Dresses"
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
                    {errors.category && <p id="add-product-category-error" className="error-message" role="alert">{errors.category}</p>}
                </div>

                {/* Stock */}
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
                    {errors.stock && <p id="add-product-stock-error" className="error-message" role="alert">{errors.stock}</p>}
                </div>

                {/* Description - full width */}
                <div className="form-group full-width">
                    <label>Product Description <span className="label-optional">(optional)</span></label>
                    <textarea
                        placeholder="Describe the product: material, features, care instructions…"
                        value={productForm.description || ""}
                        onChange={(e) => setProductForm((prev) => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        maxLength={2000}
                        className="form-textarea"
                    />
                    <small className="field-character-count">
                        {(productForm.description || "").length}/2000 characters
                    </small>
                </div>

                {/* Size Variants - full width */}
                <div className="form-group full-width">
                    <label>Size Variants <span className="label-optional">(for clothing/dress products)</span></label>
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

                {/* Image Upload - full width */}
                <div className="form-group full-width">
                    <label>Product Images <span className="label-optional">(up to 5 images, max 5MB each)</span></label>

                    {/* File picker */}
                    <div className="image-upload-area" onClick={() => fileInputRef.current?.click()}>
                        <span className="upload-icon">📤</span>
                        <span>{uploading ? "Uploading…" : "Click to upload images (JPEG, PNG, WebP)"}</span>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleFileUpload}
                            style={{ display: "none" }}
                        />
                    </div>

                    {uploadError && <p className="error-message">{uploadError}</p>}

                    {/* Preview uploaded images */}
                    {uploadedFiles.length > 0 && (
                        <div className="uploaded-images-preview">
                            {uploadedFiles.map((filename, i) => (
                                <div key={filename} className="uploaded-img-item">
                                    <img
                                        src={`http://localhost:5001/assets/${filename}`}
                                        alt={`Uploaded ${i + 1}`}
                                    />
                                    {i === 0 && <span className="primary-badge">Primary</span>}
                                    <button
                                        type="button"
                                        className="remove-img-btn"
                                        onClick={() => removeUploadedFile(filename)}
                                        title="Remove image"
                                    >✕</button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Fallback: manual image filename */}
                    <div className="form-group" style={{ marginTop: "12px" }}>
                        <label style={{ fontSize: "13px", color: "#6b7280" }}>
                            Or enter image filename manually
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. product1.jpg or image.png"
                            value={productForm.image}
                            onChange={(e) => handleFieldChange("image", e.target.value)}
                            className={errors.image ? "input-error" : ""}
                            aria-invalid={Boolean(errors.image)}
                            aria-describedby="add-product-image-count add-product-image-error"
                            required={uploadedFiles.length === 0}
                        />
                        <small id="add-product-image-count" className={`field-character-count ${(productForm.image || "").length > PRODUCT_FIELD_LIMITS.image.max ? "over-limit" : ""}`}>
                            {(productForm.image || "").length}/{PRODUCT_FIELD_LIMITS.image.max} characters
                        </small>
                        {errors.image && <p id="add-product-image-error" className="error-message" role="alert">{errors.image}</p>}
                    </div>
                </div>

                {/* SEO Fields */}
                <div className="form-group full-width">
                    <label>SEO Title <span className="label-optional">(auto-generated if empty, max 70 chars)</span></label>
                    <input
                        type="text"
                        placeholder={`e.g. ${productForm.name || "Product Name"} – Best Price on ShopEasy`}
                        value={productForm.meta_title || ""}
                        onChange={(e) => setProductForm((prev) => ({ ...prev, meta_title: e.target.value }))}
                        maxLength={70}
                    />
                    <small className="field-character-count">{(productForm.meta_title || "").length}/70</small>
                </div>

                <div className="form-group full-width">
                    <label>SEO Meta Description <span className="label-optional">(auto-generated if empty, max 160 chars)</span></label>
                    <textarea
                        placeholder="Brief description for search engines…"
                        value={productForm.meta_description || ""}
                        onChange={(e) => setProductForm((prev) => ({ ...prev, meta_description: e.target.value }))}
                        rows={2}
                        maxLength={160}
                        className="form-textarea"
                    />
                    <small className="field-character-count">{(productForm.meta_description || "").length}/160</small>
                </div>

                {/* Target Destination */}
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
                        {productForm.targetType === "allproducts" && "Saved to allproducts table (visible on /products page)."}
                        {productForm.targetType === "newarrivals" && "Saved to newarrivals table (visible on Home page)."}
                        {productForm.targetType === "both" && "Saved to BOTH allproducts and newarrivals simultaneously."}
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
