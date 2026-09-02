"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getProduct, formatPrice } from "@/lib/demo/catalog";
import { readCart, setQuantity, type CartItem } from "@/lib/demo/cart";
import { withWebmcp } from "@/lib/demo/urls";
import { parseWebmcpParam } from "@/lib/demo/webmcp-mode";

export function CartView() {
  const mode = parseWebmcpParam(useSearchParams().get("webmcp"));
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(readCart());
    sync();
    window.addEventListener("novashop-cart", sync);
    return () => window.removeEventListener("novashop-cart", sync);
  }, []);

  const rows = items
    .map((item) => {
      const product = getProduct(item.id);
      if (!product) return null;
      return { product, quantity: item.quantity, line: product.price * item.quantity };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));
  const total = rows.reduce((sum, row) => sum + row.line, 0);

  return (
    <main>
      <h1 className="text-3xl font-semibold text-stone-950">Cart</h1>
      {rows.length === 0 ? (
        <p className="mt-4 text-stone-700">Your cart is empty.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((row) => (
            <li key={row.product.id} className="flex items-center justify-between rounded-xl border border-stone-300 bg-white p-4">
              <div>
                <Link href={withWebmcp(`/demo/products/${row.product.id}`, mode)} className="font-medium underline">
                  {row.product.name}
                </Link>
                <p className="text-sm text-stone-600">{formatPrice(row.product.price)}</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm">
                  Qty
                  <input
                    type="number"
                    min={0}
                    value={row.quantity}
                    onChange={(event) => setQuantity(row.product.id, Number(event.target.value))}
                    className="ml-2 w-16 rounded border border-stone-300 px-2 py-1"
                  />
                </label>
                <span className="font-medium">{formatPrice(row.line)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 text-lg font-semibold">Total {formatPrice(total)}</p>
      <Link
        href={withWebmcp("/demo/checkout", mode)}
        className="mt-4 inline-flex rounded-full bg-stone-900 px-5 py-2 text-sm text-white"
      >
        Prepare checkout
      </Link>
    </main>
  );
}
