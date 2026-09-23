const Joi = require("joi");


const registerSchema = Joi.object({
    fullName: Joi.string()
    .min(5)
    .max(20)
    .required()
    .messages({
        "string.empty": "Full name is required",
        "string.min": "Name must contain at least 5 characters",
        "string.max": "Name must not exceed 20 characters"
    }),

    email: Joi.string()
    .email()
    .required()
    .messages({
        "string.empty": "Email is required",
        "string.email": "Please enter a valid email"
    }),

    password: Joi.string()
    .min(6)
    .max(20)
    .required()
    .messages({
        "string.empty": "Password is required",
        "string.min": "Password must contain at least 6 characters",
        "string.max": "Password must not exceed 20 characters"
    }),

    confirmPassword: Joi.any()
    .valid(Joi.ref("password"))
    .required()
    .messages({
        "any.required": "Confirm password is required",
        "any.only": "Passwords do not match"
    })

});

//login validation messages

const loginSchema = Joi.object({

    email: Joi.string()
    .email()
    .required()
    .messages({
         "string.empty":"Email is required",
        "string.email":"Please enter a valid email"
    }),

    password: Joi.string()
    .required()
    .messages({
            "string.empty": "Password is required",
            "string.password":"Password Does not match"
        })
})

module.exports = {
    registerSchema,
    loginSchema
}