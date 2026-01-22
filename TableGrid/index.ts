import { IInputs, IOutputs } from "./generated/ManifestTypes";
import DataSetInterfaces = ComponentFramework.PropertyHelper.DataSetApi;
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { CustomTable } from './CustomTable';

type DataSet = ComponentFramework.PropertyTypes.DataSet;

export class TableGrid implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    notifyOutputChanged: () => void;
    container: HTMLDivElement;
    context: ComponentFramework.Context<IInputs>;
    sortedRecordsIds: string[] = [];
    resources: ComponentFramework.Resources;
    isTestHarness: boolean;
    records: Record<string, ComponentFramework.PropertyHelper.DataSetApi.EntityRecord>;
    filteredRecordCount?: number;
    isFullScreen = false;
    root: ReactDOM.Root | null = null;
    currentPage = 1;
    pageSize = 10;
    totalRecordCount = 0;
    currentSortColumn: string | null = null;
    currentSortDirection: 0 | 1 | -1 = 1; // 0 = None, 1 = Ascending, -1 = Descending
    selectedRecordIds: string[] = [];
    selectedRecordObjects: { recordId: string; [key: string]: unknown }[] = [];
    recordsToJson: { recordId: string; [key: string]: unknown }[] | null = null;
    previousRefreshValue = false;
    selectedLinkRecords: { recordId: string; [key: string]: unknown }[] = [];

    /**
     * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
     * Data-set values are not initialized here, use updateView.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
     * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
     * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
     * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
     */
    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary,
        container: HTMLDivElement
    ): void {
        // Add control initialization code
        this.notifyOutputChanged = notifyOutputChanged;
        this.container = container;
        this.context = context;
        this.context.mode.trackContainerResize(true);
        this.resources = this.context.resources;
        this.isTestHarness = document.getElementById("control-dimensions") !== null;
        
        // Set page size to 10 records per page
        if (context.parameters.records && context.parameters.records.paging) {
            context.parameters.records.paging.setPageSize(10);
            // console.log("Init - Page size set to: 10");
        }
    }

    /**
     * Handle server-side pagination navigation with custom logic
     */
    private onNavigate = (direction: "next" | "previous" | "first" | "last"): void => {
        const dataset = this.context.parameters.records;
        const paging = dataset.paging;
        
        // Calculate custom pagination info
        const totalPages = this.totalRecordCount > 0 ? Math.ceil(this.totalRecordCount / this.pageSize) : 1;
        const hasNext = paging.hasNextPage;
        const hasPrevious = this.currentPage > 1;
        
        // console.log(`Pagination: ${direction} requested`);
        // console.log('Current Page Before:', this.currentPage);
        // console.log('Total Pages:', totalPages);
        // console.log('Has Next (from paging):', hasNext);
        // console.log('Has Previous (custom):', hasPrevious);
        
        try {
            switch (direction) {
                case "next":
                    if (hasNext) {
                        // console.log('Loading next page...');
                        paging.loadNextPage();
                        this.currentPage++;
                    } else {
                        // console.log('No next page available');
                    }
                    break;
                case "previous":
                    if (hasPrevious) {
                        // console.log('Loading previous page...');
                        paging.loadPreviousPage();
                        this.currentPage--;
                    } else {
                        // console.log('Already on first page');
                    }
                    break;
                case "first":
                    if (this.currentPage !== 1) {
                        // console.log('Resetting to first page...');
                        paging.reset();
                        this.currentPage = 1;
                    }
                    break;
                case "last":
                    // console.log('Loading last page...');
                    // Calculate the last page number
                    {
                        const lastPage = totalPages;
                        // console.log('Target last page:', lastPage);
                        
                        let pagesLoaded = 0;
                        while (paging.hasNextPage && pagesLoaded < 100) { // Safety limit
                            paging.loadNextPage();
                            pagesLoaded++;
                        }
                        
                        // Set to the calculated last page number
                        this.currentPage = lastPage;
                        // console.log('Loaded pages:', pagesLoaded, 'Set current page to:', this.currentPage);
                    }
                    break;
            }
            
            // console.log('New Page:', this.currentPage);
        } catch (error) {
            console.error("Pagination error:", error);
        }
    };

    /**
     * Handle column sorting
     */
    private onSort = (columnName: string): void => {
        const dataset = this.context.parameters.records;
        
        // console.log('=== Sort Requested ===');
        // console.log('Column:', columnName);
        // console.log('Current Sort Column:', this.currentSortColumn);
        // console.log('Current Sort Direction:', this.currentSortDirection);
        
        // Determine new sort direction
        let newSortDirection: 0 | 1 | -1;
        
        if (this.currentSortColumn === columnName) {
            // Same column - toggle through: Ascending -> Descending -> None -> Ascending
            if (this.currentSortDirection === 1) {
                newSortDirection = -1; // Switch to descending
            } else if (this.currentSortDirection === -1) {
                newSortDirection = 0; // Remove sort
                this.currentSortColumn = null;
            } else {
                newSortDirection = 1; // Switch to ascending
            }
        } else {
            // Different column - start with ascending
            newSortDirection = 1;
            this.currentSortColumn = columnName;
        }
        
        this.currentSortDirection = newSortDirection;
        
        // console.log('New Sort Column:', this.currentSortColumn);
        // console.log('New Sort Direction:', this.currentSortDirection);
        
        // Find the column and apply sorting
        const column = dataset.columns.find(col => col.name === columnName);
        if (column) {
            if (newSortDirection === 0) {
                // Clear sorting
                dataset.sorting = [];
                // console.log('Sorting cleared');
            } else {
                // Apply sorting
                dataset.sorting = [{
                    name: columnName,
                    sortDirection: newSortDirection as 1 | -1
                }];
                // console.log('Sorting applied:', dataset.sorting);
            }
            
            // Reset to first page when sorting changes
            this.currentPage = 1;
            dataset.paging.reset();
            
            // Refresh the dataset
            dataset.refresh();
        }
        
        // console.log('====================');
    };

    /**
     * Handle selection changes
     */
    private onSelectionChange = (selectedIds: string[]): void => {
        console.log('=== Selection Changed ===');
        console.log('Previously Selected:', this.selectedRecordIds);
        console.log('Newly Selected:', selectedIds);
        
        this.selectedRecordIds = selectedIds;
        
        // Build complete record objects for selected records based on index
        this.selectedRecordObjects = [];
        
        if (selectedIds.length > 0 && this.recordsToJson) {
            // console.log('Selected IDs (indices):', selectedIds);
            // console.log('Records to Json Length:', this.recordsToJson.length);
            
            selectedIds.forEach((id) => {
                // Find record by matching recordId property instead of using index
                const selectedRecord = this.recordsToJson!.find(rec => rec.recordId === id);
                
                if (selectedRecord) {
                    this.selectedRecordObjects.push(selectedRecord);
                    // console.log(`  Added record with ID ${id}:`, selectedRecord);
                } else {
                    console.warn(`Record not found for ID: ${id}`);
                }
            });
            
            // Log the complete selected records as JSON
            // console.log('Selected Records Count:', this.selectedRecordObjects.length);
            // console.log('Selected Records as JSON:');
            // console.log(JSON.stringify(this.selectedRecordObjects, null, 2));
        } else {
            // console.log('No records selected or recordsToJson is empty');
        }
        
        // console.log('=======================');
        
        // Notify that outputs have changed
        this.notifyOutputChanged();
    };

    /**
     * Handle link click in first column
     * Always maintains only the most recently clicked record (length = 1)
     */
    private onLinkClick = (recordId: string): void => {
        // console.log('=== Link Clicked ===');
        // console.log('Clicked Record ID:', recordId);
        
        if (this.recordsToJson) {
            // Find record by matching recordId property instead of using index
            const clickedRecord = this.recordsToJson.find(rec => rec.recordId === recordId);
            
            if (clickedRecord) {
                // Clear existing records and add only the new one (maintain length = 1)
                this.selectedLinkRecords = [clickedRecord];
                // console.log('Set selected link record (cleared previous):', clickedRecord);
                // console.log('Total Selected Link Records:', this.selectedLinkRecords.length);
                // console.log('Selected Link Records:', JSON.stringify(this.selectedLinkRecords, null, 2));
                
                // Notify that outputs have changed
                this.notifyOutputChanged();
            } else {
                console.warn(`Record not found for ID: ${recordId}`);
            }
        } else {
            console.warn('recordsToJson is empty');
        }
        
        // console.log('====================');
    };

    /**
     * Calculate total records without using pagination
     * This method retrieves all available record IDs from the dataset
     */
    private calculateTotalRecordsWithoutPaging = (): number => {
        const dataset = this.context.parameters.records;
        
        // console.log('=== Calculate Total Records Without Paging ===');
        
        // Get all record IDs from the dataset
        const allRecordIds = dataset.sortedRecordIds;
        const totalRecords = allRecordIds.length;
        
        // console.log('All Record IDs Count:', totalRecords);
        // console.log('Dataset Records Object Keys Count:', Object.keys(dataset.records).length);
        // console.log('Paging Total Result Count:', dataset.paging.totalResultCount);
        // console.log('Paging Has Next Page:', dataset.paging.hasNextPage);
        // console.log('==============================================');
        
        return totalRecords;
    };

    /**
     * Convert records to JSON for debugging
     */
    private convertRecordsToJson = (): { recordId: string; [key: string]: unknown }[] => {
        const dataset = this.context.parameters.records;
        const jsonData = this.sortedRecordsIds.map((id) => {
            const record = this.records[id];
            const recordData: { recordId: string; [key: string]: unknown } = {
                recordId: id,
            };

            // Extract all column values
            dataset.columns.forEach((column) => {
                recordData[column.name] = record.getFormattedValue(column.name);
            });

            return recordData;
        });

        // console.log('=== Records as JSON ===');
        // console.log(JSON.stringify(jsonData, null, 2));
        // console.log('Total records:', jsonData.length);
        this.recordsToJson = jsonData;
        return jsonData;
    };

    /**
     * Convert sorted record IDs to JSON for debugging
     */
    private convertSortedIdsToJson = (): string[] => {
        // console.log('=== Sorted Record IDs ===');
        // console.log(JSON.stringify(this.sortedRecordsIds, null, 2));
        // console.log('Total IDs:', this.sortedRecordsIds.length);
        
        return this.sortedRecordsIds;
    };

    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     */
    public updateView(context: ComponentFramework.Context<IInputs>): void {
        // Add code to update control view
        const dataset = context.parameters.records;
        
        // Check if table refresh is requested
        const isTableRefresh = context.parameters.isTableRefresh?.raw === true;
        
        if (isTableRefresh && !this.previousRefreshValue) {
            // console.log('=== Table Refresh Triggered ===');
            
            // Reset all selections
            this.selectedRecordIds = [];
            this.selectedRecordObjects = [];
            this.selectedLinkRecords = [];
            
            // Reset pagination to first page
            this.currentPage = 1;
            dataset.paging.reset();
            
            // Clear sorting
            this.currentSortColumn = null;
            this.currentSortDirection = 1;
            dataset.sorting = [];
            
            // Refresh the dataset
            dataset.refresh();
            
            // console.log('Table refreshed - selections and filters cleared');
            // console.log('================================');
            
            // Notify that outputs have changed (selections are now empty)
            this.notifyOutputChanged();
        }
        
        // Update the previous refresh value
        this.previousRefreshValue = isTableRefresh;
        
        // Set page size to 10 records per page
        if (context.parameters.records && context.parameters.records.paging) {
            context.parameters.records.paging.setPageSize(10);
        }

        // The test harness provides width/height as strings
        const allocatedWidth = parseInt(
            context.mode.allocatedWidth as unknown as string
        );
        const allocatedHeight = parseInt(
            context.mode.allocatedHeight as unknown as string
        );

        // Update records when updateView is called
        this.records = dataset.records;
        this.sortedRecordsIds = dataset.sortedRecordIds;
        
        // Calculate total records without paging (gets all available records)
        const totalRecordsWithoutPaging = this.calculateTotalRecordsWithoutPaging();
        
        // Store total record count from paging for custom calculations
        // totalResultCount can be -1 if not available, use filteredRecordCount as fallback
        const pagingTotalCount = dataset.paging.totalResultCount;
        
        if (pagingTotalCount >= 0) {
            this.totalRecordCount = pagingTotalCount;
        } else if (dataset.paging.hasNextPage) {
            // If we have next page but no total count, estimate based on current data
            // This is approximate - we know there's at least more than current page
            this.totalRecordCount = (this.currentPage * this.pageSize) + this.pageSize;
        } else {
            // No next page and no total count - use current loaded records
            this.totalRecordCount = (this.currentPage - 1) * this.pageSize + this.sortedRecordsIds.length;
        }
        
        // console.log('Total Record Count Calculation:');
        // console.log('  - Total Records Without Paging:', totalRecordsWithoutPaging);
        // console.log('  - Paging Total Result Count:', pagingTotalCount);
        // console.log('  - Has Next Page:', dataset.paging.hasNextPage);
        // console.log('  - Current Page:', this.currentPage);
        // console.log('  - Sorted Record IDs Length:', this.sortedRecordsIds.length);
        // console.log('  - Calculated Total Record Count:', this.totalRecordCount);
        
        // Debug: Convert and log records and IDs as JSON
        this.convertRecordsToJson();
        this.convertSortedIdsToJson();

        if (this.container) {
            // Create root only once
            if (!this.root) {
                this.root = ReactDOM.createRoot(this.container);
            }
            
            // Get selection mode from manifest property (0=None, 1=Single, 2=Multiple)
            const selectionModeValue = Number(context.parameters.SelectionMode?.raw ?? 1);
            
            let selectionMode: "single" | "multiselect" | undefined;
            if (selectionModeValue === 0) {
                selectionMode = undefined; // No selection
            } else if (selectionModeValue === 1) {
                selectionMode = "single";
            } else {
                selectionMode = "multiselect";
            }
            
            // Custom pagination calculations
            const paging = dataset.paging;
            const totalPages = this.totalRecordCount > 0 ? Math.ceil(this.totalRecordCount / this.pageSize) : 1;
            const hasNextPage = paging.hasNextPage;
            const hasPreviousPage = this.currentPage > 1;
            
            // Get isLink property value
            const isLink = context.parameters.isLink?.raw === true;
            
            // console.log('=== UpdateView Custom Paging Info ===');
            // console.log('Current Page:', this.currentPage);
            // console.log('Page Size:', this.pageSize);
            // console.log('Total Record Count:', this.totalRecordCount);
            // console.log('Total Pages (calculated):', totalPages);
            // console.log('Has Next Page (from paging):', hasNextPage);
            // console.log('Has Previous Page (custom):', hasPreviousPage);
            // console.log('Loaded Records Count:', this.sortedRecordsIds.length);
            // console.log('Paging TotalResultCount:', paging.totalResultCount);
            // console.log('Paging PageSize:', paging.pageSize);
            // console.log('Current Sort Column:', this.currentSortColumn);
            // console.log('Current Sort Direction:', this.currentSortDirection);
            // console.log('Dataset Sorting:', dataset.sorting);
            // console.log('==============================');
            
            this.root.render(
                React.createElement(CustomTable, {
                    width: allocatedWidth,
                    height: allocatedHeight,
                    columns: dataset.columns,
                    records: this.records,
                    sortedRecordIds: this.sortedRecordsIds,
                    resources: this.resources,
                    itemsLoading: dataset.loading,
                    selectionMode: selectionMode,
                    hasNextPage: hasNextPage,
                    hasPreviousPage: hasPreviousPage,
                    currentPage: this.currentPage,
                    totalResultCount: this.calculateTotalRecordsWithoutPaging(),
                    onNavigate: this.onNavigate,
                    recordsPerPage: this.pageSize,
                    onSort: this.onSort,
                    sortColumn: this.currentSortColumn,
                    sortDirection: this.currentSortDirection,
                    onSelectionChange: this.onSelectionChange,
                    isTableRefresh: isTableRefresh,
                    isLink: isLink,
                    onLinkClick: this.onLinkClick,
                })
            );
        } else {
            console.error('Root element not found');
        }
    }

    /**
     * It is called by the framework prior to a control receiving new data.
     * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as "bound" or "output"
     */
    public getOutputs(): IOutputs {
        // Return selected record objects as JSON string
        const selectedRecordObjectsJson = this.selectedRecordObjects.length > 0
            ? JSON.stringify(this.selectedRecordObjects)
            : "";
        
        // Return selected link records as JSON string
        const selectedLinkRecordsJson = this.selectedLinkRecords.length > 0
            ? JSON.stringify(this.selectedLinkRecords)
            : "";
        
        // console.log('=== getOutputs Called ===');
        // console.log('Selected Record Objects:', this.selectedRecordObjects);
        // console.log('Selected Record Count:', this.selectedRecordObjects.length);
        // console.log('Selected Link Records:', this.selectedLinkRecords);
        // console.log('Selected Link Records Count:', this.selectedLinkRecords.length);
        // console.log('Output JSON (SelectedRecordIds):', selectedRecordObjectsJson);
        // console.log('Output JSON (SelectedLinkRecords):', selectedLinkRecordsJson);
        // console.log('========================');
        
        return {
            SelectedRecordIds: selectedRecordObjectsJson,
            SelectedLinkRecords: selectedLinkRecordsJson,
        };
    }

    /**
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void {
        // Add code to cleanup control if necessary
        if (this.root) {
            this.root.unmount();
            this.root = null;
        }
    }
}
