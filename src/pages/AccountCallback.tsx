// src/pages/AccountCallback.tsx
import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useShopifyAuth } from '../store/ShopifyAuthContext';

export default function AccountCallback() {
  const [searchParams] = useSearchParams();
  const { handleCallback } = useShopifyAuth();
  const navigate = useNavigate();
  const activationTriggered = useRef(false);

  useEffect(() => {
    const code = searchParams.get('code');
    
    if (code && !activationTriggered.current) {
      activationTriggered.current = true;
      
      handleCallback(code).then(() => {
        // 🎯 ORIGIN RETURN EXTRACTION: Forward user back to their starting page view context, defaulting to homepage
        const originPath = sessionStorage.getItem('shopify_auth_redirect_origin') || '/';
        sessionStorage.removeItem('shopify_auth_redirect_origin');
        navigate(originPath);
      }).catch((err) => {
        console.error("Callback execution fault:", err);
        navigate('/');
      });
    }
  }, [searchParams, handleCallback, navigate]);

  return (
    <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ marginBottom: '8px' }}>Syncing Active Shopify Account Profiles...</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Securing credential authentication keys.</p>
      </div>
    </div>
  );
}