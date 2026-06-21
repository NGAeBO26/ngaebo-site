// src/utils/pkce.ts

// Generates a random unguessable base64 string
export function generateCodeVerifier(): string {
  const array = new Uint32Array(56);
  window.crypto.getRandomValues(array);
  return Array.from(array, (dec) => ('0' + dec.toString(16)).substr(-2)).join('');
}

// Hashes the verifier via SHA-256 for the challenge handshake
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await window.crypto.subtle.digest('SHA-256', data);
  
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Generates a basic state parameter string to prevent CSRF attacks
export function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15);
}