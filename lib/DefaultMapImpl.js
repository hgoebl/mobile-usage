"use strict";

module.exports = function defaultMapImpl(cooked, emit) {
    if (cooked) {
        emit(aggregate(cooked));
    }
};

function aggregate(info) {
    var aggregated = { hits: 1 };

    Object.keys(info)
        .filter(function (key) {
            return key !== 'versions' && info[key] !== null;
        })
        .forEach(function (key) {
            aggregated[key] = {};
            aggregated[key][info[key]] = 1;
        });

    if (info.versions) {
        aggregated.versions = {};
        Object.keys(info.versions).forEach(function (product) {
            var version = info.versions[product],
                productHash = {};
            productHash['' + version] = 1;
            aggregated.versions[product] = productHash;
        });
    }

    return aggregated;
}