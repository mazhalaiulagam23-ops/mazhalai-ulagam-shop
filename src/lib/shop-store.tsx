import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { products, type Product } from "@/data/catalog";

export type CartLine = { slug: string; qty: number };

type ShopState = {
  cart: CartLine[];
  wishlist: string[];
  addToCart: (slug: string, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  removeFromCart: (slug: string) => void;
  clearCart: () => void;
  toggleWishlist: (slug: string) => void;
  inWishlist: (slug: string) => boolean;
  compare: string[];
  toggleCompare: (slug: string) => boolean;
  inCompare: (slug: string) => boolean;
  clearCompare: () => void;
  cartCount: number;
  cartItems: { product: Product; qty: number }[];
  subtotal: number;
};

const ShopContext = createContext<ShopState | null>(null);

const read = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [compare, setCompare] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCart(read<CartLine[]>("mu_cart", []));
    setWishlist(read<string[]>("mu_wishlist", []));
    setCompare(read<string[]>("mu_compare", []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem("mu_cart", JSON.stringify(cart));
  }, [cart, hydrated]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem("mu_wishlist", JSON.stringify(wishlist));
  }, [wishlist, hydrated]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem("mu_compare", JSON.stringify(compare));
  }, [compare, hydrated]);

  const addToCart = useCallback((slug: string, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.slug === slug);
      if (existing) return prev.map((l) => (l.slug === slug ? { ...l, qty: l.qty + qty } : l));
      return [...prev, { slug, qty }];
    });
  }, []);

  const setQty = useCallback((slug: string, qty: number) => {
    setCart((prev) =>
      qty <= 0 ? prev.filter((l) => l.slug !== slug) : prev.map((l) => (l.slug === slug ? { ...l, qty } : l)),
    );
  }, []);

  const removeFromCart = useCallback((slug: string) => {
    setCart((prev) => prev.filter((l) => l.slug !== slug));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback((slug: string) => {
    setWishlist((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }, []);

  /** Returns false when the compare tray is already full (max 4). */
  const toggleCompare = useCallback((slug: string) => {
    let ok = true;
    setCompare((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= 4) {
        ok = false;
        return prev;
      }
      return [...prev, slug];
    });
    return ok;
  }, []);

  const clearCompare = useCallback(() => setCompare([]), []);

  const value = useMemo<ShopState>(() => {
    const cartItems = cart
      .map((line) => {
        const product = products.find((p) => p.slug === line.slug);
        return product ? { product, qty: line.qty } : null;
      })
      .filter(Boolean) as { product: Product; qty: number }[];

    return {
      cart,
      wishlist,
      addToCart,
      setQty,
      removeFromCart,
      clearCart,
      toggleWishlist,
      inWishlist: (slug: string) => wishlist.includes(slug),
      compare,
      toggleCompare,
      inCompare: (slug: string) => compare.includes(slug),
      clearCompare,
      cartCount: cart.reduce((n, l) => n + l.qty, 0),
      cartItems,
      subtotal: cartItems.reduce((sum, i) => sum + i.product.price * i.qty, 0),
    };
  }, [
    cart,
    wishlist,
    compare,
    addToCart,
    setQty,
    removeFromCart,
    clearCart,
    toggleWishlist,
    toggleCompare,
    clearCompare,
  ]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside ShopProvider");
  return ctx;
}

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
