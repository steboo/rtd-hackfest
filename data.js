var Client = require('node-rest-client').Client;
var fs = require('fs');
var realtime = require('rtd-realtime');

function promisify(fn, ...args) {
  return new Promise(function(resolve, reject) {
    function handle(err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    }

    if (args) {
      fn(...args, handle);
    } else {
      fn(handle);
    }
  });
}

//module.exports = function() {
(function() {
  var baseDir = 'gtfs-schedule';
  var client = new Client();
  var routes, stops, trips;
  var routesFile = baseDir + '/routes.json';
  var stopsFile = baseDir + '/stops.json';
  var tripsFile = baseDir + '/trips.json';

  Promise.all([
    promisify(fs.readFile, routesFile, 'utf8'),
    promisify(fs.readFile, stopsFile, 'utf8'),
    promisify(fs.readFile, tripsFile, 'utf8'),
    promisify(realtime.TripUpdates.load)
  ]).then(function([routesRaw, stopsRaw, tripsRaw, realtime]) {
    var tripUpdates = realtime.entity;

    routes = JSON.parse(routesRaw);
    stops = JSON.parse(stopsRaw);
    trips = JSON.parse(tripsRaw);

    function childStops(parentId) {
      return stops.filter(function(item) {
        return item.parent_station == parentId;
      });
    }

    function departureTime(routeId) {
      var departureTime;

      // Get all outbound trips
      var routeTripData = routeTrips(routeId);
//      var unionStops = childStops(33727);
      var unionStops2 = unionStops();

      var unionStopIds = unionStops2.map(function(stop) {
        return stop.stop_id;
      });

      console.log('route trips:', routeTripData);

      // Search stop_time_update for selected stop(s)
      var nextRoute = routeTripData.find(function(trip) {
        return trip.trip_update.stop_time_update.find(function(update) {
          console.log('stop:', update.stop_id);

//          if (unionStopIds.indexOf(update.stop_id) >= 0) {
//          if (update.stop_id == 34344) {
          if (update.stop_id == 21514) { // Welton St & 16th Street Mall
            departureTime = update.departure.time;
            return true;
          }
        });
      });

      return departureTime;
    }

    function distanceBetween(origin, destination) {
      var googleAPIKey = 'AIzaSyBYy3BEcltI0LnvHPkOMSHX7cQ0RkgZUmU';
      var googleAPIURL = 'https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial' +
          '&mode=walking' +
          '&origins=' + origin.join(',') +
          '&destinations=' + destination(',') +
          '&key=' + googleAPIKey;

      client.get(googleAPIURL, function(data, response) {
        if (response.status == 200 && data.rows) {
          var firstRow = data.rows[0];
          var firstElement = firstRow.elements && firstRow.elements[0];
          var distanceMeters = firstElement && firstElement.distance.value; // CAUTION: IN METERS!
          var distance = distanceMeters * 3.281;

          return distance;
        }
      });
    }

//    console.log('Data:');
//    console.log(tripUpdates[0]);
//    console.log(departureTime('FF1'));
    console.log(departureTime('0'));
/*    var foo = [];
    var bar = [];

    tripUpdates.forEach(function(trip) {
      if (trip.trip_update.trip.route_id == '0') {
        trip.trip_update.stop_time_update.forEach(function(update) {
          if (foo.indexOf(update.stop_id) == -1) {
            foo.push(update.stop_id);
            bar.push(stops.find(function(stop) {
              return stop.stop_id == update.stop_id;
            }));
          }
        });
      }
    });

    console.log('All 0 stops:', bar);*/

    /**
     * Find the nearest stop for a given route and direction
     * @param {integer[]} location - a set of coords ([lat, long])
     * @param {integer} routeId - the ID of the route in question
     * @param {integer} directionId - 0/1 as outbound/inbound
     * @return {Object} stop
     */
/*    function findStop(location, routeId, directionId) {
      directionId || (directionId = 0);

      // Get all applicable trips
      var routeTripData = trips.filter(function(trip) {
        return ((trip.schedule_relationship != 'CANCELED') &&
                (trip.route_id == routeId) &&
                (trip.direction_id == directionId));
      });

      var tripIds = routeTripData.map(function(trip) {
        return trip.trip_id;
      });

      // Get all stops served by <direction>-bound route
      var routeTripUpdates = tripUpdates.map(function(trip) {
        var tripId = trip.id.split('_')[1];

        if (tripIds.indexOf(tripId) >= 0) {
          // Fill this out
        }
      });

      // Get locations of stops
      // Find nearest stop
    }*/

    function routeTrips(routeId) {
      var directionId = 1; // Outbound

      var routeTrips = trips.filter(function(trip) {
        return ((trip.schedule_relationship != 'CANCELED') &&
                (trip.route_id == routeId));
//                (trip.route_id == routeId) &&
//                (trip.direction_id == directionId));
      });

      console.log('routes:', routeTrips);

      var tripIds = routeTrips.map(function(trip) {
        return trip.trip_id;
      });

      return tripUpdates.filter(function(trip) {
//        var otherId = trip.trip_update.trip.trip_id;
//        var tripId = trip.id.split('_')[1];
//        console.log('tripId:', tripId, otherId, tripIds.indexOf(tripId), tripIds.indexOf(otherId));
        console.log('routeId:', trip.route_id);

//        return tripIds.indexOf(tripId) >= 0;
//        return trip.trip_update.trip_id == 34344;
//        return trip.trip_update.trip_id == 21514;
        return trip.trip_update.trip.route_id == routeId;
      });
    }

    function stopInfo(stopId) {
      return stopId && stops.find(function(stop) {
        return stop.stop_id == stopId;
      });
    }

    function unionStops() {
      return stops.filter(function(item) {
        return item.stop_name.indexOf('Union Station') >= 0;
      });
    }

    return {
      stopInfo: stopInfo
    };
  }).catch(function(err) {
    console.log('Caught an error:', err);
  });
//};
})();
