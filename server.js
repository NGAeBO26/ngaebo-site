// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const dist = path.join(process.cwd(), "dist");

app.use(express.json());

// ------------------------------------------------------------
// API ROUTES (must come BEFORE static + fallback)
// ------------------------------------------------------------
app.post("/api/subscribe", async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email" });
  }

  // TODO: MailerLite logic here
  res.json({ success: true });
});

// ------------------------------------------------------------
// STATIC FRONTEND
// ------------------------------------------------------------
app.use(express.static(dist));

// ------------------------------------------------------------
// SPA FALLBACK — Express 5 version (NO wildcard pattern)
// ------------------------------------------------------------
app.use((req, res) => {
  res.sendFile(path.join(dist, "index.html"));
});

// ------------------------------------------------------------
app.listen(3000, () => console.log("Listening 3000"));
