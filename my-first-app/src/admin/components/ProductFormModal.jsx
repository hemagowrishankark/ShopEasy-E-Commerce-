import { useState, useRef, useEffect } from "react";
import { PRODUCT_FIELD_LIMITS, validateProductField } from "../utils/productValidation";
import { VARIANT_TYPES, detectVariantType, getVariantOptions } from "../../utils/variantConfig";

function ProductFormModal({
    showForm,
    setShowForm,
    productForm,
    setProductForm,
    errors,
    setErrors,
    onSubmit
}) {
    const fileInputRef = useRef(null);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [customVariantInput, setCustomVariantInput] = useState("");

    // Auto-detect variant type when category changes
    useEffect(() => {
        if (!showForm) return;
        if (productForm?.category) {
            const detected = detectVariantType(productForm.category);
            // Only auto-set if admin hasn't manually chosen
            if (!productForm.variant_type || productForm.variant_type === "none") {
                setProductForm(prev => ({
                    ...prev,
                    variant_type: detected,
                    sizes: "" // reset variants when type changes
                }));
            }
        }
    }, [showForm, productForm?.category]);

    if (!showForm) return null;

    const handleFieldChange = (field, value) => {
        const fieldError = validateProductField(field, value);
        setProductForm(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, [field]: fieldError, general: "" }));
    };

    // Change variant type → reset selected variants
    const handleVariantTypeChange = (type) => {
        setProductForm(prev => ({ ...prev, variant_type: type, sizes: "" }));
        setCustomVariantInput("");
    };

    // Toggle a preset variant option
    const toggleVariant = (option) => {
        const current = productForm.sizes
            ? productForm.sizes.split(",").map(s => s.trim()).filter(Boolean)
            : [];
        const updated = current.includes(option)
            ? current.filter(s => s !== option)
            : [...current, option];
        setProductForm(prev => ({ ...prev, sizes: updated.join(",") }));
    };

    // Add custom variant option
    const addCustomVariant = () => {
        const val = customVariantInput.trim();
        if (!val) return;
        const current = productForm.sizes
            ? productForm.sizes.split(",").map(s => s.trim()).filter(Boolean)
            : [];
        if (!current.includes(val)) {
            setProductForm(prev => ({ ...prev, sizes: [...current, val].join(",") }));
        }
        setCustomVariantInput("");
    };

    // Remove a selected variant chip
    const removeVariant = (option) => {
        const current = productForm.sizes
            ? productForm.sizes.split(",").map(s => s.trim()).filter(Boolean)
            : [];
        setProductForm(prev => ({ ...prev, sizes: current.filter(s => s !== option).join(",") }));
    };

    const selectedVariants = productForm.sizes
        ? productForm.sizes.split(",").map(s => s.trim()).filter(Boolean)
        : [];

    const currentVariantType = productForm.variant_type || "none";
    const presetOptions = getVariantOptions(currentVariantType);

    // File upload
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
            files.forEach(f => formData.append("images", f));
            const res = await fetch("http://localhost:5001/api/upload", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            const newFiles = [...uploadedFiles, ...data.filenames];
            setUploadedFiles(newFiles);
            setProductForm(prev => ({
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
        const updated = uploadedFiles.filter(f => f !== filename);
        setUploadedFiles(updated);
        setProductForm(prev => ({
            ...prev,
            image: updated[0] || "",
            images: updated.join(",")
        }));
    };

    const detectedType = detectVariantType(productForm.category || "");

    return (
        <form className="add-product-form" onSubmit={onSubmit} noValidate>
            <h3>Add New Product</h3>

            {errors.general && (
                <div className="form-error-banner" role="alert">⚠️ {errors.general}</div>
            )}

            <div className="form-grid">
                {/* Product Name */}
                <div className="form-group">
                    <label>Product Name</label>
                    <input
                        type="text"
                        placeholder="e.g. iPhone 16 Pro"
                        value={productForm.name}
                        onChange={e => handleFieldChange("name", e.target.value)}
                        className={errors.name ? "input-error" : ""}
                        required
                    />
                    <small className={`field-character-count ${productForm.name.length > PRODUCT_FIELD_LIMITS.name.max ? "over-limit" : ""}`}>
                        {productForm.name.length}/{PRODUCT_FIELD_LIMITS.name.max}
                    </small>
                    {errors.name && <p className="error-message">{errors.name}</p>}
                </div>

                {/* Price */}
                <div className="form-group">
                    <label>Price (₹)</label>
                    <input
                        type="number"
                        placeholder="e.g. 79999"
                        value={productForm.price}
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
                        placeholder="e.g. Smartphones, Dresses, Laptops"
                        value={productForm.category}
                        onChange={e => handleFieldChange("category", e.target.value)}
                        className={errors.category ? "input-error" : ""}
                        required
                    />
                    <small className={`field-character-count ${productForm.category.length > PRODUCT_FIELD_LIMITS.category.max ? "over-limit" : ""}`}>
                        {productForm.category.length}/{PRODUCT_FIELD_LIMITS.category.max}
                    </small>
                    {errors.category && <p className="error-message">{errors.category}</p>}
                </div>

                {/* Stock */}
                <div className="form-group">
                    <label>Stock Quantity</label>
                    <input
                        type="number"
                        placeholder="e.g. 50"
                        min="0"
                        value={productForm.stock}
                        onChange={e => handleFieldChange("stock", e.target.value)}
                        className={errors.stock ? "input-error" : ""}
                        required
                    />
                    {errors.stock && <p className="error-message">{errors.stock}</p>}
                </div>

                {/* Description */}
                <div className="form-group full-width">
                    <label>Product Description <span className="label-optional">(optional)</span></label>
                    <textarea
                        placeholder="Describe features, specs, material, care instructions…"
                        value={productForm.description || ""}
                        onChange={e => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        maxLength={2000}
                        className="form-textarea"
                    />
                    <small className="field-character-count">
                        {(productForm.description || "").length}/2000
                    </small>
                </div>

                {/* ═══ VARIANT SECTION ═══ */}
                <div className="form-group full-width">
                    <label className="variant-section-label">
                        Product Variants
                        {detectedType !== "none" && (
                            <span className="variant-auto-badge">
                                💡 Auto-detected: {VARIANT_TYPES[detectedType]?.icon} {VARIANT_TYPES[detectedType]?.label}
                            </span>
                        )}
                    </label>

                    {/* Variant type selector */}
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

                    {/* Preset option chips */}
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

                    {/* Custom input for "custom" type */}
                    {currentVariantType === "custom" && (
                        <div className="custom-variant-input-row">
                            <input
                                type="text"
                                placeholder="e.g. 4K UHD, HDR10+, Dolby Vision…"
                                value={customVariantInput}
                                onChange={e => setCustomVariantInput(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomVariant())}
                                className="custom-variant-input"
                            />
                            <button type="button" className="custom-variant-add-btn" onClick={addCustomVariant}>
                                + Add
                            </button>
                        </div>
                    )}

                    {/* Also allow custom additions for any type */}
                    {currentVariantType !== "none" && currentVariantType !== "custom" && (
                        <div className="custom-variant-input-row" style={{ marginTop: "8px" }}>
                            <input
                                type="text"
                                placeholder={`Add custom ${VARIANT_TYPES[currentVariantType]?.label || "option"}…`}
                                value={customVariantInput}
                                onChange={e => setCustomVariantInput(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomVariant())}
                                className="custom-variant-input"
                            />
                            <button type="button" className="custom-variant-add-btn" onClick={addCustomVariant}>
                                + Add
                            </button>
                        </div>
                    )}

                    {/* Selected variants preview */}
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

                {/* Image Upload */}
                <div className="form-group full-width">
                    <label>Product Images <span className="label-optional">(up to 5, max 5MB each)</span></label>
                    <div className="image-upload-area" onClick={() => fileInputRef.current?.click()}>
                        <span className="upload-icon">📤</span>
                        <span>{uploading ? "Uploading…" : "Click to upload images"}</span>
                        <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
                    </div>
                    {uploadError && <p className="error-message">{uploadError}</p>}
                    {uploadedFiles.length > 0 && (
                        <div className="uploaded-images-preview">
                            {uploadedFiles.map((f, i) => (
                                <div key={f} className="uploaded-img-item">
                                    <img src={`http://localhost:5001/assets/${f}`} alt={`Upload ${i + 1}`} />
                                    {i === 0 && <span className="primary-badge">Primary</span>}
                                    <button type="button" className="remove-img-btn" onClick={() => removeUploadedFile(f)}>✕</button>
                                </div>
                            ))}
                        </div>
                    )}
                    <label style={{ marginTop: "12px", fontSize: "13px", color: "#6b7280" }}>Or enter image filename manually</label>
                    <input
                        type="text"
                        placeholder="e.g. iphone16.jpg"
                        value={productForm.image}
                        onChange={e => handleFieldChange("image", e.target.value)}
                        className={errors.image ? "input-error" : ""}
                        required={uploadedFiles.length === 0}
                    />
                    {errors.image && <p className="error-message">{errors.image}</p>}
                </div>

                {/* SEO Fields */}
                <div className="form-group full-width">
                    <label>SEO Title <span className="label-optional">(max 70 chars)</span></label>
                    <input
                        type="text"
                        placeholder={`${productForm.name || "Product"} – Best Price on ShopEasy`}
                        value={productForm.meta_title || ""}
                        onChange={e => setProductForm(prev => ({ ...prev, meta_title: e.target.value }))}
                        maxLength={70}
                    />
                    <small className="field-character-count">{(productForm.meta_title || "").length}/70</small>
                </div>

                <div className="form-group full-width">
                    <label>SEO Meta Description <span className="label-optional">(max 160 chars)</span></label>
                    <textarea
                        placeholder="Brief description for search engines…"
                        value={productForm.meta_description || ""}
                        onChange={e => setProductForm(prev => ({ ...prev, meta_description: e.target.value }))}
                        rows={2}
                        maxLength={160}
                        className="form-textarea"
                    />
                    <small className="field-character-count">{(productForm.meta_description || "").length}/160</small>
                </div>

                {/* Target Destination */}
                <div className="form-group full-width">
                    <label className="type-select-label">📌 Target Destination:</label>
                    <select
                        className="target-select"
                        value={productForm.targetType}
                        onChange={e => setProductForm({ ...productForm, targetType: e.target.value })}
                    >
                        <option value="allproducts">📦 All Products</option>
                        <option value="newarrivals">✨ New Arrivals</option>
                        <option value="both">⭐ Both</option>
                    </select>
                </div>
            </div>

            <div className="form-buttons">
                <button type="submit" className="save-product-btn">Save Product</button>
                <button type="button" className="cancel-product-btn" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
        </form>
    );
}

export default ProductFormModal;
