/* src/store/ShopifyCartContext.tsx */
import React, { createContext, useContext, useState, useEffect } from "react"; 
import { shopifyFetch } from "./shopifyClient";
import { useShopifyAuth } from "./ShopifyAuthContext"; 

interface CartItem {
  id: string;
  title: string;
  quantity: number;
  price: number;
  routeId?: string;
  distance?: string;
  fcsLabel?: string; 
}

interface ShopifyCartContextType {
  cartItems: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  checkoutUrl: string | null;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  // 🎯 FIX A: Change context method definitions to return the raw updated URL string from Shopify
  addRouteToCart: (variantId: string, routeId: string, title: string, distance: string, fcsLabel: string) => Promise<string | null>; 
  removeCartItem: (lineId: string) => Promise<string | null>; 
  isLoading: boolean;
}

const ShopifyCartContext = createContext<ShopifyCartContextType | undefined>(undefined);

const GET_CART_QUERY = `
  query getCart($cartId: ID!) {
    cart(id: $cartId) {
      id
      checkoutUrl
      cost { subtotalAmount { amount } }
      lines(first: 10) {
        edges {
          node {
            id
            quantity
            merchandise { ... on ProductVariant { price { amount } } }
            attributes { key value }
          }
        }
      }
    }
  }
`;

const CART_CREATE_MUTATION = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        cost { subtotalAmount { amount } }
        lines(first: 10) {
          edges {
            node {
              id
              quantity
              merchandise { ... on ProductVariant { price { amount } } }
              attributes { key value }
            }
          }
        }
      }
      userErrors { message }
    }
  }
`;

const CART_LINES_ADD_MUTATION = `
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        cost { subtotalAmount { amount } }
        lines(first: 10) {
          edges {
            node {
              id
              quantity
              merchandise { ... on ProductVariant { price { amount } } }
              attributes { key value }
            }
          }
        }
      }
      userErrors { message }
    }
  }
`;

const CART_LINES_REMOVE_MUTATION = `
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        id
        checkoutUrl
        cost { subtotalAmount { amount } }
        lines(first: 10) {
          edges {
            node {
              id
              quantity
              merchandise { ... on ProductVariant { price { amount } } }
              attributes { key value }
            }
          }
        }
      }
      userErrors { message }
    }
  }
`;

const CART_BUYER_IDENTITY_UPDATE_MUTATION = `
  mutation cartBuyerIdentityUpdate($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
    cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
      cart { id checkoutUrl }
      userErrors { field message }
    }
  }
