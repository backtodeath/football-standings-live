(function() {
	'use strict';

	angular.module('standingsApp').controller('StandingsController',
			StandingsController);

	StandingsController.$inject = [ '$rootScope', '$localStorage',
			'dataService', '$http', '$scope', '$timeout'];

	function StandingsController($rootScope, $localStorage, dataService, $http,
			$scope, $timeout) {

		$scope.getApps = function() {
			var service = new tizen.ApplicationControl(
					"http://tizen.org/appcontrol/operation/view",
					"tizenstore://SellerApps/rz71xjklxj", null, null, null);
			var id = "org.tizen.tizenstore";

			try {
				tizen.application.launchAppControl(service, id, function() {
					console.log("Service launched");
				}, function(err) {
					alert("Service launch failed: " + " " + err.message);
				}, null);
			} catch (exc) {
				alert("launchService exc: " + exc.message);
			}
		}

		$scope.exit = function() {
			tizen.application.getCurrentApplication().exit();
		}

		var buttonEvent = function(e) {
			if (e.keyName == "back") {
				$timeout(function (){
			        $rootScope.Ui.turnOn('myModal');
			    }, 100);
			}
			if (e.keyName == "menu") {
				$rootScope.Ui.toggle('uiSidebarLeft');
			}
		}

		document.addEventListener('tizenhwkey', buttonEvent);

		var listOfLeagues = 'http://api.football-data.org/v1/competitions/';
		var apiKey = {
			'X-Auth-Token' : '8b096ed4da8e4dd0a9408ad7d2705022'
		}

		var refreshTimeDelay = 1000;
		var continousLoad;
		// User agent displayed in home page
		$scope.userAgent = navigator.userAgent;

		// Needed for the loading screen
		$rootScope.$on('$routeChangeStart', function(a, b, c) {
			$rootScope.loading = true;
		});

		$rootScope.$on('$routeChangeSuccess', function() {
			$rootScope.loading = false;
		});

		var status = false;
		isInternet();

		var getLeagueStandingsUrl = function(leagueId) {
			return listOfLeagues + leagueId + '/leagueTable';
		}

		function isInternet() {
			dataService.getData(listOfLeagues).then(
					function(dataResponse) {
						if (dataResponse.status >= 200
								&& dataResponse.status < 304) {
							console.log("dataResponse status = "
									+ dataResponse.status);
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

		function getLeagues() {
			$rootScope.loading = true;
			$http({
				method : "GET",
				url : listOfLeagues,
				headers : apiKey
			}).then(function mySucces(response) {
				var data = response.data;
				$scope.leagues = parseLeagues(response.data);
				$scope.netConnectivity = 0; // CONNECTED!
				$rootScope.loading = false;
			}, function myError(response) {
				console.log("ERROR STATUS = " + response.statusText);
				$rootScope.loading = false;
				$scope.netConnectivity = 1; // CONNECTION
				// ERROR
				continousLoad = setTimeout(getLeagues, refreshTimeDelay);
			});
		}

		$scope.getLeagueStandings = function(league) {
			$rootScope.loading = true;
			$scope.currentLeague = league;
			$http({
				method : "GET",
				url : getLeagueStandingsUrl(league.id),
				headers : apiKey
			}).then(function mySucces(response) {
				var data = response.data.standing;
				$scope.scoreData = parseData(data);
				$localStorage.scData = $scope.scoreData;
				$scope.netConnectivity = 0; // CONNECTED!
				$rootScope.loading = false;
			}, function myError(response) {
				console.log("ERROR STATUS = " + response.statusText);
				$scope.netConnectivity = 1; // CONNECTION
				// ERROR
				$rootScope.loading = false;
				continousLoad = setTimeout(getLeagues, refreshTimeDelay);
			});
		}

		function parseLeagues(data) {
			var leagues = [];
			angular.forEach(data, function(league) {
				if (league.league.indexOf('C') == -1
						&& league.league.indexOf('DFB') == -1) {
					leagues.push({
						name : league.caption,
						id : league.id,
						lastUpdated : league.lastUpdated
					});
				}
			})
			return leagues;
		}

		function parseData(data) {
			angular.forEach(data, function(team) {
				if (team.position < 4) {
					team.color = 'green';
				} else if (team.position > 3 && team.position < 6) {
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