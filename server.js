/* server.js */
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import crypto from "crypto"; 
import fs from "fs";

import { getRideGuideHTML, getRideGuideText } from "./src/lib/emailTemplates.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const dist = path.join(__dirname, "dist");
const PORT = process.env.PORT || 8080;

// 🎯 CORS POLICY HANDSHAKE CLEARANCE
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"]
}));

app.use((req, res, next) => {
  if (req.originalUrl === "/api/webhooks/shopify/orders-paid") {
    express.raw({ type: "application/json" })(req, res, next);
  } else {
    express.json()(req, res, next);
  }
});

// ==========================================================================
// 🎯 FORCE EXPRESS TO SERVE LIVE DISK CHANNELS FROM THE ACTIVE PUBLIC FOLDER
// ==========================================================================
// We dynamically track the live public directory where the Python script drops files,
// alongside the backup dist directory created during the buildpack process.
const publicDataPath = path.join(__dirname, 'public', 'data');
const distDataPath = path.join(__dirname, 'dist', 'data');

const cacheControlMiddleware = (res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
};

// Unified dynamic filesystem reader middleware
const serveLiveShopAssets = (subFolder) => {
  return (req, res, next) => {
    const targetFile = req.path;
    const liveDiskFile = path.join(publicDataPath, subFolder, targetFile);
    const fallbackCompiledFile = path.join(distDataPath, subFolder, targetFile);

    // If the Python engine has generated a fresh file in public/data, serve it instantly
    if (fs.existsSync(liveDiskFile)) {
      cacheControlMiddleware(res);
      return res.sendFile(liveDiskFile);
    } 
    
    // Otherwise, fallback safely to the buildpack asset directory path
    if (fs.existsSync(fallbackCompiledFile)) {
      cacheControlMiddleware(res);
      return res.sendFile(fallbackCompiledFile);
    }

    next();
  };
};

// Bind our dynamic local filesystem routing layers above default static paths
app.use('/data/weather', serveLiveShopAssets('weather'));
app.use('/data/conditions', serveLiveShopAssets('conditions'));
app.use('/data/joyscores', serveLiveShopAssets('joyscores'));
app.use('/data/visualization', serveLiveShopAssets('visualization'));
app.use('/data/effortgauges', serveLiveShopAssets('effortgauges'));
app.use('/data/shop_images', serveLiveShopAssets('shop_images'));

// ==========================================================================
// 1. PRODUCTION INTERACTION API ENDPOINTS
// ==========================================================================

// 🛍️ STATIC FILE PRODUCT LISTING ENDPOINT (ZERO-COST DATA DISPATCH GATEWAY)
app.get('/api/shop/products', (req, res) => {
  try {
    const productsFilePath = path.join(__dirname, 'public', 'data', 'shop', 'products.json');
    const activePath = fs.existsSync(productsFilePath) 
      ? productsFilePath 
      : path.join(__dirname, 'dist', 'data', 'shop', 'products.json');

    if (!fs.existsSync(activePath)) {
      console.warn("⚠️ Shop data requested but products.json file does not exist on disk.");
      return res.status(200).json({ success: true, products: [] });
    }

    const rawData = fs.readFileSync(activePath, 'utf-8');
    const productsData = JSON.parse(rawData);
    return res.status(200).json({ success: true, products: productsData });
  } catch (error) {
    console.error("❌ Static file query exception encountered parsing products data:", error);
    return res.status(500).json({ success: false, error: "Internal server failed to compile product asset parameters." });
  }
});

app.get('/api/sync-weather/:routeID', (req, res) => {
  const { routeID } = req.params;
  const scriptPath = path.join(__dirname, 'scripts', 'weather_engine.py');
  const pythonCmd = process.platform === "win32" ? "python" : "python3";
  
  // 🔍 1. Terminal Signal: Track the incoming request immediately
  console.log(`\n========== [SERVER SYNC TRIGGERED] ==========`);
  console.log(`📍 Route Target ID: ${routeID}`);
  console.log(`📂 Attempting to spawn script at: ${scriptPath}`);
  console.log(`⚙️ Executing system command: ${pythonCmd}`);

  if (!fs.existsSync(scriptPath)) {
    console.error(`❌ CRITICAL PATH ERROR: File does not exist at ${scriptPath}`);
    return res.status(500).json({ error: `Script not found at target pathing structure.` });
  }

  const pyProcess = spawn(pythonCmd, [scriptPath, routeID]);
  let hasSentResponse = false;

  // 🟢 2. Pipe standard output directly into your terminal stream
  pyProcess.stdout.on('data', (data) => {
    console.log(`[Python stdout]: ${data.toString().trim()}`);
    if (data.toString().includes('SUCCESS') && !hasSentResponse) {
      hasSentResponse = true;
      res.json({ status: 'updated' });
    }
  });

  // 🔴 3. Pipe hidden standard errors directly into your terminal stream
  pyProcess.stderr.on('data', (data) => {
    console.error(`[Python stderr ERROR]: ${data.toString().trim()}`);
  });

  pyProcess.on('close', (code) => {
    console.log(`🏁 Python process closed with exit code: ${code}`);
    console.log(`=============================================\n`);
    if (!hasSentResponse) {
      res.status(500).json({ error: `Process closed with code ${code} without success signal` });
    }
  });
});

