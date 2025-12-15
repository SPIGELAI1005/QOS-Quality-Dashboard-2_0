"use client";

import { useState, useEffect } from "react";
import { DashboardClient } from "../dashboard/dashboard-client";
import type { MonthlySiteKpi } from "@/lib/domain/types";

export function SupplierPPMGlobalClient() {
  const [monthlySiteKpis, setMonthlySiteKpis] = useState<MonthlySiteKpi[]>([]);
  const [globalPpm, setGlobalPpm] = useState<{ customerPpm: number | null; supplierPpm: number | null } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedKpis = localStorage.getItem('qos-et-kpis');
      const storedPpm = localStorage.getItem('qos-et-global-ppm');
      
      if (storedKpis) {
        try {
          const parsed = JSON.parse(storedKpis);
          setMonthlySiteKpis(parsed);
        } catch (e) {
          console.error('Failed to parse stored KPIs:', e);
        }
      }
      
      if (storedPpm) {
        try {
          const parsed = JSON.parse(storedPpm);
          setGlobalPpm(parsed);
        } catch (e) {
          console.error('Failed to parse stored PPM:', e);
        }
      }
    }
  }, []);

  return (
    <DashboardClient
      monthlySiteKpis={monthlySiteKpis}
      globalPpm={globalPpm || undefined}
      viewMode="supplier"
    />
  );
}

