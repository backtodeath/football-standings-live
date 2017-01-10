(function() {
	'use strict';

	angular
			.module('standingsApp')
			.controller('StandingsController', StandingsController);
	
	StandingsController.$inject = ['$rootScope', '$localStorage', 'dataService', '$http', '$scope'];
	
	function StandingsController($rootScope, $localStorage, dataService, $http, $scope) {	
		
		 var buttonEvent = function(e) {
		        if ( e.keyName == "back" ) {
	            	tizen.application.getCurrentApplication().exit();
		        }
		        if ( e.keyName == "menu" ) {
		        	  $rootScope.Ui.toggle('uiSidebarLeft');
		        }
		    }
		    
	    document.addEventListener( 'tizenhwkey', buttonEvent );
	    
	    var listOfLeagues = 'http://soccer.sportsopendata.net/v1/leagues';
		
		var SCORES_SERVICE_URL = 'http://soccer.sportsopendata.net/v1/leagues/serie-a/seasons/16-17/standings';
		var refreshTimeDelay = 1000;
		var continousLoad;
		// User agent displayed in home page
		$scope.userAgent = navigator.userAgent;
	
		// Needed for the loading screen
		$rootScope.$on('$routeChangeStart', function(a,b,c) {
			$rootScope.loading = true;
		});
	
		$rootScope.$on('$routeChangeSuccess', function() {
			$rootScope.loading = false;
		});
	
		var status = false;
		isInternet();

		$scope.getLeague = function(league) {
			$scope.currentLeague = league;
			getLeagueStandings(league.id);
		}
		
		var getLeagueStandingsUrl = function(leagueId){
			return 'http://soccer.sportsopendata.net/v1/leagues/'+ leagueId +'/seasons/16-17/standings';
		}
	
		function isInternet() {
			dataService
					.getData('http://soccer.sportsopendata.net')
					.then(
							function(dataResponse) {
								if (dataResponse.status >= 200
										&& dataResponse.status < 304) {
									console.log("dataResponse status = " + dataResponse.status);
									getLeagues();
								} else {
									if ($localStorage.scData != null) {
										$scope.netConnectivity = 2; // NOT CONNECTED
																	// AND
										// RETRIEVE PAST
										// DATA IF EXISTS
										$scope.scoreData = $localStorage.scData;
									} else { // NOT CONNECTED TRY TO CONNECT TO
												// THE
										// INTERNET
										$scope.netConnectivity = 3;
										clearInterval(continousLoad);
										continousLoad = setTimeout(loadData,
												refreshTimeDelay);
									}
								}
							});
		}
		
		function getLeagues(){
			$http({
				method : "GET",
				url : listOfLeagues
			})
					.then(
							function mySucces(response) {
								var data = response.data.data;
								$scope.leagues = parseLeagues(response.data.data.leagues);
								$scope.netConnectivity = 0; // CONNECTED!
							},
							function myError(response) {
								console
										.log("ERROR STATUS = "
												+ response.statusText);
								$scope.netConnectivity = 1; // CONNECTION
								// ERROR
								continousLoad = setTimeout(
										loadData,
										refreshTimeDelay);
							});
		}
		
		function getLeagueStandings(leagueId){
			$http({
				method : "GET",
				url : getLeagueStandingsUrl(leagueId)
			})
					.then(
							function mySucces(response) {
								var data = response.data.data.standings;
								$scope.scoreData = parseData(data);
								$localStorage.scData = $scope.scoreData;
								$scope.netConnectivity = 0; // CONNECTED!
							},
							function myError(response) {
								console
										.log("ERROR STATUS = "
												+ response.statusText);
								$scope.netConnectivity = 1; // CONNECTION
								// ERROR
								continousLoad = setTimeout(
										loadData,
										refreshTimeDelay);
							});
		}
		
		function parseLeagues(data) {
			var leagues = [];
			angular.forEach(data, function(league) {
				if (!league.cup && league.level == 1) {
					leagues.push({
						name:league.name,
						id: league.league_slug,
						country: league.nation
					});
				} 
			})
			return leagues;
		}
	
		function parseData(data) {
			angular.forEach(data, function(team) {
				if (team.position < 4) {
					team.color = 'green';
				} else if (team.position > 3
						&& team.position < 6) {
					team.color = 'yellow';
				} else if (team.position > 17) {
					team.color = 'red';
				} else {
					team.color = 'default';
				}
			})
			return data;
		}
	}
})();