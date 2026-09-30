const db = require("../db");

// Place order with strict transaction and atomic stock validation
const createOrder = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const userId = req.user.id;

        await connection.beginTransaction();

        // 1. Get user's cart items with row locking
        const [cartItems] = await connection.query(
            `SELECT
                cart.id,
                cart.product_id,
                cart.product_type,
                cart.quantity,
                cart.selected_variant,

                CASE
                    WHEN cart.product_type = 'newarrival'
                    THEN newarrivals.price
                    WHEN cart.product_type = 'allproduct'
                    THEN allproducts.price
                END AS price,

                CASE
                    WHEN cart.product_type = 'newarrival'
                    THEN newarrivals.name
                    WHEN cart.product_type = 'allproduct'
                    THEN allproducts.name
                END AS product_name,

                CASE
                    WHEN cart.product_type = 'newarrival'
                    THEN newarrivals.stock
                    WHEN cart.product_type = 'allproduct'
                    THEN allproducts.stock
                END AS stock,

                CASE
                    WHEN cart.product_type = 'newarrival'
                    THEN newarrivals.product_code
                    WHEN cart.product_type = 'allproduct'
                    THEN allproducts.product_code
                END AS product_code

             FROM cart
             LEFT JOIN newarrivals
                 ON cart.product_id = newarrivals.id
                 AND cart.product_type = 'newarrival'
             LEFT JOIN allproducts
                 ON cart.product_id = allproducts.id
                 AND cart.product_type = 'allproduct'
             WHERE cart.user_id = ?
             FOR UPDATE`,
            [userId]
        );

        if (cartItems.length === 0) {
            await connection.rollback();
            return res.status(400).json({
                message: "Your cart is empty"
            });
        }

        // Calculate total amount
        let totalAmount = 0;
        cartItems.forEach((item) => {
            totalAmount += Number(item.price || 0) * Number(item.quantity || 1);
        });

        // 2. Validate stock & decrement atomically inside transaction
        for (const item of cartItems) {
            let tableName;
            if (item.product_type === "allproduct") {
                tableName = "allproducts";
            } else if (item.product_type === "newarrival") {
                tableName = "newarrivals";
            } else {
                throw new Error("Invalid product type");
            }

            // Lock the product row
            const [prodRows] = await connection.query(
                `SELECT id, name, stock, product_code FROM ${tableName} WHERE id = ? FOR UPDATE`,
                [item.product_id]
            );

            if (prodRows.length === 0) {
                throw new Error(`${item.product_name || "Product"} is no longer available`);
            }

            const currentProduct = prodRows[0];
            const prodCode = currentProduct.product_code || item.product_code;

            if (Number(currentProduct.stock) < Number(item.quantity)) {
                throw new Error(
                    `${currentProduct.name || item.product_name || "Product"} is out of stock`
                );
            }

            // If product is linked via product_code across allproducts & newarrivals, deduct from both tables
            if (prodCode) {
                const [res1] = await connection.query(
                    `UPDATE allproducts
                     SET stock = stock - ?
                     WHERE (product_code = ? OR (id = ? AND ? = 'allproduct'))
                     AND stock >= ?`,
                    [item.quantity, prodCode, item.product_id, item.product_type, item.quantity]
                );

                const [res2] = await connection.query(
                    `UPDATE newarrivals
                     SET stock = stock - ?
                     WHERE (product_code = ? OR (id = ? AND ? = 'newarrival'))
                     AND stock >= ?`,
                    [item.quantity, prodCode, item.product_id, item.product_type, item.quantity]
                );

                if (res1.affectedRows === 0 && res2.affectedRows === 0) {
                    throw new Error(
                        `${currentProduct.name || item.product_name || "Product"} is out of stock`
                    );
                }
            } else {
                const [result] = await connection.query(
                    `UPDATE ${tableName}
                     SET stock = stock - ?
                     WHERE id = ?
                     AND stock >= ?`,
                    [item.quantity, item.product_id, item.quantity]
                );

                if (result.affectedRows === 0) {
                    throw new Error(
                        `${currentProduct.name || item.product_name || "Product"} is out of stock`
                    );
                }
            }
        }

        // 3. Create order
        const [orderResult] = await connection.query(
            `INSERT INTO orders (user_id, total_amount, status)
             VALUES (?, ?, ?)`,
            [userId, totalAmount, "Pending"]
        );

        const orderId = orderResult.insertId;

        // 4. Insert order items
        for (const item of cartItems) {
            await connection.query(
                `INSERT INTO order_items
                 (order_id, product_id, product_type, quantity, price, selected_variant)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    orderId,
                    item.product_id,
                    item.product_type,
                    item.quantity,
                    item.price,
                    item.selected_variant || null
                ]
            );
        }

        // 5. Remove ordered products from cart
        await connection.query(
            `DELETE FROM cart WHERE user_id = ?`,
            [userId]
        );

        // Commit transaction
        await connection.commit();

        res.status(201).json({
            message: "Order placed successfully. An admin will confirm it soon",
            orderId: orderId,
            totalAmount: totalAmount
        });

    } catch (error) {
        await connection.rollback();
        console.log("Order creation error:", error.message);

        if (error.message.includes("out of stock") || error.message.includes("no longer available")) {
            return res.status(409).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: "Failed to place order",
            error: error.message
        });

    } finally {
        connection.release();
    }
};

// Customer: Get my orders with detailed items & status
const getMyOrders = async (req, res) => {
    try {
        const userId = req.user.id;

        const [orders] = await db.query(
            `SELECT id, user_id, total_amount, status, created_at
             FROM orders
             WHERE user_id = ?
             ORDER BY id DESC`,
            [userId]
        );

        if (orders.length === 0) {
            return res.status(200).json({ orders: [] });
        }

        const orderIds = orders.map(o => o.id);
        const [items] = await db.query(
            `SELECT 
                oi.id,
                oi.order_id,
                oi.product_id,
                oi.product_type,
                oi.quantity,
                oi.price,
                oi.selected_variant,
                CASE
                    WHEN oi.product_type = 'newarrival' THEN na.name
                    WHEN oi.product_type = 'allproduct' THEN ap.name
                END AS product_name,
                CASE
                    WHEN oi.product_type = 'newarrival' THEN na.image
                    WHEN oi.product_type = 'allproduct' THEN ap.image
                END AS image,
                CASE
                    WHEN oi.product_type = 'newarrival' THEN na.category
                    WHEN oi.product_type = 'allproduct' THEN ap.category
                END AS category
             FROM order_items oi
             LEFT JOIN newarrivals na ON oi.product_id = na.id AND oi.product_type = 'newarrival'
             LEFT JOIN allproducts ap ON oi.product_id = ap.id AND oi.product_type = 'allproduct'
             WHERE oi.order_id IN (?)`,
            [orderIds]
        );

        const itemsByOrder = {};
        items.forEach(item => {
            if (!itemsByOrder[item.order_id]) {
                itemsByOrder[item.order_id] = [];
            }
            itemsByOrder[item.order_id].push(item);
        });

        const ordersWithItems = orders.map(order => ({
            ...order,
            items: itemsByOrder[order.id] || []
        }));

        res.status(200).json({
            orders: ordersWithItems
        });

    } catch (error) {
        console.log("getMyOrders error:", error);
        res.status(500).json({
            message: "Failed to fetch orders",
            error: error.message
        });
    }
};

// Admin: Get all orders with customer details and item count
const getOrders = async (req, res) => {
    try {
        const [orders] = await db.query(
            `SELECT 
                orders.id,
                orders.user_id,
                orders.total_amount,
                orders.status,
                orders.created_at,
                users.fullName AS customer_name,
                users.email AS customer_email,
                users.phone AS customer_phone
             FROM orders
             LEFT JOIN users ON orders.user_id = users.id
             ORDER BY orders.id DESC`
        );

        if (orders.length === 0) {
            return res.status(200).json({ orders: [] });
        }

        const orderIds = orders.map(o => o.id);
        const [items] = await db.query(
            `SELECT 
                oi.id,
                oi.order_id,
                oi.product_id,
                oi.product_type,
                oi.quantity,
                oi.price,
                oi.selected_variant,
                CASE
                    WHEN oi.product_type = 'newarrival' THEN na.name
                    WHEN oi.product_type = 'allproduct' THEN ap.name
                END AS product_name,
                CASE
                    WHEN oi.product_type = 'newarrival' THEN na.image
                    WHEN oi.product_type = 'allproduct' THEN ap.image
                END AS image
             FROM order_items oi
             LEFT JOIN newarrivals na ON oi.product_id = na.id AND oi.product_type = 'newarrival'
             LEFT JOIN allproducts ap ON oi.product_id = ap.id AND oi.product_type = 'allproduct'
             WHERE oi.order_id IN (?)`,
            [orderIds]
        );

        const itemsByOrder = {};
        items.forEach(item => {
            if (!itemsByOrder[item.order_id]) {
                itemsByOrder[item.order_id] = [];
            }
            itemsByOrder[item.order_id].push(item);
        });

        const ordersWithDetails = orders.map(order => ({
            ...order,
            items: itemsByOrder[order.id] || []
        }));

        res.status(200).json({
            orders: ordersWithDetails
        });

    } catch (error) {
        console.log("getOrders error:", error);
        res.status(500).json({
            message: "Failed to fetch orders",
            error: error.message
        });
    }
};

// Admin: Confirm order
const confrimOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query(
            `UPDATE orders
             SET status = ?
             WHERE id = ?`,
            ["Confirmed", id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        res.status(200).json({
            message: "Order confirmed successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to confirm order",
            error: error.message
        });
    }
};

// Admin: Cancel order and restore stock across linked tables
const cancelOrder = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { id } = req.params;
        await connection.beginTransaction();

        const [orders] = await connection.query(
            "SELECT * FROM orders WHERE id = ? FOR UPDATE",
            [id]
        );

        if (orders.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                message: "Order not found"
            });
        }

        if (orders[0].status === "Cancelled") {
            await connection.rollback();
            return res.status(400).json({
                message: "Order is already cancelled"
            });
        }

        // Restore stock for items in this order
        const [items] = await connection.query(
            "SELECT * FROM order_items WHERE order_id = ?",
            [id]
        );

        for (const item of items) {
            const table = item.product_type === "newarrival" ? "newarrivals" : "allproducts";

            const [prod] = await connection.query(
                `SELECT product_code FROM ${table} WHERE id = ?`,
                [item.product_id]
            );

            const prodCode = prod.length > 0 ? prod[0].product_code : null;

            if (prodCode) {
                await connection.query(
                    `UPDATE allproducts SET stock = stock + ? WHERE product_code = ?`,
                    [item.quantity, prodCode]
                );
                await connection.query(
                    `UPDATE newarrivals SET stock = stock + ? WHERE product_code = ?`,
                    [item.quantity, prodCode]
                );
            } else {
                await connection.query(
                    `UPDATE ${table} SET stock = stock + ? WHERE id = ?`,
                    [item.quantity, item.product_id]
                );
            }
        }

        await connection.query(
            "UPDATE orders SET status = 'Cancelled' WHERE id = ?",
            [id]
        );

        await connection.commit();

        res.status(200).json({
            message: "Order cancelled successfully and stock restored"
        });

    } catch (error) {
        await connection.rollback();
        console.log("Cancel order error:", error);
        res.status(500).json({
            message: "Failed to cancel order",
            error: error.message
        });
    } finally {
        connection.release();
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getOrders,
    confrimOrder,
    cancelOrder
};