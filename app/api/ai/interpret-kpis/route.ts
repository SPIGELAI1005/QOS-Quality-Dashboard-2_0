/**
 * AI interpretation endpoint for KPI analysis
 * Provides insights, trends, anomalies, and improvement suggestions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createLLMClient } from '@/lib/ai/client';
import type { MonthlySiteKpi } from '@/lib/domain/types';
import { loadPlants } from '@/lib/data/plants';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface InterpretKpisRequest {
  monthlySiteKpis: MonthlySiteKpi[];
  globalPpm?: {
    customerPpm: number | null;
    supplierPpm: number | null;
  };
  selectedSites?: string[];
  selectedMonths?: string[];
  filterContext?: {
    selectedPlants?: string[] | null;
    dateRange?: { from: string | null; to: string | null } | null;
    notificationTypes?: string[] | null;
    complaintTypes?: string[] | null;
  };
  metrics?: {
    customer?: {
      complaints: number;
      complaintsTrend: number;
      defective: number;
      defectiveTrend: number;
      deliveries: number;
      deliveriesTrend: number;
      ppm: number;
      ppmTrend: number;
    };
    supplier?: {
      complaints: number;
      complaintsTrend: number;
      defective: number;
      defectiveTrend: number;
      deliveries: number;
      deliveriesTrend: number;
      ppm: number;
      ppmTrend: number;
    };
  };
}

interface InterpretKpisResponse {
  summary: string;
  trendsAndSiteComparison: string;
  keyRisksAndAnomalies: string;
  recommendedActions: string[];
  opportunitiesAndHighlights: string;
  error?: string;
  errorType?: 'api_key' | 'rate_limit' | 'network' | 'unknown';
  errorDetails?: {
    message: string;
    code?: string;
    statusCode?: number;
  };
}

/**
 * Build prompt for LLM analysis
 * Creates a comprehensive prompt for Quality Manager analysis
 */
