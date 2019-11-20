$(document).ready(function(){
	$(".submitButton").click(function(){
		var entityID = $(this).closest('.entityClass').find('.entityID').val();
		var fromDate = $(this).closest('.entityClass').find('.startDate').val();
		var toDate = $(this).closest('.entityClass').find('.endDate').val();
		var downloadType = $("input[name='"+entityID+"']:checked").val();
		if(!fromDate){
			alert("Please select start date.")
			return false;
		}
		var data = {'fromDate': fromDate}
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
				if(downloadType == 'csv'){
					downloadCsv(result, entityID)
				}
				else{
					downloadJson(result, entityID);	
				}
				
			},
			error: function (result) {
		  		downloadJson(result.responseJSON, entityID);
			}   
		}); 
	});
});

function downloadJson(resultdata, entityID) {
	var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(resultdata));
	var downloadButton = document.createElement('a');
	downloadButton.setAttribute("href", dataStr);
	downloadButton.setAttribute("download", entityID+".json");
	document.body.appendChild(downloadButton); // required for firefox
	downloadButton.click();
	downloadButton.remove();
}

function downloadCsv(resultdata, entityID) {
	var attributes = resultdata['attributes'];
	var dateTime = resultdata['index'];
	var dataStr = 'Date,';
	for (var val = 0; val < attributes.length; val++){
		dataStr += attributes[val]['attrName'] + ','
	}
	dataStr += '\n'
	for (var data = 0; data < dateTime.length; data++){
		dataStr += dateTime[data] + ','
		for (var val = 0; val < attributes.length; val++){
			dataStr += attributes[val]['values'][data] + ','
		}
		dataStr += '\n'
	}
	dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(dataStr);
	var downloadButton = document.createElement('a');
	downloadButton.setAttribute("href",     dataStr);
	downloadButton.setAttribute("download", entityID+".csv");
	document.body.appendChild(downloadButton); // required for firefox
	downloadButton.click();
	downloadButton.remove();
}
