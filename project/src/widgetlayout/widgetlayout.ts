import { DOCUMENT } from '@angular/common';
import { Component, Input, SimpleChanges, Renderer2, ChangeDetectorRef, ChangeDetectionStrategy, Inject, ContentChild, TemplateRef, ViewChild, Output, EventEmitter, ElementRef } from '@angular/core';
import { BaseCustomObject, ServoyBaseComponent, ServoyPublicService } from '@servoy/public';
import { GridStack, GridStackOptions, GridStackWidget, GridStackNode} from 'gridstack';
import { GridstackComponent } from 'gridstack/dist/angular';

@Component({
    selector: 'svywidget-widgetlayout',
    templateUrl: './widgetlayout.html',
     changeDetection: ChangeDetectionStrategy.OnPush
})
export class Widgetlayout extends ServoyBaseComponent<HTMLDivElement> {

    @Input() onLayoutChange: (e: Event, layout: Object) => void;
    @Input() onWidgetClick: (e: Event, widgetId: string) => void;

    @Input() editable: boolean;
    @Input() widgetMargin: margin;
    @Input() rowSettings: rowSettings;
    @Input() widgets: Widget[];
    @Output() widgetsChange = new EventEmitter();
    @Input() styleClass: string;
    @Input() styleClassWidget: string;
    @Input() styleClassWidgetEdit: string;

    @ViewChild(GridstackComponent) gridComp?: GridstackComponent;
    @ViewChild('element') gridElement?: ElementRef;

    @ContentChild(TemplateRef, { static: true })
	templateRef: TemplateRef<any>;
    
    private loadedWidgets: Widget[] = [];
    private widgetBuilder = null;
    private grid: GridStack;
    public widgetItemClass = "";
    public displayWidgets: GridStackWidget[] = [];
    public gridOptions: GridStackOptions = {
        column: 12,
        minRow: 1,
        float: true,
        columnOpts: {
            layout: 'compact',
            breakpoints: [{w:576, c:3},{w:768, c:6},{w:992, c:9},{w:1200, c:12}]
        }
      }
    
    constructor(protected readonly renderer: Renderer2, protected cdRef: ChangeDetectorRef, @Inject(DOCUMENT) private document: Document,
    private servoyPublic: ServoyPublicService) {
         super(renderer, cdRef);
    }
    
    svyOnInit() {
        super.svyOnInit();
        this.gridComp.grid.on('change', (e, nodes) => {
            this.updateWidgetRefs(this.getCurrentLayout());
            if(this.onLayoutChange) {
                this.onLayoutChange(e, this.getCurrentLayout());
            }
        });
    }
    
