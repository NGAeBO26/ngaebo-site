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
import { rateLimit } from "express-rate-limit";

import { getRideGuideHTML, getRideGuideText } from "./src/lib/emailTemplates.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 🎯 PROXY TRUST ENABLE: Forces Express to read 'x-forwarded-for' headers 
// so the rate limiter tracks the true user's IP address, not the cloud proxy's IP.
app.set("trust proxy", 1);

// FIXED ASSET CROSS-PLATFORM LOCATION MATCHING:
// Ensures the absolute build directory path handles standard cloud layout distributions perfectly.
const dist = path.join(process.cwd(), "dist");

// 🎯 CLOUD RECONCILIATION: Default to 5000 locally to match your Vite config proxies & RedirectGateway!
const PORT = process.env.PORT || 5000;

// Memory cache to prevent hammering Shopify's auth server on every page click
let cachedAdminToken = null;
let tokenExpiresAt = 0;

/**
 * Automatically requests and handles secure token retrieval via Client Credentials
 * Formatted exactly to match Shopify's required form-urlencoded OAuth specification.
 */
async function getShopifyAdminToken() {
  // If a valid token is cached (with a 5-minute safety buffer), use it instantly
  if (cachedAdminToken && Date.now() < tokenExpiresAt - 300000) {
    return cachedAdminToken;
  }

  const shopDomain = process.env.VITE_SHOPIFY_STORE_DOMAIN || "ngaebo-shop-3.myshopify.com";
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing critical SHOPIFY_CLIENT_ID or SHOPIFY_CLIENT_SECRET environment variables.");
  }

  console.log("🔄 Requesting fresh Shopify Admin Token programmatically...");

  // 🎯 THE FIX: Convert parameters to URLSearchParams to send as application/x-www-form-urlencoded
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);

  const response = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/x-www-form-urlencoded" 
    },
    body: params.toString()
  });

  const data = await response.json();
  
  if (!response.ok || !data.access_token) {
    console.error("❌ SHOPIFY AUTH REJECTION RESPONDED WITH:", data);
    throw new Error(`Shopify Token Exchange Rejected: ${JSON.stringify(data)}`);
  }

  // Cache the token string and set its lifecycle expiration timestamp (24 hours)
  cachedAdminToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in || 86399) * 1000;

  console.log("✅ New Shopify Admin API session token acquired successfully!");
  return cachedAdminToken;
}

// ==========================================================================
// 🛡️ PRODUCTION RATE LIMITING PERIMETERS (ANTI-BOT SPIKE PROTECTION)
// ==========================================================================

// Limiter A: For ownership verification requests (Leager & Profile Handshakes)
const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: "Too many verification requests from this IP. Please try again after 15 minutes."
  }
});

// Limiter B: For token redemptions (Strict wallet financial transaction protection)
const redemptionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 15, // Limit each IP to 15 token redeems per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "🚨 Transaction security threshold reached. Too many redemption requests from this IP. Please try again later."
  }
});

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
// 🎯 STATELESS CRYPTOGRAPHIC LINK UTILITIES & TOKEN ENGINE HELPERS
// ==========================================================================

/**
 * Generates an encrypted, tamper-proof token containing access parameters
 */
