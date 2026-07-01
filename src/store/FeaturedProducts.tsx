/* src/components/FeaturedProducts.tsx */
import { useState, useEffect } from "react";
import { EditorialProductLayout } from "../store/ProductLayout";
import "../pages/Shop.css"; /* Inherits core 12-column storefront tokens */
import "./FeaturedProducts.css"; /* Mapped styles separation overrides */

interface GalleryImage {
  url: string;
  role_tag: "primary" | "secondary" | "auxiliary";
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
  custom_affiliate_link: string;
  price: number;
  original_price: number;
  cta_label: string;
  gallery_images: GalleryImage[];
  product_features?: ProductFeatureRow[];
  tags: string[] | string;
  description: string;
  notes_snippets: string; /* Verified relational pipeline field hook */
  rating: number;
  ul_certification: string;
  motor_details?: string;
  battery_details?: string;
  drivetrain_details?: string;
  braking_details?: string;
  weight_details?: string;
}

interface FeaturedConfigItem {
  id: string;
  category: "ebike" | "accessories";
}

interface FeaturedProductsProps {
  sectionTitle?: string;
  sectionSubtitle?: string;
}

export default function FeaturedProducts({
  
}: FeaturedProductsProps) {
  const [products, setProducts] = useState<RelationalProductRow[]>([]);
  const [featuredConfig, setFeaturedConfig] = useState<FeaturedConfigItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  useEffect(() => {
    // 📡 Pipeline Target A: Express Database Product Compiler
    fetch("/api/products")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP network error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data) {
          const extracted = data.products || (Array.isArray(data) ? data : []);
          setProducts(extracted);
        }
      })
      .catch((err) => console.error("❌ Products Sync Error:", err));

    // 📡 Pipeline Target B: Static Config Filter File
    fetch("/data/featured_products.json")
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load featured mask configuration array: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data) setFeaturedConfig(data);
      })
      .catch((err) => console.error("❌ Featured Mask Sync Error:", err));
  }, []);

  /* ─── MODAL OBSERVER WINDOW HOOK ─── */
  useEffect(() => {
    if (selectedProduct) {
      document.body.classList.add("rg-product-modal-active");
    } else {
      document.body.classList.remove("rg-product-modal-active");
    }
    
    return () => {
      document.body.classList.remove("rg-product-modal-active");
    };
  }, [selectedProduct]);

  const getPrimaryGalleryImage = (images: GalleryImage[]): string => {
    if (!images || images.length === 0) return "";
    const primaryObj = images.find((img) => img.role_tag === "primary");
    return primaryObj ? primaryObj.url : images[0].url;
  };

  const cleanTitle = (rawName: string): string => {
    if (!rawName) return "";
    return rawName.split(" - ")[0].split(" | ")[0];
  };

  const getGridBrandLogoUrl = (brandName: string): string => {
    if (!brandName) return "";
    const lookupKey = brandName.toLowerCase().trim();
    if (lookupKey.includes("kingbull")) return "/data/assets/kingbull_logo.png";
    if (lookupKey.includes("ride1up")) return "/data/assets/Ride1Up_logo.png";
    if (lookupKey.includes("rockbros")) return "/data/assets/rockbros_text_logo.png";
    return "";
  };

  const handleCardClick = (product: RelationalProductRow) => {
    const safeTags = typeof product.tags === "string" ? JSON.parse(product.tags) : product.tags;

    setSelectedProduct({
      id: product.id,
      brand: product.brand,
      category: product.category,
      subCategory: product.sub_category,
      galleryImages: product.gallery_images || [],
      productFeatures: product.product_features || [],
      productName: cleanTitle(product.product_name),
      rating: Number(product.rating) || 5.0,
      price: Number(product.price),
      originalPrice: Number(product.original_price),
      description: product.description,
      motorDetails: product.motor_details,
      batteryDetails: product.battery_details,
      drivetrainDetails: product.drivetrain_details,
      brakingDetails: product.braking_details,
      weightDetails: product.weight_details,
      ulCert: product.ul_certification,
      tags: safeTags || [],
      rawTrackingUrl: product.custom_affiliate_link,
      ctaText: product.cta_label || "Check Price"
    });
  };

  const renderProductCard = (product: RelationalProductRow, expectedCategory: string) => {
  const isOnSale = Number(product.original_price) > Number(product.price);
  const primaryDisplayImage = getPrimaryGalleryImage(product.gallery_images);
  const formattedTitle = cleanTitle(product.product_name);
  const brandLogoUrl = getGridBrandLogoUrl(product.brand);
  const isAccessoryItem = expectedCategory === "accessories";

  /* ─── 🎯 STEP A: PARSE SEMI-COLON SPLIT CHANNELS SAFELY ─── */
  const parsedSnippets = product.notes_snippets
    ? product.notes_snippets.split(';').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div
      key={product.id}
      className={`product-grid-card ${isAccessoryItem ? "accessory-compact-card" : ""}`}
      onClick={() => handleCardClick(product)}
      role="button"
      tabIndex={0}
      aria-label={`View full technical specifications and pricing for ${formattedTitle}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick(product);
        }
      }}
    >
      <div className="card-premium-accent-header">
        <span>{product.sub_category || "Verified Configuration"}</span>
      </div>

      <div className="card-image-box">
        {primaryDisplayImage ? (
          <img src={primaryDisplayImage} alt={`Showcase photo of ${formattedTitle}`} />
        ) : (
          <div className="card-image-empty-state">Image Empty</div>
        )}
      </div>

      {/* ─── 🎯 THE CARD DETAILS CONTAINER OVERHAUL ─── */}
      <div className="card-details-box">
        
        {/* ─── FIX 1: NEW PARENT GRID WRAPPER FOR LOGO/NAME (LEFT) AND FEATURES (RIGHT) ─── */}
        <div className="product-card-primary-details">
          
          {/* COLUMN A (LEFT): Brand Identity Block */}
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

          {/* COLUMN B (RIGHT): Stacked, Right-Justified Features Matrix (Verdant theme) */}
          {/* ─── 🎯 GATED: ONLY RENDER STACKED SNIPPETS IF IT IS NOT AN ACCESSORY ITEM ─── */}
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

        {/* The existing card action/price row sits below the primary details grid */}
        <div className="card-bottom-action-row">
          <div className="card-price-stack">
            {isOnSale && (
              <span className="card-msrp-label">
                MSRP: ${Number(product.original_price).toFixed(2)}
              </span>
            )}
            <span className={`card-price-value ${isOnSale ? "sale" : "normal"}`}>
              ${Number(product.price).toFixed(2)}
            </span>
          </div>
          <span className="card-spec-pill-cta">
            {isAccessoryItem ? "View Specs ↗" : "View Technical Specs ↗"}
          </span>
        </div>
      </div>
    </div>
  );
};

  const bikeIds = featuredConfig.filter((item) => item.category === "ebike").map((item) => item.id);
  const accessoryIds = featuredConfig.filter((item) => item.category === "accessories").map((item) => item.id);

  const bikeProducts = products.filter((p) => bikeIds.includes(p.id));
  const accessoryProducts = products.filter((p) => accessoryIds.includes(p.id));

  return (
    <section className="featured-shop-section-pad">
      
      <section className="shop-hero-banner" aria-label="Storefront Announcement Banner">
        <span className="shop-hero-banner-main-headline">New Gear. New Adventures.</span>
        <p>Shop bikes, gear, accessories and more.</p>
      </section>

      <div className="featured-global-navigation-strip">
        <a href="/shop" className="btn-shop-all-gear">
          Shop All Gear <span className="arrow-transition">→</span>
        </a>
      </div>      
      
      <div className="funnel-container">
        <div className="shop-grid-workspace featured-grid-padding-reset">
          
          {/* Row loop A: Electric Bikes Layer */}
          {bikeProducts.length > 0 && (
            <div className="shop-accessories-divider-ribbon featured-full-width-ribbon" role="presentation">
              <div className="shop-accessories-divider-label">
                Off Road Capable Bikes to Tackle Steep Grades on Gravel and Clay
              </div>
            </div>
          )}
          {bikeProducts.map((product) => renderProductCard(product, "ebike"))}

          {/* Reassurance value strip banner */}
          <div className="featured-mid-trust-strip" role="region" aria-label="Product Quality Assurances">
            <span className="featured-trust-pill">
              <span className="featured-checkmark-accent">✓</span> Street and Off-Road Legal Bikes
            </span>
            <span className="featured-trust-pill">
              <span className="featured-checkmark-accent">✓</span> Safety Certified Batteries
            </span>
            <span className="featured-trust-pill">
              <span className="featured-checkmark-accent">✓</span> Direct Manufacturer Sourced Links
            </span>
          </div>

          {/* Row loop B: Accessories and Gear Layer */}
          {accessoryProducts.length > 0 && (
            <div className="shop-accessories-divider-ribbon section-following-divider featured-following-ribbon" role="presentation">
              <div className="shop-accessories-divider-label">
                Trail Tested Gear For Tough Backcountry Routes
              </div>
            </div>
          )}
          {accessoryProducts.map((product) => renderProductCard(product, "accessories"))}
        </div>

        {/* Product Spec Lightbox Modal Container Context */}
        {selectedProduct && (
          <div 
            className="modal-blur-overlay" 
            onClick={() => setSelectedProduct(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Product Specification Lightbox Window"
          >
            <div className="modal-scroll-shell" onClick={(e) => e.stopPropagation()}>
              <EditorialProductLayout {...selectedProduct} onClose={() => setSelectedProduct(null)} />
            </div>
          </div>
        )}

      </div>
    </section>
  );
}