function buildAnalysisPrompt(
  monthlySiteKpis: MonthlySiteKpi[],
  globalPpm?: { customerPpm: number | null; supplierPpm: number | null },
  selectedSites?: string[],
  selectedMonths?: string[],
  filterContext?: {
    selectedPlants?: string[] | null;
    dateRange?: { from: string | null; to: string | null } | null;
    notificationTypes?: string[] | null;
    complaintTypes?: string[] | null;
  },
  metrics?: {
    customer?: {
      complaints: number;
      complaintsTrend: number;
      defective: number;
      defectiveTrend: number;
      deliveries: number;
      deliveriesTrend: number;
      ppm: number;
      ppmTrend: number;
    };
    supplier?: {
      complaints: number;
      complaintsTrend: number;
      defective: number;
      defectiveTrend: number;
      deliveries: number;
      deliveriesTrend: number;
      ppm: number;
      ppmTrend: number;
    };
  }
): { systemPrompt: string; userPrompt: string } {
  // Format months for display (convert "2025-03" to "March 2025")
  const formatMonthYear = (monthStr: string): string => {
    try {
      const [year, month] = monthStr.split('-').map(Number);
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return `${monthNames[month - 1]} ${year}`;
    } catch {
      return monthStr;
    }
  };

  // Calculate trends and statistics
  const sortedKpis = [...monthlySiteKpis].sort((a, b) => a.month.localeCompare(b.month));
  const months = Array.from(new Set(sortedKpis.map((k) => k.month))).sort();
  const sites = Array.from(new Set(sortedKpis.map((k) => k.siteCode))).sort();

  // Build site code to city/location mapping from official plants file
  // This uses "Webasto ET Plants.xlsx" as the source of truth
  const plantsData = loadPlants();
  const siteToCity = new Map<string, string>();
  
  // First, use official plant data from the Excel file
  plantsData.forEach((plant) => {
    if (plant.code && (plant.city || plant.location)) {
      // Prefer city field, fallback to location
      const city = plant.city || plant.location || '';
      if (city.trim().length > 0) {
        siteToCity.set(plant.code, city.trim());
      }
    }
  });
  
  // Fallback: if plant not found in official file, try to extract from siteName
  sortedKpis.forEach((kpi) => {
    if (kpi.siteCode && !siteToCity.has(kpi.siteCode) && kpi.siteName) {
      // Try to extract city from siteName as fallback
      let city = kpi.siteName.trim();
      
      // Remove common prefixes and suffixes
      city = city.replace(/^(Site|Plant|Werk|Location)\s+/i, '');
      city = city.replace(/\s+(Site|Plant|Werk|Location)$/i, '');
      
      // Remove plant codes that might be embedded
      city = city.replace(/^(Plant|Site|Werk)\s*\d+\s*/i, '');
      city = city.replace(/\s*\d+\s*(Plant|Site|Werk)$/i, '');
      
      // Extract city name from remaining text
      const words = city.split(/\s+/).filter(w => w.length > 0);
      
      if (words.length === 1) {
        city = words[0];
      } else if (words.length > 1) {
        if (words[0].length >= 3 && /^[A-Z]/.test(words[0])) {
          if (words.length > 1 && words[1].length >= 2 && /^[A-Z]/.test(words[1])) {
            city = `${words[0]} ${words[1]}`;
          } else {
            city = words[0];
          }
        } else if (words.length > 1 && words[1].length >= 3 && /^[A-Z]/.test(words[1])) {
          city = words[1];
        } else {
          city = words[0];
        }
      }
      
      // Clean up and capitalize properly
      city = city.trim();
      if (city.length > 0) {
        city = city.split(/\s+/).map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
        
        siteToCity.set(kpi.siteCode, city);
        console.warn(`[AI Summary] Plant ${kpi.siteCode} not found in official plants file, using extracted city: ${city}`);
      }
    }
  });
  
  // Log validation: check if all sites in KPIs are in the official plants file
  const sitesInKpis = new Set(sortedKpis.map(k => k.siteCode));
  const plantsInFile = new Set(plantsData.map(p => p.code));
  const missingPlants = Array.from(sitesInKpis).filter(code => !plantsInFile.has(code));
  if (missingPlants.length > 0) {
    console.warn(`[AI Summary] Warning: Some plant codes in KPIs are not in official plants file: ${missingPlants.join(', ')}`);
  }

  // Calculate totals
  const totalQ1 = sortedKpis.reduce((sum, k) => sum + k.customerComplaintsQ1, 0);
  const totalQ2 = sortedKpis.reduce((sum, k) => sum + k.supplierComplaintsQ2, 0);
  const totalQ3 = sortedKpis.reduce((sum, k) => sum + k.internalComplaintsQ3, 0);
  const totalDeviations = sortedKpis.reduce((sum, k) => sum + k.deviationsD, 0);
  const totalPPAP = sortedKpis.reduce(
    (sum, k) => sum + k.ppapP.inProgress + k.ppapP.completed,
    0
  );

  // Check if there's meaningful data (non-zero values)
  const hasMeaningfulData = totalQ1 > 0 || totalQ2 > 0 || totalQ3 > 0 || totalDeviations > 0 || totalPPAP > 0;
  
  // Check if selected plants have any data
  const selectedPlantsWithData = selectedSites && selectedSites.length > 0
    ? selectedSites.filter(site => {
        const siteKpis = sortedKpis.filter(k => k.siteCode === site);
        return siteKpis.some(k => 
          k.customerComplaintsQ1 > 0 || 
          k.supplierComplaintsQ2 > 0 || 
          k.internalComplaintsQ3 > 0 || 
          k.deviationsD > 0 || 
          k.ppapP.inProgress > 0 || 
          k.ppapP.completed > 0
        );
      })
    : sites.filter(site => {
        const siteKpis = sortedKpis.filter(k => k.siteCode === site);
        return siteKpis.some(k => 
          k.customerComplaintsQ1 > 0 || 
          k.supplierComplaintsQ2 > 0 || 
          k.internalComplaintsQ3 > 0 || 
          k.deviationsD > 0 || 
          k.ppapP.inProgress > 0 || 
          k.ppapP.completed > 0
        );
      });
  
  const hasNoDataForSelectedPlants = selectedSites && selectedSites.length > 0 && selectedPlantsWithData.length === 0;

  // Calculate PPM statistics
  const customerPpms = sortedKpis
    .map((k) => k.customerPpm)
    .filter((p): p is number => p !== null);
  const supplierPpms = sortedKpis
    .map((k) => k.supplierPpm)
    .filter((p): p is number => p !== null);

  const avgCustomerPpm =
    customerPpms.length > 0
      ? customerPpms.reduce((sum, p) => sum + p, 0) / customerPpms.length
      : null;
  const avgSupplierPpm =
    supplierPpms.length > 0
      ? supplierPpms.reduce((sum, p) => sum + p, 0) / supplierPpms.length
      : null;

  // Find anomalies (significant month-over-month changes)
  const anomalies: string[] = [];
  for (let i = 1; i < sortedKpis.length; i++) {
    const prev = sortedKpis[i - 1];
    const curr = sortedKpis[i];
    if (prev.month === curr.month) continue;

    // Check for PPM spikes
    if (
      prev.customerPpm !== null &&
      curr.customerPpm !== null &&
      curr.customerPpm > prev.customerPpm * 1.5
    ) {
      anomalies.push(
        `Customer PPM spike: ${prev.customerPpm.toFixed(2)} → ${curr.customerPpm.toFixed(2)} at ${curr.siteCode} (${curr.month})`
      );
    }
    if (
      prev.supplierPpm !== null &&
      curr.supplierPpm !== null &&
      curr.supplierPpm > prev.supplierPpm * 1.5
    ) {
      anomalies.push(
        `Supplier PPM spike: ${prev.supplierPpm.toFixed(2)} → ${curr.supplierPpm.toFixed(2)} at ${curr.siteCode} (${curr.month})`
      );
    }

    // Check for complaint spikes
    const prevTotal = prev.customerComplaintsQ1 + prev.supplierComplaintsQ2 + prev.internalComplaintsQ3;
    const currTotal = curr.customerComplaintsQ1 + curr.supplierComplaintsQ2 + curr.internalComplaintsQ3;
    if (prevTotal > 0 && currTotal > prevTotal * 2) {
      anomalies.push(
        `Complaint spike: ${prevTotal} → ${currTotal} at ${curr.siteCode} (${curr.month})`
      );
    }
  }

  const systemPrompt = `You are an experienced Quality Manager in an automotive / manufacturing environment, with strong knowledge of APQP, PPAP, customer complaints, supplier complaints, deviations and PPM (parts per million).

Your task is to interpret KPI data for different manufacturing sites and months. The KPIs include:
- Q1 = customer complaints
- Q2 = supplier complaints
- Q3 = internal complaints
- D* = deviations (D1, D2, D3, etc.)
- P1/P2/P3 = PPAP-related notifications (inProgress = P1, completed = P2+P3)
- PPM (parts per million) for customer and supplier, calculated as: PPM = (sum of defective parts / sum of delivered quantity) * 1,000,000

You must:
1. Analyse trends over time (month by month).
2. Compare sites to each other (best vs worst performers).
3. Highlight anomalies (e.g. sudden spikes in complaints or PPM).
4. CRITICAL: ALWAYS specify whether PPM is "Customer PPM" or "Supplier PPM" when mentioning any PPM value. Never use just "PPM" alone - always use "Customer PPM" or "Supplier PPM".
5. CRITICAL: ALWAYS mention the city/location when mentioning a plant number. For example, write "Site 145 (Vienna)" or "Plant 235 in Kampen" instead of just "Site 145" or "Plant 235". This helps readers identify which location you're referring to. NEVER mention the same city twice for the same plant in the same context.
6. CRITICAL: ALWAYS include actual numerical values when mentioning metrics. For example: "Site 145 (Vienna) has Customer PPM of 25.5" or "Supplier complaints increased to 150 at Site 235 (Kampen)". Do NOT mention metrics without providing the actual values.
7. CRITICAL: ALWAYS include month and year when mentioning any metric, trend, finding, or event. For example: "Site 145 (Vienna) experienced Customer PPM of 25.5 in March 2025" or "Supplier complaints increased to 150 at Site 235 (Kampen) in February 2025" or "Customer PPM improved from 45.2 to 32.1 between January 2025 and March 2025". Format months as full month names (January, February, March, etc.) followed by the 4-digit year (e.g., "March 2025", "December 2024"). When discussing trends or comparisons, mention both the starting and ending months/years (e.g., "from January 2025 to March 2025"). NEVER mention metrics, trends, or findings without specifying the month and year.
8. CRITICAL: AVOID CONTRADICTIONS. If you mention a plant as performing well (low PPM, improving trends) in one section, do NOT mention it as needing attention (high PPM, worsening trends) in another section. Be consistent - a plant cannot be both best and worst performer simultaneously. Review all sections before finalizing to ensure consistency.
9. Distinguish clearly between customer vs supplier vs internal complaints, and customer PPM vs supplier PPM.
10. Provide concrete, practical improvement suggestions in the language of Quality Management (containment, root cause analysis, corrective actions, preventive actions, supplier development, etc.).

Tone and style:
- Professional, concise, and structured.
- CRITICAL: All statements must be concise, clear, and easily understandable. Avoid jargon or overly technical language.
- Each statement should be self-contained and immediately comprehensible to someone reading it.
- Use simple, direct language. Prefer short sentences over long, complex ones.
- Clear enough for management, but with the mindset of a Quality Manager.
- Avoid generic wording. Do NOT mention that you are an AI.
- Do NOT invent data or dates that are not present in the input.
- Base all statements strictly on the numerical data received.

Output format:
CRITICAL: You MUST return ONLY valid JSON. Do not include any markdown formatting, code blocks, or explanatory text before or after the JSON. Return ONLY the JSON object.

${hasNoDataForSelectedPlants || !hasMeaningfulData ? 'CRITICAL DATA VALIDATION: There is NO meaningful data available for the selected plants and time period. You MUST state this clearly and honestly. Do NOT invent data, reference other plants, or create generic analysis. Your summary should clearly indicate that no data is available.' : ''}

Return your answer as structured JSON with these sections:
{
  "summary": "${hasNoDataForSelectedPlants || !hasMeaningfulData ? 'EXACTLY 2-3 short statements stating clearly that no data is available. Example: "No quality data is available for the selected plants and time period." "Please verify plant selection or upload data for these plants." "The dashboard metrics reflect zero values due to missing data." Each statement must be approximately 15 words maximum, start with a word (not a number or bullet point), and be a complete, clear sentence. Format as plain text, one statement per line, no bullets, no numbers, no prefixes.' : 'EXACTLY 2-3 short statements, each on a separate line. Each statement must be approximately 15 words maximum. Each statement must start with a word (not a number or bullet point). Each statement should be a complete, clear sentence that is immediately understandable. Focus on the most significant trends, critical changes, or key insights that directly relate to the metrics displayed on the dashboard. MUST reflect the filtered data context (e.g., if specific plants are selected, mention those plants; if a date range is filtered, reference that period). CRITICAL: ALWAYS include actual numerical values when mentioning metrics (e.g., "Customer PPM of 25.5" or "150 complaints"). ALWAYS specify \'Customer PPM\' or \'Supplier PPM\' when mentioning PPM values. CRITICAL: ALWAYS include the city/location when mentioning a plant number (e.g., \'Site 145 (Vienna)\' or \'Plant 235 in Kampen\'). NEVER mention the same city twice for the same plant. CRITICAL: ALWAYS include month and year when mentioning any metric, trend, or finding (e.g., "in March 2025", "from January 2025 to March 2025", "during February 2025"). Format months as full names followed by 4-digit year. Format as plain text, one statement per line, no bullets, no numbers, no prefixes. Example format:\nSite 145 (Vienna) experienced significant Customer PPM spikes reaching 125.5 in March 2025 requiring immediate attention.\nSupplier complaints increased to 150 at Site 235 (Kampen) during February 2025.\nOverall quality metrics show improvement trends from January 2025 to March 2025 across most monitored sites with Customer PPM averaging 45.2.'}",
  "trendsAndSiteComparison": "${hasNoDataForSelectedPlants || !hasMeaningfulData ? 'State clearly: "No data is available for the selected plants and time period to perform trend analysis or site comparisons. Please verify plant selection or upload data for these plants."' : 'MUST identify and describe: (1) Top 2-3 performing sites with their PPM values (lowest PPM = best performance), mention specific site numbers with their city/location and PPM values like \'Site 175 (Vienna) with Customer PPM of 20.05 in March 2025\' or \'Site 235 (Kampen) has Supplier PPM of 23.09 in February 2025\'. ALWAYS specify whether it\'s Customer PPM or Supplier PPM. ALWAYS include the city/location when mentioning a plant number. NEVER mention the same city twice for the same plant. CRITICAL: ALWAYS include month and year (e.g., "in March 2025", "during February 2025"). (2) Sites with improving trends - include actual values showing the improvement with months/years (e.g., "Customer PPM decreased from 45.2 in January 2025 to 32.1 in March 2025"). (3) Overall trends over time with specific numbers and time periods (e.g., "from January 2025 to March 2025"). Be specific with site numbers, cities, values, and months/years. NEVER use just \'PPM\' - always use \'Customer PPM\' or \'Supplier PPM\'. CRITICAL: Include actual numerical values and month/year for all metrics mentioned. Keep descriptions concise and clear (1-2 sentences per site).'}",
  "keyRisksAndAnomalies": "${hasNoDataForSelectedPlants || !hasMeaningfulData ? 'State clearly: "No data is available for the selected plants and time period to identify risks or anomalies. Please verify plant selection or upload data for these plants."' : 'MUST identify and describe: (1) Top 2-3 sites needing attention with their PPM values or complaint counts (highest PPM or most complaints = needs attention), mention specific site numbers with their city/location like \'Site 411 (Vienna) with Supplier PPM of 1102.87 in March 2025\' or \'Site 410 (Kampen) has 358 complaints in February 2025\'. ALWAYS specify whether it\'s Customer PPM or Supplier PPM when mentioning PPM. ALWAYS include the city/location when mentioning a plant number. NEVER mention the same city twice for the same plant. CRITICAL: ALWAYS include month and year (e.g., "in March 2025", "during February 2025"). (2) Anomalies and spikes with specific months, sites, and actual values showing the change (e.g., "Customer PPM increased from 25.5 in January 2025 to 78.3 in March 2025"). (3) Critical issues requiring immediate action with specific numbers and months/years. Be specific with site numbers, cities, values, and dates (month and year). NEVER use just \'PPM\' - always use \'Customer PPM\' or \'Supplier PPM\'. CRITICAL: Include actual numerical values and month/year for all metrics mentioned. Keep descriptions concise and clear (1-2 sentences per item).'}",
  "recommendedActions": ${hasNoDataForSelectedPlants || !hasMeaningfulData ? '["Title: Verify Plant Selection and Data Availability. Description: Review the selected plants and confirm that quality data has been uploaded for these plants and the selected time period. Check the Upload Data page to ensure all required files (complaints, deliveries, etc.) have been successfully processed. Expected Impact: Ensures data availability for accurate quality analysis and reporting.", "Title: Upload Missing Data. Description: If data should exist for the selected plants and period, upload the required Excel files (complaints, deliveries, deviations, etc.) from the Upload Data page. Verify that plant codes match the official plant list. Expected Impact: Enables comprehensive quality analysis and dashboard metrics."]' : '["Title: [Clear, concise action title - maximum 15 words]. Description: [Concise explanation of what needs to be done and why. Be specific with site numbers, months/years (e.g., "March 2025", "from January 2025 to March 2025"), and processes. Should be 2-3 clear, understandable sentences. Avoid jargon. CRITICAL: Include month and year when referencing specific issues or metrics.]. Expected Impact: [Specific, concise outcome expected - 1 sentence maximum]", "Title: [Clear, concise action title - maximum 15 words]. Description: [Concise explanation - 2-3 clear sentences. CRITICAL: Include month and year when referencing specific issues or metrics.]. Expected Impact: [Specific, concise outcome - 1 sentence]", "Title: [Clear, concise action title - maximum 15 words]. Description: [Concise explanation - 2-3 clear sentences. CRITICAL: Include month and year when referencing specific issues or metrics.]. Expected Impact: [Specific, concise outcome - 1 sentence]", "Title: [Clear, concise action title - maximum 15 words]. Description: [Concise explanation - 2-3 clear sentences. CRITICAL: Include month and year when referencing specific issues or metrics.]. Expected Impact: [Specific, concise outcome - 1 sentence]", "Title: [Clear, concise action title - maximum 15 words]. Description: [Concise explanation - 2-3 clear sentences. CRITICAL: Include month and year when referencing specific issues or metrics.]. Expected Impact: [Specific, concise outcome - 1 sentence]"]'},
  
CRITICAL REQUIREMENTS FOR RECOMMENDED ACTIONS:
- Each recommended action MUST directly address a specific issue, anomaly, or finding identified in the "summary", "keyRisksAndAnomalies", or "trendsAndSiteComparison" sections above.
- Actions MUST be based on the actual data provided for the selected period and filtered sites. Do NOT generate generic actions that could apply to any dataset.
- Reference specific sites, months, PPM values, or complaint counts from the data when creating actions.
- If specific sites or months are filtered/selected, focus actions on those sites and that time period.
- Actions should prioritize addressing the most critical issues identified (highest PPM sites, most complaints, significant anomalies).
- Each action should be unique and tailored to the specific findings - avoid generic recommendations.
  "opportunitiesAndHighlights": "${hasNoDataForSelectedPlants || !hasMeaningfulData ? 'State clearly: "No data is available for the selected plants and time period to identify opportunities or highlights. Please verify plant selection or upload data for these plants."' : 'MUST mention: (1) Top performing sites with specific site numbers and their city/location, and why they perform well. Include actual PPM values or complaint counts with month/year. When mentioning PPM, ALWAYS specify \'Customer PPM\' or \'Supplier PPM\'. ALWAYS include the city/location when mentioning a plant number (e.g., \'Site 175 (Vienna)\' or \'Plant 235 in Kampen\'). NEVER mention the same city twice for the same plant. CRITICAL: ALWAYS include month and year (e.g., "in March 2025", "during February 2025"). (2) Best practices that can be replicated. (3) Positive trends and improvements with actual values showing the improvement and time periods (e.g., "Customer PPM improved from 45.2 in January 2025 to 32.1 in March 2025"). Be specific with site numbers, cities, values, and months/years. NEVER use just \'PPM\' - always use \'Customer PPM\' or \'Supplier PPM\'. CRITICAL: Include actual numerical values and month/year for all metrics mentioned. Keep descriptions concise and clear (1-2 sentences per point).'}",
}

Always reference sites and months using the exact labels from the input (e.g. siteCode like "145", month like "2025-03"). Do not make up new sites or months.

CRITICAL MONTH/YEAR FORMATTING RULE:
- When mentioning any metric, trend, finding, anomaly, or event, you MUST include the month and year.
- Format months as full month names followed by 4-digit year: "January 2025", "February 2025", "March 2025", etc.
- For trends or comparisons, mention both start and end months: "from January 2025 to March 2025" or "between February 2025 and March 2025".
- Examples:
  * "Site 145 (Vienna) experienced Customer PPM of 25.5 in March 2025"
  * "Supplier complaints increased to 150 at Site 235 (Kampen) in February 2025"
  * "Customer PPM improved from 45.2 in January 2025 to 32.1 in March 2025"
  * "Overall quality metrics show improvement trends from January 2025 to March 2025"
- NEVER mention metrics, trends, or findings without specifying the month and year.
- This applies to ALL sections: summary, trendsAndSiteComparison, keyRisksAndAnomalies, opportunitiesAndHighlights, and recommendedActions.

CRITICAL PLANT NUMBER FORMATTING RULE:
- When mentioning any plant/site number, you MUST also include its city/location in the format: "Site [NUMBER] ([CITY])" or "Plant [NUMBER] in [CITY]"
- Examples: "Site 145 (Vienna)", "Plant 235 (Kampen)", "Site 410 in Doncaster"
- This applies to ALL mentions of plant numbers in summary, trends, risks, opportunities, and recommended actions sections.
- ALWAYS use the city/location mapping from the official "Webasto ET Plants.xlsx" file provided in the data section below.
- The plant data in this file is the authoritative source - use it to validate all plant numbers and their locations.

CRITICAL: Return ONLY valid JSON. Do not include markdown code blocks, explanatory text, or any formatting. Return ONLY the raw JSON object starting with { and ending with }.`;

  // Build filter context description
  const filterContextDesc = [];
  if (filterContext?.selectedPlants && filterContext.selectedPlants.length > 0) {
    filterContextDesc.push(`- FILTERED PLANTS: ${filterContext.selectedPlants.join(', ')} (Analysis should focus on these specific plants)`);
  }
  if (filterContext?.dateRange) {
    const dateInfo = [];
    if (filterContext.dateRange.from) dateInfo.push(`from ${filterContext.dateRange.from}`);
    if (filterContext.dateRange.to) dateInfo.push(`to ${filterContext.dateRange.to}`);
    if (dateInfo.length > 0) {
      filterContextDesc.push(`- FILTERED DATE RANGE: ${dateInfo.join(' ')} (Analysis should focus on this time period)`);
    }
  }
  if (filterContext?.notificationTypes && filterContext.notificationTypes.length > 0) {
    filterContextDesc.push(`- FILTERED NOTIFICATION TYPES: ${filterContext.notificationTypes.join(', ')}`);
  }
  if (filterContext?.complaintTypes && filterContext.complaintTypes.length > 0) {
    filterContextDesc.push(`- FILTERED COMPLAINT TYPES: ${filterContext.complaintTypes.join(', ')}`);
  }

  // Build site code to city mapping string for the prompt
  // Include both city and full location if available
  const siteCityMapping = Array.from(siteToCity.entries())
    .map(([code, city]) => {
      const plant = plantsData.find(p => p.code === code);
      const location = plant?.location || city;
      return `  - Site ${code}: ${city}${location && location !== city ? ` (${location})` : ''}`;
    })
    .join('\n');
  
  // Also include plant validation info
  const validatedPlants = sites.filter(code => plantsInFile.has(code));
  const unvalidatedPlants = sites.filter(code => !plantsInFile.has(code));

  const formattedStartMonth = months[0] ? formatMonthYear(months[0]) : 'N/A';
  const formattedEndMonth = months[months.length - 1] ? formatMonthYear(months[months.length - 1]) : 'N/A';
  const formattedSelectedMonths = selectedMonths && selectedMonths.length > 0 
    ? selectedMonths.map(m => formatMonthYear(m)).join(', ')
    : null;
  const formattedAllMonths = months.map(m => formatMonthYear(m)).join(', ');

  const userPrompt = `Analyze the following quality KPI data:

DATA SUMMARY:
- Time Period: ${formattedStartMonth} to ${formattedEndMonth} (${months[0] || 'N/A'} to ${months[months.length - 1] || 'N/A'})
- Sites Analyzed: ${sites.length} site(s) - ${sites.join(', ')}
${selectedSites && selectedSites.length > 0 ? `- SELECTED SITES: ${selectedSites.join(', ')}` : '- All sites included (no site filter applied)'}
${formattedSelectedMonths ? `- SELECTED MONTHS: ${formattedSelectedMonths}` : `- All months included: ${formattedAllMonths}`}
${filterContextDesc.length > 0 ? `\nACTIVE FILTERS:\n${filterContextDesc.join('\n')}\n` : ''}
${formattedSelectedMonths ? `\nCRITICAL: When mentioning any metric, trend, or finding, you MUST include the specific month and year from the selected months (${formattedSelectedMonths}). Use the format "Month Year" (e.g., "March 2025", "February 2025").` : `\nCRITICAL: When mentioning any metric, trend, or finding, you MUST include the specific month and year. Use the format "Month Year" (e.g., "March 2025", "February 2025"). Available months in the data: ${formattedAllMonths}.`}

${hasNoDataForSelectedPlants ? `\n⚠️ CRITICAL: NO DATA AVAILABLE FOR SELECTED PLANTS\n- Selected plants: ${selectedSites?.join(', ') || 'N/A'}\n- Plants with data: ${selectedPlantsWithData.length > 0 ? selectedPlantsWithData.join(', ') : 'None'}\n- You MUST state clearly that there is no data available for the selected plants and period.\n- Do NOT invent or reference data from other plants.\n- Be honest and professional: "No quality data is available for the selected plants and time period. Please verify plant selection or upload data for these plants."\n` : ''}

${!hasMeaningfulData && !hasNoDataForSelectedPlants ? `\n⚠️ CRITICAL: NO MEANINGFUL DATA IN FILTERED DATASET\n- All complaint counts, deviations, and PPAP values are zero.\n- You MUST state clearly that there is no meaningful data to analyze.\n- Do NOT invent or reference data that doesn't exist.\n- Be honest and professional: "No quality data is available for the selected period and filters. Please adjust filters or verify data uploads."\n` : ''}

SITE CODE TO CITY/LOCATION MAPPING (from official "Webasto ET Plants.xlsx" file):
${siteCityMapping.length > 0 ? siteCityMapping : '- No city information available for sites'}
${validatedPlants.length > 0 ? `\nValidated Plants (found in official file): ${validatedPlants.join(', ')}` : ''}
${unvalidatedPlants.length > 0 ? `\nWARNING - Unvalidated Plants (not in official file): ${unvalidatedPlants.join(', ')}` : ''}
CRITICAL: Use this mapping to always include the city/location when mentioning any plant number in your analysis. Always reference the official plant data from "Webasto ET Plants.xlsx" file.

IMPORTANT: 
- The summary MUST reflect the filtered data context. If specific plants are selected, mention those plants. If a date range is filtered, reference that period.
- CRITICAL: The summary MUST directly correspond to and reference the METRICS DISPLAYED ON DASHBOARD TILES shown below. When mentioning complaints, deliveries, defective parts, or PPM values, use the exact values from the "METRICS DISPLAYED ON DASHBOARD TILES" section, not the raw KPI statistics. These metrics represent YTD (Year-to-Date) cumulative values that users see on the dashboard tiles.
- When discussing trends, reference the percentage changes shown in the metrics (e.g., "+5.2% vs previous period" or "-3.1% vs previous period").
- All statements must be professional, concise, and based strictly on the filtered data provided.
- The recommended actions MUST be based on the findings, anomalies, and trends identified in this specific filtered dataset. Do NOT provide generic actions that could apply to any quality system.
- ${hasNoDataForSelectedPlants || !hasMeaningfulData ? 'CRITICAL: If there is no data available, you MUST state this clearly and honestly. Do NOT invent data or reference plants that were not selected or have no data.' : 'If there is no meaningful data, state this clearly rather than inventing information.'}
- CRITICAL: When making statements about metrics, ensure they match the values displayed on the dashboard tiles. For example, if Customer Complaints shows "150" on the tile, your statement should reference "150 customer complaints", not a different number calculated from raw data.

METRICS DISPLAYED ON DASHBOARD TILES (YTD - Year-to-Date cumulative values):
${metrics?.customer ? `
CUSTOMER METRICS (displayed on Customer Metrics tiles):
- Customer Complaints (Q1): ${metrics.customer.complaints.toLocaleString()} ${metrics.customer.complaintsTrend !== 0 ? `(${metrics.customer.complaintsTrend > 0 ? '+' : ''}${metrics.customer.complaintsTrend.toFixed(1)}% vs previous period)` : '(no change)'}
- Customer Defective Parts: ${metrics.customer.defective.toLocaleString()} ${metrics.customer.defectiveTrend !== 0 ? `(${metrics.customer.defectiveTrend > 0 ? '+' : ''}${metrics.customer.defectiveTrend.toFixed(1)}% vs previous period)` : '(no change)'}
- Customer Deliveries: ${metrics.customer.deliveries.toLocaleString()} ${metrics.customer.deliveriesTrend !== 0 ? `(${metrics.customer.deliveriesTrend > 0 ? '+' : ''}${metrics.customer.deliveriesTrend.toFixed(1)}% vs previous period)` : '(no change)'}
- Customer PPM: ${metrics.customer.ppm.toFixed(2)} ${metrics.customer.ppmTrend !== 0 ? `(${metrics.customer.ppmTrend > 0 ? '+' : ''}${metrics.customer.ppmTrend.toFixed(1)}% vs previous period)` : '(no change)'}
` : ''}
${metrics?.supplier ? `
SUPPLIER METRICS (displayed on Supplier Metrics tiles):
- Supplier Complaints (Q2): ${metrics.supplier.complaints.toLocaleString()} ${metrics.supplier.complaintsTrend !== 0 ? `(${metrics.supplier.complaintsTrend > 0 ? '+' : ''}${metrics.supplier.complaintsTrend.toFixed(1)}% vs previous period)` : '(no change)'}
- Supplier Defective Parts: ${metrics.supplier.defective.toLocaleString()} ${metrics.supplier.defectiveTrend !== 0 ? `(${metrics.supplier.defectiveTrend > 0 ? '+' : ''}${metrics.supplier.defectiveTrend.toFixed(1)}% vs previous period)` : '(no change)'}
- Supplier Deliveries: ${metrics.supplier.deliveries.toLocaleString()} ${metrics.supplier.deliveriesTrend !== 0 ? `(${metrics.supplier.deliveriesTrend > 0 ? '+' : ''}${metrics.supplier.deliveriesTrend.toFixed(1)}% vs previous period)` : '(no change)'}
- Supplier PPM: ${metrics.supplier.ppm.toFixed(2)} ${metrics.supplier.ppmTrend !== 0 ? `(${metrics.supplier.ppmTrend > 0 ? '+' : ''}${metrics.supplier.ppmTrend.toFixed(1)}% vs previous period)` : '(no change)'}
` : ''}

COMPLAINT STATISTICS (from raw KPI data):
- Customer Complaints (Q1): ${totalQ1}
- Supplier Complaints (Q2): ${totalQ2}
- Internal Complaints (Q3): ${totalQ3}
- Deviations (D): ${totalDeviations}
- PPAP: ${totalPPAP} (In Progress: ${sortedKpis.reduce((sum, k) => sum + k.ppapP.inProgress, 0)}, Completed: ${sortedKpis.reduce((sum, k) => sum + k.ppapP.completed, 0)})

PPM STATISTICS:
${globalPpm ? `- Global Customer PPM: ${globalPpm.customerPpm !== null ? globalPpm.customerPpm.toFixed(2) : 'N/A'}` : ''}
${globalPpm ? `- Global Supplier PPM: ${globalPpm.supplierPpm !== null ? globalPpm.supplierPpm.toFixed(2) : 'N/A'}` : ''}
${avgCustomerPpm !== null ? `- Average Customer PPM: ${avgCustomerPpm.toFixed(2)}` : ''}
${avgSupplierPpm !== null ? `- Average Supplier PPM: ${avgSupplierPpm.toFixed(2)}` : ''}

ANOMALIES DETECTED:
${anomalies.length > 0 ? anomalies.map((a) => `- ${a}`).join('\n') : '- No significant anomalies detected'}

MONTHLY SITE DATA (all records):
${sortedKpis.map((k) => 
  `${k.month} | Site ${k.siteCode}${k.siteName ? ` (${k.siteName})` : ''} | Q1:${k.customerComplaintsQ1} Q2:${k.supplierComplaintsQ2} Q3:${k.internalComplaintsQ3} | Deviations:${k.deviationsD} | PPAP InProgress:${k.ppapP.inProgress} Completed:${k.ppapP.completed} | Customer PPM:${k.customerPpm !== null ? k.customerPpm.toFixed(2) : 'N/A'} | Supplier PPM:${k.supplierPpm !== null ? k.supplierPpm.toFixed(2) : 'N/A'}`
).join('\n')}

Provide your analysis in the requested JSON format.`;

  return { systemPrompt, userPrompt };
}

/**
 * Parse LLM response to extract JSON
 */
function parseLLMResponse(content: string): InterpretKpisResponse | null {
  if (!content || content.trim().length === 0) {
    console.error('Empty LLM response content');
    return null;
  }

  console.log('[parseLLMResponse] Raw content length:', content.length);
  console.log('[parseLLMResponse] Raw content preview (first 500 chars):', content.substring(0, 500));

  try {
    let jsonStr = content.trim();

    // Try to extract JSON from markdown code blocks (various formats)
    const jsonBlockMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonBlockMatch) {
      jsonStr = jsonBlockMatch[1].trim();
      console.log('[parseLLMResponse] Extracted JSON from code block');
    } else {
      // Find the first { and then find the matching closing }
      const firstBrace = content.indexOf('{');
      if (firstBrace !== -1) {
        let braceCount = 0;
        let endPos = firstBrace;
        let inString = false;
        let escapeNext = false;
        
        for (let i = firstBrace; i < content.length; i++) {
          const char = content[i];
          
          if (escapeNext) {
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            continue;
          }
          
          if (char === '"' && !escapeNext) {
            inString = !inString;
            continue;
          }
          
          if (!inString) {
            if (char === '{') {
              braceCount++;
            } else if (char === '}') {
              braceCount--;
              if (braceCount === 0) {
                endPos = i + 1;
                break;
              }
            }
          }
        }
        
        if (braceCount === 0 && endPos > firstBrace) {
          jsonStr = content.substring(firstBrace, endPos);
          console.log('[parseLLMResponse] Extracted JSON object from content using brace matching');
        } else {
          // Fallback: try regex (greedy match)
          const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
          if (jsonObjectMatch) {
            jsonStr = jsonObjectMatch[0];
            console.log('[parseLLMResponse] Extracted JSON object from content using regex fallback');
          }
        }
      }
    }

    jsonStr = jsonStr.trim();
    
    // Clean up common JSON issues
    // Remove trailing commas before closing braces/brackets
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
    // Fix unescaped newlines in strings (if any)
    jsonStr = jsonStr.replace(/([^\\])"/g, (match, p1) => {
      // Don't fix if it's already escaped
      return match;
    });

    console.log('[parseLLMResponse] JSON string to parse (first 500 chars):', jsonStr.substring(0, 500));
    console.log('[parseLLMResponse] JSON string length:', jsonStr.length);

    // Try to parse JSON
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('[parseLLMResponse] JSON.parse failed:', parseError);
      console.error('[parseLLMResponse] Attempting to fix common JSON issues...');
      
      // Try to fix common issues and parse again
      try {
        // Try removing any text before first { or after last }
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const cleaned = jsonStr.substring(firstBrace, lastBrace + 1);
          parsed = JSON.parse(cleaned);
          console.log('[parseLLMResponse] Successfully parsed after cleaning');
        } else {
          throw parseError;
        }
      } catch (secondError) {
        console.error('[parseLLMResponse] Second parse attempt also failed:', secondError);
        throw parseError; // Re-throw original error
      }
    }

    console.log('[parseLLMResponse] Successfully parsed JSON. Keys:', Object.keys(parsed));

    // Validate and normalize structure
    const result: InterpretKpisResponse = {
      summary: typeof parsed.summary === 'string' 
        ? parsed.summary 
        : (Array.isArray(parsed.summary) ? parsed.summary.join('\n') : 'No summary available'),
      trendsAndSiteComparison: typeof parsed.trendsAndSiteComparison === 'string' 
        ? parsed.trendsAndSiteComparison 
        : '',
      keyRisksAndAnomalies: typeof parsed.keyRisksAndAnomalies === 'string' 
        ? parsed.keyRisksAndAnomalies 
        : '',
      recommendedActions: Array.isArray(parsed.recommendedActions) 
        ? parsed.recommendedActions.filter((a: unknown) => typeof a === 'string')
        : [],
      opportunitiesAndHighlights: typeof parsed.opportunitiesAndHighlights === 'string' 
        ? parsed.opportunitiesAndHighlights 
        : '',
    };

    // Ensure summary is not empty
    if (!result.summary || result.summary.trim().length === 0) {
      console.warn('[parseLLMResponse] Summary is empty, attempting to extract from other fields');
      // Try to use first part of trendsAndSiteComparison as summary if available
      if (result.trendsAndSiteComparison) {
        const lines = result.trendsAndSiteComparison.split('\n').filter(l => l.trim());
        result.summary = lines.slice(0, 2).join('\n');
      }
    }

    return result;
  } catch (error) {
    console.error('[parseLLMResponse] Failed to parse LLM response:', error);
    console.error('[parseLLMResponse] Error details:', error instanceof Error ? error.message : String(error));
    console.error('[parseLLMResponse] Full content:', content);
    return null;
  }
}

/**
 * Validate and correct AI response content
 * Checks for contradictions, missing values, duplicate cities, and formatting issues
 */
function validateAndCorrectResponse(
  response: InterpretKpisResponse,
  monthlySiteKpis: MonthlySiteKpi[],
  plantsData: Array<{ code: string; city?: string; location?: string }>,
  metrics?: {
    customer?: { complaints: number; ppm: number };
    supplier?: { complaints: number; ppm: number };
  }
): InterpretKpisResponse {
  const corrected = { ...response };
  const issues: string[] = [];

  // Build plant code to city mapping
  const plantToCity = new Map<string, string>();
  plantsData.forEach(plant => {
    if (plant.code && (plant.city || plant.location)) {
      plantToCity.set(plant.code, plant.city || plant.location || '');
    }
  });

  // Helper to extract plant codes and cities from text
  const extractPlantMentions = (text: string): Array<{ code: string; city?: string; fullText: string }> => {
    const mentions: Array<{ code: string; city?: string; fullText: string }> = [];
    // Match patterns like "Site 145 (Vienna)", "Plant 235 in Kampen", "Site 410", etc.
    const patterns = [
      /(?:Site|Plant)\s+(\d+)\s*\(([^)]+)\)/gi,
      /(?:Site|Plant)\s+(\d+)\s+in\s+([^,.\n]+)/gi,
      /(?:Site|Plant)\s+(\d+)(?:\s|$)/gi,
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const code = match[1];
        const city = match[2]?.trim();
        mentions.push({ code, city, fullText: match[0] });
      }
    });
    
    return mentions;
  };

  // Helper to check for contradictions (same plant/metric mentioned as both positive and negative)
  const checkContradictions = (text: string, sectionName: string): string[] => {
    const contradictions: string[] = [];
    const plantMentions = extractPlantMentions(text);
    const plantSentiments = new Map<string, { positive: boolean; negative: boolean; mentions: string[] }>();
    
    // Check for positive/negative keywords
    const positiveKeywords = ['improving', 'improved', 'excellent', 'best', 'lowest', 'good', 'strong', 'positive', 'decreased', 'reduced', 'declined', 'better'];
    const negativeKeywords = ['spike', 'increase', 'rise', 'worsen', 'critical', 'risk', 'concern', 'issue', 'problem', 'high', 'worst', 'highest', 'increased', 'worse'];
    
    plantMentions.forEach(mention => {
      if (!plantSentiments.has(mention.code)) {
        plantSentiments.set(mention.code, { positive: false, negative: false, mentions: [] });
      }
      const sentiment = plantSentiments.get(mention.code)!;
      sentiment.mentions.push(mention.fullText);
      
      // Check context around the mention
      const mentionIndex = text.indexOf(mention.fullText);
      const context = text.substring(Math.max(0, mentionIndex - 100), Math.min(text.length, mentionIndex + mention.fullText.length + 100)).toLowerCase();
      
      const hasPositive = positiveKeywords.some(kw => context.includes(kw));
      const hasNegative = negativeKeywords.some(kw => context.includes(kw));
      
      if (hasPositive) sentiment.positive = true;
      if (hasNegative) sentiment.negative = true;
    });
    
    // Find contradictions
    plantSentiments.forEach((sentiment, code) => {
      if (sentiment.positive && sentiment.negative) {
        contradictions.push(`Plant ${code} mentioned as both positive and negative in ${sectionName}`);
      }
    });
    
    return contradictions;
  };

  // Helper to check for missing values (mentions metrics but no numbers)
  const checkMissingValues = (text: string, sectionName: string): string[] => {
    const issues: string[] = [];
    // Check for PPM mentions without values
    const ppmMentions = text.match(/PPM|ppm/g);
    if (ppmMentions) {
      // Check if values are mentioned near PPM
      const hasValues = /\d+\.?\d*\s*(?:PPM|ppm)|PPM|ppm.*\d+\.?\d*/i.test(text);
      if (!hasValues && ppmMentions.length > 0) {
        issues.push(`${sectionName}: PPM mentioned but no values provided`);
      }
    }
    
    // Check for complaint mentions without counts
    const complaintKeywords = /complaint|notification|defect/i.test(text);
    if (complaintKeywords) {
      // Check if numbers are mentioned
      const hasNumbers = /\d+\s*(?:complaint|notification|defect)|complaint|notification|defect.*\d+/i.test(text);
      if (!hasNumbers) {
        issues.push(`${sectionName}: Complaints/defects mentioned but no counts provided`);
      }
    }
    
    // Check for month/year mentions - ensure temporal context is provided
    const monthNames = /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/i;
    const hasMonthYear = monthNames.test(text);
    
    // If text mentions metrics, trends, or events, it should have month/year
    const hasMetricsOrTrends = /(?:PPM|complaint|notification|defect|trend|improved|increased|decreased|spike|anomaly|metric|value|Site|Plant)/i.test(text);
    if (hasMetricsOrTrends && !hasMonthYear) {
      issues.push(`${sectionName}: Metrics/trends mentioned but no month and year provided`);
    }
    
    return issues;
  };

  // Helper to check for duplicate cities (same city mentioned twice for same plant)
  const checkDuplicateCities = (text: string, sectionName: string): string[] => {
    const issues: string[] = [];
    const plantMentions = extractPlantMentions(text);
    const plantCities = new Map<string, Set<string>>();
    
    plantMentions.forEach(mention => {
      if (!plantCities.has(mention.code)) {
        plantCities.set(mention.code, new Set());
      }
      if (mention.city) {
        plantCities.get(mention.code)!.add(mention.city.toLowerCase());
      }
    });
    
    // Check for same city mentioned multiple times for same plant
    plantCities.forEach((cities, code) => {
      if (cities.size > 1) {
        issues.push(`${sectionName}: Plant ${code} has multiple different cities mentioned: ${Array.from(cities).join(', ')}`);
      }
    });
    
    // Check for duplicate city mentions in same sentence/context
    const sentences = text.split(/[.!?]\s+/);
    sentences.forEach((sentence, idx) => {
      const sentenceMentions = extractPlantMentions(sentence);
      const cityCounts = new Map<string, number>();
      sentenceMentions.forEach(m => {
        if (m.city) {
          const key = `${m.code}-${m.city.toLowerCase()}`;
          cityCounts.set(key, (cityCounts.get(key) || 0) + 1);
        }
      });
      cityCounts.forEach((count, key) => {
        if (count > 1) {
          issues.push(`${sectionName}: Duplicate city mention for ${key} in same context`);
        }
      });
    });
    
    return issues;
  };

  // Helper to ensure plant code + city format
  const fixPlantFormat = (text: string): string => {
    let fixed = text;
    // Find mentions like "Site 145" or "Plant 235" without city
    const plantWithoutCity = /(?:Site|Plant)\s+(\d+)(?:\s|$|,|\.)/gi;
    let match;
    const replacements: Array<{ from: string; to: string }> = [];
    
    while ((match = plantWithoutCity.exec(text)) !== null) {
      const code = match[1];
      const city = plantToCity.get(code);
      if (city && !text.substring(Math.max(0, match.index - 50), match.index + match[0].length + 50).includes(city)) {
        // City not mentioned nearby, add it
        const replacement = match[0].replace(/(\d+)(\s|$|,|\.)/, `$1 (${city})$2`);
        replacements.push({ from: match[0], to: replacement });
      }
    }
    
    // Apply replacements in reverse order to maintain indices
    replacements.reverse().forEach(({ from, to }) => {
      fixed = fixed.replace(from, to);
    });
    
    return fixed;
  };

  // Validate each section
  const sections = [
    { name: 'summary', text: corrected.summary },
    { name: 'trendsAndSiteComparison', text: corrected.trendsAndSiteComparison },
    { name: 'keyRisksAndAnomalies', text: corrected.keyRisksAndAnomalies },
    { name: 'opportunitiesAndHighlights', text: corrected.opportunitiesAndHighlights },
  ];

  // Track plant sentiments across all sections to detect cross-section contradictions
  const allPlantSentiments = new Map<string, { positive: boolean; negative: boolean; sections: string[] }>();

  sections.forEach(section => {
    // Check contradictions within section
    const contradictions = checkContradictions(section.text, section.name);
    if (contradictions.length > 0) {
      issues.push(...contradictions);
      console.warn(`[validateAndCorrectResponse] Contradictions found in ${section.name}:`, contradictions);
    }

    // Track plant sentiments for cross-section contradiction detection
    const plantMentions = extractPlantMentions(section.text);
    const positiveKeywords = ['improving', 'improved', 'excellent', 'best', 'lowest', 'good', 'strong', 'positive', 'decreased', 'reduced', 'declined', 'better'];
    const negativeKeywords = ['spike', 'increase', 'rise', 'worsen', 'critical', 'risk', 'concern', 'issue', 'problem', 'high', 'worst', 'highest', 'increased', 'worse'];
    
    plantMentions.forEach(mention => {
      if (!allPlantSentiments.has(mention.code)) {
        allPlantSentiments.set(mention.code, { positive: false, negative: false, sections: [] });
      }
      const sentiment = allPlantSentiments.get(mention.code)!;
      if (!sentiment.sections.includes(section.name)) {
        sentiment.sections.push(section.name);
      }
      
      const mentionIndex = section.text.indexOf(mention.fullText);
      const context = section.text.substring(Math.max(0, mentionIndex - 100), Math.min(section.text.length, mentionIndex + mention.fullText.length + 100)).toLowerCase();
      
      if (positiveKeywords.some(kw => context.includes(kw))) sentiment.positive = true;
      if (negativeKeywords.some(kw => context.includes(kw))) sentiment.negative = true;
    });

    // Check missing values
    const missingValues = checkMissingValues(section.text, section.name);
    if (missingValues.length > 0) {
      issues.push(...missingValues);
      console.warn(`[validateAndCorrectResponse] Missing values in ${section.name}:`, missingValues);
    }

    // Check duplicate cities
    const duplicateCities = checkDuplicateCities(section.text, section.name);
    if (duplicateCities.length > 0) {
      issues.push(...duplicateCities);
      console.warn(`[validateAndCorrectResponse] Duplicate cities in ${section.name}:`, duplicateCities);
    }

    // Fix plant format (add city if missing)
    if (section.name === 'summary') {
      corrected.summary = fixPlantFormat(corrected.summary);
    } else if (section.name === 'trendsAndSiteComparison') {
      corrected.trendsAndSiteComparison = fixPlantFormat(corrected.trendsAndSiteComparison);
    } else if (section.name === 'keyRisksAndAnomalies') {
      corrected.keyRisksAndAnomalies = fixPlantFormat(corrected.keyRisksAndAnomalies);
    } else if (section.name === 'opportunitiesAndHighlights') {
      corrected.opportunitiesAndHighlights = fixPlantFormat(corrected.opportunitiesAndHighlights);
    }
  });

  // Check for cross-section contradictions (plant mentioned as positive in one section, negative in another)
  allPlantSentiments.forEach((sentiment, code) => {
    if (sentiment.positive && sentiment.negative && sentiment.sections.length > 1) {
      issues.push(`Plant ${code} mentioned as both positive (in ${sentiment.sections.filter((_, i) => {
        const section = sections.find(s => s.name === sentiment.sections[i]);
        if (!section) return false;
        const plantMentions = extractPlantMentions(section.text);
        const mention = plantMentions.find(m => m.code === code);
        if (!mention) return false;
        const mentionIndex = section.text.indexOf(mention.fullText);
        const context = section.text.substring(Math.max(0, mentionIndex - 100), Math.min(section.text.length, mentionIndex + mention.fullText.length + 100)).toLowerCase();
        return ['improving', 'improved', 'excellent', 'best', 'lowest', 'good', 'strong', 'positive', 'decreased', 'reduced', 'declined', 'better'].some(kw => context.includes(kw));
      }).join(', ')}) and negative (in ${sentiment.sections.filter((_, i) => {
        const section = sections.find(s => s.name === sentiment.sections[i]);
        if (!section) return false;
        const plantMentions = extractPlantMentions(section.text);
        const mention = plantMentions.find(m => m.code === code);
        if (!mention) return false;
        const mentionIndex = section.text.indexOf(mention.fullText);
        const context = section.text.substring(Math.max(0, mentionIndex - 100), Math.min(section.text.length, mentionIndex + mention.fullText.length + 100)).toLowerCase();
        return ['spike', 'increase', 'rise', 'worsen', 'critical', 'risk', 'concern', 'issue', 'problem', 'high', 'worst', 'highest', 'increased', 'worse'].some(kw => context.includes(kw));
      }).join(', ')}) across different sections`);
      console.warn(`[validateAndCorrectResponse] Cross-section contradiction detected for Plant ${code}`);
    }
  });

  if (issues.length > 0) {
    console.warn('[validateAndCorrectResponse] Validation issues found:', issues);
  }

  return corrected;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as InterpretKpisRequest;

    console.log('[interpret-kpis] Request received');
    console.log('[interpret-kpis] KPIs count:', body.monthlySiteKpis?.length || 0);
    console.log('[interpret-kpis] AI_API_KEY exists:', !!process.env.AI_API_KEY);
    console.log('[interpret-kpis] AI_PROVIDER:', process.env.AI_PROVIDER || 'openai (default)');

    if (!body.monthlySiteKpis || !Array.isArray(body.monthlySiteKpis)) {
      console.error('[interpret-kpis] Invalid request: missing or invalid monthlySiteKpis');
      return NextResponse.json(
        { error: 'Missing or invalid monthlySiteKpis array' },
        { status: 400 }
      );
    }

    if (body.monthlySiteKpis.length === 0) {
      console.warn('[interpret-kpis] Empty KPIs array received');
      return NextResponse.json<InterpretKpisResponse>(
        {
          summary: 'No data available to analyze. Please ensure filters are set correctly.',
          trendsAndSiteComparison: '',
          keyRisksAndAnomalies: '',
          recommendedActions: [],
          opportunitiesAndHighlights: '',
          error: 'No KPIs provided',
        },
        { status: 200 }
      );
    }

    // Create LLM client
    const llmClient = createLLMClient();

    if (!llmClient) {
      console.error('[interpret-kpis] LLM client not created - AI_API_KEY missing or invalid');
      return NextResponse.json<InterpretKpisResponse>(
        {
          summary: 'AI analysis is not configured. Please set AI_API_KEY environment variable.',
          trendsAndSiteComparison: '',
          keyRisksAndAnomalies: '',
          recommendedActions: [],
          opportunitiesAndHighlights: '',
          error: 'AI_API_KEY not configured',
          errorType: 'api_key',
        },
        { status: 200 } // Return 200 but with error message
      );
    }

    console.log('[interpret-kpis] LLM client created successfully, provider:', process.env.AI_PROVIDER || 'openai');

    // Build prompt
    const { systemPrompt, userPrompt } = buildAnalysisPrompt(
      body.monthlySiteKpis,
      body.globalPpm,
      body.selectedSites,
      body.selectedMonths,
      body.filterContext,
      body.metrics
    );

    // Call LLM
    console.log('[interpret-kpis] Calling LLM with', body.monthlySiteKpis.length, 'KPIs');
    console.log('[interpret-kpis] System prompt length:', systemPrompt.length);
    console.log('[interpret-kpis] User prompt length:', userPrompt.length);
    
    const llmResponse = await llmClient.chat({
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      // Don't pass temperature - some models don't support it
      maxTokens: 3000, // Increased for more detailed analysis
    });

    console.log('[interpret-kpis] LLM call completed, has error:', !!llmResponse.error);

    if (llmResponse.error) {
      console.error('LLM API error:', llmResponse.error);
      
      // Generate user-friendly error message based on error type
      let userFriendlyMessage = 'Failed to generate AI insights due to API error.';
      let helpText = '';
      
      if (llmResponse.errorType === 'api_key') {
        userFriendlyMessage = 'AI API key is invalid or expired.';
        helpText = 'Please check your AI_API_KEY in the environment variables. You can find your API key at https://platform.openai.com/account/api-keys (for OpenAI) or https://console.anthropic.com/ (for Anthropic).';
      } else if (llmResponse.errorType === 'rate_limit') {
        userFriendlyMessage = 'AI API rate limit exceeded.';
        helpText = 'Please wait a moment and try again, or check your API usage limits.';
      } else if (llmResponse.errorType === 'network') {
        userFriendlyMessage = 'Network error connecting to AI service.';
        helpText = 'Please check your internet connection and try again.';
      }
      
      return NextResponse.json<InterpretKpisResponse>(
        {
          summary: userFriendlyMessage,
          trendsAndSiteComparison: '',
          keyRisksAndAnomalies: '',
          recommendedActions: [],
          opportunitiesAndHighlights: '',
          error: helpText || llmResponse.error,
          errorType: llmResponse.errorType,
          errorDetails: llmResponse.errorDetails,
        },
        { status: 500 }
      );
    }

    // Parse response
    console.log('[interpret-kpis] LLM response received, content length:', llmResponse.content?.length || 0);
    console.log('[interpret-kpis] LLM response preview (first 500 chars):', llmResponse.content?.substring(0, 500));
    
    if (!llmResponse.content || llmResponse.content.trim().length === 0) {
      console.error('[interpret-kpis] Empty content received from LLM');
      return NextResponse.json<InterpretKpisResponse>(
        {
          summary: 'AI service returned empty response. Please try again.',
          trendsAndSiteComparison: '',
          keyRisksAndAnomalies: '',
          recommendedActions: [],
          opportunitiesAndHighlights: '',
          error: 'Empty response from AI service',
          errorType: 'unknown',
        },
        { status: 500 }
      );
    }
    
    let parsed = parseLLMResponse(llmResponse.content);

    if (!parsed) {
      console.error('[interpret-kpis] Failed to parse LLM response');
      console.error('[interpret-kpis] Full response content:', llmResponse.content);
      
      // Try to extract at least a summary from the raw content
      let fallbackSummary = 'AI analysis is processing your data.';
      if (llmResponse.content) {
        // Try to extract any meaningful text
        const textLines = llmResponse.content.split('\n').filter(l => l.trim() && !l.trim().startsWith('```') && !l.trim().startsWith('{') && !l.trim().startsWith('}'));
        if (textLines.length > 0) {
          // Take first few meaningful lines
          const meaningfulLines = textLines.filter(l => l.length > 20).slice(0, 3);
          if (meaningfulLines.length > 0) {
            fallbackSummary = meaningfulLines.join(' ').substring(0, 300);
          }
        }
      }
      
      // Try to extract structured information even if JSON parsing failed
      let fallbackTrends = '';
      let fallbackRisks = '';
      let fallbackActions: string[] = [];
      let fallbackOpportunities = '';
      
      if (llmResponse.content) {
        const content = llmResponse.content.trim();
        
        // Extract trends
        const trendsMatch = content.match(/"trendsAndSiteComparison"\s*:\s*"([^"]+)"/i) ||
                           content.match(/trends?[:\s]+([^\n]+)/i);
        if (trendsMatch) {
          fallbackTrends = trendsMatch[1].trim().replace(/^["']|["']$/g, '');
        }
        
        // Extract risks
        const risksMatch = content.match(/"keyRisksAndAnomalies"\s*:\s*"([^"]+)"/i) ||
                          content.match(/risks?[:\s]+([^\n]+)/i);
        if (risksMatch) {
          fallbackRisks = risksMatch[1].trim().replace(/^["']|["']$/g, '');
        }
        
        // Extract actions - look for array or list
        const actionsMatch = content.match(/"recommendedActions"\s*:\s*\[([^\]]+)\]/i) ||
                           content.match(/actions?[:\s]+\[([^\]]+)\]/i);
        if (actionsMatch) {
          const actionsStr = actionsMatch[1];
          // Try to extract individual action strings
          const actionItems = actionsStr.match(/"([^"]+)"/g);
          if (actionItems) {
            fallbackActions = actionItems.map(a => a.replace(/^"|"$/g, ''));
          }
        }
        
        // If we still don't have a good summary, try to extract first meaningful paragraph
        if (fallbackSummary === 'AI analysis is processing your data.' || fallbackSummary.length < 50) {
          const textLines = content.split('\n').filter(l => {
            const trimmed = l.trim();
            return trimmed && 
                   trimmed.length > 30 && 
                   !trimmed.startsWith('```') && 
                   !trimmed.startsWith('{') && 
                   !trimmed.startsWith('}') &&
                   !trimmed.match(/^["\s]*$/);
          });
          if (textLines.length > 0) {
            // Take first few meaningful lines
            const meaningfulLines = textLines.slice(0, 3);
            fallbackSummary = meaningfulLines.join(' ').substring(0, 500);
          }
        }
      }
      
      // Return partial data without error field - treat as partial success
      console.warn('[interpret-kpis] Returning fallback response due to parsing failure, but extracted some content');
      return NextResponse.json<InterpretKpisResponse>(
        {
          summary: fallbackSummary,
          trendsAndSiteComparison: fallbackTrends,
          keyRisksAndAnomalies: fallbackRisks,
          recommendedActions: fallbackActions,
          opportunitiesAndHighlights: fallbackOpportunities,
          // Don't set error field - return partial success instead
        },
        { status: 200 } // Return 200 with partial data rather than error
      );
    }

    console.log('[interpret-kpis] Successfully parsed response, summary length:', parsed.summary?.length || 0);
    // Validate and correct the response before returning
    const plantsData = loadPlants();
    const validated = validateAndCorrectResponse(
      parsed,
      body.monthlySiteKpis,
      plantsData,
      body.metrics
    );

    return NextResponse.json<InterpretKpisResponse>(validated);
  } catch (error) {
    console.error('Error in interpret-kpis endpoint:', error);
    return NextResponse.json<InterpretKpisResponse>(
      {
        summary: 'An unexpected error occurred while generating insights.',
        trendsAndSiteComparison: '',
        keyRisksAndAnomalies: '',
        recommendedActions: [],
        opportunitiesAndHighlights: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
