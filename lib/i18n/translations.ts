export type LanguageKey = "en" | "de" | "it";

export interface Translations {
  common: {
    language: string;
    theme: string;
    role: string;
    dark: string;
    light: string;
    reader: string;
    editor: string;
    admin: string;
    cancel: string;
    continue: string;
    close: string;
    save: string;
    delete: string;
    edit: string;
    view: string;
    search: string;
    filter: string;
    clear: string;
    selectAll: string;
    clearSelection: string;
    noData: string;
    loading: string;
    error: string;
    success: string;
    month: string;
    year: string;
    from: string;
    to: string;
    date: string;
    select: string;
    months: string[];
    site: string;
    clickToShowAll: string;
    clickToFilterBy: string;
    resetToShowAll: string;
    resetFilter: string;
    total: string;
    change: string;
    defective: string;
    average: string;
  };
  header: {
    title: string;
    reportDate: string;
  };
  sidebar: {
    dashboard: string;
    aiSummary: string;
    customerSupplierPerformance: string;
    customerPerformance: string;
    supplierPerformance: string;
    costPerformance: string;
    poorQualityCosts: string;
    warrantiesCosts: string;
    internalPerformance: string;
    ppapsOverview: string;
    deviationsOverview: string;
    auditManagement: string;
    uploadData: string;
    dataLineage: string;
    glossary: string;
  };
  dashboard: {
    title: string;
    customerPerformance: string;
    supplierPerformance: string;
    customerSupplierPerformance: string;
    showing12MonthLookback: string;
    ytdCustomerMetrics: string;
    ytdSupplierMetrics: string;
    customerComplaints: string;
    q1Notifications: string;
    customerDeliveries: string;
    partsShipped: string;
    customerPpm: string;
    partsPerMillion: string;
    supplierComplaints: string;
    q2Notifications: string;
    supplierDeliveries: string;
    partsReceived: string;
    supplierPpm: string;
    internalComplaints: string;
    q3Notifications: string;
    totalComplaints: string;
    totalDeliveries: string;
    totalPpm: string;
    costPerformance: string;
    internalPerformance: string;
    customerDefectiveParts: string;
    supplierDefectiveParts: string;
    q1Defective: string;
    q2Defective: string;
    resetToShowAll: string;
    exportToExcel: string;
    clickToGenerateSummary: string;
    customerPpmSiteContribution: string;
    supplierPpmSiteContribution: string;
    defectivePartsBySite: string;
    deliveriesBySite: string;
    siteContribution: string;
    allSites: string;
    ytdTotalNotificationsByMonth: string;
    ytdTotalDefectsByMonth: string;
      customerPpmTrend: string;
      supplierPpmTrend: string;
      monthlyTrend: string;
    };
    aiSummary: {
      title: string;
      subtitle: string;
      noDataMessage: string;
    };
    complaints: {
      title: string;
      subtitle: string;
      noDataMessage: string;
    };
    ppm: {
      title: string;
      subtitle: string;
      noDataMessage: string;
    };
    deviations: {
      title: string;
      subtitle: string;
      noDataMessage: string;
      inProgress: string;
      completed: string;
      pending: string;
    };
    ppaps: {
      title: string;
      subtitle: string;
      noDataMessage: string;
      inProgress: string;
      completed: string;
      pending: string;
    };
    auditManagement: {
      title: string;
      subtitle: string;
      noDataMessage: string;
      auditsByMonth: string;
      auditsClosedVsOpen: string;
      dataSourceMissing: string;
      underConstruction: string;
      dataSourceReference: string;
      auditDataSource: string;
    };
    charts: {
      howToRead: string;
      resetToShowAll: string;
      clickToFilterBy: string;
      notificationsByMonth: {
        title: string;
        titleCustomer: string;
        titleSupplier: string;
        description: string;
        descriptionCustomer: string;
        descriptionSupplier: string;
      };
      defectsByMonth: {
        title: string;
        titleCustomer: string;
        titleSupplier: string;
        description: string;
        descriptionCustomer: string;
        descriptionSupplier: string;
      };
      customerPpmTrend: {
        title: string;
        description: string;
        selectPeriod: string;
        threeMonthsAverage: string;
        sixMonthsAverage: string;
        twelveMonthsAverage: string;
        actualPpm: string;
      };
      supplierPpmTrend: {
        title: string;
        description: string;
      };
      siteContribution: {
        customerTitle: string;
        supplierTitle: string;
        sourceCustomer: string;
        sourceSupplier: string;
        formula: string;
        totalDefectiveParts: string;
        totalDeliveries: string;
        calculatedPpm: string;
      };
      complaints: {
        totalComplaints: string;
        customerComplaints: string;
        supplierComplaints: string;
        complaintsTrend: string;
        monthlyBreakdown: string;
      };
      ppm: {
        trendBySite: string;
        customerAndSupplierTrends: string;
        bySiteAndMonth: string;
        detailedBreakdown: string;
      };
      deviations: {
        notificationsByMonth: string;
        notificationsDescription: string;
        closedVsInProgress: string;
        closedVsInProgressDescription: string;
        closed: string;
      };
      ppaps: {
        notificationsByMonth: string;
        notificationsDescription: string;
        closedVsInProgress: string;
        closedVsInProgressDescription: string;
      };
      filterLabels: {
        notificationType: string;
        customerQ1: string;
        supplierQ2: string;
        internalQ3: string;
        customerAndSupplier: string;
        customerAndInternal: string;
        supplierAndInternal: string;
        defectType: string;
        customerDefects: string;
        supplierDefects: string;
        allTypes: string;
      };
    };
  filterPanel: {
    plant: string;
    quickAccess: string;
    sapP01Sites: string;
    sapPS4Sites: string;
    axSites: string;
    automotiveSites: string;
    aftermarketSites: string;
    individualPlants: string;
    complaintTypes: string;
    customer: string;
    supplier: string;
    internal: string;
    notificationTypes: string;
    customerComplaints: string;
    supplierComplaints: string;
    internalComplaints: string;
    deviations: string;
    ppap: string;
    dateRange: string;
    fromDate: string;
    toDate: string;
    pickDate: string;
    clearAllFilters: string;
    noPlantsAvailable: string;
    uploadDataFirst: string;
  };
  upload: {
    title: string;
    description: string;
    uploadFiles: string;
    enterData: string;
    changeHistory: string;
    accessDenied: string;
    accessDeniedDescription: string;
    switchToEditor: string;
    backToDashboard: string;
    structuredUpload: string;
    structuredUploadDescription: string;
    exportExcel: string;
    complaintsTitle: string;
    complaintsHelp: string;
    deliveriesTitle: string;
    deliveriesHelp: string;
    ppapTitle: string;
    ppapHelp: string;
    deviationsTitle: string;
    deviationsHelp: string;
    auditTitle: string;
    auditHelp: string;
    plantsTitle: string;
    plantsHelp: string;
    uploadButton: string;
    uploading: string;
    filesSelected: string;
    uploadCompleted: string;
    uploadFailed: string;
    usedIn: string;
    recalculateKpis: string;
    recalculateKpisDescription: string;
    calculateKpis: string;
    latestKpiCalculation: string;
    complaints: string;
    deliveries: string;
    siteMonthKpis: string;
    openDashboard: string;
    manualDataEntry: string;
    manualDataEntryDescription: string;
    plant: string;
    cityLocation: string;
    month: string;
    customerComplaintsQ1: string;
    supplierComplaintsQ2: string;
    internalComplaintsQ3: string;
    customerDefectiveParts: string;
    supplierDefectiveParts: string;
    internalDefectiveParts: string;
    outboundDeliveries: string;
    inboundDeliveries: string;
    ppapsInProgress: string;
    ppapsCompleted: string;
    deviationsInProgress: string;
    deviationsCompleted: string;
    deviationsTotalNote: string;
    auditsInternalSystem: string;
    auditsCertification: string;
    auditsProcess: string;
    auditsProduct: string;
    poorQualityCosts: string;
    warrantyCosts: string;
    addEntry: string;
    plantMustBe3Digits: string;
    manualEntries: string;
    showingFirst10: string;
    historyTitle: string;
    historyDescription: string;
    noHistory: string;
    files: string;
    summary: string;
    notes: string;
  };
  roleAccess: {
    selectRole: string;
    chooseRole: string;
    switchRole: string;
    selectRoleDescription: string;
    requiresPassword: string;
    wrongPassword: string;
  };
  home: {
    title: string;
    subtitle: string;
    realTimePpmTracking: string;
    realTimePpmDescription: string;
    comprehensiveAnalysis: string;
    comprehensiveAnalysisDescription: string;
    aiPoweredInsights: string;
    aiPoweredInsightsDescription: string;
    qualityAssurance: string;
    qualityAssuranceDescription: string;
    generateReport: string;
    footerCopyright: string;
    qualityManagementSystem: string;
    login: string;
    loginDescription: string;
  };
  glossary: {
    title: string;
    subtitle: string;
    faqTab: string;
    glossaryTab: string;
    searchPlaceholder: string;
    faqTitle: string;
    faqDescription: string;
    datasetHealth: string;
    datasetHealthDescription: string;
    qmTriangle: string;
    qmTriangleDescription: string;
    qmTriangleTip: string;
    contact: string;
    contactDescription: string;
    issueTitle: string;
    issueTitlePlaceholder: string;
    remark: string;
    remarkPlaceholder: string;
    page: string;
    lastSuccessfulUpload: string;
    downloadDiagnostics: string;
    contactEmail: string;
    improvementIdeas: string;
    improvementIdeasDescription: string;
    ideaTitle: string;
    ideaTitlePlaceholder: string;
    ideaDetails: string;
    ideaDetailsPlaceholder: string;
    sendIdea: string;
    copyLink: string;
    goToUpload: string;
    noSuccessfulUpload: string;
    records: string;
    stale: string;
    ok: string;
    missing: string;
    lastSuccess: string;
    faqsCount: string;
    fullGlossary: string;
    contactSupport: string;
    categories: {
      navigation: string;
      dataSources: string;
      notifications: string;
      metrics: string;
      chartsViews: string;
      ai: string;
      general: string;
    };
    howToReadCharts: {
      title: string;
      description: string;
      notificationsByMonth: {
        title: string;
        description: string;
      };
      defectsByMonth: {
        title: string;
        description: string;
      };
      ppmTrend: {
        title: string;
        description: string;
      };
    };
    term: string;
    definition: string;
    terms: string;
    termsList: {
      navigation: {
        qosEtDashboard: { term: string; definition: string };
        customerPerformance: { term: string; definition: string };
        supplierPerformance: { term: string; definition: string };
        uploadData: { term: string; definition: string };
        dataLineage: { term: string; definition: string };
      };
      dataSources: {
        complaintsExtract: { term: string; definition: string };
        outboundDeliveries: { term: string; definition: string };
        inboundDeliveries: { term: string; definition: string };
        plantMasterData: { term: string; definition: string };
        ppapExtracts: { term: string; definition: string };
        deviationsExtracts: { term: string; definition: string };
      };
      notifications: {
        notificationNumber: { term: string; definition: string };
        notificationType: { term: string; definition: string };
        q1: { term: string; definition: string };
        q2: { term: string; definition: string };
        q3: { term: string; definition: string };
        d1d2d3: { term: string; definition: string };
        p1p2p3: { term: string; definition: string };
        nocoOsno: { term: string; definition: string };
      };
      metrics: {
        ppm: { term: string; definition: string };
        customerPpm: { term: string; definition: string };
        supplierPpm: { term: string; definition: string };
        defectiveParts: { term: string; definition: string };
        deliveries: { term: string; definition: string };
        globalPpm: { term: string; definition: string };
        lookbackWindow: { term: string; definition: string };
      };
      chartsViews: {
        notificationsByMonth: { term: string; definition: string };
        defectsByMonth: { term: string; definition: string };
        legendClickFilter: { term: string; definition: string };
        fixedYAxis: { term: string; definition: string };
      };
      ai: {
        aiSummary: { term: string; definition: string };
        aiManagementSummary: { term: string; definition: string };
        providerApiKey: { term: string; definition: string };
      };
      general: {
        sitePlantCode: { term: string; definition: string };
        uploadHistory: { term: string; definition: string };
        manualEntry: { term: string; definition: string };
      };
    };
    faqs: {
      howToUpload: { q: string; a: string };
      sourceOfTruth: { q: string; a: string };
      customerPpmCalculation: { q: string; a: string };
      supplierPpmCalculation: { q: string; a: string };
      q1q2q3Meaning: { q: string; a: string };
      d1d2d3Meaning: { q: string; a: string };
      p1p2p3Meaning: { q: string; a: string };
      ytdLookback: { q: string; a: string };
      plantFiltering: { q: string; a: string };
      plantNamesEnrichment: { q: string; a: string };
      fixedYAxis: { q: string; a: string };
      aiSummaryError: { q: string; a: string };
      aiSummaryPlantLabels: { q: string; a: string };
      dataLineage: { q: string; a: string };
      reportIssue: { q: string; a: string };
    };
  };
  settings: {
    title: string;
    subtitle: string;
    aiConfigurationTab: string;
    columnMappingsTab: string;
    aiConfiguration: string;
    aiConfigurationDescription: string;
    environmentVariablesRequired: string;
    aiApiKeyDescription: string;
    aiProviderDescription: string;
    aiModelDescription: string;
    apiKeyNote: string;
    columnMappings: string;
    columnMappingsDescription: string;
    complaintFileMappings: string;
    deliveryFileMappings: string;
    commaSeparatedColumnNames: string;
    mappingsConfigured: string;
    saveMappings: string;
    saved: string;
    resetToDefaults: string;
    mappingsSaved: string;
    mappingsNote: string;
  };
}

