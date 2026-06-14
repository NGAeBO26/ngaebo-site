/* ngaebo-backend/src/controllers/shopController.js */
const fs = require('fs');
const path = require('path');

/**
 * Clean title strings by stripping away marketing suffixes
 */
const cleanTitle = (rawName) => {
  if (!rawName) return '';
  return rawName.split(' - ')[0].split(' | ')[0];
};

/**
 * Transforms flat JSON database exports into the structured 
 * data objects expected by your original Shop.tsx UI architecture.
 */
const transformFlatFileProduct = (p) => {
  const specs = p.specifications || {};
  
  // 🎯 ALIGNMENT FIX: Read directly from the newly renamed images_gallery file attribute block
  const galleryImages = Array.isArray(p.images_gallery) && p.images_gallery.length > 0
    ? p.images_gallery.map(img => ({ url: img.url, role_tag: img.role_tag || 'secondary' }))
    : p.image ? [{ url: p.image, role_tag: 'primary' }] : [];

  // Reshapes key features object arrays into clean product feature loops
  const productFeatures = Array.isArray(p.key_features)
    ? p.key_features.map(f => ({ feature_text: f.feature_text, feature_type: f.feature_type }))
    : [];

  return {
    id: p.id,
    brand: p.brand,
    product_name: cleanTitle(p.product_name),
    category: p.category || 'ebike',
    sub_category: p.sub_category || '',
    original_url: p.original_url || '',
    custom_affiliate_link: p.custom_affiliate_link || '',
    price: Number(p.price) || 0,
    original_price: Number(p.original_price) || 0,
    base_commission: p.base_commission || '',
    cta_label: p.cta_label || 'Check Price',
    description: p.description || '',
    notes_snippets: p.notes_snippets || '',
    rating: Number(p.rating) || 5.0,
    ul_certification: p.ul_certification || specs.ul_certification || '',
    motor_details: specs.motor_details || null,
    battery_details: specs.battery_details || null,
    drivetrain_details: specs.drivetrain_details || null,
    braking_details: specs.braking_details || null,
    weight_details: specs.weight_details || null,
    ebike_classification: specs.ebike_classification || null,
    gallery_images: galleryImages,
    product_features: productFeatures,
    tags: Array.isArray(p.tags) ? p.tags : []
  };
};

exports.getAllProducts = async (req, res) => {
  const dataFilePath = path.join(__dirname, '..', '..', 'data', 'products.json');
  
  try {
    if (!fs.existsSync(dataFilePath)) {
      console.error(`❌ FILE PATH MISSING: products.json could not be found at ${dataFilePath}`);
      return res.status(404).json({ error: 'Shop products data asset file missing from server storage.' });
    }

    const rawFileContent = fs.readFileSync(dataFilePath, 'utf-8');
    const parsedJSON = JSON.parse(rawFileContent);
    
    const baseArray = Array.isArray(parsedJSON) ? parsedJSON : (parsedJSON.products || []);
    const transformedProducts = baseArray.map(transformFlatFileProduct);

    console.log(`📦 [SHOP DATA ENGINE]: Successfully compiled and delivered ${transformedProducts.length} items to shop client.`);
    return res.status(200).json({ products: transformedProducts });

  } catch (error) {
    console.error('❌ Critical Error inside Shop File Reader Engine:', error);
    return res.status(500).json({ error: 'Internal system fault processing local storage assets.' });
  }
};