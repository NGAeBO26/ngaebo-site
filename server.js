// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { exec } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const dist = path.join(process.cwd(), "dist");

app.use(express.json());

// ------------------------------------------------------------
// MailerLite API ROUTES
// ------------------------------------------------------------

app.post("/api/subscribe", async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email" });
  }
  res.json({ success: true });
});

// ------------------------------------------------------------
// 2. JIT WEATHER SYNC & SVG GENERATION ENDPOINT
// ------------------------------------------------------------
app.get('/api/sync-weather/:routeID', (req, res) => {
  const { routeID } = req.params;
  const scriptPath = path.join(process.cwd(), 'scripts', 'weather_engine.py');
  const pythonCmd = process.platform === "win32" ? "python" : "python3";

  console.log(`[JIT] Executing Production Engine for ${routeID}...`);
  //console.log(`[AUDIT] Route Click: ${routeID}`);
  //console.log(`[AUDIT] Python Command: python "scripts/weather_engine.py" ${routeID}`);
  console.log(`[Phase 1] Environment: ${process.platform}`);
  console.log(`[Phase 1] Using Command: ${pythonCmd}`);

  exec(`${pythonCmd} "${scriptPath}" ${routeID}`, (error, stdout, stderr) => {
    if (stdout) console.log(`[ENGINE STDOUT]: ${stdout}`);
    if (stderr) console.log(`[ENGINE STDERR]: ${stderr}`);
    
    if (error) {
      console.error(`[JIT Error]: ${error.message}`);
      return res.status(500).json({ error: 'Sync failed' });
    }
    
    if (stdout.includes('SUCCESS')) {
      console.log(`[JIT Success]: ${stdout.trim()}`);
      res.json({ status: 'updated' });
    } else {
      res.status(500).json({ error: 'Engine failed to report success' });
    }
  });
});

// ------------------------------------------------------------
// STATIC FRONTEND & FALLBACK
// ------------------------------------------------------------
app.use(express.static(dist));

app.use((req, res) => {
  res.sendFile(path.join(dist, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[Server] RideGuide V3 running on http://localhost:${PORT}`);
});