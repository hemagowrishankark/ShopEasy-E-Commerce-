/**
 * SHOPEASY — PRODUCT VARIANT SYSTEM
 * Category-aware variant presets for admin forms and storefront.
 */

export const VARIANT_TYPES = {
    none:        { label: "No Variants",  icon: "🚫", options: [] },
    size:        { label: "Size",         icon: "📏", options: ["XS", "S", "M", "L", "XL", "XXL"] },
    storage:     { label: "Storage",      icon: "💾", options: ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB", "2TB"] },
    ram:         { label: "RAM",          icon: "🧠", options: ["2GB", "4GB", "6GB", "8GB", "12GB", "16GB", "32GB", "64GB"] },
    color:       { label: "Color",        icon: "🎨", options: ["Black", "White", "Silver", "Gold", "Blue", "Red", "Green", "Pink", "Gray", "Navy"] },
    screen_size: { label: "Screen Size",  icon: "📺", options: ['24"', '27"', '32"', '43"', '50"', '55"', '65"', '75"', '85"'] },
    connectivity:{ label: "Connectivity", icon: "📶", options: ["WiFi", "4G", "5G", "WiFi + 4G", "WiFi + 5G", "Bluetooth"] },
    custom:      { label: "Custom",       icon: "✏️",  options: [] }
};

/**
 * Detect the best variant type from category name.
 * Returns a variant_type key or "none".
 */
export function detectVariantType(category = "") {
    const cat = category.toLowerCase();

    if (/dress|cloth|fashion|wear|shirt|kurta|saree|skirt|jeans|top|blouse|lehenga|salwar|dupatta|textile|apparel|t-shirt|hoodie|jacket|coat|trouser|pant|suit|ethnic|casual|formal/i.test(cat)) {
        return "size";
    }
    if (/phone|mobile|smartphone|iphone|android|tablet|ipad|laptop|macbook|notebook|chromebook|ultrabook/i.test(cat)) {
        return "storage";
    }
    if (/pc|computer|desktop|ram|memory|processor|workstation/i.test(cat)) {
        return "ram";
    }
    if (/headphone|earphone|earbud|speaker|airpod|headset|audio|sound|music/i.test(cat)) {
        return "color";
    }
    if (/tv|television|monitor|display|screen|projector|oled|qled|led tv/i.test(cat)) {
        return "screen_size";
    }
    if (/watch|smartwatch|wearable|band|fitness tracker/i.test(cat)) {
        return "color";
    }
    if (/router|modem|wifi|network|hotspot|dongle/i.test(cat)) {
        return "connectivity";
    }
    return "none";
}

/**
 * Get the display label for the selector on the product page.
 * e.g. "Select Storage", "Select Size", "Select Color"
 */
export function getVariantLabel(variantType) {
    return VARIANT_TYPES[variantType]?.label || "Variant";
}

/**
 * Get the preset options for a given variant type.
 */
export function getVariantOptions(variantType) {
    return VARIANT_TYPES[variantType]?.options || [];
}
