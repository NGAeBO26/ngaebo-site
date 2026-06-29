/* src/pages/DownloadGuide.tsx */
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useShopifyAuth } from "../store/ShopifyAuthContext";
import RideGuidePrinter from "../components/RideGuide/RideGuidePrinter";


export default function DownloadGuidePage() {
  const [searchParams] = useSearchParams();
  const routeID = searchParams.get("routeID");
  const { customer, isAuthenticated, isLoading, login } = useShopifyAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      const currentURL = window.location.href;
      sessionStorage.setItem("auth_redirect_back_target", currentURL);
      console.warn("🔐 Session token expired or invalid. Re-routing through security gate...");
      login();
    }
  }, [isAuthenticated, isLoading, login]);

  if (!routeID) {
    return (
      <div style={{ color: "white", textAlign: "center", padding: "80px", fontFamily: "sans-serif" }}>
        <h2>Invalid Asset Link</h2>
        <p style={{ color: "#9ca3af" }}>We couldn't detect a valid route ID parameter in your request link.</p>
      </div>
    );
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div style={{ color: "white", textAlign: "center", padding: "140px 20px", fontFamily: "sans-serif" }}>
        <h2 style={{ fontSize: "22px", marginBottom: "12px", fontWeight: 700 }}>
          🔒 Verifying Security Clearance...
        </h2>
        <p style={{ color: "#9ca3af", fontSize: "14px" }}>
          Confirming account ownership metrics against the requested map asset. One moment.
        </p>
      </div>
    );
  }

  return <RideGuidePrinter routeID={routeID} customerID={customer?.id || ""} />;
}