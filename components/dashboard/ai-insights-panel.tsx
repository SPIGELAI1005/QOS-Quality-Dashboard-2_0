"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Loader2, 
  AlertCircle, 
  Lightbulb, 
  Trophy, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw
} from "lucide-react";
import type { MonthlySiteKpi } from "@/lib/domain/types";

interface PlantData {
  code: string;
  name: string;
  erp?: string;
  city?: string;
  abbreviation?: string;
  country?: string;
  location?: string;
}

interface AIInsightsPanelProps {
  monthlySiteKpis: MonthlySiteKpi[];
  globalPpm?: {
    customerPpm: number | null;
    supplierPpm: number | null;
  };
  selectedSites?: string[];
  selectedMonths?: string[];
  plantsData?: PlantData[];
}

interface AIInsights {
  summary: string;
  trendsAndSiteComparison: string;
  keyRisksAndAnomalies: string;
  recommendedActions: string[];
  opportunitiesAndHighlights: string;
  error?: string;
}

// Helper function to format numbers in German locale
const formatGermanNumber = (num: number, decimals: number = 0): string => {
  return num.toLocaleString('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

// Helper function to parse and format a number string (handles both US and German formats)
const parseAndFormatNumber = (valueStr: string, decimals: number = 2): string => {
  if (!valueStr || valueStr === 'N/A') return valueStr;
  
  // Remove any non-numeric characters except comma and dot
  const cleaned = valueStr.trim().replace(/[^\d,.-]/g, '');
  
  // Check if it has a comma - likely German format (comma as decimal separator)
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    // German format: 1234,56 -> parse as 1234.56
    const num = parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
    if (!isNaN(num)) {
      return formatGermanNumber(num, decimals);
    }
  }
  
  // Check if it has a dot - could be US format or German thousands separator
  if (cleaned.includes('.')) {
    // If there's a comma after the dot, it's likely German thousands (1.234,56)
    if (cleaned.includes(',')) {
      const num = parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
      if (!isNaN(num)) {
        return formatGermanNumber(num, decimals);
      }
    } else {
      // US format: 1234.56 -> parse as 1234.56
      const num = parseFloat(cleaned);
      if (!isNaN(num)) {
        return formatGermanNumber(num, decimals);
      }
    }
  }
  
  // No decimal separator - just an integer
  const num = parseFloat(cleaned.replace(/[^\d-]/g, ''));
  if (!isNaN(num)) {
    return formatGermanNumber(num, decimals);
  }
  
  // If all parsing fails, return original
  return valueStr;
};

// Parse text to extract structured data - always return up to 5 findings
// Ensures no site appears more than twice, and findings are diverse (unless only one site is selected)
const parseKeyFindings = (summary: string, selectedSites?: string[]): string[] => {
  if (!summary) return [];
  
  const cleaned = summary.replace(/[\r]/g, '').trim();
  let findings: string[] = [];

  const collect = (arr: string[], minLen = 5) =>
    arr
      .map(s => s.trim())
      .filter(s => s.length >= minLen)
      .map(s => s.replace(/^[\d•\-\*\)\.\s]+/, '').trim());

  // Strategy 1: line breaks
  findings = collect(cleaned.split(/\n+/), 5);

  // Strategy 2: bullets
  if (findings.length < 5) {
    findings = collect(cleaned.split(/[•\-\*]\s+/), 5);
  }

  // Strategy 3: numbered list
  if (findings.length < 5) {
    findings = collect(cleaned.split(/\d+[\.\)]\s+/), 5);
  }

  // Strategy 4: sentences (period + space + capital)
  if (findings.length < 5) {
    findings = collect(cleaned.split(/\.\s+(?=[A-Z])/), 5).map(s => s.endsWith('.') ? s : `${s}.`);
  }

  // Strategy 5: any period
  if (findings.length < 5) {
    findings = collect(cleaned.split(/\./), 5).map(s => s.endsWith('.') ? s : `${s}.`);
  }

  // Final fallback: split by comma if still empty
  if (findings.length === 0 && cleaned.length > 0) {
    findings = collect(cleaned.split(/,/), 3);
  }

  // Filter findings to ensure diversity and limit site mentions
  const siteCounts: Record<string, number> = {};
  const filteredFindings: string[] = [];
  const isSingleSiteSelected = selectedSites && selectedSites.length === 1;

  // Extract site number from a finding
  const extractSiteFromFinding = (finding: string): string | null => {
    const siteMatch = finding.match(/Site\s+(\d+)|site\s+(\d+)|(\d{3})\b/i);
    return siteMatch ? (siteMatch[1] || siteMatch[2] || siteMatch[3]) : null;
  };

  for (const finding of findings) {
    const siteNum = extractSiteFromFinding(finding);
    
    if (siteNum) {
      // If only one site is selected, allow unlimited mentions of that site
      if (isSingleSiteSelected && selectedSites[0] === siteNum) {
        filteredFindings.push(finding);
        continue;
      }
      
      // Otherwise, limit each site to maximum 2 mentions
      const currentCount = siteCounts[siteNum] || 0;
      if (currentCount < 2) {
        siteCounts[siteNum] = currentCount + 1;
        filteredFindings.push(finding);
      }
    } else {
      // Findings without specific site mentions are always included
      filteredFindings.push(finding);
    }
    
    // Stop when we have 5 findings
    if (filteredFindings.length >= 5) break;
  }

  // If we have fewer than 5 findings, try to add more from the original list
  // but still respecting the site limit
  if (filteredFindings.length < 5) {
    for (const finding of findings) {
      if (filteredFindings.length >= 5) break;
      if (filteredFindings.includes(finding)) continue; // Skip already added
      
      const siteNum = extractSiteFromFinding(finding);
      if (siteNum) {
        if (isSingleSiteSelected && selectedSites[0] === siteNum) {
          filteredFindings.push(finding);
        } else if ((siteCounts[siteNum] || 0) < 2) {
          siteCounts[siteNum] = (siteCounts[siteNum] || 0) + 1;
          filteredFindings.push(finding);
        }
      } else {
        filteredFindings.push(finding);
      }
    }
  }

  // Ensure we have at least some findings (up to 5)
  return filteredFindings.slice(0, 5);
};

const parseTopPerformers = (text: string): Array<{site: string; value: string; description: string; metric: string}> => {
  const performers: Array<{site: string; value: string; description: string; metric: string}> = [];
  if (!text) return performers;
  
  // Try to extract site numbers and PPM values - look for patterns like "Site 175 with 20.05 PPM" or "Site 235 (23.09 PPM)"
  const patterns = [
    /Site\s+(\d+)[^\d]*?(\d+[.,]\d+)\s*PPM/gi,
    /Site\s+(\d+)[^.]*?(\d+[.,]\d+)[^.]*?PPM/gi,
    /(\d+[.,]\d+)\s*PPM[^.]*?Site\s+(\d+)/gi,
    /site\s+(\d+)[^\d]*?(\d+[.,]\d+)\s*ppm/gi,
    /(\d+)\s+.*?(\d+[.,]\d+)\s*PPM/gi
  ];
  
  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      matches.slice(0, 3).forEach(match => {
        const siteNum = match[1] || match[2];
        const value = match[2] || match[1];
        if (siteNum && value && !performers.find(p => p.site === siteNum)) {
          // Find the sentence containing this site
          const sentences = text.split(/[.!?]+/);
          const relevantSentence = sentences.find(s => 
            s.includes(`Site ${siteNum}`) || s.includes(`site ${siteNum}`) || s.includes(` ${siteNum} `)
          ) || match[0];
          
          performers.push({
            site: siteNum,
            value: parseAndFormatNumber(value, 2),
            description: relevantSentence.trim() || `Site ${siteNum} with ${value} PPM`,
            metric: 'PPM'
          });
        }
      });
      if (performers.length >= 3) break;
    }
  }
  
  // If still no matches, try to extract from sentences mentioning "lowest", "best", "top", "high-performing"
  if (performers.length < 2) {
    const sentences = text.split(/[.!?]+/).filter(s => 
      /lowest|best|top|excellent|strong|good|high-performing|performing|low\s+PPM/i.test(s) && /\d+/.test(s)
    );
    sentences.slice(0, 3).forEach((sentence) => {
      const siteMatch = sentence.match(/Site\s+(\d+)|site\s+(\d+)|(\d{3})\s+/i);
      const valueMatch = sentence.match(/(\d+[.,]\d+)\s*PPM|PPM[:\s]+(\d+[.,]\d+)/i);
      if (siteMatch) {
        const siteNum = siteMatch[1] || siteMatch[2] || siteMatch[3];
        if (siteNum && !performers.find(p => p.site === siteNum)) {
          const value = valueMatch ? parseAndFormatNumber(valueMatch[1] || valueMatch[2], 2) : 'N/A';
          performers.push({
            site: siteNum,
            value: value,
            description: sentence.trim(),
            metric: 'PPM'
          });
        }
      }
    });
  }
  
  // Return 2-3 performers (prefer 3, but allow 2 if not enough data)
  return performers.slice(0, 3);
};

