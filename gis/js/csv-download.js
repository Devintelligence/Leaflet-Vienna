$(document).ready(function() {
    $("#dataModel").change(function() {
        var valueText = ''
        var value = $(this).val()
        if (value == '0') {
            $("#dataHtml").hide();
            return true;
        } else {
            if(value == 'vienna_buildings_hauffgasse'){
                valueText = 'hauffgasse';
                value = 'vienna_buildings';
            }
            var url = './api/contextbroker/v2/entities?limit=200'
            $.ajax({
                url: url,
                headers: { "fiware-service": value, "fiware-servicepath": "/" },
                type: "GET",
                success: function(result) {
                    var dataPointsHtmlOdd = '<div class="col-md-6">';
                    var devicesHtmlOdd = '<div class="col-md-6">';
                    var dataPointsHtmlEven = '<div class="col-md-6">';
                    var devicesHtmlEven = '<div class="col-md-6">';
                    if(value == 'vienna_buildings'){
                        dataValues = [];
                        if(valueText == 'hauffgasse'){
                            for (var index = 0; index < result.length; index++) {
                                if(result[index]['type'] == 'hauffgasse'){
                                    dataValues.push(result[index])
                                }
                            }
                        }
                        else{
                            for (var index = 0; index < result.length; index++) {
                                if(result[index]['type'] != 'hauffgasse'){
                                    dataValues.push(result[index])
                                }
                            }
                        }
                        result = dataValues;
                    }
                    var attributes = Object.keys(result[0]);
                    for (var index = 0; index < result.length; index++) {
                        let value = (result[index]['name'] != undefined) ? result[index]['name']["value"] : result[index]['id'];
                        if (index % 2 == 0) {
                            devicesHtmlEven += '<div class="form-check"> <label class="form-check-label" style="word-wrap: break-word;max-width: 100%;"> <input type="checkbox" class="form-check-input devices" name="devices" value="' + result[index]['id'] + '">' + value + '</label> </div>'
                        } else {
                            devicesHtmlOdd += '<div class="form-check"> <label class="form-check-label" style="word-wrap: break-word;max-width: 100%;"> <input type="checkbox" class="form-check-input devices" name="devices" value="' + result[index]['id'] + '">' + value + '</label> </div>'
                        }
                    }
                    var devicesHtml = devicesHtmlEven + '</div>' + devicesHtmlOdd + '</div>'
                    for (var index = 0; index < attributes.length; index++) {
                        if (attributes[index] == 'id') {} else if (index % 2 == 0) {
                            dataPointsHtmlEven += '<div class="form-check"> <label class="form-check-label" style="word-wrap: break-word;max-width: 100%;"> <input type="checkbox" class="form-check-input dataPoints" name="dataPoints" value="' + attributes[index] + '">' + attributes[index] + '</label> </div>'
                        } else {
                            dataPointsHtmlOdd += '<div class="form-check"> <label class="form-check-label" style="word-wrap: break-word;max-width: 100%;"> <input type="checkbox" class="form-check-input dataPoints" name="dataPoints" value="' + attributes[index] + '">' + attributes[index] + '</label> </div>'
                        }
                        var dataPointsHtml = dataPointsHtmlEven + '</div>' + dataPointsHtmlOdd + '</div>'
                    }
                    $("#devicesDiv").html(devicesHtml);
                    $("#dataPointsDiv").html(dataPointsHtml);
                    $("#dataHtml").show();
                },
                error: function(result) {
                    alert('Error');
                }
            });
        }
    });
    $("#dateRange").change(function() {
        var value = $(this).val()
        if (value == 'custom') {
            $("#dateDiv").show();
        } else {
            $("#dateDiv").hide();
        }
    });
});

var dtPoints = 1;
var dev = 1;

function selectDevices() {
    if (dev == 1) {
        $('input[name="devices"]').prop('checked', true);
        dev = 0;
    } else {
        $('input[name="devices"]').prop('checked', false);
        dev = 1;
    }
}

function selectDataPoints() {
    if (dtPoints == 1) {
        $('input[name="dataPoints"]').prop('checked', true);
        dtPoints = 0;
    } else {
        $('input[name="dataPoints"]').prop('checked', false);
        dtPoints = 1;
    }
}

