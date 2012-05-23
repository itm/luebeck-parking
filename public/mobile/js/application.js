var data = undefined,
    infoWindow = {},
    map = {};


var occupationLevels = {};


function saveJSON(d) {
	data = d;
}

function jsonError() {
	log("Couldn't get JSON from Server: 404");
}



function updateData(callback, sourceIndex, data){

    if (sourceIndex === undefined){
        sourceIndex = 0;
    }

    if (data === undefined){
        var data = {};
        data.cities = [];
        data.parkings = [];
        data.individualLots = [];
    }

    var callbacktimeout = 2000;


    jQuery.ajax( {
        url:datasources[sourceIndex],
        dataType:'json',
        timeout: callbacktimeout,
        success:
            function(sspData) {
                data.parkings = data.parkings.concat(convertSSPData(sspData).areas);
                data.individualLots = data.parkings.concat(convertSSPData(sspData).lots);

                for( var index in cities[sourceIndex]){
                    data.cities.push(cities[sourceIndex][index]);
                }
            },
        complete:
            function() {
                if (sourceIndex === datasources.length-1){
                    callback(data);
                }else{
                    console.log(sourceIndex);
                    updateData(callback, sourceIndex+1, data);
                }
            }

    });
}

function calculateOccupation(parking) {
	return Math.floor((parking.free * 100) / parking.spaces);
}


function convertSSPData(sspData){

    var formattedAreas = [];
    var formattedLots = [];
    var parkingInformation = {};
    parkingInformation.areas = formattedAreas;
    parkingInformation.lots = formattedLots;


    jQuery.each(sspData, function(i, parking){

        var typeObject = parking["http://www.w3.org/1999/02/22-rdf-syntax-ns#type"];

        if (typeObject !== undefined){

            var parkingType = (typeObject[0].value);

            if (parkingType === "http://spitfire-project.eu/cc/parkingOutdoorArea"
                        || parkingType === "http://spitfire-project.eu/cc/parkingIndoorArea"){

                formattedAreas.push(getParkingArea(parking));

            } else if (parkingType === "http://spitfire-project.eu/cc/parkingUncoveredLot"
                        || parkingType === "http://spitfire-project.eu/cc/CoveredLot"
                        || parkingType === "http://spitfire-project.eu/cc/CarLot"
                        || parkingType === "http://spitfire-project.eu/cc/MotorcycleLot"
                        || parkingType === "http://spitfire-project.eu/cc/BookableLot"){

                formattedLots.push(getSingleParkingSpace(parking));

            } else{
                console.log("The provided data is no recognized parking area or parking lot.")
            }

        }
    });
    return parkingInformation;
}


function getParkingArea(parking){

    var formattedData = {};
    formattedData.geo = {};
    formattedData.type = "parkingArea"
    formattedData.status = "closed"

    var object = parking["http://spitfire-project.eu/cc/parkingid"];
    if (object !== undefined){
        formattedData.name = object[0].value;
    }

    if ((object = parking["http://www.w3.org/2003/01/geo/wgs84_pos#lat"]) !== undefined){
        formattedData.geo.lat = object[0].value;
    }

    if ((object = parking["http://www.w3.org/2003/01/geo/wgs84_pos#long"]) !== undefined){
        formattedData.geo.lng = object[0].value;
    }

    if ((object = parking["http://www.w3.org/2003/01/geo/wgs84_pos#location"]) !== undefined){
        formattedData.city = object[0].value;
    }

    if ((object = parking["http://spitfire-project.eu/cc/parkingareaStatus"]) !== undefined){
        formattedData.status = object[0].value;
    }

    if ((object = parking["http://spitfire-project.eu/cc/parkingsize"]) !== undefined){
        formattedData.spaces = object[0].value;
    }

    if ((object = parking["http://spitfire-project.eu/cc/parkingfreeLots"]) !== undefined){
        formattedData.free = object[0].value;
    }

    if ((object = parking["http://www.w3.org/1999/02/22-rdf-syntax-ns#type"]) !== undefined){
        if (object[0].value == "http://spitfire-project.eu/cc/parkingIndoorArea"){
            formattedData.kind = "PH"
        } else if (object[0].value == "http://spitfire-project.eu/cc/parkingOutdoorArea"){
            formattedData.kind = "PP";
        }
    }

    return formattedData
}


/**
 * Converts a single parking space described by the SPITFIRE parking ontology to an internal representation used
 * later on to fill in the map and the list
 * @param parking
 *      A single parking space described by the SPITFIRE parking ontology
 * @return {Object}
 *      The internal representation of a single parking space
 */
function getSingleParkingSpace(parking){

    var formattedData = {};
    formattedData.geo = {};
    formattedData.type = "parkingLot"
    formattedData.spaces = 1;

    formattedData.handicapped = false;
    formattedData.status = "occupied"

    var object = parking["http://spitfire-project.eu/cc/parkingid"];
    if (object !== undefined){
        formattedData.name = object[0].value;
    }

    if ((object = parking["http://www.w3.org/2003/01/geo/wgs84_pos#lat"]) !== undefined){
        formattedData.geo.lat = object[0].value;
    }

    if ((object = parking["http://www.w3.org/2003/01/geo/wgs84_pos#long"]) !== undefined){
        formattedData.geo.lng = object[0].value;
    }

    if ((object = parking["http://www.w3.org/2003/01/geo/wgs84_pos#location"]) !== undefined){
        formattedData.city = object[0].value;
    }

    if ((object = parking["http://www.w3.org/1999/02/22-rdf-syntax-ns#type"]) !== undefined){
        if (object[0].value == "http://spitfire-project.eu/cc/parkingCoveredLot"){
            formattedData.kind = "PH"
        } else if (object[0].value == "http://spitfire-project.eu/cc/parkingUncoveredLot"){
            formattedData.kind = "PP";
        }
    }

    if ((object = parking["http://spitfire-project.eu/cc/parkingstatus"]) !== undefined){

        for (statusValue in object) {

            var status = object[statusValue].value;
            if (status == "http://spitfire-project.eu/cc/parkingAvailableLot"){
                formattedData.status = "free"
                formattedData.free = 1;
            } else if (status == "http://spitfire-project.eu/cc/parkingUnavailableLot"){
                formattedData.status = "occupied"
                formattedData.free = 0;
            } else if (status == "http://spitfire-project.eu/cc/parkingReservedLot"){
                formattedData.handicapped = true;
            }
        }
    }

    return formattedData;
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