const parseNeedsAttention = (text: string): Array<{site: string; value: string; description: string; metric: string}> => {
  const needsAttention: Array<{site: string; value: string; description: string; metric: string}> = [];
  if (!text) return needsAttention;
  
  // Extract high PPM sites - look for patterns like "Site 411 with 1102.87 PPM" or "extremely high PPM"
  const highPpmPatterns = [
    /Site\s+(\d+)[^\d]*?(\d+[.,]\d+)\s*PPM/gi,
    /Site\s+(\d+)[^.]*?(\d+[.,]\d+)[^.]*?PPM/gi,
    /(\d+[.,]\d+)\s*PPM[^.]*?Site\s+(\d+)/gi
  ];
  
  for (const pattern of highPpmPatterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      matches.slice(0, 2).forEach(match => {
        const siteNum = match[1] || match[2];
        const value = match[2] || match[1];
        if (siteNum && value) {
          const sentences = text.split(/[.!?]+/);
          const relevantSentence = sentences.find(s => 
            (s.includes(`Site ${siteNum}`) || s.includes(`site ${siteNum}`)) &&
            (/high|extreme|severe|outlier|problem/i.test(s))
          ) || match[0];
          
          needsAttention.push({
            site: siteNum,
            value: parseAndFormatNumber(value, 2),
            description: relevantSentence.trim() || `Site ${siteNum} with ${value} PPM`,
            metric: 'PPM'
          });
        }
      });
      if (needsAttention.length >= 2) break;
    }
  }
  
  // Extract complaint sites if we need more
  if (needsAttention.length < 3) {
    const complaintPatterns = [
      /Site\s+(\d+)[^\d]*?(\d+)\s*complaints?/gi,
      /(\d+)\s*complaints?[^.]*?Site\s+(\d+)/gi
    ];
    
    for (const pattern of complaintPatterns) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        matches.slice(0, 3 - needsAttention.length).forEach(match => {
          const siteNum = match[1] || match[2];
          const value = match[2] || match[1];
          if (siteNum && value) {
            const sentences = text.split(/[.!?]+/);
            const relevantSentence = sentences.find(s => 
              s.includes(`Site ${siteNum}`) && s.includes('complaint')
            ) || match[0];
            
            needsAttention.push({
              site: siteNum,
              value: formatGermanNumber(parseInt(value), 0),
              description: relevantSentence.trim() || `Site ${siteNum} with ${value} complaints`,
              metric: 'Complaints'
            });
          }
        });
        if (needsAttention.length >= 3) break;
      }
    }
  }
  
  // Return 2-3 items (prefer 3, but allow 2 if not enough data)
  return needsAttention.slice(0, 3);
};

