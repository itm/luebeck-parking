var serverUrl = "http://141.83.151.102:8080/json/current",
//var serverURL = "http://localhost:8080/json/current",
		data = {},
		infoWindow = {},
		map = {};

function saveJSON(d) {
	data = d;
}

function jsonError() {
	log("Couldn't get JSON from Server: 404");
}

function updateData(callback) {
	$.ajax({
		  url: serverUrl,
		  method:"GET",
		  dataType:"json",
		  success:callback,
		  statusCode:{
		      404:jsonError
		  }
	});
}

function calculateOccupation(parking) {
	return Math.floor((parking.free * 100) / parking.spaces);
}

function log(text) {
	console && console.log &&
	console.log(text);
}

/* -- start of application code -- */

updateData(saveJSON);

$(document).bind("mobileinit", function(){
	// replace standard search in the listview filter input field
	$.mobile.listview.prototype.options.filterPlaceholder = "Suchen... ";    
});

