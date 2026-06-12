/* src/store/ProductLayout.tsx */
import React, { useState, useEffect } from 'react';
import './ProductLayout.css'; 

interface GalleryImage {
  url: string;
  role_tag: 'primary' | 'secondary' | 'auxiliary';
}

interface ProductFeatureRow {
  feature_text: string;
  feature_type: string;
}

export interface EditorialProductLayoutProps {
  id: string;
  brand: string;
  category?: string; 
  subCategory: string;
  galleryImages: GalleryImage[];
  productFeatures?: ProductFeatureRow[]; 
  productName: string;
  rating: number;
  price: number;
  originalPrice: number;
  description: string;
  motorDetails: string;
  batteryDetails: string;
  drivetrainDetails: string;
  brakingDetails: string;
  weightDetails: string;
  ulCert: string;
  tags: string[] | string; 
  rawTrackingUrl?: string; 
  onClose?: () => void; 
}

export const EditorialProductLayout: React.FC<EditorialProductLayoutProps> = ({
  id,
  brand,
  category = 'ebike', 
  subCategory,
  galleryImages = [],
  productFeatures = [], 
  productName,
  rating,
  price,
  originalPrice,
  description,
  motorDetails,
  batteryDetails,
  drivetrainDetails,
  brakingDetails,
  weightDetails,
  ulCert, 
  tags = [],
  rawTrackingUrl = '',
  onClose
}) => {
  const [activeImage, setActiveImage] = useState<string>('');
  const isOnSale = Number(originalPrice) > Number(price);

  useEffect(() => {
    if (galleryImages && galleryImages.length > 0) {
      const primaryAsset = galleryImages.find(img => img.role_tag === 'primary');
      setActiveImage(primaryAsset ? primaryAsset.url : galleryImages[0].url);
    } else {
      setActiveImage('');
    }
  }, [galleryImages, id]);

  const getManufacturerLogoUrl = (brandName: string): string => {
    if (!brandName) return '';
    const lookupKey = brandName.toLowerCase().trim();
    if (lookupKey.includes('kingbull')) return '/data/assets/kingbull_logo.png';
    if (lookupKey.includes('ride1up')) return '/data/assets/Ride1Up_logo.png';
    if (lookupKey.includes('rockbros')) return '/data/assets/rockbros_text_logo.png';
    return '';
  };

  const logoBadgeUrl = getManufacturerLogoUrl(brand);

  const isTrueCertificationCode = (val: any): boolean => {
    if (!val) return false;
    const cleanStr = String(val).trim().toUpperCase();
    return !(cleanStr === '' || cleanStr === 'N/A' || cleanStr === 'UNDEFINED' || cleanStr === 'NULL');
  };

  const hasUlCertInFeaturesChildTable = productFeatures.some(
    feat => feat.feature_type.toLowerCase() === 'ul_certification'
  );

  /* 🎯 EXTENDED DYNAMIC LINK PAYLOAD CONSTRUCTOR HANDLER */
  const handleLaunchPipelineGateway = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const targetDestinationUrl = rawTrackingUrl || "https://ngaebo.com";

    // Normalize tags parameter safely stringwise
    const normalizedTagsString = typeof tags === 'string' 
      ? tags.toLowerCase() 
      : JSON.stringify(tags).toLowerCase();

    // 🎯 INTENT RESOLVER LOGIC: Converts database flags to explicit tracking custom keys
    let singlePrimaryIntentTag = "general_newsletter";
    
    if (category === "accessories") {
      if (normalizedTagsString.includes("comfort")) singlePrimaryIntentTag = "acc_comfort";
      else if (normalizedTagsString.includes("safety")) singlePrimaryIntentTag = "acc_safety";
      else if (normalizedTagsString.includes("offroad") || normalizedTagsString.includes("mud")) singlePrimaryIntentTag = "acc_offroad";
      else if (normalizedTagsString.includes("security") || normalizedTagsString.includes("lock")) singlePrimaryIntentTag = "acc_security";
      else if (normalizedTagsString.includes("commuter")) singlePrimaryIntentTag = "acc_commuter";
      else singlePrimaryIntentTag = "acc_safety"; 
    } else {
      singlePrimaryIntentTag = "bike_interest"; 
    }

    const params = new URLSearchParams();
    params.append("brand", brand);
    params.append("title", productName);
    params.append("category", category);
    params.append("sub", subCategory);
    params.append("dest", targetDestinationUrl);
    params.append("intent", singlePrimaryIntentTag); 

    // Open transition window in a fresh blank tab cleanly
    window.open(`/redirect-gateway?${params.toString()}`, '_blank', 'noopener,noreferrer');

    // Dismiss lightbox modal cleanly on parent shop floor canvas
    if (onClose) onClose();
  };

  return (
    <div className="modal-internal-container-catch" onClick={(e) => e.stopPropagation()}>
      <div className="modal-premium-accent-header">
        <span className="modal-header-category-title">{subCategory || 'Verified Configuration'}</span>
        <button className="modal-close-trigger-right-pinned" onClick={(e) => { e.stopPropagation(); if (onClose) onClose(); }}>✕</button>
      </div>

      <div className="modal-content-scroll-container">
        <div className="editorial-canvas-container" data-product-id={id}>
          <div className="layout-header-row">
            <div className="header-text-block">
              <div className="brand-badge-placement-container">
                {logoBadgeUrl && <img className="manufacturer-badge-logo" src={logoBadgeUrl} alt={`${brand} Logo`} />}
              </div>
              <h1 className="modal-editorial-title">{productName}</h1>
              <div className="meta-row">
                <span>{subCategory}</span>
                <span>|</span>
                <span className="stars-label">★★★★★</span>
                <span>({(rating || 4.8).toFixed(1)} Reviews)</span>
              </div>
            </div>
            <div className="header-logo-block">
              <img className="site-main-logo" src="/images/site-logo.png" alt="Identity Logo" />
              <div className="approval-pill"><span>✓ RideGuide Approved</span></div>
            </div>
          </div>

          <div className="layout-split">
            <div className="left-media">
              <div className="main-showcase">
                {activeImage ? <img className="display-img" src={activeImage} alt={productName} /> : <div style={{ color: '#cbd5e1', fontSize: '14px' }}>Loading media...</div>}
              </div>
              <div className="thumbs-row">
                {galleryImages && galleryImages.length > 1 && galleryImages.map((img, idx) => (
                  <button key={`${id}-gallery-thumbnail-${idx}`} onClick={(e) => { e.stopPropagation(); setActiveImage(img.url); }} className={`thumb-card ${activeImage === img.url ? 'thumb-active' : ''}`}>
                    <img className="thumb-img" src={img.url} alt="thumbnail" />
                  </button>
                ))}
              </div>
              <div className="editorial-description-text"><p>{description}</p></div>
            </div>

            <div className="right-content">
              <div className="features-section">
                <h4 className="feature-title">Key Features</h4>
                {productFeatures && productFeatures.length > 0 ? (
                  productFeatures.map((feat, idx) => (
                    <div key={`db-feature-item-${idx}`} className="check-line" style={{ marginBottom: '6px' }}><span className="check-icon">✓</span><span>{feat.feature_text}</span></div>
                  ))
                ) : (
                  <>
                    <div className="check-line"><span className="check-icon">✓</span><span>Premium Performance System Integration Architecture</span></div>
                    <div className="check-line"><span className="check-icon">✓</span><span>Extended Capacity Management Optimization Metrics</span></div>
                  </>
                )}
                {category !== 'accessories' && !hasUlCertInFeaturesChildTable && isTrueCertificationCode(ulCert) && (
                  <div className="check-line" style={{ marginBottom: '6px' }}><span className="check-icon">✓</span><span>System Certified Base Safety Architecture Protocols: {ulCert}</span></div>
                )}
              </div>

              <div className="action-footer">
                <div className="action-horizontal-row">
                  <div className="price-block-wrapper">
                    {isOnSale && originalPrice > 0 && <span className="msrp-label">MSRP: ${Number(originalPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>}
                    <div className={`price-value-label ${isOnSale ? 'price-sale' : 'price-normal'}`}>${Number(price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                  </div>
                  <button onClick={handleLaunchPipelineGateway} className="cta-button-link">Get Best Price ↗</button>
                </div>
                <span className="disclosure-text">Affiliate Disclosure: As an affiliate partner, we may earn localized micro-commissions from tracking verification loops.</span>
              </div>

              {category !== 'accessories' && (
                <div className="specs-list-box">
                  <div className="spec-line-item"><span className="spec-title-key">Motor:</span><span className="spec-desc-value">{motorDetails || 'N/A'}</span></div>
                  <div className="spec-line-item"><span className="spec-title-key">Battery:</span><span className="spec-desc-value">{batteryDetails || 'N/A'}</span></div>
                  <div className="spec-line-item"><span className="spec-title-key">Drivetrain:</span><span className="spec-desc-value">{drivetrainDetails || 'N/A'}</span></div>
                  <div className="spec-line-item"><span className="spec-title-key">Brakes:</span><span className="spec-desc-value">{brakingDetails || 'N/A'}</span></div>
                  <div className="spec-line-item"><span className="spec-title-key">Weight Class:</span><span className="spec-desc-value">{weightDetails || 'N/A'} Mapped Build</span></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};