"use strict";

var fs = require('fs'),
    optimist = require('optimist'),
    options,
    config,
    analyze, filterRaw, transform, filterCooked, map, reduce,
    Source = require('./lib/ReadStreamLineEmitter.js'), source,
    summary;

// parse command line arguments and options
options = optimist
    .usage('Usage: $0 [options]')
    .demand(0)
    .options('encoding', {
        'default': 'utf8',
        alias: 'e',
        describe: 'character-set of input'
    })
    .options('input', {
        'default': null,
        alias: 'i',
        describe: 'path/name of the input-file (stdin if not set)'
    })
    .options('output', {
        'default': null,
        alias: 'o',
        describe: 'path/name of the output-file (stdout if not set)'
    })
    .options('config', {
        'default': null,
        describe: 'path/name of configuration file (js)'
    })
    .options('header', {
        'default': null,
        describe: 'header text, e.g. site-name, server-name, ...'
    })
    .options('help', {
        alias: 'h',
        describe: 'show help and exit'
    })
    .argv;


// fast exit when demanding help ...
if (options.help) {
    optimist.showHelp();
    process.exit(1);
}

if (options.debug) {
    console.log(options);
}

config = options.config ? require(options.config) : {};

analyze      = config.analyze       || require('./lib/LogLineAnalyzerApache.js');
filterRaw    = config.filterRaw     || function () { return true; };
transform    = config.transform     || require('./lib/DefaultTransformImpl.js');
filterCooked = config.filterCooked  || function () { return true; };
map          = config.map           || require('./lib/DefaultMapImpl.js');
reduce       = config.reduce        || require('./lib/DefaultReduceImpl.js');

summary = {};
if (options.header) {
    summary.header = options.header;
}

if (options.input) {
    source = new Source(fs.createReadStream(options.input, {encoding: options.encoding}), options);
} else {
    source = new Source(process.stdin, options);
}

analyzeToSummary(source, summary);

function analyzeToSummary(source, summary, callback) {

    source.on('line', function (line) {

        var hit = analyze(line),
            cooked;

        if (hit && filterRaw(hit)) {
            cooked = transform(hit);
            if (cooked && filterCooked(cooked)) {
                map(cooked, function emit(input) {
                    reduce([input], summary);
                });
            }
        }
    });

    source.on('end', function () {
        if (options.output) {
            fs.writeFileSync(options.output, JSON.stringify(summary, null, '\t'));
        } else {
            console.log(JSON.stringify(summary, null, '\t'));
        }
        if (callback) {
            callback(null, summary);
        }
    });

    if (!options.input) {
        // stdin is paused by default, so let's start!
        process.stdin.resume();
    }
}
