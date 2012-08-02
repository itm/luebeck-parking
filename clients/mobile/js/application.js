var data = undefined,
		infoWindow = {},
		map = {};

var dataUrl = "http://kwlpls.adiwidjaja.com/data/PLC_Info.txt";

// The name of parking areas which are to be ignored
var ignoreParkingAreas = ["St. Marien", "Karstadt"];

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
	$.mobile.listview.prototype.options.filterPlaceholder = translate['search'];
});

$(document).delegate("#home", "pagebeforeshow", function() {
    // translate buttons
    toTranslate = ['btn-map', 'btn-list', 'btn-info'];
    $.each(toTranslate, function(i, el) {
        $('#'+el+' .ui-btn-text').html(translate[el]);
    });
});


function updateData(callback) {


    if (jQuery.browser.msie) {
        //Use Microsoft XDR
        var xdr = new XDomainRequest();
        xdr.timeout = 1000;
        xdr.open("get", dataUrl);
        xdr.onload = function () {
            callback(convertData(xdr.responseText));
        };
        xdr.onerror = function() {
            log("Couldn't get data from Server '"+dataUrl+"':"+xdr.responseText);
        };
        xdr.send();

    } else {

        $.ajax({
            type: "GET",
            url: dataUrl,
            dataType: "text",
            error: function(){
                log("Couldn't get data from Server '"+dataUrl+"': 404");
            },
            success: function(allText) {
                callback(convertData(allText));
            }
        });
    }
}

function convertData(allText){

    /** Parse the csv file and create an array of parking areas*/
    var allTextLines = allText.split(/\r\n|\n/);
    var headers = allTextLines[3].split(',');
    var lines = [];

    for (var i=0; i<allTextLines.length; i++) {
        var data = allTextLines[i].split(',');
        var tarr = [];

        // Some covered parking areas feature two additional opening and closing times.
        if (data.length == headers.length || data.length == headers.length+2) {
            for (var j=0; j<headers.length; j++) {
                tarr.push(jQuery.trim(data[j]));
            }
            if (data.length  == headers.length+2) {
                tarr[headers.length-2] = jQuery.trim(data[headers.length]);
                tarr[headers.length-1] = jQuery.trim(data[headers.length+1]);
            }
            lines.push(tarr);
        }
    }


    var tmpcities = [];

    /** Create parking objects from the information provided in the recently
     * created array.
     */
    var cities = [];
    var parkings = [];

    $.each(lines, function(j, line) {
        // The header is not to be added
        if (line[0] != "PHName"){

            if (jQuery.inArray(line[0].substring(3),ignoreParkingAreas) == -1){

                var parking = {};
                parking.kind = line[0].substring(0, 2);;
                parking.name = line[0].substring(3);
                parking.status = line[1] == "1" ? "open" : "closed";
                parking.spaces = line[2];
                parking.free = line[3];
                parking.openingHours = {};
                parking.openingHours.begin = line[4];
                parking.openingHours.end = line[5];
                parking.geo = geo.parkings[parking.name];

                // If the city was processed for the first time, add it to a separate array.
                // This might be used to split the list into different parts for the various cities.
                if (jQuery.inArray(parking.geo.city,tmpcities) == -1){
                    var tmpCity = {};
                    tmpCity.name = parking.geo.city;
                    tmpCity.geo = geo.cities[tmpCity.name];
                    cities.push(tmpCity);

                    tmpcities.push(tmpCity.name);
                }
                parkings.push(parking);
            }
        }
    });

    return {"cities":cities, "parkings":parkings};
}



