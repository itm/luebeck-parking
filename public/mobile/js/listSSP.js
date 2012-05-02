var sspData = undefined;


// create the list of parkings
function createSSPList() {

    // stop if we have no data
    if (typeof data === "undefined" || data === null)
        return updateData(function(d){
            data = d;
            createSSPList();
        });

    var parkings = data.parkings;

    parkings.sort(function(a,b){
        return  (a.name > b.name) ? 1 : ((a.name == b.name) ? 0 : -1);
    });

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
        createSSPList();
    }
});

$(document).delegate("#listSSP-page", "pagebeforeshow", function() {
    // enhance dynamically injected items
    $('#parkings-list').listview('refresh');
});