const generateSecureDownloadToken = (routeId, customerId) => {
  // 🎯 UPDATE: Change access lifecycle window to precisely 7 days
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; 
  const payload = JSON.stringify({ routeId, customerId, expiresAt });
  
  const secureKey = crypto.scryptSync(process.env.JWT_SECRET || 'fallback-secret-string', 'ngaebo-salt', 32);
  const initializationVector = Buffer.alloc(16, 0); 
  
  const cipher = crypto.createCipheriv('aes-256-cbc', secureKey, initializationVector);
  let encrypted = cipher.update(payload, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return encrypted;
};

/**
 * Decrypts a download token and verifies that the 48-hour signature window is still open
 */
const verifySecureDownloadToken = (tokenString) => {
  try {
    const secureKey = crypto.scryptSync(process.env.JWT_SECRET || 'fallback-secret-string', 'ngaebo-salt', 32);
    const initializationVector = Buffer.alloc(16, 0);
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', secureKey, initializationVector);
    let decrypted = decipher.update(tokenString, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    const data = JSON.parse(decrypted);
    
    // Check if the current timestamp has surpassed the expiration boundary
    if (Date.now() > data.expiresAt) {
      console.warn("⚠️ SECURITY ACCESS ALERT: Token verification rejected due to expired lifetime timeline window.");
      return null;
    }
    
    return data;
  } catch (err) {
    console.error("🚨 CRYPTOGRAPHIC DECRYPTION FAILURE: Download link signature token manipulated or corrupted:", err.message);
    return null;
  }
};

/**
 * Helper endpoint query handler targeting Shopify's Admin GraphQL node
 */
async function shopifyAdminFetch(query, variables = {}) {
  try {
    // 🎯 DYNAMIC CALL: Fetch the active server-authenticated token on-the-fly
    const token = await getShopifyAdminToken();
    const shopDomain = process.env.VITE_SHOPIFY_STORE_DOMAIN || "ngaebo-shop-3.myshopify.com";

    const response = await fetch(`https://${shopDomain}/admin/api/2026-04/graphql.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });

    const json = await response.json();
    if (json.errors) {
      console.error("❌ SHOPIFY ADMIN GRAPHQL ERROR:", json.errors);
    }
    return json.data;
    
  } catch (err) {
    console.error("❌ Failed executing shopifyAdminFetch operation:", err);
    throw err;
  }
}

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

/**
 * INTERACTIVE RIDEGUIDE RENDER GATEWAY
 * Intercepts signed token payloads to verify authentication before serving index.html
 */
app.get("/download-guide", (req, res) => {
  const { routeID, secureToken } = req.query;

  // 1. Instantly drop requests missing their cryptographic visa
  if (!secureToken) {
    console.warn(`🔒 SECURITY BLOCK: Unauthorized attempt to view route ${routeID} without a token.`);
    return res.status(401).send("🚨 Access Denied: This link is missing its cryptographic access verification token.");
  }

  // 2. Decode and evaluate the signature against your server keys
  const tokenData = verifySecureDownloadToken(String(secureToken));
  
  if (!tokenData) {
    return res.status(403).send("🚨 Access Expired: This RideGuide link has expired (7-day access window closed) or the signature was altered.");
  }

  // 3. Prevent parameter manipulation (Ensure the URL's route matches the token payload)
  if (routeID && tokenData.routeId !== routeID) {
    return res.status(400).send("🚨 Validation Mismatch: Token signature does not match the requested route parameters.");
  }

  // Verification passed! Force privacy cache rules and serve the canvas dashboard
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  return res.sendFile(path.join(dist, "index.html"));
});

// ==========================================================================
// 🎯 NEW ACCESS CONTROL GATEWAYS (DOWNLOAD STREAMING & TOKEN MUTATIONS)
// ==========================================================================

/**
 * 🔒 CRYPTOGRAPHICALLY SECURED HIGH-PERFORMANCE FILE STREAM DOWNLOAD LINK
 * Intercepts signed token signatures and extracts/streams the raw PDF out of the secure static build paths
 */
app.get("/api/download-secure-guide", (req, res) => {
  const { secureToken } = req.query;
  
  if (!secureToken) {
    return res.status(400).send("Access Rejected: Missing cryptographic token validation vector.");
  }

  // Parse token validity parameters via server decryption keys
  const tokenData = verifySecureDownloadToken(String(secureToken));
  
  if (!tokenData) {
    return res.status(403).send("Access Revoked: Download link has expired or has a compromised signature footprint.");
  }

  const { routeId } = tokenData;
  
  // 🎯 FILE SYSTEM PATH MAPPING:
  // Dynamically maps the target file location relative to where the automated report engine outputs PDF documents
  const assetFilePath = path.join(__dirname, "public", "data", "generated_pdfs", `${routeId}.pdf`);
  const fallbackAssetPath = path.join(__dirname, "dist", "data", "generated_pdfs", `${routeId}.pdf`);
  
  const finalFileTarget = fs.existsSync(assetFilePath) ? assetFilePath : fallbackAssetPath;

  if (!fs.existsSync(finalFileTarget)) {
    console.error(`❌ TARGET PDF DISK LOSS: Request authenticated successfully, but target asset file could not be found at: ${finalFileTarget}`);
    return res.status(404).send("Document compilation complete, but asset retrieval timed out on disk layers.");
  }

  // Force strict cache privacy parameters
  cacheControlMiddleware(res);
  
  // Stream file byte payload straight into user context stream safely
  return res.sendFile(finalFileTarget);
});

/**
 * 🎰 ATOMIC TOKEN CONSUMPTION GATEWAY REDEMPTION ROUTE
 * Tracks time-locked JSON lifecycles, decrements tokens, and sends a MailerSend link receipt.
 */
app.post("/api/tokens/redeem", redemptionLimiter, async (req, res) => {
  // 🎯 PARAMETERS CAPTURE: Process the customer identity, requested route vector, and descriptive title
  const { customerId, routeId, routeTitle } = req.body;
  const MAILERSEND_API_KEY = process.env.MAILERSEND_API_KEY;

  if (!customerId || !routeId) {
    return res.status(400).json({ error: "Missing identity constraints." });
  }

  const normalizedCustomerId = customerId.replace("CustomerAccount/Customer", "Customer");

  try {
    const query = `
      query getCustomerMetafields($id: ID!) {
        customer(id: $id) {
          email
          tokens: metafield(namespace: "custom", key: "rideguide_tokens") { value }
          pass: metafield(namespace: "custom", key: "pass_expires_at") { value }
          unlocked: metafield(namespace: "custom", key: "unlocked_guides") { value }
        }
      }
    `;

    const data = await shopifyAdminFetch(query, { id: normalizedCustomerId });
    if (!data || !data.customer) {
      return res.status(404).json({ error: "Customer profile matching context not found." });
    }

    const customerEmail = data.customer.email; // 🎯 Extracted live from Shopify profile query
    const passValue = data.customer.pass?.value;
    const tokenCount = parseInt(data.customer.tokens?.value || "0", 10);
    const rawUnlockedJson = data.customer.unlocked?.value || "{}";
    
    let unlockedMap = {};
    try { unlockedMap = JSON.parse(rawUnlockedJson); } catch (e) { unlockedMap = {}; }

    const currentTimestamp = Date.now();
    
    // 🎯 SCHEMATIC OBJECT ENTRY PARSER: Safely reads the new object properties, 
    // while remaining fully backward-compatible with legacy primitive numbers.
    const entry = unlockedMap[routeId];
    let targetExpiration = 0;
    if (entry) {
      if (typeof entry === "object" && entry !== null) {
        targetExpiration = Number(entry.expiresAt || 0);
      } else {
        targetExpiration = Number(entry || 0);
      }
    }
    
    let accessGranted = targetExpiration > currentTimestamp;
    const mutationsArray = [];

    if (!accessGranted && passValue && new Date() < new Date(passValue)) {
      accessGranted = true;
      console.log(`✓ ACCESS APPROVED: Member ${customerId} owns a live active membership pass.`);
    } 
    else if (!accessGranted && tokenCount > 0) {
      const remainingTokens = tokenCount - 1;
      mutationsArray.push({
        ownerId: normalizedCustomerId,
        namespace: "custom",
        key: "rideguide_tokens",
        type: "number_integer",
        value: String(remainingTokens)
      });
      accessGranted = true;
    }

    if (!accessGranted) {
      return res.status(402).json({ error: "Insufficient account balance. Pack token depletion reached." });
    }

    // 🎯 SCHEMATIC DICTIONARY WRITER: Seeds the explicit route names directly into the database payload object
    unlockedMap[routeId] = {
      expiresAt: currentTimestamp + (7 * 24 * 60 * 60 * 1000),
      name: routeTitle || `Route ${routeId}`
    };
    
    mutationsArray.push({
      ownerId: normalizedCustomerId,
      namespace: "custom",
      key: "unlocked_guides",
      type: "json",
      value: JSON.stringify(unlockedMap)
    });

    if (mutationsArray.length > 0) {
      const setMetafieldsMutation = `
        mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            userErrors { message }
          }
        }
      `;
      const mutationResult = await shopifyAdminFetch(setMetafieldsMutation, { metafields: mutationsArray });
      const errors = mutationResult?.metafieldsSet?.userErrors || [];
      if (errors.length > 0) throw new Error(errors[0].message);
    }

    const downloadToken = generateSecureDownloadToken(routeId, customerId);
    const host = req.headers.host || "bogged-nanometer-criteria.ngrok-free.dev";
    const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const downloadUrl = `${protocol}://${host}/download-guide?routeID=${routeId}&secureToken=${downloadToken}`;

    // 🚀 MAILERSEND DISPATCH ENGINE (Runs on every single verification loop block redemption)
    if (MAILERSEND_API_KEY && customerEmail) {
      const targetRouteTitle = routeTitle || "Your Requested Custom Route";
      const mailersendPayload = {
        from: { email: "orders@northgeorgiaebikes.com", name: "North Georgia eBike Outfitters" },
        to: [{ email: customerEmail }],
        subject: `Your ${targetRouteTitle} RideGuide Access Link`,
        text: getRideGuideText(targetRouteTitle, downloadUrl), 
        html: getRideGuideHTML(targetRouteTitle, downloadUrl)  
      };

      console.log(`\n✉️ [MAILERSEND] Dispatching token redemption email to: ${customerEmail}`);
      fetch("https://api.mailersend.com/v1/email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${MAILERSEND_API_KEY}` },
        body: JSON.stringify(mailersendPayload)
      })
      .then(async (msRes) => {
        console.log(`✉️ [MAILERSEND] Response Status Code: ${msRes.status}`);
        if (!msRes.ok) {
          const bodyErr = await msRes.text();
          console.error(`❌ [MAILERSEND] API Rejected Request: ${bodyErr}`);
        } else {
          console.log(`✓ [MAILERSEND] Email sent successfully.`);
        }
      })
      .catch(err => console.error("⚠️ [MAILERSEND] Network layer transmission exception:", err));
    }

    // 🎯 THE COMPLETENESS FIX: Sync token redeemers to MailerLite as well!
    if (MAILERLITE_API_KEY) {
      fetch("https://connect.mailerlite.com/api/subscribers", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Accept": "application/json", 
          "Authorization": `Bearer ${MAILERLITE_API_KEY}` 
        },
        body: JSON.stringify({
          email: customerEmail,
          status: "active",
          groups: [183580786152178921], 
          fields: {
            purchased_route_title: routeTitle || "Token Redeemed Track"
          }
        })
      }).catch(err => console.error("❌ Non-blocking MailerLite sync error during redemption:", err));
    }

    return res.status(200).json({ success: true, downloadUrl });

  } catch (err) {
    console.error("❌ TOKEN REDEEM LOGIC CRASH:", err);
    return res.status(500).json({ error: "Internal ledger processing loop error." });
  }
});

