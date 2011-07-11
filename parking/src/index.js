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
            Ext.each(data.cities, function(city) {
                if (city.name == button.id) {
                    map.map.panTo(new google.maps.LatLng(city.lat, city.lng));
                    return false;
                }
            });
        };
        
        // for debugging while there's no api
        var getOccupation = function(parking) {
            var occupied = Math.floor(Math.random() * (parking.spaces+1));
            return Math.floor(100 * (occupied / parking.spaces))
        };

        var createParkingInfoWindow = function(parking) {
            var occupation = getOccupation(parking);
            return "<div class=\"parkingInfoWindow\">"
                    + "<b>" + parking.name + "</b> (" + parking.kind + ")</b>"
                    + "<br/>"
                    + "<b>Auslastung</b> "
                    + "<br/>"
                    + occupation + " / " + parking.spaces
                    + "<br/>"
                    + "<div class=\"free\"><div class=\"occupied\" style=\"width: "
                    + occupation
                    + "%;\"></div></div>"
                    + "</div>"
        };
        

        var loadData = function() {
            bar.removeAll();  // belongs to the hack above
            // Add points to the map
            Ext.each( data.cities, function(city) {
                bar.add({
                    text: city.name,
                    id  : city.name,
                    handler: tabButtonHandler
                });
                bar.doLayout();
                Ext.each( city.parkings, function(parking) {
                    var position = new google.maps.LatLng(parking.lat, parking.lng);
                    addMarker(parking, position);
                });
                city = null;
            });
        };

        // These are all Google Maps APIs
        var addMarker = function(parking, position) {
            var image;
            switch (parking.kind) {
                case "Parkplatz":
                    image = "images/parking.png"
                    break;
                case "Parkhaus":
                    image = "images/parking.png"
                    break;
            };
            
            var marker = new google.maps.Marker({
                map: map.map,
                position: position,
                icon: image
            });
            marker.title = parking.name;
            var infoWindow = new google.maps.InfoWindow({
                content: createParkingInfoWindow(parking)
            });
            // Sencha Touch has problems with the maps handlers...
            // click wont work on mobile devices
            // see http://www.sencha.com/forum/showthread.php?117876-OPEN-642-map-on-1.0.1-not-responding-to-click-events-on-iPhone-Android/
            google.maps.event.addListener(marker, 'mousedown', function() {
                infoWindow.open(map.map, marker);
            });
        };

        loadData();
    }
});

