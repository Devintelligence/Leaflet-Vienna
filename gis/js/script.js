$(document).ready(function() {


    $(".login-btn").click(function() {

        var url = 'https://stp-test.wien.gv.at:4543/smarter-together-dev/auth';


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