/**
 * 🔒 ZERO-TRUST TIME-LOCKED OWNERSHIP VERIFICATION GATEWAY
 * Cross-checks client claims against cryptographically signed token payloads.
 */
app.post("/api/tokens/verify-ownership", verificationLimiter, async (req, res) => {
  const { customerId, routeId, secureToken } = req.body;

  if (!customerId || !routeId) {
    return res.status(400).json({ error: "Missing identity constraints." });
  }

  // 🎯 STEP 1: DEFENSIVE CRYPTOGRAPHIC VISAS CHECK
  let passesCryptographicValidation = false;
  if (secureToken) {
    const decryptedTokenData = verifySecureDownloadToken(String(secureToken));
    if (decryptedTokenData) {
      const extractNumericId = (gid) => {
        return String(gid || "").replace("gid://shopify/", "").replace("CustomerAccount/", "").replace("Customer/", "");
      };
      
      const tokenUserDigits = extractNumericId(decryptedTokenData.customerId);
      const sessionUserDigits = extractNumericId(customerId);

      if (tokenUserDigits === sessionUserDigits && decryptedTokenData.routeId === routeId) {
        passesCryptographicValidation = true;
      }
    }
  }

  // If the link's secureToken itself is active and matching, approve access immediately
  if (passesCryptographicValidation) {
    return res.status(200).json({ hasAccess: true, reason: "Cryptographically verified unexpired 7-day token link signature." });
  }

  // 🎯 STEP 2: FALLBACK DATABASE VERIFICATION CHECK
  // If the link signature has expired, check the customer's Shopify profile for an active pass
  const normalizedCustomerId = customerId.replace("CustomerAccount/Customer", "Customer");

  try {
    const query = `
      query verifyOwnership($id: ID!) {
        customer(id: $id) {
          pass: metafield(namespace: "custom", key: "pass_expires_at") { value }
          unlocked: metafield(namespace: "custom", key: "unlocked_guides") { value }
        }
      }
    `;

    const data = await shopifyAdminFetch(query, { id: normalizedCustomerId });
    if (!data || !data.customer) {
      return res.status(404).json({ error: "Customer profile context not found." });
    }

    const passValue = data.customer.pass?.value;
    const rawUnlockedJson = data.customer.unlocked?.value || "{}";

    if (passValue && new Date() < new Date(passValue)) {
      return res.status(200).json({ hasAccess: true, reason: "Unlimited pass coverage active." });
    }

    let unlockedMap = {};
    try { unlockedMap = JSON.parse(rawUnlockedJson); } catch (e) { unlockedMap = {}; }

    const entry = unlockedMap[routeId];
    let expirationTime = 0;
    if (entry) {
      if (typeof entry === "object" && entry !== null) {
        expirationTime = Number(entry.expiresAt || 0);
      } else {
        expirationTime = Number(entry || 0);
      }
    }

    if (expirationTime > Date.now()) {
      return res.status(200).json({ hasAccess: true, reason: "Verified unexpired 7-day route vault window." });
    }

    // Both verification tracks failed
    return res.status(403).json({ 
      hasAccess: false, 
      error: "🚨 Access Expired: Your 7-day access window for this guide has closed. Please refresh it with a token credit." 
    });

  } catch (err) {
    console.error("❌ OWNERSHIP MATRIX FAILURE:", err);
    return res.status(500).json({ error: "Internal credential handshake error." });
  }
});

