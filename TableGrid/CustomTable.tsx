import * as React from "react";

import type { JSXElement } from "@fluentui/react-components";
import {
  PresenceBadgeStatus,
  Avatar,
  TableBody,
  TableCell,
  TableRow,
  Table,
  TableHeader,
  TableHeaderCell,
  TableSelectionCell,
  TableCellLayout,
  useTableFeatures,
  TableColumnDefinition,
  useTableSelection,
  createTableColumn,
  Button,
  Popover,
  PopoverTrigger,
  PopoverSurface,
  Input,
  Label,
  Dropdown,
  Option,
} from "@fluentui/react-components";
import { FilterRegular, ArrowUpRegular, ArrowDownRegular, DismissRegular } from "@fluentui/react-icons";
import { IObjectWithKey } from "@fluentui/react/lib/components/DetailsList";

type DataSet = ComponentFramework.PropertyHelper.DataSetApi.EntityRecord & IObjectWithKey;

interface ColumnFilter {
  columnName: string;
  operator: string;
  value: string;
}

export interface GridProps {
  width?: number;
  height?: number;
  columns: ComponentFramework.PropertyHelper.DataSetApi.Column[];
  records: Record<
    string,
    ComponentFramework.PropertyHelper.DataSetApi.EntityRecord
  >;
  sortedRecordIds: string[];
  resources: ComponentFramework.Resources;
  itemsLoading: boolean;
  selectionMode?: "single" | "multiselect" | undefined;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  currentPage: number;
  totalResultCount: number;
  onNavigate: (direction: "next" | "previous" | "first" | "last") => void;
  recordsPerPage: number;
  onSort: (columnName: string) => void;
  sortColumn: string | null;
  sortDirection: 0 | 1 | -1; // 0 = None, 1 = Ascending, -1 = Descending
  onSelectionChange: (selectedIds: string[]) => void;
  isTableRefresh?: boolean;
  isLink?: boolean;
  onLinkClick?: (recordId: string) => void;
}

