const Joi = require("joi");

const cartSchema = Joi.object({

    productId: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            "number.base": "Product ID must be a number",
            "number.integer": "Product ID must be an integer",
            "number.positive": "Product ID must be positive",
            "any.required": "Product ID is required"
        }),

    quantity: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
            "number.base": "Quantity must be a number",
            "number.integer": "Quantity must be an integer",
            "number.min": "Quantity must be at least 1",
            "any.required": "Quantity is required"
        }),

    productType: Joi.string()
        .valid("newarrival", "allproduct")
        .required()
        .messages({
            "any.only": "Invalid product type",
            "any.required": "Product type is required"
        }),

    size: Joi.string().max(100).allow(null, "").optional(),
    variant: Joi.string().max(100).allow(null, "").optional(),
    selected_variant: Joi.string().max(100).allow(null, "").optional()

}).unknown(true);

module.exports = {
    cartSchema
};