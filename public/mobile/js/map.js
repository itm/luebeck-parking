var translate = {
	'PH': 'Parkhaus',
	'PP': 'Parkplatz'
}

function resizeMap() {
	//resize map to fit height
	var mapHeight = $(window).height()-$(".ui-header:first").outerHeight();
	$('#map-canvas').css('height', mapHeight+'px');
}

function getMarkerAt(position) {
	for (var i = 0; i < map.markers.length; i++) {
		var marker = map.markers[i];
		if (marker.position.equals(position)) {
			return marker;
		}
	}
}

function showInfoOnLoad(parking) {
	var position = new google.maps.LatLng(parking.geo.lat, parking.geo.lng);
	$(document).bind('mapLoaded', function() {
		var marker = getMarkerAt(position);
		infoWindow.setContent(createParkingInfoWindow(parking));
		infoWindow.open(map, map.markers[0]);
	});
}

function createParkingInfoWindow(parking) {
	var occupation = calculateOccupation(parking);
	var info;
	if (parking.status == "open") {
		info = "<small><b>"
					+ parking.free + " von " + parking.spaces
					+ " frei</small></b> <br/>"
					+ "<div class=\"free\"><div class=\"occupied\" style=\"width: "
					+ occupation
					+ "%;\"></div></div>";
	} else {
		info = "geschlossen";
	}

	return "<div class=\"parkingInfoWindow\">"
				+ "<b>" + parking.name + "</b><small> (" + translate[parking.kind] + ")</small>"
				+ "<br/>"
				+ info
				+ "</div>"
}

var addMarker = function(parking, position, infowindow) {
	var image, util, utilFrac;

	if (parking.spaces == 0 || parking.status != "open") {
		util = "100";
	} else {
		utilFrac = parking.free / parking.spaces;
		if (utilFrac == 0)
			util = "100";
		else if (utilFrac < 0.2)
			util = "80";
		else if (utilFrac < 0.5)
			util = "60";
		else if (utilFrac < 0.6)
			util = "40";
		else if (utilFrac < 0.8)
			util = "20";
		else
			util = "0";
	};

	switch (parking.kind) {
		case "PP":
			image = "img/pp_u_" + util + ".png";
			break;
		case "PH":
			image = "img/ph_u_" + util + ".png";
			break;
	};

	var marker = new google.maps.Marker({
		map: map,
		position: position,
		icon: image
	});
	marker.title = parking.name;
	marker.parking = parking;

	var evListener = function() {
		infoWindow.setContent(createParkingInfoWindow(parking));
		infoWindow.open(map, marker);
	};
	map.markers.push(marker);
	google.maps.event.addListener(marker, 'mousedown', evListener);
	google.maps.event.addListener(marker, 'click', evListener);
};

function clearMarkers() {
	if ( map.markers ) {
		$.each(map.markers, function(i, marker) {
			marker.setMap(null);
		});
	} else {
		map.markers = [];
	}
}

function initMarkers() {
	$.each(data.parkings, function(i, parking) {
		if (typeof parking.geo !== 'undefined') {
			var position = new google.maps.LatLng(parking.geo.lat, parking.geo.lng);
			addMarker(parking, position, infoWindow);
		} else {
			log('No geo data for ' + parking.name);
		}
	});
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
	$("#city-labels a").removeClass("ui-btn-up-b").addClass("ui-btn-up-a");
	$(event.currentTarget).addClass("ui-btn-up-b");
}

// dynamically created dom will be inserted here
$(document).bind("pagebeforechange", function(e, d) {
	// if we are about to switch to the map view
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

// if the page is ready and containing #map item
$(document).delegate("#map", "pageshow", function() {
	/* -- map initialization -- */
	var myOptions = {
		zoom : 14,
		center : new google.maps.LatLng(53.867814, 10.687208),
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		disableDefaultUI: true
	};
	map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);
	map.markers = [];
	infoWindow = new google.maps.InfoWindow();
	initMarkers();
	$("#city-labels a:first").trigger('click');
	// triggerHandler is a lightweight equivalent to trigger
	$(document).trigger('mapLoaded');
});

// if screen size changes reize the map
$( document ).bind( "orientationchange resize pageload", function(){
	resizeMap();
});
