/*jshint node:true, es5:true, devel:true, globalstrict:true, regexp:false*/
"use strict";

// ::1 - - [17/Jun/2013:15:25:54 +0200] "GET / HTTP/1.1" 200 20078 "http://localhost/" "Mozilla/5.0 (Windows NT 6.1; WOW64)"
var apacheRegExp = /^([\d.:]+) (\S+) (\S+) \[([\w:/]+\s[+\-]\d{4})\] "(.+?)" (\d{3}) (\d+) "([^"]+)" "([^"]+)"/,
    errorCount = 0;

/**
 * Tokenizes line and extracts basic information.
 * @returns object with following attributes:
 *   userAgent: the User-Agent header of the request
 *   raw: the original line coming from the input stream
 */
module.exports = function analyzeApacheLogLine(line) {
    var matcher = apacheRegExp.exec(line);

    if (!matcher) {
        ++errorCount;

        if (errorCount < 100) {
            console.error('unrecognized raw line: ' + line);
        } else if (errorCount === 100) {
            console.error('too many unrecognized lines; will be quiet now');
        }

        return null;
    }

    return {
        raw: line,
        ip: matcher[1],
        ts: matcher[4],
        request: matcher[5],
        response: matcher[6],
        bytes: matcher[7],
        referer: matcher[8],
        userAgent: matcher[9]
    };
};
