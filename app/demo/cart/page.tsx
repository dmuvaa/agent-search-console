import { Suspense } from "react";
import { CartView } from "@/components/demo/cart-view";

export default function CartPage() {
  return (
    <Suspense fallback={<p>Loading cart…</p>}>
      <CartView />
    </Suspense>
  );
}
