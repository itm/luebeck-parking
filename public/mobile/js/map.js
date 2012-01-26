
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

function createParkingInfoWindow(parking) {
  var occupation = getOccupation(parking);
  var info;
  if (parking.status == "open") {
    info = "<b>Belegung</b> "
            + "<br/>"
            + (parking.spaces-parking.free) + " von " + parking.spaces
            + "<br/>"
            + "<div class=\"free\"><div class=\"occupied\" style=\"width: "
            + occupation
            + "%;\"></div></div>";
  } else {
    info = "vorrübergehend geschlossen";
  }

  return "<div class=\"parkingInfoWindow\">"
          + "<b>" + parking.name + "</b> (" + parking.kind + ")</b>"
          + "<br/>"
          + info
          + "</div>"
}

var addMarker = function(parking, position, infowindow) {
  var image;
  switch (parking.kind) {
    case "PP":
      image = "images/parking.png"
      break;
    case "PH":
      image = "images/parking.png"
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
      infowindow.setContent(createParkingInfoWindow(parking));
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
	infoWindow = new google.maps.InfoWindow();
	initMarkers();
});

$( document ).bind( "orientationchange resize pageload", function(){
	resizeMap();
});
