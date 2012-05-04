var serverUrl = "http://smartluebeck.de/parking/json/current",
    sspURL = "http://smarthl.itm.uni-luebeck.de/ssp/",
		data = undefined,
		infoWindow = {},
		map = {};


var occupationLevels = {};


function saveJSON(d) {
	data = d;
}

function jsonError() {
	log("Couldn't get JSON from Server: 404");
}

function updateData_old(callback) {
	$.getJSON(serverUrl, function(data) {
    	callback(data); 
	});
}

function updateData(callback) {
    var data = {};
    data.cities = [];
    $.getJSON(sspURL+"be-0001/Luebeck", function(luebeckData) {
        data.parkings = convertSSPData(luebeckData);

        fillinCities(data);

            $.getJSON(sspURL+"be-0002/Santander", function(santanderData) {
            data.parkings = data.parkings.concat(convertSSPData(santanderData));
            callback(data);
        });
    });
}


function fillinCities(data){

    /* TODO: This should be done dynamically (based on data provided by SSP */
    var city = {};
    city.name = "Lübeck";
    city.geo = {};
    city.geo.lat = 53.867814;
    city.geo.lng = 10.687208;
    data.cities.push(city);

    city = {};
    city.name = "Travemünde";
    city.geo = {};
    city.geo.lat = 53.962246;
    city.geo.lng = 10.870457;
    data.cities.push(city);

    city = {};
    city.name = "Santander";
    city.geo = {};
    city.geo.lat = 43.46075;
    city.geo.lng = -3.80811;
    data.cities.push(city);
}


function calculateOccupation(parking) {
	return Math.floor((parking.free * 100) / parking.spaces);
}


function convertSSPData(sspData){

    var formattedParkings = [];


    jQuery.each(sspData, function(i, parking){

        var formattedData = {};
        var isParkingArea = false;


        formattedData.status = "closed"
        formattedData.geo = {};

        for(var p in parking){

                if (p=="http://spitfire-project.eu/cc/parkingid") {
                    formattedData.name = parking[p][0].value;
                    isParkingArea = true;
                }

                if (p =="http://www.w3.org/2003/01/geo/wgs84_pos#lat"){
                    formattedData.geo.lat = parking[p][0].value;
                }

                if (p =="http://www.w3.org/2003/01/geo/wgs84_pos#long"){
                    formattedData.geo.lng = parking[p][0].value;
                }

                if (p=="http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
                    if (parking[p][0].value == "http://spitfire-project.eu/cc/parkingIndoorArea"){
                        formattedData.kind = "PH";
                    } else if (parking[p][0].value == "http://spitfire-project.eu/cc/parkingOutdoorArea"){
                        formattedData.kind = "PP";
                    }
                }


                if (p=="http://spitfire-project.eu/cc/parkingareaStatus") {
//                    setUpOccupationLevels(parking[p][0].value,formattedData, null);
                    formattedData.status = parking[p][0].value;

                }

                // this data is not available, yet
                if (p=="http://spitfire-project.eu/cc/parkingsize") {
                    formattedData.spaces = parking[p][0].value;

                }

                if (p=="http://spitfire-project.eu/cc/parkingfreeLots") {
                    formattedData.free = parking[p][0].value;
                }

        }

        if(isParkingArea){
            formattedParkings.push(formattedData);
        }
    });

    console.log("formattedParkings:");
    console.log(formattedParkings);

    return formattedParkings;

}


function setUpOccupationLevels(url, formattedData, levelData){

    if (url.substring(0,5) =="http:"){
        console.log("Ole");
        /* The result is not fetched in time
         * TODO: Fetch the data previously and store it in a lookup table
        **/
        if (typeof levelData === "undefined" || levelData === null) {
               $.getJSON(url, function(jsonData) {
                    for(var p in jsonData){
                        var occupationLevel = jsonData[p]["http://www.loa-cnr.it/ontologies/DUL.owl#hasDataValue"][0].value;
                        formattedData.free = formattedData.spaces * occupationLevel/100;
                        console.log(formattedData.free);
                    }
                });

        }

        formattedData.status = "open"

    }
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


