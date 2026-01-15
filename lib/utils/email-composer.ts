/**
 * Utility functions for composing professional emails from AI Summary content
 */

export type EmailContext = 
  | { type: 'keyFinding'; content: string }
  | { type: 'topPerformer'; site: string; value: string; description: string; metric: string }
  | { type: 'needsAttention'; site: string; value: string; description: string; metric: string }
  | { type: 'anomaly'; title: string; date: string; percentage: string; description: string; trend: 'up' | 'down' }
  | { type: 'recommendedAction'; title: string; description: string; expectedImpact: string; priority: 'high' | 'medium' | 'low' };

export interface EmailContent {
  subject: string;
  body: string;
  isPositive: boolean;
}

/**
 * Determines if the email context is positive (follow-up) or negative (action required)
 */
function isPositiveContext(context: EmailContext): boolean {
  switch (context.type) {
    case 'keyFinding':
      // Check for positive keywords
      const positiveKeywords = ['improving', 'improved', 'excellent', 'best', 'lowest', 'good', 'strong', 'positive', 'decreased', 'reduced', 'declined', 'better', 'success', 'achievement'];
      const negativeKeywords = ['spike', 'increase', 'rise', 'worsen', 'critical', 'risk', 'concern', 'issue', 'problem', 'high', 'worst', 'highest', 'increased', 'worse', 'attention', 'action'];
      const contentLower = context.content.toLowerCase();
      const hasPositive = positiveKeywords.some(kw => contentLower.includes(kw));
      const hasNegative = negativeKeywords.some(kw => contentLower.includes(kw));
      // If both present, negative takes precedence
      return hasPositive && !hasNegative;
    case 'topPerformer':
      return true; // Top performers are always positive
    case 'needsAttention':
      return false; // Needs attention is always negative
    case 'anomaly':
      return context.trend === 'down'; // Down trend can be positive (reduction in issues)
    case 'recommendedAction':
      return false; // Actions are always for addressing issues
    default:
      return false;
  }
}

/**
 * Generates professional email content based on context
 */
