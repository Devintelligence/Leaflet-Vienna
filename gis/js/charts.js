if (localforage != undefined) {
    var store = localforage.createInstance({
        name: 'vienna'
    });
}

$(document).ready(function() {


    getChartData();

    let entities = [{
        "entity": "rentalbike",

    }, {
        "entity": "carusoreservationhistory",

    }, {
        "entity": "vienna_buildings",

    }, {
        "entity": "elogistik",

    }]


    let chartEntities = [];

    store.getItem('lastUpdate', function(err, value) {
        console.log(value);
        if (moment(value) < moment().subtract(5, "minute") || value == null) {
            store.setItem("lastUpdate", moment().format("DD.MM.YYYY HH:mm")).then(function() {

            }).then(function(value) {
                // we got our value
            }).catch(function(err) {
                console.log(err);
            });


            for (var item in entities) {
                let value = entities[item].entity;
                if (chartEntities[value] == undefined) {
                    chartEntities[value] = [];
                }
                var url = './api/contextbroker/v2/entities?limit=200'
                $.ajax({
                    url: url,
                    headers: { "fiware-service": value, "fiware-servicepath": "/" },
                    type: "GET",
                    async: false,

                    success: function(result) {

                        for (var i in result) {
                            var startdate = moment();
                            startdate = startdate.subtract(1, "weeks");
                            data = { 'fromDate': startdate.format("YYYY-MM-DD") };
                            var url = './api/quantumleap/v2/entities/' + result[i].id;
                            $.ajax({
                                url: url,
                                headers: { "fiware-service": value, "fiware-servicepath": "/" },
                                type: "GET",
                                data: data,
                                async: false,
                                success: function(itemData) {

                                    if (itemData.entityId.split("_").length > 1) {

                                        if (chartEntities[value][itemData.entityId.split("_")[0]] == undefined) {
                                            chartEntities[value][itemData.entityId.split("_")[0]] = [];
                                        }
                                        chartEntities[value][itemData.entityId.split("_")[0]].push(itemData);

                                    } else {
                                        chartEntities[value].push(itemData);
                                    }
                                    store.setItem("entity", chartEntities).then(function() {

                                    }).then(function(value) {
                                        // we got our value
                                    }).catch(function(err) {
                                        // we got an error
                                    });

                                }
                            });

                        }



                    }

                });
            }



            if ($("canvas").length == 0) {
                getChartData();
            }
        }
    });
});

function getChartData(render = false) {



    store.getItem('entity', function(err, value) {
        $("#stats .row").empty();

        for (var item in value) {
            var buildedSets = [];

            if (item != "vienna_buildings") {
                for (set in value[item]) {


                    colorFirst = poolColors(1, 1);
                    colorSecond = poolColors(1, 1);

                    if ($("#" + value[item][set].entityId).length == 0) {

                        if (window.location.pathname.indexOf("analytics.html") > -1) {

                            $("#stats .row").append('  <div class="col-12 col-lg-4"><h6 style="text-align:center">' + value[item][set].entityId + '</h6> <canvas id="' + value[item][set].entityId + '" width="400" height="400"></canvas></div>');
                        } else {
                            $("#chart_" + value[item][set].entityId).html('  <div class="col-12 col-lg-4"><h6 style="text-align:center">' + value[item][set].entityId + '</h6> <canvas id="' + value[item][set].entityId + '" width="400" height="400"></canvas></div>');

                        }
                    }
                    first = value[item][set].attributes[0];

                    second = value[item][set].attributes[1];
                    let buildedSets = [{
                            label: first.attrName,
                            data: first.values,
                            borderColor: colorFirst,
                            borderWidth: 1,
                            backgroundColor: colorFirst,

                            fill: false,

                        },
                        {
                            label: second.attrName,
                            data: second.values,
                            fill: false,
                            backgroundColor: colorSecond,


                            borderColor: colorSecond,
                            borderWidth: 1
                        }
                    ]
                    renderCharts(value[item][set].entityId, value[item][set].index, buildedSets);
                }


            }
            if (item == "vienna_buildings") {

                for (current in value[item]) {

                    if (!isNaN(current)) {


                        if ($("#" + value[item][current].entityId).length == 0) {
                            $("#stats .row").append('  <div class="col-12 col-lg-4"><h6 style="text-align:center">Hauffgasse</h6> <canvas id="' + value[item][current].entityId + '" width="400" height="400"></canvas></div>');
                        }

                        color = poolColors(value[item][current].length, 1);
                        buildedSets = [{
                                label: value[item][current].attributes[1].attrName,
                                data: value[item][current].attributes[1].values,
                                backgroundColor: color,
                                borderColor: color,
                                fill: false,
                                borderWidth: 1
                            }

                        ]

                        renderCharts(value[item][current].entityId, value[item][current].index, buildedSets);

                    } else {
                        if ($("#" + value[item][current][0].entityId).length == 0) {
                            $("#stats .row").append('  <div class="col-12 col-lg-4"><h6 style="text-align:center">' + current + '</h6> <canvas id="' + value[item][current][0].entityId + '" width="400" height="400"></canvas></div>');
                        }
                        buildedSets = [];

                        for (temp in value[item][current]) {


                            let color = poolColors(1, 1);



                            buildedSets.push({
                                    fill: false,
                                    label: value[item][current][temp].entityId,
                                    data: value[item][current][temp].attributes[3].values,
                                    backgroundColor: color,
                                    borderColor: color,
                                    borderWidth: 0
                                }

                            )
                        }

                        renderCharts(value[item][current][0].entityId, value[item][current][0].index, buildedSets);

                    }
                }
            }
        }
        $(".spinner-border").remove();





    });
}

