if (localforage != undefined) {
    var store = localforage.createInstance({
        name: 'vienna'
    });
}

$(document).ready(function() {


    getChartData();


    Chart.plugins.register({
        afterDraw: function(chart) {

            if (chart.data.datasets[0].data.length == 0) {
                // No data is present
                var ctx = chart.chart.ctx;
                var width = chart.chart.width;
                var height = chart.chart.height;
                chart.clear();

                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = "16px normal 'Helvetica Nueue'";
                // chart.options.title.text <=== gets title from chart 
                // width / 2 <=== centers title on canvas 
                // 18 <=== aligns text 18 pixels from top, just like Chart.js 
                ctx.fillText('Keine Daten für diesen Zeitraum verfügbar', width / 2, height / 2);
                ctx.restore();
            }
        }
    });
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
        if (moment(value, "DD.MM.YYYY HH:mm").tz("Europe/Berlin").format("X") < moment().tz("Europe/Berlin").subtract(1, "hour").format("X") || value == null) {
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
                            startdate = startdate.subtract(1, "day");
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


                                }
                            });



                        }
                        store.setItem("entity", chartEntities).then(function() {
                            getChartData();
                        }).then(function(value) {
                            // we got our value
                        }).catch(function(err) {
                            // we got an error
                        });


                    }

                });
            }




        }
        if ($("canvas").length == 0) {
            getChartData();
        }
    });
});

