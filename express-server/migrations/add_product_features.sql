-- ============================================================
-- ShopEasy DB Migration: Product Description, Variants & Multiple Images
-- Run this ONCE in your MySQL client against the 'shopeasy' database
-- ============================================================

-- 1. Add description column to allproducts
ALTER TABLE allproducts
    ADD COLUMN IF NOT EXISTS description TEXT NULL AFTER stock,
    ADD COLUMN IF NOT EXISTS sizes VARCHAR(100) NULL AFTER description COMMENT 'Comma-separated sizes e.g. XS,S,M,L,XL,XXL',
    ADD COLUMN IF NOT EXISTS images TEXT NULL AFTER sizes COMMENT 'Comma-separated image filenames e.g. img1.jpg,img2.jpg',
    ADD COLUMN IF NOT EXISTS slug VARCHAR(100) NULL AFTER images COMMENT 'SEO-friendly URL slug',
    ADD COLUMN IF NOT EXISTS meta_title VARCHAR(70) NULL AFTER slug,
    ADD COLUMN IF NOT EXISTS meta_description VARCHAR(160) NULL AFTER meta_title;

-- 2. Add same columns to newarrivals
ALTER TABLE newarrivals
    ADD COLUMN IF NOT EXISTS description TEXT NULL AFTER stock,
    ADD COLUMN IF NOT EXISTS sizes VARCHAR(100) NULL AFTER description,
    ADD COLUMN IF NOT EXISTS images TEXT NULL AFTER sizes,
    ADD COLUMN IF NOT EXISTS slug VARCHAR(100) NULL AFTER images,
    ADD COLUMN IF NOT EXISTS meta_title VARCHAR(70) NULL AFTER slug,
    ADD COLUMN IF NOT EXISTS meta_description VARCHAR(160) NULL AFTER meta_title;

-- 3. Backfill slug for existing products (slug = product name lowercased, spaces→hyphens)
UPDATE allproducts
SET slug = LOWER(REPLACE(REPLACE(REPLACE(name, ' ', '-'), '/', '-'), '&', 'and'))
WHERE slug IS NULL OR slug = '';

UPDATE newarrivals
SET slug = LOWER(REPLACE(REPLACE(REPLACE(name, ' ', '-'), '/', '-'), '&', 'and'))
WHERE slug IS NULL OR slug = '';

-- 4. Add unique index on slug for fast lookups
ALTER TABLE allproducts ADD UNIQUE INDEX IF NOT EXISTS idx_allproducts_slug (slug);
ALTER TABLE newarrivals ADD UNIQUE INDEX IF NOT EXISTS idx_newarrivals_slug (slug);