function getSingleChartData(item, id) {
    store.getItem('entity', function(err, value) {



        if (item != "vienna_buildings") {

            let data = value[item].find(e => e.entityId == id);

            colorFirst = poolColors(1, 1);
            colorSecond = poolColors(1, 1);


            first = data.attributes[0];

            second = data.attributes[1];
            let buildedSets = [{
                    label: first.attrName,
                    data: first.values,
                    borderColor: colorFirst,
                    borderWidth: 1,
                    backgroundColor: colorFirst,

                    fill: false,

                },
                {
                    label: second.attrName,
                    data: second.values,
                    fill: false,
                    backgroundColor: colorSecond,


                    borderColor: colorSecond,
                    borderWidth: 1
                }
            ]


            var currentAnalyticsChart = new Chart($("[id^='chart_']").find("canvas"), {
                type: 'line',
                data: {
                    labels: value[item][current].index,
                    datasets: buildedSets
                },
                options: {
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true,

                            }
                        }],
                        xAxes: [{
                            type: 'time',
                            time: {
                                displayFormats: {
                                    'millisecond': 'MM.DD',
                                    'second': 'MM.DD',
                                    'minute': 'MM.DD',
                                    'hour': 'MM.DD',
                                    'day': 'MM.DD',
                                    'week': 'MM.DD',
                                    'month': 'MM.DD',
                                    'quarter': 'MM.DD',
                                    'year': 'MM.DD',
                                }
                            }
                        }]
                    }

                }
            });




        }
        if (item == "vienna_buildings") {

            for (current in value[item]) {

                if (!isNaN(current)) {



                    color = poolColors(value[item][current].length, 1);
                    buildedSets = [{
                            label: value[item][current].attributes[1].attrName,
                            data: value[item][current].attributes[1].values,
                            backgroundColor: color,
                            borderColor: color,
                            fill: false,
                            borderWidth: 1
                        }

                    ]

                    var currentAnalyticsChart = new Chart($("[id^='chart_hauffgasse']").find("canvas"), {
                        type: 'line',
                        data: {
                            labels: value[item][current].index,
                            datasets: buildedSets
                        },
                        options: {
                            scales: {
                                yAxes: [{
                                    ticks: {
                                        beginAtZero: true,

                                    }
                                }],
                                xAxes: [{
                                    type: 'time',
                                    time: {
                                        displayFormats: {
                                            'millisecond': 'MM.DD',
                                            'second': 'MM.DD',
                                            'minute': 'MM.DD',
                                            'hour': 'MM.DD',
                                            'day': 'MM.DD',
                                            'week': 'MM.DD',
                                            'month': 'MM.DD',
                                            'quarter': 'MM.DD',
                                            'year': 'MM.DD',
                                        }
                                    }
                                }]
                            }

                        }
                    });

                } else {

                    buildedSets = [];

                    for (temp in value[item][current]) {


                        let color = poolColors(1, 1);



                        buildedSets.push({
                                fill: false,
                                label: value[item][current][temp].entityId,
                                data: value[item][current][temp].attributes[3].values,
                                backgroundColor: color,
                                borderColor: color,
                                borderWidth: 0
                            }

                        )
                    }

                    var currentAnalyticsChart = new Chart($("[id^='chart_" + current + "']").find("canvas"), {
                        type: 'line',
                        data: {
                            labels: value[item][current][0].index,
                            datasets: buildedSets
                        },
                        options: {
                            scales: {
                                yAxes: [{
                                    ticks: {
                                        beginAtZero: true,

                                    }
                                }],
                                xAxes: [{
                                    type: 'time',
                                    time: {
                                        displayFormats: {
                                            'millisecond': 'MM.DD',
                                            'second': 'MM.DD',
                                            'minute': 'MM.DD',
                                            'hour': 'MM.DD',
                                            'day': 'MM.DD',
                                            'week': 'MM.DD',
                                            'month': 'MM.DD',
                                            'quarter': 'MM.DD',
                                            'year': 'MM.DD',
                                        }
                                    }
                                }]
                            }

                        }
                    });

                }


            }
        }
    });
}


function waitForElementToDisplay(selector, time, callback) {
    if (selector.length) {
        callback();
        return;
    } else {
        setTimeout(function() {
            waitForElementToDisplay(selector, time);
        }, time);
    }
}

function dynamicColor(opactiy) {
    var r = Math.floor(Math.random() * 255);
    var g = Math.floor(Math.random() * 255);
    var b = Math.floor(Math.random() * 255);
    return "rgba(" + r + "," + g + "," + b + ", " + opactiy + ")";
};

function poolColors(a, opactiy) {
    var pool = [];
    for (var i = 0; i < a; i++) {
        pool.push(this.dynamicColor(opactiy));
    }
    return pool;
}

function renderCharts(entityId, index, buildedSets) {
    var ctx = document.getElementById(entityId);
    if (ctx != null) {
        var currentAnalyticsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: index,
                datasets: buildedSets
            },
            options: {
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,

                        }
                    }],
                    xAxes: [{
                        type: 'time',
                        time: {
                            displayFormats: {
                                'millisecond': 'MM.DD',
                                'second': 'MM.DD',
                                'minute': 'MM.DD',
                                'hour': 'MM.DD',
                                'day': 'MM.DD',
                                'week': 'MM.DD',
                                'month': 'MM.DD',
                                'quarter': 'MM.DD',
                                'year': 'MM.DD',
                            }
                        }
                    }]
                }

            }
        });
    }
}