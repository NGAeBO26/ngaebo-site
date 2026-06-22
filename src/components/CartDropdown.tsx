/* src/components/CartDropdown.tsx */
import { useShopifyAuth } from "../store/ShopifyAuthContext"; // 🎯 RE-INTEGRATED: Fetches live authorization context profiles
import { useShopifyCart } from "../store/ShopifyCartContext";
import "../styles/CartDropdown.css"; 

interface CartDropdownProps {
  isOpen: boolean; 
}

export default function CartDropdown({ isOpen }: CartDropdownProps) {
  // 🎯 CONNECT AUTH STATE: Read live customer accounts to synchronize user titles
  const { customer, isAuthenticated } = useShopifyAuth();
  const { cartItems, cartSubtotal, checkoutUrl, removeCartItem } = useShopifyCart();

  const handleCheckoutRedirect = () => {
    if (checkoutUrl) {
      window.open(checkoutUrl, "_blank"); 
    }
  };

  return (
    <div className={`rg-cart-dropdown-popover ${isOpen ? "rg-cart-reveal" : ""}`}>
      
      {/* RESTORED BRAND GREEN HEADER BLOCK PANELS */}
      <div className="rg-cart-dropdown-header">
        <div>
          <span className="rg-cart-dropdown-header-meta">RIDER INVENTORY CART</span>
          
          {/* 🎯 DYNAMIC SESSION HANDSHAKE TITLE: Shows custom user credentials if logged in, 
              or explicitly labels the asset list as a Guest Selection to mirror the StorePanel profile */}
          <div className="rg-cart-dropdown-header-title" style={{ textAlign: 'left', marginTop: '2px' }}>
            {isAuthenticated && customer?.firstName 
              ? `${customer.firstName}'s Selection` 
              : "Guest Selection"}
          </div>
        </div>
      </div>

      {/* 🦴 SOLIDIFIED BONE BACKGROUND LAYER */}
      <div className="rg-cart-dropdown-body">
        <div className="rg-cart-scroll-container">
          {cartItems.length === 0 ? (
            <div className="rg-cart-empty-state">
              Your cart is empty. Select a route to add!
            </div>
          ) : (
            cartItems.map((item: any) => (
              <div key={item.id} className="rg-cart-item-row-card">
                
                {/* 🎯 LEFT SIDE TRACK: Difficulty Badge + Descriptive Texts Grouped */}
                <div className="rg-cart-item-left-group">
                  {item.fcsLabel && (
                    <img 
                      src={`/images/badges/fcs/fcs-badge-${item.fcsLabel.toLowerCase()}.png`} 
                      alt="fcs classification badge" 
                      className="rg-cart-item-badge-left"
                      onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                    />
                  )}
                  <div>
                    <div className="rg-cart-item-title">{item.title}</div>
                    <div className="rg-cart-item-subtitle">{item.distance}</div>
                  </div>
                </div>

                {/* 🎯 RIGHT SIDE TRACK: Transaction Pricing + Inline Trash Removal Trigger */}
                <div className="rg-cart-item-right-group">
                  <div className="rg-cart-item-price">
                    ${item.price.toFixed(2)}
                  </div>
                  
                  <button
                    onClick={() => removeCartItem?.(item.id)}
                    className="rg-cart-item-remove-btn"
                    aria-label={`Remove ${item.title} from inventory selection`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>

              </div>
            ))
          )}
        </div>

        {/* 🎯 GUEST WARNING CONTEXT BANNER: Synchronizes visual cues across the UI, 
            reminding anonymous shoppers that an account is required at checkout */}
        {!isAuthenticated && cartItems.length > 0 && (
          <div style={{ padding: "10px 0 0 0", fontSize: "10px", color: "#b45309", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.3px", textAlign: "center", fontFamily: "sans-serif", borderTop: "1px dashed rgba(15, 23, 42, 0.1)", marginTop: "10px" }}>
            ⚠️ Guest Mode: Login Required at Checkout
          </div>
        )}

        {/* Calculation summary parameters container stack */}
        {cartItems.length > 0 && (
          <div className="rg-cart-calculation-summary-block">
            <div className="rg-cart-subtotal-row">
              <span className="rg-cart-subtotal-label">Total Subtotal:</span>
              <span className="rg-cart-subtotal-value">${cartSubtotal.toFixed(2)}</span>
            </div>
            <button 
              onClick={handleCheckoutRedirect}
              className="rg-cart-checkout-cta-btn"
            >
              PROCEED TO CHECKOUT ➔
            </button>
          </div>
        )}
      </div>
    </div>
  );
}