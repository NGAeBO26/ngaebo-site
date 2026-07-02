/* src/components/TransactionOverlay.tsx */
import { useEffect, useRef } from "react";
import "../styles/TokenUpsellModal.css"; // Reuse existing style framework definitions

export interface TransactionState {
  status: 'idle' | 'processing' | 'success' | 'failure';
  type: 'checkout_fulfillment' | 'single_unlock' | 'batch_unlock';
  title: string;
  message: string;
  meta?: {
    count?: number;
    email?: string;
    downloadUrl?: string;
  };
}

interface TransactionOverlayProps {
  state: TransactionState | null;
  onClose: () => void;
}

export default function TransactionOverlay({ state, onClose }: TransactionOverlayProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state && state.status !== 'idle' && modalRef.current) {
      modalRef.current.focus();
    }
  }, [state]);

  if (!state || state.status === 'idle') return null;

  const isProcessing = state.status === 'processing';
  const isSuccess = state.status === 'success';
  const isFailure = state.status === 'failure';

  return (
    <div className="rg-upsell-backdrop" onClick={isProcessing ? undefined : onClose} role="presentation">
      <div 
        className="rg-upsell-container"
        style={{ maxWidth: "640px" }} // Compressed down to a tight, focused notification card footprint
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* BRAND SKY BLUE TOP HEADER BANNER */}
        <div className="rg-upsell-brand-banner">
          <img 
            src="/images/logo.png" 
            alt="RideGuide Badge" 
            className="rg-upsell-banner-logo"
            onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
          />
          <img 
            src="/images/RideGuide_embroid-v1.svg" 
            alt="RideGuide Branding Script" 
            className="rg-upsell-banner-branding-svg"
            onError={(e) => { (e.target as HTMLImageElement).src = "/images/RideGuide_embroid-v1.png"; }}
          />
        </div>

        {!isProcessing && (
          <button className="rg-upsell-close-x" onClick={onClose} aria-label="Close notification">
            &times;
          </button>
        )}

        {/* CORE INTERACTION CARD LAYER */}
        <div className="rg-upsell-card-inner" style={{ padding: "32px", minHeight: "240px", justifyContent: "center" }}>
          
          {/* PROCESSING / LOADING VIEW */}
          {isProcessing && (
            <div style={{ textAlign: "center", width: "100%" }}>
              <div className="rg-upsell-badge-pill" style={{ backgroundColor: "#f1f5f9", color: "#64748b", animation: "pulse 1.5s infinite" }}>
                ⏳ Processing Transaction SECURE Handshake
              </div>
              <h2 className="rg-upsell-main-title" style={{ marginTop: "16px" }}>{state.title}</h2>
              <p className="rg-upsell-subcaption" style={{ color: "#64748b" }}>{state.message}</p>
              <div style={{ margin: "20px auto 0 auto", width: "32px", height: "32px", border: "3px solid #e2e8f0", borderTopColor: "#2b7cb6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          )}

          {/* SUCCESS VIEW */}
          {isSuccess && (
            <div style={{ textAlign: "center", width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>
              <span className="rg-upsell-badge-pill" style={{ backgroundColor: "#dcfce7", color: "#16a34a", alignSelf: "center" }}>
                🎉 {state.title || "Action Successful"}
              </span>

              {/* Layered Gold Credit Token Asset to match your premium visual system */}
              <div className="rg-upsell-left-preview-frame" style={{ width: "80px", height: "80px", border: "none", boxShadow: "none" }}>
                <img 
                  src="/data/assets/rideguide-token.png" 
                  alt="Success Token" 
                  className="rg-upsell-product-media" 
                  style={{ width: "100%", height: "100%" }}
                />
              </div>

              <p className="rg-upsell-subcaption" style={{ fontSize: "15px", color: "#334155", maxWidth: "480px", margin: "0 auto" }}>
                {state.message}
              </p>

              {state.meta?.downloadUrl ? (
                <a 
                  href={state.meta.downloadUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="rg-upsell-tier-cta-action-btn"
                  style={{ display: "inline-block", maxWidth: "280px", margin: "12px auto 0 auto", textDecoration: "none", textAlign: "center" }}
                >
                  🚀 Print / Open RideGuide Now
                </a>
              ) : (
                <button 
                  onClick={onClose} 
                  className="rg-upsell-tier-cta-action-btn" 
                  style={{ maxWidth: "200px", margin: "12px auto 0 auto" }}
                >
                  Return to Dashboard
                </button>
              )}
            </div>
          )}

          {/* FAILURE / ERROR VIEW */}
          {isFailure && (
            <div style={{ textAlign: "center", width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
              <span className="rg-upsell-badge-pill" style={{ backgroundColor: "#fee2e2", color: "#ef4444", alignSelf: "center" }}>
                ⚠️ Transaction Interrupted
              </span>
              <h2 className="rg-upsell-main-title" style={{ color: "#991b1b", fontSize: "20px" }}>{state.title}</h2>
              <p className="rg-upsell-subcaption" style={{ color: "#475569", maxWidth: "460px", margin: "0 auto" }}>
                {state.message}
              </p>
              <button 
                onClick={onClose} 
                className="rg-upsell-tier-cta-action-btn" 
                style={{ backgroundColor: "#64748b", maxWidth: "160px", margin: "16px auto 0 auto" }}
              >
                Dismiss
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}