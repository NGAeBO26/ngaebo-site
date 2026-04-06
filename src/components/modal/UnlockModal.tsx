// components/modal/UnlockModal.tsx
import { useState } from "react";
import "../../styles/modal.css";
import ModalBackdrop from "./ModalBackdrop";
import ModalCard from "./ModalCard";
import { useUnlockModal } from "./useUnlockModal";
export default function UnlockModal() {
 const { isOpen, close, unlock } = useUnlockModal();
 const [email, setEmail] = useState("");
 const [error, setError] = useState("");
 const [loading, setLoading] = useState(false);
 async function handleSubmit(e: React.FormEvent) {
   e.preventDefault();
   setError("");
   setLoading(true);
   try {
     const res = await fetch("/api/subscribe", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ email }),
     });
     const data = await res.json();
     if (!res.ok) {
       setError("Something went wrong. Please try again.");
       return;
     }
     unlock();
   } catch {
     setError("Network error. Please try again.");
   } finally {
     setLoading(false);
   }
 }
 if (!isOpen) return null;
 return (
   <>
     <ModalBackdrop onClose={close} />
     <ModalCard width="md">
       <button onClick={close} className="modal-close">✕</button>
       <h2 className="text-2xl font-semibold mb-4 text-center">
         Unlock the North Georgia Gravel Guide
       </h2>
       <p className="text-gray-600 text-center mb-6">
         Enter your email to access the full interactive map.
       </p>
       <form onSubmit={handleSubmit} className="unlock-form">
         <input
           type="email"
           placeholder="you@example.com"
           value={email}
           onChange={(e) => setEmail(e.target.value)}
           required
           className="unlock-input"
         />
         {error && <p className="unlock-error">{error}</p>}
         <button
           type="submit"
           disabled={loading}
           className="unlock-submit"
         >
           {loading ? "Submitting..." : "Unlock the Gravel Guide"}
         </button>
       </form>
     </ModalCard>
   </>
 );
}
