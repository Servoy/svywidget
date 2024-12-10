/**
 * Creates a new widget that can be added to the widget component
 * 
 * @return {nbwidget.widget}
 */
$scope.api.createWidget = function() {
	return {
		form: null,
        relation: null,
        posX: 0,
        posY: 0,
        width: 1,
        heigth: 1,
        minW: 1,
        minH: 1,
        wrapperContainerClass: null
	}
}