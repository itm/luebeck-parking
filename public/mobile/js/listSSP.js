var sspData = undefined;


// create the list of parkings
function createList() {
    // stop if we have no data
    if (typeof data === "undefined" || data === null)
        return updateData(function(d){
            data = d;
            createList();
        });
    if (typeof sspData === "undefined" || sspData === null)
        return updateSSPData(function(d){
            sspData = d;
            createList();
        });


    var formattedParkings = [];


    jQuery.each(sspData, function(i, parking){
      console.log(i);
      console.log(parking);

        var formattedData = {};
        var isParkingArea = false;

        for(var p in parking){
            if(parking.hasOwnProperty(p)){
                console.log(p+'='+parking[p][0].value);
                if (p=="http://spitfire-project.eu/cc/parkingid") {
                    formattedData.name = parking[p][0].value;
                    isParkingArea = true;
                }

                if (p=="http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
                    if (parking[p][0].value == "http://spitfire-project.eu/cc/parkingIndoorArea"){
                       formattedData.kind = "PH";
                    } else if (parking[p][0].value == "http://spitfire-project.eu/cc/parkingOutdoorArea"){
                        formattedData.kind = "PP";
                    }
                }

                if (p=="http://spitfire-project.eu/cc/parkingareaStatus") {
                    console.log("kkkkkkkkkkkkkkkkkkkkkkkkkkkk "+parking[p][0].value);
                }
                formattedData.spaces = 100;
                formattedData.free = 20;
                formattedData.status = "open"
            }
        }
        if(isParkingArea){
            formattedParkings.push(formattedData);
        }
        console.log("\r\n----------\r\n");
    });

    var parkings = formattedParkings;
    // iterate over available parkings to create info markup
    $.each(parkings, function(i, parking) {
        if (parking.status == "open") {



            $('#parkings-list').append('<li><a href="#">'
                + '<p>'+parking.kind+' <strong>'+parking.name+'</strong></p>'
                + '<p class="park-stats">'+parking.free+' von '+parking.spaces+' frei</p>'
                + '<div class="free"><div class="occupied" style="width: '
                + calculateOccupation(parking)
                + '%;"></div></div>'
                + '</a></li>');
        } else {
            $('#parkings-list').append('<li><a href="#">'
                + '<p>'+parking.kind+' <strong>'+parking.name+'</strong></p>'
                + '<p>GESCHLOSSEN</p>'
                + '</a></li>');
        }
        // click handler for list items opens the map and shows the corresponding infoWindow
        $('#parkings-list a:last').bind('click', function() {
            showInfoOnLoad(parking);
            $.mobile.changePage('map.html');
        });
    });
}

// dynamically created dom needs to be inserted here
$(document).bind("pagebeforechange", function(e, d) {
    if ( d && d.toPage && $(d.toPage).attr('id') == 'listSSP-page' ) {
        data = null;
        $('#parkings-list').empty();
        createList();
    }
});

$(document).delegate("#listSSP-page", "pagebeforeshow", function() {
    // enhance dynamically injected items
    $('#parkings-list').listview('refresh');
});
