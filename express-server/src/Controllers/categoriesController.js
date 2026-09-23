const db = require("../db");

const getcategories = async (req, res) => {
    try {

        const [categories] = await db.query(
            "SELECT * FROM categories"
        );

        res.status(200).json(categories);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Failed to fetch categories count",
            error: error.message
        });

    }
};



const getCategoryCount = async (req, res) => {
    try {

        const [rows] = await db.query(`
            SELECT 
                category, 
                COUNT(DISTINCT name) AS count,
                COUNT(DISTINCT CASE WHEN source = 'allproducts' THEN name END) AS allproducts_count,
                COUNT(DISTINCT CASE WHEN source = 'newarrivals' THEN name END) AS newarrivals_count
            FROM (
                SELECT name, category, 'allproducts' AS source FROM allproducts
                UNION ALL
                SELECT name, category, 'newarrivals' AS source FROM newarrivals
            ) AS combined
            WHERE category IS NOT NULL AND TRIM(category) != ''
            GROUP BY category
            ORDER BY category ASC
        `);

        res.status(200).json(rows);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Failed to fetch category count",
            error: error.message
        });
    }
};

// add category route

const addCategory = async (req, res) => {
    try {
        const { name } = req.body;

        const [result] = await db.query(
            `INSERT INTO categories (name) VALUES (?)`,
            [name]
        );

        res.status(201).json({
            message: "Category added successfully",
            categoryId: result.insertId
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Failed to add category",
            error: error.message
        });
    }
};

module.exports = {
    getcategories,
    getCategoryCount,
    addCategory
};