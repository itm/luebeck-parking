var sspURL = "http://smarthl.itm.uni-luebeck.de/ssp/",
		data = undefined,
        individualLots = undefined,
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
    var data = {};
    data.cities = [];
    individualLots = [];
    $.getJSON(sspURL+"be-0001/Luebeck", function(luebeckData) {
        data.parkings = convertSSPData(luebeckData);

        fillinCities(data);

        $.getJSON(sspURL+"be-0002/Santander", function(santanderData) {
            data.parkings = data.parkings.concat(convertSSPData(santanderData));

            $.getJSON(sspURL+"be-0002/SantanderParkingSpaces", function(santanderData) {
                individualLots = (convertIndividualLotData(santanderData));
                callback(data);
            });

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

                if (p=="http://www.w3.org/2003/01/geo/wgs84_pos#location"){
                    formattedData.city = parking[p][0].value;
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
            formattedData.type = "parkingArea"
            formattedParkings.push(formattedData);
        }
    });

    console.log("formattedParkings:");
    console.log(formattedParkings);

    return formattedParkings;

}


function convertIndividualLotData(sspData){

    var formattedLots = [];

    jQuery.each(sspData, function(i, parking){

        var formattedLot = {};

        formattedLot.handicapped = false;
        formattedLot.status = "occupied"
        formattedLot.geo = {};
        formattedLot.spaces = 1;
        formattedLot.type = "parkingLot"

        for(var p in parking){

            if (p=="http://spitfire-project.eu/cc/parkingid") {
                formattedLot.name = parking[p][0].value;
                isParkingArea = true;
            }

            if (p =="http://www.w3.org/2003/01/geo/wgs84_pos#lat"){
                formattedLot.geo.lat = parking[p][0].value;
            }

            if (p =="http://www.w3.org/2003/01/geo/wgs84_pos#long"){
                formattedLot.geo.lng = parking[p][0].value;
            }

            if (p=="http://www.w3.org/2003/01/geo/wgs84_pos#location"){
                formattedLot.city = parking[p][0].value;
            }

            if (p=="http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
                if (parking[p][0].value == "http://spitfire-project.eu/cc/parkingCoveredLot"){
                    formattedLot.kind = "PH";
                } else if (parking[p][0].value == "http://spitfire-project.eu/cc/parkingUncoveredLot") {
                    formattedLot.kind = "PP";
                }
            }


            if (p=="http://spitfire-project.eu/cc/parkingstatus") {
                for (statusValue in parking[p]) {

                    var status = parking[p][statusValue].value;
                    if (status == "http://spitfire-project.eu/cc/parkingAvailableLot"){
                        formattedLot.status = "free"
                        formattedLot.free = 1;
                    } else if (status == "http://spitfire-project.eu/cc/parkingUnavailableLot"){
                        formattedLot.status = "occupied"
                        formattedLot.free = 0;
                    } else if (status == "http://spitfire-project.eu/cc/parkingReservedLot"){
                        formattedLot.handicapped = true;
                    }
                }
            }

        }
        formattedLots.push(formattedLot);
    });

    return formattedLots;

}



function setUpOccupationLevels(url, formattedData, levelData){

    if (url.substring(0,5) =="http:"){
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
	$.mobile.listview.prototype.options.filterPlaceholder = translate['search'];
});

$(document).delegate("#home", "pagebeforeshow", function() {
    // translate buttons
    toTranslate = ['btn-map', 'btn-list', 'btn-info'];
    $.each(toTranslate, function(i, el) {
        $('#'+el+' .ui-btn-text').html(translate[el]);
    });
});
