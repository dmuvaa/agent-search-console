"use client";

import { useEffect } from "react";
import { getModelContext } from "@/components/webmcp/runtime";
import { registerToolOptions } from "@/lib/webmcp/agent-access";
import { demoToolsForMode, type DemoWebmcpMode } from "@/lib/demo/webmcp-mode";
import {
  compareProducts,
  filterProducts,
  getProduct,
  searchProducts,
  summarizeProduct,
} from "@/lib/demo/catalog";
import { addToCart, readCart } from "@/lib/demo/cart";

type Input = Record<string, unknown> | undefined;

export function DemoWebmcp({ mode }: { mode: DemoWebmcpMode }) {
  useEffect(() => {
    if (mode === "off") return;
    const ctx = getModelContext();
    if (!ctx) return;
    const controller = new AbortController();

    const handlers: Record<string, (input?: Input) => unknown> = {
      search_products: (input) => {
        const query = String(input?.query || "");
        return searchProducts(query).map(summarizeProduct);
      },
      filter_products: (input) => {
        return filterProducts({
          query: input?.query ? String(input.query) : undefined,
          category: input?.category ? String(input.category) : undefined,
          minPrice: typeof input?.minPrice === "number" ? input.minPrice : undefined,
          maxPrice: typeof input?.maxPrice === "number" ? input.maxPrice : undefined,
          minRating: typeof input?.minRating === "number" ? input.minRating : undefined,
          minRam: typeof input?.minRam === "number" ? input.minRam : undefined,
          availability: input?.availability as "in_stock" | "low_stock" | "out_of_stock" | undefined,
        }).map(summarizeProduct);
      },
      get_product: (input) => {
        const product = getProduct(String(input?.id || ""));
        if (!product) return { error: "Product not found" };
        return product;
      },
      compare_products: (input) => {
        const ids = Array.isArray(input?.ids) ? input.ids.map(String) : [];
        return compareProducts(ids).map(summarizeProduct);
      },
      add_to_cart: (input) => {
        const id = String(input?.id || "");
        const quantity = typeof input?.quantity === "number" ? input.quantity : 1;
        const product = getProduct(id);
        if (!product) return { error: "Product not found" };
        if (product.availability === "out_of_stock") return { error: "Out of stock" };
        const cart = addToCart(id, quantity);
        return { ok: true, cart, message: `Added ${product.name} to cart. Purchase is not completed.` };
      },
      prepare_checkout: () => {
        const cart = readCart()
          .map((item) => {
            const product = getProduct(item.id);
            if (!product) return null;
            return { ...summarizeProduct(product), quantity: item.quantity, lineTotal: product.price * item.quantity };
          })
          .filter(Boolean);
        const total = cart.reduce((sum, item) => sum + (item?.lineTotal || 0), 0);
        return {
          cart,
          total,
          currency: "USD",
          message: "Checkout is prepared for human review. Payment is not collected by the agent.",
        };
      },
    };

    for (const tool of demoToolsForMode(mode)) {
      const mutating = tool.name === "add_to_cart";
      void ctx
        .registerTool(
          {
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
            annotations: { readOnlyHint: !mutating },
            execute: (input) => handlers[tool.name](input as Input),
          },
          registerToolOptions(controller.signal),
        )
        .catch(() => {});
    }

    return () => controller.abort();
  }, [mode]);

  return null;
}
