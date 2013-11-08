// Place paths to your implementations absolute or relative to the config-script

var defaultMapImpl = require("./lib/DefaultMapImpl.js"),
    NAGIOS_IPS = /^214\.96\.80\.23[01]$/;

module.exports = {

    filterRaw: function (hit) {
        // do not count requests from nagios monitoring
        if (NAGIOS_IPS.test(hit.ip)) {
            return false;
        }
        // do not count weird requests
        if (hit.userAgent === '-' && hit.referer === '-') {
            return false;
        }

        return true;
    },

    filterCooked: function (cooked) {
        // only count mobile devices which are Mobile Grade A
        return cooked.mobileGrade === 'A';
    },

    map: function (cooked, emit) {
        // a somewhat derived example to filter based on emitted objects (better use filterCooked!)
        defaultMapImpl(cooked, function (emittedObject) {
            if (emittedObject.mobileGrade && emittedObject.mobileGrade.A >= 1 ||
                true) {
                emit(emittedObject);
            }
        });
    }

};