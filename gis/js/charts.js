$(document).ready(function() {


    var startdate = moment();
    startdate = startdate.subtract(1, "weeks");
    data = { 'fromDate': startdate.format("YYYY-MM-DD") };

    $("canvas").each(function() {
        var url = './api/quantumleap/v2/entities/' + $(this).attr("id");
        $.ajax({
            url: url,
            headers: { "fiware-service": $(this).attr("data-service"), "fiware-servicepath": "/" },
            type: "GET",
            data: data,
            success: function(result) {
                console.log(result)
                let first = result.attributes[0];
                let second = result.attributes[1];


                var ctx = document.getElementById(result.entityId);
                var myChart = new Chart(ctx, {
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
                                    beginAtZero: true
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