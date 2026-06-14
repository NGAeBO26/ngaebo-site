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

// FIXED ASSET CROSS-PLATFORM LOCATION MATCHING:
// Ensures the absolute build directory path handles standard cloud layout distributions perfectly.
const dist = path.join(process.cwd(), "dist");

// 🎯 CLOUD RECONCILIATION: Default to 5000 locally to match your Vite config proxies & RedirectGateway!
const PORT = process.env.PORT || 5000;

// 🎯 CORS POLICY HANDSHAKE CLEARANCE
// Explicitly opens testing gates during local dev. On DO, Same-Origin kicks in naturally.
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"]
  }));
}

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

/**
 * Clean title strings by stripping away marketing suffixes
 */
const cleanTitle = (rawName) => {
  if (!rawName) return '';
  return rawName.split(' - ')[0].split(' | ')[0];
};

/**
 * Transforms flat JSON database exports into the structured data objects expected by Shop.tsx
 */
const transformFlatFileProduct = (p) => {
  const specs = p.specifications || {};
  
  let galleryImages = [];

  // 🟢 STRICT PRESERVATION LAYER:
  // Maps your array structures cleanly while respecting explicit pre-assigned role designations.
  if (Array.isArray(p.images_gallery) && p.images_gallery.length > 0) {
    galleryImages = p.images_gallery.map(img => ({
      url: typeof img === 'object' ? img.url : img,
      role_tag: typeof img === 'object' ? (img.role_tag || 'secondary') : 'secondary'
    }));
  } else if (Array.isArray(p.gallery_images) && p.gallery_images.length > 0) {
    galleryImages = p.gallery_images.map((imgUrl, idx) => ({
      url: typeof imgUrl === 'object' ? imgUrl.url : imgUrl,
      role_tag: typeof imgUrl === 'object' && imgUrl.role_tag ? imgUrl.role_tag : (idx === 0 ? 'primary' : 'secondary')
    }));
  } else if (p.image) {
    galleryImages = [{ url: p.image, role_tag: 'primary' }];
  }

  const productFeatures = Array.isArray(p.key_features)
    ? p.key_features.map(f => ({ feature_text: f.feature_text, feature_type: f.feature_type }))
    : [];

  return {
    id: p.id,
    brand: p.brand,
    product_name: cleanTitle(p.product_name),
    category: p.category || 'ebike',
    sub_category: p.sub_category || '',
    original_url: p.original_url || '',
    custom_affiliate_link: p.custom_affiliate_link || '',
    price: Number(p.price) || 0,
    original_price: Number(p.original_price) || 0,
    base_commission: p.base_commission || '',
    cta_label: p.cta_label || 'Check Price',
    description: p.description || '',
    notes_snippets: p.notes_snippets || '',
    rating: Number(p.rating) || 5.0,
    ul_certification: p.ul_certification || specs.ul_certification || '',
    motor_details: specs.motor_details || null,
    battery_details: specs.battery_details || null,
    drivetrain_details: specs.drivetrain_details || null,
    braking_details: specs.braking_details || null,
    weight_details: specs.weight_details || null,
    ebike_classification: specs.ebike_classification || null,
    gallery_images: galleryImages,
    product_features: productFeatures,
    tags: Array.isArray(p.tags) ? p.tags : []
  };
};

