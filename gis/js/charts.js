if (localforage != undefined) {
    var store = localforage.createInstance({
        name: 'vienna'
    });
}

$(document).ready(function() {



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
        chartEntities[value] = [];
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

                            chartEntities[value].push(itemData);
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

    localforage.getItem('entity', function(err, value) {


        for (var item in value) {

            var buildedSets = [];
            for (set in value[item]) {
                $("#stats .row").append('  <div class="col-xs-4"><h6 style="text-align:center">' + value[item][set].entityId + '</h6> <canvas id=' + value[item][set].entityId + ' width="400" height="400"></canvas></div>');

                first = value[item][set].attributes[0];

                second = value[item][set].attributes[1];
                let buildedSets = [{
                        label: first.attrName,
                        data: first.values,
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.2)',

                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',

                        ],
                        borderWidth: 1
                    },
                    {
                        label: second.attrName,
                        data: second.values,
                        backgroundColor: [
                            'rgba(75, 192, 192, 0.2)',

                        ],
                        borderColor: [
                            'rgba(75, 192, 192, 0.2)',

                        ],
                        borderWidth: 1
                    }
                ]
                if (item == "vienna_buildings") {
                    buildedSets = [{
                            label: value[item][set].attributes[3].attrName,
                            data: value[item][set].attributes[3].values,
                            backgroundColor: [
                                'rgba(255, 99, 132, 0.2)',

                            ],
                            borderColor: [
                                'rgba(255, 99, 132, 1)',

                            ],
                            borderWidth: 1
                        }

                    ]
                }



                var ctx = document.getElementById(value[item][set].entityId);
                var currentAnalyticsChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: value[item][set].index,
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
                                ticks: {
                                    beginAtZero: true,
                                    callback: function(value, index, values) {
                                        return moment(value).format("DD.MM.YYYY HH:mm");
                                    }
                                }
                            }]
                        }
                    }
                });
            }
        }
    });

    return;
    $("canvas").each(function() {
        var url = './api/quantumleap/v2/entities/' + $(this).attr("id");
        let item = $(this);
        $.ajax({
            url: url,
            headers: { "fiware-service": $(this).attr("data-service"), "fiware-servicepath": "/" },
            type: "GET",
            data: data,
            success: function(result) {

                let first = result.attributes[0];
                let second = result.attributes[1];

                item.parent().prepend("<h6 style='text-align:center'>" + result.entityId + "</h6>");
                var ctx = document.getElementById(result.entityId);
                var currentAnalyticsChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: result.index,
                        datasets: [{
                                label: first.attrName,
                                data: first.values,
                                backgroundColor: [
                                    'rgba(255, 99, 132, 0.2)',

                                ],
                                borderColor: [
                                    'rgba(255, 99, 132, 1)',

                                ],
                                borderWidth: 1
                            },
                            {
                                label: second.attrName,
                                data: second.values,
                                backgroundColor: [
                                    'rgba(75, 192, 192, 0.2)',

                                ],
                                borderColor: [
                                    'rgba(75, 192, 192, 0.2)',

                                ],
                                borderWidth: 1
                            }
                        ]
                    },
                    options: {
                        scales: {
                            yAxes: [{
                                ticks: {
                                    beginAtZero: true,

                                }
                            }],
                            xAxes: [{
                                ticks: {
                                    beginAtZero: true,
                                    callback: function(value, index, values) {
                                        return moment(value).format("DD.MM.YYYY HH:mm");
                                    }
                                }
                            }]
                        }
                    }
                });
            },
            error: function(result) {
                alert('Error');
            }
        });

    })


});