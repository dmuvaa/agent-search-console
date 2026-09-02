import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AddToCartButton } from "@/components/demo/add-to-cart";
import { withWebmcp } from "@/lib/demo/urls";
import { availabilityLabel, formatPrice, getProduct } from "@/lib/demo/catalog";
import { parseWebmcpHeader } from "@/lib/demo/webmcp-mode";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const mode = parseWebmcpHeader((await headers()).get("x-novashop-webmcp"));
  const { id } = await params;
  const product = getProduct(id);
  if (!product) notFound();

  return (
    <main className="grid gap-8 lg:grid-cols-2">
      <div className="aspect-square rounded-2xl border border-stone-300" style={{ background: product.color }} />
      <div>
        <p className="text-sm uppercase tracking-wide text-stone-500">{product.category}</p>
        <h1 className="mt-2 text-4xl font-semibold text-stone-950">{product.name}</h1>
        <p className="mt-4 text-lg text-stone-700">{product.description}</p>
        <p className="mt-6 text-2xl font-semibold">{formatPrice(product.price)}</p>
        <p className="mt-1 text-sm text-stone-600">
          {product.rating} ★ ({product.reviews} reviews) · {availabilityLabel(product.availability)}
        </p>
        <ul className="mt-6 space-y-1 text-sm text-stone-700">
          {product.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
        <dl className="mt-6 grid grid-cols-2 gap-2 text-sm">
          {Object.entries(product.specs).map(([key, value]) => (
            <div key={key} className="rounded-md border border-stone-300 bg-white px-3 py-2">
              <dt className="text-stone-500">{key}</dt>
              <dd className="font-medium text-stone-950">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <AddToCartButton id={product.id} disabled={product.availability === "out_of_stock"} />
          <Link href={withWebmcp(`/demo/compare?ids=${product.id}`, mode)} className="text-sm underline">
            Compare
          </Link>
        </div>
      </div>
    </main>
  );
}
