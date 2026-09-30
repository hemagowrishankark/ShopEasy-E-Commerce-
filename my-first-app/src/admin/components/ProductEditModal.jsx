import { useState, useRef } from "react";
import { PRODUCT_FIELD_LIMITS, validateProductField } from "../utils/productValidation";
import { VARIANT_TYPES, detectVariantType, getVariantOptions } from "../../utils/variantConfig";

function ProductEditModal({
    editingProduct,
    setEditingProduct,
    errors,
    setErrors,
    onSaveEdit
}) {
    if (!editingProduct) return null;

    const safeStr = (val) => String(val ?? "");
    const safeNum = (val) => (val !== null && val !== undefined ? val : "");

    const fileInputRef = useRef(null);
    const [uploadingEdit, setUploadingEdit] = useState(false);
    const [uploadEditError, setUploadEditError] = useState("");
    const [customVariantInput, setCustomVariantInput] = useState("");

    const handleFieldChange = (field, value) => {
        const fieldError = validateProductField(field, value);
        setEditingProduct(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, [field]: fieldError }));
    };

    const currentVariantType = editingProduct.variant_type || detectVariantType(editingProduct.category || "") || "none";

    // Change variant type → reset variants
    const handleVariantTypeChange = (type) => {
        setEditingProduct(prev => ({ ...prev, variant_type: type, sizes: "" }));
        setCustomVariantInput("");
    };

    const presetOptions = getVariantOptions(currentVariantType);

    const selectedVariants = editingProduct.sizes
        ? editingProduct.sizes.split(",").map(s => s.trim()).filter(Boolean)
        : [];

    const toggleVariant = (option) => {
        const updated = selectedVariants.includes(option)
            ? selectedVariants.filter(s => s !== option)
            : [...selectedVariants, option];
        setEditingProduct(prev => ({ ...prev, sizes: updated.join(",") }));
    };

    const addCustomVariant = () => {
        const val = customVariantInput.trim();
        if (!val || selectedVariants.includes(val)) return;
        setEditingProduct(prev => ({ ...prev, sizes: [...selectedVariants, val].join(",") }));
        setCustomVariantInput("");
    };

    const removeVariant = (option) => {
        setEditingProduct(prev => ({ ...prev, sizes: selectedVariants.filter(s => s !== option).join(",") }));
    };

    // Images
    const currentImages = editingProduct.images
        ? editingProduct.images.split(",").map(s => s.trim()).filter(Boolean)
        : editingProduct.image ? [editingProduct.image] : [];

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        if (files.length + currentImages.length > 5) { setUploadEditError("Maximum 5 images allowed"); return; }
        setUploadingEdit(true);
        setUploadEditError("");
        try {
            const token = localStorage.getItem("token");
            const formData = new FormData();
            files.forEach(f => formData.append("images", f));
            const res = await fetch("http://localhost:5001/api/upload", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            const all = [...currentImages, ...data.filenames];
            setEditingProduct(prev => ({ ...prev, image: all[0] || prev.image, images: all.join(",") }));
        } catch (err) {
            setUploadEditError(err.message || "Upload failed");
        } finally {
            setUploadingEdit(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const removeImage = (filename) => {
        const updated = currentImages.filter(f => f !== filename);
        setEditingProduct(prev => ({ ...prev, image: updated[0] || "", images: updated.join(",") }));
    };

    const detectedType = detectVariantType(editingProduct.category || "");

    return (
        <div className="edit-modal-backdrop" onClick={() => setEditingProduct(null)}>
            <form className="edit-product-form" onSubmit={onSaveEdit} onClick={e => e.stopPropagation()} noValidate>
                <h3>
                    Edit Product {editingProduct.product_code ? `(${editingProduct.product_code})` : ""}
                </h3>

                {editingProduct.product_code && (
                    <p className="edit-sync-notice">
                        🔄 Synced by <strong>{editingProduct.product_code}</strong>: updates apply to both tables.
                    </p>
                )}

                {/* Name */}
                <div className="form-group">
                    <label>Product Name</label>
                    <input
                        type="text"
                        value={safeStr(editingProduct.name)}
                        onChange={e => handleFieldChange("name", e.target.value)}
                        className={errors.name ? "input-error" : ""}
                        required
                    />
                    <small className={`field-character-count ${safeStr(editingProduct.name).length > PRODUCT_FIELD_LIMITS.name.max ? "over-limit" : ""}`}>
                        {safeStr(editingProduct.name).length}/{PRODUCT_FIELD_LIMITS.name.max}
                    </small>
                    {errors.name && <p className="error-message">{errors.name}</p>}
                </div>

                {/* Price */}
                <div className="form-group">
                    <label>Price (₹)</label>
                    <input
                        type="number"
                        value={safeNum(editingProduct.price)}
                        onChange={e => handleFieldChange("price", e.target.value)}
                        className={errors.price ? "input-error" : ""}
                        required
                    />
                    {errors.price && <p className="error-message">{errors.price}</p>}
                </div>

                {/* Category */}
                <div className="form-group">
                    <label>Category</label>
                    <input
                        type="text"
                        value={safeStr(editingProduct.category)}
                        onChange={e => handleFieldChange("category", e.target.value)}
                        className={errors.category ? "input-error" : ""}
                        required
                    />
                    <small className={`field-character-count ${safeStr(editingProduct.category).length > PRODUCT_FIELD_LIMITS.category.max ? "over-limit" : ""}`}>
                        {safeStr(editingProduct.category).length}/{PRODUCT_FIELD_LIMITS.category.max}
                    </small>
                    {errors.category && <p className="error-message">{errors.category}</p>}
                </div>

                {/* Stock */}
                <div className="form-group">
                    <label>Stock Quantity</label>
                    <input
                        type="number"
                        min="0"
                        value={safeNum(editingProduct.stock)}
                        onChange={e => handleFieldChange("stock", e.target.value)}
                        className={errors.stock ? "input-error" : ""}
                        required
                    />
                    {errors.stock && <p className="error-message">{errors.stock}</p>}
                </div>

                {/* Description */}
                <div className="form-group">
                    <label>Product Description <span className="label-optional">(optional)</span></label>
                    <textarea
                        value={safeStr(editingProduct.description)}
                        onChange={e => setEditingProduct(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        maxLength={2000}
                        className="form-textarea"
                        placeholder="Describe the product…"
                    />
                    <small className="field-character-count">{safeStr(editingProduct.description).length}/2000</small>
                </div>

                {/* ═══ VARIANT SECTION ═══ */}
                <div className="form-group">
                    <label className="variant-section-label">
                        Product Variants
                        {detectedType !== "none" && (
                            <span className="variant-auto-badge">
                                💡 Suggested: {VARIANT_TYPES[detectedType]?.icon} {VARIANT_TYPES[detectedType]?.label}
                            </span>
                        )}
                    </label>

                    {/* Type selector */}
                    <div className="variant-type-grid">
                        {Object.entries(VARIANT_TYPES).map(([key, { label, icon }]) => (
                            <button
                                key={key}
                                type="button"
                                className={`variant-type-btn ${currentVariantType === key ? "variant-type-active" : ""}`}
                                onClick={() => handleVariantTypeChange(key)}
                                title={label}
                            >
                                <span className="vt-icon">{icon}</span>
                                <span className="vt-label">{label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Preset chips */}
                    {currentVariantType !== "none" && presetOptions.length > 0 && (
                        <div className="variant-chips-section">
                            <p className="variant-chips-hint">
                                Select available {VARIANT_TYPES[currentVariantType]?.label} options:
                            </p>
                            <div className="size-selector-grid">
                                {presetOptions.map(option => (
                                    <button
                                        key={option}
                                        type="button"
                                        className={`size-chip ${selectedVariants.includes(option) ? "size-chip-active" : ""}`}
                                        onClick={() => toggleVariant(option)}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Custom / extra input */}
                    {currentVariantType !== "none" && (
                        <div className="custom-variant-input-row">
                            <input
                                type="text"
                                placeholder={currentVariantType === "custom"
                                    ? "Type option and press Enter…"
                                    : `Add custom ${VARIANT_TYPES[currentVariantType]?.label || "option"}…`}
                                value={customVariantInput}
                                onChange={e => setCustomVariantInput(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomVariant())}
                                className="custom-variant-input"
                            />
                            <button type="button" className="custom-variant-add-btn" onClick={addCustomVariant}>+ Add</button>
                        </div>
                    )}

                    {/* Selected preview with remove */}
                    {selectedVariants.length > 0 && (
                        <div className="selected-variants-preview">
                            <span className="selected-variants-label">Selected:</span>
                            {selectedVariants.map(v => (
                                <span key={v} className="selected-variant-tag">
                                    {v}
                                    <button type="button" onClick={() => removeVariant(v)} className="remove-variant-tag-btn">✕</button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Image Management */}
                <div className="form-group">
                    <label>Product Images</label>
                    {currentImages.length > 0 && (
                        <div className="uploaded-images-preview">
                            {currentImages.map((f, i) => (
                                <div key={f} className="uploaded-img-item">
                                    <img src={`http://localhost:5001/assets/${f}`} alt={`Image ${i + 1}`} onError={e => { e.target.style.display = "none"; }} />
                                    {i === 0 && <span className="primary-badge">Primary</span>}
                                    <button type="button" className="remove-img-btn" onClick={() => removeImage(f)} title="Remove">✕</button>
                                </div>
                            ))}
                        </div>
                    )}
                    {currentImages.length < 5 && (
                        <div className="image-upload-area" onClick={() => fileInputRef.current?.click()} style={{ marginTop: "10px" }}>
                            <span className="upload-icon">📤</span>
                            <span>{uploadingEdit ? "Uploading…" : "Upload more images"}</span>
                            <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
                        </div>
                    )}
                    {uploadEditError && <p className="error-message">{uploadEditError}</p>}
                    <label style={{ marginTop: "10px", fontSize: "13px", color: "#6b7280" }}>Primary Image Filename</label>
                    <input
                        type="text"
                        value={safeStr(editingProduct.image)}
                        onChange={e => handleFieldChange("image", e.target.value)}
                        className={errors.image ? "input-error" : ""}
                        placeholder="e.g. product1.jpg"
                        required
                    />
                    {errors.image && <p className="error-message">{errors.image}</p>}
                </div>

                {/* SEO */}
                <div className="form-group">
                    <label>SEO Title <span className="label-optional">(max 70)</span></label>
                    <input
                        type="text"
                        value={safeStr(editingProduct.meta_title)}
                        onChange={e => setEditingProduct(prev => ({ ...prev, meta_title: e.target.value }))}
                        maxLength={70}
                        placeholder={`${safeStr(editingProduct.name)} – ShopEasy`}
                    />
                    <small className="field-character-count">{safeStr(editingProduct.meta_title).length}/70</small>
                </div>

                <div className="form-group">
                    <label>SEO Meta Description <span className="label-optional">(max 160)</span></label>
                    <textarea
                        value={safeStr(editingProduct.meta_description)}
                        onChange={e => setEditingProduct(prev => ({ ...prev, meta_description: e.target.value }))}
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