export const CustomTable = React.memo((props: GridProps) => {
  const [isComponentLoading, setIsLoading] = React.useState<boolean>(false);
  
  // State for column filters
  const [columnFilters, setColumnFilters] = React.useState<Map<string, ColumnFilter>>(new Map());
  const [openFilterColumn, setOpenFilterColumn] = React.useState<string | null>(null);
  const [tempFilterOperator, setTempFilterOperator] = React.useState<string>("Contains");
  const [tempFilterValue, setTempFilterValue] = React.useState<string>("");
  
  // State for column widths and resizing
  const [columnWidths, setColumnWidths] = React.useState<Map<string, number>>(new Map());
  const [resizingColumn, setResizingColumn] = React.useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = React.useState<number>(0);
  const [resizeStartWidth, setResizeStartWidth] = React.useState<number>(0);

  const {
    records,
    sortedRecordIds,
    columns,
    width,
    height,
    itemsLoading,
    selectionMode,
    hasNextPage,
    hasPreviousPage,
    currentPage,
    totalResultCount,
    onNavigate,
    recordsPerPage,
    onSort,
    sortColumn,
    sortDirection,
    onSelectionChange,
    isTableRefresh,
    isLink,
    onLinkClick,
  } = props;

  // Reset all local state when table refresh is triggered
  React.useEffect(() => {
    if (isTableRefresh) {
      // console.log('=== CustomTable: Refresh Triggered ===');
      
      // Clear all filters
      setColumnFilters(new Map());
      
      // Reset filter popup state
      setOpenFilterColumn(null);
      setTempFilterOperator("Contains");
      setTempFilterValue("");
      
      // Reset column widths to default
      setColumnWidths(new Map());
      
      // Reset resizing state
      setResizingColumn(null);
      setResizeStartX(0);
      setResizeStartWidth(0);
      
      // console.log('CustomTable state reset complete');
      // console.log('====================================');
    }
  }, [isTableRefresh]);

  // Convert records to JSON for debugging - see what data is returned from service
  const recordsJson = React.useMemo(() => {
    const jsonData = sortedRecordIds.map((id) => {
      const record = records[id];
      const recordData: { recordId: string; [key: string]: unknown } = {
        recordId: id,
      };

      // Extract all column values
      columns.forEach((column) => {
        recordData[column.name] = record.getFormattedValue(column.name);
      });

      return recordData;
    });
    
    // console.log('Records JSON from service:', jsonData);
    // console.log('Total records count:', jsonData.length);
    // console.log('Sorted Record IDs:', sortedRecordIds);
    
    return jsonData;
  }, [records, sortedRecordIds, columns]);

  // Apply filters and pagination to records
  const displayRecordIds = React.useMemo(() => {
    // First, apply filters if any exist
    let filteredIds = sortedRecordIds;
    
    if (columnFilters.size > 0) {
      filteredIds = sortedRecordIds.filter(id => {
        const record = records[id];
        if (!record) return false;
        
        // Check all active filters
        for (const [columnName, filter] of columnFilters.entries()) {
          const value = record.getFormattedValue(columnName);
          const filterValue = filter.value.toLowerCase();
          const recordValue = String(value || '').toLowerCase();
          
          let matches = false;
          switch (filter.operator) {
            case 'Contains':
              matches = recordValue.includes(filterValue);
              break;
            case 'Equals':
              matches = recordValue === filterValue;
              break;
            case 'Starts with':
              matches = recordValue.startsWith(filterValue);
              break;
            case 'Ends with':
              matches = recordValue.endsWith(filterValue);
              break;
            case 'Does not contain':
              matches = !recordValue.includes(filterValue);
              break;
            default:
              matches = recordValue.includes(filterValue);
          }
          
          if (!matches) return false; // Must match all filters
        }
        
        return true;
      });
    }
    
    // Calculate start and end indices for current page
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    
    // Slice to get only current page records
    const pagedRecords = filteredIds.slice(startIndex, endIndex);
    
    // console.log('=== Display Record IDs Filtering & Slicing ===');
    // console.log('Active Filters:', Array.from(columnFilters.entries()));
    // console.log('Total Sorted IDs:', sortedRecordIds.length);
    // console.log('Filtered IDs:', filteredIds.length);
    // console.log('Current Page:', currentPage);
    // console.log('Records Per Page:', recordsPerPage);
    // console.log('Start Index:', startIndex);
    // console.log('End Index:', endIndex);
    // console.log('Paged Records:', pagedRecords);
    // console.log('=============================================');
    
    return pagedRecords;
  }, [sortedRecordIds, currentPage, recordsPerPage, columnFilters, records]);

  // Handle opening filter popup
  const handleOpenFilter = (columnName: string) => {
    const existingFilter = columnFilters.get(columnName);
    setTempFilterOperator(existingFilter?.operator || "Contains");
    setTempFilterValue(existingFilter?.value || "");
    setOpenFilterColumn(columnName);
  };

  // Handle applying filter
  const handleApplyFilter = () => {
    if (openFilterColumn && tempFilterValue.trim()) {
      const newFilters = new Map(columnFilters);
      newFilters.set(openFilterColumn, {
        columnName: openFilterColumn,
        operator: tempFilterOperator,
        value: tempFilterValue.trim(),
      });
      setColumnFilters(newFilters);
      // console.log('Filter applied:', { columnName: openFilterColumn, operator: tempFilterOperator, value: tempFilterValue });
    }
    setOpenFilterColumn(null);
  };

  // Handle clearing filter
  const handleClearFilter = () => {
    if (openFilterColumn) {
      const newFilters = new Map(columnFilters);
      newFilters.delete(openFilterColumn);
      setColumnFilters(newFilters);
      // console.log('Filter cleared for column:', openFilterColumn);
    }
    setTempFilterValue("");
    setOpenFilterColumn(null);
  };

  // Handle column resize start
  const handleResizeStart = (columnName: string, startX: number) => {
    const currentWidth = columnWidths.get(columnName) || 150; // Default 150px
    setResizingColumn(columnName);
    setResizeStartX(startX);
    setResizeStartWidth(currentWidth);
    // console.log('Resize started for column:', columnName, 'Current width:', currentWidth);
  };

  // Handle column resize move
  const handleResizeMove = React.useCallback((e: MouseEvent) => {
    if (resizingColumn) {
      const deltaX = e.clientX - resizeStartX;
      const newWidth = Math.max(80, resizeStartWidth + deltaX); // Minimum 80px
      const newWidths = new Map(columnWidths);
      newWidths.set(resizingColumn, newWidth);
      setColumnWidths(newWidths);
    }
  }, [resizingColumn, resizeStartX, resizeStartWidth, columnWidths]);

  // Handle column resize end
  const handleResizeEnd = React.useCallback(() => {
    if (resizingColumn) {
      // console.log('Resize ended for column:', resizingColumn, 'New width:', columnWidths.get(resizingColumn));
      setResizingColumn(null);
    }
  }, [resizingColumn, columnWidths]);

  // Add mouse event listeners for resizing
  React.useEffect(() => {
    if (resizingColumn) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [resizingColumn, handleResizeMove, handleResizeEnd]);

  // Create columns from the dataset columns (no sorting)
  const tableColumns = React.useMemo(() => {
    return columns.map((column) =>
      createTableColumn<{ recordId: string }>({
        columnId: column.name,
        renderHeaderCell: () => column.displayName,
        renderCell: (item) => {
          const record = records[item.recordId];
          // Hide HighlightIndicator text content, but keep the column
          if (column.name === "HighlightIndicator") {
            return <TableCellLayout></TableCellLayout>;
          }
          return (
            <TableCellLayout>
              {record ? record.getFormattedValue(column.name) : ''}
            </TableCellLayout>
          );
        },
      })
    );
  }, [columns, records]);

  // Create rows from record IDs
  const tableRows = React.useMemo(() => {
    // console.log('Display Record IDs:', displayRecordIds);
    return displayRecordIds.map((id) => ({
      recordId: id,
    }));
  }, [displayRecordIds]);

  // Setup table features with selection
  // Always setup selection features to maintain consistent hook calls
  // Use "single" as minimum mode, then hide UI if selectionMode is undefined
  const {
    getRows,
    selection: {
      allRowsSelected,
      someRowsSelected,
      toggleAllRows,
      toggleRow,
      isRowSelected,
    } = {},
  } = useTableFeatures(
    {
      columns: tableColumns,
      items: tableRows,
    },
    [
      useTableSelection({
        selectionMode: selectionMode || "single", // Always provide a mode for consistent hooks
        defaultSelectedItems: new Set([]),
        onSelectionChange: (e, data) => {
          // data.selectedItems contains record IDs (not indices) because we use row.item.recordId in toggleRow
          // console.log('data.selectedItems ', data.selectedItems)
          
          // Convert the Set to Array of strings - these are already record IDs
          const selectedIds = Array.from(data.selectedItems).map(id => String(id));
          // console.log('Selected Record IDs:', selectedIds);
          
          // Call the parent callback with selected record IDs
          if (onSelectionChange) {
            onSelectionChange(selectedIds);
          }
        },
      }),
    ]
  );

  const rows = getRows((row) => {
    const selected = isRowSelected ? isRowSelected(row.item.recordId) : false;
    return {
      ...row,
      onClick: (e: React.MouseEvent) => toggleRow && toggleRow(e, row.item.recordId),
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === " " && toggleRow) {
          e.preventDefault();
          // console.log('Row id is clicked:', row.item.recordId);
          toggleRow(e, row.item.recordId);
        }
      },
      selected,
      appearance: selected ? ("brand" as const) : ("none" as const),
    };
  });

  // console.log('rows  ->  ', rows);

  const toggleAllKeydown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === " " && toggleAllRows) {
        toggleAllRows(e);
        e.preventDefault();
      }
    },
    [toggleAllRows]
  );

  return (
    <div style={{ width: width || "100%", height: height || "100%", overflow: "auto" }}>
      <Table aria-label="Dynamic table" style={{ minWidth: "100%" }}>
        <TableHeader>
          <TableRow>
            {selectionMode && (
              <TableSelectionCell
                checked={
                  allRowsSelected ? true : someRowsSelected ? "mixed" : false
                }
                onClick={toggleAllRows}
                onKeyDown={toggleAllKeydown}
                checkboxIndicator={
                  selectionMode === "single"
                    ? { "aria-label": "Select row" }
                    : { "aria-label": "Select all rows" }
                }
                // Hide the header checkbox/radio for single selection mode
                style={selectionMode === "single" ? { visibility: "hidden" } : undefined}
              />
            )}
            {columns.map((column) => {
              const isSorted = sortColumn === column.name;
              const hasFilter = columnFilters.has(column.name);
              const columnWidth = columnWidths.get(column.name) || 150; // Default 150px
              
              return (
                <TableHeaderCell 
                  key={column.name}
                  style={{ 
                    userSelect: 'none',
                    fontWeight: isSorted ? 'bold' : 'normal',
                    position: 'relative',
                    width: `${columnWidth}px`,
                    minWidth: `${columnWidth}px`,
                    maxWidth: `${columnWidth}px`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, overflow: 'hidden' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {column.displayName}
                      </span>
                      {isSorted && (
                        sortDirection === 1 
                          ? <ArrowUpRegular style={{ fontSize: '14px', color: '#0078d4', flexShrink: 0 }} />
                          : sortDirection === -1 
                            ? <ArrowDownRegular style={{ fontSize: '14px', color: '#0078d4', flexShrink: 0 }} />
                            : null
                      )}
                    </div>
                    <Popover
                      open={openFilterColumn === column.name}
                      onOpenChange={(e, data) => {
                        if (data.open) {
                          handleOpenFilter(column.name);
                        } else {
                          setOpenFilterColumn(null);
                        }
                      }}
                    >
                      <PopoverTrigger disableButtonEnhancement>
                        <Button
                          appearance="subtle"
                          size="small"
                          icon={<FilterRegular />}
                          style={{ 
                            minWidth: 'auto',
                            color: hasFilter ? '#0078d4' : undefined,
                            fontWeight: hasFilter ? 'bold' : undefined
                          }}
                          aria-label={`Filter ${column.displayName}`}
                        />
                      </PopoverTrigger>
                      <PopoverSurface style={{ padding: '16px', minWidth: '320px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {/* Header with Close Button */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Label weight="semibold" style={{ fontSize: '16px' }}>{column.displayName}</Label>
                            <Button
                              appearance="subtle"
                              size="small"
                              icon={<DismissRegular />}
                              onClick={() => setOpenFilterColumn(null)}
                              aria-label="Close"
                              style={{ minWidth: 'auto' }}
                            />
                          </div>
                          
                          {/* Sort Section */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <Label size="small" weight="semibold">Sort</Label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <Button
                                appearance="outline"
                                icon={<ArrowUpRegular />}
                                onClick={() => {
                                  onSort(column.name);
                                  if (sortColumn !== column.name || sortDirection !== 1) {
                                    onSort(column.name);
                                  }
                                  setOpenFilterColumn(null);
                                }}
                                style={{ 
                                  flex: 1,
                                  backgroundColor: sortColumn === column.name && sortDirection === 1 ? '#e6f2ff' : undefined
                                }}
                              >
                                Sort A to Z
                              </Button>
                              <Button
                                appearance="outline"
                                icon={<ArrowDownRegular />}
                                onClick={() => {
                                  if (sortColumn === column.name && sortDirection === 1) {
                                    onSort(column.name); // Toggle to descending
                                  } else if (sortColumn !== column.name) {
                                    onSort(column.name); // Set to ascending first
                                    setTimeout(() => onSort(column.name), 100); // Then to descending
                                  }
                                  setOpenFilterColumn(null);
                                }}
                                style={{ 
                                  flex: 1,
                                  backgroundColor: sortColumn === column.name && sortDirection === -1 ? '#e6f2ff' : undefined
                                }}
                              >
                                Sort Z to A
                              </Button>
                            </div>
                          </div>
                          
                          {/* Divider */}
                          <div style={{ borderTop: '1px solid #e0e0e0' }}></div>
                          
                          {/* Filter Section */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <Label size="small" weight="semibold">Filter</Label>
                            
                            <div>
                              <Label size="small">Filter by operator</Label>
                              <Dropdown
                                value={tempFilterOperator}
                                onOptionSelect={(e, data) => setTempFilterOperator(data.optionValue || "Contains")}
                                style={{ width: '100%' }}
                              >
                                <Option value="Contains">Contains</Option>
                                <Option value="Equals">Equals</Option>
                                <Option value="Starts with">Starts with</Option>
                                <Option value="Ends with">Ends with</Option>
                                <Option value="Does not contain">Does not contain</Option>
                              </Dropdown>
                            </div>
                            
                            <div>
                              <Label size="small">Filter by value</Label>
                              <Input
                                value={tempFilterValue}
                                onChange={(e, data) => setTempFilterValue(data.value)}
                                placeholder="Please enter value"
                                style={{ width: '100%' }}
                              />
                            </div>
                            
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                              <Button appearance="secondary" onClick={handleClearFilter}>
                                Clear
                              </Button>
                              <Button appearance="primary" onClick={handleApplyFilter}>
                                Apply
                              </Button>
                            </div>
                          </div>
                        </div>
                      </PopoverSurface>
                    </Popover>
                  </div>
                  
                  {/* Resize Handle */}
                  <div
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleResizeStart(column.name, e.clientX);
                    }}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: '8px',
                      cursor: 'col-resize',
                      backgroundColor: resizingColumn === column.name ? '#0078d4' : 'transparent',
                      transition: 'background-color 0.2s',
                      zIndex: 10,
                    }}
                    onMouseEnter={(e) => {
                      if (!resizingColumn) {
                        (e.target as HTMLElement).style.backgroundColor = '#e0e0e0';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!resizingColumn) {
                        (e.target as HTMLElement).style.backgroundColor = 'transparent';
                      }
                    }}
                  />
                </TableHeaderCell>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ item, selected, onClick, onKeyDown, appearance }) => (
            <TableRow
              key={item.recordId}
              onClick={onClick}
              onKeyDown={onKeyDown}
              aria-selected={selected}
              appearance={appearance}
            >
              {selectionMode && (
                <TableSelectionCell
                  checked={selected}
                  checkboxIndicator={
                    selectionMode === "single"
                      ? { "aria-label": "Select row" }
                      : { "aria-label": "Select row" }
                  }
                  radioIndicator={
                    selectionMode === "single"
                      ? { "aria-label": "Select row" }
                      : undefined
                  }
                />
              )}
              {columns.map((column, columnIndex) => {
                const record = records[item.recordId];
                const columnWidth = columnWidths.get(column.name) || 150;
                const isFirstColumn = columnIndex === 0;
                const cellValue = column.name === "HighlightIndicator" 
                  ? '' 
                  : (record ? record.getFormattedValue(column.name) : '');
                
                return (
                  <TableCell 
                    key={`${item.recordId}-${column.name}`}
                    style={{
                      width: `${columnWidth}px`,
                      minWidth: `${columnWidth}px`,
                      maxWidth: `${columnWidth}px`,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <TableCellLayout>
                      {/* Make first column a link if isLink is true */}
                      {isFirstColumn && isLink && onLinkClick ? (
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onLinkClick(item.recordId);
                          }}
                          style={{
                            color: '#0078d4',
                            textDecoration: 'none',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => {
                            (e.target as HTMLAnchorElement).style.textDecoration = 'underline';
                          }}
                          onMouseLeave={(e) => {
                            (e.target as HTMLAnchorElement).style.textDecoration = 'none';
                          }}
                        >
                          {cellValue}
                        </a>
                      ) : (
                        cellValue
                      )}
                    </TableCellLayout>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {itemsLoading && <div style={{ padding: "10px", textAlign: "center" }}>Loading...</div>}
      {tableRows.length === 0 && !itemsLoading && <div style={{ padding: "10px", textAlign: "center" }}>No records found</div>}
      
      {/* Server-side Pagination Controls */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        padding: "10px",
        borderTop: "1px solid #e0e0e0"
      }}>
        <div style={{ fontSize: "14px" }}>
          Page {currentPage} | Total Records: {totalResultCount >= 0 ? totalResultCount : 'Unknown'} | Records Per Page: {recordsPerPage}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Button 
            appearance="secondary"
            disabled={!hasPreviousPage || itemsLoading}
            onClick={() => onNavigate("first")}
          >
            First
          </Button>
          <Button 
            appearance="secondary"
            disabled={!hasPreviousPage || itemsLoading}
            onClick={() => onNavigate("previous")}
          >
            Previous
          </Button>
          <Button 
            appearance="secondary"
            disabled={!hasNextPage || itemsLoading}
            onClick={() => onNavigate("next")}
          >
            Next
          </Button>
          <Button 
            appearance="secondary"
            disabled={!hasNextPage || itemsLoading}
            onClick={() => onNavigate("last")}
          >
            Last
          </Button>
        </div>
      </div>
    </div>
  );
});