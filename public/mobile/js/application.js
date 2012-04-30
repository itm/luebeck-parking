var serverUrl = "http://smartluebeck.de/parking/json/current",
		data = undefined,
		infoWindow = {},
		map = {};

function saveJSON(d) {
	data = d;
}

function jsonError() {
	log("Couldn't get JSON from Server: 404");
}

function updateData(callback) {
	$.getJSON(serverUrl, function(data) {
    	callback(data); 
	});
}

function updateSSPData(callback){
    console.log("updateSSPData");

    $.getJSON("http://dialyse:8080/be-0001/Luebeck", function(data) {
        callback(data);
        console.log(data);
    });
}

function calculateOccupation(parking) {
	return Math.floor((parking.free * 100) / parking.spaces);
}

// logging helper method (won't show an error if ``console.log()`` is not available)
function log(text) {
	console && console.log &&
	console.log(text);
}

// ### start of application code

$(document).bind("mobileinit", function(){
	// replace standard search in the listview filter input field
	$.mobile.listview.prototype.options.filterPlaceholder = "Suchen... ";    
});


