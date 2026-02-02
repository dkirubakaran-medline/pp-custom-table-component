/**
 * Status Utility for managing status icons
 * Colors are defined in CustomTable.scss using data-status attributes
 */

export interface StatusStyle {
  icon: string;
}

export type StatusCategory = Record<string, StatusStyle>;

export type StatusDefinitions = Record<string, StatusCategory>;

/**
 * Comprehensive status icon definitions organized by category
 * Colors are managed in SCSS via data-status attribute selectors
 */
export const STATUS_DEFINITIONS: StatusDefinitions = {
  generalStatus: {
    "Active": { icon: "✓" },
    "Inactive": { icon: "○" },
    "Enabled": { icon: "✓" },
    "Disabled": { icon: "✗" },
    "Online": { icon: "●" },
    "Offline": { icon: "○" },
  },
  operationStatus: {
    "Success": { icon: "✓" },
    "Failed": { icon: "✗" },
    "Error": { icon: "⚠" },
    "Warning": { icon: "⚠" },
    "Info": { icon: "ℹ" },
  },
  progressStatus: {
    "Not Started": { icon: "○" },
    "In Progress": { icon: "⟳" },
    "Pending": { icon: "⏸" },
    "Completed": { icon: "✓" },
    "On Hold": { icon: "⏸" },
    "Cancelled": { icon: "✗" },
    "Paused": { icon: "⏸" },
  },
  approvalStatus: {
    "Approved": { icon: "✓" },
    "Rejected": { icon: "✗" },
    "Under Review": { icon: "👁" },
    "Draft": { icon: "📝" },
    "Submitted": { icon: "📤" },
    "Pending Approval": { icon: "⏳" },
  },
  priorityStatus: {
    "Critical": { icon: "🔴" },
    "High": { icon: "⬆" },
    "Medium": { icon: "➡" },
    "Low": { icon: "⬇" },
    "Urgent": { icon: "⚡" },
  },
  paymentStatus: {
    "Paid": { icon: "✓" },
    "Unpaid": { icon: "✗" },
    "Pending": { icon: "⏳" },
    "Overdue": { icon: "⚠" },
    "Refunded": { icon: "↩" },
    "Partial": { icon: "◐" },
  },
  orderStatus: {
    "New": { icon: "🆕" },
    "Processing": { icon: "⚙" },
    "Shipped": { icon: "📦" },
    "Delivered": { icon: "✓" },
    "Returned": { icon: "↩" },
    "Cancelled": { icon: "✗" },
  },
  membershipStatus: {
    "Trial": { icon: "🔓" },
    "Active": { icon: "✓" },
    "Expired": { icon: "✗" },
    "Suspended": { icon: "⏸" },
    "Cancelled": { icon: "○" },
  },
};

/**
 * Get status style by searching through all categories
 * @param statusValue - The status value to search for (case-insensitive)
 * @returns StatusStyle object or null if not found
 */
export function getStatusStyle(statusValue: string): StatusStyle | null {
  if (!statusValue) return null;

  // Normalize the status value for comparison
  const normalizedValue = statusValue.trim();

  // Search through all categories
  for (const category of Object.values(STATUS_DEFINITIONS)) {
    // Try exact match first
    if (category[normalizedValue]) {
      return category[normalizedValue];
    }

    // Try case-insensitive match
    const statusKey = Object.keys(category).find(
      (key) => key.toLowerCase() === normalizedValue.toLowerCase()
    );
    if (statusKey) {
      return category[statusKey];
    }
  }

  return null;
}

/**
 * Get status style from a specific category
 * @param category - The category name
 * @param statusValue - The status value
 * @returns StatusStyle object or null if not found
 */
export function getStatusStyleByCategory(
  category: keyof StatusDefinitions,
  statusValue: string
): StatusStyle | null {
  if (!statusValue || !STATUS_DEFINITIONS[category]) return null;

  const normalizedValue = statusValue.trim();
  const categoryData = STATUS_DEFINITIONS[category];

  // Try exact match
  if (categoryData[normalizedValue]) {
    return categoryData[normalizedValue];
  }

  // Try case-insensitive match
  const statusKey = Object.keys(categoryData).find(
    (key) => key.toLowerCase() === normalizedValue.toLowerCase()
  );

  return statusKey ? categoryData[statusKey] : null;
}

/**
 * Check if a column should be treated as a status column
 * @param columnName - The column name to check
 * @returns true if the column is a status column
 */
export function isStatusColumn(columnName: string): boolean {
  if (!columnName) return false;
  
  const normalizedName = columnName.toLowerCase();
  const statusKeywords = [
    'status',
    'state',
    'stage',
    'priority',
    'approval',
    'progress',
    'condition',
  ];

  return statusKeywords.some((keyword) => normalizedName.includes(keyword));
}

/**
 * Get all possible status values from all categories
 * @returns Array of all status values
 */
export function getAllStatusValues(): string[] {
  const allValues: string[] = [];
  
  for (const category of Object.values(STATUS_DEFINITIONS)) {
    allValues.push(...Object.keys(category));
  }
  
  return allValues;
}

/**
 * Get all status values from a specific category
 * @param category - The category name
 * @returns Array of status values in the category
 */
export function getStatusValuesByCategory(
  category: keyof StatusDefinitions
): string[] {
  if (!STATUS_DEFINITIONS[category]) return [];
  return Object.keys(STATUS_DEFINITIONS[category]);
}
