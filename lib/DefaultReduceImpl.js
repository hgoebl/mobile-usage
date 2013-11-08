"use strict";

module.exports = function defaultReduceImpl(inputs, summary) {

    if (summary.hits === undefined) {
        summary.hits = 0;
    }

    inputs.forEach(function (input) {
        var summaryVersions;

        Object.keys(input)
            .filter(function (category) {
                return category !== 'versions' && category !== 'hits';
            })
            .forEach(function (category) {
                var summaryCategory = summary[category];
                if (summaryCategory === undefined) {
                    summaryCategory = summary[category] = {};
                }
                Object.keys(input[category]).forEach(function (key) {
                    var inputCategory = input[category];
                    if (summaryCategory[key] === undefined) {
                        summaryCategory[key] = inputCategory[key];
                    } else {
                        summaryCategory[key] += inputCategory[key];
                    }
                });
            });

        // reduce versions
        if (input.versions) {
            summaryVersions = summary.versions;
            if (!summaryVersions) {
                summary.versions = summaryVersions = {};
            }
            Object.keys(input.versions).forEach(function (product) {
                var inputProduct, summaryProduct;

                inputProduct = input.versions[product];
                summaryProduct = summaryVersions[product];

                if (summaryProduct === undefined) {
                    summaryProduct = summaryVersions[product] = {};
                }

                Object.keys(inputProduct).forEach(function (version) {
                    if (!summaryProduct[version]) {
                        summaryProduct[version] = inputProduct[version];
                    } else {
                        summaryProduct[version] += inputProduct[version];
                    }
                })
            });
        }

        if (!isNaN(input.hits)) {
            summary.hits += input.hits;
        }
    });
};