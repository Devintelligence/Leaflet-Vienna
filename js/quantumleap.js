$(document).ready(function(){
  $(".submitButton").click(function(){
  	var entityID = $(this).closest('.entityClass').find('.entityID').val();
  	var fromDate = $(this).closest('.entityClass').find('.startDate').val();
  	var toDate = $(this).closest('.entityClass').find('.endDate').val();
  	if(!fromDate){
  		alert("Please select start date.")
  		return false;
  	}
  	var data = {'fromDate': fromDate, 'attrs': 'temperature'}
  	if(toDate){
	  	if(new Date(fromDate) > new Date(toDate)){
	  		alert("Start date should be less than end date.")
  			return false;
  		}
  		if(new Date(fromDate) != new Date(toDate)){
  			data['toDate'] = toDate
  		}
  	}
  	var url = 'http://localhost:8668/v2/entities/' + entityID
  	$.ajax({
	    url: url,
	    headers: {'Accept': 'application/json'},
	    type: "GET", 
	    data: data,
	    success: function (result) {
	    	downloadJson(result, entityID);
	    },
	    error: function (result) {
	      downloadJson(result.responseJSON, entityID);
	    }   
		}); 
  });
});

function downloadJson(resultdata, entityID) {
	var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(resultdata));
	var downloadAnchorNode = document.createElement('a');
	downloadAnchorNode.setAttribute("href",     dataStr);
	downloadAnchorNode.setAttribute("download", entityID+".json");
	document.body.appendChild(downloadAnchorNode); // required for firefox
	downloadAnchorNode.click();
	downloadAnchorNode.remove();
}
