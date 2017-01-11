'use strict';

var app = angular.module('standingsApp', ['mobile-angular-ui', 'mobile-angular-ui.gestures', 'ngRoute', 'ngStorage']);

app.run(function($transform) {
	window.$transform = $transform;
});

app.config(function($routeProvider) {
	$routeProvider.when('/', {templateUrl: 'home.html', reloadOnSearch: false});
	$routeProvider.when('/standings', {templateUrl: 'standings.html', reloadOnSearch: false});
	$routeProvider.when('/teams', {templateUrl: 'teams.html', reloadOnSearch: false});
});