const db = require("../db");

const getallproducts = async (req, res) => {
    try {

        const [allproducts] = await db.query(
            "SELECT * FROM allproducts"
        );

        res.status(200).json(allproducts);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Failed to fetch allproducts",
            error: error.message
        });

    }
};


// create a new product
const createProducts = async (req, res) => {
    try {

        const { name, price, category, image, stock, targetType, isBoth } = req.body;

        const isBothSelected = targetType === "both" || isBoth === true;

        //check duplicate products

        const [allproducts] = await db.query(
            `SELECT id, product_code
             FROM allproducts
             WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))`,
            [name]
        );

        if (allproducts.length > 0) {
            if (isBothSelected) {
                // If 'both' is selected, duplicate validation does not block.
                // Reuse existing product and product_code
                let existingCode = allproducts[0].product_code;
                if (!existingCode) {
                    existingCode = `PROD-${allproducts[0].id}`;
                    await db.query(
                        `UPDATE allproducts SET product_code = ? WHERE id = ?`,
                        [existingCode, allproducts[0].id]
                    );
                }
                return res.status(200).json({
                    message: "Product exists in All Products, linking for both",
                    productId: allproducts[0].id,
                    productCode: existingCode
                });
            }

            return res.status(400).json({
                message: "Product already exists in All Products",
                errors: {
                    name: "Product already exists in All Products"
                }
            });
        }

        const [result] = await db.query(
            `INSERT INTO allproducts 
            (name, price, category, image, stock)
            VALUES (?, ?, ?, ?, ?)`,
            [name, price, category, image, stock]
        );

        // product code for table management 

        const productCode = `PROD-${result.insertId}`;

        await db.query (
            `UPDATE allproducts
            SET product_code = ?
            WHERE id =?`,
            [productCode, result.insertId]
        );

        res.status(201).json({
            message: "Product created successfully",
            productId: result.insertId,
            productCode: productCode
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Failed to create product",
            error: error.message
        });
    }
};

// update on previous product
const updateProducts = async (req, res) => {
    try {

        const { id } = req.params;

        const {
             name, price, category, image, stock
         } =
          req.body;

        // 1. Fetch current product_code before update
        const [currProd] = await db.query(
            "SELECT product_code FROM allproducts WHERE id = ?",
            [id]
        );

        const [result] = await db.query(
            `UPDATE allproducts
             SET name = ?,
                 price = ?,
                 category = ?,
                 image = ?,
                 stock =?
             WHERE id = ?`,
            [name, price, category, image, stock, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        // 2. If product has product_code, sync changes to newarrivals table as well
        const prodCode = currProd.length > 0 ? currProd[0].product_code : null;
        if (prodCode) {
            await db.query(
                `UPDATE newarrivals
                 SET name = ?,
                     price = ?,
                     category = ?,
                     image = ?,
                     stock = ?
                 WHERE product_code = ?`,
                [name, price, category, image, stock, prodCode]
            );
        }

        res.status(200).json({
            message: "Product updated successfully" + (prodCode ? " and synced across both tables" : "")
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Failed to update product",
            error: error.message
        });
    }
};

// delete  product from allproducts
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const [orderItems] = await db.query(
            `SELECT id
            FROM order_items
            WHERE product_id = ?
            AND product_type = 'allproduct'
            LIMIT 1`
            [id]
        );

        if(orderItems.length > 0){
            return res.status(400).json({
                message:"This product couldn't be deleted because the product is stored in orders"
        });
    }
        const [result] = await db.query(
            "DELETE FROM allproducts WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Product not found in all products"
            });
        }

        res.status(200).json({
            message: "Product deleted successfully from all products"
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Failed to delete product",
            error: error.message
        });
    }
};

module.exports = {
    getallproducts,
    createProducts,
    updateProducts,
    deleteProduct
};