`;

export const ShopifyCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken } = useShopifyAuth();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState<number>(0);
  const [cartSubtotal, setCartSubtotal] = useState<number>(0);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cartId, setCartId] = useState<string | null>(() => localStorage.getItem("shopify_cart_id"));

  const updateLocalCartState = (cart: any) => {
    setCheckoutUrl(cart.checkoutUrl);
    setCartSubtotal(Number(cart.cost.subtotalAmount.amount));

    const parsedItems = cart.lines.edges.map((edge: any) => {
      const node = edge.node;
      const attrs = node.attributes || [];
      const rTitle = attrs.find((a: any) => a.key === "RouteTitle")?.value || "Premium Route";
      const rId = attrs.find((a: any) => a.key === "SelectedRouteID")?.value || "";
      const rDist = attrs.find((a: any) => a.key === "TelemetryDistance")?.value || "Premium Data";
      const rFcs = attrs.find((a: any) => a.key === "FcsLabel")?.value || ""; 

      return {
        id: node.id,
        title: rTitle,
        quantity: node.quantity,
        price: Number(node.merchandise.price.amount),
        routeId: rId,
        distance: rDist,
        fcsLabel: rFcs 
      };
    });

    setCartItems(parsedItems);
    setCartCount(parsedItems.reduce((acc: number, item: any) => acc + item.quantity, 0));
  };

  useEffect(() => {
    const hydrateActiveCart = async () => {
      if (!cartId) return;
      try {
        const responseData = await shopifyFetch({
          query: GET_CART_QUERY,
          variables: { cartId: cartId }
        });
        if (responseData?.cart) {
          updateLocalCartState(responseData.cart);
        } else {
          localStorage.removeItem("shopify_cart_id");
          setCartId(null);
        }
      } catch (err) {
        console.error("Failed to restore existing headless cart session:", err);
      }
    };
    hydrateActiveCart();
  }, [cartId]);

  useEffect(() => {
    const syncCartBuyerIdentity = async () => {
      if (!cartId || !accessToken) return;
      try {
        const responseData = await shopifyFetch({
          query: CART_BUYER_IDENTITY_UPDATE_MUTATION,
          variables: { cartId: cartId, buyerIdentity: { customerAccessToken: accessToken } }
        });
        const updatedCart = responseData?.cartBuyerIdentityUpdate?.cart;
        if (updatedCart?.checkoutUrl) {
          setCheckoutUrl(updatedCart.checkoutUrl);
          console.log("🔗 Identity Bridge: Synced checkout token with active Shopify profile.");
        }
      } catch (err) {
        console.error("Handshake Exception binding identity variables to active cart:", err);
      }
    };
    syncCartBuyerIdentity();
  }, [cartId, accessToken]);

  // 🎯 FIX B: Refactor mutation response logic to return the live checkoutUrl string
  const addRouteToCart = async (variantId: string, routeId: string, title: string, distance: string, fcsLabel: string): Promise<string | null> => {
    setIsLoading(true);
    
    const lineItemInput = {
      merchandiseId: variantId,
      quantity: 1,
      attributes: [
        { key: "SelectedRouteID", value: routeId },
        { key: "RouteTitle", value: title },
        { key: "TelemetryDistance", value: distance },
        { key: "FcsLabel", value: fcsLabel } 
      ]
    };

    let responseData: any = null;

    if (cartId) {
      responseData = await shopifyFetch({
        query: CART_LINES_ADD_MUTATION,
        variables: { cartId: cartId, lines: [lineItemInput] }
      });
    } else {
      const cartInputParameters: any = { lines: [lineItemInput] };
      if (accessToken) {
        cartInputParameters.buyerIdentity = { customerAccessToken: accessToken };
      }
      responseData = await shopifyFetch({
        query: CART_CREATE_MUTATION,
        variables: { input: cartInputParameters }
      });
    }

    const cart = responseData?.cartCreate?.cart || responseData?.cartLinesAdd?.cart;
    const errors = responseData?.cartCreate?.userErrors || responseData?.cartLinesAdd?.userErrors;

    if (cart) {
      localStorage.setItem("shopify_cart_id", cart.id);
      setCartId(cart.id);
      updateLocalCartState(cart);
      setIsLoading(false);
      return cart.checkoutUrl; // 🎯 Return raw string directly
    }

    console.error("Shopify Storefront Cart Mutation rejected:", errors);
    setIsLoading(false);
    return null;
  };

  // 🎯 FIX C: Refactor item deletion mutation to pass back the updated checkoutUrl string
  const removeCartItem = async (lineId: string): Promise<string | null> => {
    if (!cartId) return null;
    setIsLoading(true);

    try {
      const responseData = await shopifyFetch({
        query: CART_LINES_REMOVE_MUTATION,
        variables: { cartId: cartId, lineIds: [lineId] }
      });

      const cart = responseData?.cartLinesRemove?.cart;
      const errors = responseData?.cartLinesRemove?.userErrors;

      if (cart) {
        updateLocalCartState(cart);
        setIsLoading(false);
        return cart.checkoutUrl; // 🎯 Return updated url string directly
      }
      console.error("Shopify Storefront Cart Line Removal rejected:", errors);
    } catch (err) {
      console.error("Exception thrown inside line extraction workflow thread:", err);
    }

    setIsLoading(false);
    return null;
  };

  return (
    <ShopifyCartContext.Provider value={{ cartItems, cartCount, cartSubtotal, checkoutUrl, isCartOpen, setIsCartOpen, addRouteToCart, removeCartItem, isLoading }}>
      {children}
    </ShopifyCartContext.Provider>
  );
};

export const useShopifyCart = () => {
  const context = useContext(ShopifyCartContext);
  if (!context) throw new Error("useShopifyCart must be utilized inside a protected ShopifyCartProvider wrapper node.");
  return context;
};