$(document).ready(function() {
    function getCarData() {
        return $.ajax({
            type: 'GET',
            url: "./api/contextbroker/v2/entities",
            headers: { "fiware-service": "carusoreservationhistory" },
            cache: false
        });
    }

    function renderCalendar(entities) {
        $('#calendar').html("");
        var calendarEl = document.getElementById('calendar');
        var calendar = new FullCalendar.Calendar(calendarEl, {
            plugins: ['interaction', 'dayGrid', 'timeGrid'],
            // defaultDate: '2018-12-01', // don't pass, if you want today as current data
            editable: true,
            locale: 'de',
            eventLimit: true, // allow "more" link when too many events
            header: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek,dayGridDay'
            },

            // defaultView: 'listYear',
            events: entities,
        });
        calendar.render();
    }

    var request = getCarData();
    var entities = [];

    request.done(function(data) {
        var _unique = []
        html = '<option value="0">Fahrzeug Id</option>'
        for (var _i = 0; _i < data.length; _i++) {
            var val = data[_i].vehicle_id.value
            if (jQuery.inArray(val, _unique) == -1) {
                _unique.push(val);
                html += '<option value="ReservationHistory:' + val + '">' + val + '</option>'
            }
        };
        $("#vehicleId").html(html)
    });

    $("#vehicleId").change(function() {
        var value = $(this).val();
        if(value == '0'){
            renderCalendar(entities);
            return false;
        }
        var url = './api/quantumleap/v2/entities/' + value
        $.ajax({
            url: url,
            headers: { "fiware-service": 'carusoreservationhistory', "fiware-servicepath": "/" },
            type: "GET", 
            success: function (resultdata) {
                var attributes = resultdata['attributes'];
                var vechile_data = {};
                for (var data = 0; data < attributes.length; data++) {
                    vechile_data[attributes[data]['attrName']] = attributes[data]['values']
                }

                var vehicle_entities = []
                for (var data = 0; data < attributes[0]['values'].length; data++) {
                    var color = 'red';
                    if (vechile_data.state[data] == 'opened'){
                        color = 'green';
                    }
                    else if (vechile_data.state[data] == 'protected'){
                        color = 'orange';
                    }

                    var title = "\nFahrzeug ID: " + vechile_data.vehicle_id[data] +
                    "\nEntfernung: " + vechile_data.distance[data] +
                    "\nNutzungsstart: "+ vechile_data.batterylevel_at_start[data] +
                    "\nNutzungsende: "+ vechile_data.batterylevel_at_end[data]     ;

                    vehicle_entities.push({
                        'title': title,
                        'start': vechile_data.reservation_start[data],
                        'backgroundColor': color,
                    });
                }
                renderCalendar(vehicle_entities);
            },
            error: function (result) {
              alert('Error:' + result)
            }   
        }); 
    });
    renderCalendar(entities);
});