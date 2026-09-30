-- ============================================================
-- ShopEasy DB Migration: Product Description, Variants & Multiple Images
-- Run this ONCE in your MySQL client against the 'shopeasy' database
-- ============================================================

-- 1. Add description and variant columns to allproducts
ALTER TABLE allproducts
    ADD COLUMN IF NOT EXISTS description TEXT NULL AFTER stock,
    ADD COLUMN IF NOT EXISTS sizes VARCHAR(100) NULL AFTER description COMMENT 'Comma-separated options e.g. XS,S,M,L,XL or 128GB,256GB',
    ADD COLUMN IF NOT EXISTS variant_type VARCHAR(50) NULL DEFAULT 'none' AFTER sizes COMMENT 'Variant category e.g. size, storage, ram, color, screen_size',
    ADD COLUMN IF NOT EXISTS images TEXT NULL AFTER variant_type COMMENT 'Comma-separated image filenames e.g. img1.jpg,img2.jpg',
    ADD COLUMN IF NOT EXISTS slug VARCHAR(100) NULL AFTER images COMMENT 'SEO-friendly URL slug',
    ADD COLUMN IF NOT EXISTS meta_title VARCHAR(70) NULL AFTER slug,
    ADD COLUMN IF NOT EXISTS meta_description VARCHAR(160) NULL AFTER meta_title;

-- 2. Add same columns to newarrivals
ALTER TABLE newarrivals
    ADD COLUMN IF NOT EXISTS description TEXT NULL AFTER stock,
    ADD COLUMN IF NOT EXISTS sizes VARCHAR(100) NULL AFTER description,
    ADD COLUMN IF NOT EXISTS variant_type VARCHAR(50) NULL DEFAULT 'none' AFTER sizes,
    ADD COLUMN IF NOT EXISTS images TEXT NULL AFTER variant_type,
    ADD COLUMN IF NOT EXISTS slug VARCHAR(100) NULL AFTER images,
    ADD COLUMN IF NOT EXISTS meta_title VARCHAR(70) NULL AFTER slug,
    ADD COLUMN IF NOT EXISTS meta_description VARCHAR(160) NULL AFTER meta_title;

-- 3. Add selected_variant to cart and order_items
ALTER TABLE cart
    ADD COLUMN IF NOT EXISTS selected_variant VARCHAR(100) NULL AFTER quantity;

ALTER TABLE order_items
    ADD COLUMN IF NOT EXISTS selected_variant VARCHAR(100) NULL AFTER product_type;

-- 4. Backfill slug for existing products (slug = product name lowercased, spaces→hyphens)
UPDATE allproducts
SET slug = LOWER(REPLACE(REPLACE(REPLACE(name, ' ', '-'), '/', '-'), '&', 'and'))
WHERE slug IS NULL OR slug = '';

UPDATE newarrivals
SET slug = LOWER(REPLACE(REPLACE(REPLACE(name, ' ', '-'), '/', '-'), '&', 'and'))
WHERE slug IS NULL OR slug = '';

-- 5. Add unique index on slug for fast lookups
ALTER TABLE allproducts ADD UNIQUE INDEX IF NOT EXISTS idx_allproducts_slug (slug);
ALTER TABLE newarrivals ADD UNIQUE INDEX IF NOT EXISTS idx_newarrivals_slug (slug);
