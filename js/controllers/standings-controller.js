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
	    
	    var listOfLeagues = 'http://api.football-data.org/v1/competitions';
	    var apiKey = {'X-Auth-Token': '8b096ed4da8e4dd0a9408ad7d2705022'}
		
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
		
		var getLeagueStandingsUrl = function(leagueId){
			return 'http://api.football-data.org/v1/competitions/'+ leagueId +'/leagueTable';
		}
		
		var getLeagueTeamsUrl = function(leagueId){
			return 'http://api.football-data.org/v1/competitions/'+ leagueId +'/teams';
		}
	
		function isInternet() {
			dataService
					.getData('http://api.football-data.org')
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
				url : listOfLeagues,
				headers: apiKey
			})
					.then(
							function mySucces(response) {
								var data = response.data;
								$scope.leagues = parseLeagues(response.data);
								$scope.netConnectivity = 0; // CONNECTED!
							},
							function myError(response) {
								console
										.log("ERROR STATUS = "
												+ response.statusText);
								$scope.netConnectivity = 1; // CONNECTION
								// ERROR
								continousLoad = setTimeout(
										getLeagues,
										refreshTimeDelay);
							});
		}
		
		$scope.getLeagueStandings = function(league){
			$scope.currentLeague = league;
			$http({
				method : "GET",
				url : getLeagueStandingsUrl(league.id),
				headers: apiKey
			})
					.then(
							function mySucces(response) {
								var data = response.data.standing;
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
										getLeagues,
										refreshTimeDelay);
							});
		}
		
		$scope.getLeagueTeams = function(league){
			$scope.currentLeague = league;
			$http({
				method : "GET",
				url : getLeagueTeamsUrl(league.id),
				headers: apiKey
			})
					.then(
							function mySucces(response) {
								var data = response.data.teams;
								$scope.teamData = parseTeamsData(data);
								$scope.netConnectivity = 0; // CONNECTED!
							},
							function myError(response) {
								console
										.log("ERROR STATUS = "
												+ response.statusText);
								$scope.netConnectivity = 1; // CONNECTION
								// ERROR
								continousLoad = setTimeout(
										getLeagues,
										refreshTimeDelay);
							});
		}
		
		function parseLeagues(data) {
			var leagues = [];
			angular.forEach(data, function(league) {
				if (league.league.indexOf('C') == -1 && league.league.indexOf('DFB') == -1) {
					leagues.push({
						name:league.caption,
						id: league.id,
						lastUpdated: league.lastUpdated
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
		
		function parseTeamsData(data) {
			var teams = [];
			angular.forEach(data, function(team) {
				teams.push({
					name: team.name,
					value: team.squadMarketValue,
					flag: team.crestUrl
				});
			})
			return teams;
		}
	}
})();