var Client = require('node-rest-client').Client;
var Converter = require('csvtojson').Converter;
var fs = require('fs');
var realtime = require('rtd-realtime');

function promisify(fn, arg) {
  function handle(err, result) {
    if (err) {
      reject(err);
    } else {
      resolve(result);
    }
  }

  return new Promise(function(resolve, reject) {
    if (arg) {
      fn(arg, handle);
    } else {
      fn(handle);
    }
  };
}

module.exports = function() {
  var baseDir = 'gtfs-schedule';
  var client = new Client();
  var converter = new Converter({});
  var routes, stops;
  var routesFile = baseDir + '/routes.txt';
  var stopsFile = baseDir + '/stops.txt';

  return Promise.all([
    promisify(converter.fromFile, routesFile),
    promisify(converter.fromFile, stopsFile),
    promisify(realtime.TripUpdates.load)
  ]).then(function([routes, stops, realtime]) {
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

    function stopInfo(stopId) {
      return stopId && stops.find(function(stop) {
        return stop.stop_id == stopId;
      });
    }
  });

  return {
    getStopInfo: getStopInfo
  };
};

