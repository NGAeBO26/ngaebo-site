// src/store/ShopifyAuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateCodeVerifier, generateCodeChallenge, generateRandomState } from '../features/Discovery/utils/pkce';

interface CustomerProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  // 🎯 NEW LEDGER ACCOUNT STATE ATTRIBUTES
  tokens: number;
  passExpiresAt: string | null;
}

interface ShopifyAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  customer: CustomerProfile | null;
  login: () => Promise<void>;
  logout: () => void;
  handleCallback: (code: string) => Promise<void>;
  accessToken: string | null;
  refreshProfile: () => Promise<void>; // 🎯 Added to refresh balances instantly after unlocks
}

const ShopifyAuthContext = createContext<ShopifyAuthContextType | undefined>(undefined);

const SHOP_ID = "83633864924"; 
const AUTH_BASE_URL = `https://shopify.com/authentication/${SHOP_ID}/oauth`;
const GRAPHQL_API_URL = `https://shopify.com/${SHOP_ID}/account/customer/api/2026-04/graphql`;

export const ShopifyAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('shopify_access_token'));
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const login = async () => {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    const state = generateRandomState();

    sessionStorage.setItem('shopify_code_verifier', verifier);
    sessionStorage.setItem('shopify_auth_state', state);
    sessionStorage.setItem('shopify_auth_redirect_origin', window.location.pathname + window.location.search);

    const authorizationUrl = new URL(`${AUTH_BASE_URL}/authorize`);
    authorizationUrl.searchParams.append('client_id', import.meta.env.VITE_SHOPIFY_PUBLIC_CLIENT_ID);
    authorizationUrl.searchParams.append('scope', 'openid email customer-account-api:full');
    authorizationUrl.searchParams.append('response_type', 'code');
    authorizationUrl.searchParams.append('redirect_uri', import.meta.env.VITE_SHOPIFY_REDIRECT_URI);
    authorizationUrl.searchParams.append('state', state);
    authorizationUrl.searchParams.append('code_challenge', challenge);
    authorizationUrl.searchParams.append('code_challenge_method', 'S256');

    window.location.href = authorizationUrl.toString();
  };

  const handleCallback = async (code: string) => {
    const verifier = sessionStorage.getItem('shopify_code_verifier');
    if (!verifier) throw new Error("Missing cryptographic tracking verification context keys.");

    const bodyParameters = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: import.meta.env.VITE_SHOPIFY_PUBLIC_CLIENT_ID,
      redirect_uri: import.meta.env.VITE_SHOPIFY_REDIRECT_URI,
      code: code,
      code_verifier: verifier,
    });

    try {
      const response = await fetch(`${AUTH_BASE_URL}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: bodyParameters.toString(),
      });

      if (!response.ok) throw new Error("Failed token verification exchange handshake.");
      const data = await response.json();

      localStorage.setItem('shopify_access_token', data.access_token);
      if (data.id_token) {
        localStorage.setItem('shopify_id_token', data.id_token);
      }
      
      setAccessToken(data.access_token);
      sessionStorage.removeItem('shopify_code_verifier');
    } catch (error) {
      console.error("OAuth Authentication Error:", error);
    }
  };

  const fetchCustomerProfile = async (token: string) => {
    // 🎯 MODIFIED: Queries the custom metafields verified on your Customer Account setup
    const query = `
      query {
        customer {
          id
          firstName
          lastName
          emailAddress { emailAddress }
          tokens: metafield(namespace: "custom", key: "rideguide_tokens") { value }
          pass: metafield(namespace: "custom", key: "pass_expires_at") { value }
        }
      }
    `;

    try {
      const response = await fetch(GRAPHQL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
        body: JSON.stringify({ query }),
      });

      const resData = await response.json();
      if (resData.data?.customer) {
        const c = resData.data.customer;
        setCustomer({
          id: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.emailAddress?.emailAddress || '',
          // Safe baseline fallback defaults if fields are empty on new profiles
          tokens: c.tokens?.value ? parseInt(c.tokens.value, 10) : 0,
          passExpiresAt: c.pass?.value || null,
        });
      }
    } catch (err) {
      console.error("Error retrieving account payload data:", err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (accessToken) await fetchCustomerProfile(accessToken);
  };

  const logout = () => {
    const idToken = localStorage.getItem('shopify_id_token');

    localStorage.removeItem('shopify_access_token');
    localStorage.removeItem('shopify_id_token');
    setAccessToken(null);
    setCustomer(null);
    
    const absoluteLogoutEndpoint = `https://shopify.com/authentication/${SHOP_ID}/logout`;
    const logoutUrl = new URL(absoluteLogoutEndpoint);
    
    logoutUrl.searchParams.append('client_id', import.meta.env.VITE_SHOPIFY_PUBLIC_CLIENT_ID);
    logoutUrl.searchParams.append('post_logout_redirect_uri', window.location.origin + '/');
    
    if (idToken) {
      logoutUrl.searchParams.append('id_token_hint', idToken);
    }

    window.location.href = logoutUrl.toString();
  };

  useEffect(() => {
    if (accessToken) {
      fetchCustomerProfile(accessToken);
    } else {
      setIsLoading(false);
    }
  }, [accessToken]);

  return (
    <ShopifyAuthContext.Provider value={{ isAuthenticated: !!accessToken, isLoading, customer, login, logout, handleCallback, accessToken, refreshProfile }}>
      {children}
    </ShopifyAuthContext.Provider>
  );
};

export const useShopifyAuth = () => {
  const context = useContext(ShopifyAuthContext);
  if (!context) throw new Error("useShopifyAuth can only look inside a secure ShopifyAuthProvider wrapper mapping.");
  return context;
};