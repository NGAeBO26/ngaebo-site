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

export const EditorialProductLayout: React.FC<EditorialProductLayoutProps> = (props) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [activeImage, setActiveImage] = useState<string>('');
  const isOnSale = Number(props.originalPrice) > Number(props.price);

  // ─── RESPONSIVE VIEWPORT BOUNDARY DETECTOR ───
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    setIsMobile(mediaQuery.matches);
    
    const handleViewportChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener('change', handleViewportChange);
    
    return () => mediaQuery.removeEventListener('change', handleViewportChange);
  }, []);

  // Sync active thumbnail image selections
  useEffect(() => {
    if (props.galleryImages && props.galleryImages.length > 0) {
      const primaryAsset = props.galleryImages.find(img => img.role_tag === 'primary');
      setActiveImage(primaryAsset ? primaryAsset.url : props.galleryImages[0].url);
    } else {
      setActiveImage('');
    }
  }, [props.galleryImages, props.id]);

  const getManufacturerLogoUrl = (brandName: string): string => {
    if (!brandName) return '';
    const lookupKey = brandName.toLowerCase().trim();
    if (lookupKey.includes('kingbull')) return '/data/assets/kingbull_logo.png';
    if (lookupKey.includes('ride1up')) return '/data/assets/Ride1Up_logo.png';
    if (lookupKey.includes('rockbros')) return '/data/assets/rockbros_text_logo.png';
    return '';
  };

  const logoBadgeUrl = getManufacturerLogoUrl(props.brand);

  const isTrueCertificationCode = (val: any): boolean => {
    if (!val) return false;
    const cleanStr = String(val).trim().toUpperCase();
    return !(cleanStr === '' || cleanStr === 'N/A' || cleanStr === 'UNDEFINED' || cleanStr === 'NULL');
  };

  const hasUlCertInFeaturesChildTable = (props.productFeatures || []).some(
    feat => feat.feature_type.toLowerCase() === 'ul_certification'
  );

  const handleLaunchPipelineGateway = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const targetDestinationUrl = props.rawTrackingUrl || "https://ngaebo.com";
    const normalizedTagsString = typeof props.tags === 'string' 
      ? props.tags.toLowerCase() 
      : JSON.stringify(props.tags).toLowerCase();

    let singlePrimaryIntentTag = "general_newsletter";
    
    if (props.category === "accessories") {
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
    params.append("brand", props.brand);
    params.append("title", props.productName);
    params.append("category", props.category || 'ebike');
    params.append("sub", props.subCategory);
    params.append("dest", targetDestinationUrl);
    params.append("intent", singlePrimaryIntentTag); 

    window.open(`/redirect-gateway?${params.toString()}`, '_blank', 'noopener,noreferrer');
    if (props.onClose) props.onClose();
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 📱 NATIVE FULL-SCREEN SLIDE-OVER LAYOUT VIEW ENGINE
  // ──────────────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="rg-mobile-fullscreen-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Fixed Title Header Strip */}
        <div className="rg-mobile-sheet-header">
          <span className="rg-mobile-header-sub">{props.subCategory || 'Verified Configuration'}</span>
          <button className="rg-mobile-sheet-close-btn" onClick={(e) => { e.stopPropagation(); if (props.onClose) props.onClose(); }}>✕</button>
        </div>

        {/* Full Height Scroll Workspace Container */}
        <div className="rg-mobile-sheet-body">
          
          {/* Brand & Product Title (With Word Wrap Unlocked) */}
          <div className="rg-mobile-product-meta-block">
            {logoBadgeUrl && (
              <div className="rg-mobile-brand-frame">
                <img src={logoBadgeUrl} alt={`${props.brand} Logo`} />
              </div>
            )}
            <h1 className="rg-mobile-product-title">{props.productName}</h1>
            <div className="rg-mobile-stars-row">
              <span className="rg-mobile-stars">★★★★★</span>
              <span className="rg-mobile-reviews-lbl">({(props.rating || 4.8).toFixed(1)} Reviews)</span>
            </div>
          </div>

          {/* Media Showcase Panel Canvas */}
          <div className="rg-mobile-media-showcase">
            {activeImage ? <img className="rg-mobile-display-img" src={activeImage} alt={props.productName} /> : <div className="rg-mobile-media-empty">Loading media...</div>}
          </div>

          {/* Media Thumbnails Row Slider */}
          {props.galleryImages && props.galleryImages.length > 1 && (
            <div className="rg-mobile-thumbs-row-slider">
              {props.galleryImages.map((img, idx) => (
                <button 
                  key={`${props.id}-mob-thumb-${idx}`} 
                  onClick={(e) => { e.stopPropagation(); setActiveImage(img.url); }} 
                  className={`rg-mobile-thumb-card ${activeImage === img.url ? 'active' : ''}`}
                >
                  <img src={img.url} alt="thumbnail" />
                </button>
              ))}
            </div>
          )}

          {/* Rich Description Body Segment */}
          <div className="rg-mobile-description-block">
            <p>{props.description}</p>
          </div>

          {/* Strategic Value Proposition Checklists */}
          <div className="rg-mobile-features-card-deck">
            <h4 className="rg-mobile-block-section-title">Key Features</h4>
            {props.productFeatures && props.productFeatures.length > 0 ? (
              props.productFeatures.map((feat, idx) => (
                <div key={`mob-feat-item-${idx}`} className="rg-mobile-check-line">
                  <span className="rg-mobile-check-icon">✓</span>
                  <span>{feat.feature_text}</span>
                </div>
              ))
            ) : (
              <>
                <div className="rg-mobile-check-line"><span className="rg-mobile-check-icon">✓</span><span>Premium Performance System Integration Architecture</span></div>
                <div className="rg-mobile-check-line"><span className="rg-mobile-check-icon">✓</span><span>Extended Capacity Management Optimization Metrics</span></div>
              </>
            )}
            {props.category !== 'accessories' && !hasUlCertInFeaturesChildTable && isTrueCertificationCode(props.ulCert) && (
              <div className="rg-mobile-check-line">
                <span className="rg-mobile-check-icon">✓</span>
                <span>System Certified Safety Architecture: {props.ulCert}</span>
              </div>
            )}
          </div>

          {/* Technical Specs Stacked Parameters List Table */}
          {props.category !== 'accessories' && (
            <div className="rg-mobile-specs-table-deck">
              <h4 className="rg-mobile-block-section-title">Technical Specifications</h4>
              <div className="rg-mobile-spec-row-node"><span className="key">Motor:</span><span className="val">{props.motorDetails || 'N/A'}</span></div>
              <div className="rg-mobile-spec-row-node"><span className="key">Battery:</span><span className="val">{props.batteryDetails || 'N/A'}</span></div>
              <div className="rg-mobile-spec-row-node"><span className="key">Drivetrain:</span><span className="val">{props.drivetrainDetails || 'N/A'}</span></div>
              <div className="rg-mobile-spec-row-node"><span className="key">Brakes:</span><span className="val">{props.brakingDetails || 'N/A'}</span></div>
              <div className="rg-mobile-spec-row-node"><span className="key">Weight Class:</span><span className="val">{props.weightDetails || 'N/A'} Mapped Build</span></div>
            </div>
          )}

          {/* Commercial Transaction Area Footer Node */}
          <div className="rg-mobile-action-card-footer">
            <div className="rg-mobile-price-container">
              {isOnSale && props.originalPrice > 0 && (
                <span className="rg-mobile-msrp-crossed">MSRP: ${Number(props.originalPrice).toFixed(2)}</span>
              )}
              <div className={`rg-mobile-current-price ${isOnSale ? 'sale' : 'normal'}`}>
                ${Number(props.price).toFixed(2)}
              </div>
            </div>
            <button onClick={handleLaunchPipelineGateway} className="rg-mobile-cta-action-btn">
              Get Best Price ↗
            </button>
            <span className="rg-mobile-affiliate-disclosure">
              Affiliate Disclosure: As an affiliate partner, we may earn localized micro-commissions from tracking verification loops.
            </span>
          </div>

        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 🖥️ SACRED DESKTOP LIGHTBOX MODAL CONSOLE VIEW
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="modal-internal-container-catch" onClick={(e) => e.stopPropagation()}>
      <div className="modal-premium-accent-header">
        <span className="modal-header-category-title">{props.subCategory || 'Verified Configuration'}</span>
        <button className="modal-close-trigger-right-pinned" onClick={(e) => { e.stopPropagation(); if (props.onClose) props.onClose(); }}>✕</button>
      </div>

      <div className="modal-content-scroll-container">
        <div className="editorial-canvas-container" data-product-id={props.id}>
          <div className="layout-header-row">
            <div className="header-text-block">
              <div className="brand-badge-placement-container">
                {logoBadgeUrl && <img className="manufacturer-badge-logo" src={logoBadgeUrl} alt={`${props.brand} Logo`} />}
              </div>
              <h1 className="modal-editorial-title">{props.productName}</h1>
              <div className="meta-row">
                <span>{props.subCategory}</span>
                <span>|</span>
                <span className="stars-label">★★★★★</span>
                <span>({(props.rating || 4.8).toFixed(1)} Reviews)</span>
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
                {activeImage ? <img className="display-img" src={activeImage} alt={props.productName} /> : <div style={{ color: '#cbd5e1', fontSize: '14px' }}>Loading media...</div>}
              </div>
              <div className="thumbs-row">
                {props.galleryImages && props.galleryImages.length > 1 && props.galleryImages.map((img, idx) => (
                  <button key={`${props.id}-gallery-thumbnail-${idx}`} onClick={(e) => { e.stopPropagation(); setActiveImage(img.url); }} className={`thumb-card ${activeImage === img.url ? 'thumb-active' : ''}`}>
                    <img className="thumb-img" src={img.url} alt="thumbnail" />
                  </button>
                ))}
              </div>
              <div className="editorial-description-text"><p>{props.description}</p></div>
            </div>

            <div className="right-content">
              <div className="features-section">
                <h4 className="feature-title">Key Features</h4>
                {props.productFeatures && props.productFeatures.length > 0 ? (
                  props.productFeatures.map((feat, idx) => (
                    <div key={`db-feature-item-${idx}`} className="check-line" style={{ marginBottom: '6px' }}><span className="check-icon">✓</span><span>{feat.feature_text}</span></div>
                  ))
                ) : (
                  <>
                    <div className="check-line"><span className="check-icon">✓</span><span>Premium Performance System Integration Architecture</span></div>
                    <div className="check-line"><span className="check-icon">✓</span><span>Extended Capacity Management Optimization Metrics</span></div>
                  </>
                )}
                {props.category !== 'accessories' && !hasUlCertInFeaturesChildTable && isTrueCertificationCode(props.ulCert) && (
                  <div className="check-line" style={{ marginBottom: '6px' }}><span className="check-icon">✓</span><span>System Certified Base Safety Architecture Protocols: {props.ulCert}</span></div>
                )}
              </div>

              <div className="action-footer">
                <div className="action-horizontal-row">
                  <div className="price-block-wrapper">
                    {isOnSale && props.originalPrice > 0 && <span className="msrp-label">MSRP: ${Number(props.originalPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>}
                    <div className={`price-value-label ${isOnSale ? 'price-sale' : 'price-normal'}`}>${Number(props.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                  </div>
                  <button onClick={handleLaunchPipelineGateway} className="cta-button-link">Get Best Price ↗</button>
                </div>
                <span className="disclosure-text">Affiliate Disclosure: As an affiliate partner, we may earn localized micro-commissions from tracking verification loops.</span>
              </div>

              {props.category !== 'accessories' && (
                <div className="specs-list-box">
                  <div className="spec-line-item"><span className="spec-title-key">Motor:</span><span className="spec-desc-value">{props.motorDetails || 'N/A'}</span></div>
                  <div className="spec-line-item"><span className="spec-title-key">Battery:</span><span className="spec-desc-value">{props.batteryDetails || 'N/A'}</span></div>
                  <div className="spec-line-item"><span className="spec-title-key">Drivetrain:</span><span className="spec-desc-value">{props.drivetrainDetails || 'N/A'}</span></div>
                  <div className="spec-line-item"><span className="spec-title-key">Brakes:</span><span className="spec-desc-value">{props.brakingDetails || 'N/A'}</span></div>
                  <div className="spec-line-item"><span className="spec-title-key">Weight Class:</span><span className="spec-desc-value">{props.weightDetails || 'N/A'} Mapped Build</span></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};