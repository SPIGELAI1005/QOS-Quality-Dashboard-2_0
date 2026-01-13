/**
 * Column mapping configuration for Excel file parsing
 * Defines default column name variations for complaints and deliveries
 */

export interface ComplaintColumnMapping {
  notificationNumber: string[];
  notificationType: string[];
  plant: string[];
  siteCode: string[];
  siteName?: string[];
  createdOn: string[];
  defectiveParts: string[];
  defectiveInternal?: string[]; // For "Defective (Internal)" column (Q1)
  defectiveExternal?: string[]; // For "Defective (External)" column (Q2)
  unitOfMeasure?: string[]; // For "Unit of Measure" column
  materialDescription?: string[]; // For "Material Description" column
  materialNumber?: string[]; // For "Material Number" column
}

export interface DeliveryColumnMapping {
  plant: string[];
  siteCode: string[];
  siteName?: string[];
  date: string[];
  quantity: string[];
  actualGoodsIssueDate?: string[]; // For "Actual Goods Issue Date" column (Outbound/Customer)
  actualGoodsReceiptDate?: string[]; // For "Actual Goods Receipt Date" column (Inbound/Supplier)
  kind?: string[];
}

/**
 * Default column mappings for complaint files
 */
export const DEFAULT_COMPLAINT_COLUMN_MAPPING: ComplaintColumnMapping = {
  notificationNumber: [
    'notification number',
    'notification no',
    'notification',
    'notif no',
    'notif number',
    'notif',
    'complaint number',
    'complaint no',
    'notif.',
    'notification nr',
    'notif nr',
    'nr',
    'number',
  ],
  notificationType: [
    'notification type',
    'type',
    'notif type',
    'complaint type',
    'category',
    'notif type',
    'type of notification',
    'notification category',
    'q type',
  ],
  plant: [
    'plant',
    'plant code',
    'plant id',
    'plant number',
    'werk',
    'plant code',
    'plant for material',
    'plant/material',
  ],
  siteCode: [
    'site',
    'site code',
    'site id',
    'site number',
    'werk',
    'plant',
    'plant code',
  ],
  siteName: [
    'site name',
    'plant name',
    'site description',
    'name',
    'description',
  ],
  createdOn: [
    'created on',
    'created date',
    'date',
    'creation date',
    'created',
    'notification date',
    'notif date',
    'erstellt am',
    'erstellt',
    'datum',
    'date created',
    'creation',
  ],
  defectiveParts: [
    'defective parts',
    'defective quantity',
    'defective qty',
    'defective',
    'quantity defective',
    'qty defective',
    'parts defective',
    'defective qty',
    'def qty',
    'defective quantity',
    'defective parts qty',
    'def parts',
    'fehlmenge',
    'defect qty',
  ],
  defectiveInternal: [
    'defective (internal)',
    'defective internal',
    'defective internal qty',
    'internal defective',
    'internal defective qty',
    'defective internal quantity',
    'defective internal parts',
    'internal',
    'def int',
    'defective int',
  ],
  defectiveExternal: [
    'defective (external)',
    'defective external',
    'defective external qty',
    'external defective',
    'external defective qty',
    'defective external quantity',
    'defective external parts',
    'external',
    'def ext',
    'defective ext',
  ],
  unitOfMeasure: [
    'unit of measure',
    'unit',
    'uom',
    'unit of measurement',
    'measurement unit',
    'unit measure',
  ],
  materialDescription: [
    'material description',
    'material desc',
    'material',
    'description',
    'material text',
    'material name',
    'part description',
  ],
  materialNumber: [
    'material number',
    'material no',
    'material nr',
    'material',
    'matnr',
    'material code',
    'part number',
    'part no',
    'material id',
  ],
};

/**
 * Default column mappings for delivery files
 */
export const DEFAULT_DELIVERY_COLUMN_MAPPING: DeliveryColumnMapping = {
  plant: [
    'plant',
    'plant code',
    'plant id',
    'plant number',
    'werk',
    'werk code',
    'plant for material',
    'plant/material',
  ],
  siteCode: [
    'site',
    'site code',
    'site id',
    'site number',
    'werk',
    'plant',
    'plant code',
  ],
  siteName: [
    'site name',
    'plant name',
    'site description',
    'name',
    'description',
  ],
  quantity: [
    'quantity', // Primary column name for deliveries
    'quantities', // Plural form (alternative)
    'qty',
    'delivered quantity',
    'delivered qty',
    'delivery quantity',
    'delivery qty',
    'parts',
    'units',
    'menge',
    'quantity delivered',
    'qty delivered',
    'delivered',
    'outbound qty',
    'inbound qty',
    'outbound quantity',
    'inbound quantity',
  ],
  actualGoodsIssueDate: [
    'actual goods issue date',
    'actual goods issue',
    'goods issue date',
    'issue date',
    'actual issue',
    'goods issue',
    'actual delivery date',
    'delivery date actual',
    'actualgidate', // SAP abbreviation
    'actual gi date',
    'gi date actual',
  ],
  actualGoodsReceiptDate: [
    'actual goods receipt date',
    'actual goods receipt',
    'goods receipt date',
    'receipt date',
    'actual receipt',
    'goods receipt',
    'actual receipt date',
    'receipt date actual',
    'actualgrdate', // SAP abbreviation
    'actual gr date',
    'gr date actual',
  ],
  date: [
    'date',
    'delivery date',
    'delivered date',
    'shipment date',
    'delivery',
    'created on',
    'created date',
    'datum',
    'ship date',
    'date delivered',
  ],
  kind: [
    'customer or supplier',
    'customer/supplier',
    'c/s',
    'direction',
    'source',
    'origin',
    'type',
    'inbound outbound',
    'in/out',
    'direction',
    'outbound',
    'inbound',
    'kind',
  ],
};

/**
 * Get column mapping configuration
 * Can be extended to load from user settings or database
 */
export function getComplaintColumnMapping(): ComplaintColumnMapping {
  // TODO: Load from user settings/database if available
  // For now, return defaults
  return DEFAULT_COMPLAINT_COLUMN_MAPPING;
}

/**
 * Get delivery column mapping configuration
 * Can be extended to load from user settings or database
 */
export function getDeliveryColumnMapping(): DeliveryColumnMapping {
  // TODO: Load from user settings/database if available
  // For now, return defaults
  return DEFAULT_DELIVERY_COLUMN_MAPPING;
}