// 🛍️ STATIC FILE PRODUCT LISTING ENDPOINT (ZERO-COST DATA DISPATCH GATEWAY)
app.get('/api/products', (req, res) => {
  try {
    // 🟢 LOCK THE PATHWAY: Target your backend directory exactly where products.json is written
    const activePath = path.join(process.cwd(), 'ngaebo-backend', 'data', 'products.json');

    // DigitalOcean Production Check: Fall back to local project root data only if deployed to the cloud container
    const productionPath = path.join(process.cwd(), 'public', 'data', 'shop', 'products.json');
    const targetFile = fs.existsSync(activePath) ? activePath : productionPath;

    if (!fs.existsSync(targetFile)) {
      console.warn(`⚠️ Shop data requested but products.json file does not exist at: ${targetFile}`);
      return res.status(200).json({ products: [] });
    }

    const rawData = fs.readFileSync(targetFile, 'utf-8');
    const parsedJSON = JSON.parse(rawData);
    const baseArray = Array.isArray(parsedJSON) ? parsedJSON : (parsedJSON.products || []);
    
    // Process data objects while strictly respecting your data file image roles
    const transformedProducts = baseArray.map(p => {
      const specs = p.specifications || {};
      
      let galleryImages = [];

      // Strict preservation: If images_gallery has pre-existing roles, pass them through exactly as written
      if (Array.isArray(p.images_gallery) && p.images_gallery.length > 0) {
        galleryImages = p.images_gallery.map(img => ({
          url: img.url,
          role_tag: img.role_tag === 'primary' ? 'primary' : 'secondary'
        }));
      } else if (p.image) {
        galleryImages = [{ url: p.image, role_tag: 'primary' }];
      }

      return {
        id: p.id,
        brand: p.brand,
        product_name: p.product_name?.split(' - ')[0]?.split(' | ')[0] || '',
        category: p.category || 'ebike',
        sub_category: p.sub_category || '',
        original_url: p.original_url || '',
        custom_affiliate_link: p.custom_affiliate_link || '',
        price: Number(p.price) || 0,
        original_price: Number(p.original_price) || 0,
        base_commission: p.base_commission || '',
        cta_label: p.cta_label || 'Check Price',
        description: p.description || '',
        notes_snippets: p.notes_snippets || '',
        rating: Number(p.rating) || 5.0,
        ul_certification: p.ul_certification || specs.ul_certification || '',
        motor_details: specs.motor_details || null,
        battery_details: specs.battery_details || null,
        drivetrain_details: specs.drivetrain_details || null,
        braking_details: specs.braking_details || null,
        weight_details: specs.weight_details || null,
        ebike_classification: specs.ebike_classification || null,
        gallery_images: galleryImages,
        product_features: Array.isArray(p.key_features) ? p.key_features : [],
        tags: Array.isArray(p.tags) ? p.tags : []
      };
    });

    return res.status(200).json({ products: transformedProducts });
  } catch (error) {
    console.error("❌ Static file query exception encountered parsing products data:", error);
    return res.status(500).json({ error: "Internal server failed to compile product parameters." });
  }
});

app.get('/api/sync-weather/:routeID', (req, res) => {
  const { routeID } = req.params;
  const scriptPath = path.join(__dirname, 'scripts', 'weather_engine.py');
  const pythonCmd = process.platform === "win32" ? "python" : "python3";
  
  // 🔍 Terminal Signal: Track the incoming request immediately
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

  // Pipe standard output directly into your terminal stream
  pyProcess.stdout.on('data', (data) => {
    console.log(`[Python stdout]: ${data.toString().trim()}`);
    if (data.toString().includes('SUCCESS') && !hasSentResponse) {
      hasSentResponse = true;
      res.json({ status: 'updated' });
    }
  });

  // Pipe hidden standard errors directly into your terminal stream
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
    return res.status(500).json({ error: "Internal server error experienced processing your subscription request." });
  }
});

// ==========================================================================
// 2. STATIC ENVIRONMENT FALLBACKS (MUST STAY AT THE BOTTOM)
// ==========================================================================

app.use('/api', (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

// EXPLICIT STATIC ASSET ROOT SERVICE DEFINITION
app.use(express.static(dist));

// Pure regex catch-all matches every front-facing path route unless it begins explicitly with /api
app.get(/^(?!\/api).*$/, (req, res) => {
  if (fs.existsSync(path.join(dist, "index.html"))) {
    return res.sendFile(path.join(dist, "index.html"));
  }
  // Safe local development string output until 'npm run build' generates the first production distribution
  res.status(200).send("Express Backend Working. Dist directory built on compile.");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 [UNIFIED APPLICATION ENGINE ACTIVE] — Sync Ports Open On: ${PORT}\n`);
});