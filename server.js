/* server.js */
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import crypto from "crypto"; 

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
// 🎯 INTERCEPT & ENFORCE LIVE DISK CHANNELS BEFORE SERVING THE COPIED DIST
// ==========================================================================
const liveWeatherPath = path.join(__dirname, 'dist', 'data', 'weather');
const liveConditionsPath = path.join(__dirname, 'dist', 'data', 'conditions');
const liveJoyPath = path.join(__dirname, 'dist', 'data', 'joyscores');
const liveVisPath = path.join(__dirname, 'dist', 'data', 'visualization');
const liveTaxPath = path.join(__dirname, 'dist', 'data', 'effortgauges');

const cacheControlMiddleware = (res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
};

app.use('/data/weather', express.static(liveWeatherPath, { etag: false, lastModified: false, setHeaders: cacheControlMiddleware }));
app.use('/data/conditions', express.static(liveConditionsPath, { etag: false, lastModified: false, setHeaders: cacheControlMiddleware }));
app.use('/data/joyscores', express.static(liveJoyPath, { etag: false, lastModified: false, setHeaders: cacheControlMiddleware }));
app.use('/data/visualization', express.static(liveVisPath, { etag: false, lastModified: false, setHeaders: cacheControlMiddleware }));
app.use('/data/effortgauges', express.static(liveTaxPath, { etag: false, lastModified: false, setHeaders: cacheControlMiddleware }));

// ==========================================================================
// 1. PRODUCTION INTERACTION API ENDPOINTS
// ==========================================================================

app.get('/api/sync-weather/:routeID', (req, res) => {
  const { routeID } = req.params;
  const scriptPath = path.join(__dirname, 'scripts', 'weather_engine.py');
  const pythonCmd = process.platform === "win32" ? "python" : "python3";
  
  const pyProcess = spawn(pythonCmd, [scriptPath, routeID]);
  let hasSentResponse = false;

  pyProcess.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('SUCCESS') && !hasSentResponse) {
      hasSentResponse = true;
      res.json({ status: 'updated' });
    }
  });

  pyProcess.on('close', (code) => {
    if (!hasSentResponse) {
      res.status(500).json({ error: "Process closed without success signal" });
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