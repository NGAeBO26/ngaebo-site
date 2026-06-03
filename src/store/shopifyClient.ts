/* src/store/shopifyClient.ts */

const SHOPIFY_DOMAIN = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN;
const STOREFRONT_TOKEN = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN;

// 🎯 VERBOSE STAGING PRODUCTION GRAPHQL DIAGNOSTICS MATRIX
console.log("==================================================");
console.log("🧪 [STAGING FRONTEND ENVIRONMENT MONITOR]");
console.log("📍 Compiled Target Domain:", SHOPIFY_DOMAIN || "❌ UNDEFINED / EMPTY");
console.log("🔑 Storefront Token Length Loaded:", STOREFRONT_TOKEN ? `${STOREFRONT_TOKEN.length} characters` : "❌ 0 (MISSING)");
console.log("📦 All VITE_ Prefixed Keys Compiling:", Object.keys(import.meta.env).filter(k => k.startsWith("VITE_")));
console.log("==================================================");

/**
 * Executes secure asynchronous queries straight to your Shopify Storefront endpoint
 */
export async function shopifyFetch({ query, variables = {} }: { query: string; variables?: any }) {
  if (!SHOPIFY_DOMAIN || !STOREFRONT_TOKEN) {
    console.error("❌ SHOPIFY CLIENT ERROR: Missing critical environment configuration parameters inside your local .env file.", {
      domainDetected: SHOPIFY_DOMAIN || "MISSING",
      tokenDetected: STOREFRONT_TOKEN ? "PRESENT" : "MISSING"
    });
    return null;
  }

  try {
    // 🎯 VERSION UPGRADE: Shifted from deprecated "2024-04" over to supported "2026-04" matching your webhook version profile
    const response = await fetch(`https://${SHOPIFY_DOMAIN}/api/2026-04/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`Shopify HTTP error framework alert. Status returned: ${response.status}`);
    }

    const json = await response.json();
    if (json.errors) {
      console.error("❌ SHOPIFY GRAPHQL RUNTIME EXCEPTION:", json.errors);
      return null;
    }

    return json.data;
  } catch (err) {
    console.error("🚨 SHOPIFY SERVICE NETWORK DISRUPTION:", err);
    return null;
  }
}

/**
 * 🎯 MODERN CART API MUTATION STATEMENT
 * Replaces checkoutCreate with the version active in your Shopify API schema profile
 */
export const CREATE_CHECKOUT_MUTATION = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
      }
      userErrors {
        code
        field
        message
      }
    }
  }
`;