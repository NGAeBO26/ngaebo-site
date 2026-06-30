/* src/components/forms/TacticalLeadForm.tsx */
import React, { useState } from "react";
import "./TacticalLeadForm.css"; 

interface TacticalLeadFormProps {
  buttonLabel?: string;
  placeholderText?: string;
  sourceGroupTag?: string;
  layout?: "row" | "stacked"; 
  onSuccess?: () => void;     
}

export default function TacticalLeadForm({
  buttonLabel = "Download Setup Checklist",
  placeholderText = "Enter your email address",
  sourceGroupTag = "home_footer_nurture",
  layout = "row", 
  onSuccess       
}: TacticalLeadFormProps) {
  const [emailInput, setEmailInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setIsSubmitting(true);
    setFeedbackMsg("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: emailInput.trim(),
          intent_tag: sourceGroupTag
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSuccess(true);
        setFeedbackMsg("Sample Pack Link Sent! Check your inbox shortly.");
        setEmailInput("");

        if (onSuccess) {
          onSuccess();
        }
      } else {
        setFeedbackMsg(data.error || "Subscription gateway rejection. Please verify your address.");
      }
    } catch (err) {
      console.error("Lead submission connection exception:", err);
      setFeedbackMsg("Backcountry connection interrupted. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`tactical-lead-wrapper variant-${layout}`}>
      <form onSubmit={handleLeadSubmit} className="capture-form-flex-row">
        <input
          type="email"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          placeholder={placeholderText}
          className={`capture-input-styled ${isSuccess ? "input-success-border" : ""}`}
          disabled={isSubmitting || isSuccess}
          required
          /* ─── 🎯 ADDED: ACCESSIBLE FORM IDENTIFIER ─── */
          aria-label="Email address for newsletter and backcountry safety updates"
        />
        
        <button
          type="submit"
          className="btn btn-primary capture-button-whitespace"
          disabled={isSubmitting || isSuccess}
        >
          {isSubmitting ? "Syncing..." : buttonLabel}
        </button>
        
      </form>
      <span className="lead-disclaimer">
        By entering your email address, you agree to receiving email marketing
      </span>

      {/* ─── 🎯 ADDED: ACCESSIBLE LIVE REGION ANNOUNCEMENTS ─── */}
      {feedbackMsg && (
        <div 
          role="status"
          aria-live="polite"
          className={`form-feedback-caption ${isSuccess ? "status-success" : "status-error"}`}
        >
          {isSuccess ? "✓ " : "⚠️ "}{feedbackMsg}
        </div>
      )}
    </div>
  );
}