/*jshint node:true, es5:true, devel:true, globalstrict:true, regexp:false*/
"use strict";

var EventEmitter = require('events').EventEmitter,
    util = require('util');

/**
 * Reads from a read-stream and emits <code>line</code> events.
 *
 * @param stream the read stream, e.g. process.stdin
 * @param options
 * @constructor
 */
function ReadStreamLineEmitter(stream, options) {
    var incompleteLine,
        self = this;

    EventEmitter.call(this);

    // prepare stream for character processing and listen to events
    stream.setEncoding(options.encoding);

    function processData(data) {
        var lastLineIncomplete, lines;

        if (incompleteLine) {
            // append data to not yet emitted, incomplete line
            data = incompleteLine + data;
            incompleteLine = null;
        }

        lastLineIncomplete = data && data.charAt(data.length - 1) !== '\n';
        lines = data.split(/\n/gm);

        if (lastLineIncomplete) {
            // wait to emit last line until rest of line comes in
            incompleteLine = lines.pop();
        }
        else {
            // remove last '' after newline
            lines.pop();
        }
        lines.forEach(function (line, i) {
            self.emit('line', line);
        });
    }

    stream.on('data', processData);

    stream.on('end', function () {
        if (incompleteLine) {
            processData('\n');
        }
        self.emit('end');
    });

    stream.on('error', function (err) {
        self.emit('error', err);
    });
}

util.inherits(ReadStreamLineEmitter, EventEmitter);

module.exports = ReadStreamLineEmitter;
