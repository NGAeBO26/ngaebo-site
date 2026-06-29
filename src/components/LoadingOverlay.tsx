/* src/components/LoadingOverlay.tsx */
import React from "react";
import "../styles/LoadingOverlay.css";

interface LoadingOverlayProps {
  isLoading: boolean;
  progress: number;
  message?: string;
  subtitle?: string;     
  hideProgress?: boolean; 
  isFullscreen?: boolean; 
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isLoading, 
  progress, 
  message = "Loading Discovery Workspace...",
  subtitle,
  hideProgress = false,
  isFullscreen = false
}) => {
  if (!isLoading) return null;

  return (
    <div className={`ngaebo-global-loading-takeover-screen ${isFullscreen ? "is-fullscreen-takeover" : ""}`}>
      <div className="ngaebo-spinner-assembly-box">
        
        {/* ─── 🎯 NEW: PURE CSS TIMELINE TRACK ACROSS CARD TOP EDGE ─── */}
        {isFullscreen && (
          <div className="ngaebo-loading-bar-track">
            <div className="ngaebo-loading-bar-progress" />
          </div>
        )}
        
        {/* Layered Interactive Spinner Engine */}
        <div className="ngaebo-spinner-composite-container">
          <img 
            src="/data/assets/rideguide-spinner-logo.svg" 
            alt="Ngaebo Logo Static Core" 
            className="ngaebo-spinner-logo-core"
          />
          <img 
            src="/data/assets/ngaebo-spinner-wheel.svg" 
            alt="Ngaebo Spinner Wheel Active" 
            className="ngaebo-spinner-wheel-rotating-element"
          />
        </div>

        {/* Dynamic Telemetry Text Deck */}
        <div className="ngaebo-loading-telemetry-text-deck">
          <span className="ngaebo-loading-status-message">{message}</span>
          
          {subtitle && (
            <span className="ngaebo-loading-subtitle-message">{subtitle}</span>
          )}
          
          {!hideProgress && (
            <span className="ngaebo-loading-percentage-counter">{Math.min(100, Math.max(0, progress))}%</span>
          )}
        </div>

      </div>
    </div>
  );
};