var customLayer = {};
var customMarkerLayer = {};
var mymap = null;

let store = localforage.createInstance({
    name: 'vienna'
});

$(document).ready(function() {

    initSearchField();

    loadLayers();

    loadBaseLayer();

    initLayerAction();

    initLayerButton();


    let param = findGetParameter("t");
    if (param != null) {

        if (param == "awgr") {
            $("#list_realtime").show();
        }
        $("#" + param).trigger("click");

    }


});


function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    location.search
        .substr(1)
        .split("&")
        .forEach(function(item) {
            tmp = item.split("=");
            if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}

function initLayerButton() {
    $(".layer-link").click(function() {
        if ($(this).attr("id") == "show-layers") {
            $("#list").toggle();
            $("#list_realtime").hide();
            $(".addRealTime").removeClass("active");
        } else {
            $("#list").hide();
            $("#list_realtime").toggle();

        }

    });
}

function initLayerAction() {

    $("#list").off("click", ".addLayer").on("click", ".addLayer", function() {

        let LAYERID = $(this).attr("id");
        if (customLayer[LAYERID]) {
            mymap.removeLayer(customLayer[LAYERID]);
            mymap.removeLayer(customMarkerLayer[LAYERID]);
            customLayer[LAYERID] = null;
            customMarkerLayer[LAYERID] = null;

            $(this).removeClass("selected-layer");

        } else {

            $(this).addClass("selected-layer");
            customLayer[LAYERID] = new L.TileLayer.WMS("http://data.wien.gv.at/daten/wms", {
                layers: LAYERID,
                format: 'image/gif',
                version: '1.3.0',
                transparent: "TRUE",

            });

            mymap.addLayer(customLayer[LAYERID]);

            addWFSLayer(LAYERID);




        }
    });

    $("#list_realtime").off("click", ".addRealTime").on("click", ".addRealTime", function(e) {
        $(this).toggleClass("active");
        if ($(this).attr("id") != "awgr") {

            const settings = {
                entity: $(this).attr("id")
            }

            new ViennaData().init(mymap, null, settings);
        } else {

            $(this).find(".sub").toggle();
        }
    });



    $("#list_realtime").off("click", ".awgr").on("click", ".awgr", function(e) {

        e.stopPropagation();
        $(this).toggleClass("active");
        const settings = {
            entity: $(this).attr("class").replace("active", "").trim(),
            data: $(this).attr("data-id"),
            state: $(this).hasClass("active")
        }

        new ViennaData().init(mymap, null, settings);


    });

}




function loadBaseLayer() {
    L.Map = L.Map.extend({
            openPopup: function(popup) {
                this._popup = popup;
                return this.addLayer(popup).fire('popupopen', {
                    popup: this._popup
                });
            }
        })
        //http://www.wien.gv.at/wmts/fmzk/pastell/google3857/{z}/{y}/{x}.jpeg
    var ign = new L.tileLayer("http://www.wien.gv.at/wmts/lb2014/farbe/google3857/{z}/{y}/{x}.jpeg", {
        maxZoom: 19,
        minZoom: 11,
        attribution: ''
    });

    mymap = L.map('mapid').setView([48.199278, 16.343366], 13);

    mymap.addLayer(ign);

    //loadWienerLinien(ign);



}

function initSearchField() {
    $("#myInput").on("keyup", function() {
        var value = $(this).val().toLowerCase();
        $("#list li").filter(function() {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
        });
    });
}

function loadLayers() {
    $.getJSON("layers.json", function(data) {


        var items = [];
        $.each(data, function(key, val) {
            items.push("<li id='" + val.name + "' class='addLayer'><a href='#'>" + val.title + "</a></li>");
        });

        $("<ul/>", {
            "class": "my-new-list",
            html: items.join("")
        }).appendTo("#list");
    });
}

function addWFSLayer(LAYERID) {
    var owsrootUrl = 'https://data.wien.gv.at/daten/geo';

    var defaultParameters = {
        service: 'WFS',
        version: '1.3.0',
        request: 'GetFeature',
        typeNames: 'ogdwien:' + LAYERID,
        outputFormat: 'text/javascript',
        format_options: 'callback:getJson',
        SrsName: 'EPSG:4326'
    };

    var parameters = L.Util.extend(defaultParameters);
    var URL = owsrootUrl + L.Util.getParamString(parameters);

    customMarkerLayer[LAYERID] = null;
    var ajax = $.ajax({
        url: URL,
        dataType: 'jsonp',
        jsonpCallback: 'getJson',
        success: function(response) {
            customMarkerLayer[LAYERID] = L.geoJson(response, {
                style: function(feature) {
                    return {
                        stroke: false,
                        fillColor: 'FFFFFF',
                        fillOpacity: 0
                    };
                },
                onEachFeature: function(feature, layer) {

                    var text = "<table>";

                    $.each(feature.properties, function(i, n) {

                        if (n != null && n != 'null' && n != '' && !i.includes("_") && i != 'OBJECTID' && !i.includes('TXT')) {
                            text = text + "<tr>" + "<td>" + i + "</td><td>" + n + "</td></tr>";
                        }

                    });

                    text = text + "</table>";

                    popupOptions = {};
                    layer.bindPopup(text, popupOptions);
                }
            });

            mymap.addLayer(customMarkerLayer[LAYERID]);

            setTimeout(function() {
                mymap.fitBounds(customMarkerLayer[LAYERID].getBounds());
            }, 300);
        }
    });
}
var marker;
var first = true;

function loadWienerLinien(ign) {

    let request = new Request('/wien/api.php');
    runRequest(request, ign)

    reloader = setInterval(() => {

        runRequest(request, ign)

    }, 10000)




}

function runRequest(request, ign) {

    fetch(request)
        .then(res => res.json())
        .then(data => {
            let monitors = data.data.monitors;
            for (monitor in monitors) {
                let currentMonitor = monitors[monitor];
                let departures = currentMonitor.lines[0].departures.departure

                let departureHTML = "";
                for (departure in departures) {
                    departureHTML += "<div style='width:340px;'>Abfahrt in <b>" + departures[departure].departureTime.countdown + " Minuten </b> <br> Geplant: <b>" + moment(departures[departure].departureTime.timePlanned).format("H:mm") + " Uhr</b><br> Real: <b>" + moment(departures[departure].departureTime.timeReal).format("H:mm") + " Uhr</b></div><hr>";
                }


                if (first) {
                    marker = L.marker([currentMonitor.locationStop.geometry.coordinates[1], currentMonitor.locationStop.geometry.coordinates[0]], {
                        icon: train
                    }).addTo(mymap).bindPopup("<h3>" + currentMonitor.locationStop.properties.title + " </h3>" + departureHTML, {
                        maxWidth: 560,
                        minWidth: 550

                    }).openPopup();
                    first = false;
                } else {
                    marker._popup.setContent("<h3>" + currentMonitor.locationStop.properties.title + " </h3>" + departureHTML)
                }

            }

        })
}