function getChartData() {



    store.getItem('entity', function(err, value) {
        $("#stats .row").empty();

        for (var item in value) {
            var buildedSets = [];
            let type = "line";
            let fillChart = false;
            if (item != "vienna_buildings") {
                if (item == "carusoreservationhistory") {
                    type = "bar";
                    fillChart = true;
                }

                for (set in value[item]) {


                    colorFirst = "rgba(255,0,0,1)";
                    colorSecond = "rgba(0,0,0,1)";

                    if ($("#" + value[item][set].entityId).length == 0) {

                        if (window.location.pathname.indexOf("analytics.html") > -1) {

                            $("#stats .row").append('  <div class="col-12 col-lg-4 col-md-6"><h6 style="text-align:center">' + value[item][set].entityId + '</h6> <canvas id="' + value[item][set].entityId + '" width="400" height="400"></canvas></div>');
                        } else {
                            $("#chart_" + value[item][set].entityId).html('  <div class="col-12 col-lg-4 col-md-6"><h6 style="text-align:center">' + value[item][set].entityId + '</h6> <canvas id="' + value[item][set].entityId + '" width="400" height="400"></canvas></div>');

                        }
                    }
                    first = value[item][set].attributes[1];

                    second = value[item][set].attributes[0];
                    let buildedSets = [{
                            label: first.attrName,
                            data: first.values,
                            borderColor: colorFirst,
                            borderWidth: 1,
                            backgroundColor: colorFirst,

                            fill: fillChart,

                        },
                        {
                            label: second.attrName,
                            data: second.values,
                            fill: fillChart,

                            backgroundColor: colorSecond,


                            borderColor: colorSecond,
                            borderWidth: 1
                        }
                    ]

                    let index = value[item][set].index;

                    if (item == "carusoreservationhistory") {

                        index = value[item][set].attributes[10].values;
                    }

                    renderCharts(value[item][set].entityId, index, buildedSets, type);
                }


            }
            if (item == "vienna_buildings") {
                Chart.defaults.global.legend.display = false;

                for (current in value[item]) {

                    if (!isNaN(current)) {


                        if ($("#" + value[item][current].entityId).length == 0) {
                            $("#stats .row").append('  <div class="col-12 col-lg-4 col-md-6"><h6 style="text-align:center">Hauffgasse</h6> <canvas id="' + value[item][current].entityId + '" width="400" height="400"></canvas></div>');
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

                        renderCharts(value[item][current].entityId, value[item][current].index, buildedSets,"line");

                    } else {
                        if ($("#" + value[item][current][0].entityId).length == 0) {
                            $("#stats .row").append('  <div class="col-12 col-lg-4 col-md-6"><h6 style="text-align:center">' + current + '</h6> <canvas id="' + value[item][current][0].entityId + '" width="400" height="400"></canvas></div>');
                        }
                        buildedSets = [];


                        let options = "<option value='all'>Alle</option>";
                        for (temp in value[item][current]) {


                            let color = poolColors(1, 1);

                            options += "<option value='" + value[item][current][temp].entityId + "'>" + value[item][current][temp].entityId + "</option>";


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

                        $("#" + value[item][current][0].entityId).parent().find("h6").append("<select class='chartSwitcher' id='switchter_" + value[item][current][0].entityId + "'>" + options + "</select>");


                        let currentChart = renderCharts(value[item][current][0].entityId, value[item][current][0].index, buildedSets,"line");

                        $("#switchter_" + value[item][current][0].entityId).change(function(e, index) {
                            let indexed = $(this).prop('selectedIndex');
                            if (indexed == 0) {
                                for (var i = 0; i < currentChart.data.datasets.length; i++) {
                                    currentChart.chart.getDatasetMeta(i).hidden = false;

                                }
                            } else {
                                for (var i = 0; i < currentChart.data.datasets.length; i++) {
                                    currentChart.chart.getDatasetMeta(i).hidden = true;

                                }

                                currentChart.chart.getDatasetMeta(indexed).hidden = false;
                            }



                            currentChart.update();
                        });







                    }
                }
            }
        }
        $(".spinner-border").remove();





    });
}

function getSingleChartData(item, id) {
    store.getItem('entity', function(err, value) {


        var index = [0];
        let buildedSets = [];
        if (item != "vienna_buildings") {


            var data;
            var entityList = value[item];

            for(i=0;i<entityList.length;i++){
                var entity = entityList[i];
                if(entity.entityId == id){
                    data = entity;
                    break;
                }
            }


            colorFirst = poolColors(1, 1);
            colorSecond = poolColors(1, 1);

            if (data != undefined) {
                first = data.attributes[0];

                second = data.attributes[1];
                buildedSets = [{
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

                if (item == "rentalbike") {
                    index = data.index
                } else {
                    index = value[item][current].index
                }

                var currentAnalyticsChart = new Chart($("[id^='chart_']").find("canvas"), {
                    type: 'line',
                    data: {
                        labels: index,
                        datasets: buildedSets
                    },
                    options: {
                        legend: {
                            position: 'top',
                            labels: {
                                fontColor: 'rgb(255, 99, 132)'
                            },
                            onHover: function(event, legendItem) {
                                document.getElementById("canvas").style.cursor = 'pointer';
                            },
                            onClick: function(e, legendItem) {
                                var index = legendItem.datasetIndex;
                                var ci = this.chart;
                                var alreadyHidden = (ci.getDatasetMeta(index).hidden === null) ? false : ci.getDatasetMeta(index).hidden;

                                ci.data.datasets.forEach(function(e, i) {
                                    var meta = ci.getDatasetMeta(i);

                                    if (i !== index) {
                                        if (!alreadyHidden) {
                                            meta.hidden = meta.hidden === null ? !meta.hidden : null;
                                        } else if (meta.hidden === null) {
                                            meta.hidden = true;
                                        }
                                    } else if (i === index) {
                                        meta.hidden = null;
                                    }
                                });

                                ci.update();
                            },
                        },
                        /*  tooltips: {
                              custom: function(tooltip) {
                                  if (!tooltip.opacity) {
                                      document.getElementById("canvas").style.cursor = 'default';
                                      return;
                                  }
                              }
                          },*/
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
                                        'millisecond': 'HH:mm',
                                        'second': 'HH:mm',
                                        'minute': 'HH:mm',
                                        'hour': 'HH:mm',
                                        'day': 'HH:mm',
                                        'week': 'HH:mm',
                                        'month': 'HH:mm',
                                        'quarter': 'HH:mm',
                                        'year': 'HH:mm',
                                    }
                                }
                            }]
                        }

                    }
                });
            } else {

                var ctx = $("[id^='chart_']").find("canvas")[0].getContext('2d');

                ctx.font = "20px Arial";
                ctx.fillText("Keine Daten für diesen Zeitraum verfügbar", 10, 50);

            }






        }
        if (item == "vienna_buildings") {
            Chart.defaults.global.legend.display = false;

            if (id.indexOf("hauff") != -1) {
                var ctx = $("[id^='chart_']").find("canvas")[0].getContext('2d');

                ctx.font = "20px Arial";
                ctx.fillText("Keine Daten für diesen Zeitraum verfügbar", 10, 50);
            }

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

                    var currentAnalyticsChart = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: value[item][current].index,
                            datasets: buildedSets
                        },
                        options: {
                            legend: {
                                position: 'top',
                                labels: {
                                    fontColor: 'rgb(255, 99, 132)'
                                },
                                onHover: function(event, legendItem) {
                                    document.getElementById("canvas").style.cursor = 'pointer';
                                },
                                onClick: function(e, legendItem) {
                                    var index = legendItem.datasetIndex;
                                    var ci = this.chart;
                                    var alreadyHidden = (ci.getDatasetMeta(index).hidden === null) ? false : ci.getDatasetMeta(index).hidden;

                                    ci.data.datasets.forEach(function(e, i) {
                                        var meta = ci.getDatasetMeta(i);

                                        if (i !== index) {
                                            if (!alreadyHidden) {
                                                meta.hidden = meta.hidden === null ? !meta.hidden : null;
                                            } else if (meta.hidden === null) {
                                                meta.hidden = true;
                                            }
                                        } else if (i === index) {
                                            meta.hidden = null;
                                        }
                                    });

                                    ci.update();
                                },
                            },
                            tooltips: {
                                custom: function(tooltip) {
                                    if (!tooltip.opacity) {
                                        document.getElementById("canvas").style.cursor = 'default';
                                        return;
                                    }
                                }
                            },
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
                                            'millisecond': 'HH:mm',
                                            'second': 'HH:mm',
                                            'minute': 'HH:mm',
                                            'hour': 'HH:mm',
                                            'day': 'HH:mm',
                                            'week': 'HH:mm',
                                            'month': 'HH:mm',
                                            'quarter': 'HH:mm',
                                            'year': 'HH:mm',
                                        }
                                    }
                                }]
                            }

                        }
                    });

                } else {

                    buildedSets = [];
                    let options = "<option value='all'>Alle</option>";

                    for (temp in value[item][current]) {

                        options += "<option value='" + value[item][current][temp].entityId + "'>" + value[item][current][temp].entityId + "</option>";

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
                    if ($("[id^='chart_" + current + "']").find("canvas")[0] != null) {
                        let itemId = current;
                        let ctx = $("[id^='chart_" + itemId + "']").find("canvas")[0].getContext('2d');
                        var currentAnalyticsChart = new Chart(ctx, {
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
                                                'millisecond': 'HH:mm',
                                                'second': 'HH:mm',
                                                'minute': 'HH:mm',
                                                'hour': 'HH:mm',
                                                'day': 'HH:mm',
                                                'week': 'HH:mm',
                                                'month': 'HH:mm',
                                                'quarter': 'HH:mm',
                                                'year': 'HH:mm',
                                            }
                                        }
                                    }]
                                },
                                animation: {
                                    onComplete: function() {
                                        getDropDown(itemId, currentAnalyticsChart, options);
                                    }
                                },
                            }
                        });

                    }


                }


            }
        }
    });

    $(".chartTab").trigger("click");
}

