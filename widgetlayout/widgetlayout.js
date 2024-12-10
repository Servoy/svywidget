angular.module('svywidgetWidgetlayout',['servoy']).directive('svywidgetWidgetlayout', function() {  
    return {
      restrict: 'E',
      scope: {
    	  model: '=svyModel'
      },
      controller: function($scope, $element, $attrs) {
      },
      templateUrl: 'svywidget/widgetlayout/widgetlayout.html'
    };
  })