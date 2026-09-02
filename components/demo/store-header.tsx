"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { categories } from "@/lib/demo/catalog";
import { readCart } from "@/lib/demo/cart";
import { withWebmcp } from "@/lib/demo/urls";
import { type DemoWebmcpMode } from "@/lib/demo/webmcp-mode";

const MODES: DemoWebmcpMode[] = ["off", "partial", "full"];

export function StoreHeader({ mode }: { mode: DemoWebmcpMode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sync = () => setCount(readCart().reduce((n, item) => n + item.quantity, 0));
    sync();
    window.addEventListener("novashop-cart", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("novashop-cart", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function hrefFor(nextMode: DemoWebmcpMode) {
    const next = new URLSearchParams(searchParams.toString());
    if (nextMode === "off") next.delete("webmcp");
    else next.set("webmcp", nextMode);
    return `${pathname}${next.toString() ? `?${next}` : ""}`;
  }

  return (
    <header className="border-b border-stone-300 bg-[#f4efe6]">
      <p className="border-b border-stone-300 bg-amber-100/80 px-4 py-1.5 text-center text-[11px] text-stone-700">
        Fictional catalog for Agent Search Console. Not a real shop.
      </p>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href={withWebmcp("/demo", mode)} className="font-semibold tracking-tight text-stone-900">
          NovaShop
        </Link>
        <nav className="hidden items-center gap-4 text-sm text-stone-700 sm:flex">
          {categories.map((category) => (
            <Link key={category} href={withWebmcp(`/demo/products?category=${category}`, mode)} className="capitalize hover:text-stone-950">
              {category}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex rounded-full border border-stone-400 p-0.5 text-[11px] font-medium">
            {MODES.map((item) => (
              <Link
                key={item}
                href={hrefFor(item)}
                className={`rounded-full px-2.5 py-1 capitalize ${
                  mode === item ? "bg-stone-900 text-white" : "text-stone-700"
                }`}
              >
                {item}
              </Link>
            ))}
          </div>
          <Link href={withWebmcp("/demo/cart", mode)} className="text-stone-800">
            Cart ({count})
          </Link>
        </div>
      </div>
    </header>
  );
}