function getDropDown(id, chart, options) {


    let temp = document.getElementById("chart_" + id);
    if (temp != null && $("#switchter_" + id).length == 0) {
        $(temp).append("<center><select class='chartSwitcher' id='switchter_" + id + "' >" + options + "</select></center>");



        $("#switchter_" + id).change(function(e, index) {
            let indexed = $(this).prop('selectedIndex');
            if (indexed == 0) {
                for (var i = 0; i < chart.data.datasets.length; i++) {
                    chart.chart.getDatasetMeta(i).hidden = false;

                }
            } else {
                for (var i = 0; i < chart.data.datasets.length; i++) {
                    chart.chart.getDatasetMeta(i).hidden = true;

                }

                chart.chart.getDatasetMeta(indexed).hidden = false;
            }



            chart.update();
        });
    }
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


function renderCharts(entityId, index, buildedSets, type) {
    var ctx = document.getElementById(entityId);
    if (ctx != null) {
        if (type == "line") {
            var currentAnalyticsChart = new Chart(ctx, {
                type: 'line',

                data: {
                    labels: index,
                    datasets: buildedSets
                },
                options: {
                    legend: {
                        position: 'top',
                        labels: {
                            fontColor: 'rgb(255, 99, 132)'
                        },
                        onHover: function(event, legendItem) {
                            document.getElementById("canvas").style.cursor = 'pointer';
                        },
                        onClick: function(e, legendItem) {
                            var index = legendItem.datasetIndex;
                            var ci = this.chart;
                            var alreadyHidden = (ci.getDatasetMeta(index).hidden === null) ? false : ci.getDatasetMeta(index).hidden;

                            ci.data.datasets.forEach(function(e, i) {
                                var meta = ci.getDatasetMeta(i);

                                if (i !== index) {
                                    if (!alreadyHidden) {
                                        meta.hidden = meta.hidden === null ? !meta.hidden : null;
                                    } else if (meta.hidden === null) {
                                        meta.hidden = true;
                                    }
                                } else if (i === index) {
                                    meta.hidden = null;
                                }
                            });

                            ci.update();
                        },
                    },
                    /*  tooltips: {
                          custom: function(tooltip) {
                              if (!tooltip.opacity) {
                                  document.getElementById("canvas").style.cursor = 'default';
                                  return;
                              }
                          }
                      },*/
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
                                    'millisecond': 'HH:mm',
                                    'second': 'HH:mm',
                                    'minute': 'HH:mm',
                                    'hour': 'HH:mm',
                                    'day': 'HH:mm',
                                    'week': 'HH:mm',
                                    'month': 'HH:mm',
                                    'quarter': 'HH:mm',
                                    'year': 'HH:mm',
                                }
                            }
                        }]
                    }

                }
            });
            return currentAnalyticsChart;
        } else {
            var currentAnalyticsChart = new Chart(ctx, {
                type: 'bar',

                data: {
                    labels: index,
                    datasets: buildedSets
                },
                options: {

                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            }
                        }],
                        xAxes: [{
                            ticks: {
                                // Create scientific notation labels
                                callback: function(value, index, values) {

                                    return moment(value).format("DD.MM HH:mm");
                                }
                            }
                        }]
                    }
                }
            });

            return currentAnalyticsChart;
        }
    }
}