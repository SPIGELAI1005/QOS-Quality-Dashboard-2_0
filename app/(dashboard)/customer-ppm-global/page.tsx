import { CustomerPPMGlobalClient } from "./customer-ppm-global-client";

export default function CustomerPPMGlobalPage() {
  // Use client-side dataset (localStorage) so uploads immediately reflect here.
  return <CustomerPPMGlobalClient />;
}

