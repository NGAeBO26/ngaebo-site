/* src/pages/Shop.tsx */
import { useState, useEffect } from 'react';
import { EditorialProductLayout } from '../store/ProductLayout';
import TacticalLeadForm from '../components/TacticalLeadForm';
// import Header from '../components/Header'; 
import Footer from '../components/Footer'; 
import './Shop.css';

interface GalleryImage {
  url: string;
  role_tag: 'primary' | 'secondary' | 'auxiliary';
}

interface ProductFeatureRow {
  feature_text: string;
  feature_type: string;
}

interface RelationalProductRow {
  id: string;
  brand: string;
  product_name: string;
  category: string; 
  sub_category: string;
  original_url: string;
  custom_affiliate_link: string;
  price: number;
  original_price: number;
  base_commission: string;
  cta_label: string;
  gallery_images: GalleryImage[];
  product_features?: ProductFeatureRow[]; 
  tags: string[] | string;
  description: string;
  notes_snippets: string;
  rating: number;
  ul_certification: string;
  motor_details?: string;
  battery_details?: string;
  drivetrain_details?: string;
  braking_details?: string;
  weight_details?: string;
  ebike_classification?: string;
}

export default function Shop() {
  const [products, setProducts] = useState<RelationalProductRow[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP network error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data) {
          const extractedProducts = data.products || (Array.isArray(data) ? data : []);
          setProducts(extractedProducts);
        }
      })
      .catch((err) => console.error('❌ Frontend Data Pipeline Error:', err));
  }, []);

  // 🎯 NAVIGATION SUPPRESSION DETECTOR: Automatically toggles a global body override 
  //    signature class to coordinate layout tracking when a specification sheet modal mounts.
  useEffect(() => {
    if (selectedProduct) {
      document.body.classList.add('product-modal-open');
    } else {
      document.body.classList.remove('product-modal-open');
    }

    // Comprehensive regression cleanup firewall loop when navigating away from the page
    return () => {
      document.body.classList.remove('product-modal-open');
    };
  }, [selectedProduct]);

  const getPrimaryGalleryImage = (images: GalleryImage[]): string => {
    if (!images || images.length === 0) return '';
    const primaryObj = images.find(img => img.role_tag === 'primary');
    return primaryObj ? primaryObj.url : images[0].url;
  };

  const cleanTitle = (rawName: string): string => {
    if (!rawName) return '';
    return rawName.split(' - ')[0].split(' | ')[0];
  };

  const getGridBrandLogoUrl = (brandName: string): string => {
    if (!brandName) return '';
    const lookupKey = brandName.toLowerCase().trim();
    if (lookupKey.includes('kingbull')) return '/data/assets/kingbull_logo.png';
    if (lookupKey.includes('ride1up')) return '/data/assets/Ride1Up_logo.png';
    if (lookupKey.includes('rockbros')) return '/data/assets/rockbros_text_logo.png';
    return '';
  };

  const handleCardClick = (row: RelationalProductRow) => {
    const safeTags = typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags;
    
    const configuredCardProps = {
      id: row.id,
      brand: row.brand,
      category: row.category, 
      subCategory: row.sub_category,
      galleryImages: row.gallery_images || [],
      gallery_images: row.gallery_images || [],
      images_gallery: row.gallery_images || [],
      productFeatures: row.product_features || [], 
      productName: cleanTitle(row.product_name),
      rating: Number(row.rating) || 5.0,
      price: Number(row.price),
      originalPrice: Number(row.original_price),
      description: row.description,
      motorDetails: row.motor_details,
      batteryDetails: row.battery_details,
      drivetrainDetails: row.drivetrain_details,
      brakingDetails: row.braking_details,
      weightDetails: row.weight_details,
      ulCert: row.ul_certification,
      tags: safeTags || [],
      rawTrackingUrl: row.custom_affiliate_link,
      ctaText: row.cta_label || 'Check Price'
    };
    
    setSelectedProduct(configuredCardProps);
  };

  const renderProductCard = (product: RelationalProductRow) => {
    const isOnSale = Number(product.original_price) > Number(product.price);
    const primaryDisplayImage = getPrimaryGalleryImage(product.gallery_images);
    const formattedTitle = cleanTitle(product.product_name);
    const brandLogoUrl = getGridBrandLogoUrl(product.brand);
    const isAccessoryItem = product.category === 'accessories';

    /* ─── 🎯 STEP A: PARSE SEMI-COLON SPLIT CHANNELS SAFELY ─── */
    const parsedSnippets = product.notes_snippets
      ? product.notes_snippets.split(';').map(snippet => snippet.trim()).filter(Boolean)
      : [];

    return (
      <div 
        key={product.id} 
        className={`product-grid-card ${isAccessoryItem ? 'accessory-compact-card' : ''}`} 
        onClick={() => handleCardClick(product)}
        role="button"
        tabIndex={0}
        aria-label={`View pricing and full operational parameters for ${formattedTitle}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick(product);
          }
        }}
      >
        <div className="card-premium-accent-header">
          <span>{product.sub_category || 'Verified Configuration'}</span>
        </div>

        <div className="card-image-box">
          {primaryDisplayImage ? (
            <img src={primaryDisplayImage} alt={`Showcase snapshot of ${formattedTitle}`} />
          ) : (
            <div className="card-image-empty-state">Image Array Empty</div>
          )}
        </div>
        
        {/* ─── 🎯 THE COMPREHENSIVE REALIGNED RE-SPECIFICATION CARD DETAILS ─── */}
        <div className="card-details-box">
          
          {/* ─── NEW PARENT ROW WRAPPER CONTEXT FOR SPLIT ASYMMETRICAL COLUMN DESCENT ─── */}
          <div className="product-card-primary-details">
            
            {/* COLUMN LEFT: Brand Logo & Title Frame Block */}
            <div className="product-card-identity-block">
              <div className="grid-brand-logo-frame">
                {brandLogoUrl ? (
                  <img className="grid-brand-logo-img" src={brandLogoUrl} alt={`${product.brand} Brand Logo`} />
                ) : (
                  <span className="brand-lbl-fallback">{product.brand}</span>
                )}
              </div>
              <span className="product-card-main-title">{formattedTitle}</span>
            </div>

            {/* COLUMN RIGHT: Stacked Right-Justified Features Grid Checklist (E-Bikes Only) */}
            {!isAccessoryItem && parsedSnippets.length > 0 && (
              <div className="product-card-stacked-features" aria-label="Product features">
                {parsedSnippets.map((snippet, index) => (
                  <div key={`${product.id}-snippet-${index}`} className="product-card-feature-item">
                    <span className="feature-checkmark">✓</span>
                    <span className="feature-text">{snippet}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* The pricing row remains nested cleanly beneath the primary details grid wrapper */}
          <div className="card-bottom-action-row">
            <div className="card-price-stack">
              {isOnSale && (
                <span className="card-msrp-label">
                  MSRP: ${Number(product.original_price).toFixed(2)}
                </span>
              )}
              <span className={`card-price-value ${isOnSale ? 'sale' : 'normal'}`}>
                ${Number(product.price).toFixed(2)}
              </span>
            </div>
            <span className="card-spec-pill-cta">
              {isAccessoryItem ? 'View Specs ↗' : 'View Technical Specs ↗'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const bikeProducts = products.filter(p => p.category === 'ebike');
  const accessoryProducts = products.filter(p => p.category === 'accessories');

  return (
    <div className="shop-master-layout-wrapper">
      

      <div className="shop-container">
        <div className="shop-persistent-header-stack">
          <section className="shop-hero-banner" aria-label="Retail Storefront Welcome Banner">
            <h1>New Gear. New Adventures.</h1>
            <p>Shop bikes, gear, accessories and more.</p>
          </section>

          <div className="shop-filter-bar" role="tablist" aria-label="Product Category Filter Matrix">
            <button className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')} role="tab" aria-selected={activeFilter === 'all'}>All Products</button>
            <button className={`filter-btn ${activeFilter === 'ebike' ? 'active' : ''}`} onClick={() => setActiveFilter('ebike')} role="tab" aria-selected={activeFilter === 'ebike'}>Vetted E-Bikes</button>
            <button className={`filter-btn ${activeFilter === 'accessories' ? 'active' : ''}`} onClick={() => setActiveFilter('accessories')} role="tab" aria-selected={activeFilter === 'accessories'}>Trail-Tested Gear</button>
          </div>
        </div>

        <div className="shop-grid-workspace">
          {activeFilter === 'all' && (
            <>
              {bikeProducts.length > 0 && (
                <div className="shop-accessories-divider-ribbon" role="presentation">
                  <div className="shop-accessories-divider-label">
                    Off Road Capable Bikes to Tackle Steep Grades on Gravel and Clay
                  </div>
                </div>
              )}
              {bikeProducts.map(product => renderProductCard(product))}

              {accessoryProducts.length > 0 && (
                <div className="shop-accessories-divider-ribbon section-following-divider" role="presentation">
                  <div className="shop-accessories-divider-label">
                    Trail Tested Gear For Tough Backcountry Routes
                  </div>
                </div>
              )}
              {accessoryProducts.map(product => renderProductCard(product))}
            </>
          )}

          {activeFilter === 'ebike' && (
            <>
              <div className="shop-accessories-divider-ribbon" role="presentation">
                <div className="shop-accessories-divider-label">
                  Off Road Capable Bikes to Tackle Steep Grades on Gravel and Clay
                </div>
              </div>
              {bikeProducts.map(product => renderProductCard(product))}
            </>
          )}

          {activeFilter === 'accessories' && (
            <>
              <div className="shop-accessories-divider-ribbon" role="presentation">
                <div className="shop-accessories-divider-label">
                  Trail Tested Gear For Tough Backcountry Routes
                </div>
              </div>
              {accessoryProducts.map(product => renderProductCard(product))}
            </>
          )}
        </div>

        {selectedProduct && (
          <div 
            className="modal-blur-overlay" 
            onClick={() => setSelectedProduct(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Retail Product Specification Lightbox Focus Module"
          >
            <div className="modal-scroll-shell" onClick={(e) => e.stopPropagation()}>
              <EditorialProductLayout 
                {...selectedProduct} 
                onClose={() => setSelectedProduct(null)} 
              />
            </div>
          </div>
        )}
      </div>

      <section className="lead-capture-footer" aria-label="Premium Map Sample Lead Capture Section">
        <div className="funnel-container">
          <div className="capture-split-layout">
            <div className="capture-text-stack">
              <span className="shop-sample-headline">Get Your Free Sample Pack.</span>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.95rem", lineHeight: 1.5 }}>
                Planning your bike's maiden voyage? We've mapped out the ultimate 3-pack sample of our favorite Fire Service Road routes, perfect for eBike adventures. Instant download package delivered to your email.
              </p>
            </div>
            <div>
              <TacticalLeadForm 
                buttonLabel="Get Free Maps ➔"
                sourceGroupTag="home_footer_checklist"
                layout="row"
              />
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}