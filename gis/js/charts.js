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

                        success: function(itemData) {
                            if (itemData.entityId.split("_").length > 1) {

                                if (chartEntities[value][itemData.entityId.split("_")[0]] == undefined) {
                                    chartEntities[value][itemData.entityId.split("_")[0]] = [];
                                }
                                chartEntities[value][itemData.entityId.split("_")[0]].push(itemData);

                            } else {
                                chartEntities[value].push(itemData);
                            }
                            localforage.setItem("entity", chartEntities).then(function() {

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
});

function getChartData(render = false) {


    localforage.getItem('entity', function(err, value) {


        for (var item in value) {
            var buildedSets = [];

            if (item != "vienna_buildings") {
                for (set in value[item]) {


                    colorFirst = poolColors(1, 1);
                    colorSecond = poolColors(1, 1);

                    if ($("#" + value[item][set].entityId).length == 0) {
                        $("#stats .row").append('  <div class="col-12 col-lg-4"><h6 style="text-align:center">' + value[item][set].entityId + '</h6> <canvas id="' + value[item][set].entityId + '" width="400" height="400"></canvas></div>');
                    }
                    first = value[item][set].attributes[0];

                    second = value[item][set].attributes[1];
                    let buildedSets = [{
                            label: first.attrName,
                            data: first.values,
                            backgroundColor: colorFirst,
                            borderColor: colorFirst,
                            borderWidth: 1
                        },
                        {
                            label: second.attrName,
                            data: second.values,
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
                                    label: value[item][current][temp].entityId,
                                    data: value[item][current][temp].attributes[3].values,
                                    backgroundColor: color,
                                    borderColor: color,
                                    borderWidth: 1
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