// ==========================================================================
// 🚀 PRODUCTION WEBHOOK FULL LIFECYCLE MONITOR ENGINE
// ==========================================================================
app.post("/api/webhooks/shopify/orders-paid", async (req, res) => {
  console.log("\n⚠️ [WEBHOOK INCOMING] Shopify fired an orders-paid notification! Processing request payload stream...");
  
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
    
    const rawCustomerId = payload.customer?.id;
    const shopifyCustomerId = rawCustomerId ? `gid://shopify/Customer/${rawCustomerId}` : null;

    const purchasedItem = lineItems[0] || {};
    const targetVariantId = purchasedItem.variant_id ? `gid://shopify/ProductVariant/${purchasedItem.variant_id}` : '';
    const itemQuantity = purchasedItem.quantity || 1;

    // ──────────────────────────────────────────────────────────────────────
    // 🎯 LIVE HARD-CODED MULTI-PACK PROVISIONING GATE (CHECKED FIRST)
    // ──────────────────────────────────────────────────────────────────────
    if (shopifyCustomerId) {
      let tokenIncrementAmount = 0;
      let passExtensionDays = 0;

      // Mapped explicitly to your validated Shopify production variant signatures
      if (targetVariantId === "gid://shopify/ProductVariant/51619975069916") {
        tokenIncrementAmount = 3 * itemQuantity;
      } else if (targetVariantId === "gid://shopify/ProductVariant/51620055089372") {
        tokenIncrementAmount = 5 * itemQuantity;
      } else if (targetVariantId === "gid://shopify/ProductVariant/51620150837468") {
        tokenIncrementAmount = 15 * itemQuantity;
      } else if (targetVariantId === "gid://shopify/ProductVariant/YOUR_7_DAY_PASS_VARIANT_ID") {
        passExtensionDays = 7;
      }

      if (tokenIncrementAmount > 0 || passExtensionDays > 0) {
        console.log(`📦 PROVISIONING EVENT DETECTED: Order ${orderNumber} contains multi-pack bundle assets for client profile ${shopifyCustomerId}...`);
        
        const currentMetafieldsQuery = `
          query getCustomerMetafields($id: ID!) {
            customer(id: $id) {
              tokens: metafield(namespace: "custom", key: "rideguide_tokens") { value }
              pass: metafield(namespace: "custom", key: "pass_expires_at") { value }
            }
          }
        `;
        const profileData = await shopifyAdminFetch(currentMetafieldsQuery, { id: shopifyCustomerId });
        
        const mutationsArray = [];

        if (tokenIncrementAmount > 0) {
          const baselineTokens = parseInt(profileData?.customer?.tokens?.value || "0", 10);
          const computedTotal = baselineTokens + tokenIncrementAmount;
          mutationsArray.push({
            ownerId: shopifyCustomerId,
            namespace: "custom",
            key: "rideguide_tokens",
            type: "number_integer",
            value: String(computedTotal)
          });
        }

        if (passExtensionDays > 0) {
          const currentPassExpirationValue = profileData?.customer?.pass?.value;
          let baseDate = new Date();
          
          if (currentPassExpirationValue && new Date(currentPassExpirationValue) > new Date()) {
            baseDate = new Date(currentPassExpirationValue);
          }
          
          baseDate.setDate(baseDate.getDate() + passExtensionDays);
          
          mutationsArray.push({
            ownerId: shopifyCustomerId,
            namespace: "custom",
            key: "pass_expires_at",
            type: "date_time",
            value: baseDate.toISOString()
          });
        }

        const setMetafieldsMutation = `
          mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
            metafieldsSet(metafields: $metafields) {
              userErrors { message }
            }
          }
        `;
        // ... Your existing GraphQL metafield code that awards the 3, 5, or 15 tokens ...
        await shopifyAdminFetch(setMetafieldsMutation, { metafields: mutationsArray });
        console.log(`✓ PROVISIONING EVENT FINALIZED: Balance modifications committed successfully for order ${orderNumber}.`);

        // 🎯 THE FIX: Fire MailerLite synchronization for Bundle Buyers before returning!
        if (MAILERLITE_API_KEY && buyerAcceptsMarketing === true) {
          try {
            console.log(`🚀 [BUNDLE LIFECYCLE]: Syncing token purchaser ${customerEmail} to MailerLite...`);
            await fetch("https://connect.mailerlite.com/api/subscribers", {
              method: "POST",
              headers: { 
                "Content-Type": "application/json", 
                "Accept": "application/json", 
                "Authorization": `Bearer ${MAILERLITE_API_KEY}` 
              },
              body: JSON.stringify({
                email: customerEmail,
                status: "active",
                groups: [183580786152178921], // Directs them to your active purchaser group segment
                fields: {
                  name: payload.billing_address?.first_name || "Rider",
                  last_order_id: orderNumber,
                  purchased_route_title: purchasedItem.title // Log the specific bundle name they chose
                }
              })
            });
          } catch (mlErr) {
            console.error("❌ Non-blocking MailerLite sync error for bundle:", mlErr);
          }
        }

        // Now it is perfectly safe to return and release the webhook response stream!
        return res.status(200).send("Account Balance Incremented and MailerLite Synced Successfully");
      }
    }

    // ──────────────────────────────────────────────────────────────────────
    // 🛍️ STANDARD RETAIL FALLBACK ROUTE: MODIFIED TO COMMITT DATABASE METAFIELED ENTRIES
    // ──────────────────────────────────────────────────────────────────────
    const customProperties = purchasedItem.properties || [];
    const routeIDAttr = customProperties.find(attr => attr.name === "SelectedRouteID");
    const routeTitleAttr = customProperties.find(attr => attr.name === "RouteTitle");

    if (!routeIDAttr) return res.status(200).send("Processed: Missing Telemetry Properties");

    const targetRouteID = routeIDAttr.value; 
    const targetRouteTitle = routeTitleAttr ? routeTitleAttr.value : "Your Custom Route";

    // 🎯 METAFIELED BRIDGE ATTACHMENT GATEWAY:
    // If the retail buyer is logged into an account, save the route ID to their permanent catalog history database
    if (shopifyCustomerId) {
      try {
        console.log(`🛍️ [RETAIL CASH LIFECYCLE]: Appending track "${targetRouteTitle}" (${targetRouteID}) to profile account: ${shopifyCustomerId}`);
        
        const normalizedCustomerId = shopifyCustomerId.replace("CustomerAccount/Customer", "Customer");
        
        const currentMetafieldsQuery = `
          query getCustomerMetafields($id: ID!) {
            customer(id: $id) {
              unlocked: metafield(namespace: "custom", key: "unlocked_guides") { value }
            }
          }
        `;
        const profileData = await shopifyAdminFetch(currentMetafieldsQuery, { id: normalizedCustomerId });
        const rawUnlockedJson = profileData?.customer?.unlocked?.value || "{}";
        
        let unlockedMap = {};
        try { unlockedMap = JSON.parse(rawUnlockedJson); } catch (e) { unlockedMap = {}; }
        
        // Seed 7 days access window matching token redemptions rules
        unlockedMap[targetRouteID] = {
          expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
          name: targetRouteTitle
        };

        const setMetafieldsMutation = `
          mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
            metafieldsSet(metafields: $metafields) {
              userErrors { message }
            }
          }
        `;
        
        await shopifyAdminFetch(setMetafieldsMutation, {
          metafields: [{
            ownerId: normalizedCustomerId,
            namespace: "custom",
            key: "unlocked_guides",
            type: "json",
            value: JSON.stringify(unlockedMap)
          }]
        });
        console.log(`✓ [RETAIL CASH LIFECYCLE]: Database entry wrote successfully for order ${orderNumber}.`);
      } catch (gqlErr) {
        console.error("❌ Failed to automatically append cash guide to customer metafield database layers:", gqlErr);
        // Non-blocking catch parameters to ensure the transaction continues down to mailersend dispatches
      }
    }

    console.log(`\n🔍 [DIAGNOSTIC TRACE] Checking MailerSend Variable Parameters:`);
    console.log(`   - Raw Type Check: ${typeof MAILERSEND_API_KEY}`);
    console.log(`   - Is Truthy Value?: ${!!MAILERSEND_API_KEY}`);
    if (MAILERSEND_API_KEY) {
      console.log(`   - String Length: ${MAILERSEND_API_KEY.length} characters`);
      console.log(`   - Prefix Check: ${MAILERSEND_API_KEY.substring(0, 7)}...`);
    } else {
      console.log(`   - Warning: process.env.MAILERSEND_API_KEY returned undefined or null empty memory slot`);
    }
    console.log(`───────────────────────────────────────────────────────\n`);

    // Generate secure link tokens matching parameters
    const fallbackCustomerGid = shopifyCustomerId || "gid://shopify/Customer/anonymous_retail";
    const retailSecureToken = generateSecureDownloadToken(targetRouteID, fallbackCustomerGid);

    const host = req.headers.host || "northgeorgiaebikes.com";
    const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const targetDownloadUrl = `${protocol}://${host}/download-guide?routeID=${targetRouteID}&secureToken=${retailSecureToken}`;

    if (MAILERSEND_API_KEY) {
      const mailersendPayload = {
        from: { email: "orders@northgeorgiaebikes.com", name: "North Georgia eBike Outfitters" },
        to: [{ email: customerEmail }],
        subject: `Your ${targetRouteTitle} RideGuide is ready!`,
        text: getRideGuideText(targetRouteTitle, targetDownloadUrl), 
        html: getRideGuideHTML(targetRouteTitle, targetDownloadUrl)  
      };

      console.log(`\n✉️ [MAILERSEND] Dispatching cash checkout email to: ${customerEmail}`);
      try {
        const msRes = await fetch("https://api.mailersend.com/v1/email", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${MAILERSEND_API_KEY}` },
          body: JSON.stringify(mailersendPayload)
        });
        
        console.log(`✉️ [MAILERSEND] Response Status Code: ${msRes.status}`);
        if (!msRes.ok) {
          const bodyErr = await msRes.text();
          console.error(`❌ [MAILERSEND] API Webhook Loop Rejected Request: ${bodyErr}`);
        } else {
          console.log(`✓ [MAILERSEND] Cash checkout email sent successfully.`);
        }
      } catch (err) {
        console.error("⚠️ [MAILERSEND] Webhook transaction catch exception thrown:", err);
      }
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
    console.error("Webhook processing error:", error);
    return res.status(400).send("Webhook exceptional failure.");
  }
});

/* ==========================================================================
   1. MAILERLITE FORM CAPTURE GATEWAY ENDPOINT (EXACT EXTENSION VERIFIED)
   ========================================================================== */
app.post("/api/subscribe", async (req, res) => {
  const { email, intent_tag } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // Fallback if intent_tag is not present
  const intentTag = intent_tag || "general_newsletter";

  try {
    const apiKey = process.env.MAILERLITE_API_KEY;
    // 🎯 YOUR EXACT PRODUCTION GROUP ID REMAINING ABSOLUTELY UNTOUCHED
    const groupId = "189918909111994294"; 

    const url = `https://api.mailerlite.com/api/v2/groups/${groupId}/subscribers`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "X-MailerLite-ApiKey": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        // Safeguards re-entry tracking rules for multi-click subscribers
        resubscribe: true, 
        fields: {
          intent_tag: intentTag, // 🎯 Left exactly as it is now to preserve what works
          tags: "nurture_active" // 🚀 The exact low-risk extension needed to seed your tracker
        },
      }),
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