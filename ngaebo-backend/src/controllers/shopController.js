/* ngaebo-backend/src/controllers/shopController.js */
const db = require('../config/db');

exports.getAllProducts = async (req, res) => {
  try {
    const queryText = `
      /* 🚲 PART A: Gather and aggregate data metrics for Electric Bikes */
      SELECT 
        p.id, 
        p.brand, 
        p.product_name, 
        p.category, 
        p.sub_category, 
        p.original_url, 
        p.custom_affiliate_link, 
        p.price, 
        p.original_price, 
        p.base_commission, 
        p.cta_label, 
        p.description, 
        p.notes_snippets,
        p.rating, 
        p.ul_certification,
        p.motor_details,
        p.battery_details,
        p.drivetrain_details,
        p.braking_details,
        p.weight_details,
        p.ebike_classification,
        COALESCE(
          (
            SELECT json_agg(json_build_object('url', pi.url, 'role_tag', pi.role_tag))
            FROM product_images pi
            WHERE pi.product_id = p.id
          ), '[]'::json
        ) AS gallery_images,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object('feature_text', pf.feature_text, 'feature_type', pf.feature_type)
              ORDER BY pf.id ASC
            )
            FROM product_features pf
            WHERE pf.product_id = p.id
              AND (
                LOWER(pf.feature_type) = 'motor' OR pf.feature_type LIKE '%motor%'
                OR LOWER(pf.feature_type) = 'battery' OR pf.feature_type LIKE '%battery%'
                OR LOWER(pf.feature_type) = 'ul_certification' OR pf.feature_type LIKE '%ul_certification%'
                OR LOWER(pf.feature_type) = 'warranty' OR pf.feature_type LIKE '%warranty%'
                OR LOWER(pf.feature_type) = 'shipping' OR pf.feature_type LIKE '%shipping%'
                OR LOWER(pf.feature_type) = 'ebike_class' OR pf.feature_type LIKE '%ebike_class%'
              )
          ), '[]'::json
        ) AS product_features,
        p.created_at
      FROM products p

      UNION ALL

      /* 🎒 PART B: Gather and aggregate data metrics for Affiliate Accessories */
      SELECT 
        a.id, 
        a.brand, 
        a.product_name, 
        a.category, 
        a.sub_category, 
        a.original_url, 
        a.custom_affiliate_link, 
        a.price, 
        a.original_price, 
        a.base_commission, 
        a.cta_label, 
        a.description, 
        a.notes_snippets,
        a.rating, 
        NULL AS ul_certification,    /* Default null fallbacks for bike-specific hardware data fields */
        NULL AS motor_details,
        NULL AS battery_details,
        NULL AS drivetrain_details,
        NULL AS braking_details,
        NULL AS weight_details,
        NULL AS ebike_classification,
        COALESCE(
          (
            SELECT json_agg(json_build_object('url', ai.url, 'role_tag', ai.role_tag))
            FROM accessory_images ai
            WHERE ai.accessory_id = a.id
          ), '[]'::json
        ) AS gallery_images,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object('feature_text', af.feature_text, 'feature_type', af.feature_type)
              ORDER BY af.id ASC
            )
            FROM accessory_features af
            WHERE af.accessory_id = a.id
          ), '[]'::json
        ) AS product_features,
        a.created_at
      FROM accessories a

      ORDER BY created_at DESC;
    `;
    
    const result = await db.query(queryText);
    res.status(200).json({ products: result.rows });
  } catch (error) {
    console.error('❌ Database Aggregation Query Fault:', error);
    res.status(500).json({ error: 'Database server internal fetch failure' });
  }
};