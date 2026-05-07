export interface ManagementSummarySectionItem {
  id: string;
  label: string;
  description?: string;
  /** If false, shown in UI but disabled (future PDF modules). */
  exportable: boolean;
}

export interface ManagementSummarySectionGroup {
  pageHref: string;
  pageLabel: string;
  sections: ManagementSummarySectionItem[];
}
