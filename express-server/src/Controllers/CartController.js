const db = require("../db");


// ADD TO CART
   const handleAddToCart = async (req, res) => {

    try {

        const userId = req.user.id;

        const { productId, productType, quantity = 1 } = req.body;

        if (!productId) {
            return res.status(400).json({
                message: "Product ID is required"
            });
        }

// product type 
        if (!productType) {
            return res.status(400).json({
                message: "Product type is required"
            });
        }

        let tableName;
        if (productType === "newarrival") {
            tableName = "newarrivals";

        } else if (productType === "allproduct") {
            tableName = "allproducts";

        } else {

            return res.status(400).json({
                message: "Invalid product type"
            });
        }

        // Product exists & stock check
        const [products] = await db.query(
            `SELECT id, name, stock, product_code FROM ${tableName} WHERE id = ?`,
            [productId]
        );

        if (products.length === 0) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        const product = products[0];
        const currentStock = Number(product.stock || 0);

        if (currentStock <= 0) {
            return res.status(400).json({
                message: `${product.name || "Product"} is out of stock`
            });
        }

        // Already cart-la irukka nu check pannudhu ?
        const [existingCart] = await db.query(
            `SELECT id, quantity
             FROM cart
             WHERE user_id = ? 
             AND product_id = ?
             AND product_type = ?`,
            [userId, productId, productType]
        );

        const currentCartQty = existingCart.length > 0 ? Number(existingCart[0].quantity) : 0;
        if (currentCartQty + Number(quantity) > currentStock) {
            return res.status(400).json({
                message: `Only ${currentStock} item(s) available in stock for ${product.name || "this product"}`
            });
        }

        if (existingCart.length > 0) {
            await db.query(
                `UPDATE cart
                 SET quantity = quantity + ?
                 WHERE user_id = ? 
                 AND product_id = ?
                 AND product_type = ?`,
                [quantity, userId, productId, productType]
            );
        } else {
            await db.query(
                `INSERT INTO cart
                 (user_id, product_id, product_type, quantity)
                 VALUES (?, ?, ?, ?)`,
                [userId, productId, productType, quantity]
            );
        }


        res.status(201).json({
            message: "Product added to cart"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Failed to add product to cart",
            error: error.message
        });
    }
};



// GET USER CART
const getCart = async (req, res) => {

    try {

        const userId = req.user.id;

        const [cart] = await db.query(
            `SELECT
                cart.id,
                cart.product_id,
                cart.quantity,
                
                 CASE
                    WHEN cart.product_type = 'newarrival'
                    THEN newarrivals.name

                    WHEN cart.product_type = 'allproduct'
                    THEN allproducts.name
                END AS name,

                CASE
                    WHEN cart.product_type = 'newarrival'
                    THEN newarrivals.price

                    WHEN cart.product_type = 'allproduct'
                    THEN allproducts.price
                END AS price,

                CASE
                    WHEN cart.product_type = 'newarrival'
                    THEN newarrivals.category

                    WHEN cart.product_type = 'allproduct'
                    THEN allproducts.category
                END AS category,

                CASE
                    WHEN cart.product_type = 'newarrival'
                    THEN newarrivals.image

                    WHEN cart.product_type = 'allproduct'
                    THEN allproducts.image
                END AS image

             FROM cart

             LEFT JOIN newarrivals
                ON cart.product_id = newarrivals.id
                AND cart.product_type = 'newarrival'

            LEFT JOIN allproducts
                ON cart.product_id = allproducts.id
                AND cart.product_type = 'allproduct'

             WHERE cart.user_id = ?`,

            [userId]
        );

        res.status(200).json(cart);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Failed to fetch cart",
            error: error.message
        });
    }
};

const removeFromCart = async (req, res) => {

    try {

        const { id } = req.params;

        const userId = req.user.id;

        const [result] = await db.query(
            `DELETE FROM cart
             WHERE id = ?
              AND user_id = ?`,
            [id, userId]
        );

        if (result.affectedRows === 0) {

            return res.status(404).json({
                message: "Cart item not found"
            });
        }

        res.status(200).json({
            message: "Product removed from cart"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Failed to remove product"
        });
    }
};


module.exports = {
    handleAddToCart,
    getCart,
    removeFromCart
};