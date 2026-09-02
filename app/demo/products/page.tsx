import { headers } from "next/headers";
import { ProductCard } from "@/components/demo/product-card";
import { categories, filterProducts } from "@/lib/demo/catalog";
import { withWebmcp } from "@/lib/demo/urls";
import { parseWebmcpHeader } from "@/lib/demo/webmcp-mode";
import Link from "next/link";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const mode = parseWebmcpHeader((await headers()).get("x-novashop-webmcp"));
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const category = typeof params.category === "string" ? params.category : "";
  const maxPrice = typeof params.maxPrice === "string" ? Number(params.maxPrice) : undefined;
  const minRam = typeof params.minRam === "string" ? Number(params.minRam) : undefined;
  const minRating = typeof params.minRating === "string" ? Number(params.minRating) : undefined;

  const list = filterProducts({
    query: q,
    category,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
    minRam: Number.isFinite(minRam) ? minRam : undefined,
    minRating: Number.isFinite(minRating) ? minRating : undefined,
  });

  return (
    <main>
      <h1 className="text-3xl font-semibold text-stone-950">Products</h1>
      <form
        className="mt-6 grid gap-3 rounded-xl border border-stone-300 bg-white p-4 sm:grid-cols-5"
        method="get"
        toolname={mode === "full" ? "filter_products" : undefined}
        tooldescription={mode === "full" ? "Filter the product catalog" : undefined}
      >
        {mode !== "off" ? <input type="hidden" name="webmcp" value={mode} /> : null}
        <label className="text-sm">
          Search
          <input name="q" defaultValue={q} className="mt-1 w-full rounded-md border border-stone-300 px-2 py-1" />
        </label>
        <label className="text-sm">
          Category
          <select name="category" defaultValue={category} className="mt-1 w-full rounded-md border border-stone-300 px-2 py-1">
            <option value="">Any</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Max price
          <input name="maxPrice" type="number" defaultValue={params.maxPrice ?? ""} className="mt-1 w-full rounded-md border border-stone-300 px-2 py-1" />
        </label>
        <label className="text-sm">
          Min RAM (GB)
          <input name="minRam" type="number" defaultValue={params.minRam ?? ""} className="mt-1 w-full rounded-md border border-stone-300 px-2 py-1" />
        </label>
        <button className="self-end rounded-md bg-stone-900 px-3 py-2 text-sm text-white">Apply filters</button>
      </form>
      <p className="mt-4 text-sm text-stone-600">{list.length} products</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((product) => (
          <ProductCard key={product.id} product={product} mode={mode} />
        ))}
      </div>
      <p className="mt-8 text-sm">
        <Link href={withWebmcp("/demo/compare", mode)} className="underline">
          Compare selected products
        </Link>
      </p>
    </main>
  );
}
