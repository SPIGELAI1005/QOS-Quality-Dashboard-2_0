import type { ManagementSummarySectionGroup } from "./section-catalog.types";

export type { ManagementSummarySectionItem, ManagementSummarySectionGroup } from "./section-catalog.types";

/**
 * Grouped checklist mirroring app areas. Only `exportable` sections are included in the generated PDF today.
 */
export const MANAGEMENT_SUMMARY_SECTION_GROUPS: ManagementSummarySectionGroup[] = [
  {
    pageHref: "/dashboard",
    pageLabel: "QOS ET Dashboard",
    sections: [
      {
        id: "executive",
        label: "Executive overview",
        description: "KPI cards (customer & supplier) and executive context table.",
        exportable: true,
      },
      {
        id: "chart-notifications-month",
        label: "Notifications by month and plant",
        description: "Bar chart — total notifications by month (rolling view).",
        exportable: true,
      },
      {
        id: "chart-defects-month",
        label: "Defective parts by month and plant",
        description: "Bar chart — defective parts by month.",
        exportable: true,
      },
      {
        id: "chart-notifications-type",
        label: "Notifications by type (Q1 / Q2 / Q3)",
        description: "Bar chart — notifications by notification type over time.",
        exportable: true,
      },
      {
        id: "customer-ppm",
        label: "Customer PPM — trend, monthly table, site contribution",
        description: "Full customer PPM page in the PDF.",
        exportable: true,
      },
      {
        id: "supplier-ppm",
        label: "Supplier PPM — trend, monthly table, site contribution",
        description: "Full supplier PPM page in the PDF.",
        exportable: true,
      },
      {
        id: "plant-pages",
        label: "Plant-specific pages (one page per selected plant)",
        description: "Includes plant-level notifications, defects, and PPM trend plus optional plant remarks.",
        exportable: true,
      },
    ],
  },
  {
    pageHref: "/customer-ppm-global",
    pageLabel: "Customer performance (global)",
    sections: [
      {
        id: "customer-global-charts",
        label: "Global customer PPM charts & tables",
        description: "Will be available when this module is wired to PDF export.",
        exportable: false,
      },
    ],
  },
  {
    pageHref: "/supplier-ppm-global",
    pageLabel: "Supplier performance (global)",
    sections: [
      {
        id: "supplier-global-charts",
        label: "Global supplier PPM charts & tables",
        description: "Will be available when this module is wired to PDF export.",
        exportable: false,
      },
    ],
  },
  {
    pageHref: "/cost-poor-quality",
    pageLabel: "Poor quality costs",
    sections: [
      {
        id: "cost-poor-quality-export",
        label: "Cost of poor quality visuals",
        description: "Planned for a future export release.",
        exportable: false,
      },
    ],
  },
  {
    pageHref: "/warranties-costs",
    pageLabel: "Warranties & costs",
    sections: [
      {
        id: "warranties-export",
        label: "Warranty cost charts & tables",
        description: "Planned for a future export release.",
        exportable: false,
      },
    ],
  },
  {
    pageHref: "/complaints",
    pageLabel: "Complaints",
    sections: [
      {
        id: "complaints-export",
        label: "Complaints tables & charts",
        description: "Planned for a future export release.",
        exportable: false,
      },
    ],
  },
  {
    pageHref: "/ai-summary",
    pageLabel: "AI Management Summary",
    sections: [
      {
        id: "ai-summary-export",
        label: "AI narrative block",
        description: "Planned: embed generated AI summary text in the PDF.",
        exportable: false,
      },
    ],
  },
];
