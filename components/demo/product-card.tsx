import Link from "next/link";
import type { Product } from "@/lib/demo/catalog";
import { availabilityLabel, formatPrice } from "@/lib/demo/catalog";
import { withWebmcp } from "@/lib/demo/urls";
import type { DemoWebmcpMode } from "@/lib/demo/webmcp-mode";

export function ProductCard({ product, mode }: { product: Product; mode: DemoWebmcpMode }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-stone-300 bg-white">
      <Link href={withWebmcp(`/demo/products/${product.id}`, mode)} className="block">
        <div className="aspect-[4/3]" style={{ background: product.color }} />
        <div className="p-4">
          <p className="text-xs uppercase tracking-wide text-stone-500">{product.category}</p>
          <h2 className="mt-1 text-lg font-medium text-stone-950">{product.name}</h2>
          <p className="mt-2 line-clamp-2 text-sm text-stone-600">{product.description}</p>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="font-semibold text-stone-950">{formatPrice(product.price)}</span>
            <span className="text-stone-600">
              {product.rating} ★ · {availabilityLabel(product.availability)}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