// Generate professional anomaly statements from monthly KPI data
const generateAnomaliesFromData = (monthlySiteKpis: MonthlySiteKpi[]): Array<{title: string; date: string; percentage: string; description: string; trend: 'up' | 'down'}> => {
  if (monthlySiteKpis.length === 0) return [];
  
  const anomalies: Array<{title: string; date: string; percentage: string; description: string; trend: 'up' | 'down'}> = [];
  
  // Sort by month
  const sortedKpis = [...monthlySiteKpis].sort((a, b) => a.month.localeCompare(b.month));
  
  // Group by site and calculate month-over-month changes
  const siteData: Record<string, Array<{month: string; customerPpm: number | null; supplierPpm: number | null; siteName?: string}>> = {};
  
  sortedKpis.forEach(kpi => {
    if (!siteData[kpi.siteCode]) {
      siteData[kpi.siteCode] = [];
    }
    siteData[kpi.siteCode].push({
      month: kpi.month,
      customerPpm: kpi.customerPpm,
      supplierPpm: kpi.supplierPpm,
      siteName: kpi.siteName
    });
  });
  
  // Find significant PPM changes (spikes or drops)
  Object.entries(siteData).forEach(([siteCode, months]) => {
    for (let i = 1; i < months.length; i++) {
      const prev = months[i - 1];
      const curr = months[i];
      
      // Check customer PPM changes
      if (prev.customerPpm !== null && curr.customerPpm !== null && prev.customerPpm > 0) {
        const change = ((curr.customerPpm - prev.customerPpm) / prev.customerPpm) * 100;
        const absChange = Math.abs(change);
        
        // Significant spike (>30% increase) or significant drop (>30% decrease)
        if (absChange > 30) {
          const monthName = new Date(curr.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          const prevMonthName = new Date(prev.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          
          if (change > 0) {
            // Check if this is the highest PPM in the period
            const allCustomerPpms = months.map(m => m.customerPpm).filter((p): p is number => p !== null);
            const isHighest = curr.customerPpm === Math.max(...allCustomerPpms);
            const periodLength = allCustomerPpms.length;
            const periodText = periodLength > 1 ? `the ${periodLength}-month period` : 'the period';
            
            anomalies.push({
              title: `Site ${siteCode}${curr.siteName ? ` (${curr.siteName})` : ''}`,
              date: monthName,
              percentage: `+${formatGermanNumber(change, 1)}%`,
              description: `Customer PPM spiked to ${formatGermanNumber(curr.customerPpm, 2)} from ${formatGermanNumber(prev.customerPpm, 2)} in ${prevMonthName}${isHighest ? `, marking the highest Customer PPM in ${periodText}` : ', marking a significant increase'}.`,
              trend: 'up'
            });
          } else {
            // Check if this is the lowest PPM in the period
            const allCustomerPpms = months.map(m => m.customerPpm).filter((p): p is number => p !== null);
            const isLowest = curr.customerPpm === Math.min(...allCustomerPpms);
            const periodLength = allCustomerPpms.length;
            const periodText = periodLength > 1 ? `the ${periodLength}-month period` : 'the period';
            
            anomalies.push({
              title: `Site ${siteCode}${curr.siteName ? ` (${curr.siteName})` : ''}`,
              date: monthName,
              percentage: `${formatGermanNumber(change, 1)}%`,
              description: `Customer PPM dropped significantly to ${formatGermanNumber(curr.customerPpm, 2)} from ${formatGermanNumber(prev.customerPpm, 2)} in ${prevMonthName}${isLowest ? `, representing the lowest Customer PPM recorded in ${periodText}` : ', representing a substantial improvement'}.`,
              trend: 'down'
            });
          }
        }
      }
      
      // Check supplier PPM changes
      if (prev.supplierPpm !== null && curr.supplierPpm !== null && prev.supplierPpm > 0) {
        const change = ((curr.supplierPpm - prev.supplierPpm) / prev.supplierPpm) * 100;
        const absChange = Math.abs(change);
        
        if (absChange > 30) {
          const monthName = new Date(curr.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          const prevMonthName = new Date(prev.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          
          if (change > 0) {
            // Check if this is the highest PPM in the period
            const allSupplierPpms = months.map(m => m.supplierPpm).filter((p): p is number => p !== null);
            const isHighest = curr.supplierPpm === Math.max(...allSupplierPpms);
            const periodLength = allSupplierPpms.length;
            const periodText = periodLength > 1 ? `the ${periodLength}-month period` : 'the period';
            
            anomalies.push({
              title: `Site ${siteCode}${curr.siteName ? ` (${curr.siteName})` : ''}`,
              date: monthName,
              percentage: `+${formatGermanNumber(change, 1)}%`,
              description: `Supplier PPM spiked to ${formatGermanNumber(curr.supplierPpm, 2)} from ${formatGermanNumber(prev.supplierPpm, 2)} in ${prevMonthName}${isHighest ? `, marking the highest Supplier PPM in ${periodText}` : ', marking a significant increase'}.`,
              trend: 'up'
            });
          } else {
            // Check if this is the lowest PPM in the period
            const allSupplierPpms = months.map(m => m.supplierPpm).filter((p): p is number => p !== null);
            const isLowest = curr.supplierPpm === Math.min(...allSupplierPpms);
            const periodLength = allSupplierPpms.length;
            const periodText = periodLength > 1 ? `the ${periodLength}-month period` : 'the period';
            
            anomalies.push({
              title: `Site ${siteCode}${curr.siteName ? ` (${curr.siteName})` : ''}`,
              date: monthName,
              percentage: `${formatGermanNumber(change, 1)}%`,
              description: `Supplier PPM dropped significantly to ${formatGermanNumber(curr.supplierPpm, 2)} from ${formatGermanNumber(prev.supplierPpm, 2)} in ${prevMonthName}${isLowest ? `, representing the lowest Supplier PPM recorded in ${periodText}` : ', representing a substantial improvement'}.`,
              trend: 'down'
            });
          }
        }
      }
    }
  });
  
  // Find extreme outliers (sites with very high PPM compared to average)
  const allPpms: number[] = [];
  sortedKpis.forEach(kpi => {
    if (kpi.customerPpm !== null) allPpms.push(kpi.customerPpm);
    if (kpi.supplierPpm !== null) allPpms.push(kpi.supplierPpm);
  });
  
  if (allPpms.length > 0) {
    const avgPpm = allPpms.reduce((sum, p) => sum + p, 0) / allPpms.length;
    const maxPpm = Math.max(...allPpms);
    
    if (maxPpm > avgPpm * 3) {
      // Find the site with this extreme PPM
      const extremeKpi = sortedKpis.find(kpi => 
        (kpi.customerPpm !== null && kpi.customerPpm === maxPpm) ||
        (kpi.supplierPpm !== null && kpi.supplierPpm === maxPpm)
      );
      
      if (extremeKpi) {
        const ppmType = extremeKpi.customerPpm === maxPpm ? 'Customer' : 'Supplier';
        const monthName = new Date(extremeKpi.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        anomalies.push({
          title: `Site ${extremeKpi.siteCode}${extremeKpi.siteName ? ` (${extremeKpi.siteName})` : ''}`,
          date: monthName,
          percentage: `${formatGermanNumber(((maxPpm - avgPpm) / avgPpm) * 100, 1)}%`,
          description: `${ppmType} PPM of ${formatGermanNumber(maxPpm, 2)} is an extreme outlier, vastly exceeding all other sites and the overall average of ${formatGermanNumber(avgPpm, 2)}.`,
          trend: 'up'
        });
      }
    }
  }
  
  // Sort by significance (highest percentage change first) and return top 4
  return anomalies
    .sort((a, b) => {
      const aPct = parseFloat(a.percentage.replace(',', '.').replace('%', '').replace('+', ''));
      const bPct = parseFloat(b.percentage.replace(',', '.').replace('%', '').replace('+', ''));
      return Math.abs(bPct) - Math.abs(aPct);
    })
    .slice(0, 4);
};

const parseAnomalies = (text: string, monthlySiteKpis?: MonthlySiteKpi[]): Array<{title: string; date: string; percentage: string; description: string; trend: 'up' | 'down'}> => {
  const anomalies: Array<{title: string; date: string; percentage: string; description: string; trend: 'up' | 'down'}> = [];
  
  // If we have monthly data, prefer generating from data for more accurate and professional descriptions
  if (monthlySiteKpis && monthlySiteKpis.length > 0) {
    const generated = generateAnomaliesFromData(monthlySiteKpis);
    if (generated.length > 0) {
      return generated;
    }
  }
  
  if (!text) {
    return anomalies;
  }
  
  // Extract anomalies with dates and percentages - get 3-4 anomalies
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  sentences.slice(0, 4).forEach(sentence => {
    const dateMatch = sentence.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i);
    const siteMatch = sentence.match(/Site\s+(\d+)/i);
    
    // Try to extract PPM values
    const ppmMatch = sentence.match(/(?:Customer|Supplier)?\s*PPM\s+(?:of|is|at|spike|reached|reaching)\s+(\d+[.,]?\d*)/i) 
      || sentence.match(/(\d+[.,]?\d*)\s+(?:Customer|Supplier)?\s*PPM/i)
      || sentence.match(/PPM\s+(?:of|is|at)\s+(\d+[.,]?\d*)/i);
    
    // Try to extract complaint counts
    const complaintMatch = sentence.match(/(\d+)\s+(?:complaints?|Q1|Q2|Q3)/i) 
      || sentence.match(/(?:complaints?|Q1|Q2|Q3).*?(\d+)/i);
    
    // Try to extract any large number that might be a metric
    const numberMatch = sentence.match(/\b(\d{3,})\b/); // Numbers with 3+ digits
    
    const isIncrease = /increase|spike|rise|higher|worsen|exceed|critical|severe|extreme/i.test(sentence);
    const isDecrease = /decrease|drop|fall|lower|improve|reduction/i.test(sentence);
    
    // Determine what metric we're dealing with
    let metricType: 'PPM' | 'Complaints' | 'Unknown' = 'Unknown';
    let metricValue: number | null = null;
    let ppmType: 'Customer' | 'Supplier' | 'Unknown' = 'Unknown';
    
    if (ppmMatch) {
      metricType = 'PPM';
      metricValue = parseFloat(ppmMatch[1].replace(',', '.'));
      if (/Customer/i.test(sentence)) ppmType = 'Customer';
      else if (/Supplier/i.test(sentence)) ppmType = 'Supplier';
    } else if (complaintMatch) {
      metricType = 'Complaints';
      metricValue = parseInt(complaintMatch[1] || complaintMatch[2] || '0');
    } else if (numberMatch && numberMatch[1]) {
      // If we have a large number but no clear context, try to infer from monthly data
      metricValue = parseInt(numberMatch[1]);
      // Will try to match with data later
    }
    
    // Try to calculate percentage change and create professional description from monthly data
    let percentage = 'N/A';
    let description = sentence.trim();
    let title = siteMatch ? `Site ${siteMatch[1]}` : 'Overall';
    let date = dateMatch ? `${dateMatch[1]} ${dateMatch[2]}` : 'Current Period';
    let trend: 'up' | 'down' = isIncrease ? 'up' : isDecrease ? 'down' : 'up';
    
    if (monthlySiteKpis && monthlySiteKpis.length > 0 && (siteMatch || dateMatch)) {
      const siteCode = siteMatch ? siteMatch[1] : null;
      const monthStr = dateMatch ? dateMatch[1] + ' ' + dateMatch[2] : null;
      
      // Find matching KPI record
      let matchingKpi: MonthlySiteKpi | null = null;
      let prevKpi: MonthlySiteKpi | null = null;
      
      if (siteCode && monthStr) {
        const sortedKpis = [...monthlySiteKpis]
          .filter(k => k.siteCode === siteCode)
          .sort((a, b) => a.month.localeCompare(b.month));
        
        const currentIndex = sortedKpis.findIndex(k => {
          const kMonth = new Date(k.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          return kMonth === monthStr;
        });
        
        if (currentIndex >= 0) {
          matchingKpi = sortedKpis[currentIndex];
          if (currentIndex > 0) {
            prevKpi = sortedKpis[currentIndex - 1];
          }
        }
      } else if (siteCode) {
        // Just site, find latest month
        const sortedKpis = [...monthlySiteKpis]
          .filter(k => k.siteCode === siteCode)
          .sort((a, b) => a.month.localeCompare(b.month));
        if (sortedKpis.length > 0) {
          matchingKpi = sortedKpis[sortedKpis.length - 1];
          if (sortedKpis.length > 1) {
            prevKpi = sortedKpis[sortedKpis.length - 2];
          }
        }
      }
      
      if (matchingKpi && prevKpi) {
        // Calculate percentage change based on metric type
        if (metricType === 'PPM') {
          const currentPpm = ppmType === 'Customer' ? matchingKpi.customerPpm : 
                            ppmType === 'Supplier' ? matchingKpi.supplierPpm :
                            matchingKpi.customerPpm || matchingKpi.supplierPpm;
          const prevPpm = ppmType === 'Customer' ? prevKpi.customerPpm :
                         ppmType === 'Supplier' ? prevKpi.supplierPpm :
                         prevKpi.customerPpm || prevKpi.supplierPpm;
          
          if (currentPpm !== null && prevPpm !== null && prevPpm > 0) {
            const change = ((currentPpm - prevPpm) / prevPpm) * 100;
            percentage = `${change >= 0 ? '+' : ''}${formatGermanNumber(change, 1)}%`;
            
            const monthName = new Date(matchingKpi.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            const prevMonthName = new Date(prevKpi.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            const finalPpmType = ppmType === 'Customer' ? 'Customer PPM' : 
                                ppmType === 'Supplier' ? 'Supplier PPM' :
                                (matchingKpi.customerPpm !== null ? 'Customer PPM' : 'Supplier PPM');
            
            // Check if this is highest/lowest in the period
            const allPpms = [...monthlySiteKpis]
              .filter(k => k.siteCode === siteCode)
              .map(k => finalPpmType.includes('Customer') ? k.customerPpm : k.supplierPpm)
              .filter((p): p is number => p !== null);
            
            if (allPpms.length > 0) {
              const isHighest = currentPpm === Math.max(...allPpms);
              const isLowest = currentPpm === Math.min(...allPpms);
              const periodLength = allPpms.length;
              const periodText = periodLength > 1 ? `the ${periodLength}-month period` : 'the period';
              
              if (change > 0) {
                description = `${finalPpmType} spiked to ${formatGermanNumber(currentPpm, 2)} from ${formatGermanNumber(prevPpm, 2)} in ${prevMonthName}${isHighest ? `, marking the highest ${finalPpmType} in ${periodText}` : ', marking a significant increase'}.`;
              } else {
                description = `${finalPpmType} dropped significantly to ${formatGermanNumber(currentPpm, 2)} from ${formatGermanNumber(prevPpm, 2)} in ${prevMonthName}${isLowest ? `, representing the lowest ${finalPpmType} recorded in ${periodText}` : ', representing a substantial improvement'}.`;
              }
            }
          }
        } else if (metricType === 'Complaints' && metricValue !== null) {
          const currentComplaints = matchingKpi.customerComplaintsQ1 + matchingKpi.supplierComplaintsQ2 + matchingKpi.internalComplaintsQ3;
          const prevComplaints = prevKpi.customerComplaintsQ1 + prevKpi.supplierComplaintsQ2 + prevKpi.internalComplaintsQ3;
          
          if (prevComplaints > 0) {
            const change = ((currentComplaints - prevComplaints) / prevComplaints) * 100;
            percentage = `${change >= 0 ? '+' : ''}${formatGermanNumber(change, 1)}%`;
            
            const monthName = new Date(matchingKpi.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            const prevMonthName = new Date(prevKpi.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            
            if (change > 0) {
              description = `Total complaints increased to ${formatGermanNumber(currentComplaints)} from ${formatGermanNumber(prevComplaints)} in ${prevMonthName}, indicating critical quality issues requiring immediate attention.`;
            } else {
              description = `Total complaints decreased to ${formatGermanNumber(currentComplaints)} from ${formatGermanNumber(prevComplaints)} in ${prevMonthName}, showing improvement in quality performance.`;
            }
          }
        }
        
        // Update title and date from matching KPI
        if (siteCode) {
          title = `Site ${siteCode}${matchingKpi.siteName ? ` (${matchingKpi.siteName})` : ''}`;
        }
        date = new Date(matchingKpi.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
    }
    
    // If description is still unclear or percentage is N/A, skip this anomaly
    // We'll rely on generateAnomaliesFromData instead
    if (percentage === 'N/A' || (!description.includes('PPM') && !description.includes('complaints') && !description.includes('complaint'))) {
      return; // Skip this one, will be replaced by generated ones
    }
    
    anomalies.push({
      title,
      date,
      percentage,
      description,
      trend
    });
  });
  
  // If we got fewer than 3 anomalies or many have N/A, use generated ones
  if (anomalies.length < 3 || anomalies.filter(a => a.percentage === 'N/A').length > 1) {
    if (monthlySiteKpis && monthlySiteKpis.length > 0) {
      const generated = generateAnomaliesFromData(monthlySiteKpis);
      // Replace anomalies with N/A or unclear descriptions
      const validAnomalies = anomalies.filter(a => a.percentage !== 'N/A' && a.description.length > 30);
      // Combine and deduplicate
      const combined = [...validAnomalies];
      generated.forEach(gen => {
        if (!combined.some(a => a.title === gen.title && a.date === gen.date)) {
          combined.push(gen);
        }
      });
      return combined.slice(0, 4);
    }
  }
  
  return anomalies.slice(0, 4);
};

const parseRecommendedActions = (actions: string[]): Array<{priority: 'high' | 'medium' | 'low'; title: string; description: string; expectedImpact: string}> => {
  if (!actions || actions.length === 0) return [];
  
  return actions.slice(0, 5).map((action) => {
    let priority: 'high' | 'medium' | 'low' = 'medium';
    let title = '';
    let description = '';
    let expectedImpact = 'Improvement in quality metrics and overall performance';
    
    const actionLower = action.toLowerCase();
    
    // Check if priority is on its own line (format: title\npriority\ndescription\nExpected Impact: ...)
    const lines = action.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Try to detect format with priority on separate line
    if (lines.length >= 3) {
      const priorityLine = lines.find(l => /^(high|medium|low)$/i.test(l));
      if (priorityLine) {
        priority = priorityLine.toLowerCase() as 'high' | 'medium' | 'low';
        const priorityIndex = lines.indexOf(priorityLine);
        title = lines[0].trim();
        description = lines.slice(1, priorityIndex).join(' ').trim() || lines[priorityIndex + 1]?.trim() || '';
        
        // Find Expected Impact
        const impactLine = lines.find(l => /expected impact/i.test(l));
        if (impactLine) {
          expectedImpact = impactLine.replace(/expected impact:?\s*/i, '').trim();
        } else if (priorityIndex + 1 < lines.length) {
          // Description might be after priority line
          description = lines.slice(priorityIndex + 1).join(' ').trim();
          // Try to extract impact from description
          const impactMatch = description.match(/expected impact:?\s*(.+?)$/i);
          if (impactMatch) {
            expectedImpact = impactMatch[1].trim();
            description = description.replace(/expected impact:?.+$/i, '').trim();
          }
        }
      }
    }
    
    // If we didn't parse successfully, try other formats
    if (!title || title.length < 10) {
      // Try structured format: Title: ... Description: ... Expected Impact: ...
      const titleMatch = action.match(/Title:\s*([^D]+?)(?:Description:|$)/i) 
        || action.match(/^([^:.\n]+?)(?:\s*[-:]\s*|\.\s+)/);
      const descMatch = action.match(/Description:\s*([^E]+?)(?:Expected Impact:|$)/i)
        || action.match(/(?:Description|description)[:\s]+(.+?)(?:Expected Impact|expected impact|$)/i);
      const impactMatch = action.match(/Expected Impact:\s*(.+?)(?:Title:|$)/i)
        || action.match(/(?:Expected Impact|expected impact)[:\s]+(.+?)(?:Title:|$)/i);
      
      if (titleMatch && descMatch && impactMatch) {
        // Structured format found
        title = titleMatch[1].trim();
        description = descMatch[1].trim();
        expectedImpact = impactMatch[1].trim();
      } else if (titleMatch) {
        // Partial structure - extract what we can
        title = titleMatch[1].trim();
        const remaining = action.substring(action.indexOf(title) + title.length).trim();
        
        // Try to find description and impact in remaining text
        const descInRemaining = remaining.match(/(?:Description|description)[:\s]+(.+?)(?:Expected Impact|expected impact|$)/i)
          || remaining.match(/^[-:\s]+(.+?)(?:Expected Impact|expected impact|$)/i);
        description = descInRemaining ? descInRemaining[1].trim() : remaining.split(/Expected Impact/i)[0].trim();
        
        const impactInRemaining = remaining.match(/(?:Expected Impact|expected impact)[:\s]+(.+?)$/i);
        expectedImpact = impactInRemaining ? impactInRemaining[1].trim() : 'Improvement in quality metrics and overall performance';
      } else {
        // Fallback: try to extract from less structured format
        const titlePattern = action.match(/^([^:.\n-]+?)(?:\s*[-:]\s*|\.\s+)/) || action.match(/^(.{0,100}?)(?:\s+Description|$)/);
        title = titlePattern ? titlePattern[1].trim() : action.substring(0, 80).trim();
        
        const descPattern = action.match(/(?:Description|description)[:\s]+(.+?)(?:Expected Impact|expected impact|$)/i) 
          || action.match(/[-:]\s*(.+?)(?:Expected Impact|expected impact|$)/i);
        description = descPattern ? descPattern[1].trim() : action.substring(title.length).replace(/^[-:\s]+/, '').trim();
        
        const impactPattern = action.match(/(?:Expected Impact|expected impact)[:\s]+(.+?)(?:Title|$)/i);
        if (impactPattern) {
          expectedImpact = impactPattern[1].trim();
        }
      }
    }
    
    // Determine priority based on keywords if not already set
    if (priority === 'medium') {
      const fullText = (title + ' ' + description).toLowerCase();
      if (/immediate|urgent|critical|severe|deep-dive|targeted|exceptionally high|high ppm|high complaint/i.test(fullText)) {
        priority = 'high';
      } else if (/monitor|consider|optional|maintain|sustain|acknowledge/i.test(fullText)) {
        priority = 'low';
      }
    }
    
    // Clean up and ensure we have content
    if (!title || title.length < 10) {
      title = action.substring(0, 80).trim();
    }
    if (!description || description.length < 20) {
      description = action.substring(title.length).replace(/^[-:\s]+/, '').trim() || 'Detailed action plan required based on the identified issues.';
    }
    if (!expectedImpact || expectedImpact.length < 10) {
      expectedImpact = 'Improvement in quality metrics and overall performance';
    }
    
    return {
      priority,
      title: title.length > 100 ? title.substring(0, 97) + '...' : title,
      description: description.length > 400 ? description.substring(0, 397) + '...' : description,
      expectedImpact: expectedImpact.length > 200 ? expectedImpact.substring(0, 197) + '...' : expectedImpact
    };
  });
};

// Fallback: Generate Recommended Actions from actual KPI data
const generateRecommendedActionsFromData = (
  monthlySiteKpis: MonthlySiteKpi[],
  globalPpm?: { customerPpm: number | null; supplierPpm: number | null },
  aiFindings?: { summary?: string; keyRisksAndAnomalies?: string; trendsAndSiteComparison?: string }
): Array<{priority: 'high' | 'medium' | 'low'; title: string; description: string; expectedImpact: string}> => {
  if (monthlySiteKpis.length === 0) return [];
  
  const actions: Array<{priority: 'high' | 'medium' | 'low'; title: string; description: string; expectedImpact: string}> = [];
  
  // Calculate site statistics
  const siteStats: Record<string, {
    totalComplaints: number;
    customerPpm: number;
    supplierPpm: number;
    customerDeliveries: number;
    supplierDeliveries: number;
    customerDefective: number;
    supplierDefective: number;
    q1Complaints: number;
    q2Complaints: number;
    q3Complaints: number;
    siteName?: string;
  }> = {};
  
  monthlySiteKpis.forEach(kpi => {
    if (!siteStats[kpi.siteCode]) {
      siteStats[kpi.siteCode] = {
        totalComplaints: 0,
        customerPpm: 0,
        supplierPpm: 0,
        customerDeliveries: 0,
        supplierDeliveries: 0,
        customerDefective: 0,
        supplierDefective: 0,
        q1Complaints: 0,
        q2Complaints: 0,
        q3Complaints: 0,
        siteName: kpi.siteName
      };
    }
    
    siteStats[kpi.siteCode].totalComplaints += kpi.customerComplaintsQ1 + kpi.supplierComplaintsQ2 + kpi.internalComplaintsQ3;
    siteStats[kpi.siteCode].q1Complaints += kpi.customerComplaintsQ1;
    siteStats[kpi.siteCode].q2Complaints += kpi.supplierComplaintsQ2;
    siteStats[kpi.siteCode].q3Complaints += kpi.internalComplaintsQ3;
    siteStats[kpi.siteCode].customerDeliveries += kpi.customerDeliveries || 0;
    siteStats[kpi.siteCode].supplierDeliveries += kpi.supplierDeliveries || 0;
    siteStats[kpi.siteCode].customerDefective += kpi.customerDefectiveParts || 0;
    siteStats[kpi.siteCode].supplierDefective += kpi.supplierDefectiveParts || 0;
    
    // Track PPM (use latest non-null value)
    if (kpi.customerPpm !== null) {
      siteStats[kpi.siteCode].customerPpm = kpi.customerPpm;
    }
    if (kpi.supplierPpm !== null) {
      siteStats[kpi.siteCode].supplierPpm = kpi.supplierPpm;
    }
  });
  
  // Calculate overall PPM for each site
  const sitePpmData = Object.entries(siteStats).map(([site, stats]) => {
    const totalDeliveries = stats.customerDeliveries + stats.supplierDeliveries;
    const totalDefective = stats.customerDefective + stats.supplierDefective;
    const overallPpm = totalDeliveries > 0 ? (totalDefective / totalDeliveries) * 1_000_000 : 0;
    return {
      site,
      siteName: stats.siteName,
      totalComplaints: stats.totalComplaints,
      customerPpm: stats.customerPpm,
      supplierPpm: stats.supplierPpm,
      overallPpm,
      q1Complaints: stats.q1Complaints,
      q2Complaints: stats.q2Complaints,
      q3Complaints: stats.q3Complaints
    };
  });
  
  // Extract specific sites mentioned in AI findings for targeted actions
  const mentionedSites: string[] = [];
  if (aiFindings?.keyRisksAndAnomalies) {
    const siteMatches = aiFindings.keyRisksAndAnomalies.matchAll(/Site\s+(\d+)/gi);
    for (const match of siteMatches) {
      if (!mentionedSites.includes(match[1])) {
        mentionedSites.push(match[1]);
      }
    }
  }
  
  // Get time period from monthly data
  const sortedMonths = [...new Set(monthlySiteKpis.map(k => k.month))].sort();
  const periodText = sortedMonths.length > 0 
    ? `${sortedMonths[0]} to ${sortedMonths[sortedMonths.length - 1]}`
    : 'the selected period';
  
  // HIGH PRIORITY: Sites with highest PPM or most complaints (prioritize sites mentioned in AI findings)
  const highPrioritySites = [...sitePpmData]
    .sort((a, b) => {
      // Prioritize sites mentioned in AI findings
      const aMentioned = mentionedSites.includes(a.site);
      const bMentioned = mentionedSites.includes(b.site);
      if (aMentioned && !bMentioned) return -1;
      if (!aMentioned && bMentioned) return 1;
      
      // Sort by highest overall PPM, then by most complaints
      if (Math.abs(a.overallPpm - b.overallPpm) > 50) return b.overallPpm - a.overallPpm;
      return b.totalComplaints - a.totalComplaints;
    })
    .filter(s => s.overallPpm > 100 || s.totalComplaints > 50 || mentionedSites.includes(s.site))
    .slice(0, 2);
  
  highPrioritySites.forEach((site, idx) => {
    const siteLabel = site.siteName ? `Site ${site.site} (${site.siteName})` : `Site ${site.site}`;
    const ppmType = site.customerPpm > site.supplierPpm ? 'Customer' : 'Supplier';
    const ppmValue = site.customerPpm > site.supplierPpm ? site.customerPpm : site.supplierPpm;
    
    if (idx === 0 && (ppmValue > 500 || mentionedSites.includes(site.site))) {
      actions.push({
        priority: 'high',
        title: `Conduct immediate deep-dive analysis at ${siteLabel}`,
        description: `Investigate the root causes for the exceptionally high ${ppmType} PPM (${formatGermanNumber(ppmValue, 2)}) at ${siteLabel}. This requires on-site audits, process reviews, equipment checks, and personnel training assessment.`,
        expectedImpact: `Significant reduction in overall PPM and prevention of further quality failures from this site.`
      });
    } else if (site.totalComplaints > 100 || mentionedSites.includes(site.site)) {
      actions.push({
        priority: 'high',
        title: `Implement targeted quality improvement program at ${siteLabel}`,
        description: `Given its high complaint volume (${formatGermanNumber(site.totalComplaints)}) and ${ppmType} PPM (${formatGermanNumber(ppmValue, 2)}), focus on identifying and rectifying the specific issues contributing to Q1 complaint types, which are prevalent. This could involve process optimization, supplier quality management, or enhanced inspection protocols.`,
        expectedImpact: `Substantial decrease in overall complaints and PPM, improving customer satisfaction.`
      });
    }
  });
  
  // MEDIUM PRIORITY: Best practices from top performers
  const topPerformers = [...sitePpmData]
    .filter(s => s.overallPpm > 0 && s.overallPpm < 50)
    .sort((a, b) => a.overallPpm - b.overallPpm)
    .slice(0, 2);
  
  if (topPerformers.length >= 2) {
    const sitesList = topPerformers.map(s => s.siteName ? `Site ${s.site} (${s.siteName})` : `Site ${s.site}`).join(' and ');
    actions.push({
      priority: 'medium',
      title: `Analyze and standardize best practices from ${sitesList}`,
      description: `Study the operational procedures, training methodologies, and quality control measures employed at high-performing sites (${topPerformers.map(s => s.site).join(' and ')}) with ${topPerformers[0].customerPpm > topPerformers[0].supplierPpm ? 'Customer' : 'Supplier'} PPMs of ${formatGermanNumber(topPerformers[0].overallPpm, 2)} and ${formatGermanNumber(topPerformers[1].overallPpm, 2)}, respectively. Document and disseminate these best practices to other sites.`,
      expectedImpact: `Uplift in quality performance across all sites by adopting proven successful strategies.`
    });
  }
  
  // MEDIUM PRIORITY: Complaint type analysis
  const totalQ1 = sitePpmData.reduce((sum, s) => sum + s.q1Complaints, 0);
  const totalQ2 = sitePpmData.reduce((sum, s) => sum + s.q2Complaints, 0);
  const totalQ3 = sitePpmData.reduce((sum, s) => sum + s.q3Complaints, 0);
  const totalComplaints = totalQ1 + totalQ2 + totalQ3;
  
  if (totalQ1 > totalQ2 && totalQ1 > totalQ3 && totalQ1 > totalComplaints * 0.4) {
    actions.push({
      priority: 'medium',
      title: `Investigate the cause of persistent Q1 complaints`,
      description: `Despite overall PPM improvements, Q1 remains the dominant complaint type (${formatGermanNumber(totalQ1)} out of ${formatGermanNumber(totalComplaints)} total complaints). Conduct a detailed Pareto analysis for Q1 complaints across the selected sites to identify common failure modes, specific products, or processes contributing to this issue. Develop a corrective action plan.`,
      expectedImpact: `Further reduction in overall complaints by addressing the most frequent issue type.`
    });
  }
  
  // LOW PRIORITY: Maintain positive trends
  if (totalQ3 < totalQ1 && totalQ3 < totalQ2 && totalQ3 < totalComplaints * 0.2) {
    actions.push({
      priority: 'low',
      title: `Maintain and monitor improvements in Q3 complaint types`,
      description: `Acknowledge the significant reduction in Q3 complaints (${formatGermanNumber(totalQ3)} out of ${formatGermanNumber(totalComplaints)} total). Ensure that the measures or changes that led to this improvement are sustained and regularly monitored to prevent recurrence.`,
      expectedImpact: `Sustained low incidence of Q3 type complaints, ensuring continued quality improvement.`
    });
  }
  
  // Ensure we have at least 3 actions, fill with generic ones if needed
  while (actions.length < 3) {
    actions.push({
      priority: 'medium',
      title: `Review and optimize quality processes across all sites`,
      description: `Conduct a comprehensive review of quality control processes, inspection protocols, and training programs to identify areas for improvement and standardization.`,
      expectedImpact: `Improved consistency in quality performance and reduced variability across sites.`
    });
  }
  
  return actions.slice(0, 5);
};

// Fallback: Generate Top Performers from actual KPI data
const generateTopPerformersFromData = (monthlySiteKpis: MonthlySiteKpi[]): Array<{site: string; value: string; description: string; metric: string}> => {
  if (monthlySiteKpis.length === 0) return [];
  
  // Calculate average PPM per site
  const sitePpmMap: Record<string, { total: number; count: number; deliveries: number; defective: number }> = {};
  
  monthlySiteKpis.forEach(kpi => {
    if (!sitePpmMap[kpi.siteCode]) {
      sitePpmMap[kpi.siteCode] = { total: 0, count: 0, deliveries: 0, defective: 0 };
    }
    const del = (kpi.customerDeliveries || 0) + (kpi.supplierDeliveries || 0);
    const def = (kpi.customerDefectiveParts || 0) + (kpi.supplierDefectiveParts || 0);
    sitePpmMap[kpi.siteCode].deliveries += del;
    sitePpmMap[kpi.siteCode].defective += def;
    sitePpmMap[kpi.siteCode].count += 1;
  });
  
  // Calculate PPM for each site
  const sitePpms = Object.entries(sitePpmMap)
    .map(([site, data]) => {
      const ppm = data.deliveries > 0 ? (data.defective / data.deliveries) * 1_000_000 : 0;
      return { site, ppm, deliveries: data.deliveries, defective: data.defective };
    })
    .filter(s => s.ppm > 0)
    .sort((a, b) => a.ppm - b.ppm) // Sort by lowest PPM (best performers)
    .slice(0, 3);
  
  return sitePpms.map(s => ({
    site: s.site,
    value: formatGermanNumber(s.ppm, 2),
    description: `Site ${s.site} has the lowest PPM of ${formatGermanNumber(s.ppm, 2)}, indicating excellent quality control.`,
    metric: 'PPM'
  }));
};

// Fallback: Generate Needs Attention from actual KPI data
const generateNeedsAttentionFromData = (monthlySiteKpis: MonthlySiteKpi[]): Array<{site: string; value: string; description: string; metric: string}> => {
  if (monthlySiteKpis.length === 0) return [];
  
  // Calculate average PPM per site
  const sitePpmMap: Record<string, { total: number; count: number; deliveries: number; defective: number; complaints: number }> = {};
  
  monthlySiteKpis.forEach(kpi => {
    if (!sitePpmMap[kpi.siteCode]) {
      sitePpmMap[kpi.siteCode] = { total: 0, count: 0, deliveries: 0, defective: 0, complaints: 0 };
    }
    const del = (kpi.customerDeliveries || 0) + (kpi.supplierDeliveries || 0);
    const def = (kpi.customerDefectiveParts || 0) + (kpi.supplierDefectiveParts || 0);
    const complaints = kpi.customerComplaintsQ1 + kpi.supplierComplaintsQ2 + kpi.internalComplaintsQ3;
    sitePpmMap[kpi.siteCode].deliveries += del;
    sitePpmMap[kpi.siteCode].defective += def;
    sitePpmMap[kpi.siteCode].complaints += complaints;
    sitePpmMap[kpi.siteCode].count += 1;
  });
  
  // Calculate PPM for each site and sort by highest PPM or most complaints
  const siteIssues = Object.entries(sitePpmMap)
    .map(([site, data]) => {
      const ppm = data.deliveries > 0 ? (data.defective / data.deliveries) * 1_000_000 : 0;
      return { site, ppm, complaints: data.complaints, deliveries: data.deliveries, defective: data.defective };
    })
    .filter(s => s.ppm > 0 || s.complaints > 0)
    .sort((a, b) => {
      // Sort by highest PPM first, then by most complaints
      if (Math.abs(a.ppm - b.ppm) > 10) return b.ppm - a.ppm;
      return b.complaints - a.complaints;
    })
    .slice(0, 3);
  
  return siteIssues.map(s => {
    if (s.complaints > 50) {
      return {
        site: s.site,
        value: formatGermanNumber(s.complaints, 0),
        description: `Site ${s.site} has ${formatGermanNumber(s.complaints, 0)} complaints and a PPM of ${formatGermanNumber(s.ppm, 2)}, significantly impacting overall quality.`,
        metric: 'Complaints'
      };
    }
    return {
      site: s.site,
      value: formatGermanNumber(s.ppm, 2),
      description: `Site ${s.site} has a high PPM of ${formatGermanNumber(s.ppm, 2)}, indicating quality control issues that require attention.`,
      metric: 'PPM'
    };
  });
};

export function AIInsightsPanel({
  monthlySiteKpis,
  globalPpm,
  selectedSites,
  selectedMonths,
  plantsData = [],
}: AIInsightsPanelProps) {
  // Helper function to format site code with city/location
  const formatSiteName = useCallback((siteCode: string): string => {
    const plant = plantsData.find(p => p.code === siteCode);
    const city = plant?.city || plant?.location || '';
    
    if (city) {
      return `${siteCode} (${city})`;
    }
    
    // Fallback: try to extract from siteName in KPIs
    const kpi = monthlySiteKpis.find(k => k.siteCode === siteCode);
    if (kpi?.siteName) {
      let cityFromName = kpi.siteName.trim();
      cityFromName = cityFromName.replace(/^(Site|Plant|Werk|Location)\s+/i, '');
      cityFromName = cityFromName.replace(/^(Plant|Site|Werk)\s*\d+\s*/i, '');
      const words = cityFromName.split(/\s+/).filter(w => w.length > 0);
      if (words.length > 0 && words[0].length >= 3) {
        const extractedCity = words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase();
        return `${siteCode} (${extractedCity})`;
      }
    }
    
    return siteCode;
  }, [plantsData, monthlySiteKpis]);
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Simulate progress during AI generation
  useEffect(() => {
    if (loading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            return 90; // Hold at 90% until completion
          }
          // Increment progress with slight randomness, but cap at 90
          const next = prev + Math.random() * 15;
          return Math.min(next, 90);
        });
      }, 300);

      return () => clearInterval(interval);
    }
  }, [loading]);

  const generateInsights = useCallback(async () => {
    if (monthlySiteKpis.length === 0) {
      setError("No data available to analyze");
      return;
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setLoading(true);
    setError(null);
    setInsights(null);
    setProgress(0);

    try {
      const response = await fetch("/api/ai/interpret-kpis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          monthlySiteKpis,
          globalPpm,
          selectedSites,
          selectedMonths,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate insights");
      }

      const data: AIInsights = await response.json();
      
      // Check if request was aborted
      if (abortController.signal.aborted) {
        return;
      }

      // Set progress to 100% first
      setProgress(100);
      // Wait a bit to show 100% completion, then set insights and stop loading
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check again if request was aborted
      if (abortController.signal.aborted) {
        return;
      }

      setInsights(data);
      setLoading(false);
    } catch (err) {
      // Don't set error if request was aborted
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      console.error("AI insights error:", err);
      setLoading(false);
      setProgress(0);
    }
  }, [monthlySiteKpis, globalPpm, selectedSites, selectedMonths]);

  // Auto-generate insights when filtered data changes
  useEffect(() => {
    if (monthlySiteKpis.length === 0) {
      setInsights(null);
      return;
    }

    // Cancel any ongoing request when filters change
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Debounce to avoid too frequent API calls
    const timeoutId = setTimeout(() => {
      generateInsights();
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      // Cancel request on cleanup
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [monthlySiteKpis, selectedSites, globalPpm, selectedMonths, generateInsights]);

  // Parse insights with fallbacks to ensure sections always show
  const keyFindings = insights ? parseKeyFindings(insights.summary, selectedSites) : [];
  let topPerformers = insights ? parseTopPerformers(insights.trendsAndSiteComparison + ' ' + insights.opportunitiesAndHighlights) : [];
  let needsAttention = insights ? parseNeedsAttention(insights.keyRisksAndAnomalies) : [];
  const anomalies = insights ? parseAnomalies(insights.keyRisksAndAnomalies, monthlySiteKpis) : [];
  const recommendedActions = insights ? parseRecommendedActions(insights.recommendedActions) : [];
  
  // Fallback: Generate from data if parsing didn't find enough
  if (topPerformers.length < 2 && monthlySiteKpis.length > 0) {
    const fallbackPerformers = generateTopPerformersFromData(monthlySiteKpis);
    topPerformers = [...topPerformers, ...fallbackPerformers].slice(0, 3);
  }
  
  if (needsAttention.length < 2 && monthlySiteKpis.length > 0) {
    const fallbackAttention = generateNeedsAttentionFromData(monthlySiteKpis);
    needsAttention = [...needsAttention, ...fallbackAttention].slice(0, 3);
  }

  // Debug: Log what we're getting
  if (insights) {
    console.log('AI Insights received:', {
      summaryLength: insights.summary?.length || 0,
      trendsLength: insights.trendsAndSiteComparison?.length || 0,
      risksLength: insights.keyRisksAndAnomalies?.length || 0,
      actionsCount: insights.recommendedActions?.length || 0,
      keyFindingsCount: keyFindings.length,
      topPerformersCount: topPerformers.length,
      needsAttentionCount: needsAttention.length,
      anomaliesCount: anomalies.length,
      recommendedActionsCount: recommendedActions.length,
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">AI Insights</h2>
            <p className="text-sm text-muted-foreground">Automated quality analysis</p>
          </div>
        </div>
        <Button variant="outline" onClick={generateInsights} disabled={loading || monthlySiteKpis.length === 0}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="w-full max-w-md space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Analyzing data and generating insights...</span>
                  <span className="font-medium text-foreground">{Math.round(Math.min(progress, 100))}%</span>
                </div>
                <Progress value={Math.min(progress, 100)} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="py-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Error</p>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
                <Button variant="outline" size="sm" onClick={generateInsights} className="mt-3">
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights Content */}
      {insights && !loading && (
        <div className="space-y-8">
          {/* Key Findings - Always show if we have insights */}
          {(keyFindings.length > 0 || insights.summary) && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                <h3 className="text-xl font-semibold">Key Findings</h3>
              </div>
              <div className="space-y-3">
                {(keyFindings.length > 0 ? keyFindings : parseKeyFindings(insights.summary || '', selectedSites)).slice(0, 5).map((finding, idx) => {
                  // Format site codes in findings
                  let formattedFinding = finding.trim();
                  const siteMatches = formattedFinding.matchAll(/\b(\d{3})\b/g);
                  for (const match of siteMatches) {
                    const siteCode = match[1];
                    // Only replace if it looks like a plant code (3 digits) and is in our plants data
                    if (plantsData.some(p => p.code === siteCode) || monthlySiteKpis.some(k => k.siteCode === siteCode)) {
                      formattedFinding = formattedFinding.replace(
                        new RegExp(`\\b${siteCode}\\b`, 'g'),
                        formatSiteName(siteCode)
                      );
                    }
                  }
                  
                  return (
                  <Card key={idx} className="glass-card-glow border-border/50 bg-card/60 hover:bg-card/70 transition-all shadow-sm hover:shadow-md">
                    <CardContent className="p-4">
                      <p className="text-lg leading-relaxed text-foreground font-medium">
                          {formattedFinding}
                      </p>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top Performers and Needs Attention - Always show if we have insights */}
          {(topPerformers.length > 0 || needsAttention.length > 0 || insights.trendsAndSiteComparison || insights.opportunitiesAndHighlights || insights.keyRisksAndAnomalies) && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Performers */}
            {(topPerformers.length > 0 || insights.trendsAndSiteComparison || insights.opportunitiesAndHighlights) && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-green-500" />
                  <h3 className="text-xl font-semibold">Top Performers</h3>
                </div>
                <div className="space-y-3">
                  {(topPerformers.length > 0 ? topPerformers : parseTopPerformers((insights.trendsAndSiteComparison || '') + ' ' + (insights.opportunitiesAndHighlights || ''))).slice(0, 3).map((performer, idx) => (
                    <Card key={idx} className="glass-card-glow border-border/50 transition-all shadow-sm hover:shadow-md" style={{ backgroundColor: 'rgba(156, 163, 175, 0.15)' }}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="text-3xl font-bold text-white">{formatSiteName(performer.site)}</div>
                          <Badge variant="outline" className="bg-white text-black border-white text-xs px-2 py-0.5 rounded-full">
                            {performer.metric}
                          </Badge>
                        </div>
                        <div className="text-base font-medium text-muted-foreground mb-3">Value: {performer.value}</div>
                        <p className="text-lg text-foreground leading-relaxed">{performer.description.replace(new RegExp(`Site\\s+${performer.site}|site\\s+${performer.site}|\\b${performer.site}\\b`, 'gi'), formatSiteName(performer.site))}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Needs Attention */}
            {(needsAttention.length > 0 || insights.keyRisksAndAnomalies) && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <h3 className="text-xl font-semibold">Needs Attention</h3>
                </div>
                <div className="space-y-3">
                  {(needsAttention.length > 0 ? needsAttention : parseNeedsAttention(insights.keyRisksAndAnomalies || '')).slice(0, 3).map((item, idx) => (
                    <Card key={idx} className="glass-card-glow border-red-500/30 transition-all shadow-sm hover:shadow-md" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="text-3xl font-bold text-white">{formatSiteName(item.site)}</div>
                          <Badge variant="outline" className="bg-white text-black border-white text-xs px-2 py-0.5 rounded-full">
                            {item.metric}
                          </Badge>
                        </div>
                        <div className="text-base font-medium text-muted-foreground mb-3">Value: {item.value}</div>
                        <p className="text-lg text-foreground leading-relaxed">{item.description.replace(new RegExp(`Site\\s+${item.site}|site\\s+${item.site}|\\b${item.site}\\b`, 'gi'), formatSiteName(item.site))}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
          )}

          {/* Detected Anomalies - Always show if we have insights */}
          {(anomalies.length > 0 || insights.keyRisksAndAnomalies) && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h3 className="text-xl font-semibold">Detected Anomalies</h3>
              </div>
              <div className="space-y-3">
                {(anomalies.length > 0 ? anomalies : parseAnomalies(insights.keyRisksAndAnomalies || '', monthlySiteKpis)).map((anomaly, idx) => {
                  // Format site code in title - extract site code and replace entire title with formatted site name
                  let formattedTitle = anomaly.title;
                  const siteMatch = anomaly.title.match(/Site\s+(\d+)|site\s+(\d+)|^(\d{3})\b/i);
                  if (siteMatch) {
                    const siteCode = siteMatch[1] || siteMatch[2] || siteMatch[3];
                    // Replace entire title with just the formatted site name (e.g., "410 (Fenton)")
                    formattedTitle = formatSiteName(siteCode);
                  }
                  
                  // Format site code in description
                  let formattedDescription = anomaly.description;
                  const descSiteMatch = anomaly.description.match(/Site\s+(\d+)|site\s+(\d+)|\\b(\d{3})\\b/gi);
                  if (descSiteMatch) {
                    descSiteMatch.forEach(match => {
                      const siteCodeMatch = match.match(/(\d+)/);
                      if (siteCodeMatch) {
                        const siteCode = siteCodeMatch[1];
                        formattedDescription = formattedDescription.replace(
                          new RegExp(`Site\\s+${siteCode}|site\\s+${siteCode}|\\b${siteCode}\\b`, 'gi'),
                          formatSiteName(siteCode)
                        );
                      }
                    });
                  }
                  
                  return (
                  <Card key={idx} className="border-amber-500/20 bg-amber-500/5">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-xl font-bold text-white">{formattedTitle}</span>
                          {anomaly.trend === 'up' ? (
                            <TrendingUp className="h-5 w-5 text-red-500 flex-shrink-0" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-green-500 flex-shrink-0" />
                          )}
                          <Badge variant="outline" className="bg-white text-black border-white text-sm px-3 py-1 rounded-full flex-shrink-0 font-medium">
                            {anomaly.date}
                          </Badge>
                        </div>
                        <div className="text-lg font-bold text-amber-500 flex-shrink-0 ml-2">{anomaly.percentage}</div>
                      </div>
                        <p className="text-lg text-foreground leading-relaxed font-medium">{formattedDescription}</p>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommended Actions - Always show if we have insights */}
          {insights && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">Recommended Actions</h3>
              </div>
              <div className="space-y-3">
                {(() => {
                  // Try to get actions from state, then from parsed insights, then generate from data
                  let actions = recommendedActions.length > 0 
                    ? recommendedActions 
                    : parseRecommendedActions(insights?.recommendedActions || []);
                  
                  // If still no actions, generate from KPI data as fallback
                  if (actions.length === 0 && monthlySiteKpis.length > 0) {
                    actions = generateRecommendedActionsFromData(monthlySiteKpis, globalPpm, insights);
                  }
                  
                  // If still no actions, show a message
                  if (actions.length === 0) {
                    return (
                      <Card className="border-border bg-card/50">
                        <CardContent className="p-5">
                          <p className="text-sm text-muted-foreground text-center">
                            No recommended actions available. Please refresh to generate new insights.
                          </p>
                        </CardContent>
                      </Card>
                    );
                  }
                  
                  return actions.map((action, idx) => {
                    // Format site references in title, description, and expectedImpact
                    let formattedTitle = action.title;
                    let formattedDescription = action.description;
                    let formattedExpectedImpact = action.expectedImpact;
                    
                    // Helper function to format site references in text
                    const formatSiteReferences = (text: string): string => {
                      const siteMatches = text.matchAll(/Site\s+(\d+)(?:\s*\([^)]+\))?/gi);
                      let formatted = text;
                      for (const match of siteMatches) {
                        const siteCode = match[1];
                        // Replace the entire site reference (including any parenthetical content) with formatted site name
                        formatted = formatted.replace(
                          new RegExp(`Site\\s+${siteCode}(?:\\s*\\([^)]+\\))?`, 'gi'),
                          formatSiteName(siteCode)
                        );
                      }
                      return formatted;
                    };
                    
                    formattedTitle = formatSiteReferences(formattedTitle);
                    formattedDescription = formatSiteReferences(formattedDescription);
                    formattedExpectedImpact = formatSiteReferences(formattedExpectedImpact);
                    
                    return (
                    <Card key={idx} className="border-border bg-card/50">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="text-lg font-semibold text-white flex-1 pr-4">{formattedTitle}</h4>
                          <Badge 
                            variant="outline"
                            className={
                              action.priority === 'high' 
                                ? 'bg-red-500 text-white border-red-500 flex-shrink-0'
                                : action.priority === 'medium'
                                ? 'bg-amber-500 text-white border-amber-500 flex-shrink-0'
                                : 'bg-blue-500 text-white border-blue-500 flex-shrink-0'
                            }
                          >
                            {action.priority.charAt(0).toUpperCase() + action.priority.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-lg text-muted-foreground leading-relaxed mb-4 font-medium">{formattedDescription}</p>
                        <div className="pt-3 border-t border-border">
                          <p className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Expected Impact</p>
                          <p className="text-base text-green-500 leading-relaxed font-bold">{formattedExpectedImpact}</p>
                        </div>
                      </CardContent>
                    </Card>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!insights && !loading && !error && monthlySiteKpis.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No data available. Please upload data from the Upload Data page first.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
