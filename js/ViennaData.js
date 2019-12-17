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
    let basePath = "https://stp-test.wien.gv.at:4543";
    let _map = null;
    let _data = {};
    let _settings = {}
    let _historyData = [];
    let firstStart = true;
    let _charts = [];

    let _basePopupContent = '<div style="min-width:600px">' +
        '<div class="col-xs-12">' +
        '<h3>%HEADLINE%</h3>' +
        '<div id="tabs">' +
        '<ul>' +
        '%TABSLINKS%' +
        '</ul>' +
        '%CONTENT%' +

        '</div>' +
        '</div>' +

        '</div>';

    let _tabTemplate = '<div id="tabs" >' +
        '<ul>' +
        '%MORETABS%' +
        '<li style="width:auto">' +
        '<select class="switcher">' +
        '%TABSLINKS%' +
        '</select>' +
        '</li>' +
        '</ul>' +
        '%TABCONTENT%' +
        '</div>';

    return {
        init: function(map, data, settings) {
            self = this;
            _map = map;
            _data = data;
            self.getGrafanaCharts(settings);


        },

        getGrafanaCharts: function(settings) {
            var url = 'http://moft.apinf.io:8080/grafana/api/search?folderIds=0&query=&starred=false';

            jQuery.ajaxPrefilter(function(options) {
                if (options.crossDomain && jQuery.support.cors) {
                    options.url = 'https://cors-anywhere.herokuapp.com/' + options.url;
                }
            });
            $.ajax({
                url: url,
                type: "GET",
                dataType: "json",
                success: function(result) {
                    for (r in result) {
                        if (_charts[result[r]["title"]] == undefined) {
                            _charts[result[r]["title"]] = [];
                        }

                        result[r].url = result[r].url.replace("/d/", "/d-solo/");

                        _charts[result[r]["title"]] = result[r];
                    }
                    console.log(_charts);
                    self.getData(settings);
                }

            });
        },

        getData: function(settings) {
            var url = 'http://moft.apinf.io:8080/contextbroker/v2/entities/?limit=200';
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

                    $(document).off("click", ".tabMainLink").on("click", ".tabMainLink", function() {

                        $(".tabsMain").hide();
                        $(".tabsMain" + $(this).attr("href")).show();

                        if (window.location.hash) {
                            window.location.hash;
                        } else {
                            window.location.hash = '#chart';
                        };
                    });

                    $(document).on("change", ".switcher", function() {

                        $(".detailTable").hide();

                        $("#" + $(this).val()).show();

                        $("#chart_undefined").hide();
                    });


                    $(document).off("click", ".chartTab").on("click", ".chartTab", function() {

                        $(".detailTable").hide();


                        $("#chart_undefined").show();
                    });
                    if (settings.entity == "vienna_buildings") {


                        let buildings = [];
                        for (r in result) {

                            let item = result[r];
                            let splitted = item.id.split("_");
                            if (buildings[splitted[0]] == undefined) {
                                buildings[splitted[0]] = [];
                            }
                            buildings[splitted[0]].push(item);

                        }

                        for (b in buildings) {
                            let item = buildings[b][0];
                            if (item.location != undefined) {


                                let lat = item.location.value.coordinates[0];
                                let lng = item.location.value.coordinates[1];

                                let marker = L.marker([lat, lng], {
                                    icon: (settings.entity == "rentalbike") ? rentalbike : viennabuildings
                                }).addTo(_map).bindPopup(self.getTabbedContent(settings.entity, buildings[b], b), {
                                    maxWidth: 1000,
                                    minWidth: 1000

                                });
                                marker.on('click', function(e) {
                                    if (window.location.hash) {
                                        window.location.hash;
                                    } else {
                                        window.location.hash = '#chart_undefined';
                                    };
                                });


                            }
                        }

                    } else {



                        for (res in result) {

                            let item = result[res];

                            if (item.location != undefined) {


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
                                    if (window.location.hash) {
                                        window.location.hash;
                                    } else {
                                        window.location.hash = '#chart';
                                    };

                                });


                            }

                        }
                    }



                },
                error: function(result) {

                }
            });
        },
        getHistoryData: function(id, entity, downloadType = "json") {


            // if (firstStart) {

            firstStart = false;
            var fromDate = "2019-11-01";
            var toDate = "2029-11-29";

            var data = { 'fromDate': fromDate }

            data['toDate'] = toDate;
            var url = 'http://moft.apinf.io:8080/quantumleap/v2/entities/' + id;
            $.ajax({
                url: url,
                headers: { "fiware-service": entity, "fiware-servicepath": "/", "x-pvp-roles": "fiware(" + entity + "=ql:r+cb:w)" },
                type: "GET",
                data: data,
                success: function(result) {

                    store.setItem("quantum_" + id, JSON.stringify(result), function() {
                        _historyData[id] = result;
                    });


                    if (downloadType == 'csv') {
                        self.downloadCsv(result, id)
                    } else {
                        self.downloadJson(result, id);
                    }

                },
                error: function(result) {
                    //  self.downloadJson(result.responseJSON, entityID);
                }
            });
            //  }

        },

        getTabbedContent: function(entity, result, type) {

            let links = '';

            let content = '';
            let tabs = '';

            let chart = "<h6>Um die historischen Daten herunter zuladen, wechseln Sie bitte zu den Statistiken</h6>";


            if (_charts[type] != undefined) {

                chart += '<iframe src="https://stp-test.wien.gv.at:4543' + _charts[type].url + '?theme=light&panelId=2" width="600" height="450" frameborder="0"></iframe>';

            } else {
                chart = "";
            }


            let tableRows = "";


            for (res in result) {
                if (res != 0) {
                    let item = result[res];

                    tableRows += "<table id='" + item.id + "' class='detailTable' width='100%' style='display:none'>";
                    tableRows += "<tr><th colspan='" + (item.length - 2) + "'><h5>" + item.id + "</h5></th></tr>";
                    links += '<option value="' + item.id + '">' + item.id + '</option>';

                    for (var key in item) {

                        if (key != "location" && key != "id" && key != "type" && key != "ip") {
                            tableRows += "<tr><td>" + key + "</td><td>" + item[key].value + "</td></tr>";
                        }

                    }
                    tableRows += "</table>";
                }
            }

            content += tableRows;
            tabs += '<li><a href="#chart_' + entity.id + '" class="tabitem chartTab" id="">Statistik</a></li>';
            content += "<div class='tab ' id='chart_" + entity.id + "'  ><div  class='tabContent' style='padding:5px;'>" + chart + "</div></div>";
            return _tabTemplate.replace(/%TABSLINKS%/gi, links).replace(/%MORETABS%/gi, tabs).replace(/%TABCLASS%/gi, "buildings").replace(/%TABCONTENT%/gi, content);
        },
        getItemContent: function(entity, item) {


            let tableRows = "<table>";
            let chart = "<h6>Um die historischen Daten herunter zuladen, wechseln Sie bitte zu den Statistiken</h6>";
            let links = "";
            let content = "";


            chart += '<iframe src="https://stp-test.wien.gv.at:4543' + _charts[item.id].url + '?theme=light&panelId=2" width="600" height="450" frameborder="0"></iframe>';


            buttons = "";

            for (var key in item) {

                if (key != "location" && key != "id" && key != "type" && key != "ip") {
                    tableRows += "<tr><td>" + key + "</td><td>" + item[key].value + "</td></tr>";
                }

            }

            tableRows += "</table>";
            links += '<li><a href="#chart_' + item.id + '" class="tabitem chartTab" id="">Statistik</a></li>';
            content += "<div class='tab ' id='chart_" + item.id + "'  ><div  class='tabContent' >" + chart + "</div></div>";

            links += '<li><a href="#table_' + item.id + '" class="tabitem">Information</a></li>';
            content += "<div class='tab ' id='table_" + item.id + "'><div  class='tabContent'  >" + tableRows + "</div></div>";



            return _basePopupContent.replace(/%HEADLINE%/gi, item.id).replace(/%TABCLASS%/gi, "").replace(/%TABSLINKS%/gi, links).replace(/%CONTENT%/gi, content).replace(/%CHART%/gi, chart).replace(/%BUTTONS%/gi, buttons);


        },

        buildChart: function(id, entity) {

            store.getItem("quantum_" + id, function(err, result) {
                let currentData = JSON.parse(result);
                let valueIndex = (entity == "rentalbike") ? 1 : 2;

                let points = [];

                for (i in currentData.index) {
                    let point = {}
                    point.x = moment(currentData.index[i]).toDate();
                    point.y = currentData.attributes[valueIndex].values[i];

                    points.push(point);


                }

                var chart = new CanvasJS.Chart("chartContainer" + id.replace(/_/gi, ""), {

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

            });

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