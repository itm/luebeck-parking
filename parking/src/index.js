new Ext.Application({
    launch: function() {

        var lübeck = new google.maps.LatLng(53.867814, 10.687208); // default
        var map = new Ext.Map({
            title: 'Map',
            getLocation: true,
            mapOptions: {
                center: lübeck,
                zoom: 13
            }
        });

        var bar = new Ext.TabBar({
            dock : 'top',
            ui   : 'dark',
            items: [
                {text: 'Start'} // this is a hack to make the tab-bar render properly
            ]
        });

        var pnlMap = new Ext.Panel({
            dockedItems: [bar],
            fullscreen : true,
            items      : [map]
        });

        var tabButtonHandler = function(button, event) {
            ln = data.cities.length;
            for (var i = 0; i < ln; i++) {
                if (data.cities[i].name == button.id) {
                    map.map.panTo(new google.maps.LatLng(data.cities[i].lat, data.cities[i].lng));
                    break;
                }
            }
        };

        var createParkingInfoWindow = function(parking) {
            return "<div class=\"parkingInfoWindow\">"
                    + "<b>" + parking.name + "</b> (" + parking.kind + ")</b>"
                    + "<br/>"
                    + "<b>Pl&auml;tze:</b> "
                    + parking.spaces
                    + "</div>"
        };

        var loadData = function() {
            bar.removeAll();  // belongs to the hack above
            // Add points to the map
            for (var i = 0, lni = data.cities.length; i < lni; i++) {
                var city = data.cities[i];
                bar.add({
                    text: city.name,
                    id  : city.name,
                    handler: tabButtonHandler
                });
                bar.doLayout();
                for (var j = 0, lnj = city.parkings.length; j < lnj; j++) {
                    var parking = city.parkings[j];
                    var position = new google.maps.LatLng(parking.lat, parking.lng);
                    addMarker(parking, position);
                }
                city = null;
            }
        };

        // These are all Google Maps APIs
        var addMarker = function(parking, position) {
            var marker = new google.maps.Marker({
                map: map.map,
                position: position
            });
            marker.title = parking.name;
            var infoWindow = new google.maps.InfoWindow({
                content: createParkingInfoWindow(parking)
            });
            google.maps.event.addListener(marker, 'click', function() {
                infoWindow.open(map.map, marker);
            });
        };

        loadData();
    }
});