export function composeEmail(context: EmailContext, pageUrl?: string): EmailContent {
  const isPositive = isPositiveContext(context);
  const timestamp = new Date().toLocaleString('en-US', { 
    dateStyle: 'medium', 
    timeStyle: 'short' 
  });

  let subject: string;
  let body: string;

  switch (context.type) {
    case 'keyFinding': {
      subject = isPositive
        ? `QOS ET Report - Follow-up: Quality Performance Update`
        : `QOS ET Report - Action Required: Quality Issue Identified`;
      
      body = [
        isPositive ? "Dear Team," : "Dear Team,",
        "",
        isPositive 
          ? "I would like to share a positive update from our quality analysis:"
          : "I would like to bring your attention to a quality issue that requires action:",
        "",
        "Key Finding:",
        context.content,
        "",
        "Context:",
        `- Source: QOS ET Report - AI Summary`,
        pageUrl ? `- Page: ${pageUrl}` : "",
        `- Timestamp: ${timestamp}`,
        "",
        isPositive
          ? "This is a positive development that we should acknowledge and potentially replicate across other sites. Please review and consider sharing best practices."
          : "Please review this finding and take appropriate action. If you need additional information or support, please don't hesitate to reach out.",
        "",
        "Best regards,",
      ].join("\n");
      break;
    }

    case 'topPerformer': {
      subject = `QOS ET Report - Follow-up: Excellent Performance at ${context.site}`;
      
      body = [
        "Dear Team,",
        "",
        "I would like to highlight excellent quality performance that deserves recognition:",
        "",
        `Site: ${context.site}`,
        `Metric: ${context.metric}`,
        `Value: ${context.value}`,
        "",
        "Details:",
        context.description,
        "",
        "Context:",
        `- Source: QOS ET Report - AI Summary`,
        pageUrl ? `- Page: ${pageUrl}` : "",
        `- Timestamp: ${timestamp}`,
        "",
        "This outstanding performance demonstrates best practices that could be shared across other sites. Please consider documenting and sharing the success factors that contributed to this achievement.",
        "",
        "Best regards,",
      ].join("\n");
      break;
    }

    case 'needsAttention': {
      subject = `QOS ET Report - Action Required: Quality Issue at ${context.site}`;
      
      body = [
        "Dear Team,",
        "",
        "I would like to bring your attention to a quality issue that requires immediate action:",
        "",
        `Site: ${context.site}`,
        `Metric: ${context.metric}`,
        `Value: ${context.value}`,
        "",
        "Issue Details:",
        context.description,
        "",
        "Context:",
        `- Source: QOS ET Report - AI Summary`,
        pageUrl ? `- Page: ${pageUrl}` : "",
        `- Timestamp: ${timestamp}`,
        "",
        "Please review this issue and take appropriate corrective action. I recommend:",
        "1. Immediate containment measures if applicable",
        "2. Root cause analysis",
        "3. Corrective and preventive actions",
        "4. Follow-up to verify effectiveness",
        "",
        "If you need support or additional information, please don't hesitate to reach out.",
        "",
        "Best regards,",
      ].join("\n");
      break;
    }

    case 'anomaly': {
      const isPositiveAnomaly = context.trend === 'down';
      subject = isPositiveAnomaly
        ? `QOS ET Report - Follow-up: Significant Improvement Detected`
        : `QOS ET Report - Action Required: Quality Anomaly Detected`;
      
      body = [
        "Dear Team,",
        "",
        isPositiveAnomaly
          ? "I would like to share a significant improvement that was detected in our quality metrics:"
          : "I would like to bring your attention to a quality anomaly that requires investigation:",
        "",
        `Location: ${context.title}`,
        `Date: ${context.date}`,
        `Change: ${context.percentage}`,
        "",
        "Details:",
        context.description,
        "",
        "Context:",
        `- Source: QOS ET Report - AI Summary`,
        pageUrl ? `- Page: ${pageUrl}` : "",
        `- Timestamp: ${timestamp}`,
        "",
        isPositiveAnomaly
          ? "This improvement is noteworthy and should be investigated to understand the contributing factors. Please document the success factors and consider sharing best practices."
          : "Please investigate this anomaly promptly. I recommend:",
        "",
        isPositiveAnomaly ? "" : [
          "1. Immediate investigation of root causes",
          "2. Containment measures if applicable",
          "3. Corrective actions to prevent recurrence",
          "4. Follow-up to verify effectiveness",
          "",
        ].join("\n"),
        "If you need support or additional information, please don't hesitate to reach out.",
        "",
        "Best regards,",
      ].join("\n");
      break;
    }

    case 'recommendedAction': {
      const priorityLabel = context.priority === 'high' ? 'High Priority' : context.priority === 'medium' ? 'Medium Priority' : 'Low Priority';
      subject = `QOS ET Report - Action Required: ${context.title} [${priorityLabel}]`;
      
      body = [
        "Dear Team,",
        "",
        "I would like to request action on the following quality improvement opportunity:",
        "",
        `Action: ${context.title}`,
        `Priority: ${priorityLabel}`,
        "",
        "Description:",
        context.description,
        "",
        "Expected Impact:",
        context.expectedImpact,
        "",
        "Context:",
        `- Source: QOS ET Report - AI Summary`,
        pageUrl ? `- Page: ${pageUrl}` : "",
        `- Timestamp: ${timestamp}`,
        "",
        context.priority === 'high'
          ? "This is a high-priority action that requires immediate attention. Please assign ownership and establish a timeline for implementation."
          : "Please review this action and assign appropriate ownership. Establish a timeline for implementation and follow-up.",
        "",
        "If you need support or have questions, please don't hesitate to reach out.",
        "",
        "Best regards,",
      ].join("\n");
      break;
    }
  }

  return { subject, body, isPositive };
}

/**
 * Builds a mailto: link with encoded subject and body
 */
export function buildMailtoLink(
  context: EmailContext,
  recipients: string[] = [],
  pageUrl?: string
): string {
  const emailContent = composeEmail(context, pageUrl);
  const params = new URLSearchParams();
  params.set('subject', emailContent.subject);
  params.set('body', emailContent.body);
  
  // Add recipients if provided
  const toParam = recipients.length > 0 ? recipients.join(',') : '';
  const mailtoLink = toParam 
    ? `mailto:${toParam}?${params.toString()}`
    : `mailto:?${params.toString()}`;
  
  return mailtoLink;
}
