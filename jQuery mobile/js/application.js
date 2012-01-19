function resizeMap() {
	//resize map to fit height
	var mapHeight = $(window).height()-$(".ui-header:first").outerHeight();
	$('#map-canvas').css('height', mapHeight+'px');
}

$( document ).delegate("#map", "pageshow", function() {

	var myOptions = {
		zoom : 14,
		center : new google.maps.LatLng(53.890582, 10.701184),
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		disableDefaultUI: true
	};
	var map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);
	var infowindow = new google.maps.InfoWindow();
	resizeMap();
	
});

$( document ).bind( "orientationchange", function( event, data ){
	resizeMap();
});
