
function createList() {
	if (typeof data === "undefined" || data === null) return;
	var parkings = data.parkings;
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
		// click handler
		$('#parkings-list a:last').bind('click', function() {
			showInfoOnLoad(parking);
			$.mobile.changePage('map.html');
		});
	});
}

// dynamically created dom needs to be inserted here
$(document).bind("pagebeforechange", function(e, d) {
	if ( d && d.toPage && $(d.toPage).attr('id') == 'list-page' ) {
		$('#parkings-list').empty();
		createList();
	}
});

$(document).delegate("#list-page", "pagebeforeshow", function() {
	// enhance dynamically injected items
	$('#parkings-list').listview('refresh');
});
