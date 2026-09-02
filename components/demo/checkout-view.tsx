"use client";

import { useSyncExternalStore } from "react";
import { formatPrice, getProduct } from "@/lib/demo/catalog";
import { readCart } from "@/lib/demo/cart";

function totalsFromCart() {
  const items = readCart();
  return {
    count: items.reduce((n, item) => n + item.quantity, 0),
    total: items.reduce((sum, item) => {
      const product = getProduct(item.id);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0),
  };
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("novashop-cart", onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener("novashop-cart", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

const emptyTotals = { count: 0, total: 0 };

export function CheckoutView() {
  const { count, total } = useSyncExternalStore(subscribe, totalsFromCart, () => emptyTotals);

  return (
    <main className="max-w-xl">
      <h1 className="text-3xl font-semibold text-stone-950">Checkout</h1>
      <p className="mt-4 text-stone-700">
        {count} items · {formatPrice(total)}. Payment is not collected here. A person has to confirm any purchase.
      </p>
      <div className="mt-6 rounded-xl border border-stone-300 bg-white p-5">
        <p className="font-medium text-stone-950">Ready for human review</p>
        <p className="mt-2 text-sm text-stone-600">
          Agents may call <code className="font-mono">prepare_checkout</code>. They cannot place the order.
        </p>
        <button type="button" className="mt-4 rounded-full bg-stone-900 px-5 py-2 text-sm text-white">
          Pay as a human
        </button>
      </div>
    </main>
  );
}
