
import { Component, SimpleChanges, Renderer2, ChangeDetectorRef, ChangeDetectionStrategy, Inject, ContentChild, TemplateRef, ViewChild, ElementRef, CSP_NONCE, DOCUMENT, input, output } from '@angular/core';
import { ICustomObjectValue, ServoyBaseComponent, ServoyPublicService } from '@servoy/public';
import { GridStack, GridStackOptions, GridStackWidget } from 'gridstack';
import { GridstackComponent } from 'gridstack/dist/angular';

@Component({
    selector: 'svywidget-widgetlayout',
    templateUrl: './widgetlayout.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class Widgetlayout extends ServoyBaseComponent<HTMLDivElement> {

    onLayoutChange = input<(e: Event, layout: Object) => void>();
    onWidgetClick = input<(e: Event, widgetId: string) => void>();

    editable = input<boolean>(false);
    widgetMargin = input<margin>();
    rowSettings = input<rowSettings>();
    widgets = input<Widget[]>([]);
    widgetsChange = output<Widget[]>();
    styleClass = input<string>('');
    styleClassWidget = input<string>('');
    styleClassWidgetEdit = input<string>('');

    @ViewChild(GridstackComponent) gridComp?: GridstackComponent;
    @ViewChild('element') gridElement?: ElementRef;

    @ContentChild(TemplateRef, { static: true })
	templateRef: TemplateRef<any>;
    
    private loadedWidgetsMap = new Map<string, Widget>();
    private widgetBuilder = null;
    private grid: GridStack;
    public widgetItemClass = "";
    public gridOptions: GridStackOptions = {
        column: 12,
        minRow: 1,
        nonce: this.nonce,
        float: true,
        animate: false,
        columnOpts: {
            layout: 'compact',
            breakpoints: [{w:576, c:3},{w:768, c:6},{w:992, c:9},{w:1200, c:12}]
        }
      }
    
    constructor(protected readonly renderer: Renderer2, protected cdRef: ChangeDetectorRef, @Inject(DOCUMENT,) private document: Document,
    private servoyPublic: ServoyPublicService, @Inject(CSP_NONCE) private nonce: string) {
         super(renderer, cdRef);
    }
    
    svyOnInit() {
        super.svyOnInit();
    }
    
    svyOnChanges( changes: SimpleChanges ) {
        if(changes) {
            for (const property of Object.keys(changes)) {
                const change = changes[property];
                switch (property) {
                    case 'widgets':
                        if(this.hasChangesForRerender(Array.from(this.loadedWidgetsMap.values()), this.widgets())) {
                            if(this.widgetBuilder) {
                                clearTimeout(this.widgetBuilder);
                            }
                            this.widgetBuilder = setTimeout(() => {
                                this.widgetBuilder = null;
                                this.initWidgets();    
                            }, 100);
                        }
                        
                        break;
                    case 'editable':
                        if(!this.editable()) {
                            this.gridComp.grid.disable();
                            this.widgetItemClass = this.styleClassWidget()||"";
                        } else {
                            this.gridComp.grid.enable();
                            this.widgetItemClass = `${this.styleClassWidget()||""} ${this.styleClassWidgetEdit()||""}`;
                        }
                    break;
                    case 'rowSettings':
                        if(this.rowSettings()?.rowHeight == -1) {
                            this.gridComp.grid.cellHeight('auto');
                        } else {
                            this.gridComp.grid.cellHeight(this.rowSettings()?.rowHeight);
                        }
                    break;
                    case 'widgetMargin':
                        const margin = this.widgetMargin();
                        if(margin) {
                            this.gridComp.grid.margin(`${margin.top}px ${margin.right}px ${margin.bottom}px ${margin.left}px`);
                        }
                    break
                }
            }
        }
        super.svyOnChanges(changes);
    }

    ngOnDestroy() {
        super.ngOnDestroy();
        if(this.widgetBuilder) {
            clearTimeout(this.widgetBuilder);
        }
        Array.from(this.loadedWidgetsMap.values()).map(widget => this.servoyApi.hideForm(widget.form, widget.relationName));
        if(this.grid) {
            this.grid.destroy();
        }
    }

    private notifyChange() {
		this.widgetsChange.emit(this.widgets());
	}

    initWidgets() {
        //Clear UI before triggering hideForm
        this.removeOnChangeEvents();
        this.gridComp.grid.removeAll(true, false);
        let destroyPromises = Array.from(this.loadedWidgetsMap.values()).map(widget => {
            this.servoyApi.hideForm(widget.form, widget.relationName)
        });
        Promise.all(destroyPromises).then(() => {
            this.loadedWidgetsMap.clear();
        }).then(() => {
            let promises = this.widgets().map(widget => {
                if(!widget.form) {
                    return Promise.resolve(widget);
                }
                if(!widget.id) {
                    widget.id = `${this.servoyApi.getMarkupId()}-${widget.form}-widget`;
                }
                return this.servoyApi.formWillShow(widget.form, widget.relationName).then(() => {
                    const formCache = this.servoyPublic.getFormCacheByName(widget.form);
                    const newWidget: GridStackWidget = {};
                    
                    if (formCache?.absolute) {
                        const cellHeight = this.gridComp.grid.getCellHeight();
                        const cellWidth = this.gridComp.grid.cellWidth();
                        
                        newWidget.minH = Math.ceil(formCache.size.height / cellHeight);
                        newWidget.minW = Math.ceil(formCache.size.width / cellWidth);
                        newWidget.h = widget.height && widget.height > 0 ? widget.height : newWidget.minH || 1;
                        newWidget.w = widget.width && widget.width > 0 ? widget.width : newWidget.minW || 1;
                    } else {
                        newWidget.h = widget.height && widget.height > 0 ? widget.height : 1;
                        newWidget.w = widget.width && widget.width > 0 ? widget.width : 1;
                    }
                    
                    newWidget.y = widget.posY;
                    newWidget.x = widget.posX;
                    newWidget.id = widget.id;
                    newWidget.sizeToContent = widget.sizeToContent;
                    newWidget.noMove = widget.noMove;
                    newWidget.noResize = widget.noResize;
                    
                    // Store widget with GridStack properties for easy access
                    widget.gridStackWidget = newWidget;
                    this.loadedWidgetsMap.set(widget.id, widget);
                });
            });

            Promise.all(promises).then(() => {
                this.registerOnChangeEvents();
                
                //Wait until all widget contents in Servoy are rendered (listForms / Aggrid)
                this.waitForWidgetContentReady().then(() => {
                    this.resizeToContentWidgetsToFit();
                    //Trigger resize event so that servoy also knows the correct form sizes
                    setTimeout(() => {
                        window.dispatchEvent(new Event('resize'));
                    }, 100);  
                    
                    if(this.onLayoutChange()) {
                        this.onLayoutChange()(this.createJSEvent(), this.getCurrentLayout());
                    }
                });
            });
        })
    }
    
    private createJSEvent() {
        const event = this.document.createEvent('MouseEvents');
        event.initMouseEvent('click', false, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
        return event;
    }

    private waitForWidgetContentReady(): Promise<void> {
        //Workaround for issue where widgets with dynamic content (like listforms or aggrid) are not fully rendered, in that case gridstack measures wrong height
        return new Promise((resolve) => {
            let lastTotalHeight = 0;
            let stableCount = 0;
            let maxChecks = 15;
            
            const check = () => {
                try {
                    maxChecks--;
                    if (maxChecks <= 0) {
                        resolve(); // Give up after max checks
                        return;
                    }
                    // If no widgets, resolve immediately
                    if(this.gridComp.grid.getGridItems().length === 0) {
                        resolve();
                        return;
                    }
                    // Get total height of all containers
                    const totalHeight = this.gridComp.grid.getGridItems()
                        .reduce((sum, item) => {
                            const container = item.querySelector(`#${item.id}-container`);
                            return sum + (container?.scrollHeight || 0);
                        }, 0);
                    
                    // Height is stable if it hasn't changed
                    if (totalHeight === lastTotalHeight && totalHeight > 100) {
                        stableCount++;
                        if (stableCount >= 2) { // 2 consecutive stable checks
                            resolve();
                            return;
                        }
                    } else {
                        stableCount = 0; // Reset if height changed
                    }
                    
                    lastTotalHeight = totalHeight;
                    setTimeout(check, 100);
                } catch (e) {
                    resolve();
                }
            };
            
            setTimeout(check, 100);
        });
    }

    private updateWidgetRefs(items: WidgetLayout[]) {
        items.forEach(item => {
            const matchingWidget = this.loadedWidgetsMap.get(item.id);
            if(matchingWidget) {
                matchingWidget.posX = item.posX;
                matchingWidget.posY = item.posY;
                matchingWidget.width = item.width || item.minW;
                matchingWidget.height = item.height || item.minH;
            }
        });

        this.notifyChange();
    }

    public onWidgetClickHandler(e: Event, widgetId: string) {
        if(this.onWidgetClick()) {
            this.onWidgetClick()(e, widgetId);
        }
    }

    public getProperty(renderWidget: GridStackWidget, propertyName:string) {
        const matchingWidget = this.loadedWidgetsMap.get(renderWidget.id);
		if (matchingWidget && matchingWidget[propertyName]) {
			return matchingWidget[propertyName];
		} else {
			return null;
		}
    }

    public identify(index: number, renderWidget: GridStackWidget) {
        return renderWidget.id; // or use index if no id is set and you only modify at the end...
    }

    // Expose display widgets from Map as array for template iteration
    public get displayWidgets(): GridStackWidget[] {
        return Array.from(this.loadedWidgetsMap.values()).map(widget => widget.gridStackWidget).filter(Boolean);
    }

    public getCurrentLayout():WidgetLayout[] {
        return this.gridComp.gridstackItems?.map(item => ({
            id: item.options.id,
            posX: item.options.x,
            posY: item.options.y,
            width: item.options.w,
            height: item.options.h,
            minH: item.options.minH,
            minW: item.options.minW,
            noMove: item.options.noMove,
            noResize: item.options.noResize,
            form: this.getProperty(item.el, 'form')
        })) || [];
    }


    public resizeToContentWidgetsToFit() {
        this.gridComp.grid.getGridItems().forEach(widget => {
            const loadedWidget = this.loadedWidgetsMap.get(widget.id);
            if(loadedWidget?.sizeToContent) {
                this.gridComp.grid.resizeToContent(widget);
            }
        })
        this.updateWidgetRefs(this.getCurrentLayout());
    }

    private registerOnChangeEvents() {
        this.gridComp.grid.on('change', (e, nodes) => {
            this.updateWidgetRefs(this.getCurrentLayout());
            if(this.onLayoutChange()) {
                this.onLayoutChange()(e, this.getCurrentLayout());
            }
        });
    }

    private removeOnChangeEvents() {
        this.gridComp.grid.off('change');
    }
    
    private hasChangesForRerender(objA: WidgetLayout[], objB: WidgetLayout[]): boolean {
        const getIds = (arr: WidgetLayout[]) => arr.map(item => item.id).sort();
        const getForms = (arr: WidgetLayout[]) => arr.map(item => item.form).sort();
        
        const loadedWidgetIds = getIds(objA);
        const loadedWidgetForms = getForms(objA);
        const widgetIds = getIds(objB);
        const widgetForms = getForms(objB);

        if (loadedWidgetIds.length !== widgetIds.length) {
            return true;
        }

        // Check if every element in both sorted arrays are the same
        return !loadedWidgetIds.every((id, index) => id === widgetIds[index]) && !loadedWidgetForms.every((form, index) => form === widgetForms[index]);
    }
}

interface WidgetLayout {
    id?: string;
    form?: any;
    minH?: number;
    minW?: number;
    posX?: number;
    posY?: number;
    width?: number;
    height?: number;
    sizeToContent?: boolean;
    noResize?: boolean;
    noMove?: boolean;
}

interface Widget extends ICustomObjectValue {
    id: string;
    form: any;
    relationName: any;
    minH: number;
    minW: number;
    posX: number;
    posY: number;
    width: number;
    height: number;
    wrapperClass: string;
    widgetItemContainerClass: string;
    sizeToContent: boolean;
    noResize: boolean;
    noMove: boolean;
    gridStackWidget?: GridStackWidget;
}

interface margin extends ICustomObjectValue {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

interface rowSettings extends ICustomObjectValue {
    rowHeight: number;
    minRows: number;
    maxRows: number;
}