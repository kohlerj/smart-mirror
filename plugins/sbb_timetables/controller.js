function SBB_Timetables($scope, $http, $interval, $q) {
	var BING_MAPS = "http://dev.virtualearth.net/REST/V1/Routes/";
	var language = "fr" //(typeof config.general.language !== 'undefined') ? config.general.language.substr(0, 2) : "en"
	var durationHumanizer = require('humanize-duration').humanizer({
		language: language,
		units: ['h', 'm'],
		round: true
	});

	var getTrips = function () {
		var deferred = $q.defer();
		var promises = [];

		if (typeof config.sbb_timetables != 'undefined' && config.sbb_timetables.trips) {
			angular.forEach(config.sbb_timetables.trips, function (trip) {
				promises.push(getConnections(trip));
			});

			$q.all(promises).then(function (data) {
				deferred.resolve(data)
			});
		} else {
			deferred.reject;
		}

		return deferred.promise;
	};

    // Request traffic info for the configured mode of transport
	function getConnections(trip) {
		var deferred = $q.defer();
		
		var ajaxObject = $.ajax({
			url: 'http://transport.opendata.ch/v1/connections',
			dataType: 'json',
			async: true,
			cache: false,
			data: trip,
			success: function(data) {
				trip.data = data;
				deferred.resolve(trip);
				
			},
			error: function (XMLHttpRequest, textStatus, errorThrown) {
				if (textStatus == 'Unauthorized') {
					alert('custom message. Error: ' + errorThrown);
					console.error('Unauthorized. Check your traffic key.');
					deferred.reject('Unauthorized');
				} else {
					alert('custom message. Error: ' + errorThrown);
					console.error('Traffic error:', textStatus);
					deferred.reject(textStatus);
				}
			}
		});

		return deferred.promise;




		/*$http.get(getEndpoint(trip)).then(function (response) {
            // Walking and Transit are "not effected" by traffic so we don't use their traffic duration
			if (trip.mode == "Transit" || trip.mode == "Walking") {
				trip.duration = durationHumanizer(response.data.resourceSets[0].resources[0].travelDuration * 1000);
			} else {
				trip.duration = durationHumanizer(response.data.resourceSets[0].resources[0].travelDurationTraffic * 1000);
			}

			deferred.resolve(trip);
		}, function (error) {
            // Most of the time this is because an address can't be found
			if (error.status === 404) {
				console.error('No transit information available between start and end');
				deferred.reject('Unavailable');
			} else if (error.status === 401) {
				console.error('Unauthorized. Check your traffic key.');
				deferred.reject('Unauthorized');
			} else {
				console.error('Traffic error:', error.statusText);
				deferred.reject(error.statusText);
			}
		});
		return deferred.promise;*/
	}



    // Depending on the mode of transport different paramaters are required.
	function getEndpoint(trip) {
		var waypoints = 1;
		var intermediateGoal = "";
		if (typeof trip.via !== 'undefined' && trip.via != "") {
			waypoints = 2;
			intermediateGoal = "&wp.1=" + trip.via;
		}
		var endpoint = BING_MAPS + trip.mode + "?wp.0=" + trip.origin + intermediateGoal + "&wp." + waypoints + "=" + trip.destination;
		if (trip.mode == "Driving") {
			endpoint += "&avoid=minimizeTolls";
		} else if (trip.mode == "Transit") {
			endpoint += "&timeType=Departure&dateTime=" + moment().lang("en").format('h:mm:ssa').toUpperCase();
		} else if (trip.mode == "Walking") {
			endpoint += "&optmz=distance";
		}
		endpoint += "&key=" + config.traffic.key;

		return endpoint;
	}

	var refreshTrafficData = function () {
		getTrips().then(function (trips) {
            //Todo this needs to be an array of traffic objects -> $trips[]
			$scope.trips = trips;
		}, function (error) {
			$scope.sbb_timetables = { error: error };
		});
	}

	refreshSBB_TimetablesData()
	$interval(refreshSBB_TimetablesData, config.sbb_timetables.refreshInterval * 60000 || 900000)

}

angular.module('SmartMirror')
    .controller('SBB_Timetables', SBB_Timetables);
