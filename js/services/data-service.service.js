(function() {
	'use strict';

	angular.module('standingsApp').service('dataService', function($http) {
		delete $http.defaults.headers.common['X-Requested-With'];
		this.getData = function(url) {
			return $http({
				method : 'GET',
				url : url
			});
		}
	});
})();
