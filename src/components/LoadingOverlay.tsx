/* src/components/LoadingOverlay.tsx */
import React from "react";
import "../styles/LoadingOverlay.css";

interface LoadingOverlayProps {
  isLoading: boolean;
  progress: number;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isLoading, 
  progress, 
  message = "Loading Discovery Workspace..." 
}) => {
  if (!isLoading) return null;

  return (
    <div className="ngaebo-global-loading-takeover-screen">
      <div className="ngaebo-spinner-assembly-box">
        
        {/* Layered Interactive Spinner Engine */}
        <div className="ngaebo-spinner-composite-container">
          <img 
            src="/data/assets/ngaebo-spinner-logo.svg" 
            alt="Ngaebo Logo Static Core" 
            className="ngaebo-spinner-logo-core"
          />
          <img 
            src="/data/assets/ngaebo-spinner-wheel.svg" 
            alt="Ngaebo Spinner Wheel Active" 
            className="ngaebo-spinner-wheel-rotating-element"
          />
        </div>

        {/* Dynamic Percentage Outputs */}
        <div className="ngaebo-loading-telemetry-text-deck">
          <span className="ngaebo-loading-status-message">{message}</span>
          <span className="ngaebo-loading-percentage-counter">{Math.min(100, Math.max(0, progress))}%</span>
        </div>

      </div>
    </div>
  );
};