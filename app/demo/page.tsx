import { headers } from "next/headers";
import Link from "next/link";
import { ProductCard } from "@/components/demo/product-card";
import { withWebmcp } from "@/lib/demo/urls";
import { products } from "@/lib/demo/catalog";
import { parseWebmcpHeader } from "@/lib/demo/webmcp-mode";

export default async function DemoHome() {
  const mode = parseWebmcpHeader((await headers()).get("x-novashop-webmcp"));
  const featured = products.slice(0, 8);
  const searchOn = mode !== "off";

  return (
    <main>
      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-amber-800">Fictional demo store</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950">
            Gear that stays out of the way.
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-stone-700">
            NovaShop is a fake electronics catalog we built for this hackathon so the before/after demo is under our control. It is not a real retailer. People can still browse, search, and add to a cart. Use the header to stage WebMCP: off (no tools), partial (search and get product), or full (filter, compare, cart, checkout prep).
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={withWebmcp("/demo/products", mode)}
              className="rounded-full bg-stone-900 px-5 py-2 text-sm text-white"
            >
              Browse products
            </Link>
            <form
              action={withWebmcp("/demo/products", mode)}
              method="get"
              className="flex gap-2"
              {...(searchOn
                ? { toolname: "search_products", tooldescription: "Search the product catalog" }
                : {})}
            >
              {searchOn ? <input type="hidden" name="webmcp" value={mode} /> : null}
              <label className="sr-only" htmlFor="q">
                Search products
              </label>
              <input
                id="q"
                name="q"
                placeholder="Try 16GB laptop"
                className="h-10 rounded-full border border-stone-400 bg-white px-4 text-sm text-stone-900"
              />
              <button className="h-10 rounded-full border border-stone-400 px-4 text-sm" type="submit">
                Search
              </button>
            </form>
          </div>
        </div>
        <aside className="rounded-2xl border border-stone-300 bg-white p-5 text-sm text-stone-700">
          <p className="font-medium text-stone-950">Hackathon demo</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>Leave WebMCP off and analyze this URL. Typical score: 51.</li>
            <li>Switch to Partial — search and get product only. Typical score: 79.</li>
            <li>
              Switch to Full and analyze <code className="font-mono">?webmcp=full</code> (or <code className="font-mono">?webmcp=on</code>). Typical score: 99.
            </li>
            <li>Ask an agent to find laptops under $1,000 with 16GB RAM.</li>
          </ol>
        </aside>
      </section>
      <section className="mt-12">
        <h2 className="text-xl font-medium text-stone-950">Featured</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} mode={mode} />
          ))}
        </div>
      </section>
    </main>
  );
}
