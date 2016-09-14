var options = {
    enableHighAccuracy: true,
    timeout: 10000, // wait up to five seconds for a result
    maximumAge: 0 // no cached values
};

var lastLat = 0.0,
    lastLon = 0.0,
    lastTime = 0,
    targetLat,
    targetLon;

var num = 0;

// Get element references
var latEl = document.getElementsByClassName('lat')[0];
var lonEl = document.getElementsByClassName('lon')[0];
var updateEl = document.getElementsByClassName('update')[0];
var errEl = document.getElementsByClassName('error')[0];
var distEl = document.getElementsByClassName('distance')[0];
var veloEl = document.getElementsByClassName('velocity')[0];
var targDistEl = document.getElementsByClassName('targetDistance')[0];
var targTimeEl = document.getElementsByClassName('targetTime')[0];
var targTimeUnitsEl = document.getElementsByClassName('targetTimeUnits')[0];
var avgTargTimeEl = document.getElementsByClassName('avgTargetTime')[0];
var avgTargTimeUnitsEl = document.getElementsByClassName('avgTargetTimeUnits')[0];

function init() {
    var targetLatEl = document.getElementsByName('targetLat')[0];
    var targetLonEl = document.getElementsByName('targetLon')[0];
    var targetStopEl = document.getElementsByName('targetStop')[0];

    if (targetStopEl) {
        var els = document.getElementsByClassName('targetStop');
        for (var i = 0; i < els.length; i++) {
            els[i].textContent = targetStopEl.value;
        }
    }

    if (targetLatEl) {
        targetLat = targetLatEl.value;
    }

    if (targetLonEl) {
        targetLon = targetLonEl.value;
    }
}

init();

if ('geolocation' in navigator) {
    var id = navigator.geolocation.watchPosition(function (pos) {
        // success
        var currTime = Date.now();
        var coords = pos.coords;

        // Debug
        //console.log('You: ' + coords.latitude + ', ' + coords.longitude);
        //console.log('Stop: ' + targetLat + ', ' + targetLon);

        // Perform calculations
        var distTraveled = calc_dist(lastLat, lastLon, coords.latitude, coords.longitude);
        var distFromStop = calc_dist(coords.latitude, coords.longitude, targetLat, targetLon);
        var currentVelocity = calc_velo(distTraveled, lastTime, currTime); 
        var currentMPH = calc_mph(currentVelocity);
        var feetTraveled = meters_to_feet(distTraveled);
        var feetFromStop = meters_to_feet(distFromStop);
        var timeFromStop = distFromStop / currentVelocity;
        var targetTimeUnits, avgTargetTimeUnits;
        var averageVelocity = 1.34112;
        var avgTimeFromStop = distFromStop / averageVelocity;
        if (timeFromStop <= 60) {
            targetTimeUnits = 'seconds';
        } else {
            targetTimeUnits = 'minutes';
            timeFromStop = Math.round(timeFromStop / 60 * 10)/10;
        }

        if (avgTimeFromStop <= 60) {
            avgTargetTimeUnits = 'seconds';
        } else {
            avgTargetTimeUnits = 'minutes';
            avgTimeFromStop = Math.round(avgTimeFromStop / 60 * 10)/10;
        }

        // Update DOM
        latEl.textContent = String(coords.latitude);
        lonEl.textContent = String(coords.longitude);
        updateEl.textContent = String(num++);
        errEl.textContent = '';
        distEl.textContent = String(Math.round(feetTraveled*10)/10);
        veloEl.textContent = String(Math.round(currentMPH*10)/10);
        targDistEl.textContent = String(Math.round(feetFromStop*10)/10);
        targTimeEl.textContent = String(timeFromStop);
        targTimeUnitsEl.textContent = String(targetTimeUnits);
        avgTargTimeEl.textContent = String(avgTimeFromStop);
        avgTargTimeUnitsEl.textContent = String(avgTargetTimeUnits);

        lastLat = coords.latitude;
        lastLon = coords.longitude;
        lastTime = currTime;

        // Show main el
        var hiddenEl = document.getElementsByTagName('main')[0];
        if (hiddenEl) {
            hiddenEl.className = '';
        }
    }, function (err) {
        // error
        var errEl = document.getElementsByClassName('error')[0];
        errEl.textContent = 'Error(' + err.code + '): ' + err.message;
        //console.warn('Error(' + err.code + '): ' + err.message);
        var update = document.getElementsByClassName('update')[0];
        update.textContent = String(num++);
        // Show main el
        var hiddenEl = document.getElementsByClassName('hide')[0];
        if (hiddenEl) {
            hiddenEl.className = '';
        }
    }, options);
} else {
    var err = 'This browser does not support geolocation. Please make sure location services are enabled on your device.';
    var errEl = document.getElementsByClassName('error')[0];
    errEl.textContent = err;
}

// helpers

function meters_to_feet(meters) {
    return meters * 3.28084;
}

function calc_velo(dist, lastTime, currTime) {
    return 1000.0 * dist / (currTime - lastTime);
}

function calc_mph(velo) {
    return velo * 3600.0 / 1609.34;
}

function calc_dist(lat1, lon1, lat2, lon2) {
    //http://www.ridgesolutions.ie/index.php/2013/11/14/algorithm-to-calculate-speed-from-two-gps-latitude-and-longitude-points-and-time-difference/

    // Convert degrees to radians
    lat1 = lat1 * Math.PI / 180.0;
    lon1 = lon1 * Math.PI / 180.0;

    lat2 = lat2 * Math.PI / 180.0;
    lon2 = lon2 * Math.PI / 180.0;

    // radius of earth in metres
    var r = 6378100;

    // P
    var rho1 = r * Math.cos(lat1);
    var z1 = r * Math.sin(lat1);
    var x1 = rho1 * Math.cos(lon1);
    var y1 = rho1 * Math.sin(lon1);

    // Q
    var rho2 = r * Math.cos(lat2);
    var z2 = r * Math.sin(lat2);
    var x2 = rho2 * Math.cos(lon2);
    var y2 = rho2 * Math.sin(lon2);

    // Dot product
    var dot = (x1 * x2 + y1 * y2 + z1 * z2);
    var cos_theta = dot / (r * r);

    var theta = Math.acos(cos_theta);

    // Distance in Metres
    return r * theta;
}
