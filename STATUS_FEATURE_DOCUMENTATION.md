# Status Column Feature Documentation

## Overview

The PCF table control now automatically detects status columns and applies colored badges with icons based on predefined status definitions.

## How It Works

### Automatic Detection

The control automatically detects status columns by checking if the column name contains any of these keywords:
- `status`
- `state`
- `stage`
- `priority`
- `approval`
- `progress`
- `condition`

**Examples of column names that will be detected:**
- "Status"
- "Order Status"
- "Payment State"
- "Approval Stage"
- "Priority Level"
- "Progress Status"

### Status Definitions

Status values are organized into 8 categories with predefined colors and icons:

#### 1. General Status
- **Active**: Green background, white text, ✓ icon
- **Inactive**: Gray background, white text, ○ icon
- **Enabled**: Green background, white text, ✓ icon
- **Disabled**: Gray background, white text, ✗ icon
- **Online**: Green background, white text, ● icon
- **Offline**: Gray background, white text, ○ icon

#### 2. Operation Status
- **Success**: Green background, white text, ✓ icon
- **Failed**: Red background, white text, ✗ icon
- **Error**: Red background, white text, ⚠ icon
- **Warning**: Yellow background, black text, ⚠ icon
- **Info**: Cyan background, white text, ℹ icon

#### 3. Progress Status
- **Not Started**: Gray background, white text, ○ icon
- **In Progress**: Yellow background, black text, ⟳ icon
- **Pending**: Cyan background, white text, ⏸ icon
- **Completed**: Green background, white text, ✓ icon
- **On Hold**: Orange background, white text, ⏸ icon
- **Cancelled**: Gray background, white text, ✗ icon
- **Paused**: Orange background, white text, ⏸ icon

#### 4. Approval Status
- **Approved**: Green background, white text, ✓ icon
- **Rejected**: Red background, white text, ✗ icon
- **Under Review**: Yellow background, black text, 👁 icon
- **Draft**: Gray background, white text, 📝 icon
- **Submitted**: Cyan background, white text, 📤 icon
- **Pending Approval**: Yellow background, black text, ⏳ icon

#### 5. Priority Status
- **Critical**: Dark red background, white text, 🔴 icon
- **High**: Red background, white text, ⬆ icon
- **Medium**: Yellow background, black text, ➡ icon
- **Low**: Green background, white text, ⬇ icon
- **Urgent**: Red background, white text, ⚡ icon

#### 6. Payment Status
- **Paid**: Green background, white text, ✓ icon
- **Unpaid**: Red background, white text, ✗ icon
- **Pending**: Yellow background, black text, ⏳ icon
- **Overdue**: Dark red background, white text, ⚠ icon
- **Refunded**: Cyan background, white text, ↩ icon
- **Partial**: Orange background, white text, ◐ icon

#### 7. Order Status
- **New**: Cyan background, white text, 🆕 icon
- **Processing**: Yellow background, black text, ⚙ icon
- **Shipped**: Cyan background, white text, 📦 icon
- **Delivered**: Green background, white text, ✓ icon
- **Returned**: Orange background, white text, ↩ icon
- **Cancelled**: Gray background, white text, ✗ icon

#### 8. Membership Status
- **Trial**: Cyan background, white text, 🔓 icon
- **Active**: Green background, white text, ✓ icon
- **Expired**: Red background, white text, ✗ icon
- **Suspended**: Orange background, white text, ⏸ icon
- **Cancelled**: Gray background, white text, ○ icon

## Visual Design

Status values are displayed as **badges** with:
- Rounded corners (12px border radius)
- Icon on the left
- Text in the center
- Appropriate padding and spacing
- Maximum width to prevent overflow
- Text ellipsis for long values

## Case Insensitivity

The status matching is **case-insensitive**, so these values are treated the same:
- "Active" = "active" = "ACTIVE"
- "In Progress" = "in progress" = "IN PROGRESS"

## Examples

### Example 1: Order Status Column
If you have a column named "Order Status" with values like:
- "New" → Displays as cyan badge with 🆕 icon
- "Processing" → Displays as yellow badge with ⚙ icon
- "Delivered" → Displays as green badge with ✓ icon

### Example 2: Payment State Column
If you have a column named "Payment State" with values like:
- "Paid" → Displays as green badge with ✓ icon
- "Pending" → Displays as yellow badge with ⏳ icon
- "Overdue" → Displays as dark red badge with ⚠ icon

### Example 3: Priority Column
If you have a column named "Priority" with values like:
- "High" → Displays as red badge with ⬆ icon
- "Medium" → Displays as yellow badge with ➡ icon
- "Low" → Displays as green badge with ⬇ icon

## Adding Custom Status Values

To add custom status values, edit the `statusUtils.ts` file:

```typescript
export const STATUS_DEFINITIONS: StatusDefinitions = {
  // Add your custom category
  customCategory: {
    "Custom Status 1": { bg: "#yourColor", text: "#fff", icon: "🎯" },
    "Custom Status 2": { bg: "#yourColor", text: "#000", icon: "🎨" },
  },
  // ... existing categories
};
```

## Styling

Status badges use BEM naming convention:
- `.custom-table__status-badge` - Badge container
- `.custom-table__status-icon` - Icon element
- `.custom-table__status-text` - Text element

You can customize the styles in `CustomTable.scss`.

## Utility Functions

The `statusUtils.ts` file provides several utility functions:

### `getStatusStyle(statusValue: string)`
Gets the status style by searching through all categories.

### `isStatusColumn(columnName: string)`
Checks if a column should be treated as a status column.

### `getStatusStyleByCategory(category, statusValue)`
Gets status style from a specific category.

### `getAllStatusValues()`
Returns an array of all possible status values.

### `getContrastTextColor(backgroundColor)`
Calculates appropriate text color based on background color.

## Browser Compatibility

Status badges use modern CSS features:
- Flexbox for layout
- Border radius for rounded corners
- Emoji/Unicode icons (supported in all modern browsers)

## Accessibility

- Status badges include both color AND icons for colorblind users
- Text colors are automatically calculated for proper contrast
- Semantic HTML structure for screen readers

## Performance

- Status detection happens once per cell render
- Lookups are optimized with case-insensitive matching
- No API calls or external dependencies required

## Future Enhancements

Potential future improvements:
1. Allow custom status definitions via control properties
2. Support for Dataverse choice column color metadata
3. Configurable badge styles (rounded, square, pill)
4. Custom icon support
5. Theme integration with Fluent UI
