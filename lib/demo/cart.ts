const KEY = "novashop.cart.v1";

export interface CartItem {
  id: string;
  quantity: number;
}

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as CartItem[];
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("novashop-cart"));
}

export function addToCart(id: string, quantity = 1) {
  const items = readCart();
  const existing = items.find((item) => item.id === id);
  if (existing) existing.quantity += quantity;
  else items.push({ id, quantity });
  writeCart(items);
  return items;
}

export function setQuantity(id: string, quantity: number) {
  const items = readCart().filter((item) => item.id !== id || quantity > 0);
  const next = items.map((item) => (item.id === id ? { ...item, quantity } : item));
  writeCart(next.filter((item) => item.quantity > 0));
  return readCart();
}

export function clearCart() {
  writeCart([]);
}
