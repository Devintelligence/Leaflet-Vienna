$(document).ready(function(){
    function getCarData() {
        return $.ajax({
            type: 'GET',
            url: "./api/contextbroker/v2/entities",
            headers: {"fiware-service":"carusoreservationhistory"},
            cache: false
        });
    }
    function renderCalendar(entities) {
        $('#calendar').html("");
        var calendarEl = document.getElementById('calendar');
        var calendar = new FullCalendar.Calendar(calendarEl, {
            plugins: [ 'interaction', 'dayGrid', 'timeGrid'],
            // defaultDate: '2018-12-01', // don't pass, if you want today as current data
            editable: true,
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
        html = '<option value="0">Vehicle Id</option>'
        for (var _i = 0; _i < data.length; _i++) {
            var val = data[_i].vehicle_id.value
            if (jQuery.inArray(val, _unique) == -1) {
                _unique.push(val);
                html += '<option value="' + val + '">' + val + '</option>'
            }
        };
        $("#vehicleId").html(html)
    });

    $("#vehicleId").change(function() {
        var value = $(this).val()
        var request = getCarData();
        request.done(function(data) {
            vehical_entities = []
            for (var _i = 0; _i < data.length; _i++) {
                if (data[_i].vehicle_id.value == parseInt(value)) {
                    vehical_entities.push({
                        'title': ''.concat("\nVehicle ID: ", data[_i].vehicle_id.value,
                                           "\nDistance: ", data[_i].distance.value,
                                           "\nUtilization Start: ", data[_i].batterylevel_at_start.value,
                                           "\nUtilization End: ", data[_i].batterylevel_at_end.value,
                                           ),
                        'start': data[_i].reservation_start.value,
                    });
                }
            }
            renderCalendar(vehical_entities);
        });

    });
    renderCalendar(entities);
});