"use client";

import { useState } from "react";
import { addToCart } from "@/lib/demo/cart";

export function AddToCartButton({ id, disabled }: { id: string; disabled?: boolean }) {
  const [message, setMessage] = useState("");

  return (
    <div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          addToCart(id, 1);
          setMessage("Added to cart. Checkout still needs a person.");
        }}
        className="rounded-full bg-stone-900 px-5 py-2 text-sm text-white disabled:opacity-40"
      >
        Add to cart
      </button>
      {message ? <p className="mt-2 text-sm text-stone-600">{message}</p> : null}
    </div>
  );
}
