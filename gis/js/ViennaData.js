var rentalbike = L.icon({
    iconUrl: 'images/rentalbike.png',

    iconSize: [32, 37], // size of the icon

    popupAnchor: [-3, -36] // point from which the popup shouldh open relative to the iconAnchor
});

var viennabuildings = L.icon({
    iconUrl: 'images/vienna_buildings.png',

    iconSize: [32, 37], // size of the icon

    popupAnchor: [-3, -36] // point from which the popup should open relative to the iconAnchor
});

var logistic = L.icon({
    iconUrl: 'images/logistic.png',

    iconSize: [32, 37], // size of the icon

    popupAnchor: [-3, -36] // point from which the popup should open relative to the iconAnchor
});
if (localforage != undefined) {
    let store = localforage.createInstance({
        name: 'vienna'
    });
}
let firstStart = true;
var fg = L.featureGroup();
let ViennaData = function() {
    let basePath = "https://stp-test.wien.gv.at:4543";
    let _map = null;
    let _data = {};
    let _settings = {}
    let _historyData = [];

    let _charts = [];

    let _basePopupContent = '<div class="basePop">' +
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
            $(".selected-layer").trigger("click");

            self.getGrafanaCharts(settings);
            fg.addTo(_map)

        },

        getGrafanaCharts: function(settings) {


            if (settings.entity == "awgr") {


                if (!settings.state) {
                    self.removeGeoJsonMarkers(settings.data);
                } else {

                    $.ajax({
                        url: "./" + settings.data + ".json",
                        type: "GET",
                        success: function(result) {


                            L.geoJSON(result, {
                                pointToLayer: function(feature, latlng) {
                                    return L.marker(latlng, { icon: viennabuildings });
                                },

                                onEachFeature: function(feature, layer) {
                                    let popupContent = "";

                                    if (feature.properties && feature.properties) {

                                        let tableRows = "<table id='' class='detailTable' width='100%' >";

                                        for (var key in feature.properties) {

                                            if (key != "location" && key != "id" && key != "type" && key != "ip" && key != "__sysid__" && key != "__style" && key != "__id") {
                                                let value = (feature.properties[key] == null || feature.properties[key] == "null") ? " - " : feature.properties[key];

                                                tableRows += "<tr><td>" + key + "</td><td>" + value + "</td></tr>";
                                            }

                                        }
                                        tableRows += "</table>";
                                        popupContent += tableRows;
                                    }
                                    layer.tag = settings.data;
                                    layer.bindPopup(popupContent);
                                }
                            }).addTo(_map);

                            self.bestFitZoom();
                        }
                    })

                }
            } else {
                self.getData(settings);
            }
        },

        getData: function(settings) {





            if (!$("#" + settings.entity).hasClass("active") && !firstStart) {
                self.clearMarker(settings.entity);
                firstStart = false;
                return;
            }
            firstStart = false;


            var url = './api/contextbroker/v2/entities/?limit=200';
            $(".leaflet-marker").remove();
            $(".leaflet-marker-icon").remove();
            $(".leaflet-popup").remove();
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

                        $('[id^=chart]').hide();


                    });


                    $(document).off("click", ".chartTab").on("click", ".chartTab", function() {

                        $(".detailTable").hide();
                        $('[id^=table]').hide();

                        $('[id^=chart]').show();

                    });

                    $(document).off("click", ".tableTab").on("click", ".tableTab", function() {

                        $('[id^=table]').show();

                        $('[id^=chart]').hide();

                    });
                    if (settings.entity == "vienna_buildings" || settings.entity == "elogistik") {


                        let buildings = [];
                        for (r in result) {

                            let item = result[r];


                            let splitted = item.id.split("_");
                            if (item.id.indexOf(":") != -1) {
                                splitted = item.id.split(":");
                            }

                            if (buildings[splitted[0]] == undefined) {
                                buildings[splitted[0]] = [];
                            }
                            buildings[splitted[0]].push(item);

                        }

                        for (b in buildings) {
                            let item = buildings[b][0];
                            if (item.location != undefined && item.location.value.coordinates[0] != 0) {

                                let lat = item.location.value.coordinates[1];
                                let lng = item.location.value.coordinates[0];
                                let text = "";
                                if (b == "hauffgasse") {
                                    text = "Hauffgasse 37-47, Block1, Stiege 1-3";
                                    //   lat = item.location.value.coordinates[1];
                                    //  lng = item.location.value.coordinates[0];
                                }

                                if (b == "Enk4") {
                                    text = " Enkpl. 4";
                                }

                                if (b == "Lor54") {
                                    text = "LoryStrasse 54";
                                }

                                let popupData = self.getTabbedContent(settings.entity, buildings[b], b);

                                if (settings.entity == "elogistik") {
                                    buildings[b][0].name = {};
                                    buildings[b][0].name.value = buildings[b][0].id;
                                    popupData = self.getItemContent(settings.entity, buildings[b][0]);
                                }
                                let marker = L.marker([lat, lng], {
                                    icon: (settings.entity == "elogistik") ? logistic : new L.DivIcon({
                                        className: 'marker-vienna-icon',
                                        html: '<img class="my-div-image" src="./images/vienna_buildings.png"/>' +
                                            '<span class="leaflet-label">' + text + '</span>'
                                    })
                                }).addTo(fg).bindPopup(popupData, {
                                    maxWidth: 1000,
                                    minWidth: 1000

                                });
                                marker._id = b;

                                marker.on('click', function(e) {

                                    window.location.hash = '#chart_' + e.target._id;
                                    setTimeout(function() { getSingleChartData(settings.entity, item.id); }, 500);

                                });


                            }
                        }
                        //  if (settings.entity == "elogistik") {
                        setTimeout(function() {
                            _map.fitBounds(fg.getBounds());
                        }, 300);

                        //   }

                    } else if (settings.entity == "rentalbike") {



                        for (res in result) {

                            let item = result[res];

                            if (item.location != undefined) {


                                let lat = item.location.value.coordinates[0];
                                let lng = item.location.value.coordinates[1];
                                let text = "";
                                if (settings.entity == "rentalbike") {

                                    lat = item.location.value.coordinates[1];
                                    lng = item.location.value.coordinates[0];
                                    text = item.name.value;
                                }
                                let iconBike = new L.DivIcon({
                                    className: 'marker-vienna-icon',
                                    html: '<img class="my-div-image" src="./images/rentalbike.png"/>' +
                                        '<span class="leaflet-label">' + text + '</span>'
                                });
                                let marker = L.marker([lat, lng], {
                                    icon: (settings.entity == "rentalbike") ? iconBike : viennabuildings
                                }).addTo(fg).bindPopup(self.getItemContent(settings.entity, item), {
                                    maxWidth: 560,
                                    minWidth: 550

                                });
                                marker._id = settings.entity;
                                marker.on('click', function(e) {

                                    window.location.hash = '#chart_' + item.id;
                                    setTimeout(function() { getSingleChartData(settings.entity, item.id); }, 500);


                                });


                            }

                        }

                        setTimeout(function() {
                            _map.fitBounds(fg.getBounds());
                        }, 300);
                    }



                },
                error: function(result) {

                }
            });

        },

        clearMarker: function(id, fg) {

            var new_markers = []
            $(".leaflet-marker-icon").remove();
            _map.eachLayer(function(marker) {
                for (l in marker._layers) {
                    if (marker._layers[l]._id == id) _map.removeLayer(marker)
                }


            })
            markers = new_markers
        },

        onEachFeature: function(feature, layer) {
            let popupContent = "";

            if (feature.properties && feature.properties) {

                let tableRows = "<table id='' class='detailTable' width='100%' >";

                for (var key in feature.properties) {

                    if (key != "location" && key != "id" && key != "type" && key != "ip" && key != "__sysid__" && key != "__style" && key != "__id") {

                        let value = (feature.properties[key] == null || feature.properties[key] == "null") ? " - " : feature.properties[key];

                        tableRows += "<tr><td>" + key + "</td><td>" + value + "</td></tr>";
                    }

                }
                tableRows += "</table>";
                popupContent += tableRows;
            }
            layer.tag = feature.properties.__id;
            layer.bindPopup(popupContent);
        },


        removeGeoJsonMarkers: function(tag) {
            _map.eachLayer(function(layer) {

                if (layer.tag && layer.tag === tag) {
                    _map.removeLayer(layer)
                }

            });

        },
        bestFitZoom: function() {
            // declaring the group variable  
            var group = new L.featureGroup;

            // map._layers gives all the layers of the map including main container
            // so looping in all those layers filtering those having feature   
            $.each(_map._layers, function(ml) {

                // here we can be more specific to feature for point, line etc.            
                if (_map._layers[ml].feature) {
                    group.addLayer(this)
                }
            })

            _map.fitBounds(group.getBounds());
        },

        getTabbedContent: function(entity, result, type) {

            let links = '';

            let content = '';
            let tabs = '';

            let chart = "";




            chart = ' <canvas id="' + type + '" width="400" height="400" style="    max-width: 100%;          max-height: 100%;"></canvas>';


            let tableRows = "";

            links += '<option value="">Bitte wählen</option>';
            for (res in result) {
                if (res != 0) {
                    let item = result[res];

                    tableRows += "<table id='" + item.id.replace(":", "_") + "' class='detailTable' width='100%' style='display:none'>";
                    tableRows += "<tr><th colspan='" + (item.length - 2) + "'><h5>" + item.id + "</h5></th></tr>";
                    links += '<option value="' + item.id.replace(":", "_") + '">' + item.id + '</option>';

                    for (var key in item) {

                        if (key != "location" && key != "id" && key != "type" && key != "ip") {
                            tableRows += "<tr><td>" + key + "</td><td>" + item[key].value + "</td></tr>";
                        }

                    }
                    tableRows += "</table>";
                }
            }

            content += tableRows;
            tabs += '<li><a href="#chart_' + type + '" class="tabitem chartTab" id="">Statistik</a></li>';
            content += "<div class='tab  ' id='chart_" + type + "'  ><div  class='tabContent' style='padding:7px;margin-top:10px'>" + chart + "</div></div>";


            return _tabTemplate.replace(/%TABSLINKS%/gi, links).replace(/%MORETABS%/gi, tabs).replace(/%TABCLASS%/gi, "buildings").replace(/%TABCONTENT%/gi, content);
        },
        getItemContent: function(entity, item) {


            let tableRows = "<table>";
            let chart = "";
            let links = "";
            let content = "";


            chart = ' <canvas id="' + item.id + '" width="400" height="400" style="max-width: 100%;          max-height: 100%;"></canvas>';

            buttons = "";

            for (var key in item) {

                if (key != "location" && key != "id" && key != "type" && key != "ip") {
                    tableRows += "<tr><td>" + key + "</td><td>" + item[key].value + "</td></tr>";
                }

            }

            tableRows += "</table>";
            links += '<li><a href="#chart_' + item.id + '" class="tabitem chartTab" id="">Statistik</a></li>';
            content += "<div class='tab ' id='chart_" + item.id + "'  ><div  class='tabContent' >" + chart + "</div></div>";

            links += '<li><a href="#table_' + item.id + '" class="tabitem tableTab">Information</a></li>';
            content += "<div class='tab ' id='table_" + item.id + "'><div  class='tabContent'  >" + tableRows + "</div></div>";



            return _basePopupContent.replace(/%HEADLINE%/gi, item.name.value).replace(/%TABCLASS%/gi, "").replace(/%TABSLINKS%/gi, links).replace(/%CONTENT%/gi, content).replace(/%CHART%/gi, chart).replace(/%BUTTONS%/gi, buttons);


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