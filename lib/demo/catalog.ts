import catalog from "@/data/products.json";

export type ProductCategory =
  | "laptops"
  | "headphones"
  | "monitors"
  | "keyboards"
  | "cameras";

export type Availability = "in_stock" | "low_stock" | "out_of_stock";

export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  rating: number;
  reviews: number;
  availability: Availability;
  features: string[];
  specs: Record<string, string>;
  color: string;
}

export const products = catalog as unknown as Product[];
export const categories: ProductCategory[] = [
  "laptops",
  "headphones",
  "monitors",
  "keyboards",
  "cameras",
];

export function ramGigabytes(product: Product): number | null {
  const raw = product.specs.ram ?? product.features.find((f) => /ram/i.test(f));
  if (!raw) return null;
  const match = raw.match(/(\d+)\s*GB/i);
  return match ? Number(match[1]) : null;
}

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return products;
  return products.filter((p) => {
    const hay = [
      p.name,
      p.description,
      p.category,
      ...p.features,
      ...Object.values(p.specs),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export interface ProductFilters {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  minRam?: number;
  availability?: Availability;
}

export function filterProducts(filters: ProductFilters): Product[] {
  let list = filters.query ? searchProducts(filters.query) : [...products];
  if (filters.category) {
    list = list.filter((p) => p.category === filters.category);
  }
  if (typeof filters.minPrice === "number") {
    list = list.filter((p) => p.price >= filters.minPrice!);
  }
  if (typeof filters.maxPrice === "number") {
    list = list.filter((p) => p.price <= filters.maxPrice!);
  }
  if (typeof filters.minRating === "number") {
    list = list.filter((p) => p.rating >= filters.minRating!);
  }
  if (typeof filters.minRam === "number") {
    list = list.filter((p) => {
      const ram = ramGigabytes(p);
      return ram !== null && ram >= filters.minRam!;
    });
  }
  if (filters.availability) {
    list = list.filter((p) => p.availability === filters.availability);
  }
  return list;
}

export function compareProducts(ids: string[]) {
  const selected = ids
    .map((id) => getProduct(id))
    .filter((p): p is Product => Boolean(p));
  return selected;
}

export function summarizeProduct(product: Product) {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
    rating: product.rating,
    availability: product.availability,
    features: product.features,
    specs: product.specs,
  };
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function availabilityLabel(value: Availability) {
  if (value === "in_stock") return "In stock";
  if (value === "low_stock") return "Low stock";
  return "Out of stock";
}
