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
  var converter = new Converter({});
  var routes, stops;
  var routesFile = baseDir + '/routes.txt';
  var stopsFile = baseDir + '/stops.txt';

  return Promise.all([
    promisify(converter.fromFile, routesFile),
    promisify(converter.fromFile, stopsFile),
    promisify(realtime.VehiclePositions.load)
  ]).then(function([routes, stops, realtime]) {
    function getDistance(origin, destination) {
      var googleAPIKey = 'AIzaSyBYy3BEcltI0LnvHPkOMSHX7cQ0RkgZUmU';
      var googleAPIURL = 'https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=' +
          origin.join(',') + '&destinations=' + destination(',') + '&key=' + googleAPIKey;
    }

    function getStopInfo(stopId) {
    }
  });

  return {};
};

