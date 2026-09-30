export const PRODUCT_FIELD_LIMITS = Object.freeze({
    name: { min: 3, max: 25 },
    category: { max: 15 },
    image: { max: 50 }
});

export function validateProductField(field, value) {
    const rawValue = String(value ?? "");
    const trimmedValue = rawValue.trim();

    switch (field) {
        case "name":
            if (!trimmedValue) return "Product name is required";
            if (trimmedValue.length < PRODUCT_FIELD_LIMITS.name.min) {
                return `Product name must contain at least ${PRODUCT_FIELD_LIMITS.name.min} characters`;
            }
            if (trimmedValue.length > PRODUCT_FIELD_LIMITS.name.max) {
                return `Product name must be ${PRODUCT_FIELD_LIMITS.name.max} characters or fewer`;
            }
            return "";

        case "price": {
            if (!rawValue) return "Price is required";
            const price = Number(rawValue);
            if (!Number.isFinite(price)) return "Price must be a number";
            if (price <= 0) return "Price must be positive";
            return "";
        }

        case "category":
            if (!trimmedValue) return "Category is required";
            if (trimmedValue.length > PRODUCT_FIELD_LIMITS.category.max) {
                return `Category must be ${PRODUCT_FIELD_LIMITS.category.max} characters or fewer`;
            }
            return "";

        case "image":
            if (!trimmedValue) return "Image filename or URL is required";
            if (trimmedValue.length > PRODUCT_FIELD_LIMITS.image.max) {
                return `Image filename or URL must be ${PRODUCT_FIELD_LIMITS.image.max} characters or fewer`;
            }
            return "";

        case "stock": {
            if (!rawValue) return "Stock quantity is required";
            const stock = Number(rawValue);
            if (!Number.isInteger(stock)) return "Stock must be a whole number";
            if (stock < 0) return "Stock cannot be negative";
            return "";
        }

        default:
            return "";
    }
}

export function validateProductForm(product) {
    // Only validate required fields; description/sizes/images/seo are optional
    return ["name", "price", "category", "image", "stock"].reduce((errs, field) => {
        const error = validateProductField(field, product[field]);
        if (error) errs[field] = error;
        return errs;
    }, {});
}

// Default empty product form state (used by AdminDashboard)
export const EMPTY_PRODUCT_FORM = {
    name: "",
    price: "",
    category: "",
    image: "",
    images: "",
    stock: "",
    description: "",
    sizes: "",
    variant_type: "none",
    meta_title: "",
    meta_description: "",
    targetType: "allproducts"
};