function downloadData() {
    var dataModel = $("#dataModel").val();
    if (dataModel == '0') {
        alert('Please select data model.')
        return false;
    }
    if(dataModel == 'vienna_buildings_hauffgasse'){
        dataModel = 'vienna_buildings';
    }
    var dateRange = $("#dateRange").val();
    if (dateRange == '0') {
        alert('Please select date range.')
        return false;
    }
    var startDate = '';
    var enddate = '';
    if (dateRange == 'custom') {
        startDate = $("#startDate").val();
        if (!startDate) {
            alert('Please select start date.');
            return false;
        }
        endDate = $("#endDate").val();
        if (!endDate) {
            alert('Please select end date.');
            return false;
        }
        if (new Date(startDate) > new Date(endDate)) {
            alert("Start date should be less than end date.")
            return false;
        }
        var data = { 'fromDate': startDate, 'toDate': endDate }
    } else {
        var now = new Date();
        if (dateRange == 'Today') {
            startDate = now;
            endDate = '';
        } else if (dateRange == 'Yesterday') {
            startDate = new Date(now.getTime() - (24 * 60 * 60 * 1000));
            endDate = '';
        } else if (dateRange == 'Last Week') {
            var todaysDay = now.getDay();
            var goBack = now.getDay() % 7 + 6;
            var lastMonday = new Date().setDate(now.getDate() - goBack)
            startDate = new Date(lastMonday);
            endDate = new Date(startDate.getTime() + (6 * 24 * 60 * 60 * 1000));
        } else if (dateRange == 'Last Month') {
            var startDate = new Date();
            startDate.setDate(0);
            startDate.setDate(1);
            endDate = new Date(startDate.getTime() + (30 * 24 * 60 * 60 * 1000));

        } else if (dateRange == 'Last Seven Days') {
            startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            endDate = now;
        } else if (dateRange == 'Last Thirty Day') {
            startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
            endDate = now;
        }
        startDate = startDate.getFullYear() + '-' + ("0" + (startDate.getMonth() + 1)).slice(-2) + '-' + ("0" + startDate.getDate()).slice(-2);
        var data = { 'fromDate': startDate };
        if (endDate) {
            endDate = endDate.getFullYear() + '-' + ("0" + (endDate.getMonth() + 1)).slice(-2) + '-' + ("0" + endDate.getDate()).slice(-2);
            data['toDate'] = endDate
        }
    }
    var dataPoints = [];
    $.each($("input[name='dataPoints']:checked"), function() {
        dataPoints.push($(this).val());
    });
    if (dataPoints.length == 0) {
        alert("Select atleast one data points.")
        return false;
    }
    var devices = [];
    $.each($("input[name='devices']:checked"), function() {
        devices.push($(this).val());
    });
    if (devices.length == 0) {
        alert("Select atleast one devices.")
        return false;
    }
    var resultData = [];
    var attributes;
    for (var index = 0; index < devices.length; index++) {
        let entityIDDetail = devices[index]
        var url = './api/quantumleap/v2/entities/' + entityIDDetail
        $.ajax({
            url: url,
            headers: { "fiware-service": dataModel, "fiware-servicepath": "/" },
            type: "GET",
            data: data,
            success: function(result) {
                downloadCsv(result, entityIDDetail, dataPoints, dataModel)

            },
            error: function(xhr, status, error) {
                alert(JSON.parse(xhr.responseText)['description'] + ' Device: ' + entityIDDetail);
            }
        });
    }
}

function downloadCsv(resultdata, entityID, dataPoints, dataModel) {
    var attributes = resultdata['attributes'];
    var dateTime = resultdata['index'];
    var dataStr = 'Data Model, Device Id, Date,';
    for (var val = 0; val < attributes.length; val++) {
        if ($.inArray(attributes[val]['attrName'], dataPoints) != -1) {
            if (attributes[val]['attrName'] == 'location') {
                dataStr += 'longitude,latitude,'
            } else {
                dataStr += attributes[val]['attrName'] + ','
            }

        }
    }
    dataStr = dataStr.substring(0, dataStr.length - 1)
    dataStr += '\n'
    for (var data = 0; data < dateTime.length; data++) {
        dataStr += dataModel + ',' + entityID + ',' + dateTime[data] + ','
        for (var val = 0; val < attributes.length; val++) {
            if ($.inArray(attributes[val]['attrName'], dataPoints) != -1) {
                if (attributes[val]['attrName'] == 'location') {
                    if (attributes[val]['values'][data].hasOwnProperty("coordinates")) {
                        dataStr += attributes[val]['values'][data]['coordinates'][0] + ',' + attributes[val]['values'][data]['coordinates'][1] + ','
                    } else {
                        dataStr += ' , ,'
                    }
                } else {
                    if (dataModel == 'elogistik' && attributes[val]['attrName'] == 'value' && attributes[val]['values'][data] == '-1') {
                        dataStr += 'null,'
                    } else {
                        dataStr += attributes[val]['values'][data] + ','
                    }
                }
            }
        }
        dataStr = dataStr.substring(0, dataStr.length - 1)
        dataStr += '\n'
    }
    dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(dataStr);
    var downloadButton = document.createElement('a');
    downloadButton.setAttribute("href", dataStr);
    downloadButton.setAttribute("download", entityID + ".csv");
    document.body.appendChild(downloadButton); // required for firefox
    downloadButton.click();
    downloadButton.remove();
}