$(document).ready(function(){
    var url = 'http://localhost:1026/v2/entities'
    $.ajax({
        url: url,
        type: "GET", 
        success: function (result) {
            console.log(result)
        },
        error: function (result) {
	       console.log(result)
        }   
    }); 
});