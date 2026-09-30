const db = require("../db");

// Helper: generate a URL slug from a name
const generateSlug = (name) =>
    name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

// GET all products (list view)
const getallproducts = async (req, res) => {
    try {
        const [allproducts] = await db.query(
            "SELECT * FROM allproducts ORDER BY id DESC"
        );
        res.status(200).json(allproducts);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to fetch allproducts",
            error: error.message
        });
    }
};

// GET single product by slug (for product detail page)
const getProductBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        // Try allproducts first, then newarrivals
        let [rows] = await db.query(
            "SELECT * FROM allproducts WHERE slug = ? LIMIT 1",
            [slug]
        );

        if (!rows.length) {
            [rows] = await db.query(
                "SELECT * FROM newarrivals WHERE slug = ? LIMIT 1",
                [slug]
            );
        }

        if (!rows.length) {
            return res.status(404).json({ message: "Product not found" });
        }

        const product = rows[0];

        // Parse comma-separated images into array
        product.imageList = product.images
            ? product.images.split(",").map((img) => img.trim()).filter(Boolean)
            : product.image
            ? [product.image]
            : [];

        // Parse comma-separated sizes into array
        product.sizeList = product.sizes
            ? product.sizes.split(",").map((s) => s.trim()).filter(Boolean)
            : [];

        res.status(200).json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to fetch product",
            error: error.message
        });
    }
};

// GET single product by ID (admin edit)
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(
            "SELECT * FROM allproducts WHERE id = ? LIMIT 1",
            [id]
        );
        if (!rows.length) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch product", error: error.message });
    }
};

// POST: create a new product
const createProducts = async (req, res) => {
    try {
        const {
            name, price, category, image, stock,
            description, sizes, images,
            meta_title, meta_description,
            targetType, isBoth
        } = req.body;

        const isBothSelected = targetType === "both" || isBoth === true;
        const slug = generateSlug(name);

        // Check duplicate in allproducts
        const [allproducts] = await db.query(
            `SELECT id, product_code FROM allproducts WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))`,
            [name]
        );

        if (allproducts.length > 0) {
            if (isBothSelected) {
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
                errors: { name: "Product already exists in All Products" }
            });
        }

        // Build comma-separated images string
        const imagesStr = Array.isArray(images)
            ? images.join(",")
            : images || image || "";

        // Auto-generate meta if not provided
        const finalMetaTitle = meta_title || `${name} – ShopEasy`;
        const finalMetaDesc =
            meta_description ||
            (description
                ? description.substring(0, 155) + (description.length > 155 ? "…" : "")
                : `Buy ${name} at the best price on ShopEasy.`);

        const [result] = await db.query(
            `INSERT INTO allproducts
             (name, price, category, image, stock, description, sizes, images, slug, meta_title, meta_description)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name, price, category, image, stock,
                description || null,
                sizes || null,
                imagesStr || null,
                slug,
                finalMetaTitle,
                finalMetaDesc
            ]
        );

        const productCode = `PROD-${result.insertId}`;
        await db.query(
            `UPDATE allproducts SET product_code = ? WHERE id = ?`,
            [productCode, result.insertId]
        );

        res.status(201).json({
            message: "Product created successfully",
            productId: result.insertId,
            productCode
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to create product",
            error: error.message
        });
    }
};

// PUT: update existing product
const updateProducts = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, price, category, image, stock,
            description, sizes, images,
            meta_title, meta_description
        } = req.body;

        // Fetch current product_code before update
        const [currProd] = await db.query(
            "SELECT product_code FROM allproducts WHERE id = ?",
            [id]
        );

        const slug = generateSlug(name);
        const imagesStr = Array.isArray(images)
            ? images.join(",")
            : images || image || "";

        const finalMetaTitle = meta_title || `${name} – ShopEasy`;
        const finalMetaDesc =
            meta_description ||
            (description
                ? description.substring(0, 155) + (description.length > 155 ? "…" : "")
                : `Buy ${name} at the best price on ShopEasy.`);

        const [result] = await db.query(
            `UPDATE allproducts
             SET name = ?, price = ?, category = ?, image = ?, stock = ?,
                 description = ?, sizes = ?, images = ?, slug = ?,
                 meta_title = ?, meta_description = ?
             WHERE id = ?`,
            [
                name, price, category, image, stock,
                description || null,
                sizes || null,
                imagesStr || null,
                slug,
                finalMetaTitle,
                finalMetaDesc,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Sync to newarrivals if product_code exists
        const prodCode = currProd.length > 0 ? currProd[0].product_code : null;
        if (prodCode) {
            await db.query(
                `UPDATE newarrivals
                 SET name = ?, price = ?, category = ?, image = ?, stock = ?,
                     description = ?, sizes = ?, images = ?, slug = ?,
                     meta_title = ?, meta_description = ?
                 WHERE product_code = ?`,
                [
                    name, price, category, image, stock,
                    description || null,
                    sizes || null,
                    imagesStr || null,
                    slug,
                    finalMetaTitle,
                    finalMetaDesc,
                    prodCode
                ]
            );
        }

        res.status(200).json({
            message: "Product updated successfully" + (prodCode ? " and synced across both tables" : "")
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to update product",
            error: error.message
        });
    }
};

// DELETE product from allproducts
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const [orderItems] = await db.query(
            `SELECT id FROM order_items
             WHERE product_id = ? AND product_type = 'allproduct' LIMIT 1`,
            [id]
        );

        if (orderItems.length > 0) {
            return res.status(400).json({
                message: "This product couldn't be deleted because it is stored in orders"
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

        res.status(200).json({ message: "Product deleted successfully from all products" });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to delete product",
            error: error.message
        });
    }
};

module.exports = {
    getallproducts,
    getProductBySlug,
    getProductById,
    createProducts,
    updateProducts,
    deleteProduct
};