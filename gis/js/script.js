$(document).ready(function() {


    $(".login-btn").click(function() {

        var url = './gis/auth';


        $.ajax({
            url: url,
            method: "GET",
            dataType: "json",
            // this headers section is necessary for CORS-anywhere
            headers: {
                "x-requested-with": "xhr"
            }
        }).done(function(response) {
            console.log('CORS anywhere response', response);
        }).fail(function(jqXHR, textStatus) {
            console.error(textStatus)
        })

    })

});