const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


// product get 

const getproducts = async (req, res) => {
    try {

        const [newarrivals] = await db.query(
            `SELECT *
            FROM newarrivals`
        );

        res.status(200).json(newarrivals);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Failed to fetch products",
            error: error.message
        });
    }
};


// create new product 

const createproduct = async (req, res) => {
    try {

        const { 
            name, price, category,
             image, stock, product_code, targetType, isBoth,
             description, sizes, variant_type, images, meta_title, meta_description } = req.body;

        const isBothSelected = targetType === "both" || isBoth === true || Boolean(product_code);
        const slug = name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
        const imagesStr = Array.isArray(images) ? images.join(",") : images || image || "";
        const finalVariantType = variant_type || "none";
        const finalMetaTitle = meta_title || `${name} – ShopEasy`;
        const finalMetaDesc = meta_description || (description ? description.substring(0, 155) : `Buy ${name} at the best price on ShopEasy.`);

        // duplicate check for new product add time 
        const [existingProduct] = await db.query(
            `SELECT id, product_code
             FROM newarrivals
             WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))`,
            [name]
        );

        if (existingProduct.length > 0){
            if (isBothSelected) {
                // If 'both' is selected or product_code is passed, duplicate validation does not block.
                const existingId = existingProduct[0].id;
                const finalCode = product_code || existingProduct[0].product_code || `new-${existingId}`;
                if (product_code && existingProduct[0].product_code !== product_code) {
                    await db.query(
                        `UPDATE newarrivals SET product_code = ? WHERE id = ?`,
                        [product_code, existingId]
                    );
                }
                return res.status(200).json({
                    message: "Product exists in New Arrivals, updated for both",
                    productId: existingId,
                    productCode: finalCode
                });
            }

            return res.status(400).json({
                message: "Product already exists in New Arrivals",
                errors: {
                    name: "Product already exists in New Arrivals"
                }
            });
        }

        const [result] = await db.query(
            `INSERT INTO newarrivals
             (name, price, category, image, stock, product_code, description, sizes, variant_type, images, slug, meta_title, meta_description)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, price, category, image, stock, product_code || null,
             description || null, sizes || null, finalVariantType, imagesStr || null, slug,
             finalMetaTitle, finalMetaDesc]
        );

        // product code recive from allproducts
        if (product_code){
            return res.status(201).json({
                message:"New arrival product Created Successfully",
                productId:result.insertId,
                productCode:product_code
            });
        }

        //new arrival create seprate product it will make new code her own product

        const newProductCode = `new-${result.insertId}`;

        await db.query(
            `UPDATE newarrivals
             SET product_code=?
            WHERE id =?`,
            [newProductCode,result.insertId]
        );

        res.status(201).json({
            message: "New arrival Product was created successfully",
            productId: result.insertId,
            productCode:newProductCode
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Failed to create product",
            error: error.message
        });
    }
};


// update a previous product

const updateproduct = async (req, res) => {
    try {

        const { id } = req.params;

        const {
            name, price, category, image, stock,
            description, sizes, variant_type, images, meta_title, meta_description
        } = req.body;

        const slug = name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
        const imagesStr = Array.isArray(images) ? images.join(",") : images || image || "";
        const finalVariantType = variant_type || "none";
        const finalMetaTitle = meta_title || `${name} – ShopEasy`;
        const finalMetaDesc = meta_description || (description ? description.substring(0, 155) : `Buy ${name} at the best price on ShopEasy.`);

        const [currProd] = await db.query(
            "SELECT product_code FROM newarrivals WHERE id = ?",
            [id]
        );

        const [result] = await db.query(
            `UPDATE newarrivals
             SET name = ?, price = ?, category = ?, image = ?, stock = ?,
                 description = ?, sizes = ?, variant_type = ?, images = ?, slug = ?,
                 meta_title = ?, meta_description = ?
             WHERE id = ?`,
            [name, price, category, image, stock,
             description || null, sizes || null, finalVariantType, imagesStr || null, slug,
             finalMetaTitle, finalMetaDesc, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        // 2. If product has product_code, sync changes to allproducts table as well
        const prodCode = currProd.length > 0 ? currProd[0].product_code : null;
        if (prodCode) {
            await db.query(
                `UPDATE allproducts
                 SET name = ?, price = ?, category = ?, image = ?, stock = ?,
                     description = ?, sizes = ?, variant_type = ?, images = ?, slug = ?,
                     meta_title = ?, meta_description = ?
                 WHERE product_code = ?`,
                [name, price, category, image, stock,
                 description || null, sizes || null, finalVariantType, imagesStr || null, slug,
                 finalMetaTitle, finalMetaDesc, prodCode]
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

// Login page on add to cart click function

const loginUser = async (req, res) => {
    try {

        const { email, password } = req.body;

        // Find user
        const [users] = await db.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );
        console.log("LOGIN EMAIL:", email);
        console.log("USER FOUND:", users.length);

        if (users.length === 0) {

            return res.status(401).json({
                message: "User not found. Please register."
            });
        }

        const user = users[0];

        // Check password
        const passwordMatch = await bcrypt.compare(
        password, user.password );

        if (!passwordMatch) {

            return res.status(401).json({
             message: "Incorrect password"
            });
    }

 // Create JWT
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        // Send token
        res.status(200).json({
            message: "Login successful",
            token: token
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Login failed",
            error: error.message
        });
    }
};

// login or switch register form 
const registerUser = async (req, res) => {
    try {

        const {
            fullName,
            email,
            password
        } = req.body;

// Check existing user
        const [existingUser] = await db.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (existingUser.length > 0) {

            return res.status(409).json({
                message: "Email already registered"
            });

        }

// hash password
const hashedPassword = await bcrypt.hash(
            password,
            10
        );        

// save hasdedPassword
        const [result] = await db.query(
            `INSERT INTO users
            (fullName, email, password)
            VALUES (?, ?, ?)`,
            [fullName, email, hashedPassword]
        );


        res.status(201).json({
            message: "Registration successful",
            userId: result.insertId
        });


    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Registration failed",
            error: error.message
        });
    }
};


// delete a product from newarrivals
const deleteproduct = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            "DELETE FROM newarrivals WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Product not found in new arrivals"
            });
        }

        res.status(200).json({
            message: "Product deleted successfully from new arrivals"
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
    getproducts,
    createproduct,
    updateproduct,
    deleteproduct,
    loginUser,
    registerUser
};