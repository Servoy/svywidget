{
	"name": "svywidget-widgetlayout",
	"displayName": "widgetlayout",
	"version": 1,
	"definition": "svywidget/widgetlayout/widgetlayout.js",
    "serverscript": "svywidget/widgetlayout/widgetlayout_server.js",
	"libraries": [],
    "model": {
        "widgets"               : { "type": "widget[]", "droppable": true, "pushToServer": "shallow" },
        "editable"              : { "type": "boolean", "default": true},
        "rowSettings"           : { "type": "rowSettings"},
        "widgetMargin"          : { "type": "margin"},
        "styleClass"            : { "type": "string" },
        "styleClassWidget"      : { "type": "string", "tags": {"scope": "design"}},
        "styleClassWidgetEdit"  : { "type": "string", "tags": {"scope": "design"}},
        "visible"               : "visible"
    },
    "api": {
        "getCurrentLayout": {
            "delayUntilFormLoads": true,
            "returns": "widget[]"
        },
        "resizeToContentWidgetsToFit": {
            "async": true,
            "delayUntilFormLoads": true
        },"removeAllWidgets": {
            "delayUntilFormLoads": true
        }
    },
    "handlers": {
        "onWidgetClick": {
            "parameters": [
                {
                    "name": "event",
                    "type": "JSEvent"
                },
                {
                    "name": "widgetId",
                    "type": "string"
                }
            ]
        },
        "onLayoutChange": {
            "parameters": [
                {
                    "name": "event",
                    "type": "JSEvent"
                },
                {
                    "name": "layout",
                    "type": "widget[]"
                }
            ]
        }
    },
    "types": 
	{
		"widget" : {
			"form"                      : { "type": "form" },
            "relationName"              : "relation",
            "posX"                      : { "type": "int",   "default": 0, "tags": {"doc": "Position X (Column) in the 12Grid layout (Starting from 0)"}},
            "posY"                      : { "type": "int",   "default": 0, "tags": {"doc": "Position Y (Row) in the 12Grid layout (Starting from 0)"}},
            "width"                     : { "type": "int",   "default": 1, "tags": {"doc": "Column width to be used in the 12Grid layout (Starting from 1)"}},
            "height"                    : { "type": "int",   "default": 1, "tags": {"doc": "Column height to be used in the 12Grid layout (Starting from 1)"}},
            "minW"                      : { "type": "int",   "default": 1, "tags": {"doc": "Column Min Width to be used in the 12Grid layout (Starting from 1), this is used when widget resizing is enabled" }},
            "minH"                      : { "type": "int",   "default": 1, "tags": {"doc": "Column Min Height to be used in the 12Grid layout (Starting from 1), this is used when widget resizing is enabled" }},
            "widgetItemContainerClass"  : { "type": "string" },
            "id"                        : { "type": "string" },
            "sizeToContent"             : { "type": "boolean", "default": false },
            "noResize"                  : { "type": "boolean", "default": false, "tags": {"doc": "Disable widget resizing when in edit mode"}},
            "noMove"                    : { "type": "boolean", "default": false, "tags": {"doc": "Disable widget moving when in edit mode"}},
            "gridStackWidget"           : { "type": "object", "tags": {"scope" : "private"} } 
		},
        "margin": {
            "top"   : { "type": "int", "default": 10, "tags": {"scope": "design"} },
            "right" : { "type": "int", "default": 10, "tags": {"scope": "design"} },
            "bottom": { "type": "int", "default": 10, "tags": {"scope": "design"} },
            "left"  : { "type": "int", "default": 10, "tags": {"scope": "design"} }
        },
        "rowSettings": {
            "minRows"   : { "type": "int", "default": 1, "tags": {"scope": "design", "doc": "Min number of rows to show in the gridlayout"}},
            "maxRows"   : { "type": "int", "default": 1, "tags": {"scope": "design", "doc": "Max number of rows to allow in the gridlayout"}},
            "rowHeight" : { "type": "int", "default": 400, "tags": {"scope": "design", "doc": "Default row height, -1 means auto"}}
        }
    }
}