// src/components/modal/TestMailerLiteAPI.tsx
import { useState } from "react";

type Props = {
  onSuccess?: () => void;
};

export default function TestMailerLiteAPI({ onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [disabled, setDisabled] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus("Please enter a valid email address.");
      return;
    }

    setStatus("Submitting...");
    setDisabled(true);

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("Subscribed!");
        setEmail("");
        // allow parent to react (close modal, analytics, etc.)
        onSuccess?.();
      } else {
        const msg = data?.error?.message || "Subscription failed";
        setStatus("Error: " + msg);
      }
    } catch {
      setStatus("Network error. Try again.");
    } finally {
      setDisabled(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={disabled}
        />
        <button type="submit" disabled={disabled}>
          {disabled ? "Submitting…" : "Subscribe"}
        </button>
      </form>

      <p>{status}</p>
    </div>
  );
}