
function resizeMap() {
	//resize map to fit height
	var mapHeight = $(window).height()-$(".ui-header:first").outerHeight();
	$('#map-canvas').css('height', mapHeight+'px');
}

var getMarkerAt = function(position) {
	for (var i = 0; i < map.markers.length; i++) {
	  var marker = map.markers[i];
	  if (marker.position.equals(position)) {
	     return marker;
	  }
	}
};

function initMarkers(infowindow) {
	// TODO iterate over data and place markers including click handlers for infowindow
}

function buttonHandler(event) {
	var cityName = $(event.currentTarget).find('.ui-btn-text').html();
	$.each(data.cities, function(i, city) {
	  if (city.name == cityName) {
      map.panTo(new google.maps.LatLng(city.geo.lat, city.geo.lng));
      map.setZoom(14);
      return false;
	  }
	});
	// TODO set theme for clicked button to b and the others to a
}
// dynamically created dom needs to be inserted here
$(document).bind("pagebeforechange", function(e, d) {
	if ( $(d.toPage).attr('id') == 'map' ) {
		/* -- add city buttons -- */
		$("#city-labels").empty();
		$.each(data.cities, function(i, city) {
			$('<a href="#" data-role="button" data-inline="true" data-theme="a">'+city.name+'</a>')
				.click(buttonHandler)
				.appendTo("#city-labels");
		});
		// enhance dynamically injected items
		$("#map").trigger('create');
	}
});

// jquery mobile way of document ready
$(document).delegate("#map", "pageshow", function() {

	/* -- map initialization -- */
	var myOptions = {
		zoom : 14,
		center : new google.maps.LatLng(53.890582, 10.701184),
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		disableDefaultUI: true
	};
	map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);
	map.markers = [];
	var infowindow = new google.maps.InfoWindow();
	resizeMap();
	initMarkers(infowindow);
});

// does this really work for someone?
$( document ).bind( "orientationchange resize", function( event, data ){
	resizeMap();
});
