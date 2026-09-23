const Joi = require("joi");

const productSchema=Joi.object({
    name:Joi.string()
    .min(3)
    .max(25)
    .trim()
    .required()
    .messages({
        "string.empty":"Product name is required",
        "string.min":"Product name must contain at least 3 characters",
        "string.max":"Product name must be 25 characters or fewer",
        "any.required":"Product name is required"
    }),

    price:Joi.number()
    .positive()
    .required()
    .messages({
        "number.base":"Price must be a number",
        "number.positive":"Price must be positive",
        "any.required":"Price is required"
    }),
    
    category:Joi.string()
    .max(15)
    .trim()
    .required()
    .messages({
        "string.empty":"Category is required",
        "string.max":"Category must be 15 characters or fewer",
        "any.required":"Ctegory is reuired"
    }),
    image:Joi.string()
    .max(50 )
    .trim()
    .required()
    .messages({
        "string.empty":"Image URL is required",
        "string.max":"Image filename or URL must be 25 characters or fewer",
        "string.pattern":"Image URL is invalid"
    }),
    stock:Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
        "number.base":"Stock must be a number",
        "number.integer":"Stock must be Whole number",
        "number.min":"Stock cannot be negative",
        "any.required":"Stock is required"
    }),
    product_code: Joi.string()
    .allow(null, "")
    .optional(),
    targetType: Joi.string()
    .valid("allproducts", "newarrivals", "both")
    .optional(),
    isBoth: Joi.boolean()
    .optional(),
    is_new_arrival: Joi.boolean()
    .optional()
    })
    .unknown(true);

    
    // update validation

    const updateProductSchema = Joi.object ({
        name:Joi.string()
    .min(3)
    .max(25)
    .trim()
    .required(),
    
    price:Joi.number()
    .positive()
    .required(),

    category:Joi.string()
    .max(15)
    .trim()
    .required(),

    image:Joi.string()
    .max(50)
    .trim()
    .required(),

    stock:Joi.number()
    .integer()
    .min(0)
    .required()

    });

    const idSchema = Joi.object({
        id:Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            "number.base":"Product Id must be a number",
            "number.integer":"Product ID must be a whole number",
            "number.positive":"Product ID must be positive",
            "any.required":"Product ID is required"
        })
    });

module.exports={
    productSchema,
    updateProductSchema,
    idSchema
};