app.get("/download-guide", (req, res) => {
  const { routeID } = req.query;
  if (!routeID) return res.status(400).send("Missing target identification parameter.");
  res.sendFile(path.join(dist, "index.html"));
});

app.post("/api/webhooks/shopify/orders-paid", async (req, res) => {
  const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
  const MAILERSEND_API_KEY = process.env.MAILERSEND_API_KEY; 
  const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET;

  try {
    if (!req.body || !Buffer.isBuffer(req.body)) throw new Error("Request body stream invalid.");

    if (SHOPIFY_WEBHOOK_SECRET) {
      const shopifyHmacHeader = req.headers["x-shopify-hmac-sha256"];
      const generatedHash = crypto.createHmac("sha256", SHOPIFY_WEBHOOK_SECRET).update(req.body).digest("base64");
      if (shopifyHmacHeader !== generatedHash) return res.status(401).send("Unauthorized");
    }

    const payload = JSON.parse(req.body.toString());
    const customerEmail = payload.email || payload.contact_email;
    const orderNumber = payload.name || `#${payload.id}`;
    const buyerAcceptsMarketing = payload.buyer_accepts_marketing || false; 
    const lineItems = payload.line_items || [];
    
    const purchasedItem = lineItems[0] || {};
    const customProperties = purchasedItem.properties || [];
    const routeIDAttr = customProperties.find(attr => attr.name === "SelectedRouteID");
    const routeTitleAttr = customProperties.find(attr => attr.name === "RouteTitle");

    if (!routeIDAttr) return res.status(200).send("Processed: Missing Telemetry Properties");

    const targetRouteID = routeIDAttr.value; 
    const targetRouteTitle = routeTitleAttr ? routeTitleAttr.value : "Your Custom Route";
    const targetDownloadUrl = `https://ngaebo-staging-bym3w.ondigitalocean.app/download-guide?routeID=${targetRouteID}`;

    if (MAILERSEND_API_KEY) {
      const mailersendPayload = {
        from: { email: "orders@northgeorgiaebikes.com", name: "North Georgia eBike Outfitters" },
        to: [{ email: customerEmail }],
        subject: `Your ${targetRouteTitle} RideGuide is ready!`,
        text: getRideGuideText(targetRouteTitle, targetDownloadUrl), 
        html: getRideGuideHTML(targetRouteTitle, targetDownloadUrl)  
      };
      await fetch("https://api.mailersend.com/v1/email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${MAILERSEND_API_KEY}` },
        body: JSON.stringify(mailersendPayload)
      });
    }

    if (MAILERLITE_API_KEY && buyerAcceptsMarketing === true) {
      await fetch("https://connect.mailerlite.com/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": `Bearer ${MAILERLITE_API_KEY}` },
        body: JSON.stringify({
          email: customerEmail,
          status: "active",
          groups: [183580786152178921], 
          fields: {
            name: payload.billing_address?.first_name || "Gravel Cyclist",
            last_order_id: orderNumber,
            route_download_link: targetDownloadUrl, 
            purchased_route_title: targetRouteTitle
          }
        })
      });
    }

    return res.status(200).send("Fulfillment Lifecycle Complete");
  } catch (error) {
    return res.status(400).send("Webhook exceptional failure.");
  }
});

app.post("/api/subscribe", async (req, res) => {
  try {
    const { email, intent_tag } = req.body; 

    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Invalid email structure format supplied." });
    }

    const apiKey = process.env.MAILERLITE_API_KEY;
    if (!apiKey) {
      console.error("❌ System Error: MAILERLITE_API_KEY parameter missing inside your server .env file.");
      return res.status(500).json({ error: "Mail credentials missing on server." });
    }

    const groupId = "189918909111994294"; 

    const apiPayload = {
      email: email.trim().toLowerCase(),
      status: "active",
      groups: [groupId], 
      fields: {
        intent_tag: intent_tag ? String(intent_tag).trim() : "general_newsletter" 
      }
    };

    const targetEndpoint = "https://connect.mailerlite.com/api/subscribers";

    const response = await fetch(targetEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(apiPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ MailerLite Upstream Rejection Data Output:", data);
      return res.status(response.status).json({ error: "MailerLite upstream server rejected request.", details: data });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Subscription Route Internal Exception:", error);
    return res.status(500).json({ error: "Internal server error experienced processing your subscription trace request." });
  }
});

// ==========================================================================
// 2. STATIC ENVIRONMENT FALLBACKS (MUST STAY AT THE BOTTOM)
// ==========================================================================

app.use('/api', (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

app.use(express.static(dist));
app.use((req, res) => {
  res.sendFile(path.join(dist, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 Engine Live — Sync Ports Open On: ${PORT}\n`);
});