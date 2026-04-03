// components/modal/UnlockModal.tsx
import "../../styles/modal.css";

import React, { useEffect, useRef, useState } from "react";
import ModalBackdrop from "./ModalBackdrop";
import ModalCard from "./ModalCard";
import { useUnlockModal } from "./useUnlockModal";

export default function UnlockModal() {
  const { isOpen, close, unlock } = useUnlockModal();
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  console.log("UnlockModal render → isOpen =", isOpen);

  // Load MailerLite script dynamically
  useEffect(() => {
    if (!isOpen) return;

    const script = document.createElement("script");
    script.src = "https://assets.mailerlite.com/js/universal.js";
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      if (window.ml) window.ml("account", "YOUR_MAILERLITE_ACCOUNT_ID");
      setLoaded(true);
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [isOpen]);

  // Listen for MailerLite form submission
  useEffect(() => {
    if (!loaded) return;

    function handleSubmit() {
      unlock(); // unlocks map + closes modal
      console.log("User subscribed → unlock gravel guide");
    }

    document.addEventListener("ml_webform_success", handleSubmit);
    return () =>
      document.removeEventListener("ml_webform_success", handleSubmit);
  }, [loaded, unlock]);

  if (!isOpen) return null;

  return (
    <>
      <ModalBackdrop onClose={close} />
      <ModalCard width="md">
        <button onClick={close} className="modal-close">
          ✕
        </button>

        <h2 className="text-2xl font-semibold mb-4 text-center">
          Unlock the North Georgia Gravel Guide
        </h2>

        <p className="text-gray-600 text-center mb-6">
          Enter your email to access the full guide.
        </p>

        <div ref={containerRef}>
          <div
            className="ml-form-embed"
            data-account="YOUR_MAILERLITE_ACCOUNT_ID"
            data-form="YOUR_FORM_ID"
          />
        </div>
      </ModalCard>
    </>
  );
}