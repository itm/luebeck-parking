var serverUrl = "http://smartluebeck.de/parking/json/current",
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


function convertSSPData(sspData){

    var formattedParkings = [];


    jQuery.each(sspData, function(i, parking){
//        console.log(i);
//        console.log(parking);

        var formattedData = {};
        var isParkingArea = false;


        formattedData.status = "closed"
        formattedData.geo = {};

        for(var p in parking){
            if(parking.hasOwnProperty(p)){

                if (p=="http://spitfire-project.eu/cc/parkingid") {
                    formattedData.name = parking[p][0].value;
                    isParkingArea = true;
//                    console.log(p+'='+parking[p][0].value);
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
                    setUpOccupationLevels(parking[p][0].value,formattedData, null);

                }

                // this data is not available, yet
                formattedData.spaces = 100;


//                formattedData.free = 20;
            }
        }
        if(isParkingArea){
            formattedParkings.push(formattedData);
        }
//        console.log("\r\n----------\r\n");
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
                    console.log("llllllllllllllllllllllllllllllllllllllllll");
                    for(var p in jsonData){
                        var occupationLevel = jsonData[p]["http://www.loa-cnr.it/ontologies/DUL.owl#hasDataValue"][0].value;
                        formattedData.free = formattedData.spaces * occupationLevel/100;
                        console.log(formattedData.free);
                    }
                });

        }

        // TODO: Remove when the lookup table is in place (see above)
        formattedData.free = formattedData.spaces-url.substring(33,url.length);


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


