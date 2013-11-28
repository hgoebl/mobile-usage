/*global jQuery:false d3:false nv:false*/
(function ($, d3, nv, undefined) {
    "use strict";

    // ------------------------------- configuration ------------------------------

    var WIDTH = 500,
        HEIGHT = 500;

    var windowsNtMap = {
        "5.0": '2000',
        "5.1": 'XP',
        "5.2": 'XP Pro x64',  // could also be Server 2003
        "6.0": 'Vista',       // could also be Server 2008
        "6.1": '7',           // could also be Server 2008 R2
        "6.2": '8/Phone 8',   // could also be Server 2012
        "6.3": '8.1'
    };

    var metadata = {
        os: {
            title: 'Mobile Operating Systems',
            description: 'The operating systems of mobile devices (only known and detected)',
            id: 'oss',
            totalCount: categoryCount,
            label: labelMapper({
                AndroidOS: 'Android',
                BlackBerryOS: 'BlackBerry',
                PalmOS: 'Palm',
                SymbianOS: 'Symbian',
                WindowsMobileOS: 'Windows Mobile',
                WindowsPhoneOS: 'Windows Phone',
                MeeGoOS: 'MeeGoo',
                MaemoOS: 'Maemo',
                badaOS: 'bada',
                BREWOS: 'BREW'
            })
        },
        userAgent: {
            title: 'Mobile User-Agents',
            description: 'Used browsers in mobile devices (only detected ones)',
            id: 'uas',
            totalCount: categoryCount,
            label: labelMapper({GenericBrowser: '(generic)', UCBrowser: 'UC'})
        },
        phone: {
            title: 'Phones',
            description: 'Distribution of phone manufacturers',
            id: 'phones',
            totalCount: categoryCount,
            label: labelMapper({GenericPhone: '(generic)'})
        },
        tablet: {
            title: 'Tablets',
            description: 'Distribution of tablet manufacturers',
            id: 'tablets',
            totalCount: categoryCount,
            label: function (key) {
                return key.replace(/Tablet/, '');
            }
        },
        mobileGrade: {
            title: 'Mobile Grade (mobile only)',
            description: 'jQuery Mobile\'s 3-level <a href="http://jquerymobile.com/gbs/">Mobile Graded Browser' +
                'Support</a>: A (full), B (full minus Ajax), C (basic HTML).<br>' +
                'The chart considers only devices detected as being <strong>mobile</strong>.',
            id: 'mobile-grade',
            totalCount: categoryCount
        },
        mobileGradeAll: {
            title: 'Mobile Grade (all)',
            description: 'Like above, but counting <strong>all</strong> hits/visits whether mobile or not.',
            id: 'mobile-grade-all',
            totalCount: totalHitsCount
        },
        mobileVersions: {
            title: 'Mobile Versions',
            description: '',
            id: 'mobile-versions',
            totalCount: categoryCount
        },
        desktopBrowser: {
            title: 'Desktop User-Agents',
            description: '',
            id: 'desktopBrowser',
            totalCount: categoryCount
        },
        formfactor: {
            title: 'Formfactor',
            description: '',
            id: 'formfactor',
            totalCount: totalHitsCount
        },
        "versions.Android": {
            title: 'Android Versions',
            description: '',
            id: 'versions-android',
            totalCount: categoryCount
        },
        "versions.iOS": {
            title: 'iOS Versions',
            description: '',
            id: 'versions-ios',
            totalCount: categoryCount
        },
        "versions.IE": {
            title: 'MSIE Versions',
            description: '',
            id: 'versions-msie',
            totalCount: categoryCount
        },
        "versions.Windows NT": {
            title: 'Windows Versions',
            description: '',
            id: 'versions-windows',
            totalCount: categoryCount,
            label: labelMapper(windowsNtMap)
        }
    };

    // ------------------------------- data access / aggregation ------------------------------

    function totalHitsCount(summary) {
        return summary.hits;
    }

    function categoryCount(summary, categoryKey) {
        var category = getCategory(summary, categoryKey);

        return Object.keys(category).reduce(function(sum, elem) {
            return sum + category[elem];
        }, 0);
    }

    function labelMapper(map) {
        return function (key) {
            return map[key] || key;
        };
    }

    function getCategory(summary, categoryKey) {
        var parts = categoryKey.split(/\./);
        return ((parts.length == 1) ? summary[categoryKey] : summary[parts[0]][parts[1]]) || {};
    }

    function sortByN(item1, item2) {
        return item2.n - item1.n;
    }

    function transformObject(object, sum, maxItems) {
        var data, othersSum = sum, othersCount = 0;

        data = Object.keys(object).map(function (key) {
            var count = object[key];
            othersSum -= count;
            return {key: key, n: count};
        });
        data.sort(sortByN);
        if (maxItems && data.length > maxItems) {
            data = data.filter(function (item, index) {
                if (index < maxItems - 1) {
                    return true;
                }
                othersSum += item.n;
                ++othersCount;
                return false;
            })
        }
        if (othersSum > 0) {
            data.push({
                key: othersCount ? '(others: ' + othersCount + ')' : '(others)',
                n: othersSum
            });
            // data.sort(sortByN); do not sort, so others are always last
        }
        return data;
    }

    function aggregateMobile(data) {
        var products = ['Android', 'Windows Phone', 'iPod', 'iPhone', 'iPad', 'Symbian', 'Kindle'],
            agg = {};

        products.forEach(function (product) {
            groupByMajorVersion(product, data.versions[product], agg);
        });

        data.mobileVersions = agg;
    }

    function groupByMajorVersion(product, versionObj, agg) {
        if (versionObj === undefined) {
            return;
        }
        Object.keys(versionObj).forEach(function (version) {
            var majorVersion = product + ' ' + Math.floor(Number(version));
            if (agg[majorVersion]) {
                agg[majorVersion] += versionObj[version];
            } else {
                agg[majorVersion] = versionObj[version];
            }
        });
    }

    // ------------------------------- visualization ------------------------------

    function showPieChart(id, categoryKey, category, totalCount) {
        var data = transformObject(category, totalCount, 10),
            pctScale = d3.scale
                .linear()
                .domain([0, totalCount])
                .range([0, 100]),
            label = metadata[categoryKey].label || function (key) {return key};

        nv.addGraph(function() {
            var chart = nv.models.pieChart()
                    .x(function(d) { return label(d.key); })
                    .y(function(d) { return pctScale(d.n); })
                    .color(d3.scale.category10().range())
                    .width(WIDTH)
                    .height(HEIGHT);

            d3.select('#stats-' + id + ' svg.mypiechart')
                    .datum(data)
                    .transition().duration(1200)
                    .attr('width', WIDTH)
                    .attr('height', HEIGHT)
                    .call(chart);

            return chart;
        });
    }

    function showTable(id, categoryKey, category, totalCount) {
        var data = transformObject(category, totalCount, 20),
            pctScale = d3.scale
                .linear()
                .domain([0, totalCount])
                .range([0, 100]),
            pctFormat = d3.format('.1f'),
            label = metadata[categoryKey].label || function (key) {return key},
            table, thead, tbody;

        table = d3.select('#stats-' + id + ' table.table');
        thead = table.append('thead');
        tbody = table.append('tbody');

        thead.append('tr').selectAll('th')
            .data(['#', 'Name', '%', 'Hits'])
            .enter()
            .append('th')
            .text(function (d) {return d});

        // create a row for each object in the data
        var rows = tbody.selectAll("tr")
            .data(data)
            .enter()
            .append("tr");

        // create a cell in each row for each column
        var cells = rows.selectAll("td")
            .data(function(d, idx) {
                return [idx + 1, label(d.key), pctFormat(pctScale(d.n)), d.n ];
            })
            .enter()
            .append("td")
            .text(function(d) { return d });
    }

    function showCountInfo(id, categoryCount, total) {
        var info = (categoryCount < total) ?
            'Total: ' + (100 * categoryCount / total).toFixed(1) + '% (' + categoryCount + ' of ' + total + ')' :
            'Total: 100% (' + total + ')';

        $('#stats-' + id + ' p.count-info').text(info);
    }

    function showAll(summary) {
        var $sidebarNav = $('#sidebar-nav'), sidebarContent = [],
            $main = $('#main'), mainContent = [],
            totalHits;

        $('#header').text(summary.header);
        document.title = summary.header ? summary.header + ' (mobile-usage)' : 'mobile-usage';
        totalHits = totalHitsCount(summary);

        Object.keys(metadata).forEach(function createHtml(categoryKey) {
            var meta = metadata[categoryKey];
            sidebarContent.push('<li><a href="#' + meta.id + '">' + meta.title + '</a></li>');

            mainContent.push('<a class="ua-anchor" id="' + meta.id + '"></a>');
            mainContent.push('<h2 class="category-title">' + meta.title + '</h2>');
            mainContent.push('<p class="text-muted">' + meta.description + '</p>');
            mainContent.push('<div id="stats-' + meta.id + '">');
            mainContent.push('<p class="count-info pull-right"></p>');
            mainContent.push('<svg class="mypiechart"></svg>');
            mainContent.push('<table class="table table-striped table-bordered table-condensed"></table>');
            mainContent.push('</div>');
            mainContent.push('<hr>');
        });
        sidebarContent.push('<li><a href="#about">About</a></li>');

        $sidebarNav.html(sidebarContent.join(''));
        $main.html(mainContent.join(''));

        Object.keys(metadata).forEach(function showPie(categoryKey) {
            var meta = metadata[categoryKey],
                category = getCategory(summary, categoryKey),
                categoryCount = meta.totalCount(summary, categoryKey);

            showCountInfo(meta.id, categoryCount, totalHits);
            showPieChart(meta.id, categoryKey, category, categoryCount);
            showTable(meta.id, categoryKey, category, categoryCount);
        });
    }

    function wipeOut() {
        showAll({ hits: 0, versions: {} });
    }

    $(function () {
        wipeOut();

        $.getJSON('pseudo-data/example-summary.json')
            .done(function (data) {
                aggregateMobile(data);
                showAll(data);
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                // TODO show error msg
                wipeOut();
            });
    });

    // ------------------------------- drag and drop ------------------------------

    $(function () {

        // see Alex MacCaw - JavaScript Web Applications, O'Reilly
        var $dropzone = $('body > div.container');

        $dropzone.bind('dragenter', function (event) {
            event.stopPropagation();
            event.preventDefault();
            $dropzone.addClass('dragged');
        });

        $dropzone.bind('dragleave mouseout', function (event) {
            $dropzone.removeClass('dragged');
        });

        $dropzone.bind('dragover', function (event) {
            event.originalEvent.dataTransfer.dropEffect = 'copy';

            event.stopPropagation();
            event.preventDefault();
        });

        $dropzone.bind('drop', function (event) {
            event.stopPropagation();
            event.preventDefault();

            event = event.originalEvent;

            var files = event.dataTransfer.files,
                file, fileReader;

            if (!files || files.length !== 1) {
                alert('You must drop exactly one .json file in this area!');
            } else {
                file = files[0];
                console.log('Processing ' + file.name + ' (' + file.size + ' Bytes)');

                fileReader = new FileReader();
                fileReader.onload = function (event) {
                    var data;
                    try {
                        data = JSON.parse(event.target.result);
                        aggregateMobile(data);
                        showAll(data);
                    } catch (e) {
                        alert('Not a valid summary JSON file!');
                        wipeOut();
                    }
                };
                fileReader.onerror = function (event) {
                    alert('Not a valid summary JSON file!');
                    wipeOut();
                };
                fileReader.readAsText(file);
            }
        });

        $('body').bind('dragover dragenter drop', function (event) {
            event.stopPropagation();
            event.preventDefault();
            return false;
        });

    });

}(jQuery, d3, nv));
