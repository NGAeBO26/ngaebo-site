// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { exec } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const dist = path.join(__dirname, "dist");

app.use(express.json());

// ------------------------------------------------------------
// 1. API ROUTES (Must be ABOVE static files)
// ------------------------------------------------------------

app.post("/api/subscribe", async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email" });
  }
  res.json({ success: true });
});

// JIT WEATHER SYNC & SVG GENERATION ENDPOINT
app.get('/api/sync-weather/:routeID', (req, res) => {
  const { routeID } = req.params;
  // Use __dirname to ensure we are relative to server.js in the /workspace
  const scriptPath = path.join(__dirname, 'scripts', 'weather_engine.py');
  const pythonCmd = process.platform === "win32" ? "python" : "python3";

  console.log(`[JIT] Request for: ${routeID}`);
  
  exec(`${pythonCmd} "${scriptPath}" ${routeID}`, (error, stdout, stderr) => {
    if (stdout) console.log(`[STDOUT]: ${stdout}`);
    if (stderr) console.error(`[STDERR]: ${stderr}`);
    
    if (error) {
      return res.status(500).json({ error: 'Sync failed', details: error.message });
    }
    
    // Check for success message from Python
    if (stdout.includes('SUCCESS')) {
      res.json({ status: 'updated' });
    } else {
      res.status(500).json({ error: 'Engine finished without SUCCESS signal' });
    }
  });
});

// ------------------------------------------------------------
// 2. API SAFETY CATCH
// ------------------------------------------------------------
// This prevents "SyntaxError: Unexpected token <" by returning JSON 
// instead of index.html if an API path is typed wrong.
// ------------------------------------------------------------
// 2. API SAFETY CATCH (Express 5 Explicit Syntax)
// ------------------------------------------------------------
app.all('/api/:path+', (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

// ------------------------------------------------------------
// 3. STATIC FRONTEND & REACT FALLBACK
// ------------------------------------------------------------
app.use(express.static(dist));

// This catches any remaining page requests and sends them to React
app.get('/:path*', (req, res) => {
  res.sendFile(path.join(dist, "index.html"));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Working Dir: ${process.cwd()}`);
  console.log(`Dist Dir: ${dist}`);
});