var translate = {
	'PH': 'Parkhaus',
	'PP': 'Parkplatz'
}

function resizeMap() {
	//resize map to fit height
	var mapHeight = $(window).height()-$(".ui-header:first").outerHeight();
	$('#map-canvas').css('height', mapHeight+'px');
	google.maps.event.trigger(map, 'resize');
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
	var handler = function() {
		var marker = getMarkerAt(position);
		infoWindow.setContent(createParkingInfoWindow(parking));
		infoWindow.open(map, marker);
		// only open this once
		$(document).unbind('mapLoaded', handler);
	};
	$(document).bind('mapLoaded', handler);
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

// prepare a marker ( place it at position, init onClick handler showing the parking info)
var addMarker = function(parking, position, infowindow) {
	var image, util, utilFrac;
	// calculate utilization and map it to one of 6 states
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
	// get icon for the parking type and utilization
	switch (parking.kind) {
		case "PP":
			image = "img/pp_u_" + util + ".png";
			break;
		case "PH":
			image = "img/ph_u_" + util + ".png";
			break;
	};
	// place marker on the map with our icon
	var marker = new google.maps.Marker({
		map: map,
		position: position,
		icon: image
	});
	marker.title = parking.name;
	// save the parking info under ``marker.parking``
	marker.parking = parking;
	// save the marker info under ``map.markers``
	map.markers.push(marker);

	//
	var evListener = function() {
		infoWindow.setContent(createParkingInfoWindow(parking));
		infoWindow.open(map, marker);
	};
	google.maps.event.addListener(marker, 'mousedown', evListener);
	google.maps.event.addListener(marker, 'click', evListener);
};

//deletes all markers from the map
function clearMarkers() {
	if ( map.markers ) {
		$.each(map.markers, function(i, marker) {
			marker.setMap(null);
		});
	} else {
		map.markers = [];
	}
}

// adds markers to the map for each parking
function initMarkers() {
    clearMarkers();
	$.each(data.parkings, function(i, parking) {
		if (typeof parking.geo !== 'undefined') {
			var position = new google.maps.LatLng(parking.geo.lat, parking.geo.lng);
			addMarker(parking, position, infoWindow);
		} else {
			log('No geo data for ' + parking.name);
		}
	});
}

// handler for clicking the buttons on top ( Lübeck | Travemünde )
function buttonHandler(event) {
	// get current city name
	var cityName = $(event.currentTarget).find('.ui-btn-text').html();
	// get the geocoordinates from the selected city and pan the map to them
	$.each(data.cities, function(i, city) {
		if (city.name == cityName) {
			map.panTo(new google.maps.LatLng(city.geo.lat, city.geo.lng));
			map.setZoom(14);
			return false;
		}
	});
	// set all buttons to not selected (theme a)
	$("#city-labels a").removeClass("ui-btn-up-b").addClass("ui-btn-up-a");
	// active button is set to theme b
	$(event.currentTarget).addClass("ui-btn-up-b");
}

function init() {
	// add city buttons
	$("#city-labels").empty();
	$.each(data.cities, function(i, city) {
		$('<a href="#" data-role="button" data-inline="true" data-theme="a">'+city.name+'</a>')
			.click(buttonHandler)
			.appendTo("#city-labels");
	});
	// enhance dynamically injected items
	$("#map").trigger('create');
}

// before changing the page insert dynamically created dom elements
$(document).bind("pagebeforechange", function(e, d) {
	// if we are about to switch to the map view
	if ( $(d.toPage).attr('id') == 'map' ) {
        if ( data === undefined )
			updateData(function (mydata){
                data = mydata;
                init();
            });
        else{
               data = undefined;
        }

	}
});

// when the page is ready and contains #map item
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

	if ( data === undefined ) {
		updateData( function(d) {
			data = d;
			initMarkers();
			$("#city-labels a:first").trigger('click');
		});
	} else {
		initMarkers();
		$("#city-labels a:first").trigger('click');
	}
	
	// triggerHandler is a lightweight equivalent to trigger
	// without the resize event, the map stays grey
	resizeMap();
	$(document).trigger('mapLoaded');
});

// when screen size changes reize the map
$( document ).bind( "orientationchange resize pageload", function(){
	resizeMap();
});
