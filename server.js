// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const dist = path.join(process.cwd(), "dist");

// Test route
app.get("/health", (req, res) => res.json({ ok: true }));

// Static files
app.use(express.static(dist));

// SPA fallback — NO WILDCARD, NO PATTERN
app.use((req, res) => {
  res.sendFile(path.join(dist, "index.html"));
});

app.listen(3000, () => console.log("Listening 3000"));