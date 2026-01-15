import { SupplierPPMGlobalClient } from "./supplier-ppm-global-client";

export default function SupplierPPMGlobalPage() {
  // Use client-side dataset (localStorage) so uploads immediately reflect here.
  return <SupplierPPMGlobalClient />;
}

