// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const dist = path.join(__dirname, "dist");

app.use(express.json());

// ------------------------------------------------------------
// 1. API ROUTES (Must remain above static/fallback)
// ------------------------------------------------------------

app.post("/api/subscribe", async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email" });
  }
  res.json({ success: true });
});

// JIT WEATHER SYNC ENDPOINT
app.get('/api/sync-weather/:routeID', (req, res) => {
  const { routeID } = req.params;
  const scriptPath = path.join(__dirname, 'scripts', 'weather_engine.py');
  const pythonCmd = process.platform === "win32" ? "python" : "python3";

  console.log(`[JIT] Spawning Engine for: ${routeID}`);
  
  const pyProcess = spawn(pythonCmd, [scriptPath, routeID]);
  let hasSentResponse = false;

  // Listen to the Python Console output
  pyProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[PYTHON]: ${output}`);

    // If we see SUCCESS, tell React to go ahead immediately!
    if (output.includes('SUCCESS') && !hasSentResponse) {
      hasSentResponse = true;
      res.json({ status: 'updated' });
    }
  });

  pyProcess.stderr.on('data', (data) => {
    console.error(`[PYTHON ERROR]: ${data}`);
  });

  pyProcess.on('close', (code) => {
    if (!hasSentResponse) {
      res.status(500).json({ error: "Process closed without success signal" });
    }
    console.log(`[JIT] Engine process finished with code ${code}`);
  });
});

// ------------------------------------------------------------
// 2. API SAFETY CATCH
// ------------------------------------------------------------
// Prefix match - anything starting with /api that didn't match above
app.use('/api', (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

// ------------------------------------------------------------
// 3. STATIC FRONTEND & REACT FALLBACK
// ------------------------------------------------------------
app.use(express.static(dist));

// FUNCTION-BASED FALLBACK
// This does NOT use path-to-regexp, so it CANNOT throw a PathError.
app.use((req, res) => {
  // If the request isn't for a file in /dist, send index.html
  res.sendFile(path.join(dist, "index.html"));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Dist: ${dist}`);
});