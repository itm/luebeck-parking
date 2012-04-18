var serverUrl = "http://141.83.151.102:8080/json/current?callback=?",
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
	$.getJSON('http://141.83.151.102:8080/json/current?callback=?', function(data) {
    	callback(data); 
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

// get data from the server via ajax and save response in the ``data`` field
updateData(saveJSON);

$(document).bind("mobileinit", function(){
	// replace standard search in the listview filter input field
	$.mobile.listview.prototype.options.filterPlaceholder = "Suchen... ";    
});


