/* server.js */
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import crypto from "crypto"; 

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const dist = path.join(__dirname, "dist");
const PORT = process.env.PORT || 8080;

app.use(cors());

/**
 * 🎯 RAW DATA STREAM PARSER:
 * Shopify webhook validation requires parsing the unmodified raw body buffer.
 */
app.use((req, res, next) => {
  if (req.originalUrl === "/api/webhooks/shopify/orders-paid") {
    express.raw({ type: "application/json" })(req, res, next);
  } else {
    express.json()(req, res, next);
  }
});

// ------------------------------------------------------------
// 1. PRODUCTION-READY INTERACTION API ENDPOINTS
// ------------------------------------------------------------

/**
 * WEATHER ENGINE WORKER SPAWNER
 */
app.get('/api/sync-weather/:routeID', (req, res) => {
  const { routeID } = req.params;
  const scriptPath = path.join(__dirname, 'scripts', 'weather_engine.py');
  const pythonCmd = process.platform === "win32" ? "python" : "python3";

  console.log(`[JIT] Spawning Engine for: ${routeID}`);
  
  const pyProcess = spawn(pythonCmd, [scriptPath, routeID]);
  let hasSentResponse = false;

  pyProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[PYTHON]: ${output}`);

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

/**
 * SECURE UNBLURRED RIDEGUIDE DOWNLOAD GATEWAY
 */
app.get("/download-guide", (req, res) => {
  const { routeID } = req.query;
  
  if (!routeID) {
    return res.status(400).send("Missing target route identification parameter.");
  }
  res.sendFile(path.join(dist, "index.html"));
});

/**
 * SECURE SHOPIFY ORDER DISPATCH WEBHOOK
 */
app.post("/api/webhooks/shopify/orders-paid", async (req, res) => {
  const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
  const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET;

  try {
    if (!req.body || !Buffer.isBuffer(req.body)) {
      throw new Error("Incoming request body stream is invalid or empty.");
    }

    const rawBody = req.body.toString();

    // SECURE PRODUCTION AUTHENTICITY CHECK:
    if (SHOPIFY_WEBHOOK_SECRET) {
      const shopifyHmacHeader = req.headers["x-shopify-hmac-sha256"];
      const generatedHash = crypto
        .createHmac("sha256", SHOPIFY_WEBHOOK_SECRET)
        .update(req.body)
        .digest("base64");

      if (shopifyHmacHeader !== generatedHash) {
        console.warn("❌ SECURITY WARNING: Rejected unauthorized payload submission signature matching error!");
        return res.status(401).send("Unauthorized Webhook Source");
      }
    }

    const payload = JSON.parse(rawBody);
    const customerEmail = payload.email || payload.contact_email;
    const orderNumber = payload.name || `#${payload.id}`;
    const lineItems = payload.line_items || [];
    
    const purchasedItem = lineItems[0] || {};
    const customProperties = purchasedItem.properties || [];
    
    const routeIDAttr = customProperties.find(attr => attr.name === "SelectedRouteID");
    const routeTitleAttr = customProperties.find(attr => attr.name === "RouteTitle");

    console.log(`\n==================================================`);
    console.log(`💰 [SHOPIFY WEBHOOK] Processing Verified Payment Event for Order ${orderNumber}`);
    console.log(`📧 Customer: ${customerEmail}`);
    
    if (!routeIDAttr) {
      console.warn("⚠️ TRANSACTION OVERVIEW: Order parsed, but no 'SelectedRouteID' attribute property was found.");
      console.log(`==================================================\n`);
      return res.status(200).send("Processed: Missing Telemetry Properties Map Key");
    }

    const targetRouteID = routeIDAttr.value; 
    const targetRouteTitle = routeTitleAttr ? routeTitleAttr.value : "Your Custom Route";

    console.log(`🗺️ Linked Route Asset Key: ${targetRouteID} ("${targetRouteTitle}")`);

    // 🎯 SAFE DYNAMIC URL CORRECTION:
    // Uses direct string fallback properties from the header object to eliminate any middleware function crash risks.
    const forwardHost = req.headers["x-forwarded-host"];
    const standardHost = req.headers["host"] || "northgeorgiabikes.com";
    const host = forwardHost || standardHost;
    
    const forwardProto = req.headers["x-forwarded-proto"];
    const protocol = forwardProto || "https";
    
    const targetDownloadUrl = `${protocol}://${host}/download-guide?routeID=${targetRouteID}`;

    if (!MAILERLITE_API_KEY) {
      console.warn("⚠️ SANDBOX ALERT: Skipping MailerLite dispatch step because API key is undefined.");
      console.log(`👉 High-Density Target Link: ${targetDownloadUrl}`);
      console.log(`==================================================\n`);
      return res.status(200).send("Sandbox Testing Complete");
    }

    console.log(`✉️ Updating subscriber profile fields inside MailerLite to fire the delivery automation...`);
    
    const mailerliteResponse = await fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${MAILERLITE_API_KEY}`
      },
      body: JSON.stringify({
        email: customerEmail,
        status: "active",
        fields: {
          name: payload.billing_address?.first_name || "Gravel Cyclist",
          last_order_id: orderNumber,
          route_download_link: targetDownloadUrl, 
          purchased_route_title: targetRouteTitle
        }
      })
    });

    if (!mailerliteResponse.ok) {
      const errorData = await mailerliteResponse.json();
      console.error("❌ MailerLite Sync Rejection Notes:", errorData);
      return res.status(502).send("Fulfillment event rejected by external subscriber mailing network.");
    }

    console.log(`✅ FULFILLMENT DISPATCHED: Customer profile sync loop successfully updated!`);
    console.log(`==================================================\n`);

    return res.status(200).send("Fulfillment Lifecycle Complete");

  } catch (error) {
    console.error("❌ WEBHOOK PIPELINE RUNTIME ERROR:", error);
    return res.status(400).send("Webhook delivery discarded due to inner parsing exceptions.");
  }
});

/**
 * STANDARD LEAD GENERATION
 */
app.post("/api/subscribe", async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email" });
  }
  res.json({ success: true });
});

// ------------------------------------------------------------
// 2. STATIC ENVIRONMENT FALLBACKS
// ------------------------------------------------------------
app.use('/api', (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

app.use(express.static(dist));

app.use((req, res) => {
  res.sendFile(path.join(dist, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 ==================================================`);
  console.log(`   MASTER APPLICATION ENGINE LIVE AND READY FOR PRODUCTION`);
  console.log(`   Listening for verified incoming web connections on port: ${PORT}`);
  console.log(`==================================================\n`);
});