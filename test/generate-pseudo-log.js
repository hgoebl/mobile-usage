var mobilePerVendor = require('./data/user-agents.js');

Object.keys(mobilePerVendor).forEach(function (manufacturer) {
    mobilePerVendor[manufacturer].forEach(function (device) {
        console.log('::1 - - [17/Jun/2013:15:25:54 +0200] "GET / HTTP/1.1" 200 20078 "http://localhost/" "' + device.user_agent + '"');
    })
});
