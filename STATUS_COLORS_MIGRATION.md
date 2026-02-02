# Status Colors Migration to SCSS

## Summary of Changes

Successfully moved all status color definitions from JavaScript (statusUtils.ts) to SCSS (CustomTable.scss) for better maintainability and centralized styling.

## Changes Made

### 1. CustomTable.scss
**Added Status Color Variables** (Lines 12-60):
- `$status-active`, `$status-inactive`, `$status-success`, `$status-failed`
- `$status-error`, `$status-warning`, `$status-info`, `$status-pending`
- `$status-in-progress`, `$status-completed`, `$status-on-hold`, `$status-cancelled`
- `$status-approved`, `$status-rejected`, `$status-under-review`, `$status-draft`
- `$status-submitted`, `$status-critical`, `$status-high`, `$status-medium`, `$status-low`
- `$status-urgent`, `$status-paid`, `$status-unpaid`, `$status-overdue`
- `$status-refunded`, `$status-partial`, `$status-new`, `$status-processing`
- `$status-shipped`, `$status-delivered`, `$status-returned`, `$status-trial`
- `$status-expired`, `$status-suspended`, `$status-enabled`, `$status-disabled`
- `$status-online`, `$status-offline`, `$status-paused`
- `$text-light` (#ffffff), `$text-dark` (#000000)

**Added Data Attribute Selectors** (Lines 245-368):
```scss
&__status-badge {
  // Base styles
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: $font-size-sm;
  font-weight: 500;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;

  // Status-specific colors using data-status attribute
  &[data-status="active"] { ... }
  &[data-status="inactive"] { ... }
  // ... etc for all status values
}
```

### 2. statusUtils.ts
**Simplified Interface**:
- Removed `bg` (background) and `text` (text color) from StatusStyle
- Now only contains `icon` property
- Colors are managed entirely in SCSS

**Before:**
```typescript
export interface StatusStyle {
  bg: string;      // Removed
  text: string;    // Removed
  icon: string;    // Kept
}
```

**After:**
```typescript
export interface StatusStyle {
  icon: string;    // Only icons now
}
```

**Removed Functions**:
- `getContrastTextColor()` - No longer needed, colors in SCSS

### 3. CustomTable.tsx
**Changed Badge Rendering**:
- Removed inline `style` prop with backgroundColor and color
- Added `data-status` attribute with lowercase status value
- Colors now applied via CSS selectors

**Before:**
```tsx
<span 
  className="custom-table__status-badge"
  style={{
    backgroundColor: statusStyle.bg,
    color: statusStyle.text,
  }}
>
```

**After:**
```tsx
<span 
  className="custom-table__status-badge"
  data-status={cellValue.toLowerCase()}
>
```

## How It Works

1. **Status Detection**: When a column name contains status-related keywords, the cell is identified as a status cell

2. **Icon Lookup**: The `getStatusStyle()` function returns only the icon for the status value

3. **Color Application**: The `data-status` attribute is set on the badge element with the lowercase status value

4. **CSS Matching**: SCSS selectors match the `data-status` attribute and apply the corresponding background and text colors

## Benefits

### 1. Centralized Styling
- All colors in one place (SCSS file)
- Easier to maintain and update
- Consistent with other component styles

### 2. Better Performance
- No inline styles computed at runtime
- CSS rules compiled once
- Browser can cache and optimize selectors

### 3. Easier Customization
- Change colors by editing SCSS variables
- No need to modify JavaScript code
- Can leverage SCSS features (mixins, functions, etc.)

### 4. Design System Integration
- Colors can be part of design tokens
- Easy to switch themes
- Can use CSS custom properties for runtime theming

### 5. Separation of Concerns
- Logic (JS) handles icons and detection
- Presentation (CSS) handles colors and styling
- Clear responsibility boundaries

## Status Color Mapping

| Status Value | Background Color | Text Color | Use Case |
|--------------|------------------|------------|----------|
| Active, Enabled, Online | Green (#28a745) | White | Active states |
| Inactive, Disabled, Offline | Gray (#6c757d) | White | Inactive states |
| Success, Completed, Approved, Paid, Delivered | Green (#28a745) | White | Success states |
| Failed, Error, Rejected, Unpaid, Expired | Red (#dc3545) | White | Error states |
| Warning | Yellow (#ffc107) | Black | Warning states |
| Info | Cyan (#17a2b8) | White | Info states |
| Not Started | Gray (#6c757d) | White | Not started |
| In Progress, Processing | Yellow (#ffc107) | Black | In progress |
| Pending, Submitted, New, Shipped, Trial | Cyan (#17a2b8) | White | Pending states |
| On Hold, Paused, Returned, Suspended, Partial | Orange (#fd7e14) | White | On hold states |
| Under Review | Yellow (#ffc107) | Black | Under review |
| Critical, Overdue | Dark Red (#721c24) | White | Critical priority |
| High, Urgent | Red (#dc3545) | White | High priority |
| Medium | Yellow (#ffc107) | Black | Medium priority |
| Low | Green (#28a745) | White | Low priority |
| Refunded | Cyan (#17a2b8) | White | Refunded |

## Testing

Build succeeded with no errors:
- SCSS compiled successfully
- All data-status selectors present in compiled CSS
- Bundle size: 4.25 MiB (similar to previous build)

## Future Enhancements

1. **CSS Custom Properties**: Convert SCSS variables to CSS custom properties for runtime theming
2. **Dark Mode**: Add dark mode color variants
3. **Custom Color Override**: Allow custom colors via control properties
4. **Color Accessibility**: Ensure WCAG AA compliance for all color combinations
