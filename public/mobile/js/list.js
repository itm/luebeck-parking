
// create the list of parkings
function createList() {


	// stop if we have no data
	if (typeof data === "undefined" || data === null)
		return updateData(function(d){
			data = d;
			createList();
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
		     	+ '<p>'+translate['closed']+'</p>'
		     	+ '</a></li>');
		}
		// click handler for list items opens the map and shows the corresponding infoWindow
		$('#parkings-list a:last').bind('click', function() {
			showInfoOnLoad(parking);
			$.mobile.changePage('map.html');
		});

		// enhance dynamically injected items
		$('#parkings-list').listview('refresh');
	});
}

// dynamically created dom needs to be inserted here
$(document).bind("pagebeforechange", function(e, d) {
	if ( d && d.toPage && $(d.toPage).attr('id') == 'list-page' ) {
		// replace standard search in the listview filter input field
		$.mobile.listview.prototype.options.filterPlaceholder = translate['search'];
		// remove old data
		data = null;
		$('#parkings-list').empty();
		createList();
	}
});

$(document).delegate("#list-page", "pagebeforeshow", function() {
	// enhance dynamically injected items
	$('#parkings-list').listview('refresh');
});