    svyOnChanges( changes: SimpleChanges ) {
        if(changes) {
            for (const property of Object.keys(changes)) {
                const change = changes[property];
                switch (property) {
                    case 'widgets':
                        if(!this.haveSameIds(this.loadedWidgets, this.widgets)) {
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
                        if(!this.editable) {
                            this.gridComp.grid.disable();
                            this.widgetItemClass = this.styleClassWidget||"";
                        } else {
                            this.gridComp.grid.enable();
                            this.widgetItemClass = `${this.styleClassWidget||""} ${this.styleClassWidgetEdit||""}`;
                        }
                    break;
                    case 'rowSettings':
                        if(this.rowSettings.rowHeight == -1) {
                            this.gridComp.grid.cellHeight('auto', true);
                        } else {
                            this.gridComp.grid.cellHeight(this.rowSettings.rowHeight, true);
                        }
                    break;
                    case 'widgetMargin':
                        this.gridComp.grid.margin(`${this.widgetMargin.top}px ${this.widgetMargin.right}px ${this.widgetMargin.bottom}px ${this.widgetMargin.left}px`);
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
        this.loadedWidgets.map(widget => this.servoyApi.hideForm(widget.form, widget.relationName));
        if(this.grid) {
            this.grid.destroy();
        }
    }

    private notifyChange() {
		this.widgetsChange.emit(this.widgets);
	}
    initWidgets() {
        let destroyPromises = this.loadedWidgets.map(widget => this.servoyApi.hideForm(widget.form, widget.relationName));
        Promise.all(destroyPromises).then(() => {
            this.loadedWidgets = [];
            this.displayWidgets = [];
        }).then(() => {
            let promises = this.widgets.map(widget => {
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
                        newWidget.minH = Math.ceil(formCache.size.height / this.gridComp.grid.getCellHeight());
                        newWidget.minW = Math.ceil(formCache.size.width / this.gridComp.grid.cellWidth());
                        newWidget.h = widget.height || widget.minH || 1;
                        newWidget.w = widget.width || widget.minW || 1;
                    } else {
                        newWidget.h = widget.height || 1;
                        newWidget.w = widget.width || 1;
                    }
                    newWidget.y = widget.posY;
                    newWidget.x = widget.posX;
                    newWidget.id = widget.id;
                    newWidget.sizeToContent = widget.sizeToContent;
                    newWidget.noMove = widget.noMove;
                    newWidget.noResize = widget.noResize;
                    this.displayWidgets.push(newWidget);
                });
            });
    
            Promise.all(promises).then(() => {
                this.loadedWidgets = this.widgets;
                this.cdRef.detectChanges();
                this.updateWidgetRefs(this.getCurrentLayout());
                if(this.onLayoutChange) {
                    this.onLayoutChange(this.createJSEvent(), this.getCurrentLayout());
                }
            });
        })
    }
    
    private createJSEvent() {
        const element = this.gridElement.nativeElement;
        const x = element.offsetLeft;
        const y = element.offsetTop;

        const event = this.document.createEvent('MouseEvents');
        event.initMouseEvent('click', false, true, window, 1, x, y, x, y, false, false, false, false, 0, null);
        return event;
    }

    private updateWidgetRefs(items: GridStackNode[]|WidgetLayout[]) {
        items.forEach(item => {
            let matchingWidget = this.widgets?.find(widget => widget.id === item.id);
            if(matchingWidget) {
                matchingWidget.posX = item.x||item.posX;
                matchingWidget.posY = item.y||item.posY;
                matchingWidget.width = item.w||item.width||item.minW;
                matchingWidget.height = item.h||item.height||item.minH;
            }
        });
        this.notifyChange();
    }

    public onWidgetClickHandler(e: Event, widgetId: string) {
        if(this.onWidgetClick) {
            this.onWidgetClick(e, widgetId);
        }
    }
    public getProperty(renderWidget: GridStackWidget, propertyName:string) {
        let matchingWidget = this.widgets?.find(widget => widget.id === renderWidget.id);
		if (matchingWidget && matchingWidget[propertyName]) {
			return matchingWidget[propertyName];
		} else {
			return '';
		}
    }

    public identify(index: number, renderWidget: GridStackWidget) {
        return renderWidget.id; // or use index if no id is set and you only modify at the end...
      }

    public getCurrentLayout():WidgetLayout[] {

        let returnLayout:WidgetLayout[] = [];
        /**@type {Array<{x: Number, y: Number, w: Number, h: Number, id: string}>} */
        let currentLayout = JSON.parse(JSON.stringify(this.gridComp.grid.save()));
        currentLayout.forEach(widget => {
            returnLayout.push({
                id: widget.id,
                posX: widget.x,
                posY: widget.y,
                width: widget.w,
                height: widget.h,
                minH: widget.minH,
                minW: widget.minW,
                noMove: !!widget.noMove,
                noResize: !!widget.noResize,
                form: this.getProperty(widget, 'form')
            })
            
        })
        return returnLayout
    }
    
    private haveSameIds(objA: WidgetLayout[], objB: WidgetLayout[]): boolean {
        const getIds = (arr: WidgetLayout[]) => arr.map(item => item.id).sort();
        
        const loadedWidgetIds = getIds(objA);
        const widgetIds = getIds(objB);

        if (loadedWidgetIds.length !== widgetIds.length) {
        return false;
        }

        // Check if every element in both sorted arrays are the same
        return loadedWidgetIds.every((id, index) => id === widgetIds[index]);
    }
}

interface WidgetLayout {
    id?: string;
    form?: string;
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

export class Widget extends BaseCustomObject {
    id: string;
    form: string;
    relationName: string;
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
}

export class margin extends BaseCustomObject {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export class rowSettings extends BaseCustomObject {
    rowHeight: number;
    minRows: number;
    maxRows: number;
}
//https://github.com/gridstack/gridstack.js/blob/master/angular/projects/demo/src/app/app.component.html
//https://gridstackjs.com/demo/static.html#