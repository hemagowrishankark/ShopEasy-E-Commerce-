const db = require("../db");

// Admin: Get all registered customers with their orders and items
const getUsers = async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT id, email, fullName, role, phone, address, city, pincode 
             FROM users 
             WHERE LOWER(COALESCE(role, '')) NOT IN ('admin', 'superadmin')
               AND LOWER(email) NOT LIKE '%admin%'
             ORDER BY id DESC`
        );

        if (users.length === 0) {
            return res.status(200).json([]);
        }

        const [orders] = await db.query(
            `SELECT id, user_id, total_amount, status, created_at 
             FROM orders 
             ORDER BY id DESC`
        );

        let items = [];
        if (orders.length > 0) {
            const orderIds = orders.map(o => o.id);
            const [itemRows] = await db.query(
                `SELECT 
                    oi.id,
                    oi.order_id,
                    oi.product_id,
                    oi.product_type,
                    oi.quantity,
                    oi.price,
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
            items = itemRows;
        }

        // Map items to orders
        const itemsByOrderId = {};
        items.forEach(item => {
            if (!itemsByOrderId[item.order_id]) {
                itemsByOrderId[item.order_id] = [];
            }
            itemsByOrderId[item.order_id].push(item);
        });

        // Map orders to users
        const ordersByUserId = {};
        orders.forEach(order => {
            if (!ordersByUserId[order.user_id]) {
                ordersByUserId[order.user_id] = [];
            }
            ordersByUserId[order.user_id].push({
                ...order,
                items: itemsByOrderId[order.id] || []
            });
        });

        const customersWithOrders = users.map(user => {
            const userOrders = ordersByUserId[user.id] || [];
            const totalSpent = userOrders.reduce((sum, o) => {
                if (o.status !== "Cancelled") {
                    return sum + Number(o.total_amount || 0);
                }
                return sum;
            }, 0);

            return {
                ...user,
                name: user.fullName || user.email.split("@")[0],
                total_orders: userOrders.length,
                total_spent: totalSpent,
                pending_orders: userOrders.filter(o => o.status === "Pending").length,
                confirmed_orders: userOrders.filter(o => o.status === "Confirmed").length,
                orders: userOrders
            };
        });

        res.status(200).json(customersWithOrders);

    } catch (err) {
        console.log("getUsers error:", err);
        res.status(500).json({ message: "Internal server error", error: err.message });
    }
};

module.exports = {
    getUsers,
    getAdminCustomers: getUsers
};