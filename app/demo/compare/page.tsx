import { headers } from "next/headers";
import Link from "next/link";
import { withWebmcp } from "@/lib/demo/urls";
import { compareProducts, formatPrice } from "@/lib/demo/catalog";
import { parseWebmcpHeader } from "@/lib/demo/webmcp-mode";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const mode = parseWebmcpHeader((await headers()).get("x-novashop-webmcp"));
  const params = await searchParams;
  const ids = typeof params.ids === "string" ? params.ids.split(",").filter(Boolean) : [];
  const selected = compareProducts(ids);

  return (
    <main>
      <h1 className="text-3xl font-semibold text-stone-950">Compare</h1>
      <p className="mt-2 text-stone-600">Pass product ids in the URL, for example <code>?ids=novabook-air-14,pulsebook-16</code>.</p>
      {selected.length === 0 ? (
        <p className="mt-6 text-stone-700">No products selected.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border border-stone-300 bg-white text-sm">
            <thead>
              <tr>
                <th className="border-b border-stone-300 p-3 text-left">Field</th>
                {selected.map((product) => (
                  <th key={product.id} className="border-b border-stone-300 p-3 text-left">
                    <Link href={withWebmcp(`/demo/products/${product.id}`, mode)} className="underline">
                      {product.name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3">Price</td>
                {selected.map((product) => (
                  <td key={product.id} className="p-3">{formatPrice(product.price)}</td>
                ))}
              </tr>
              <tr className="bg-stone-50">
                <td className="p-3">Rating</td>
                {selected.map((product) => (
                  <td key={product.id} className="p-3">{product.rating} ★</td>
                ))}
              </tr>
              <tr>
                <td className="p-3">Availability</td>
                {selected.map((product) => (
                  <td key={product.id} className="p-3">{product.availability}</td>
                ))}
              </tr>
              <tr className="bg-stone-50">
                <td className="p-3">Specs</td>
                {selected.map((product) => (
                  <td key={product.id} className="p-3">
                    {Object.entries(product.specs).map(([k, v]) => (
                      <div key={k}>
                        {k}: {v}
                      </div>
                    ))}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
