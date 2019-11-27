var rentalbike = L.icon({
    iconUrl: 'images/rentalbike.png',

    iconSize: [32, 37], // size of the icon

    popupAnchor: [-3, -36] // point from which the popup should open relative to the iconAnchor
});

var viennabuildings = L.icon({
    iconUrl: 'images/vienna_buildings.png',

    iconSize: [32, 37], // size of the icon

    popupAnchor: [-3, -36] // point from which the popup should open relative to the iconAnchor
});

let ViennaData = function() {

    let _map = null;
    let _data = {};
    let _settings = {}
    let _historyData = [];

    let _basePopupContent = '<div style="min-width:600px"' +
        '<div class="col-xs-6">' +
        '<h3>%HEADLINE%</h3>' +
        '<table width="100%">' +
        '%TABLEROWS%' +
        '</table>' +
        '</div>' +
        '<div class="col-xs-6">' +
        '%CHART%'
    '</div>' +
    '</div>';

    return {
        init: function(map, data, settings) {
            self = this;
            _map = map;
            _data = data;

            self.getData(settings);

        },

        getData: function(settings) {
            var url = 'http://moft.apinf.io:8080/contextbroker/v2/entities/';
            jQuery.ajaxPrefilter(function(options) {
                if (options.crossDomain && jQuery.support.cors) {
                    options.url = 'https://cors-anywhere.herokuapp.com/' + options.url;
                }
            });
            $.ajax({
                url: url,
                headers: { "fiware-service": settings.entity, "x-pvp-roles": "fiware(" + settings.entity + "=ql:r+cb:w)" },
                type: "GET",
                success: function(result) {

                    for (res in result) {

                        let item = result[res];

                        if (item.location != undefined) {
                            console.log(item.id);

                            let lat = item.location.value.coordinates[0];
                            let lng = item.location.value.coordinates[1];

                            if (settings.entity == "rentalbike") {

                                lat = item.location.value.coordinates[1];
                                lng = item.location.value.coordinates[0];
                            }
                            let marker = L.marker([lat, lng], {
                                icon: (settings.entity == "rentalbike") ? rentalbike : viennabuildings
                            }).addTo(_map).bindPopup(self.getItemContent(settings.entity, item), {
                                maxWidth: 560,
                                minWidth: 550

                            });
                            marker.on('click', function(e) {
                                //if (settings.entity == "rentalbike") {
                                self.buildChart(item.id, settings.entity);
                                //  }

                            });


                        }

                    }



                },
                error: function(result) {

                }
            });
        },
        getHistoryData: function(id, entity) {

            var fromDate = "2019-11-01";
            var toDate = "2019-11-29";
            var downloadType = "json";

            var data = { 'fromDate': fromDate }

            data['toDate'] = toDate;
            var url = 'http://moft.apinf.io:8080/quantumleap/v2/entities/' + id;
            $.ajax({
                url: url,
                headers: { "fiware-service": entity, "fiware-servicepath": "/", "x-pvp-roles": "fiware(" + entity + "=ql:r+cb:w)" },
                type: "GET",
                data: data,
                success: function(result) {

                    _historyData[id] = result;
                    /*  if (downloadType == 'csv') {
                          self.downloadCsv(result, id)
                      } else {
                          self.downloadJson(result, id);
                      }*/

                },
                error: function(result) {
                    //  self.downloadJson(result.responseJSON, entityID);
                }
            });
        },
        getItemContent: function(entity, item) {
            self.getHistoryData(item.id, entity);
            let tableRows = "";
            let chart = "";


            chart = '<div id="chartContainer" style="height: 300px; width: 100%;"></div>';

            for (var key in item) {

                if (key != "location" && key != "id" && key != "type" && key != "ip") {
                    tableRows += "<tr><td>" + key + "</td><td>" + item[key].value + "</td></tr>";
                }

            }


            return _basePopupContent.replace(/%HEADLINE%/gi, item.id).replace(/%TABLEROWS%/gi, tableRows).replace(/%CHART%/gi, chart);


        },

        buildChart: function(id, entity) {
            let currentData = _historyData[id];
            let valueIndex = (entity == "rentalbike") ? 1 : 2;

            let points = [];

            for (i in currentData.index) {
                let point = {}
                point.x = moment(currentData.index[i]).toDate();
                point.y = currentData.attributes[valueIndex].values[i];

                points.push(point);


            }

            var chart = new CanvasJS.Chart("chartContainer", {

                title: {
                    text: "History Data for" + id
                },
                axisX: {
                    title: "timeline",
                    gridThickness: 2
                },
                axisY: {
                    title: currentData.attributes[valueIndex].attrName
                },
                data: [{
                    type: "stepArea",
                    xValueType: "dateTime",
                    dataPoints: points
                }]
            });
            chart.render();

        },

        downloadJson: function(resultdata, entityID) {
            var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(resultdata));
            var downloadButton = document.createElement('a');
            downloadButton.setAttribute("href", dataStr);
            downloadButton.setAttribute("download", entityID + ".json");
            document.body.appendChild(downloadButton); // required for firefox
            downloadButton.click();
            downloadButton.remove();
        },

        downloadCsv: function(resultdata, entityID) {
            var attributes = resultdata['attributes'];
            var dateTime = resultdata['index'];
            var dataStr = 'Date,';
            for (var val = 0; val < attributes.length; val++) {
                dataStr += attributes[val]['attrName'] + ','
            }
            dataStr += '\n'
            for (var data = 0; data < dateTime.length; data++) {
                dataStr += dateTime[data] + ','
                for (var val = 0; val < attributes.length; val++) {
                    dataStr += attributes[val]['values'][data] + ','
                }
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

    }

}