const translations: Record<LanguageKey, Translations> = {
  en: {
    common: {
      language: "Language",
      theme: "Theme",
      role: "Role",
      dark: "Dark",
      light: "Light",
      reader: "Reader",
      editor: "Editor",
      admin: "Admin",
      cancel: "Cancel",
      continue: "Continue",
      close: "Close",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      view: "View",
      search: "Search",
      filter: "Filter",
      clear: "Clear",
      selectAll: "Select All",
      clearSelection: "Clear Selection",
      noData: "No data available",
      loading: "Loading...",
      error: "Error",
      success: "Success",
      month: "Month",
      year: "Year",
      from: "From",
      to: "To",
      date: "Date",
      select: "Select",
      months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      site: "Site",
      clickToShowAll: "Click to show all plants",
      clickToFilterBy: "Click to filter by",
      resetToShowAll: "Reset to show all plants",
      resetFilter: "Reset Filter",
      total: "TOTAL",
      change: "Change",
      defective: "Defective",
      average: "Average",
    },
    header: {
      title: "QOS ET Quality Report",
      reportDate: "December 2025",
    },
    sidebar: {
      dashboard: "QOS ET Dashboard",
      aiSummary: "AI Management Summary",
      customerSupplierPerformance: "Customer & Supplier Performance",
      customerPerformance: "Customer Performance",
      supplierPerformance: "Supplier Performance",
      costPerformance: "Cost Performance",
      poorQualityCosts: "Poor Quality Costs",
      warrantiesCosts: "Warranties Costs",
      internalPerformance: "Internal Performance",
      ppapsOverview: "PPAPs Overview",
      deviationsOverview: "Deviations Overview",
      auditManagement: "Audit Management",
      uploadData: "Upload Data",
      dataLineage: "Data Lineage",
      glossary: "FAQ & Glossary",
    },
    dashboard: {
      title: "QOS ET Dashboard YTD //",
      customerPerformance: "Customer Performance",
      supplierPerformance: "Supplier Performance",
      customerSupplierPerformance: "Customer + Supplier Performance • Cost Performance • Internal Performance",
      showing12MonthLookback: "Showing 12-month lookback from",
      ytdCustomerMetrics: "YTD Customer Metrics",
      ytdSupplierMetrics: "YTD Supplier Metrics",
      customerComplaints: "Customer Complaints",
      q1Notifications: "Q1 notifications",
      customerDeliveries: "Customer Deliveries",
      partsShipped: "Parts shipped",
      customerPpm: "Customer PPM",
      partsPerMillion: "Parts Per Million",
      supplierComplaints: "Supplier Complaints",
      q2Notifications: "Q2 notifications",
      supplierDeliveries: "Supplier Deliveries",
      partsReceived: "Parts received",
      supplierPpm: "Supplier PPM",
      internalComplaints: "Internal Complaints",
      q3Notifications: "Q3 notifications",
      totalComplaints: "Total Complaints",
      totalDeliveries: "Total Deliveries",
      totalPpm: "Total PPM",
      costPerformance: "Cost Performance",
      internalPerformance: "Internal Performance",
      customerDefectiveParts: "Customer Defective Parts",
      supplierDefectiveParts: "Supplier Defective Parts",
      q1Defective: "Q1 defective",
      q2Defective: "Q2 defective",
      resetToShowAll: "Reset to show all plants",
      exportToExcel: "Export to Excel",
      clickToGenerateSummary: "Click to generate summary",
      customerPpmSiteContribution: "Customer PPM - Site Contribution per Month",
      supplierPpmSiteContribution: "Supplier PPM - Site Contribution per Month",
      defectivePartsBySite: "Defective Parts by Site",
      deliveriesBySite: "Deliveries by Site",
      siteContribution: "(Site contribution)",
      allSites: "All Sites",
      ytdTotalNotificationsByMonth: "YTD Total Number of Notifications by Month and Plant",
      ytdTotalDefectsByMonth: "YTD Total Number of Defects by Month and Plant",
      customerPpmTrend: "Customer PPM Trend",
      supplierPpmTrend: "Supplier PPM Trend",
      monthlyTrend: "Monthly Trend",
    },
    aiSummary: {
      title: "AI Management Summary",
      subtitle: "Intelligent insights and automated quality analysis powered by AI",
      noDataMessage: "No data available. Please upload data from the Upload Data page first.",
    },
    complaints: {
      title: "Number of Complaints (Q)",
      subtitle: "Track customer (Q1), supplier (Q2), and internal (Q3) complaints",
      noDataMessage: "No data available. Please upload data from the Upload Data page first.",
    },
    ppm: {
      title: "PPM (Parts Per Million)",
      subtitle: "Track customer and supplier PPM trends across sites",
      noDataMessage: "No data available. Please upload data from the Upload Data page first.",
    },
    deviations: {
      title: "Deviations Overview",
      subtitle: "Track deviation notifications (D1, D2, D3) by month and status",
      noDataMessage: "No data available. Please upload data from the Upload Data page first.",
      inProgress: "In Progress",
      completed: "Completed",
      pending: "Pending",
    },
    ppaps: {
      title: "PPAPs Overview",
      subtitle: "Track PPAP notifications (P1, P2, P3) by month and status",
      noDataMessage: "No data available. Please upload data from the Upload Data page first.",
      inProgress: "In Progress",
      completed: "Completed",
      pending: "Pending",
    },
    auditManagement: {
      title: "Audit Management YTD //",
      subtitle: "Track audit metrics across sites",
      noDataMessage: "No data available. Please upload data from the Upload Data page first.",
      auditsByMonth: "YTD Audits by Month and Plant",
      auditsClosedVsOpen: "YTD Audit Findings Closed vs. Open by Month and Plant",
      dataSourceMissing: "Data Source Missing (Under Construction)",
      underConstruction: "Placeholder until audit data source is connected",
      dataSourceReference: "Data Source Reference",
      auditDataSource: "Audit Data Source",
    },
    settings: {
      title: "Settings",
      subtitle: "Configure application settings and preferences",
      aiConfigurationTab: "AI Configuration",
      columnMappingsTab: "Column Mappings",
      aiConfiguration: "AI Configuration",
      aiConfigurationDescription: "Configure AI insights API keys (set in environment variables)",
      environmentVariablesRequired: "Environment Variables Required:",
      aiApiKeyDescription: "Your LLM API key",
      aiProviderDescription: "\"openai\" or \"anthropic\" (optional, defaults to \"openai\")",
      aiModelDescription: "Model name override (optional)",
      apiKeyNote: "Note: API keys are configured server-side in .env.local for security.",
      columnMappings: "Column Mappings",
      columnMappingsDescription: "Customize how Excel column names map to internal fields",
      complaintFileMappings: "Complaint File Mappings",
      deliveryFileMappings: "Delivery File Mappings",
      commaSeparatedColumnNames: "Comma-separated column names",
      mappingsConfigured: "mapping(s) configured",
      saveMappings: "Save Mappings",
      saved: "Saved!",
      resetToDefaults: "Reset to Defaults",
      mappingsSaved: "Mappings saved!",
      mappingsNote: "Note: Custom mappings are currently stored in browser memory. Full persistence coming soon.",
    },
    charts: {
      howToRead: "How to read this chart",
      resetToShowAll: "Reset to show all plants",
      clickToFilterBy: "Click to filter by",
      notificationsByMonth: {
        title: "YTD Total Number of Notifications by Month and Plant",
        titleCustomer: "YTD Total Number of Customer Notifications by Month and Plant",
        titleSupplier: "YTD Total Number of Supplier Notifications by Month and Plant",
        description: "Number of complaints by month and plant",
        descriptionCustomer: "Number of customer complaints (Q1) by month and plant",
        descriptionSupplier: "Number of supplier complaints (Q2) by month and plant",
      },
      defectsByMonth: {
        title: "YTD Total Number of Defects by Month and Plant",
        titleCustomer: "YTD Total Number of Customer Defects by Month and Plant",
        titleSupplier: "YTD Total Number of Supplier Defects by Month and Plant",
        description: "Number of defective parts by month and plant",
        descriptionCustomer: "Number of customer defective parts by month and plant",
        descriptionSupplier: "Number of supplier defective parts by month and plant",
      },
      customerPpmTrend: {
        title: "YTD Cumulative Customer PPM Trend - All Sites",
        description: "Combined Customer PPM performance (PPM = Defective Parts / Total Deliveries × 1,000,000)",
        selectPeriod: "Select period",
        threeMonthsAverage: "3-Months Average Trend",
        sixMonthsAverage: "6-Months Average Trend",
        twelveMonthsAverage: "12-Months Average Trend",
        actualPpm: "Actual PPM",
      },
      supplierPpmTrend: {
        title: "YTD Cumulative Supplier PPM Trend - All Sites",
        description: "Combined Supplier PPM performance (PPM = Defective Parts / Total Deliveries × 1,000,000)",
      },
      siteContribution: {
        customerTitle: "Customer PPM Site Contribution",
        supplierTitle: "Supplier PPM Site Contribution",
        sourceCustomer: "Source: Defective Parts from Q Cockpit (Column AF - Return delivery qty) | Deliveries from Outbound files (Column E - Quantity)",
        sourceSupplier: "Source: Defective Parts from Q Cockpit (Column AF - Return delivery qty) | Deliveries from Inbound files (Column E - Quantity)",
        formula: "Formula: PPM = (Total Defective Parts / Total Deliveries) × 1,000,000",
        totalDefectiveParts: "Total Defective Parts",
        totalDeliveries: "Total Deliveries",
        calculatedPpm: "Calculated PPM",
      },
      complaints: {
        totalComplaints: "Total Complaints",
        customerComplaints: "Customer Complaints (Q1)",
        supplierComplaints: "Supplier Complaints (Q2)",
        complaintsTrend: "Complaints Trend",
        monthlyBreakdown: "Monthly breakdown of Q1, Q2, and Q3 complaints",
      },
      ppm: {
        trendBySite: "PPM Trend by Site",
        customerAndSupplierTrends: "Customer and Supplier PPM trends over time",
        bySiteAndMonth: "PPM by Site and Month",
        detailedBreakdown: "Detailed breakdown of PPM metrics",
      },
      deviations: {
        notificationsByMonth: "YTD D Notifications by Month and Plant",
        notificationsDescription: "Number of deviations by month and plant (stacked)",
        closedVsInProgress: "YTD D Notifications Closed vs. In Progress by Month and Plant",
        closedVsInProgressDescription: "Closed vs. In Progress across all selected plants",
        closed: "Closed",
      },
      ppaps: {
        notificationsByMonth: "YTD P Notifications by Month and Plant",
        notificationsDescription: "Number of PPAP notifications by month and plant (stacked)",
        closedVsInProgress: "YTD P Notifications Closed vs. In Progress by Month and Plant",
        closedVsInProgressDescription: "Closed vs. In Progress across all selected plants",
      },
      filterLabels: {
        notificationType: "Notification Type",
        customerQ1: "Customer Complaints Q1",
        supplierQ2: "Supplier Complaints Q2",
        internalQ3: "Internal Complaints Q3",
        customerAndSupplier: "Customer & Supplier",
        customerAndInternal: "Customer & Internal",
        supplierAndInternal: "Supplier & Internal",
        defectType: "Defect Type",
        customerDefects: "Customer Defects",
        supplierDefects: "Supplier Defects",
        allTypes: "All Types",
      },
    },
    filterPanel: {
      plant: "PLANT",
      quickAccess: "QUICK ACCESS",
      sapP01Sites: "SAP P01 Sites",
      sapPS4Sites: "SAP PS4 Sites",
      axSites: "AX Sites",
      automotiveSites: "Automotive Sites",
      aftermarketSites: "Aftermarket Sites",
      individualPlants: "Individual Plants",
      complaintTypes: "Complaint Types",
      customer: "Customer",
      supplier: "Supplier",
      internal: "Internal",
      notificationTypes: "Notification Types",
      customerComplaints: "Customer Complaints",
      supplierComplaints: "Supplier Complaints",
      internalComplaints: "Internal Complaints",
      deviations: "Deviations",
      ppap: "PPAP",
      dateRange: "Date Range",
      fromDate: "From Date",
      toDate: "To Date",
      pickDate: "Pick a date",
      clearAllFilters: "Clear All Filters",
      noPlantsAvailable: "No plants available.",
      uploadDataFirst: "Upload data first.",
    },
    roleAccess: {
      selectRole: "Select access role",
      chooseRole: "Choose your role to continue.",
      switchRole: "Switch role",
      selectRoleDescription: "Select a role. Editor/Admin require a password.",
      requiresPassword: "Enter password",
      wrongPassword: "Wrong password.",
    },
    home: {
      title: "Empowering Excellence Through",
      subtitle: "Data-Driven Quality Management",
      realTimePpmTracking: "Real-Time\nPPM Tracking",
      realTimePpmDescription: "Monitor Parts Per Million and defects related metrics across all sites with instant updates.",
      comprehensiveAnalysis: "Comprehensive\nAnalysis",
      comprehensiveAnalysisDescription: "Deep insights into customer, supplier, and internal quality performance.",
      aiPoweredInsights: "AI-Powered\nInsights",
      aiPoweredInsightsDescription: "Get actionable recommendations powered by advanced machine data interpretation.",
      qualityAssurance: "Quality\nAI-ssurance",
      qualityAssuranceDescription: "Comprehensive quality control and assurance across all operations using AI.",
      generateReport: "Generate QOS Report ET",
      footerCopyright: "© 2026 QOS ET Report. Driving Excellence in Operations & Quality.",
      qualityManagementSystem: "Quality Management System",
      login: "Log in",
      loginDescription: "Select your role to continue to the report.",
    },
    glossary: {
      title: "FAQ & Glossary",
      subtitle: "Quick answers on navigation and calculations, plus a complete glossary of terms used across the report.",
      faqTab: "FAQ",
      glossaryTab: "Glossary",
      searchPlaceholder: "Search FAQ + Glossary…",
      faqTitle: "Frequently Asked Questions",
      faqDescription: "Focused on navigation, data sources, and how metrics/charts are calculated.",
      datasetHealth: "Dataset Health",
      datasetHealthDescription: "Live status from Upload History. A dataset is considered stale after {{days}} days.",
      qmTriangle: "QM ET Triangle",
      qmTriangleDescription: "How the report is built and structured.",
      qmTriangleTip: "Tip: If a chart looks wrong, check data lineage (sources → parsing → KPIs → charts) and the upload history.",
      contact: "Contact",
      contactDescription: "Open an email with an issue title, remark, and basic context.",
      issueTitle: "Issue title",
      issueTitlePlaceholder: "e.g., Deviations chart shows 0 records",
      remark: "Remark / description",
      remarkPlaceholder: "Steps to reproduce, what you expected, what you saw…",
      page: "Page",
      lastSuccessfulUpload: "Last successful upload",
      downloadDiagnostics: "Download diagnostics JSON",
      contactEmail: "Contact (Email)",
      improvementIdeas: "Improvement Ideas",
      improvementIdeasDescription: "Short form to capture suggestions and send them by email.",
      ideaTitle: "Idea title",
      ideaTitlePlaceholder: "e.g., Add search + deep links across FAQ",
      ideaDetails: "Idea details",
      ideaDetailsPlaceholder: "Describe the improvement and why it helps…",
      sendIdea: "Send Improvement Idea",
      copyLink: "Copy link to this FAQ",
      goToUpload: "Go to Upload Data",
      noSuccessfulUpload: "No successful upload yet",
      records: "Records",
      stale: "Stale",
      ok: "OK",
      missing: "Missing",
      lastSuccess: "Last success",
      faqsCount: "15 FAQs",
      fullGlossary: "Full glossary (no collapsing)",
      contactSupport: "Contact support",
      categories: {
        navigation: "Navigation",
        dataSources: "Data Sources",
        notifications: "Notifications",
        metrics: "Metrics",
        chartsViews: "Charts & Views",
        ai: "AI",
        general: "General",
      },
      howToReadCharts: {
        title: "How to read key charts",
        description: "These anchors are referenced by the \"How to read this chart\" tooltips in the dashboards.",
        notificationsByMonth: {
          title: "YTD Total Number of Notifications by Month and Plant",
          description: "Stacked bars: each color = plant, bar height = total notifications for that month. Clicking a plant in the legend filters only this chart.",
        },
        defectsByMonth: {
          title: "YTD Total Number of Defects by Month and Plant",
          description: "Shows defective parts, split by plant. If the chart offers a defect type selector, it switches Customer vs Supplier defective parts.",
        },
        ppmTrend: {
          title: "YTD Cumulative PPM Trend",
          description: "Line trend of cumulative PPM across the lookback window. PPM uses defective parts as numerator and deliveries as denominator.",
        },
      },
      term: "Term",
      definition: "Definition",
      terms: "terms",
      termsList: {
        navigation: {
          qosEtDashboard: { term: "QOS ET Dashboard", definition: "Main dashboard aggregating customer/supplier/internal metrics and charts across the selected time window." },
          customerPerformance: { term: "Customer Performance", definition: "Customer-only view (Q1 + customer deliveries/PPM) with customer-related charts and tables." },
          supplierPerformance: { term: "Supplier Performance", definition: "Supplier-only view (Q2 + supplier deliveries/PPM) with supplier-related charts and tables." },
          uploadData: { term: "Upload Data", definition: "Structured file upload and manual entry page. Also provides KPI recalculation and change history." },
          dataLineage: { term: "Data Lineage", definition: "Catalog view that maps data sources → processing → outputs → pages/charts." },
        },
        dataSources: {
          complaintsExtract: { term: "Complaints extract (Q Cockpit)", definition: "Excel export containing quality notifications (Q1/Q2/Q3) including defective parts and plant references." },
          outboundDeliveries: { term: "Outbound deliveries files", definition: "Excel extracts containing customer deliveries by plant/date. Used as denominator for Customer PPM." },
          inboundDeliveries: { term: "Inbound deliveries files", definition: "Excel extracts containing supplier deliveries by plant/date. Used as denominator for Supplier PPM." },
          plantMasterData: { term: "Plant master data (Webasto ET Plants)", definition: "Official plant code-to-location mapping used across filters, legends, and AI prompts." },
          ppapExtracts: { term: "PPAP base + status extracts", definition: "Two Excel files: a notification list + a status list used to classify PPAP status." },
          deviationsExtracts: { term: "Deviations base + status extracts", definition: "Two Excel files: a deviation notification list + a status list used to classify deviation status." },
        },
        notifications: {
          notificationNumber: { term: "Notification Number", definition: "Unique identifier for each SAP quality notification." },
          notificationType: { term: "Notification Type", definition: "SAP notification classification: Q1/Q2/Q3 (complaints), D1/D2/D3 (deviations), P1/P2/P3 (PPAP)." },
          q1: { term: "Q1 (Customer Complaint)", definition: "Customer-originated quality notifications; contributes to customer complaints and Customer PPM." },
          q2: { term: "Q2 (Supplier Complaint)", definition: "Supplier-related quality notifications; contributes to supplier complaints and Supplier PPM." },
          q3: { term: "Q3 (Internal Complaint)", definition: "Internal quality notifications; used in internal complaint reporting (e.g., Poor Quality Costs placeholders)." },
          d1d2d3: { term: "D1/D2/D3 (Deviation)", definition: "Deviation notifications representing exceptions or approvals. Reported on Deviations Overview." },
          p1p2p3: { term: "P1/P2/P3 (PPAP)", definition: "PPAP notifications representing approval process states. Reported on PPAPs Overview." },
          nocoOsno: { term: "NOCO / OSNO", definition: "SAP system-status tokens used to infer status (NOCO ≈ Completed, OSNO ≈ In Progress)." },
        },
        metrics: {
          ppm: { term: "PPM (Parts Per Million)", definition: "Quality metric: (Defective Parts / Total Deliveries) × 1,000,000. Lower is better." },
          customerPpm: { term: "Customer PPM", definition: "PPM computed from Q1 defective parts and customer deliveries (Outbound)." },
          supplierPpm: { term: "Supplier PPM", definition: "PPM computed from Q2 defective parts and supplier deliveries (Inbound)." },
          defectiveParts: { term: "Defective Parts", definition: "Quantity of non-conforming parts recorded in a notification. Used in PPM." },
          deliveries: { term: "Deliveries", definition: "Total delivered quantity used as PPM denominator (customer outbound / supplier inbound)." },
          globalPpm: { term: "Global PPM", definition: "Overall PPM aggregated across all selected plants/months." },
          lookbackWindow: { term: "12-month lookback window", definition: "A rolling window ending at the selected month/year used for consistent trend visuals." },
        },
        chartsViews: {
          notificationsByMonth: { term: "YTD Total Number of Notifications by Month and Plant", definition: "Stacked bar chart showing complaint counts per month split by plant." },
          defectsByMonth: { term: "YTD Total Number of Defects by Month and Plant", definition: "Bar chart showing defective parts by month and plant (customer vs supplier)." },
          legendClickFilter: { term: "Legend click filter", definition: "Chart-local filter triggered by clicking a plant badge in the legend; does not affect other charts." },
          fixedYAxis: { term: "Fixed Y-axis domain", definition: "Y-axis max computed from unfiltered data so scale remains stable after local filtering." },
        },
        ai: {
          aiSummary: { term: "AI Summary", definition: "LLM-generated narrative summary of filtered KPIs with trends, risks, and recommended actions." },
          aiManagementSummary: { term: "AI Management Summary", definition: "Central page that summarizes KPIs and highlights anomalies and actions (German number formatting, plant labels included)." },
          providerApiKey: { term: "Provider / API key", definition: "Configured LLM backend (e.g., OpenAI-compatible or Anthropic) used by the AI Summary API route." },
        },
        general: {
          sitePlantCode: { term: "Site / Plant Code", definition: "3-digit code identifying a manufacturing site (e.g., 145, 235, 410). Displayed with city/location when available." },
          uploadHistory: { term: "Upload History", definition: "Persistent log of file uploads/manual entries including timestamps, summaries, and where data is used." },
          manualEntry: { term: "Manual Entry (Template)", definition: "Form-based entry of monthly values per plant. Stored and merged into the KPI dataset for reporting." },
        },
      },
      faqs: {
        howToUpload: {
          q: "How do I upload data?",
          a: "Go to Upload Data. Use the structured upload sections (Complaints, Deliveries, PPAP, Deviations, Plants). After upload, you can calculate KPIs and the report pages will read from the KPI dataset.",
        },
        sourceOfTruth: {
          q: "Which files are the source of truth for complaints and PPM?",
          a: "Complaints and defective parts are taken from the Q Cockpit complaints extract. Deliveries are taken from Outbound (customer deliveries) and Inbound (supplier deliveries) files. PPM is derived from defective parts and deliveries.",
        },
        customerPpmCalculation: {
          q: "How is Customer PPM calculated?",
          a: "Customer PPM = (Customer Defective Parts / Customer Deliveries) × 1,000,000 for the selected plants and time window.",
        },
        supplierPpmCalculation: {
          q: "How is Supplier PPM calculated?",
          a: "Supplier PPM = (Supplier Defective Parts / Supplier Deliveries) × 1,000,000 for the selected plants and time window.",
        },
        q1q2q3Meaning: {
          q: "What do Q1, Q2, and Q3 mean?",
          a: "Q1 = Customer complaints, Q2 = Supplier complaints, Q3 = Internal complaints. They represent different notification categories and drive different charts/metrics.",
        },
        d1d2d3Meaning: {
          q: "What do D1, D2, D3 represent on the Deviations page?",
          a: "D1/D2/D3 are deviation notification types. The Deviations Overview page shows counts by month and plant, and a status view (Closed vs In Progress).",
        },
        p1p2p3Meaning: {
          q: "What do P1, P2, P3 represent on the PPAPs page?",
          a: "P1/P2/P3 are PPAP notification types. The PPAPs Overview page shows PPAP counts by month/plant and a status view (Closed vs In Progress).",
        },
        ytdLookback: {
          q: "Why do charts show a 12-month lookback even when the page says YTD?",
          a: "The selector uses a 12-month lookback ending at the selected month/year to provide a consistent trend window across pages. The page title keeps \"YTD //\" for consistency with the dashboard naming.",
        },
        plantFiltering: {
          q: "How does plant filtering work?",
          a: "The global filter panel (right sidebar) filters most content. Some charts also support local chart-only filtering via clicking on the legend (it affects only that chart).",
        },
        plantNamesEnrichment: {
          q: "Why do some legends show plant code plus city/location?",
          a: "Plant names are enriched from the official Plant Overview file so users can recognize sites by city/location (e.g., \"410 (Fenton)\").",
        },
        fixedYAxis: {
          q: "What does \"Fixed Y-axis scale\" mean on certain charts?",
          a: "When a chart supports local filtering by plant, the Y-axis max is computed from the unfiltered dataset to prevent the scale from changing after selecting a plant.",
        },
        aiSummaryError: {
          q: "Why does the AI Summary sometimes show an error?",
          a: "AI Summary depends on the configured AI provider/key and the current filtered dataset. If the provider rejects the request (API key, rate limit, network), the UI shows a structured explanation and suggested fixes.",
        },
        aiSummaryPlantLabels: {
          q: "Does AI Summary use the same plant labels as the dashboard?",
          a: "Yes. The AI prompt is instructed to mention plant code and city/location when referencing a site, based on the official plant list.",
        },
        dataLineage: {
          q: "What is the Data Lineage page for?",
          a: "It documents which data sources feed which parsers/APIs, what outputs are produced, and where those outputs are used (pages/charts). It also reflects last upload timestamps from Upload History when available.",
        },
        reportIssue: {
          q: "How do I report an issue?",
          a: "Use the Contact button on this page. It opens an email with a template including issue title and helpful context (page, timestamp, last uploads).",
        },
      },
    },
    upload: {
      title: "Upload Data",
      description: "Structured upload + manual entry for the charts and KPI pages.",
      uploadFiles: "Upload Files",
      enterData: "Enter Data (Form)",
      changeHistory: "Change History",
      accessDenied: "Access denied",
      accessDeniedDescription: "Reader mode is read-only. Uploading files or entering data is restricted.",
      switchToEditor: "Please switch to Editor or Admin to upload or modify report data.",
      backToDashboard: "Back to Dashboard",
      structuredUpload: "Structured Upload",
      structuredUploadDescription: "Upload files by category so the correct pages/charts can be built reliably.",
      exportExcel: "Export (Excel)",
      complaintsTitle: "Customer & Supplier Complaints Files",
      complaintsHelp: "Upload complaint notifications (Q1/Q2/Q3). Multiple files supported.",
      deliveriesTitle: "Customer & Supplier Deliveries Files",
      deliveriesHelp: "Upload Outbound* (customer deliveries) and Inbound* (supplier deliveries). Multiple files supported.",
      ppapTitle: "PPAP Notification Files",
      ppapHelp: "Upload PPAP base + status extracts. Multiple files supported.",
      deviationsTitle: "Deviation Notifications Files",
      deviationsHelp: "Upload Deviations base + status extracts. Multiple files supported.",
      auditTitle: "Audit Management Files",
      auditHelp: "Upload audit source files (placeholder until parsing is implemented). Multiple files supported.",
      plantsTitle: "Plant Overview Files",
      plantsHelp: "Upload the official plants list (e.g. Webasto ET Plants .xlsx). Multiple files supported.",
      uploadButton: "Upload",
      uploading: "Uploading…",
      filesSelected: "file(s)",
      uploadCompleted: "Upload completed",
      uploadFailed: "Upload failed",
      usedIn: "Used in:",
      recalculateKpis: "Recalculate KPIs (Complaints + Deliveries)",
      recalculateKpisDescription: "When both categories are uploaded, compute KPIs and update the dashboard dataset.",
      calculateKpis: "Calculate KPIs",
      latestKpiCalculation: "Latest KPI Calculation",
      complaints: "Complaints:",
      deliveries: "Deliveries:",
      siteMonthKpis: "Site-month KPIs:",
      openDashboard: "Open QOS ET Dashboard",
      manualDataEntry: "Manual Data Entry (Template)",
      manualDataEntryDescription: "Enter monthly values per plant. These entries are persisted and merged into the local KPI dataset (`qos-et-kpis`).",
      plant: "Plant (3-digit)",
      cityLocation: "City/Location",
      month: "Month",
      customerComplaintsQ1: "Customer Complaints (Q1)",
      supplierComplaintsQ2: "Supplier Complaints (Q2)",
      internalComplaintsQ3: "Internal Complaints (Q3)",
      customerDefectiveParts: "Customer Defective Parts",
      supplierDefectiveParts: "Supplier Defective Parts",
      internalDefectiveParts: "Internal Defective Parts",
      outboundDeliveries: "Outbound Deliveries (Customer)",
      inboundDeliveries: "Inbound Deliveries (Supplier)",
      ppapsInProgress: "PPAPs In Progress",
      ppapsCompleted: "PPAPs Completed",
      deviationsInProgress: "Deviations In Progress",
      deviationsCompleted: "Deviations Completed",
      deviationsTotalNote: "Deviations total used by KPIs = In Progress + Completed.",
      auditsInternalSystem: "Audits: Internal System",
      auditsCertification: "Audits: Certification",
      auditsProcess: "Audits: Process",
      auditsProduct: "Audits: Product",
      poorQualityCosts: "Poor Quality Costs (template)",
      warrantyCosts: "Warranty Costs (template)",
      addEntry: "Add Entry",
      plantMustBe3Digits: "Plant must be a 3-digit code (e.g., 410).",
      manualEntries: "Manual Entries",
      showingFirst10: "Showing first 10 entries. Export to Excel to view all.",
      historyTitle: "Change History",
      historyDescription: "Every upload and manual entry is logged with timestamp, record counts, and usage references.",
      noHistory: "No history yet.",
      files: "Files:",
      summary: "Summary:",
      notes: "Notes:",
    },
  },
  de: {
    common: {
      language: "Sprache",
      theme: "Design",
      role: "Rolle",
      dark: "Dunkel",
      light: "Hell",
      reader: "Leser",
      editor: "Bearbeiter",
      admin: "Administrator",
      cancel: "Abbrechen",
      continue: "Weiter",
      close: "Schließen",
      save: "Speichern",
      delete: "Löschen",
      edit: "Bearbeiten",
      view: "Ansehen",
      search: "Suchen",
      filter: "Filter",
      clear: "Löschen",
      selectAll: "Alle auswählen",
      clearSelection: "Auswahl löschen",
      noData: "Keine Daten verfügbar",
      loading: "Lädt...",
      error: "Fehler",
      success: "Erfolg",
      month: "Monat",
      year: "Jahr",
      from: "Von",
      to: "Bis",
      date: "Datum",
      select: "Auswählen",
      months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
      site: "Werk",
      clickToShowAll: "Klicken, um alle Werke anzuzeigen",
      clickToFilterBy: "Klicken, um nach",
      resetToShowAll: "Zurücksetzen, um alle Werke anzuzeigen",
      resetFilter: "Filter zurücksetzen",
      total: "GESAMT",
      change: "Änderung",
      defective: "Defekt",
      average: "Durchschnitt",
    },
    header: {
      title: "QOS ET Qualitätsbericht",
      reportDate: "Dezember 2025",
    },
    sidebar: {
      dashboard: "QOS ET Dashboard",
      aiSummary: "KI Management-Zusammenfassung",
      customerSupplierPerformance: "Kunden- & Lieferantenleistung",
      customerPerformance: "Kundenleistung",
      supplierPerformance: "Lieferantenleistung",
      costPerformance: "Kostenleistung",
      poorQualityCosts: "Mangelkosten",
      warrantiesCosts: "Garantiekosten",
      internalPerformance: "Interne Leistung",
      ppapsOverview: "PPAPs Übersicht",
      deviationsOverview: "Abweichungen Übersicht",
      auditManagement: "Audit Management",
      uploadData: "Daten hochladen",
      dataLineage: "Datenherkunft",
      glossary: "FAQ & Glossar",
    },
    dashboard: {
      title: "QOS ET Dashboard JTD //",
      customerPerformance: "Kundenleistung",
      supplierPerformance: "Lieferantenleistung",
      customerSupplierPerformance: "Kunden- + Lieferantenleistung • Kostenleistung • Interne Leistung",
      showing12MonthLookback: "12-Monats-Rückblick ab",
      ytdCustomerMetrics: "JTD Kundenmetriken",
      ytdSupplierMetrics: "JTD Lieferantenmetriken",
      customerComplaints: "Kundenreklamationen",
      q1Notifications: "Q1 Benachrichtigungen",
      customerDeliveries: "Kundenlieferungen",
      partsShipped: "Gelieferte Teile",
      customerPpm: "Kunden-PPM",
      partsPerMillion: "Teile pro Million",
      supplierComplaints: "Lieferantenreklamationen",
      q2Notifications: "Q2 Benachrichtigungen",
      supplierDeliveries: "Lieferanteneingänge",
      partsReceived: "Empfangene Teile",
      supplierPpm: "Lieferanten-PPM",
      internalComplaints: "Interne Reklamationen",
      q3Notifications: "Q3 Benachrichtigungen",
      totalComplaints: "Gesamtreklamationen",
      totalDeliveries: "Gesamtlieferungen",
      totalPpm: "Gesamt-PPM",
      costPerformance: "Kostenleistung",
      internalPerformance: "Interne Leistung",
      customerDefectiveParts: "Kundendefekteile",
      supplierDefectiveParts: "Lieferantendefekteile",
      q1Defective: "Q1 fehlerhaft",
      q2Defective: "Q2 fehlerhaft",
      resetToShowAll: "Zurücksetzen, um alle Werke anzuzeigen",
      exportToExcel: "Nach Excel exportieren",
      clickToGenerateSummary: "Klicken, um Zusammenfassung zu generieren",
      customerPpmSiteContribution: "Kunden-PPM - Werkbeitrag pro Monat",
      supplierPpmSiteContribution: "Lieferanten-PPM - Werkbeitrag pro Monat",
      defectivePartsBySite: "Defekteile nach Werk",
      deliveriesBySite: "Lieferungen nach Werk",
      siteContribution: "(Werkbeitrag)",
      allSites: "Alle Werke",
      ytdTotalNotificationsByMonth: "YTD Gesamtzahl Benachrichtigungen nach Monat und Werk",
      ytdTotalDefectsByMonth: "YTD Gesamtzahl Defekte nach Monat und Werk",
      customerPpmTrend: "Kunden-PPM Trend",
      supplierPpmTrend: "Lieferanten-PPM Trend",
      monthlyTrend: "Monatlicher Trend",
    },
    aiSummary: {
      title: "KI-Management-Zusammenfassung",
      subtitle: "Intelligente Erkenntnisse und automatisierte Qualitätsanalyse mit KI",
      noDataMessage: "Keine Daten verfügbar. Bitte laden Sie zuerst Daten von der Upload-Daten-Seite hoch.",
    },
    complaints: {
      title: "Anzahl der Reklamationen (Q)",
      subtitle: "Verfolgen Sie Kunden- (Q1), Lieferanten- (Q2) und interne (Q3) Reklamationen",
      noDataMessage: "Keine Daten verfügbar. Bitte laden Sie zuerst Daten von der Upload-Daten-Seite hoch.",
    },
    ppm: {
      title: "PPM (Parts Per Million)",
      subtitle: "Verfolgen Sie Kunden- und Lieferanten-PPM-Trends über alle Werke",
      noDataMessage: "Keine Daten verfügbar. Bitte laden Sie zuerst Daten von der Upload-Daten-Seite hoch.",
    },
    deviations: {
      title: "Abweichungen Übersicht",
      subtitle: "Verfolgen Sie Abweichungsbenachrichtigungen (D1, D2, D3) nach Monat und Status",
      noDataMessage: "Keine Daten verfügbar. Bitte laden Sie zuerst Daten von der Upload-Daten-Seite hoch.",
      inProgress: "In Bearbeitung",
      completed: "Abgeschlossen",
      pending: "Ausstehend",
    },
    ppaps: {
      title: "PPAPs Übersicht",
      subtitle: "Verfolgen Sie PPAP-Benachrichtigungen (P1, P2, P3) nach Monat und Status",
      noDataMessage: "Keine Daten verfügbar. Bitte laden Sie zuerst Daten von der Upload-Daten-Seite hoch.",
      inProgress: "In Bearbeitung",
      completed: "Abgeschlossen",
      pending: "Ausstehend",
    },
    auditManagement: {
      title: "Audit-Management JTD //",
      subtitle: "Verfolgen Sie Audit-Metriken über alle Werke",
      noDataMessage: "Keine Daten verfügbar. Bitte laden Sie zuerst Daten von der Upload-Daten-Seite hoch.",
      auditsByMonth: "JTD Audits nach Monat und Werk",
      auditsClosedVsOpen: "JTD Audit-Befunde Abgeschlossen vs. Offen nach Monat und Werk",
      dataSourceMissing: "Datenquelle fehlt (in Bearbeitung)",
      underConstruction: "Platzhalter bis Audit-Datenquelle verbunden ist",
      dataSourceReference: "Datenquellen-Referenz",
      auditDataSource: "Audit-Datenquelle",
    },
    settings: {
      title: "Einstellungen",
      subtitle: "Anwendungseinstellungen und Präferenzen konfigurieren",
      aiConfigurationTab: "KI-Konfiguration",
      columnMappingsTab: "Spalten-Zuordnungen",
      aiConfiguration: "KI-Konfiguration",
      aiConfigurationDescription: "KI-Insights-API-Schlüssel konfigurieren (in Umgebungsvariablen setzen)",
      environmentVariablesRequired: "Erforderliche Umgebungsvariablen:",
      aiApiKeyDescription: "Ihr LLM-API-Schlüssel",
      aiProviderDescription: "\"openai\" oder \"anthropic\" (optional, Standard: \"openai\")",
      aiModelDescription: "Modellname-Überschreibung (optional)",
      apiKeyNote: "Hinweis: API-Schlüssel werden serverseitig in .env.local für die Sicherheit konfiguriert.",
      columnMappings: "Spalten-Zuordnungen",
      columnMappingsDescription: "Anpassen, wie Excel-Spaltennamen internen Feldern zugeordnet werden",
      complaintFileMappings: "Reklamationsdatei-Zuordnungen",
      deliveryFileMappings: "Lieferungsdatei-Zuordnungen",
      commaSeparatedColumnNames: "Durch Komma getrennte Spaltennamen",
      mappingsConfigured: "Zuordnung(en) konfiguriert",
      saveMappings: "Zuordnungen speichern",
      saved: "Gespeichert!",
      resetToDefaults: "Auf Standard zurücksetzen",
      mappingsSaved: "Zuordnungen gespeichert!",
      mappingsNote: "Hinweis: Benutzerdefinierte Zuordnungen werden derzeit im Browser-Speicher gespeichert. Vollständige Persistenz kommt bald.",
    },
    charts: {
      howToRead: "So lesen Sie dieses Diagramm",
      resetToShowAll: "Zurücksetzen, um alle Werke anzuzeigen",
      clickToFilterBy: "Klicken, um nach",
      notificationsByMonth: {
        title: "JTD Gesamtzahl der Benachrichtigungen nach Monat und Werk",
        titleCustomer: "JTD Gesamtzahl der Kundenbenachrichtigungen nach Monat und Werk",
        titleSupplier: "JTD Gesamtzahl der Lieferantenbenachrichtigungen nach Monat und Werk",
        description: "Anzahl der Reklamationen nach Monat und Werk",
        descriptionCustomer: "Anzahl der Kundenreklamationen (Q1) nach Monat und Werk",
        descriptionSupplier: "Anzahl der Lieferantenreklamationen (Q2) nach Monat und Werk",
      },
      defectsByMonth: {
        title: "JTD Gesamtzahl der Defekte nach Monat und Werk",
        titleCustomer: "JTD Gesamtzahl der Kunden-Defekte nach Monat und Werk",
        titleSupplier: "JTD Gesamtzahl der Lieferanten-Defekte nach Monat und Werk",
        description: "Anzahl der fehlerhaften Teile nach Monat und Werk",
        descriptionCustomer: "Anzahl der Kunden-defekten Teile nach Monat und Werk",
        descriptionSupplier: "Anzahl der Lieferanten-defekten Teile nach Monat und Werk",
      },
      customerPpmTrend: {
        title: "JTD kumulativer Kunden-PPM-Trend - Alle Werke",
        description: "Kombinierte Kunden-PPM-Leistung (PPM = Fehlerhafte Teile / Gesamte Lieferungen × 1.000.000)",
        selectPeriod: "Zeitraum auswählen",
        threeMonthsAverage: "3-Monate Durchschnitts-Trend",
        sixMonthsAverage: "6-Monate Durchschnitts-Trend",
        twelveMonthsAverage: "12-Monate Durchschnitts-Trend",
        actualPpm: "Tatsächlicher PPM",
      },
      supplierPpmTrend: {
        title: "JTD kumulativer Lieferanten-PPM-Trend - Alle Werke",
        description: "Kombinierte Lieferanten-PPM-Leistung (PPM = Fehlerhafte Teile / Gesamte Lieferungen × 1.000.000)",
      },
      siteContribution: {
        customerTitle: "Kunden-PPM Werkbeitrag",
        supplierTitle: "Lieferanten-PPM Werkbeitrag",
        sourceCustomer: "Quelle: Fehlerhafte Teile aus Q Cockpit (Spalte AF - Rücksendemenge) | Lieferungen aus Outbound-Dateien (Spalte E - Menge)",
        sourceSupplier: "Quelle: Fehlerhafte Teile aus Q Cockpit (Spalte AF - Rücksendemenge) | Lieferungen aus Inbound-Dateien (Spalte E - Menge)",
        formula: "Formel: PPM = (Gesamte fehlerhafte Teile / Gesamte Lieferungen) × 1.000.000",
        totalDefectiveParts: "Gesamte fehlerhafte Teile",
        totalDeliveries: "Gesamte Lieferungen",
        calculatedPpm: "Berechneter PPM",
      },
      complaints: {
        totalComplaints: "Gesamte Reklamationen",
        customerComplaints: "Kundenreklamationen (Q1)",
        supplierComplaints: "Lieferantenreklamationen (Q2)",
        complaintsTrend: "Reklamations-Trend",
        monthlyBreakdown: "Monatliche Aufschlüsselung von Q1, Q2 und Q3 Reklamationen",
      },
      ppm: {
        trendBySite: "PPM-Trend nach Werk",
        customerAndSupplierTrends: "Kunden- und Lieferanten-PPM-Trends über die Zeit",
        bySiteAndMonth: "PPM nach Werk und Monat",
        detailedBreakdown: "Detaillierte Aufschlüsselung der PPM-Metriken",
      },
      deviations: {
        notificationsByMonth: "JTD D-Benachrichtigungen nach Monat und Werk",
        notificationsDescription: "Anzahl der Abweichungen nach Monat und Werk (gestapelt)",
        closedVsInProgress: "JTD D-Benachrichtigungen Abgeschlossen vs. In Bearbeitung nach Monat und Werk",
        closedVsInProgressDescription: "Abgeschlossen vs. In Bearbeitung über alle ausgewählten Werke",
        closed: "Abgeschlossen",
      },
      ppaps: {
        notificationsByMonth: "JTD P-Benachrichtigungen nach Monat und Werk",
        notificationsDescription: "Anzahl der PPAP-Benachrichtigungen nach Monat und Werk (gestapelt)",
        closedVsInProgress: "JTD P-Benachrichtigungen Abgeschlossen vs. In Bearbeitung nach Monat und Werk",
        closedVsInProgressDescription: "Abgeschlossen vs. In Bearbeitung über alle ausgewählten Werke",
      },
      filterLabels: {
        notificationType: "Benachrichtigungstyp",
        customerQ1: "Kundenreklamationen Q1",
        supplierQ2: "Lieferantenreklamationen Q2",
        internalQ3: "Interne Reklamationen Q3",
        customerAndSupplier: "Kunde & Lieferant",
        customerAndInternal: "Kunde & Intern",
        supplierAndInternal: "Lieferant & Intern",
        defectType: "Defekttyp",
        customerDefects: "Kunden-Defekte",
        supplierDefects: "Lieferanten-Defekte",
        allTypes: "Alle Typen",
      },
    },
    filterPanel: {
      plant: "WERK",
      quickAccess: "SCHNELLZUGRIFF",
      sapP01Sites: "SAP P01 Standorte",
      sapPS4Sites: "SAP PS4 Standorte",
      axSites: "AX Standorte",
      automotiveSites: "Automobilstandorte",
      aftermarketSites: "Aftermarket-Standorte",
      individualPlants: "Einzelne Werke",
      complaintTypes: "Reklamationstypen",
      customer: "Kunde",
      supplier: "Lieferant",
      internal: "Intern",
      notificationTypes: "Benachrichtigungstypen",
      customerComplaints: "Kundenreklamationen",
      supplierComplaints: "Lieferantenreklamationen",
      internalComplaints: "Interne Reklamationen",
      deviations: "Abweichungen",
      ppap: "PPAP",
      dateRange: "Zeitraum",
      fromDate: "Von Datum",
      toDate: "Bis Datum",
      pickDate: "Datum auswählen",
      clearAllFilters: "Alle Filter löschen",
      noPlantsAvailable: "Keine Werke verfügbar.",
      uploadDataFirst: "Bitte zuerst Daten hochladen.",
    },
    roleAccess: {
      selectRole: "Zugriffsrolle auswählen",
      chooseRole: "Wählen Sie Ihre Rolle, um fortzufahren.",
      switchRole: "Rolle wechseln",
      selectRoleDescription: "Wählen Sie eine Rolle. Bearbeiter/Administrator benötigen ein Passwort.",
      requiresPassword: "Passwort eingeben",
      wrongPassword: "Falsches Passwort.",
    },
    home: {
      title: "Exzellenz durch",
      subtitle: "Datengetriebenes Qualitätsmanagement",
      realTimePpmTracking: "Echtzeit\nPPM-Verfolgung",
      realTimePpmDescription: "Überwachen Sie Parts Per Million und fehlerbezogene Metriken an allen Standorten mit sofortigen Updates.",
      comprehensiveAnalysis: "Umfassende\nAnalyse",
      comprehensiveAnalysisDescription: "Tiefe Einblicke in Kunden-, Lieferanten- und interne Qualitätsleistung.",
      aiPoweredInsights: "KI-gestützte\nEinblicke",
      aiPoweredInsightsDescription: "Erhalten Sie umsetzbare Empfehlungen, die durch fortschrittliche Maschinendateninterpretation unterstützt werden.",
      qualityAssurance: "Qualitäts\nKI-sicherung",
      qualityAssuranceDescription: "Umfassende Qualitätskontrolle und -sicherung in allen Bereichen mit KI.",
      generateReport: "QOS ET Bericht erstellen",
      footerCopyright: "© 2026 QOS ET Report. Exzellenz in Betrieb & Qualität vorantreiben.",
      qualityManagementSystem: "Qualitätsmanagementsystem",
      login: "Anmelden",
      loginDescription: "Wählen Sie Ihre Rolle, um zum Bericht fortzufahren.",
    },
    glossary: {
      title: "FAQ & Glossar",
      subtitle: "Schnelle Antworten zu Navigation und Berechnungen sowie ein vollständiges Glossar der im Bericht verwendeten Begriffe.",
      faqTab: "FAQ",
      glossaryTab: "Glossar",
      searchPlaceholder: "FAQ + Glossar durchsuchen…",
      faqTitle: "Häufig gestellte Fragen",
      faqDescription: "Fokus auf Navigation, Datenquellen und wie Metriken/Diagramme berechnet werden.",
      datasetHealth: "Datensatz-Gesundheit",
      datasetHealthDescription: "Live-Status aus Upload-Verlauf. Ein Datensatz gilt nach {{days}} Tagen als veraltet.",
      qmTriangle: "QM ET Dreieck",
      qmTriangleDescription: "Wie der Bericht aufgebaut und strukturiert ist.",
      qmTriangleTip: "Tipp: Wenn ein Diagramm falsch aussieht, überprüfen Sie die Datenherkunft (Quellen → Parsing → KPIs → Diagramme) und den Upload-Verlauf.",
      contact: "Kontakt",
      contactDescription: "E-Mail mit Titel, Bemerkung und grundlegendem Kontext öffnen.",
      issueTitle: "Titel des Problems",
      issueTitlePlaceholder: "z.B., Abweichungsdiagramm zeigt 0 Datensätze",
      remark: "Bemerkung / Beschreibung",
      remarkPlaceholder: "Schritte zur Reproduktion, was Sie erwartet haben, was Sie gesehen haben…",
      page: "Seite",
      lastSuccessfulUpload: "Letzter erfolgreicher Upload",
      downloadDiagnostics: "Diagnose-JSON herunterladen",
      contactEmail: "Kontakt (E-Mail)",
      improvementIdeas: "Verbesserungsvorschläge",
      improvementIdeasDescription: "Kurzes Formular zur Erfassung von Vorschlägen und zum Versenden per E-Mail.",
      ideaTitle: "Titel der Idee",
      ideaTitlePlaceholder: "z.B., Suche + Deep-Links in FAQ hinzufügen",
      ideaDetails: "Ideen-Details",
      ideaDetailsPlaceholder: "Beschreiben Sie die Verbesserung und warum sie hilft…",
      sendIdea: "Verbesserungsvorschlag senden",
      copyLink: "Link zu dieser FAQ kopieren",
      goToUpload: "Zu Upload-Daten gehen",
      noSuccessfulUpload: "Noch kein erfolgreicher Upload",
      records: "Datensätze",
      stale: "Veraltet",
      ok: "OK",
      missing: "Fehlt",
      lastSuccess: "Letzter Erfolg",
      faqsCount: "15 FAQs",
      fullGlossary: "Vollständiges Glossar (ohne Zusammenklappen)",
      contactSupport: "Support kontaktieren",
      categories: {
        navigation: "Navigation",
        dataSources: "Datenquellen",
        notifications: "Benachrichtigungen",
        metrics: "Metriken",
        chartsViews: "Diagramme & Ansichten",
        ai: "KI",
        general: "Allgemein",
      },
      howToReadCharts: {
        title: "So lesen Sie wichtige Diagramme",
        description: "Diese Anker werden von den \"So lesen Sie dieses Diagramm\"-Tooltips in den Dashboards referenziert.",
        notificationsByMonth: {
          title: "JTD Gesamtzahl der Benachrichtigungen nach Monat und Werk",
          description: "Gestapelte Balken: Jede Farbe = Werk, Balkenhöhe = Gesamtzahl der Benachrichtigungen für diesen Monat. Durch Klicken auf ein Werk in der Legende wird nur dieses Diagramm gefiltert.",
        },
        defectsByMonth: {
          title: "JTD Gesamtzahl der Defekte nach Monat und Werk",
          description: "Zeigt fehlerhafte Teile, aufgeteilt nach Werk. Wenn das Diagramm einen Defekttyp-Selektor anbietet, schaltet es zwischen Kunden- und Lieferanten-defekten Teilen um.",
        },
        ppmTrend: {
          title: "JTD kumulativer PPM-Trend",
          description: "Liniendiagramm des kumulativen PPM über den Betrachtungszeitraum. PPM verwendet fehlerhafte Teile als Zähler und Lieferungen als Nenner.",
        },
      },
      term: "Begriff",
      definition: "Definition",
      terms: "Begriffe",
      termsList: {
        navigation: {
          qosEtDashboard: { term: "QOS ET Dashboard", definition: "Haupt-Dashboard, das Kunden-/Lieferanten-/interne Metriken und Diagramme über das ausgewählte Zeitfenster aggregiert." },
          customerPerformance: { term: "Kundenleistung", definition: "Nur-Kunden-Ansicht (Q1 + Kundenlieferungen/PPM) mit kundenbezogenen Diagrammen und Tabellen." },
          supplierPerformance: { term: "Lieferantenleistung", definition: "Nur-Lieferanten-Ansicht (Q2 + Lieferantenlieferungen/PPM) mit lieferantenbezogenen Diagrammen und Tabellen." },
          uploadData: { term: "Daten hochladen", definition: "Strukturierte Datei-Upload- und manuelle Eingabeseite. Bietet auch KPI-Neuberechnung und Änderungsverlauf." },
          dataLineage: { term: "Datenherkunft", definition: "Katalogansicht, die Datenquellen → Verarbeitung → Ausgaben → Seiten/Diagramme abbildet." },
        },
        dataSources: {
          complaintsExtract: { term: "Reklamationsextrakt (Q Cockpit)", definition: "Excel-Export mit Qualitätsbenachrichtigungen (Q1/Q2/Q3) einschließlich fehlerhafter Teile und Werkreferenzen." },
          outboundDeliveries: { term: "Outbound-Lieferungsdateien", definition: "Excel-Extrakte mit Kundenlieferungen nach Werk/Datum. Wird als Nenner für Kunden-PPM verwendet." },
          inboundDeliveries: { term: "Inbound-Lieferungsdateien", definition: "Excel-Extrakte mit Lieferantenlieferungen nach Werk/Datum. Wird als Nenner für Lieferanten-PPM verwendet." },
          plantMasterData: { term: "Werkstammdaten (Webasto ET Plants)", definition: "Offizielle Werkcode-zu-Standort-Zuordnung, die in Filtern, Legenden und KI-Prompts verwendet wird." },
          ppapExtracts: { term: "PPAP-Basis + Status-Extrakte", definition: "Zwei Excel-Dateien: eine Benachrichtigungsliste + eine Statusliste zur Klassifizierung des PPAP-Status." },
          deviationsExtracts: { term: "Abweichungs-Basis + Status-Extrakte", definition: "Zwei Excel-Dateien: eine Abweichungsbenachrichtigungsliste + eine Statusliste zur Klassifizierung des Abweichungsstatus." },
        },
        notifications: {
          notificationNumber: { term: "Benachrichtigungsnummer", definition: "Eindeutiger Identifikator für jede SAP-Qualitätsbenachrichtigung." },
          notificationType: { term: "Benachrichtigungstyp", definition: "SAP-Benachrichtigungsklassifizierung: Q1/Q2/Q3 (Reklamationen), D1/D2/D3 (Abweichungen), P1/P2/P3 (PPAP)." },
          q1: { term: "Q1 (Kundenreklamation)", definition: "Kunden-originierte Qualitätsbenachrichtigungen; trägt zu Kundenreklamationen und Kunden-PPM bei." },
          q2: { term: "Q2 (Lieferantenreklamation)", definition: "Lieferantenbezogene Qualitätsbenachrichtigungen; trägt zu Lieferantenreklamationen und Lieferanten-PPM bei." },
          q3: { term: "Q3 (Interne Reklamation)", definition: "Interne Qualitätsbenachrichtigungen; wird in der internen Reklamationsberichterstattung verwendet (z.B. Poor Quality Costs Platzhalter)." },
          d1d2d3: { term: "D1/D2/D3 (Abweichung)", definition: "Abweichungsbenachrichtigungen, die Ausnahmen oder Genehmigungen darstellen. Wird in der Abweichungsübersicht gemeldet." },
          p1p2p3: { term: "P1/P2/P3 (PPAP)", definition: "PPAP-Benachrichtigungen, die Genehmigungsprozesszustände darstellen. Wird in der PPAPs-Übersicht gemeldet." },
          nocoOsno: { term: "NOCO / OSNO", definition: "SAP-Systemstatus-Token zur Statusableitung (NOCO ≈ Abgeschlossen, OSNO ≈ In Bearbeitung)." },
        },
        metrics: {
          ppm: { term: "PPM (Parts Per Million)", definition: "Qualitätsmetrik: (Fehlerhafte Teile / Gesamte Lieferungen) × 1.000.000. Niedriger ist besser." },
          customerPpm: { term: "Kunden-PPM", definition: "PPM berechnet aus Q1 fehlerhaften Teilen und Kundenlieferungen (Outbound)." },
          supplierPpm: { term: "Lieferanten-PPM", definition: "PPM berechnet aus Q2 fehlerhaften Teilen und Lieferantenlieferungen (Inbound)." },
          defectiveParts: { term: "Fehlerhafte Teile", definition: "Menge nicht konformer Teile, die in einer Benachrichtigung erfasst wurden. Wird in PPM verwendet." },
          deliveries: { term: "Lieferungen", definition: "Gesamte gelieferte Menge, die als PPM-Nenner verwendet wird (Kunden-Outbound / Lieferanten-Inbound)." },
          globalPpm: { term: "Globaler PPM", definition: "Gesamt-PPM aggregiert über alle ausgewählten Werke/Monate." },
          lookbackWindow: { term: "12-Monats-Rückblickfenster", definition: "Ein rollierendes Fenster, das am ausgewählten Monat/Jahr endet und für konsistente Trendvisualisierungen verwendet wird." },
        },
        chartsViews: {
          notificationsByMonth: { term: "JTD Gesamtzahl der Benachrichtigungen nach Monat und Werk", definition: "Gestapeltes Balkendiagramm, das Reklamationszählungen pro Monat, aufgeteilt nach Werk, zeigt." },
          defectsByMonth: { term: "JTD Gesamtzahl der Defekte nach Monat und Werk", definition: "Balkendiagramm, das fehlerhafte Teile nach Monat und Werk zeigt (Kunde vs. Lieferant)." },
          legendClickFilter: { term: "Legenden-Klick-Filter", definition: "Diagramm-lokaler Filter, der durch Klicken auf ein Werk-Badge in der Legende ausgelöst wird; betrifft keine anderen Diagramme." },
          fixedYAxis: { term: "Feste Y-Achsen-Domäne", definition: "Y-Achsen-Maximum, berechnet aus ungefilterten Daten, damit die Skala nach lokalem Filtern stabil bleibt." },
        },
        ai: {
          aiSummary: { term: "KI-Zusammenfassung", definition: "Von LLM generierte narrative Zusammenfassung gefilterter KPIs mit Trends, Risiken und empfohlenen Maßnahmen." },
          aiManagementSummary: { term: "KI-Management-Zusammenfassung", definition: "Zentrale Seite, die KPIs zusammenfasst und Anomalien und Maßnahmen hervorhebt (deutsche Zahlenformatierung, Werkbezeichnungen enthalten)." },
          providerApiKey: { term: "Anbieter / API-Schlüssel", definition: "Konfiguriertes LLM-Backend (z.B. OpenAI-kompatibel oder Anthropic), das von der KI-Zusammenfassungs-API-Route verwendet wird." },
        },
        general: {
          sitePlantCode: { term: "Standort / Werkcode", definition: "3-stelliger Code zur Identifizierung eines Fertigungsstandorts (z.B. 145, 235, 410). Wird mit Stadt/Standort angezeigt, wenn verfügbar." },
          uploadHistory: { term: "Upload-Verlauf", definition: "Persistente Protokollierung von Datei-Uploads/manuellen Einträgen einschließlich Zeitstempeln, Zusammenfassungen und wo Daten verwendet werden." },
          manualEntry: { term: "Manuelle Eingabe (Vorlage)", definition: "Formularbasierte Eingabe monatlicher Werte pro Werk. Gespeichert und in den KPI-Datensatz für die Berichterstattung eingefügt." },
        },
      },
      faqs: {
        howToUpload: {
          q: "Wie lade ich Daten hoch?",
          a: "Gehen Sie zu Upload-Daten. Verwenden Sie die strukturierten Upload-Bereiche (Reklamationen, Lieferungen, PPAP, Abweichungen, Werke). Nach dem Upload können Sie KPIs berechnen und die Berichtsseiten lesen aus dem KPI-Datensatz.",
        },
        sourceOfTruth: {
          q: "Welche Dateien sind die Quelle der Wahrheit für Reklamationen und PPM?",
          a: "Reklamationen und fehlerhafte Teile stammen aus dem Q Cockpit-Reklamationsextrakt. Lieferungen stammen aus Outbound- (Kundenlieferungen) und Inbound- (Lieferantenlieferungen) Dateien. PPM wird aus fehlerhaften Teilen und Lieferungen abgeleitet.",
        },
        customerPpmCalculation: {
          q: "Wie wird Customer PPM berechnet?",
          a: "Customer PPM = (Kunden-defekte Teile / Kundenlieferungen) × 1.000.000 für die ausgewählten Werke und den Zeitraum.",
        },
        supplierPpmCalculation: {
          q: "Wie wird Supplier PPM berechnet?",
          a: "Supplier PPM = (Lieferanten-defekte Teile / Lieferantenlieferungen) × 1.000.000 für die ausgewählten Werke und den Zeitraum.",
        },
        q1q2q3Meaning: {
          q: "Was bedeuten Q1, Q2 und Q3?",
          a: "Q1 = Kundenreklamationen, Q2 = Lieferantenreklamationen, Q3 = Interne Reklamationen. Sie repräsentieren verschiedene Benachrichtigungskategorien und steuern verschiedene Diagramme/Metriken.",
        },
        d1d2d3Meaning: {
          q: "Was repräsentieren D1, D2, D3 auf der Abweichungsseite?",
          a: "D1/D2/D3 sind Abweichungsbenachrichtigungstypen. Die Abweichungsübersichtsseite zeigt Zählungen nach Monat und Werk sowie eine Statusansicht (Abgeschlossen vs. In Bearbeitung).",
        },
        p1p2p3Meaning: {
          q: "Was repräsentieren P1, P2, P3 auf der PPAPs-Seite?",
          a: "P1/P2/P3 sind PPAP-Benachrichtigungstypen. Die PPAPs-Übersichtsseite zeigt PPAP-Zählungen nach Monat/Werk und eine Statusansicht (Abgeschlossen vs. In Bearbeitung).",
        },
        ytdLookback: {
          q: "Warum zeigen Diagramme einen 12-Monats-Rückblick, auch wenn die Seite JTD sagt?",
          a: "Der Selektor verwendet einen 12-Monats-Rückblick, der am ausgewählten Monat/Jahr endet, um ein konsistentes Trendfenster über alle Seiten hinweg zu bieten. Der Seitentitel behält \"JTD //\" für Konsistenz mit der Dashboard-Benennung bei.",
        },
        plantFiltering: {
          q: "Wie funktioniert die Werkfilterung?",
          a: "Das globale Filterpanel (rechte Sidebar) filtert die meisten Inhalte. Einige Diagramme unterstützen auch lokale diagrammspezifische Filterung durch Klicken auf die Legende (betrifft nur dieses Diagramm).",
        },
        plantNamesEnrichment: {
          q: "Warum zeigen einige Legenden Werkcode plus Stadt/Standort?",
          a: "Werksnamen werden aus der offiziellen Werk-Übersichtsdatei angereichert, damit Benutzer Standorte anhand von Stadt/Standort erkennen können (z.B. \"410 (Fenton)\").",
        },
        fixedYAxis: {
          q: "Was bedeutet \"Feste Y-Achsen-Skalierung\" bei bestimmten Diagrammen?",
          a: "Wenn ein Diagramm die lokale Filterung nach Werk unterstützt, wird das Y-Achsen-Maximum aus dem ungefilterten Datensatz berechnet, um zu verhindern, dass sich die Skalierung nach der Auswahl eines Werks ändert.",
        },
        aiSummaryError: {
          q: "Warum zeigt die KI-Zusammenfassung manchmal einen Fehler?",
          a: "Die KI-Zusammenfassung hängt vom konfigurierten KI-Anbieter/Schlüssel und dem aktuellen gefilterten Datensatz ab. Wenn der Anbieter die Anfrage ablehnt (API-Schlüssel, Ratenlimit, Netzwerk), zeigt die Benutzeroberfläche eine strukturierte Erklärung und vorgeschlagene Lösungen.",
        },
        aiSummaryPlantLabels: {
          q: "Verwendet die KI-Zusammenfassung dieselben Werkbezeichnungen wie das Dashboard?",
          a: "Ja. Der KI-Prompt ist angewiesen, Werkcode und Stadt/Standort zu erwähnen, wenn auf einen Standort verwiesen wird, basierend auf der offiziellen Werkliste.",
        },
        dataLineage: {
          q: "Wofür ist die Datenherkunftsseite?",
          a: "Sie dokumentiert, welche Datenquellen welche Parser/APIs speisen, welche Ausgaben produziert werden und wo diese Ausgaben verwendet werden (Seiten/Diagramme). Sie spiegelt auch letzte Upload-Zeitstempel aus dem Upload-Verlauf wider, wenn verfügbar.",
        },
        reportIssue: {
          q: "Wie melde ich ein Problem?",
          a: "Verwenden Sie die Kontakt-Schaltfläche auf dieser Seite. Es öffnet eine E-Mail mit einer Vorlage, die Problemtitel und hilfreichen Kontext (Seite, Zeitstempel, letzte Uploads) enthält.",
        },
      },
    },
    upload: {
      title: "Daten hochladen",
      description: "Strukturierter Upload + manuelle Eingabe für Diagramme und KPI-Seiten.",
      uploadFiles: "Dateien hochladen",
      enterData: "Daten eingeben (Formular)",
      changeHistory: "Änderungsverlauf",
      accessDenied: "Zugriff verweigert",
      accessDeniedDescription: "Lesermodus ist schreibgeschützt. Das Hochladen von Dateien oder das Eingeben von Daten ist eingeschränkt.",
      switchToEditor: "Bitte wechseln Sie zu Bearbeiter oder Administrator, um Berichtsdaten hochzuladen oder zu ändern.",
      backToDashboard: "Zurück zum Dashboard",
      structuredUpload: "Strukturierter Upload",
      structuredUploadDescription: "Laden Sie Dateien nach Kategorie hoch, damit die richtigen Seiten/Diagramme zuverlässig erstellt werden können.",
      exportExcel: "Exportieren (Excel)",
      complaintsTitle: "Kunden- und Lieferantenreklamationsdateien",
      complaintsHelp: "Laden Sie Reklamationsbenachrichtigungen (Q1/Q2/Q3) hoch. Mehrere Dateien werden unterstützt.",
      deliveriesTitle: "Kunden- und Lieferantenlieferungsdateien",
      deliveriesHelp: "Laden Sie Outbound* (Kundenlieferungen) und Inbound* (Lieferanteneingänge) hoch. Mehrere Dateien werden unterstützt.",
      ppapTitle: "PPAP-Benachrichtigungsdateien",
      ppapHelp: "Laden Sie PPAP-Basis- und Statusextrakte hoch. Mehrere Dateien werden unterstützt.",
      deviationsTitle: "Abweichungsbenachrichtigungsdateien",
      deviationsHelp: "Laden Sie Abweichungsbasis- und Statusextrakte hoch. Mehrere Dateien werden unterstützt.",
      auditTitle: "Audit-Management-Dateien",
      auditHelp: "Laden Sie Audit-Quelldateien hoch (Platzhalter bis das Parsing implementiert ist). Mehrere Dateien werden unterstützt.",
      plantsTitle: "Werkübersichtsdateien",
      plantsHelp: "Laden Sie die offizielle Werkliste hoch (z.B. Webasto ET Plants .xlsx). Mehrere Dateien werden unterstützt.",
      uploadButton: "Hochladen",
      uploading: "Wird hochgeladen…",
      filesSelected: "Datei(en)",
      uploadCompleted: "Upload abgeschlossen",
      uploadFailed: "Upload fehlgeschlagen",
      usedIn: "Verwendet in:",
      recalculateKpis: "KPIs neu berechnen (Reklamationen + Lieferungen)",
      recalculateKpisDescription: "Wenn beide Kategorien hochgeladen wurden, KPIs berechnen und den Dashboard-Datensatz aktualisieren.",
      calculateKpis: "KPIs berechnen",
      latestKpiCalculation: "Letzte KPI-Berechnung",
      complaints: "Reklamationen:",
      deliveries: "Lieferungen:",
      siteMonthKpis: "Standort-Monat-KPIs:",
      openDashboard: "QOS ET Dashboard öffnen",
      manualDataEntry: "Manuelle Dateneingabe (Vorlage)",
      manualDataEntryDescription: "Geben Sie monatliche Werte pro Werk ein. Diese Einträge werden gespeichert und in den lokalen KPI-Datensatz (`qos-et-kpis`) zusammengeführt.",
      plant: "Werk (3-stellig)",
      cityLocation: "Stadt/Standort",
      month: "Monat",
      customerComplaintsQ1: "Kundenreklamationen (Q1)",
      supplierComplaintsQ2: "Lieferantenreklamationen (Q2)",
      internalComplaintsQ3: "Interne Reklamationen (Q3)",
      customerDefectiveParts: "Kundendefekteile",
      supplierDefectiveParts: "Lieferantendefekteile",
      internalDefectiveParts: "Interne Defekteile",
      outboundDeliveries: "Ausgangslieferungen (Kunde)",
      inboundDeliveries: "Eingangslieferungen (Lieferant)",
      ppapsInProgress: "PPAPs in Bearbeitung",
      ppapsCompleted: "PPAPs abgeschlossen",
      deviationsInProgress: "Abweichungen in Bearbeitung",
      deviationsCompleted: "Abweichungen abgeschlossen",
      deviationsTotalNote: "Abweichungen gesamt für KPIs = In Bearbeitung + Abgeschlossen.",
      auditsInternalSystem: "Audits: Internes System",
      auditsCertification: "Audits: Zertifizierung",
      auditsProcess: "Audits: Prozess",
      auditsProduct: "Audits: Produkt",
      poorQualityCosts: "Mangelkosten (Vorlage)",
      warrantyCosts: "Garantiekosten (Vorlage)",
      addEntry: "Eintrag hinzufügen",
      plantMustBe3Digits: "Werk muss ein 3-stelliger Code sein (z.B. 410).",
      manualEntries: "Manuelle Einträge",
      showingFirst10: "Zeige die ersten 10 Einträge. Exportieren Sie nach Excel, um alle anzuzeigen.",
      historyTitle: "Änderungsverlauf",
      historyDescription: "Jeder Upload und manuelle Eintrag wird mit Zeitstempel, Datensatzzählungen und Verwendungsreferenzen protokolliert.",
      noHistory: "Noch kein Verlauf.",
      files: "Dateien:",
      summary: "Zusammenfassung:",
      notes: "Hinweise:",
    },
  },
  it: {
    // Italian translations (placeholder - can be filled in later)
    common: {
      language: "Lingua",
      theme: "Tema",
      role: "Ruolo",
      dark: "Scuro",
      light: "Chiaro",
      reader: "Lettore",
      editor: "Editore",
      admin: "Amministratore",
      cancel: "Annulla",
      continue: "Continua",
      close: "Chiudi",
      save: "Salva",
      delete: "Elimina",
      edit: "Modifica",
      view: "Visualizza",
      search: "Cerca",
      filter: "Filtro",
      clear: "Cancella",
      selectAll: "Seleziona tutto",
      clearSelection: "Cancella selezione",
      noData: "Nessun dato disponibile",
      loading: "Caricamento...",
      error: "Errore",
      success: "Successo",
      month: "Mese",
      year: "Anno",
      from: "Da",
      to: "A",
      date: "Data",
      select: "Seleziona",
      months: ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"],
      site: "Impianto",
      clickToShowAll: "Clicca per mostrare tutti gli impianti",
      clickToFilterBy: "Clicca per filtrare per",
      resetToShowAll: "Ripristina per mostrare tutti gli impianti",
      resetFilter: "Reimposta Filtro",
      total: "TOTALE",
      change: "Cambiamento",
      defective: "Difettoso",
      average: "Media",
    },
    header: {
      title: "Rapporto Qualità QOS ET",
      reportDate: "Dicembre 2025",
    },
    sidebar: {
      dashboard: "Dashboard QOS ET",
      aiSummary: "Riepilogo Gestione AI",
      customerSupplierPerformance: "Prestazioni Cliente e Fornitore",
      customerPerformance: "Prestazioni Cliente",
      supplierPerformance: "Prestazioni Fornitore",
      costPerformance: "Prestazioni Costi",
      poorQualityCosts: "Costi Qualità Scarsa",
      warrantiesCosts: "Costi Garanzia",
      internalPerformance: "Prestazioni Interne",
      ppapsOverview: "Panoramica PPAP",
      deviationsOverview: "Panoramica Deviazioni",
      auditManagement: "Gestione Audit",
      uploadData: "Carica Dati",
      dataLineage: "Provenienza Dati",
      glossary: "FAQ e Glossario",
    },
    dashboard: {
      title: "Dashboard QOS ET YTD //",
      customerPerformance: "Prestazioni Cliente",
      supplierPerformance: "Prestazioni Fornitore",
      customerSupplierPerformance: "Prestazioni Cliente + Fornitore • Prestazioni Costi • Prestazioni Interne",
      showing12MonthLookback: "Mostra retrospettiva 12 mesi da",
      ytdCustomerMetrics: "Metriche Cliente YTD",
      ytdSupplierMetrics: "Metriche Fornitore YTD",
      customerComplaints: "Reclami Cliente",
      q1Notifications: "Notifiche Q1",
      customerDeliveries: "Consegne Cliente",
      partsShipped: "Parti spedite",
      customerPpm: "PPM Cliente",
      partsPerMillion: "Parti per Milione",
      supplierComplaints: "Reclami Fornitore",
      q2Notifications: "Notifiche Q2",
      supplierDeliveries: "Consegne Fornitore",
      partsReceived: "Parti ricevute",
      supplierPpm: "PPM Fornitore",
      internalComplaints: "Reclami Interni",
      q3Notifications: "Notifiche Q3",
      totalComplaints: "Totale Reclami",
      totalDeliveries: "Totale Consegne",
      totalPpm: "Totale PPM",
      costPerformance: "Prestazioni Costi",
      internalPerformance: "Prestazioni Interne",
      customerDefectiveParts: "Parti Difettose Cliente",
      supplierDefectiveParts: "Parti Difettose Fornitore",
      q1Defective: "Q1 difettoso",
      q2Defective: "Q2 difettoso",
      resetToShowAll: "Ripristina per mostrare tutti gli impianti",
      exportToExcel: "Esporta in Excel",
      clickToGenerateSummary: "Clicca per generare riepilogo",
      customerPpmSiteContribution: "PPM Cliente - Contributo Impianto per Mese",
      supplierPpmSiteContribution: "PPM Fornitore - Contributo Impianto per Mese",
      defectivePartsBySite: "Parti Difettose per Impianto",
      deliveriesBySite: "Consegne per Impianto",
      siteContribution: "(Contributo impianto)",
      allSites: "Tutti gli Impianti",
      ytdTotalNotificationsByMonth: "Totale Notifiche YTD per Mese e Impianto",
      ytdTotalDefectsByMonth: "Totale Difetti YTD per Mese e Impianto",
      customerPpmTrend: "Trend PPM Cliente",
      supplierPpmTrend: "Trend PPM Fornitore",
      monthlyTrend: "Trend Mensile",
    },
    aiSummary: {
      title: "Riepilogo Gestione AI",
      subtitle: "Approfondimenti intelligenti e analisi qualità automatizzata con AI",
      noDataMessage: "Nessun dato disponibile. Carica prima i dati dalla pagina Carica Dati.",
    },
    complaints: {
      title: "Numero di Reclami (Q)",
      subtitle: "Traccia reclami cliente (Q1), fornitore (Q2) e interni (Q3)",
      noDataMessage: "Nessun dato disponibile. Carica prima i dati dalla pagina Carica Dati.",
    },
    ppm: {
      title: "PPM (Parti per Milione)",
      subtitle: "Traccia trend PPM cliente e fornitore tra gli impianti",
      noDataMessage: "Nessun dato disponibile. Carica prima i dati dalla pagina Carica Dati.",
    },
    deviations: {
      title: "Panoramica Deviazioni",
      subtitle: "Traccia notifiche deviazioni (D1, D2, D3) per mese e stato",
      noDataMessage: "Nessun dato disponibile. Carica prima i dati dalla pagina Carica Dati.",
      inProgress: "In Corso",
      completed: "Completato",
      pending: "In Attesa",
    },
    ppaps: {
      title: "Panoramica PPAP",
      subtitle: "Traccia notifiche PPAP (P1, P2, P3) per mese e stato",
      noDataMessage: "Nessun dato disponibile. Carica prima i dati dalla pagina Carica Dati.",
      inProgress: "In Corso",
      completed: "Completato",
      pending: "In Attesa",
    },
    auditManagement: {
      title: "Gestione Audit YTD //",
      subtitle: "Traccia metriche audit tra gli impianti",
      noDataMessage: "Nessun dato disponibile. Carica prima i dati dalla pagina Carica Dati.",
      auditsByMonth: "Audit YTD per Mese e Impianto",
      auditsClosedVsOpen: "Reperti Audit Chiusi vs. Aperti YTD per Mese e Impianto",
      dataSourceMissing: "Fonte Dati Mancante (In Costruzione)",
      underConstruction: "Segnaposto fino al collegamento della fonte dati audit",
      dataSourceReference: "Riferimento Fonte Dati",
      auditDataSource: "Fonte Dati Audit",
    },
    settings: {
      title: "Impostazioni",
      subtitle: "Configura impostazioni e preferenze dell'applicazione",
      aiConfigurationTab: "Configurazione AI",
      columnMappingsTab: "Mappature Colonne",
      aiConfiguration: "Configurazione AI",
      aiConfigurationDescription: "Configura chiavi API Insights AI (impostate nelle variabili d'ambiente)",
      environmentVariablesRequired: "Variabili d'Ambiente Richieste:",
      aiApiKeyDescription: "La tua chiave API LLM",
      aiProviderDescription: "\"openai\" o \"anthropic\" (opzionale, default: \"openai\")",
      aiModelDescription: "Override nome modello (opzionale)",
      apiKeyNote: "Nota: Le chiavi API sono configurate lato server in .env.local per la sicurezza.",
      columnMappings: "Mappature Colonne",
      columnMappingsDescription: "Personalizza come i nomi delle colonne Excel si mappano ai campi interni",
      complaintFileMappings: "Mappature File Reclami",
      deliveryFileMappings: "Mappature File Consegne",
      commaSeparatedColumnNames: "Nomi colonne separati da virgola",
      mappingsConfigured: "mappatura(e) configurata(e)",
      saveMappings: "Salva Mappature",
      saved: "Salvato!",
      resetToDefaults: "Ripristina Predefiniti",
      mappingsSaved: "Mappature salvate!",
      mappingsNote: "Nota: Le mappature personalizzate sono attualmente memorizzate nella memoria del browser. La persistenza completa arriverà presto.",
    },
    charts: {
      howToRead: "Come leggere questo diagramma",
      resetToShowAll: "Reimposta per mostrare tutti gli impianti",
      clickToFilterBy: "Clicca per filtrare per",
      notificationsByMonth: {
        title: "Numero totale notifiche YTD per Mese e Impianto",
        titleCustomer: "Numero totale notifiche Cliente YTD per Mese e Impianto",
        titleSupplier: "Numero totale notifiche Fornitore YTD per Mese e Impianto",
        description: "Numero di reclami per mese e impianto",
        descriptionCustomer: "Numero di reclami cliente (Q1) per mese e impianto",
        descriptionSupplier: "Numero di reclami fornitore (Q2) per mese e impianto",
      },
      defectsByMonth: {
        title: "Numero totale difetti YTD per Mese e Impianto",
        titleCustomer: "Numero totale difetti Cliente YTD per Mese e Impianto",
        titleSupplier: "Numero totale difetti Fornitore YTD per Mese e Impianto",
        description: "Numero di parti difettose per mese e impianto",
        descriptionCustomer: "Numero di parti difettose cliente per mese e impianto",
        descriptionSupplier: "Numero di parti difettose fornitore per mese e impianto",
      },
      customerPpmTrend: {
        title: "Trend PPM Cliente cumulativo YTD - Tutti gli Impianti",
        description: "Prestazioni PPM Cliente combinate (PPM = Parti Difettose / Totale Consegne × 1.000.000)",
        selectPeriod: "Seleziona periodo",
        threeMonthsAverage: "Trend Media 3 Mesi",
        sixMonthsAverage: "Trend Media 6 Mesi",
        twelveMonthsAverage: "Trend Media 12 Mesi",
        actualPpm: "PPM Effettivo",
      },
      supplierPpmTrend: {
        title: "Trend PPM Fornitore cumulativo YTD - Tutti gli Impianti",
        description: "Prestazioni PPM Fornitore combinate (PPM = Parti Difettose / Totale Consegne × 1.000.000)",
      },
      siteContribution: {
        customerTitle: "Contributo Impianto PPM Cliente",
        supplierTitle: "Contributo Impianto PPM Fornitore",
        sourceCustomer: "Fonte: Parti Difettose da Q Cockpit (Colonna AF - Quantità resa) | Consegne da file Outbound (Colonna E - Quantità)",
        sourceSupplier: "Fonte: Parti Difettose da Q Cockpit (Colonna AF - Quantità resa) | Consegne da file Inbound (Colonna E - Quantità)",
        formula: "Formula: PPM = (Totale Parti Difettose / Totale Consegne) × 1.000.000",
        totalDefectiveParts: "Totale Parti Difettose",
        totalDeliveries: "Totale Consegne",
        calculatedPpm: "PPM Calcolato",
      },
      complaints: {
        totalComplaints: "Totale Reclami",
        customerComplaints: "Reclami Cliente (Q1)",
        supplierComplaints: "Reclami Fornitore (Q2)",
        complaintsTrend: "Trend Reclami",
        monthlyBreakdown: "Ripartizione mensile di reclami Q1, Q2 e Q3",
      },
      ppm: {
        trendBySite: "Trend PPM per Impianto",
        customerAndSupplierTrends: "Trend PPM Cliente e Fornitore nel tempo",
        bySiteAndMonth: "PPM per Impianto e Mese",
        detailedBreakdown: "Ripartizione dettagliata delle metriche PPM",
      },
      deviations: {
        notificationsByMonth: "Notifiche D YTD per Mese e Impianto",
        notificationsDescription: "Numero di deviazioni per mese e impianto (impilate)",
        closedVsInProgress: "Notifiche D YTD Chiuse vs. In Corso per Mese e Impianto",
        closedVsInProgressDescription: "Chiuse vs. In Corso tra tutti gli impianti selezionati",
        closed: "Chiuso",
      },
      ppaps: {
        notificationsByMonth: "Notifiche P YTD per Mese e Impianto",
        notificationsDescription: "Numero di notifiche PPAP per mese e impianto (impilate)",
        closedVsInProgress: "Notifiche P YTD Chiuse vs. In Corso per Mese e Impianto",
        closedVsInProgressDescription: "Chiuse vs. In Corso tra tutti gli impianti selezionati",
      },
      filterLabels: {
        notificationType: "Tipo Notifica",
        customerQ1: "Reclami Cliente Q1",
        supplierQ2: "Reclami Fornitore Q2",
        internalQ3: "Reclami Interni Q3",
        customerAndSupplier: "Cliente e Fornitore",
        customerAndInternal: "Cliente e Interno",
        supplierAndInternal: "Fornitore e Interno",
        defectType: "Tipo Difetto",
        customerDefects: "Difetti Cliente",
        supplierDefects: "Difetti Fornitore",
        allTypes: "Tutti i Tipi",
      },
    },
    filterPanel: {
      plant: "IMPIANTO",
      quickAccess: "ACCESSO RAPIDO",
      sapP01Sites: "Siti SAP P01",
      sapPS4Sites: "Siti SAP PS4",
      axSites: "Siti AX",
      automotiveSites: "Siti Automotive",
      aftermarketSites: "Siti Aftermarket",
      individualPlants: "Impianti Individuali",
      complaintTypes: "Tipi di Reclamo",
      customer: "Cliente",
      supplier: "Fornitore",
      internal: "Interno",
      notificationTypes: "Tipi di Notifica",
      customerComplaints: "Reclami Cliente",
      supplierComplaints: "Reclami Fornitore",
      internalComplaints: "Reclami Interni",
      deviations: "Deviazioni",
      ppap: "PPAP",
      dateRange: "Intervallo Date",
      fromDate: "Da Data",
      toDate: "A Data",
      pickDate: "Seleziona una data",
      clearAllFilters: "Cancella Tutti i Filtri",
      noPlantsAvailable: "Nessun impianto disponibile.",
      uploadDataFirst: "Carica prima i dati.",
    },
    roleAccess: {
      selectRole: "Seleziona ruolo di accesso",
      chooseRole: "Scegli il tuo ruolo per continuare.",
      switchRole: "Cambia ruolo",
      selectRoleDescription: "Seleziona un ruolo. Editore/Amministratore richiedono una password.",
      requiresPassword: "Inserisci password",
      wrongPassword: "Password errata.",
    },
    home: {
      title: "Potenziare l'Eccellenza Attraverso",
      subtitle: "Gestione Qualità Basata sui Dati",
      realTimePpmTracking: "Monitoraggio PPM\nin Tempo Reale",
      realTimePpmDescription: "Monitora Parts Per Million e metriche relative ai difetti in tutti i siti con aggiornamenti istantanei.",
      comprehensiveAnalysis: "Analisi\nCompleta",
      comprehensiveAnalysisDescription: "Approfondimenti dettagliati sulle prestazioni di qualità di clienti, fornitori e interne.",
      aiPoweredInsights: "Approfondimenti\nAlimentati dall'AI",
      aiPoweredInsightsDescription: "Ottieni raccomandazioni pratiche supportate dall'interpretazione avanzata dei dati delle macchine.",
      qualityAssurance: "Garanzia\nQualità AI",
      qualityAssuranceDescription: "Controllo e garanzia della qualità completi in tutte le operazioni utilizzando l'AI.",
      generateReport: "Genera Rapporto QOS ET",
      footerCopyright: "© 2026 QOS ET Report. Guidare l'Eccellenza nelle Operazioni & Qualità.",
      qualityManagementSystem: "Sistema di Gestione Qualità",
      login: "Accedi",
      loginDescription: "Seleziona il tuo ruolo per continuare al rapporto.",
    },
    glossary: {
      title: "FAQ e Glossario",
      subtitle: "Risposte rapide su navigazione e calcoli, oltre a un glossario completo dei termini utilizzati nel report.",
      faqTab: "FAQ",
      glossaryTab: "Glossario",
      searchPlaceholder: "Cerca FAQ + Glossario…",
      faqTitle: "Domande Frequenti",
      faqDescription: "Focalizzato su navigazione, fonti dati e come vengono calcolate metriche/diagrammi.",
      datasetHealth: "Stato Dataset",
      datasetHealthDescription: "Stato in tempo reale dalla Cronologia Upload. Un dataset è considerato obsoleto dopo {{days}} giorni.",
      qmTriangle: "Triangolo QM ET",
      qmTriangleDescription: "Come è costruito e strutturato il report.",
      qmTriangleTip: "Suggerimento: Se un diagramma sembra errato, controlla la provenienza dei dati (fonti → parsing → KPI → diagrammi) e la cronologia upload.",
      contact: "Contatto",
      contactDescription: "Apri un'email con titolo problema, osservazione e contesto di base.",
      issueTitle: "Titolo problema",
      issueTitlePlaceholder: "es., Il diagramma Deviazioni mostra 0 record",
      remark: "Osservazione / descrizione",
      remarkPlaceholder: "Passaggi per riprodurre, cosa ti aspettavi, cosa hai visto…",
      page: "Pagina",
      lastSuccessfulUpload: "Ultimo upload riuscito",
      downloadDiagnostics: "Scarica JSON diagnostica",
      contactEmail: "Contatto (Email)",
      improvementIdeas: "Idee di Miglioramento",
      improvementIdeasDescription: "Modulo breve per catturare suggerimenti e inviarli via email.",
      ideaTitle: "Titolo idea",
      ideaTitlePlaceholder: "es., Aggiungi ricerca + link profondi in FAQ",
      ideaDetails: "Dettagli idea",
      ideaDetailsPlaceholder: "Descrivi il miglioramento e perché aiuta…",
      sendIdea: "Invia Idea di Miglioramento",
      copyLink: "Copia link a questa FAQ",
      goToUpload: "Vai a Carica Dati",
      noSuccessfulUpload: "Nessun upload riuscito ancora",
      records: "Record",
      stale: "Obsoleto",
      ok: "OK",
      missing: "Mancante",
      lastSuccess: "Ultimo successo",
      faqsCount: "15 FAQ",
      fullGlossary: "Glossario completo (senza comprimere)",
      contactSupport: "Contatta supporto",
      categories: {
        navigation: "Navigazione",
        dataSources: "Fonti Dati",
        notifications: "Notifiche",
        metrics: "Metriche",
        chartsViews: "Diagrammi e Viste",
        ai: "AI",
        general: "Generale",
      },
      howToReadCharts: {
        title: "Come leggere i diagrammi chiave",
        description: "Questi ancoraggi sono referenziati dai tooltip \"Come leggere questo diagramma\" nelle dashboard.",
        notificationsByMonth: {
          title: "Numero totale notifiche YTD per Mese e Impianto",
          description: "Barre impilate: ogni colore = impianto, altezza barra = totale notifiche per quel mese. Cliccando un impianto nella legenda si filtra solo questo diagramma.",
        },
        defectsByMonth: {
          title: "Numero totale difetti YTD per Mese e Impianto",
          description: "Mostra parti difettose, divise per impianto. Se il diagramma offre un selettore tipo difetto, passa tra parti difettose Cliente e Fornitore.",
        },
        ppmTrend: {
          title: "Trend PPM cumulativo YTD",
          description: "Andamento lineare del PPM cumulativo sulla finestra di lookback. Il PPM usa parti difettose come numeratore e consegne come denominatore.",
        },
      },
      term: "Termine",
      definition: "Definizione",
      terms: "termini",
      termsList: {
        navigation: {
          qosEtDashboard: { term: "Dashboard QOS ET", definition: "Dashboard principale che aggrega metriche e diagrammi cliente/fornitore/interni nel periodo selezionato." },
          customerPerformance: { term: "Prestazioni Cliente", definition: "Vista solo cliente (Q1 + consegne cliente/PPM) con diagrammi e tabelle relative al cliente." },
          supplierPerformance: { term: "Prestazioni Fornitore", definition: "Vista solo fornitore (Q2 + consegne fornitore/PPM) con diagrammi e tabelle relative al fornitore." },
          uploadData: { term: "Carica Dati", definition: "Pagina di caricamento file strutturato e inserimento manuale. Fornisce anche ricalcolo KPI e cronologia modifiche." },
          dataLineage: { term: "Provenienza Dati", definition: "Vista catalogo che mappa fonti dati → elaborazione → output → pagine/diagrammi." },
        },
        dataSources: {
          complaintsExtract: { term: "Estratto reclami (Q Cockpit)", definition: "Esportazione Excel contenente notifiche qualità (Q1/Q2/Q3) inclusi parti difettose e riferimenti impianto." },
          outboundDeliveries: { term: "File consegne Outbound", definition: "Estratti Excel contenenti consegne cliente per impianto/data. Usato come denominatore per PPM Cliente." },
          inboundDeliveries: { term: "File consegne Inbound", definition: "Estratti Excel contenenti consegne fornitore per impianto/data. Usato come denominatore per PPM Fornitore." },
          plantMasterData: { term: "Dati master impianti (Webasto ET Plants)", definition: "Mappatura ufficiale codice impianto-ubicazione usata in filtri, legende e prompt AI." },
          ppapExtracts: { term: "Estratti PPAP base + stato", definition: "Due file Excel: un elenco notifiche + un elenco stato usato per classificare lo stato PPAP." },
          deviationsExtracts: { term: "Estratti deviazioni base + stato", definition: "Due file Excel: un elenco notifiche deviazione + un elenco stato usato per classificare lo stato deviazione." },
        },
        notifications: {
          notificationNumber: { term: "Numero Notifica", definition: "Identificatore univoco per ogni notifica qualità SAP." },
          notificationType: { term: "Tipo Notifica", definition: "Classificazione notifica SAP: Q1/Q2/Q3 (reclami), D1/D2/D3 (deviazioni), P1/P2/P3 (PPAP)." },
          q1: { term: "Q1 (Reclamo Cliente)", definition: "Notifiche qualità originate dal cliente; contribuisce a reclami cliente e PPM Cliente." },
          q2: { term: "Q2 (Reclamo Fornitore)", definition: "Notifiche qualità relative al fornitore; contribuisce a reclami fornitore e PPM Fornitore." },
          q3: { term: "Q3 (Reclamo Interno)", definition: "Notifiche qualità interne; usate nella segnalazione reclami interni (es. segnaposto Poor Quality Costs)." },
          d1d2d3: { term: "D1/D2/D3 (Deviazione)", definition: "Notifiche deviazione che rappresentano eccezioni o approvazioni. Segnalate nella Panoramica Deviazioni." },
          p1p2p3: { term: "P1/P2/P3 (PPAP)", definition: "Notifiche PPAP che rappresentano stati del processo di approvazione. Segnalate nella Panoramica PPAP." },
          nocoOsno: { term: "NOCO / OSNO", definition: "Token stato sistema SAP usati per dedurre lo stato (NOCO ≈ Completato, OSNO ≈ In Corso)." },
        },
        metrics: {
          ppm: { term: "PPM (Parti Per Milione)", definition: "Metrica qualità: (Parti Difettose / Totale Consegne) × 1.000.000. Più basso è meglio." },
          customerPpm: { term: "PPM Cliente", definition: "PPM calcolato da parti difettose Q1 e consegne cliente (Outbound)." },
          supplierPpm: { term: "PPM Fornitore", definition: "PPM calcolato da parti difettose Q2 e consegne fornitore (Inbound)." },
          defectiveParts: { term: "Parti Difettose", definition: "Quantità di parti non conformi registrate in una notifica. Usato in PPM." },
          deliveries: { term: "Consegne", definition: "Quantità totale consegnata usata come denominatore PPM (outbound cliente / inbound fornitore)." },
          globalPpm: { term: "PPM Globale", definition: "PPM complessivo aggregato su tutti gli impianti/mesi selezionati." },
          lookbackWindow: { term: "Finestra lookback 12 mesi", definition: "Una finestra mobile che termina al mese/anno selezionato usata per visualizzazioni trend coerenti." },
        },
        chartsViews: {
          notificationsByMonth: { term: "Numero totale notifiche YTD per Mese e Impianto", definition: "Grafico a barre impilate che mostra conteggi reclami per mese divisi per impianto." },
          defectsByMonth: { term: "Numero totale difetti YTD per Mese e Impianto", definition: "Grafico a barre che mostra parti difettose per mese e impianto (cliente vs fornitore)." },
          legendClickFilter: { term: "Filtro click legenda", definition: "Filtro locale al diagramma attivato cliccando un badge impianto nella legenda; non influisce su altri diagrammi." },
          fixedYAxis: { term: "Dominio asse Y fisso", definition: "Massimo asse Y calcolato da dati non filtrati così la scala rimane stabile dopo filtraggio locale." },
        },
        ai: {
          aiSummary: { term: "Riepilogo AI", definition: "Riepilogo narrativo generato da LLM di KPIs filtrati con trend, rischi e azioni raccomandate." },
          aiManagementSummary: { term: "Riepilogo Management AI", definition: "Pagina centrale che riassume KPIs e evidenzia anomalie e azioni (formattazione numeri tedesca, etichette impianti incluse)." },
          providerApiKey: { term: "Provider / Chiave API", definition: "Backend LLM configurato (es. compatibile OpenAI o Anthropic) usato dalla route API Riepilogo AI." },
        },
        general: {
          sitePlantCode: { term: "Codice Sito / Impianto", definition: "Codice a 3 cifre che identifica un sito di produzione (es. 145, 235, 410). Mostrato con città/ubicazione quando disponibile." },
          uploadHistory: { term: "Cronologia Upload", definition: "Log persistente di upload file/inserimenti manuali inclusi timestamp, riepiloghi e dove i dati sono usati." },
          manualEntry: { term: "Inserimento Manuale (Modello)", definition: "Inserimento basato su form di valori mensili per impianto. Memorizzato e unito nel dataset KPI per la reportistica." },
        },
      },
      faqs: {
        howToUpload: {
          q: "Come carico i dati?",
          a: "Vai a Carica Dati. Usa le sezioni di caricamento strutturate (Reclami, Consegne, PPAP, Deviazioni, Impianti). Dopo il caricamento, puoi calcolare i KPI e le pagine del report leggeranno dal dataset KPI.",
        },
        sourceOfTruth: {
          q: "Quali file sono la fonte di verità per reclami e PPM?",
          a: "Reclami e parti difettose provengono dall'estratto reclami Q Cockpit. Le consegne provengono da file Outbound (consegne cliente) e Inbound (consegne fornitore). Il PPM è derivato da parti difettose e consegne.",
        },
        customerPpmCalculation: {
          q: "Come viene calcolato il PPM Cliente?",
          a: "PPM Cliente = (Parti difettose Cliente / Consegne Cliente) × 1.000.000 per gli impianti e la finestra temporale selezionati.",
        },
        supplierPpmCalculation: {
          q: "Come viene calcolato il PPM Fornitore?",
          a: "PPM Fornitore = (Parti difettose Fornitore / Consegne Fornitore) × 1.000.000 per gli impianti e la finestra temporale selezionati.",
        },
        q1q2q3Meaning: {
          q: "Cosa significano Q1, Q2 e Q3?",
          a: "Q1 = Reclami cliente, Q2 = Reclami fornitore, Q3 = Reclami interni. Rappresentano diverse categorie di notifiche e guidano diversi diagrammi/metriche.",
        },
        d1d2d3Meaning: {
          q: "Cosa rappresentano D1, D2, D3 nella pagina Deviazioni?",
          a: "D1/D2/D3 sono tipi di notifica deviazione. La pagina Panoramica Deviazioni mostra conteggi per mese e impianto e una vista stato (Completato vs In Corso).",
        },
        p1p2p3Meaning: {
          q: "Cosa rappresentano P1, P2, P3 nella pagina PPAP?",
          a: "P1/P2/P3 sono tipi di notifica PPAP. La pagina Panoramica PPAP mostra conteggi PPAP per mese/impianto e una vista stato (Completato vs In Corso).",
        },
        ytdLookback: {
          q: "Perché i diagrammi mostrano un lookback di 12 mesi anche quando la pagina dice YTD?",
          a: "Il selettore usa un lookback di 12 mesi che termina al mese/anno selezionato per fornire una finestra di tendenza coerente tra le pagine. Il titolo della pagina mantiene \"YTD //\" per coerenza con la denominazione della dashboard.",
        },
        plantFiltering: {
          q: "Come funziona il filtraggio impianti?",
          a: "Il pannello filtro globale (barra laterale destra) filtra la maggior parte del contenuto. Alcuni diagrammi supportano anche il filtraggio locale solo per diagramma cliccando sulla legenda (influisce solo quel diagramma).",
        },
        plantNamesEnrichment: {
          q: "Perché alcune legende mostrano codice impianto più città/ubicazione?",
          a: "I nomi degli impianti sono arricchiti dal file Panoramica Impianti ufficiale così gli utenti possono riconoscere i siti per città/ubicazione (es., \"410 (Fenton)\").",
        },
        fixedYAxis: {
          q: "Cosa significa \"Scala asse Y fissa\" su certi diagrammi?",
          a: "Quando un diagramma supporta il filtraggio locale per impianto, il massimo dell'asse Y è calcolato dal dataset non filtrato per prevenire che la scala cambi dopo aver selezionato un impianto.",
        },
        aiSummaryError: {
          q: "Perché il Riepilogo AI a volte mostra un errore?",
          a: "Il Riepilogo AI dipende dal provider/chiave AI configurato e dal dataset filtrato corrente. Se il provider rifiuta la richiesta (chiave API, limite di velocità, rete), l'UI mostra una spiegazione strutturata e correzioni suggerite.",
        },
        aiSummaryPlantLabels: {
          q: "Il Riepilogo AI usa le stesse etichette impianti della dashboard?",
          a: "Sì. Il prompt AI è istruito a menzionare codice impianto e città/ubicazione quando si fa riferimento a un sito, basato sull'elenco impianti ufficiale.",
        },
        dataLineage: {
          q: "A cosa serve la pagina Provenienza Dati?",
          a: "Documenta quali fonti dati alimentano quali parser/API, quali output sono prodotti e dove quegli output sono usati (pagine/diagrammi). Riflette anche i timestamp dell'ultimo caricamento dalla Cronologia Upload quando disponibili.",
        },
        reportIssue: {
          q: "Come segnalo un problema?",
          a: "Usa il pulsante Contatto su questa pagina. Apre un'email con un template che include titolo problema e contesto utile (pagina, timestamp, ultimi caricamenti).",
        },
      },
    },
    upload: {
      title: "Carica Dati",
      description: "Caricamento strutturato + inserimento manuale per grafici e pagine KPI.",
      uploadFiles: "Carica File",
      enterData: "Inserisci Dati (Modulo)",
      changeHistory: "Cronologia Modifiche",
      accessDenied: "Accesso negato",
      accessDeniedDescription: "La modalità lettore è di sola lettura. Il caricamento di file o l'inserimento di dati è limitato.",
      switchToEditor: "Si prega di passare a Editore o Amministratore per caricare o modificare i dati del rapporto.",
      backToDashboard: "Torna alla Dashboard",
      structuredUpload: "Caricamento Strutturato",
      structuredUploadDescription: "Carica i file per categoria in modo che le pagine/grafici corretti possano essere costruiti in modo affidabile.",
      exportExcel: "Esporta (Excel)",
      complaintsTitle: "File Reclami Cliente e Fornitore",
      complaintsHelp: "Carica notifiche di reclamo (Q1/Q2/Q3). Supportati più file.",
      deliveriesTitle: "File Consegne Cliente e Fornitore",
      deliveriesHelp: "Carica Outbound* (consegne cliente) e Inbound* (consegne fornitore). Supportati più file.",
      ppapTitle: "File Notifiche PPAP",
      ppapHelp: "Carica estratti base PPAP + stato. Supportati più file.",
      deviationsTitle: "File Notifiche Deviazioni",
      deviationsHelp: "Carica estratti base Deviazioni + stato. Supportati più file.",
      auditTitle: "File Gestione Audit",
      auditHelp: "Carica file sorgente audit (segnaposto fino all'implementazione del parsing). Supportati più file.",
      plantsTitle: "File Panoramica Impianti",
      plantsHelp: "Carica l'elenco ufficiale degli impianti (es. Webasto ET Plants .xlsx). Supportati più file.",
      uploadButton: "Carica",
      uploading: "Caricamento in corso…",
      filesSelected: "file",
      uploadCompleted: "Caricamento completato",
      uploadFailed: "Caricamento fallito",
      usedIn: "Utilizzato in:",
      recalculateKpis: "Ricalcola KPI (Reclami + Consegne)",
      recalculateKpisDescription: "Quando entrambe le categorie sono caricate, calcola i KPI e aggiorna il dataset della dashboard.",
      calculateKpis: "Calcola KPI",
      latestKpiCalculation: "Ultimo Calcolo KPI",
      complaints: "Reclami:",
      deliveries: "Consegne:",
      siteMonthKpis: "KPI Sito-mese:",
      openDashboard: "Apri Dashboard QOS ET",
      manualDataEntry: "Inserimento Dati Manuale (Modello)",
      manualDataEntryDescription: "Inserisci valori mensili per impianto. Queste voci vengono salvate e unite nel dataset KPI locale (`qos-et-kpis`).",
      plant: "Impianto (3 cifre)",
      cityLocation: "Città/Posizione",
      month: "Mese",
      customerComplaintsQ1: "Reclami Cliente (Q1)",
      supplierComplaintsQ2: "Reclami Fornitore (Q2)",
      internalComplaintsQ3: "Reclami Interni (Q3)",
      customerDefectiveParts: "Parti Difettose Cliente",
      supplierDefectiveParts: "Parti Difettose Fornitore",
      internalDefectiveParts: "Parti Difettose Interne",
      outboundDeliveries: "Consegne in Uscita (Cliente)",
      inboundDeliveries: "Consegne in Entrata (Fornitore)",
      ppapsInProgress: "PPAP in Corso",
      ppapsCompleted: "PPAP Completati",
      deviationsInProgress: "Deviazioni in Corso",
      deviationsCompleted: "Deviazioni Completate",
      deviationsTotalNote: "Totale deviazioni utilizzato dai KPI = In Corso + Completate.",
      auditsInternalSystem: "Audit: Sistema Interno",
      auditsCertification: "Audit: Certificazione",
      auditsProcess: "Audit: Processo",
      auditsProduct: "Audit: Prodotto",
      poorQualityCosts: "Costi Qualità Scarsa (modello)",
      warrantyCosts: "Costi Garanzia (modello)",
      addEntry: "Aggiungi Voce",
      plantMustBe3Digits: "L'impianto deve essere un codice a 3 cifre (es. 410).",
      manualEntries: "Voci Manuali",
      showingFirst10: "Mostra le prime 10 voci. Esporta in Excel per visualizzare tutte.",
      historyTitle: "Cronologia Modifiche",
      historyDescription: "Ogni caricamento e voce manuale viene registrato con timestamp, conteggi record e riferimenti di utilizzo.",
      noHistory: "Nessuna cronologia ancora.",
      files: "File:",
      summary: "Riepilogo:",
      notes: "Note:",
    },
  },
};

export function getTranslations(lang: LanguageKey): Translations {
  return translations[lang] || translations.en;
}

export const LANGUAGE_CHANGED_EVENT = "qos-et-language-changed";

