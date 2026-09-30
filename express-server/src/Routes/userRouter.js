const express = require("express");

const validate = require("../Middleware/validate");

const validateParams = require("../Middleware/validateParams");

const {
    getproducts, 
    createproduct,
    updateproduct,
    deleteproduct,
    registerUser,
    loginUser
} = require("../Controllers/newArrivalcontroller");

const {
    getcategories,
    getCategoryCount,
    addCategory
} = require("../Controllers/categoriesController");

const {
    getallproducts,
    createProducts,
    updateProducts,
    deleteProduct,
    getProductBySlug,
    getProductById
} = require("../Controllers/allproductsController");

const {
    handleAddToCart,
    getCart, 
    removeFromCart
} = require("../Controllers/CartController");

const {
    createOrder,
    getMyOrders,
    getOrders,
    confrimOrder,
    cancelOrder
} = require("../Controllers/Order");

const {
    getProfile,
    updateProfile,
    changePassword
} = require("../Controllers/ProfileController");

const { getUsers, getAdminCustomers } = require("../Controllers/usersController");

// Validation schemas
const { registerSchema, loginSchema } = require("../Validation/UserValidation");
const { cartSchema } = require("../Validation/cartValidation");
const { productSchema, updateProductSchema, idSchema } = require("../Validation/ProductValidation");

const { verifyToken, verifyAdmin } = require("../Middleware/authMiddleware");

const router = express.Router();

// Authentication POST routes
router.post("/register", validate(registerSchema), registerUser);
router.post("/registerUser", validate(registerSchema), registerUser);

router.post("/login", validate(loginSchema), loginUser); 
router.post("/loginUser", validate(loginSchema), loginUser); 

// Public route for GET Product & Category 
router.get("/newarrivals", getproducts);
router.get("/categories", getcategories);
router.get("/category-count", getCategoryCount);
router.get("/allproducts", getallproducts);

// Product detail routes (public)
router.get("/product/id/:id", getProductById);
router.get("/product/:slug", getProductBySlug);


//post routes validate function
router.post("/newarrivals", verifyToken, validate(productSchema),createproduct);
router.post("/allproducts", verifyToken,validate(productSchema), createProducts);

router.post("/categories", verifyToken, addCategory);
router.post("/addcategory", verifyToken, addCategory);

router.post("/cart", verifyToken, validate(cartSchema), handleAddToCart);



// PUT route for updateproductsschema & id schema 
router.put("/newarrivals/:id", verifyToken,validate(updateProductSchema), validateParams(idSchema) , updateproduct);
router.put("/allproducts/:id", verifyToken, validate(updateProductSchema), validateParams(idSchema) ,updateProducts);


// Product delete route by validate on idschema  Delete route 

router.delete("/newarrivals/:id", verifyToken,validateParams(idSchema), deleteproduct);
router.delete("/allproducts/:id", verifyToken, validateParams(idSchema), deleteProduct);

// Protected Cart routes
router.get("/cart", verifyToken, getCart);
router.delete("/cart/:id", verifyToken, removeFromCart);

// Order routes
router.post("/orders", verifyToken, createOrder);
router.get("/my-orders", verifyToken, getMyOrders);
router.get("/orders", verifyToken, verifyAdmin, getOrders);
router.put("/orders/:id/confirm", verifyToken, verifyAdmin, confrimOrder);
router.put("/orders/:id/confrim", verifyToken, verifyAdmin, confrimOrder);
router.put("/orders/:id/cancel", verifyToken, verifyAdmin, cancelOrder);

// Protected Profile & Settings routes
router.get("/profile", verifyToken, getProfile);
router.put("/profile", verifyToken, updateProfile);
router.put("/profile/password", verifyToken, changePassword);

// Admin-only User & Customer Directory route
router.get("/users", verifyToken, verifyAdmin, getUsers);
router.get("/admin/customers", verifyToken, verifyAdmin, getAdminCustomers);

module.exports = router;